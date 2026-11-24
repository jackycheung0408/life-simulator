import {chromium} from "playwright";import http from "node:http";import {execSync} from "node:child_process";import fs from "node:fs";import path from "node:path";import os from "node:os";import {fileURLToPath} from "node:url";
const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,"../.."),args=process.argv.slice(2);
const CAS0=r=>{r.place="casino";r.x=68;r.y=14;r.items.fi="casino";r.items.cas={ch:20000,bh:""};r.money=5000};
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


const browser=await chromium.launch();
const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:"block",hasTouch:true});
const out=[];
for(let run=0;run<3;run++){
const p=await ctx.newPage();
await p.addInitScript(()=>{try{localStorage.setItem("town-tips","1");localStorage.setItem("town-mine",JSON.stringify([{tid:"MOCK01",name:"x",rid:1,pin:"1111",me:"a",at:Date.now()}]))}catch(e){}});
await p.goto(BASE);await p.waitForSelector("#acts button,#panel",{timeout:8000}).catch(()=>{});await p.waitForTimeout(800);
await p.evaluate(m=>{const db=JSON.parse(sessionStorage.getItem("mockdb"));const r=db.res.find(x=>x.id==1);r.items=r.items||{};r.items.tr=[];r.items.wish={k:"none",m:0};r.items.at={init:1,st:0,ag:0,ch:0,iq:0,lk:0};eval("("+m+")")(r);sessionStorage.setItem("mockdb",JSON.stringify(db))},CAS0.toString());
await p.reload();await p.waitForTimeout(1500);
for(let i=0;i<5;i++){await p.waitForTimeout(400);if(!await p.evaluate(()=>!document.querySelector("#modal").classList.contains("hide")))break;await p.evaluate(()=>document.querySelector("#modal").classList.add("hide"))}
const h=await p.evaluateHandle(()=>[...document.querySelectorAll("#acts button,#mbody button")].find(b=>b.offsetParent&&b.textContent.includes("百家樂")));await h.asElement().click();await p.waitForTimeout(800);
const cdp=await ctx.newCDPSession(p);await cdp.send("Emulation.setCPUThrottlingRate",{rate:+(process.env.CPU||4)});
await p.evaluate(()=>{window.__f=[];let l=performance.now();const t=n=>{window.__f.push(n-l);l=n;requestAnimationFrame(t)};requestAnimationFrame(t);window.__lt=[];try{new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__lt.push(e.duration))).observe({type:"longtask",buffered:false})}catch(e){}});
await p.click("[data-b=p]");await p.waitForTimeout(9000);
const r=await p.evaluate(()=>{const f=window.__f.slice(5);const s=f.slice().sort((a,b)=>a-b);return{n:f.length,max:Math.max(...f),p95:s[Math.floor(s.length*.95)],jank:f.filter(x=>x>33).length,pct:+(100*f.filter(x=>x>33).length/f.length).toFixed(1),longtasks:window.__lt.length,ltmax:Math.max(0,...window.__lt)}});
out.push(r);console.log(JSON.stringify(r));await p.close()}
await browser.close();srv.close();
