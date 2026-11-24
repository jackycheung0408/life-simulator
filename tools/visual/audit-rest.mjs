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
const setup=`(()=>{const db=JSON.parse(sessionStorage.getItem("mockdb"));const r=db.res.find(q=>q.id==1);r.items=r.items||{};r.items.tr=["foodie","lucky"];r.items.wish={k:"rich",m:1};r.items.at={init:1,st:2,ag:1,ch:1,iq:1,lk:0,sp:0};r.items.al={n:12,d:"2026-11-24",s:5,lv:2};r.items.works=40;r.items.jw={cafe:20,rafi:5};r.items.titles=["元老居民","熟面孔"];r.items.pr={n:1,u:new Date(Date.now()+36e5).toISOString()};r.items.ac={n:3};r.items.db={a:1200};r.items.ins={car:{c:new Date(Date.now()+864e5).toISOString(),f:new Date(Date.now()+864e5).toISOString()}};r.money=150000;r.place="street";r.x=15;r.y=12;sessionStorage.setItem("mockdb",JSON.stringify(db))})()`;
const metrics=()=>{const m=document.querySelector("#modal");const vis=m&&!m.classList.contains("hide");const b=document.querySelector("#mbody");if(!vis)return{open:false};const bs=[...m.querySelectorAll("button")].filter(x=>x.offsetParent);return{open:true,text:b.innerText.slice(0,2500),sw:b.scrollWidth>b.clientWidth+1,small:bs.filter(x=>x.getBoundingClientRect().height<44).map(x=>x.innerText.trim().slice(0,12)+":"+Math.round(x.getBoundingClientRect().height)),ell:[...m.querySelectorAll("*")].filter(x=>x.children.length==0&&x.scrollWidth>x.clientWidth+1&&getComputedStyle(x).overflow!="visible").map(x=>x.innerText.slice(0,20)),fonts:[...new Set([...m.querySelectorAll("*")].filter(x=>x.children.length==0&&x.innerText).map(x=>getComputedStyle(x).fontSize))]}};
for(const [w,h] of [[390,844],[375,667]]){
 const ctx=await browser.newContext({viewport:{width:w,height:h},serviceWorkers:"block",hasTouch:true});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(String(e.message).slice(0,120)));
 await p.addInitScript(()=>{try{localStorage.setItem("town-tips","1");localStorage.setItem("town-ob_1",JSON.stringify({fin:1,sk:1,d:[]}));localStorage.setItem("town-mine",JSON.stringify([{tid:"MOCK01",name:"測試小鎮",rid:1,pin:"1111",me:"阿明",at:Date.now()}]))}catch(e){}});
 await p.goto(BASE);await p.waitForTimeout(800);await p.evaluate(setup);await p.reload();await p.waitForTimeout(1800);
 const hide=async()=>{for(let i=0;i<3;i++){await p.evaluate(()=>{document.querySelector("#modal").classList.add("hide");const u=document.querySelector("#upd");if(u)u.classList.add("hide")});await p.waitForTimeout(150)}};
 await hide();
 const R=rep[w]={errs};
 const open=async(name,sel,wait=700)=>{await hide();await p.evaluate(()=>document.querySelector("#menuBtn").click());await p.waitForTimeout(300);const ok=await p.evaluate(s=>{const e=document.querySelector(s);if(!e||e.hidden)return false;e.click();return true},sel);await p.waitForTimeout(wait);R[name]=ok?await p.evaluate(metrics):{missing:true};await p.screenshot({path:path.join(OUT,`audit-rest-${w}-${name}.png`)}); };
 await open("life","#life");
 await open("tasks","#taskBtn");
 await open("stats","#statBtn");
 await open("upd","#updBtn");
 await open("pow","#powBtn");
 await open("mayor","#mayor");
 const menuIds=await p.evaluate(()=>{document.querySelector("#menuBtn").click();return [...document.querySelectorAll("#menu button,#menu [id]")].filter(x=>x.offsetParent).map(x=>x.id+":"+x.innerText.trim().slice(0,10))});R.menuIds=menuIds;
 await hide();
 // feed
 await p.evaluate(()=>document.querySelector("#feedBtn").click());await p.waitForTimeout(600);
 R.feed=await p.evaluate(()=>({tabs:[...document.querySelectorAll("#social button,#feedTabs button,.fbar button")].filter(x=>x.offsetParent).map(x=>x.innerText.trim().slice(0,10)).slice(0,25)}));
 await p.screenshot({path:path.join(OUT,`audit-rest-${w}-feed.png`)});
 await p.evaluate(()=>{const c=document.querySelector("#socialClose");if(c)c.click()});await p.waitForTimeout(300);
 await ctx.close();
}
await browser.close();srv.close();
fs.writeFileSync(path.join(OUT,"audit-rest.json"),JSON.stringify(rep,null,1));console.log("done");
