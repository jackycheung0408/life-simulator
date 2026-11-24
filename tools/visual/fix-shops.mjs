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

const date=new Date().toISOString().slice(0,10),OUT=path.join(HERE,"out",date);fs.mkdirSync(OUT,{recursive:true});
// [名稱, place, x, y, fi, 要按的按鈕文字(RegExp), items 補丁]
const T=[
 ["estate-party","estate:1",5,31,"estate:1",/辦派對/,{lx:{estate:"2026-11-24",ep:0}}],
 ["trip","plaza",14,11,null,/小旅行/,{}],
 ["realty-up","realty",75,5,"realty",/升級/,{hl:1}],
 ["realty-estate","realty",75,5,"realty",/買莊園/,{}],
 ["harbor-yacht","harbor",74,21,"harbor",/買遊艇/,{}],
 ["market","market",28,14,"market",null,{}],
 ["cafe","cafe",38,5,"cafe",null,{}],
 ["townhall-donate","townhall",68,5,"townhall",/捐款 10 萬/,{}],
 ["furn","furnshop",75,14,"furnshop",/逛家具/,{}],
 ["wear","wearshop",82,14,"wearshop",/逛新衣/,{}],
 ["slaughter","slaughter",53,14,"slaughter",null,{}],
];
const browser=await chromium.launch();const rep={};
for(const [w,h] of [[390,844],[375,667]]){
 const ctx=await browser.newContext({viewport:{width:w,height:h},serviceWorkers:"block",hasTouch:true});
 for(const [n,pl,x,y,fi,btn,patch] of T){
  if(w==375&&!["market","cafe","trip","estate-party"].includes(n))continue;
  const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(String(e.message).slice(0,100)));
  const key=`${w}-${n}`,R={errs,steps:[]};rep[key]=R;
  await p.addInitScript(()=>{try{localStorage.setItem("town-tips","1");localStorage.setItem("town-mine",JSON.stringify([{tid:"MOCK01",name:"測試小鎮",rid:1,pin:"1111",me:"阿明",at:Date.now()}]))}catch(e){}});
  await p.goto(BASE);await p.waitForTimeout(800);
  await p.evaluate(m=>{const [pl,x,y,fi,patch]=m;const db=JSON.parse(sessionStorage.getItem("mockdb"));const r=db.res.find(q=>q.id==1);r.items=r.items||{};r.items.tr=[];r.items.wish={k:"none",m:0};r.items.at={init:1,st:0,ag:0,ch:0,iq:0,lk:0};r.place=pl;r.x=x;r.y=y;r.money=900000;if(fi)r.items.fi=fi;else delete r.items.fi;Object.assign(r.items,patch);sessionStorage.setItem("mockdb",JSON.stringify(db))},[pl,x,y,fi,patch]);
  await p.reload();await p.waitForTimeout(1500);
  for(let i=0;i<4;i++){await p.evaluate(()=>{document.querySelector("#modal").classList.add("hide");const u=document.querySelector("#upd");if(u)u.classList.add("hide")});await p.waitForTimeout(200)}
  await p.screenshot({path:path.join(OUT,`fix-${key}-a.png`)});
  R.labels=await p.$$eval("#acts button,#mainrow button",bs=>bs.filter(b=>b.offsetParent).map(b=>b.innerText.replace(/\n/g," / ")));
  if(btn){
   const clk=()=>p.evaluate(src=>{const re=new RegExp(src);const el=[...document.querySelectorAll("#acts button,#mainrow button")].find(x=>re.test(x.innerText));if(!el)return"nobtn";el.click();return"clicked"},btn.source);
   // 切分頁找按鈕
   let r1=await clk();
   if(r1=="nobtn"){for(const t of await p.$$eval("#ptabs button",bs=>bs.map(b=>b.innerText.trim()))){await p.evaluate(t=>{[...document.querySelectorAll("#ptabs button")].find(b=>b.innerText.trim()==t).click()},t);await p.waitForTimeout(250);r1=await clk();if(r1=="clicked")break}}
   R.steps.push("click:"+r1);await p.waitForTimeout(500);
   R.tapc=await p.evaluate(()=>{const c=document.getElementById("tapc");return c?c.innerText.replace(/\n/g," "):null});
   R.modal=await p.evaluate(()=>{const m=document.querySelector("#modal");return m&&!m.classList.contains("hide")?document.querySelector("#mbody").innerText.slice(0,160).replace(/\n/g," "):null});
   await p.screenshot({path:path.join(OUT,`fix-${key}-b.png`)});
   if(R.tapc){await p.evaluate(()=>{const b=[...document.querySelectorAll("#tapc button")][0];b.click()});await p.waitForTimeout(900);R.toast=await p.evaluate(()=>document.getElementById("toast").innerText);R.steps.push("confirmed");await p.screenshot({path:path.join(OUT,`fix-${key}-c.png`)})}
  }
  await p.close();
 }
}
await browser.close();srv.close();
fs.writeFileSync(path.join(OUT,"fix-shops.json"),JSON.stringify(rep,null,1));
for(const [k,v] of Object.entries(rep))console.log(k,JSON.stringify({errs:v.errs,steps:v.steps,tapc:v.tapc,toast:v.toast,modal:v.modal}));
