import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolveApiUrl } from "../shared/apiUrl";
const { createExpoApiProxy } = require("../server/expoProxy.cjs");

test("Expo Go resolves its API through the current tunnel or LAN, while web and production retain their API", () => {
  const mobile={platform:"ios",development:true};
  assert.equal(resolveApiUrl({...mobile,hostUri:"project-8082.exp.direct"}),"https://project-8082.exp.direct/__metek_api");
  assert.equal(resolveApiUrl({...mobile,configured:"http://localhost:3001",hostUri:"project-8082.exp.direct:80"}),"https://project-8082.exp.direct/__metek_api");
  assert.equal(resolveApiUrl({...mobile,hostUri:"192.168.1.56:8082"}),"http://192.168.1.56:8082/__metek_api");
  assert.equal(resolveApiUrl({...mobile,hostUri:"preview.trycloudflare.com:80"}),"https://preview.trycloudflare.com/__metek_api");
  assert.equal(resolveApiUrl({...mobile,hostUri:"project.exp.direct",configured:"https://api.example.test/"}),"https://api.example.test");
  assert.equal(resolveApiUrl({...mobile,platform:"web",hostUri:"project.exp.direct"}),"http://localhost:3001");
  assert.equal(resolveApiUrl({...mobile,development:false,hostUri:"project.exp.direct"}),"");
});

test("Expo proxy forwards credentials and API failures without becoming a general network proxy", async () => {
  const upstream=createServer((req,res) => {
    assert.equal(req.url,"/users/me"); assert.equal(req.headers.authorization,"Bearer synthetic-token");
    assert.equal(req.headers["x-forwarded-for"],undefined);
    res.writeHead(401,{"Content-Type":"application/json","Cache-Control":"no-store"});res.end('{"message":"Oturum gerekli"}');
  });
  await new Promise<void>(resolve=>upstream.listen(0,"127.0.0.1",resolve));
  const proxy=createExpoApiProxy((upstream.address() as {port:number}).port);
  const metro=createServer((req,res) => proxy(req,res,()=>{res.writeHead(200);res.end("metro");}));
  await new Promise<void>(resolve=>metro.listen(0,"127.0.0.1",resolve));
  const base=`http://127.0.0.1:${(metro.address() as {port:number}).port}`;
  try {
    let r=await fetch(base+"/__metek_api/users/me",{headers:{Authorization:"Bearer synthetic-token","X-Forwarded-For":"spoofed"}});
    assert.equal(r.status,401);assert.equal((await r.json()).message,"Oturum gerekli");
    assert.equal((await fetch(base+"/__metek_api/https://example.test")).status,404);
    assert.equal(await (await fetch(base+"/index.bundle")).text(),"metro");
    await new Promise<void>(resolve=>upstream.close(()=>resolve()));
    r=await fetch(base+"/__metek_api/health");assert.equal(r.status,503);
  } finally {metro.closeAllConnections();upstream.closeAllConnections();await new Promise<void>(resolve=>metro.close(()=>resolve()));upstream.close();}
});
