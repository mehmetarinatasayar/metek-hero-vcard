import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import request from "supertest";
import { createApp } from "../server/app";
import { isInternetUrl } from "../shared/publicUrl";
import { emptyCard } from "../shared/schema";

test("QR sharing refuses device-local addresses", () => {
  for (const url of ["http://localhost:3001/v/a","https://localhost/v/a","https://127.0.0.1/v/a","https://192.168.1.56/v/a","https://172.20.0.1/v/a","https://computer.local/v/a","https://[::1]/v/a","bad"]) assert.equal(isInternetUrl(url),false,url);
  assert.equal(isInternetUrl("https://metek-hero-vcard.arinatasayar.chatgpt.site/v/test"),true);
});

test("cloud card proxy preserves local authentication and fails without falling back to stale cards", async () => {
  const key=randomBytes(32).toString("hex");
  let actor="", mode="ok", calls=0;
  const remote=createServer(async (req,res) => {
    calls++;
    assert.equal(req.headers.authorization,`Bearer ${key}`);
    assert.equal(req.headers["x-metek-actor-id"],actor);
    assert.equal(req.headers["x-metek-actor-role"],"USER");
    if(mode==="fail") {res.writeHead(503);res.end("offline");return;}
    const chunks: Buffer[]=[];for await(const chunk of req) chunks.push(chunk);
    const command = JSON.parse(Buffer.concat(chunks).toString());
    if (mode === "save") {
      assert.ok(["create", "update"].includes(command.action));
      assert.equal(command.input.website, "https://www.example.test/");
      res.writeHead(200, {"Content-Type":"application/json"});
      res.end(JSON.stringify({id:"11111111-1111-4111-8111-111111111111",...command.input}));return;
    }
    assert.equal(command.action,"list");
    res.writeHead(200,{"Content-Type":"application/json"});res.end("[]");
  });
  await new Promise<void>(resolve=>remote.listen(0,"127.0.0.1",resolve));
  const port=(remote.address() as {port:number}).port;
  const {app,db}=createApp({databasePath:":memory:",publicBaseUrl:"https://cards.example.test",origins:["http://localhost:8081"],remoteCards:{url:`http://127.0.0.1:${port}`,key}});
  try {
    await request(app).get("/vcards").expect(401);assert.equal(calls,0);
    const signed=await request(app).post("/auth/register").send({firstName:"Test",lastName:"User",email:"bridge@example.test",password:"BridgeTest2026"}).expect(201);
    actor=signed.body.user.id;
    await request(app).get("/vcards").set("Authorization",`Bearer ${signed.body.token}`).expect(200,[]);
    mode="save";
    const input={...emptyCard,firstName:"Test",lastName:"Kart",website:"www.example.test"};
    await request(app).post("/vcards").set("Authorization",`Bearer ${signed.body.token}`).send(input).expect(200);
    await request(app).put("/vcards/11111111-1111-4111-8111-111111111111").set("Authorization",`Bearer ${signed.body.token}`).send(input).expect(200);
    await request(app).post("/vcards").set("Authorization",`Bearer ${signed.body.token}`).send({...input,website:"javascript:alert(1)"}).expect(400);
    mode="fail";
    await request(app).get("/vcards").set("Authorization",`Bearer ${signed.body.token}`).expect(503);
    await request(app).get("/v/"+"a".repeat(64)+"/").expect(307).expect("Location","https://cards.example.test/v/"+"a".repeat(64)+"/");
    assert.equal(calls,4);
  } finally {db.close();await new Promise<void>(resolve=>remote.close(()=>resolve()));}
});
