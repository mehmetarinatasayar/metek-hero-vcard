import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import {
  randomBytes,
  randomUUID,
  createHash,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { z, ZodError } from "zod";
import { openDatabase } from "./database";
import {
  cardSchema,
  loginSchema,
  registerSchema,
  type CardInput,
  type User,
  type VCard,
} from "../shared/schema";
import { createVcf } from "../shared/vcard";
import { remoteCards, type RemoteCardsConfig } from "./remoteCards";

const derive = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(
      password,
      salt,
      64,
      { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
type UserRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role: User["role"];
  status: User["status"];
  email_verified: number;
};
type CardRow = {
  id: string;
  user_id: string;
  public_token: string;
  data: string;
  status: VCard["status"];
  created_at: string;
  updated_at: string;
};
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const sha = (v: string) => createHash("sha256").update(v).digest("hex");
const safeUser = (u: UserRow): User => ({
  id: u.id,
  firstName: u.first_name,
  lastName: u.last_name,
  email: u.email,
  role: u.role,
  status: u.status,
  emailVerified: !!u.email_verified,
});
const html = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

export function createApp(options: {
  databasePath: string;
  publicBaseUrl: string;
  origins: string[];
  production?: boolean;
  trustProxy?: boolean;
  remoteCards?: RemoteCardsConfig;
}) {
  const db = openDatabase(options.databasePath);
  const app = express();
  const base = options.publicBaseUrl.replace(/\/$/, "");
  if (
    options.production &&
    (!base.startsWith("https://") ||
      options.origins.some((o) => !o.startsWith("https://")))
  )
    throw new Error("Üretimde HTTPS adresleri zorunludur.");
  if (options.trustProxy) app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'none'"],
          "style-src": ["'unsafe-inline'"],
          "base-uri": ["'none'"],
          "frame-ancestors": ["'none'"],
        },
      },
    }),
  );
  app.use((req, res, next) => {
    if (options.production && !req.secure)
      return res.status(400).json({ message: "Güvenli bağlantı gereklidir." });
    next();
  });
  app.use(cors({ origin: options.origins, credentials: true }));
  app.use((req, res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin &&
      !options.origins.includes(req.headers.origin)
    )
      return res.status(403).json({ message: "Bu kaynaktan işlem yapılamaz." });
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use(express.json({ limit: "32kb" }));
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 180,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        message:
          "Çok fazla istek gönderildi. Bir dakika sonra tekrar deneyiniz.",
      },
    }),
  );
  app.use(
    "/auth",
    rateLimit({
      windowMs: 15 * 60_000,
      limit: 30,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        message:
          "Çok fazla giriş denemesi yapıldı. Daha sonra tekrar deneyiniz.",
      },
    }),
  );
  function audit(
    actor: string | null,
    action: string,
    target: string | null = null,
  ) {
    db.prepare("INSERT INTO audit_logs VALUES(?,?,?,?,?)").run(
      randomUUID(),
      actor,
      action,
      target,
      new Date().toISOString(),
    );
  }
  function sessionToken(req: Request) {
    const bearer = req.headers.authorization?.match(
      /^Bearer ([a-f0-9]{64})$/,
    )?.[1];
    const cookie = req.headers.cookie
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("metek_session="))
      ?.slice(14);
    return (
      bearer || (cookie && /^[a-f0-9]{64}$/.test(cookie) ? cookie : undefined)
    );
  }
  function auth(req: Request, res: Response, next: NextFunction) {
    const token = sessionToken(req);
    const user = token
      ? (db
          .prepare(
            "SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>? AND u.status=?",
          )
          .get(sha(token), Date.now(), "ACTIVE") as UserRow | undefined)
      : undefined;
    if (!user)
      return res
        .status(401)
        .json({
          message: "Oturumunuz sona erdi. Lütfen tekrar giriş yapınız.",
        });
    res.locals.user = user;
    next();
  }
  function makeSession(user: UserRow, res: Response) {
    const token = randomBytes(32).toString("hex");
    const age = 7 * 86400_000;
    db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
    db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
      sha(token),
      user.id,
      Date.now() + age,
    );
    res.cookie("metek_session", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: !!options.production,
      path: "/",
      maxAge: age,
    });
    return { token, user: safeUser(user) };
  }
  function serialize(row: CardRow): VCard {
    return {
      ...(JSON.parse(row.data) as CardInput),
      id: row.id,
      userId: row.user_id,
      publicToken: row.public_token,
      publicUrl: `${base}/v/${row.public_token}`,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  function owned(id: string, user: UserRow): CardRow {
    const row = db.prepare("SELECT * FROM vcards WHERE id=?").get(id) as
      | CardRow
      | undefined;
    if (!row || (row.user_id !== user.id && user.role !== "ADMIN"))
      throw new HttpError(404, "vCard bulunamadı.");
    return row;
  }
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.post("/auth/register", async (req, res) => {
    const body = registerSchema.parse(req.body);
    if (db.prepare("SELECT id FROM users WHERE email=?").get(body.email))
      throw new HttpError(
        409,
        "Bu e-posta ile hesap oluşturulamıyor. Giriş yapmayı deneyiniz.",
      );
    const salt = randomBytes(16).toString("hex");
    const hash = await derive(body.password, salt);
    const id = randomUUID(),
      now = new Date().toISOString();
    try {
      db.prepare(
        "INSERT INTO users(id,first_name,last_name,email,password_hash,created_at,updated_at) VALUES(?,?,?,?,?,?,?)",
      ).run(
        id,
        body.firstName,
        body.lastName,
        body.email,
        `${salt}:${hash.toString("hex")}`,
        now,
        now,
      );
    } catch (e) {
      if (db.prepare("SELECT id FROM users WHERE email=?").get(body.email))
        throw new HttpError(409, "Bu e-posta ile hesap oluşturulamıyor.");
      throw e;
    }
    const user = db
      .prepare("SELECT * FROM users WHERE id=?")
      .get(id) as UserRow;
    audit(id, "REGISTER", id);
    res.status(201).json(makeSession(user, res));
  });
  app.post("/auth/login", async (req, res) => {
    const body = loginSchema.parse(req.body);
    const user = db
      .prepare("SELECT * FROM users WHERE email=?")
      .get(body.email) as UserRow | undefined;
    const [salt, expected] = user?.password_hash.split(":") ?? [
      "00000000000000000000000000000000",
      "00".repeat(64),
    ];
    const actual = await derive(body.password, salt!);
    if (
      !timingSafeEqual(actual, Buffer.from(expected!, "hex")) ||
      !user ||
      user.status !== "ACTIVE"
    )
      throw new HttpError(401, "E-posta veya şifre hatalı.");
    audit(user.id, "LOGIN");
    res.json(makeSession(user, res));
  });
  app.post("/auth/logout", auth, (req, res) => {
    db.prepare("DELETE FROM sessions WHERE token_hash=?").run(
      sha(sessionToken(req)!),
    );
    audit(res.locals.user.id, "LOGOUT");
    res.clearCookie("metek_session", {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: !!options.production,
    });
    res.status(204).end();
  });
  app.get("/users/me", auth, (_req, res) =>
    res.json(safeUser(res.locals.user)),
  );
  if (options.remoteCards) {
    const handle = remoteCards(options.remoteCards, audit);
    app.use((req, res, next) => {
      if (req.path === "/vcards" || req.path.startsWith("/vcards/") || req.path === "/nfc/writes")
        return auth(req, res, () => void handle(req, res, next));
      // Old local routes also read the cloud service once migration is enabled.
      if (req.path.startsWith("/v/") || req.path.startsWith("/public/vcards/")) return res.redirect(307, `${base}${req.path}`);
      next();
    });
  }
  app.get("/vcards", auth, (_req, res) => {
    const rows = db
      .prepare("SELECT * FROM vcards WHERE user_id=? ORDER BY created_at DESC")
      .all(res.locals.user.id) as CardRow[];
    res.json(rows.map(serialize));
  });
  app.post("/vcards", auth, (req, res) => {
    const input = cardSchema.parse(req.body),
      id = randomUUID(),
      now = new Date().toISOString();
    db.prepare("INSERT INTO vcards VALUES(?,?,?,?,?,?,?)").run(
      id,
      res.locals.user.id,
      randomBytes(32).toString("hex"),
      JSON.stringify(input),
      "ACTIVE",
      now,
      now,
    );
    audit(res.locals.user.id, "VCARD_CREATE", id);
    res.status(201).json(serialize(owned(id, res.locals.user)));
  });
  app.get("/vcards/:id", auth, (req, res) =>
    res.json(serialize(owned(req.params.id as string, res.locals.user))),
  );
  app.put("/vcards/:id", auth, (req, res) => {
    const row = owned(req.params.id as string, res.locals.user),
      input = cardSchema.parse(req.body);
    db.prepare("UPDATE vcards SET data=?,updated_at=? WHERE id=?").run(
      JSON.stringify(input),
      new Date().toISOString(),
      row.id,
    );
    audit(res.locals.user.id, "VCARD_UPDATE", row.id);
    res.json(serialize(owned(row.id, res.locals.user)));
  });
  app.patch("/vcards/:id/status", auth, (req, res) => {
    const row = owned(req.params.id as string, res.locals.user),
      { status } = z
        .object({ status: z.enum(["ACTIVE", "PASSIVE"]) })
        .parse(req.body);
    db.prepare("UPDATE vcards SET status=?,updated_at=? WHERE id=?").run(
      status,
      new Date().toISOString(),
      row.id,
    );
    audit(res.locals.user.id, `VCARD_${status}`, row.id);
    res.json(serialize(owned(row.id, res.locals.user)));
  });
  app.delete("/vcards/:id", auth, (req, res) => {
    const row = owned(req.params.id as string, res.locals.user);
    db.prepare("DELETE FROM vcards WHERE id=?").run(row.id);
    audit(res.locals.user.id, "VCARD_DELETE", row.id);
    res.status(204).end();
  });
  app.get("/vcards/:id/file", auth, (req, res) => {
    const card = serialize(owned(req.params.id as string, res.locals.user));
    res
      .attachment("contact.vcf")
      .type("text/vcard; charset=utf-8")
      .send(createVcf(card));
  });
  app.post("/nfc/writes", auth, (req, res) => {
    const body = z
      .object({ cardId: z.string().uuid(), verified: z.boolean() })
      .parse(req.body);
    owned(body.cardId, res.locals.user);
    audit(
      res.locals.user.id,
      body.verified
        ? "NFC_CLIENT_REPORTED_VERIFIED"
        : "NFC_CLIENT_REPORTED_WRITE",
      body.cardId,
    );
    res.status(204).end();
  });
  function publicCard(token: string) {
    const row = db
      .prepare(
        "SELECT v.* FROM vcards v JOIN users u ON u.id=v.user_id WHERE v.public_token=? AND u.status='ACTIVE'",
      )
      .get(token) as CardRow | undefined;
    if (!row) throw new HttpError(404, "vCard bulunamadı.");
    const card = serialize(row);
    if (card.visibility !== "PUBLIC")
      throw new HttpError(404, "vCard bulunamadı.");
    if (card.status !== "ACTIVE")
      throw new HttpError(410, "Bu vCard artık aktif değildir.");
    return card;
  }
  app.get("/public/vcards/:token", (req, res) => {
    const c = publicCard(req.params.token as string);
    const {
      id: _id,
      userId: _owner,
      publicToken: _token,
      createdAt: _created,
      updatedAt: _updated,
      ...data
    } = c;
    res.json(data);
  });
  app.get("/v/:token/file", (req, res) => {
    const c = publicCard(req.params.token as string);
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    res
      .attachment("contact.vcf")
      .type("text/vcard; charset=utf-8")
      .send(createVcf(c));
  });
  app.get("/v/:token", (req, res) => {
    const c = publicCard(req.params.token as string);
    const fields = [
      ["Telefon", c.phone],
      ["Cep telefonu", c.mobilePhone],
      ["E-posta", c.email],
      ["Adres", c.address],
      ["Web sitesi", c.website],
      ["Departman", c.department],
      ["Doğum tarihi", c.birthDate],
    ].filter(([, v]) => v);
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    res
      .type("html")
      .send(
        `<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${html(c.firstName)} ${html(c.lastName)} · METEK HERO vCard</title><style>body{margin:0;background:#f4f5f2;color:#222;font:16px system-ui}main{max-width:440px;margin:48px auto;padding:32px;background:white;border-radius:24px}small{letter-spacing:2px}h1{font-size:32px;margin-bottom:8px}p{color:#62675f}dl{margin:32px 0}dt{font-size:12px;color:#686e65;margin-top:20px}dd{margin:6px 0;overflow-wrap:anywhere}a{display:block;background:#222;color:white;text-align:center;padding:18px;border-radius:14px;text-decoration:none}@media(max-width:520px){main{margin:16px;padding:28px}}</style><main><small>METEK HERO vCard</small><h1>${html(c.firstName)} ${html(c.lastName)}</h1><p>${html(c.title)}${c.title && c.company ? " · " : ""}${html(c.company)}</p><dl>${fields.map(([k, v]) => `<dt>${html(k!)}</dt><dd>${html(v!)}</dd>`).join("")}</dl><a href="/v/${c.publicToken}/file">Rehbere Ekle</a></main></html>`,
      );
  });
  app.use((_req, res) =>
    res.status(404).json({ message: "İstenen sayfa bulunamadı." }),
  );
  app.use(
    (error: unknown, req: Request, res: Response, _next: NextFunction) => {
      const status =
        error instanceof HttpError
          ? error.status
          : error instanceof ZodError || error instanceof SyntaxError
            ? 400
            : 500;
      const message =
        error instanceof HttpError
          ? error.message
          : error instanceof ZodError
            ? (error.issues[0]?.message ?? "Bilgileri kontrol ediniz.")
            : status === 400
              ? "İstek bilgileri geçersiz."
              : "İşlem tamamlanamadı. Lütfen tekrar deneyiniz.";
      if (req.path.startsWith("/v/"))
        return res
          .status(status)
          .type("html")
          .send(
            `<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>METEK HERO vCard</title><body><h1>METEK HERO vCard</h1><p>${html(message)}</p></body></html>`,
          );
      res.status(status).json({ message });
    },
  );
  return { app, db };
}
