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
 const clickText=async(t,scope="#panel,#modal")=>p.evaluate(([t,sc])=>{const b=[...document.querySelectorAll(sc.split(",").map(s=>s+" button").join(","))].find(x=>x.offsetParent&&x.textContent.includes(t));if(b){b.click();return true}return false},[t,scope]);
 const snap=n=>p.screenshot({path:path.join(OUT,`fix-rest-${w}-${n}.png`)});
 const status=()=>p.evaluate(()=>({toast:(document.querySelector("#toast")||{}).innerText,needs:(document.querySelector("#needs")||{}).innerText.replace(/\n/g," ").slice(0,120)}));
 // 長椅
 await load({place:"street",x:14,y:5});R.bench=[];
 for(let i=1;i<=6;i++){const c=await clickText("坐一下");await p.waitForTimeout(1800);R.bench.push({i,c,...await status()});if(i==3||i==6)await snap("bench-"+i)}
 // 垃圾桶
 await load({place:"street",x:8,y:14,energy:50});R.trash=[];
 for(let i=1;i<=4;i++){const c=await clickText("撿垃圾");await p.waitForTimeout(i==4?200:1800);if(i==4)await p.waitForFunction(()=>/已經/.test((document.querySelector("#toast")||{}).innerText||""),null,{timeout:9000}).catch(()=>{});R.trash.push({i,c,...await status()});if(i==4)await snap("trash-4")}
 await load({place:"street",x:34,y:5,energy:50});R.mail=[];
 for(let i=1;i<=4;i++){const c=await clickText("查信箱");await p.waitForTimeout(i==4?200:1800);if(i==4)await p.waitForFunction(()=>/已經/.test((document.querySelector("#toast")||{}).innerText||""),null,{timeout:9000}).catch(()=>{});R.mail.push({i,c,...await status()});if(i==4)await snap("mail-4")}
 // 我的人生
 await load({place:"street",x:15,y:12,energy:50});
 await p.evaluate(()=>document.querySelector("#menuBtn").click());await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector("#life").click());await p.waitForTimeout(900);
 R.life=await p.evaluate(()=>{const b=document.querySelector("#mbody");return {text:b.innerText.slice(0,1800),sw:b.scrollWidth>b.clientWidth+1,bad:/冷卻|9 分鐘/.test(b.innerText)}});
 await snap("life-top");await p.evaluate(()=>{const b=document.querySelector("#mbody");b.scrollTop=700});await p.waitForTimeout(200);await snap("life-mid");
 await p.evaluate(()=>{const b=document.querySelector("#mbody");b.scrollTop=99999});await p.waitForTimeout(200);await snap("life-bot");
 // 打地鼠
 await load({place:"plaza",x:16,y:12,energy:50});
 R.arcade=await p.evaluate(()=>[...document.querySelectorAll("#panel button")].filter(x=>x.offsetParent).map(x=>x.innerText.trim().slice(0,12)));
 R.arcade1=await clickText("街機");await p.waitForTimeout(700);await snap("arcade-menu");
 R.solo=await clickText("單機");await p.waitForTimeout(500);R.whack=await clickText("打地鼠");await p.waitForTimeout(500);await snap("whack-ready");
 await clickText("開始","#modal");await p.waitForTimeout(3000);
 for(let i=0;i<8;i++){await p.evaluate(()=>{const u=document.querySelector(".hole.up");if(u)u.click()});await p.waitForTimeout(400)}
 await snap("whack-play");await p.waitForTimeout(28000);await snap("whack-end");R.whackEnd=await p.evaluate(()=>(document.querySelector("#gShow")||{}).innerText);
 await ctx.close();
}
await browser.close();srv.close();
fs.writeFileSync(path.join(OUT,"fix-rest.json"),JSON.stringify(out,null,1));for(const w in out){const o=out[w];console.log(w,"errs",o.errs,"\nbench",o.bench.map(x=>x.needs.split(" ")[1]).join(","),"\ntrash4",o.trash[3].toast,"\nmail4",o.mail[3].toast,"\nresp",o.resp.join(" | "),"\nwhackEnd",o.whackEnd)};
