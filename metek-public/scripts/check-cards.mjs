import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
const base = process.argv[2] || "http://localhost:5173";
const key = process.env.METEK_SERVICE_KEY || readFileSync(new URL("../../metek-bridge-key.txt",import.meta.url),"utf8").trim();
const actor = randomUUID(), other = randomUUID();
const input = {firstName:"Çağrı",lastName:"Deneme",company:"METEK",department:"",title:"Bağlantı kontrolü",phone:"",mobilePhone:"+905551234567",email:"qa@example.test",address:"İstanbul",website:"",birthDate:"",visibility:"PUBLIC"};
const command = (body,id=actor,role="USER") => fetch(`${base}/internal/cards`,{method:"POST",redirect:"error",headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`,"X-Metek-Actor-Id":id,"X-Metek-Actor-Role":role},body:JSON.stringify(body)});
let card;
try {
  assert.equal((await fetch(`${base}/internal/cards`,{method:"POST",body:"{}"})).status,401);
  let r = await command({action:"create",input}); assert.equal(r.status,201,await r.clone().text()); card=await r.json();
  assert.equal(new URL(card.publicUrl).origin,base);
  let publicResponse=await fetch(card.publicUrl,{redirect:"error"}); assert.equal(publicResponse.status,200);
  assert.equal(publicResponse.headers.get("cache-control"),"no-store"); assert.match(await publicResponse.text(),/Çağrı/);
  r=await fetch(`${card.publicUrl}/file`); assert.equal(r.status,200); assert.match(await r.text(),/BEGIN:VCARD\r\nVERSION:3.0/);
  assert.equal((await command({action:"get",id:card.id},other)).status,404);
  assert.equal((await command({action:"update",id:card.id,input:{...input,firstName:"Changed"}},other)).status,404);
  r=await command({action:"update",id:card.id,input:{...input,title:"Güncellendi"}}); assert.equal(r.status,200); assert.equal((await r.json()).publicToken,card.publicToken);
  assert.match(await (await fetch(card.publicUrl)).text(),/Güncellendi/);
  assert.equal((await command({action:"status",id:card.id,status:"PASSIVE"})).status,200);
  assert.equal((await fetch(card.publicUrl)).status,410); assert.equal((await fetch(`${card.publicUrl}/file`)).status,410);
  await command({action:"status",id:card.id,status:"ACTIVE"});
  await command({action:"update",id:card.id,input:{...input,visibility:"PRIVATE"}});
  assert.equal((await fetch(card.publicUrl)).status,404); assert.equal((await fetch(`${card.publicUrl}/file`)).status,404);
  await command({action:"update",id:card.id,input});
  await command({action:"owner-status",owner:{id:actor,status:"PASSIVE"}},other,"ADMIN");
  assert.equal((await fetch(card.publicUrl)).status,404); assert.equal((await command({action:"get",id:card.id})).status,403);
  await command({action:"owner-status",owner:{id:actor,status:"ACTIVE"}},other,"ADMIN");
  assert.equal((await fetch(card.publicUrl)).status,200);
  assert.equal((await command({action:"delete",id:card.id})).status,204);
  assert.equal((await fetch(card.publicUrl)).status,404);
  console.log("PASS: anonymous HTTPS/card/VCF, service authentication, ownership, updates, private/passive state, account status, deletion.");
} finally {
  if(card) await command({action:"delete",id:card.id},other,"ADMIN");
}
