import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../server/app";
import { cardSchema, emptyCard } from "../shared/schema";
import { createVcf, foldLine } from "../shared/vcard";

test("UTF-8 vCard preserves Turkish text, escapes injection and folds at 75 octets", () => {
  const source = {
    ...emptyCard,
    firstName: "Çağrı",
    lastName: "Şen",
    company: "METEK; Teknoloji, AŞ",
    address: "İstanbul\nTürkiye",
    title: "Ğ".repeat(120),
  };
  const vcf = createVcf(source);
  assert.ok(vcf.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n"));
  assert.ok(vcf.includes("N:Şen;Çağrı;;;"));
  assert.ok(vcf.includes("ORG:METEK\\; Teknoloji\\, AŞ;"));
  assert.ok(vcf.includes("İstanbul\\nTürkiye"));
  for (const line of vcf.split("\r\n"))
    assert.ok(Buffer.byteLength(line, "utf8") <= 75);
  assert.equal(
    foldLine("Ğ".repeat(120)).replace(/\r\n /g, ""),
    "Ğ".repeat(120),
  );
  assert.equal(
    createVcf({ ...source, firstName: "A\nEND:VCARD\nBEGIN:VCARD" })
      .split("\r\n")
      .filter((x) => x === "END:VCARD").length,
    1,
  );
});
test("validation rejects impossible date, unsafe URL and malformed phone", () => {
  const base = { ...emptyCard, firstName: "Ayşe", lastName: "Yılmaz" };
  assert.equal(
    cardSchema.safeParse({ ...base, birthDate: "2024-02-30" }).success,
    false,
  );
  assert.equal(
    cardSchema.safeParse({ ...base, website: "javascript:alert(1)" }).success,
    false,
  );
  assert.equal(
    cardSchema.safeParse({ ...base, phone: "abc1234567" }).success,
    false,
  );
  assert.equal(
    cardSchema.safeParse({ ...base, birthDate: "2000-02-29" }).success,
    true,
  );
});
test("real API enforces authentication, ownership, public state, logout and persistence", async () => {
  const { app, db } = createApp({
    databasePath: ":memory:",
    publicBaseUrl: "https://cards.example.test",
    origins: ["http://localhost:8081"],
  });
  const api = request(app);
  try {
    await api.get("/vcards").expect(401);
    await api
      .post("/auth/register")
      .send({
        firstName: "Ayşe",
        lastName: "Yılmaz",
        email: "ayse@example.test",
        password: "weak",
      })
      .expect(400);
    const a = await api
      .post("/auth/register")
      .send({
        firstName: "Ayşe",
        lastName: "Yılmaz",
        email: "ayse@example.test",
        password: "TestPass123",
        role: "ADMIN",
      })
      .expect(201);
    assert.equal(a.body.user.role, "USER");
    assert.equal(a.body.user.emailVerified, false);
    assert.match(a.headers["set-cookie"][0], /HttpOnly/);
    const b = await api
      .post("/auth/register")
      .send({
        firstName: "Barış",
        lastName: "Şen",
        email: "baris@example.test",
        password: "TestPass123",
      })
      .expect(201);
    const authA = { Authorization: `Bearer ${a.body.token}` },
      authB = { Authorization: `Bearer ${b.body.token}` };
    await api
      .post("/auth/login")
      .send({ email: "ayse@example.test", password: "WrongPass123" })
      .expect(401);
    const login = await api
      .post("/auth/login")
      .send({ email: "ayse@example.test", password: "TestPass123" })
      .expect(200);
    await api
      .get("/users/me")
      .set("Cookie", login.headers["set-cookie"])
      .expect(200);
    const payload = {
      ...emptyCard,
      firstName: "Çağrı",
      lastName: "Şen",
      visibility: "PUBLIC",
      company: "<script>alert(1)</script>",
      birthDate: "1990-05-21",
      website: "www.example.test/iletisim",
    };
    const card = await api.post("/vcards").set(authA).send(payload).expect(201);
    assert.match(card.body.publicToken, /^[a-f0-9]{64}$/);
    assert.equal(card.body.website, "https://www.example.test/iletisim");
    assert.equal(card.body.publicUrl.includes("Çağrı"), false);
    const id = card.body.id,
      token = card.body.publicToken;
    const listB = await api.get("/vcards").set(authB).expect(200);
    assert.equal(listB.body.length, 0);
    await api.get(`/vcards/${id}`).set(authB).expect(404);
    await api.put(`/vcards/${id}`).set(authB).send(payload).expect(404);
    await api.delete(`/vcards/${id}`).set(authB).expect(404);
    await api
      .patch(`/vcards/${id}/status`)
      .set(authB)
      .send({ status: "PASSIVE" })
      .expect(404);
    await api
      .post("/nfc/writes")
      .set(authB)
      .send({ cardId: id, verified: true })
      .expect(404);
    const publicView = await api.get(`/public/vcards/${token}`).expect(200);
    assert.equal(publicView.body.userId, undefined);
    const page = await api.get(`/v/${token}`).expect(200);
    assert.ok(!page.text.includes("<script>"));
    assert.ok(page.text.includes("&lt;script&gt;"));
    const file = await api.get(`/v/${token}/file`).expect(200);
    assert.match(file.headers["content-type"], /text\/vcard/);
    assert.ok(file.text.includes("Çağrı"));
    assert.ok(file.text.includes("URL:https://www.example.test/iletisim"));
    await api
      .patch(`/vcards/${id}/status`)
      .set(authA)
      .send({ status: "PASSIVE" })
      .expect(200);
    await api.get(`/v/${token}`).expect(410);
    await api.get(`/v/${token}/file`).expect(410);
    await api
      .patch(`/vcards/${id}/status`)
      .set(authA)
      .send({ status: "ACTIVE" })
      .expect(200);
    await api
      .put(`/vcards/${id}`)
      .set(authA)
      .send({ ...payload, visibility: "PRIVATE" })
      .expect(200);
    await api.get(`/public/vcards/${token}`).expect(404);
    await api
      .put(`/vcards/${id}`)
      .set(authA)
      .send({ ...payload, title: "Mühendis" })
      .expect(200);
    const updated = await api.get(`/vcards/${id}`).set(authA).expect(200);
    assert.equal(updated.body.title, "Mühendis");
    assert.equal(updated.body.publicToken, token);
    db.prepare("UPDATE users SET status='PASSIVE' WHERE id=?").run(
      a.body.user.id,
    );
    await api.get("/vcards").set(authA).expect(401);
    await api.get(`/v/${token}`).expect(404);
    db.prepare("UPDATE users SET status='ACTIVE' WHERE id=?").run(
      a.body.user.id,
    );
    await api
      .post("/vcards")
      .set(authA)
      .set("Origin", "https://evil.example")
      .send(payload)
      .expect(403);
    await api.delete(`/vcards/${id}`).set(authA).expect(204);
    await api.get(`/v/${token}`).expect(404);
    await api.post("/auth/logout").set(authA).expect(204);
    await api.get("/users/me").set(authA).expect(401);
    const stored = db
      .prepare("SELECT password_hash FROM users WHERE id=?")
      .get(a.body.user.id)!;
    assert.notEqual(stored.password_hash, "TestPass123");
    const logs = JSON.stringify(db.prepare("SELECT * FROM audit_logs").all());
    assert.ok(!logs.includes("TestPass123"));
    assert.ok(!logs.includes("ayse@example"));
  } finally {
    db.close();
  }
});
