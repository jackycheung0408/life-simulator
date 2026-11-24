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
const SETUP=(o)=>`(()=>{const db=JSON.parse(sessionStorage.getItem("mockdb"));const r=db.res.find(q=>q.id==1);r.items=r.items||{};r.items.tr=["foodie"];r.items.wish={k:"rich",m:1};r.items.at={init:1,st:2,ag:1,ch:1,iq:1,lk:0,sp:0};r.items.al={n:12,d:"2026-11-24",s:5,lv:2};r.items.works=40;r.items.ac={n:3};r.items.db={a:1200};r.items.ins={car:{c:new Date(Date.now()+864e5*3).toISOString(),f:new Date(Date.now()-864e5).toISOString()}};r.items.cas={ch:50000};r.items.mdc={};r.money=100000;r.energy=0;Object.assign(r,${JSON.stringify(o)});sessionStorage.setItem("mockdb",JSON.stringify(db))})()`;
const out={};
for(const [w,h] of [[390,844],[375,667]]){
 const ctx=await browser.newContext({viewport:{width:w,height:h},serviceWorkers:"block",hasTouch:true});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(String(e.message).slice(0,120)));
 await p.addInitScript(()=>{try{localStorage.setItem("town-tips","1");localStorage.setItem("town-ob_1",JSON.stringify({fin:1,sk:1,d:[]}));localStorage.setItem("town-mine",JSON.stringify([{tid:"MOCK01",name:"測試小鎮",rid:1,pin:"1111",me:"阿明",at:Date.now()}]))}catch(e){}});
 const R=out[w]={errs};R.resp=[];p.on("response",async r=>{if(/town_act|town_score/.test(r.url())){try{const j=await r.json();R.resp.push((r.url().split("/").pop())+":"+(j.message||j.error||"ok"))}catch(e){R.resp.push("?")}}});
 const hide=async()=>{for(let i=0;i<3;i++){await p.evaluate(()=>{document.querySelector("#modal").classList.add("hide");const u=document.querySelector("#upd");if(u)u.classList.add("hide")});await p.waitForTimeout(120)}};
 const load=async o=>{await p.goto(BASE);await p.waitForTimeout(600);await p.evaluate(SETUP(o));await p.reload();await p.waitForTimeout(1800);await hide()};
 const snap=n=>p.screenshot({path:path.join(OUT,`dex-${w}-${n}.png`)});
 const clickText=t=>p.evaluate(t=>{const b=[...document.querySelectorAll("#modal button, #menu button, #panel button")].find(x=>x.offsetParent&&x.textContent.trim().startsWith(t));if(b){b.click();return true}return false},t);
 const info=()=>p.evaluate(()=>{const m=document.querySelector("#mbody"),mod=document.querySelector("#modal"),r=mod.getBoundingClientRect(),over=[...m.querySelectorAll("button,.dxc")].filter(e=>{const q=e.getBoundingClientRect();return q.right>innerWidth+1||q.left<-1}).length,small=[...m.querySelectorAll("button")].filter(e=>e.offsetParent&&e.getBoundingClientRect().height<44).map(e=>e.textContent.trim().slice(0,8)),brad=[...m.querySelectorAll("*")].filter(e=>parseFloat(getComputedStyle(e).borderRadius)>0).length;return {title:(m.querySelector("h2")||{}).innerText,sh:m.scrollHeight,ch:m.clientHeight,xo:document.documentElement.scrollWidth>innerWidth,over,small,brad,sum:(m.querySelector("p.mut")||{}).innerText,cells:m.querySelectorAll(".dxc").length}});
 await load({place:"plaza",x:15,y:12});R.log=[];
 await p.evaluate(()=>document.getElementById("menuBtn").click());await p.waitForTimeout(300);await snap("menu");
 await p.evaluate(()=>document.getElementById("dexBtn").click());await p.waitForTimeout(900);R.log.push(["open",await info()]);await snap("col");
 for(const [k,n] of [["造型","wear"],["家具","furn"],["美食","food"],["地點","place"],["鎮民","npc"],["稱號","ttl"],["收藏品","col"]]){await p.evaluate(t=>{[...document.querySelectorAll("#dxT button")].find(b=>b.textContent.trim()==t).click()},k);await p.waitForTimeout(700);R.log.push([k,await info()]);await snap(n)}
 // 未達標按鈕要灰、點了不動作；收藏 50%：mock 有 6 項核心 5 項（c01 c02 k01 got、c03 p01 cafemug 未）→ 不達標
 R.dis=await p.evaluate(()=>[...document.querySelectorAll(".dxC")].map(b=>b.disabled+":"+b.textContent.slice(0,30)));
 // 地點分頁：2 核心 1 已得 → 50% 需 1，可領
 await p.evaluate(()=>{[...document.querySelectorAll("#dxT button")].find(b=>b.textContent.trim()=="地點").click()});await p.waitForTimeout(600);
 R.dis2=await p.evaluate(()=>[...document.querySelectorAll(".dxC")].map(b=>b.disabled+":"+b.textContent.slice(0,30)));
 await p.evaluate(()=>document.querySelector(".dxC:not([disabled])").click());await p.waitForTimeout(1000);R.afterClaim=await info();R.toast=await p.evaluate(()=>(document.querySelector("#toast")||{}).innerText);R.claimed=await p.evaluate(()=>(document.querySelector("#mbody").innerText.match(/已領[^\n]*/)||[""])[0]);await snap("claimed");
 // 成就連結
 await clickText("成就");await p.waitForTimeout(700);R.ach=await info();await snap("ach-link");await clickText("圖鑑");await p.waitForTimeout(700);R.back=await info();
 await ctx.close();
}
await browser.close();srv.close();
console.log(JSON.stringify(out,null,1));
