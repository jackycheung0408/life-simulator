// 載入畫面：node loading.mjs [REF]  REF = git 版本（比較前後）；預設工作目錄。慢網路＝town.js 延遲 800ms、每個 RPC 延遲 700ms；--slow 另跑 RPC 7 秒看「再試一次」
import {chromium} from "playwright";import http from "node:http";import {execSync} from "node:child_process";import fs from "node:fs";import path from "node:path";import os from "node:os";import {fileURLToPath} from "node:url";
const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,"../.."),REF=process.argv[2]&&!process.argv[2].startsWith("--")?process.argv[2]:"",SLOW=process.argv.includes("--slow");
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"townld-"));
if(REF){execSync(`git -C "${ROOT}" archive ${REF} town | tar -x -C "${tmp}"`);for(const f of fs.readdirSync(path.join(tmp,"town")))fs.renameSync(path.join(tmp,"town",f),path.join(tmp,f))}else fs.cpSync(path.join(ROOT,"town"),tmp,{recursive:true});
fs.copyFileSync(path.join(ROOT,"tools/town-mock.js"),path.join(tmp,"mock.js"));
let html=fs.readFileSync(path.join(tmp,"index.html"),"utf8");const D=SLOW?7000:700;
html=html.replace(/<head[^>]*>/,m=>m+`<script src="mock.js"></script><script>(function(f){window.fetch=function(u,o){return String(u).includes("/rpc/")?new Promise(function(r){setTimeout(r,${D})}).then(function(){return f(u,o)}):f(u,o)}})(window.fetch)</script>`);
fs.writeFileSync(path.join(tmp,"index.html"),html);
const MIME={".html":"text/html",".js":"text/javascript",".json":"application/json",".woff2":"font/woff2"};
const srv=http.createServer((q,s)=>{let f=path.join(tmp,decodeURIComponent(q.url.split("?")[0]));if(f.endsWith("/"))f+="index.html";fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);return s.end()}const go=()=>{s.writeHead(200,{"content-type":MIME[path.extname(f)]||"application/octet-stream","cache-control":"no-store"});s.end(d)};/town\.js/.test(f)?setTimeout(go,800):go()})});
await new Promise(r=>srv.listen(0,r));const BASE=`http://localhost:${srv.address().port}/index.html?t=MOCK01`;
const OUT=path.join(HERE,"out",new Date().toISOString().slice(0,10));fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();
for(const [w,h] of [[390,844],[1366,768]]){
 const c=await b.newContext({viewport:{width:w,height:h},serviceWorkers:"block"}),p=await c.newPage();
 await p.addInitScript(()=>{try{localStorage.setItem("town-tips","1");localStorage.setItem("town-mine",JSON.stringify([{tid:"MOCK01",name:"測試小鎮",rid:1,pin:"1111",me:"阿明",at:Date.now()}]))}catch(e){}});
 await p.goto(BASE.replace("?t=","?x=1&t="));await p.evaluate(()=>{sessionStorage.removeItem("mockdb")}).catch(()=>{});
 // 先讓假資料庫建好小鎮（第一次載入），再重載量測
 await p.waitForTimeout(D*3+1500);const seen={},tag=`${REF||"now"}${SLOW?"-slow":""}`;let gameAt=0;const t0=Date.now();await p.goto(BASE,{waitUntil:"commit"});
 while(Date.now()-t0<D*4+4000){
  const st=await p.evaluate(()=>{const t=document.getElementById("ldt"),g=document.getElementById("game"),btn=!!document.querySelector(".ldr");return{t:t?t.textContent:"",g:g&&!g.classList.contains("hide"),btn}}).catch(()=>null);
  if(!st){await p.waitForTimeout(50);continue}
  const k=st.t||(st.g?"game":"");if(st.btn&&!seen["btn"]){seen["btn"]=Date.now()-t0;await p.screenshot({path:path.join(OUT,`loading-${tag}-${w}x${h}-slow.png`)})}
  if(k&&!seen[k]){seen[k]=Date.now()-t0;await p.screenshot({path:path.join(OUT,`loading-${tag}-${w}x${h}-${k.replace(/[^\dA-Za-z／]/g,"")||"x"}.png`)})}
  if(st.g){gameAt=Date.now()-t0;break}await p.waitForTimeout(50)}
 console.log(tag,w+"x"+h,JSON.stringify(seen),"game(ms)=",gameAt);await c.close()}
await b.close();srv.close();fs.rmSync(tmp,{recursive:true,force:true});
