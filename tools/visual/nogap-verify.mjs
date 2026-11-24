// 取消 3 秒間隔後的前端連點實測（Playwright 手機模擬 + mock）：node nogap-verify.mjs [390x844]
import {chromium} from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {fileURLToPath} from "node:url";
const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,"../..");
const only=process.argv[2];
const SIZES=[[390,844],[375,667]].filter(s=>!only||only==s.join("x"));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"ng-"));
fs.cpSync(path.join(ROOT,"town"),tmp,{recursive:true});
fs.copyFileSync(path.join(ROOT,"tools/town-mock.js"),path.join(tmp,"mock.js"));
let html=fs.readFileSync(path.join(tmp,"index.html"),"utf8");
html=html.replace(/<head[^>]*>/,m=>m+'<script src="mock.js"></script>');fs.writeFileSync(path.join(tmp,"index.html"),html);
const MIME={".html":"text/html",".js":"text/javascript",".json":"application/json",".woff2":"font/woff2",".css":"text/css",".png":"image/png",".svg":"image/svg+xml"};
const srv=http.createServer((q,s)=>{let f=path.join(tmp,decodeURIComponent(q.url.split("?")[0]));if(f.endsWith("/"))f+="index.html";fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);return s.end()}s.writeHead(200,{"content-type":MIME[path.extname(f)]||"application/octet-stream"});s.end(d)})});
await new Promise(r=>srv.listen(0,r));const BASE=`http://localhost:${srv.address().port}/index.html?t=MOCK01`;
const date=new Date().toISOString().slice(0,10),OUT=path.join(HERE,"out",date);fs.mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch();const say=(...a)=>console.log(a.join(" "));
async function mk(w,h){
 const ctx=await browser.newContext({viewport:{width:w,height:h},serviceWorkers:"block",hasTouch:true});const p=await ctx.newPage();const errs=[];
 p.on("pageerror",e=>errs.push(e.message));p.on("console",m=>{if(m.type()=="error"&&!/Failed to load|favicon/.test(m.text()))errs.push(m.text())});p.__errs=errs;
 await p.addInitScript(()=>{try{localStorage.setItem("town-tips","1");localStorage.setItem("town-mine",JSON.stringify([{tid:"MOCK01",name:"測試小鎮",rid:1,pin:"1111",me:"阿明",at:Date.now()}]))}catch(e){}});
 await p.goto(BASE);await p.waitForSelector("#panel",{timeout:8000}).catch(()=>{});await p.waitForTimeout(800);
 await p.evaluate(()=>{const db=JSON.parse(sessionStorage.getItem("mockdb")),r=db.res.find(x=>x.id==1);r.items=r.items||{};r.items.tr=[];r.items.wish={k:"none",m:0};r.items.at={init:1,st:0,ag:0,ch:0,iq:0,lk:0};r.place="casino";r.x=68;r.y=14;r.items.fi="casino";r.items.cas={ch:2000000,bh:""};r.money=5000;sessionStorage.setItem("mockdb",JSON.stringify(db))});
 await p.reload();await p.waitForTimeout(1200);
 for(let i=0;i<5;i++){await p.waitForTimeout(400);const o=await p.evaluate(()=>!document.querySelector("#modal").classList.contains("hide"));if(!o)break;await p.evaluate(()=>document.querySelector("#modal").classList.add("hide"))}
 await p.evaluate(()=>{for(const id of["upd","tips"]){const u=document.getElementById(id);if(u)u.classList.add("hide")}});
 return p}
