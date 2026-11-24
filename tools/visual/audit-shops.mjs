// 自動畫面測試：node run.mjs [--update] [--head 用 git HEAD 的 town/ 而非工作目錄] [--only 情境] [--size 390x844]
import {chromium} from "playwright";
import http from "node:http";
import {execSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {fileURLToPath} from "node:url";

const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,"../.."),
  args=process.argv.slice(2),UPDATE=args.includes("--update"),
  opt=k=>{const i=args.indexOf(k);return i>=0?args[i+1]:null},ONLY=opt("--only"),ONLYSZ=opt("--size"),
  DIFF_PCT=1.5; // 與基準圖差異像素 > 1.5% 才報
const SIZES=[[390,844],[375,667],[430,932],[768,1024],[1366,768],[1920,1080]].filter(s=>!ONLYSZ||ONLYSZ==s.join("x"));
// ---- 靜態伺服器（暫存複本，注入 mock）----
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"townvis-"));
if(args.includes("--head")){execSync(`git -C "${ROOT}" archive HEAD town | tar -x -C "${tmp}"`);for(const f of fs.readdirSync(path.join(tmp,"town")))fs.renameSync(path.join(tmp,"town",f),path.join(tmp,f))}else fs.cpSync(path.join(ROOT,"town"),tmp,{recursive:true});
fs.copyFileSync(path.join(ROOT,"tools/town-mock.js"),path.join(tmp,"mock.js"));
let html=fs.readFileSync(path.join(tmp,"index.html"),"utf8");
if(process.env.VIS_PATCH)html=html.replace(/location\.href='(\w+\.html)'/g,"location.href=\\'$1\\'");
html=html.replace(/<head[^>]*>/,m=>m+'<script src="mock.js"></script>');
fs.writeFileSync(path.join(tmp,"index.html"),html);
const MIME={".html":"text/html",".js":"text/javascript",".json":"application/json",".woff2":"font/woff2",".css":"text/css",".png":"image/png",".svg":"image/svg+xml"};
const srv=http.createServer((q,s)=>{let f=path.join(tmp,decodeURIComponent(q.url.split("?")[0]));if(f.endsWith("/"))f+="index.html";fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);return s.end()}s.writeHead(200,{"content-type":MIME[path.extname(f)]||"application/octet-stream","cache-control":"no-store"});s.end(d)})});
await new Promise(r=>srv.listen(0,r));const BASE=`http://localhost:${srv.address().port}/index.html?t=MOCK01`;


