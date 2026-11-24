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
const browser=await chromium.launch();const rep={};
const SETUP=(o)=>`(()=>{const db=JSON.parse(sessionStorage.getItem("mockdb"));const r=db.res.find(q=>q.id==1);r.items=r.items||{};r.items.tr=["foodie"];r.items.wish={k:"rich",m:1};r.items.at={init:1,st:2,ag:1,ch:1,iq:1,lk:0,sp:0};r.items.al={n:12,d:"2026-11-24",s:5,lv:2};r.items.works=0;r.acc={pw:"secret1",temp:false};r.money=100000;r.energy=90;Object.assign(r,${JSON.stringify(o)});if(${JSON.stringify(o.fi||"")})r.items.fi=${JSON.stringify(o.fi||"")};sessionStorage.setItem("mockdb",JSON.stringify(db))})()`;

const L=[];let fail=0;const ck=(n,ok,x="")=>{console.log((ok?"OK  ":"FAIL ")+n+" "+x);if(!ok)fail++};
for(const [w,h] of [[390,844],[375,667]]){
 const ctx=await browser.newContext({viewport:{width:w,height:h},serviceWorkers:"block",hasTouch:true});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(String(e.message).slice(0,160)));
 await p.addInitScript(()=>{try{localStorage.setItem("town-tips","1");localStorage.setItem("town-acct-nag",new Date().toDateString());localStorage.setItem("town-ob_1",JSON.stringify({fin:1,sk:1,d:[]}));localStorage.setItem("town-mine",JSON.stringify([{tid:"MOCK01",name:"測試小鎮",rid:1,pin:"1111",me:"阿明",at:Date.now()}]))}catch(e){}});
 const snap=n=>p.screenshot({path:path.join(OUT,`home-${w}-${n}.png`)});
 const hide=async()=>{await p.evaluate(()=>{const u=document.querySelector("#upd");if(u)u.classList.add("hide")})};
 const load=async o=>{await p.goto(BASE);await p.waitForTimeout(600);await p.evaluate(SETUP(o));await p.reload();await p.waitForTimeout(1800);await hide()};
 const acts=()=>p.evaluate(()=>[...document.querySelectorAll("#acts button[data-i]")].map(b=>{const r=b.getBoundingClientRect();return b.querySelector(".at").innerText.replace(/\s+/g," ").trim()+"@"+Math.round(r.x)+","+Math.round(r.y)+","+Math.round(r.width)+","+Math.round(r.height)}));
 const mr=()=>p.evaluate(()=>[...document.querySelectorAll("#mainrow button")].map(b=>b.innerText.replace(/\s+/g," ").trim()));
 await load({place:"cafe",x:38,y:5,items:{fi:"cafe"}});
 const a0=await acts(),m0=await mr();console.log(w,"acts",a0.length,"main",JSON.stringify(m0));await snap("cafe-before");
 const stars=await p.evaluate(()=>document.querySelectorAll("#acts .act.inmr").length);ck(w+" 面板有星號標示",stars>=1,stars);
 // 按常用列第一顆（常用列內容會改變）
 await p.evaluate(()=>{const b=document.querySelector("#mainrow button[data-i]");b&&b.click()});await p.waitForTimeout(2500);
 const a1=await acts(),m1=await mr();console.log(w,"after main",JSON.stringify(m1));await snap("cafe-after");
 const strip=a=>a.map(x=>x.split("@")[0]);
 ck(w+" 按後面板按鈕數量／順序相同",JSON.stringify(strip(a0))==JSON.stringify(strip(a1)),a0.length+"→"+a1.length);
 ck(w+" 按後面板按鈕位置相同",JSON.stringify(a0)==JSON.stringify(a1));
 // 常用列有該動作
 const inMr=a0.length&&m0.some(t=>a0.some(x=>t.includes(x.split("@")[0].split(" ")[0])));ck(w+" 常用列有該動作",inMr);
 // 回家
 await load({place:"street",x:20,y:12});
 const hb=await p.evaluate(()=>{const b=document.getElementById("homeBtn");if(!b)return null;const r=b.getBoundingClientRect();const z=document.getElementById("zoom").getBoundingClientRect();return {w:r.width,h:r.height,vis:getComputedStyle(b).display,top:r.top,zb:z.bottom,right:r.right,iw:innerWidth}});console.log(w,"homeBtn",JSON.stringify(hb));ck(w+" 回家鈕存在、≥44px、不重疊",hb&&hb.vis!="none"&&hb.h>=44&&hb.w>=44&&hb.top>=hb.zb-1);
 await snap("street-btn");
 await p.evaluate(()=>document.getElementById("homeBtn").click());
 let ok=false;for(let i=0;i<60&&!ok;i++){await p.waitForTimeout(500);ok=await p.evaluate(()=>{const r=JSON.parse(sessionStorage.getItem("mockdb")).res.find(x=>x.id==1);return String(r.place).startsWith("home:")})}
 await snap("home-arrived");ck(w+" 回家鈕走進自己的家",ok);
 // 睡著灰掉
 await load({place:"street",x:20,y:12,sleeping:true});
 const why=await p.evaluate(()=>{const b=document.getElementById("homeBtn");return b.className+"|"+b.title});console.log(w,"asleep",why);ck(w+" 睡著灰掉並有原因",/poor/.test(why)&&/睡/.test(why));
 // 莊園內
 await load({place:"street",x:20,y:12});
 ck(w+" 無 pageerror",errs.length==0,errs.join(";"));
 await ctx.close();
}
await browser.close();srv.close();process.exit(fail?1:0);