const ct=async(p,t)=>{const h=await p.evaluateHandle(t=>[...document.querySelectorAll("#mbody button,#acts button,#mainrow button,#ptabs button,#menu button")].find(b=>b.offsetParent&&b.textContent.includes(t)),t);const el=h.asElement();if(!el)return false;await el.click();return true};
const open=async(p,t)=>{await ct(p,"小豬賭場");await p.waitForTimeout(500);const g={"輪盤":"wheel","老虎機":"slots","21點":"bj_start"}[t];const ok=await p.evaluate(g=>{const b=document.querySelector(`#mbody button[data-g="${g}"]`)||[...document.querySelectorAll("#mbody .gmenu button")].find(x=>x.dataset.g&&g.startsWith(x.dataset.g.slice(0,2)));if(b){b.click();return true}return false},g);if(!ok)say("找不到",t,await p.evaluate(()=>[...document.querySelectorAll("#mbody button")].map(b=>b.dataset.g||b.textContent).join(",")));await p.waitForTimeout(700)};
const count=p=>p.evaluate(()=>{window.__c={};const f=window.fetch;window.fetch=(u,o)=>{try{const b=JSON.parse(o.body||"{}");if(b.game)window.__c[b.game]=(window.__c[b.game]||0)+1}catch(e){}return f(u,o)}});
const chips=p=>p.evaluate(()=>JSON.parse(sessionStorage.getItem("mockdb")).res.find(x=>x.id==1).items.cas.ch);
for(const [w,h] of SIZES){const T=`${w}x${h}`;say(`\n===== ${T} =====`);
 for(const [name,tab,go] of (process.env.CR?[]:[["輪盤","輪盤","#whGo"],["老虎機","老虎機","#slGo"],["21點","21點","#bjGo"]])){
  const p=await mk(w,h);await open(p,tab);await count(p);
  const c0=await chips(p);let clicks=0;
  for(let i=0;i<10;i++){const ok=await p.evaluate(sel=>{const b=document.querySelector(sel);if(!b||b.disabled||!b.offsetParent)return false;b.click();return true},go);if(ok)clicks++;await p.waitForTimeout(40)}
  await p.waitForTimeout(3500);
  // 21 點：局中要完成才會再開；點「停牌」收尾
  const c1=await p.evaluate(()=>window.__c);
  const txt=await p.evaluate(()=>(document.querySelector("#mbody")||{}).innerText||"");
  const gbusy=await p.evaluate(()=>document.getElementById("mbody").classList.contains("gbusy"));
  const c2=await chips(p);const rn=Object.values(c1).reduce((a,b)=>a+b,0);
  say(`[${name}] 連點10次（快速）按下${clicks}次 RPC=${JSON.stringify(c1)} 總${rn} 籌碼 ${c0}→${c2} 忙碌鎖殘留=${gbusy} console錯誤=${p.__errs.length?p.__errs.join("|"):"無"}`);
  await p.screenshot({path:path.join(OUT,`nogap-${name}-fast-${T}.png`)});
  // 慢速逐次點（等結果）：確認按鈕恢復可再按
  let okc=0;for(let i=0;i<5;i++){await p.waitForTimeout(2800);const ok=await p.evaluate(sel=>{const b=document.querySelector(sel);if(!b||b.disabled||!b.offsetParent)return false;b.click();return true},go);if(ok)okc++}
  if(name=="21點"){for(let k=0;k<3;k++){await ct(p,"停牌");await p.waitForTimeout(800)}}
  await p.waitForTimeout(2500);
  say(`  逐局慢點5次 可按${okc}次 籌碼=${await chips(p)} 按鈕可再按=${await p.evaluate(sel=>{const b=document.querySelector(sel);return !!(b&&!b.disabled&&b.offsetParent)},go)}`);
  await p.screenshot({path:path.join(OUT,`nogap-${name}-after-${T}.png`)});await p.context().close()}
}
for(const [w,h] of SIZES){const T=`${w}x${h}`;say(`\n===== 飛行器 ${T} =====`);
 const p=await mk(w,h);await ct(p,"小豬賭場");await p.waitForTimeout(500);
 const pick=g=>p.evaluate(g=>{const b=document.querySelector(`#mbody button[data-g="${g}"]`);if(b){b.click();return true}return false},g);
 await p.evaluate(()=>{window.__crx=100000});say("開桌",await pick("crash"));await p.waitForTimeout(700);
 await p.click("#crGo");await p.waitForTimeout(1500);
 const c0=await chips(p);say("起飛後 籌碼",c0,"收手鈕",!!(await p.$("#crC")));
 await p.evaluate(()=>document.querySelector("#modal").classList.add("hide"));await p.waitForTimeout(300);
 await ct(p,"小豬賭場");await p.waitForTimeout(500);await pick("crash");await p.waitForTimeout(1200);
 say("db.cr=",await p.evaluate(()=>JSON.stringify(JSON.parse(sessionStorage.getItem("mockdb")).res.find(x=>x.id==1).items.cas.cr)));
 const st=await p.evaluate(()=>({status:document.getElementById("crS")?.textContent,c:!!document.getElementById("crC"),go:document.getElementById("crGo")?"有起飛鈕":"無起飛鈕",m:document.getElementById("crM")?.textContent}));
 say("重開桌 還原=",JSON.stringify(st),"籌碼",await chips(p),"(不變)");
 const r=await p.evaluate(async()=>{try{const x=await fetch("/rpc/town_casino",{method:"POST",body:JSON.stringify({rid:1,pin:"1111",game:"cr_start",bet:100}),headers:{"content-type":"application/json"}});return await x.text()}catch(e){return String(e)}});
 say("再送 cr_start =>",r.slice(0,120),"籌碼",await chips(p));
 await p.screenshot({path:path.join(OUT,`nogap-飛行器-restore-${T}.png`)});
 say("console錯誤",p.__errs.length?p.__errs.join("|"):"無");await p.context().close()}
await browser.close();srv.close();
