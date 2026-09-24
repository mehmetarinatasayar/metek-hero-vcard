const {spawn,execFileSync}=require("node:child_process");
const path=require("node:path");
const fs=require("node:fs");
require("dotenv").config({quiet:true});
const root=path.resolve(__dirname,"..");
const cli=path.join(root,"node_modules/expo/bin/cli");
const username=execFileSync(process.execPath,[cli,"whoami"],{cwd:root,encoding:"utf8"}).trim();
if (!username || /Not logged in|anonymous/i.test(username)) throw new Error("Önce npx.cmd expo login --browser ile telefonunuzdaki Expo hesabına giriş yapın.");
const bundled=path.resolve(root,"../tools/cloudflared.exe");
const binary=process.env.CLOUDFLARED_PATH || (fs.existsSync(bundled)?bundled:"cloudflared");
const children=[];
let stopping=false,metro,origin,connected=false;
function stop(code=0){if(stopping)return;stopping=true;clearTimeout(timeout);for(const p of children)p.kill();process.exitCode=code;}
const timeout=setTimeout(()=>{console.error("Önizleme bağlantısı zamanında kurulamadı.");stop(1);},45000);
const tunnel=spawn(binary,["tunnel","--url","http://localhost:8082","--no-autoupdate","--protocol","http2"],{cwd:root,windowsHide:true,stdio:["ignore","pipe","pipe"]});
children.push(tunnel);
function startMetro(){
  if(metro||!origin||!connected||stopping)return;
  clearTimeout(timeout);
  console.log(`Expo hesabı: ${username}\nÖnizleme bağlantısı: ${origin}`);
  fs.mkdirSync(path.join(root,".expo"),{recursive:true});
  fs.writeFileSync(path.join(root,".expo","metek-preview.json"),JSON.stringify({origin,username,startedAt:new Date().toISOString()}));
  metro=spawn(process.execPath,[cli,"start","--go","--host","localhost","--port","8082"],{cwd:root,windowsHide:true,env:{...process.env,EXPO_PACKAGER_PROXY_URL:origin},stdio:"inherit"});
  children.push(metro);
  metro.on("error",e=>{console.error(e.message);stop(1);});
  metro.on("exit",code=>stop(code||0));
}
function read(chunk){
  const line=chunk.toString();
  const match=line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if(match)origin=match[0];
  if(line.includes("Registered tunnel connection"))connected=true;
  if(/ERR |failed to/i.test(line))process.stderr.write(line);
  startMetro();
}
tunnel.stdout.on("data",read);tunnel.stderr.on("data",read);
tunnel.on("error",e=>{console.error(`cloudflared başlatılamadı: ${e.message}`);stop(1);});
tunnel.on("exit",code=>{if(!stopping)console.error("Önizleme bağlantısı kapandı.");stop(code||0);});
process.on("SIGINT",()=>stop());process.on("SIGTERM",()=>stop());process.on("exit",()=>{for(const p of children)p.kill();});