const HERE2=HERE;
const P=[
 ["street","street",15,12,null],["plaza","plaza",14,11,null],["park","park",31,19,null],
 ["cafe","cafe",38,5,"cafe"],["restaurant","restaurant",5,14,"restaurant"],["gym","gym",40,21,"gym"],
 ["market","market",28,14,"market"],["cinema","cinema",40,14,"cinema"],["office","office",30,6,"office"],
 ["rafi","rafi",49,21,"rafi"],["carshop","carshop",46,14,"carshop"],["slaughter","slaughter",53,14,"slaughter"],
 ["hospital","hospital",61,14,"hospital"],["police","police",58,21,"police"],["townhall","townhall",68,5,"townhall"],
 ["jail","jail",61,5,null],["realty","realty",75,5,"realty"],["harbor","harbor",74,21,"harbor"],
 ["furnshop","furnshop",75,14,"furnshop"],["wearshop","wearshop",82,14,"wearshop"],
 ["arena","arena",53,6,"arena"],["stock","stock",45,5,"stock"],
 ["casino-door","casino",68,14,null],["estate","estate:1",5,31,"estate:1"],
 ["door-cafe","cafe",38,5,null],["door-market","market",28,14,null]
];
const W=[[390,844],[375,667]];
const date=new Date().toISOString().slice(0,10),OUT=path.join(HERE,"out",date);fs.mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch();const rep={};
for(const [w,h] of W){
 const ctx=await browser.newContext({viewport:{width:w,height:h},serviceWorkers:"block",hasTouch:true});
 for(const [n,pl,x,y,fi] of P){
  if(w==375&&!["cafe","market","park","plaza"].includes(n))continue;
  const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(String(e.message).slice(0,100)));
  const key=`${w}-${n}`;const R={btns:[],clicks:[],errs};rep[key]=R;
  try{
   await p.addInitScript(()=>{try{localStorage.setItem("town-tips","1");localStorage.setItem("town-mine",JSON.stringify([{tid:"MOCK01",name:"測試小鎮",rid:1,pin:"1111",me:"阿明",at:Date.now()}]))}catch(e){}});
   await p.goto(BASE);await p.waitForTimeout(800);
   await p.evaluate(m=>{const [pl,x,y,fi]=m;const db=JSON.parse(sessionStorage.getItem("mockdb"));const r=db.res.find(q=>q.id==1);r.items=r.items||{};r.items.tr=[];r.items.wish={k:"none",m:0};r.items.at={init:1,st:0,ag:0,ch:0,iq:0,lk:0};r.place=pl;r.x=x;r.y=y;r.money=50000;if(fi)r.items.fi=fi;else delete r.items.fi;r.items.cas={ch:20000,bh:""};if(pl.startsWith("estate"))r.items.lx={estate:"2026-11-24",ep:0};sessionStorage.setItem("mockdb",JSON.stringify(db))},[pl,x,y,fi]);
   await p.reload();await p.waitForTimeout(1500);
   for(let i=0;i<4;i++){await p.evaluate(()=>{document.querySelector("#modal").classList.add("hide");const u=document.querySelector("#upd");if(u)u.classList.add("hide")});await p.waitForTimeout(200)}
   await p.screenshot({path:path.join(OUT,`audit-shops-${key}.png`)});
   const snap=()=>p.evaluate(()=>[...document.querySelectorAll("#acts button,#mainrow button,#pinbox button,#tipbox button")].filter(b=>b.offsetParent).map(b=>({t:b.innerText.replace(/\n/g," / ").trim(),dis:/poor|dis/.test(b.className)||b.disabled,w:Math.round(b.getBoundingClientRect().width),h:Math.round(b.getBoundingClientRect().height)})));
   const tabs=await p.$$eval("#ptabs button",bs=>bs.filter(b=>b.offsetParent).map(b=>b.innerText.trim()));
   R.tabs=tabs;
   const seen=new Set();
   const tabList=tabs.length?tabs:[null];
   for(const tn of tabList){
     if(tn){await p.evaluate(t=>{const b=[...document.querySelectorAll("#ptabs button")].find(x=>x.innerText.trim()==t);if(b)b.click()},tn);await p.waitForTimeout(300);}
     const bs=await snap();
     for(const b of bs){const k=b.t;if(seen.has(k))continue;seen.add(k);R.btns.push({tab:tn,...b})}
     // click each non-disabled button once
     for(const b of bs){ if(b.dis||/出門|進去/.test(b.t))continue;
       const out=await p.evaluate(async t=>{const el=[...document.querySelectorAll("#acts button,#mainrow button,#tipbox button")].find(x=>x.offsetParent&&x.innerText.replace(/\n/g," / ").trim()==t);if(!el)return null;el.click();await new Promise(r=>setTimeout(r,900));const m=document.querySelector("#modal:not(.hide)");const mt=m?m.innerText.slice(0,260).replace(/\n+/g," | "):"";const to=document.querySelector("#toast");const tt=to&&to.classList.contains("on")?to.innerText:"";if(m)m.classList.add("hide");return {modal:mt,toast:tt}},b.t);
       R.clicks.push({tab:tn,btn:b.t,...(out||{gone:1})});
       await p.waitForTimeout(250);
     }
   }
   await p.screenshot({path:path.join(OUT,`audit-shops-${key}-after.png`)});
  }catch(e){R.fatal=String(e.message).slice(0,150)}
  await p.close();
 }
 await ctx.close();
}
await browser.close();srv.close();
fs.writeFileSync(path.join(OUT,"audit-shops.json"),JSON.stringify(rep,null,1));
console.log("done",Object.keys(rep).length);
