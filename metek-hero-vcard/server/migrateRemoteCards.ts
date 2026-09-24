import "dotenv/config";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { cardSchema } from "../shared/schema";

async function main() {
const url = process.env.REMOTE_CARDS_URL;
const key = process.env.REMOTE_CARDS_KEY;
if (!url?.startsWith("https://") || !key || key.length < 64) throw new Error("HTTPS kart servisi ve anahtarı gerekli.");
const dbPath = process.env.DATABASE_PATH ?? "./data/metek.sqlite";
const marker = `${dbPath}.remote-migrated.json`;
if (existsSync(marker)) {
  const previous = JSON.parse(readFileSync(marker,"utf8"));
  if (previous.url !== url) throw new Error("Bu veritabanı farklı bir sunucuya aktarılmış.");
  console.log("Bu veritabanı zaten aktarılmış; işlem tekrarlanmadı.");
  process.exit(0);
}
const db = new DatabaseSync(dbPath,{readOnly:true});
const owners = db.prepare("SELECT id,status FROM users").all();
const cards = db.prepare("SELECT * FROM vcards").all().map(row => ({
  id:row.id,userId:row.user_id,publicToken:row.public_token,data:cardSchema.parse(JSON.parse(String(row.data))),
  status:row.status,createdAt:row.created_at,updatedAt:row.updated_at,
}));
const actor = randomUUID();
async function send(body: unknown) {
  const result = await fetch(new URL("/internal/cards",url),{method:"POST",redirect:"error",signal:AbortSignal.timeout(30000),headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`,"X-Metek-Actor-Id":actor,"X-Metek-Actor-Role":"ADMIN"},body:JSON.stringify(body)});
  if (!result.ok) throw new Error(`Aktarım tamamlanamadı (${result.status}).`);
}
for (let i=0;i<owners.length;i+=25) await send({action:"import",owners:owners.slice(i,i+25),cards:[]});
for (let i=0;i<cards.length;i+=10) await send({action:"import",owners:[],cards:cards.slice(i,i+10)});
writeFileSync(marker,JSON.stringify({url,completedAt:new Date().toISOString(),cardCount:cards.length},null,2));
db.close();
console.log(`${cards.length} kartvizit aktarıldı. Mevcut yerel veritabanı yedek olarak korundu.`);
}
void main().catch(error => { console.error(error.message); process.exitCode=1; });
