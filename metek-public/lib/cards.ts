import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { cards, owners } from "@/db/schema";
import type { VCard } from "@/shared/schema";
export class CardError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const securityHeaders = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
};
export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: securityHeaders });
}
export function serialize(row: typeof cards.$inferSelect, origin: string): VCard {
  const base = String((env as unknown as Record<string, unknown>).PUBLIC_BASE_URL || origin).replace(/\/$/, "");
  return { ...JSON.parse(row.data), id: row.id, userId: row.userId, publicToken: row.publicToken,
    publicUrl: `${base}/v/${row.publicToken}`, status: row.status, createdAt: row.createdAt, updatedAt: row.updatedAt };
}
export async function publicCard(token: string, origin: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new CardError(404, "Kartvizit bulunamadı.");
  const [result] = await getDb().select({ card: cards, ownerStatus: owners.status }).from(cards)
    .innerJoin(owners, eq(cards.userId, owners.id)).where(eq(cards.publicToken, token)).limit(1);
  if (!result || result.ownerStatus !== "ACTIVE") throw new CardError(404, "Kartvizit bulunamadı.");
  const card = serialize(result.card, origin);
  if (card.visibility !== "PUBLIC") throw new CardError(404, "Kartvizit bulunamadı.");
  if (card.status !== "ACTIVE") throw new CardError(410, "Bu kartvizit artık aktif değildir.");
  return card;
}
export const html = (v: string) => v.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]!);
export function page(content: string, title = "METEK HERO vCard", status = 200) {
  return new Response(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${html(title)}</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f5f2;color:#222;font:16px/1.5 Arial,sans-serif}main{max-width:460px;margin:48px auto;padding:32px;background:white;border:1px solid #e3e6de;border-radius:24px}.brand{font-size:14px;font-weight:700;letter-spacing:2px}.avatar{margin-top:36px;width:56px;height:56px;display:grid;place-items:center;border-radius:18px;background:#e8f0dd;color:#40572e;font-size:22px;font-weight:700}h1{font-size:32px;line-height:1.2;margin:22px 0 8px;letter-spacing:-.7px}p{color:#62675f}dl{margin:28px 0}dt{font-size:12px;color:#686e65;margin-top:20px}dd{margin:6px 0;overflow-wrap:anywhere}dd a{color:#222;text-underline-offset:4px}.save{display:block;background:#222;color:white;text-align:center;padding:18px;border-radius:14px;text-decoration:none;font-weight:600}.foot{font-size:12px;text-align:center;margin:18px 0 0;color:#73796d}@media(max-width:520px){main{margin:16px;padding:28px}}</style></head><body><main><div class="brand">METEK HERO vCard</div>${content}</main></body></html>`, {status, headers:{...securityHeaders, "Content-Type":"text/html; charset=utf-8"}});
}
export function cardPage(card: VCard) {
  const fields: [string, string, string?][] = [
    ["Telefon", card.phone, card.phone ? `tel:${card.phone.replace(/[^+\d]/g, "")}` : undefined],
    ["Cep telefonu", card.mobilePhone, card.mobilePhone ? `tel:${card.mobilePhone.replace(/[^+\d]/g, "")}` : undefined],
    ["E-posta", card.email, card.email ? `mailto:${card.email}` : undefined],
    ["Adres", card.address], ["Web sitesi", card.website, card.website],
    ["Departman", card.department], ["Doğum tarihi", card.birthDate],
  ];
  return page(`<div class="avatar">${html(card.firstName[0] + card.lastName[0])}</div><h1>${html(card.firstName)} ${html(card.lastName)}</h1><p>${html([card.title, card.company].filter(Boolean).join(" · "))}</p><dl>${fields.filter(([,v])=>v).map(([label,value,href])=>`<dt>${html(label)}</dt><dd>${href ? `<a href="${html(href)}" rel="noreferrer">${html(value)}</a>` : html(value)}</dd>`).join("")}</dl><a class="save" href="/v/${card.publicToken}/file">Rehbere Ekle</a><p class="foot">İletişim bilgilerini telefonunuza kaydedin.</p>`, `${card.firstName} ${card.lastName} · METEK HERO vCard`);
}
export function errorPage(error: unknown) {
  const known = error instanceof CardError;
  return page(`<h1>${known && error.status === 410 ? "Kartvizit pasif" : "Kartvizit açılamadı"}</h1><p>${known ? html(error.message) : "Lütfen biraz sonra tekrar deneyiniz."}</p>`, "METEK HERO vCard", known ? error.status : 503);
}
