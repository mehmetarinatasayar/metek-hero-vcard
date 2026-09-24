import { env } from "cloudflare:workers";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { cards, owners } from "@/db/schema";
import { cardSchema } from "@/shared/schema";
import { createVcf } from "@/shared/vcard";
import { CardError, json, securityHeaders, serialize } from "@/lib/cards";

const state = z.enum(["ACTIVE", "PASSIVE"]);
const ownerSchema = z.object({id: z.string().uuid(), status: state});
const importedCard = z.object({ id: z.string().uuid(), userId: z.string().uuid(),
  publicToken: z.string().regex(/^[a-f0-9]{64}$/), data: cardSchema,
  status: state, createdAt: z.string().datetime(), updatedAt: z.string().datetime(), });
const command = z.discriminatedUnion("action", [
  z.object({ action: z.literal("import"), owners: z.array(ownerSchema).max(25), cards: z.array(importedCard).max(25) }),
  z.object({ action: z.literal("list") }),
  z.object({ action: z.literal("get"), id: z.string().uuid() }),
  z.object({ action: z.literal("file"), id: z.string().uuid() }),
  z.object({ action: z.literal("create"), input: cardSchema }),
  z.object({ action: z.literal("update"), id: z.string().uuid(), input: cardSchema }),
  z.object({ action: z.literal("status"), id: z.string().uuid(), status: state }),
  z.object({ action: z.literal("delete"), id: z.string().uuid() }),
  z.object({ action: z.literal("owner-status"), owner: ownerSchema }),
]);
async function authorized(request: Request) {
  const secret = (env as unknown as Record<string, unknown>).METEK_SERVICE_KEY;
  if (typeof secret !== "string" || secret.length < 64) return false;
  const received = request.headers.get("authorization") || "";
  if (received.length !== secret.length + 7) return false;
  const encode = new TextEncoder();
  const [a,b] = await Promise.all([received, `Bearer ${secret}`].map(v => crypto.subtle.digest("SHA-256", encode.encode(v))));
  const aa = new Uint8Array(a), bb = new Uint8Array(b);
  let diff = 0;
  for (let i=0;i<aa.length;i++) diff |= aa[i]^bb[i];
  return diff === 0;
}
export async function POST(request: Request) {
  try {
    if (!await authorized(request)) return json({message:"Yetkisiz istek."}, 401);
    if (Number(request.headers.get("content-length") || 0) > 131072) return json({message:"İstek çok büyük."},413);
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > 131072) return json({message:"İstek çok büyük."},413);
    const body = command.parse(JSON.parse(text));
    const db = getDb(), origin = new URL(request.url).origin;
    // Actor headers are trusted only after verifying the server-to-server secret.
    const actor = z.object({id:z.string().uuid(),role:z.enum(["USER","ADMIN"])}).parse({
      id:request.headers.get("x-metek-actor-id"),role:request.headers.get("x-metek-actor-role"),
    });
    if (body.action === "import") {
      if (actor.role !== "ADMIN") throw new CardError(403,"Bu işlem için yetki yok.");
      if (body.owners.length) await db.insert(owners).values(body.owners).onConflictDoNothing();
      // Re-running a migration never rolls back a later edit, status change or owner.
      if (body.cards.length) await db.insert(cards).values(body.cards.map(c => ({...c,data:JSON.stringify(c.data)}))).onConflictDoNothing();
      return json({ok:true});
    }
    if (body.action === "owner-status") {
      if (actor.role !== "ADMIN") throw new CardError(403,"Bu işlem için yetki yok.");
      await db.insert(owners).values(body.owner).onConflictDoUpdate({target:owners.id,set:{status:body.owner.status}});
      return json({ok:true});
    }
    const [owner] = await db.select().from(owners).where(eq(owners.id,actor.id)).limit(1);
    if (owner?.status === "PASSIVE") throw new CardError(403,"Hesap pasif.");
    if (!owner) await db.insert(owners).values({id:actor.id,status:"ACTIVE"}).onConflictDoNothing();
    if (body.action === "list") return json((await db.select().from(cards).where(eq(cards.userId,actor.id)).orderBy(desc(cards.createdAt))).map(c => serialize(c,origin)));
    if (body.action === "create") {
      const now = new Date().toISOString();
      const row = {id:crypto.randomUUID(), userId:actor.id, publicToken:Array.from(crypto.getRandomValues(new Uint8Array(32)), b=>b.toString(16).padStart(2,"0")).join(""), data:JSON.stringify(body.input),status:"ACTIVE" as const,createdAt:now,updatedAt:now};
      await db.insert(cards).values(row);
      return json(serialize(row,origin),201);
    }
    const condition = actor.role === "ADMIN" ? eq(cards.id,body.id) : and(eq(cards.id,body.id),eq(cards.userId,actor.id));
    const [row] = await db.select().from(cards).where(condition).limit(1);
    if (!row) throw new CardError(404,"vCard bulunamadı.");
    if (body.action === "get") return json(serialize(row,origin));
    if (body.action === "file") return new Response(createVcf(JSON.parse(row.data)),{headers:{...securityHeaders,"Content-Type":"text/vcard; charset=utf-8","Content-Disposition":'attachment; filename="contact.vcf"'}});
    if (body.action === "delete") {
      await db.delete(cards).where(condition);
      return new Response(null,{status:204,headers:securityHeaders});
    }
    const update = {updatedAt:new Date().toISOString(),...(body.action === "update" ? {data:JSON.stringify(body.input)} : {status:body.status})};
    const [updated] = await db.update(cards).set(update).where(condition).returning();
    if (!updated) throw new CardError(404,"vCard bulunamadı.");
    return json(serialize(updated,origin));
  } catch(error) {
    if (error instanceof CardError) return json({message:error.message},error.status);
    if (error instanceof z.ZodError || error instanceof SyntaxError) return json({message:"İstek bilgileri geçersiz."},400);
    console.error("Card service operation failed", error instanceof Error ? error.name : "UnknownError");
    return json({message:"Kartvizit hizmetine ulaşılamıyor. Lütfen tekrar deneyiniz."},503);
  }
}
