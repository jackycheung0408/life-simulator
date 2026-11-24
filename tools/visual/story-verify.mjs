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
const L=[];const out={};
for(const [w,h] of [[390,844],[375,667]]){
 const ctx=await browser.newContext({viewport:{width:w,height:h},serviceWorkers:"block",hasTouch:true});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(String(e.message).slice(0,160)));
 await p.addInitScript(()=>{try{localStorage.setItem("town-tips","1");localStorage.setItem("town-acct-nag",new Date().toDateString());localStorage.setItem("town-ob_1",JSON.stringify({fin:1,sk:1,d:[]}));localStorage.setItem("town-mine",JSON.stringify([{tid:"MOCK01",name:"測試小鎮",rid:1,pin:"1111",me:"阿明",at:Date.now()}]))}catch(e){}});
 p.on("console",m=>{if(m.type()=="error")L.push(w+" CONSOLE "+m.text().slice(0,200))});p.on("requestfailed",q=>L.push(w+" REQFAIL "+q.url().slice(-60)));const log=(a,b)=>{L.push(w+" "+a+" => "+b);console.log(w+" "+a+" => "+String(b).slice(0,200))};
 const snap=n=>p.screenshot({path:path.join(OUT,`story-${w}-${n}.png`)});
 const mq=()=>p.evaluate(()=>{const r=JSON.parse(sessionStorage.getItem("mockdb")).res.find(x=>x.id==1);return r.items.mq||null});
 const it=()=>p.evaluate(()=>JSON.parse(sessionStorage.getItem("mockdb")).res.find(x=>x.id==1).items);
 const hide=async()=>{await p.evaluate(()=>{const u=document.querySelector("#upd");if(u)u.classList.add("hide")})};
 const load=async o=>{await p.goto(BASE);await p.waitForTimeout(600);await p.evaluate(SETUP(o));await p.reload();await p.waitForTimeout(1800);await hide()};
 const dbset=f=>p.evaluate(f=>{const db=JSON.parse(sessionStorage.getItem("mockdb"));const r=db.res.find(x=>x.id==1);new Function("r",f)(r);sessionStorage.setItem("mockdb",JSON.stringify(db))},f);
 const clickT=t=>p.evaluate(t=>{const b=[...document.querySelectorAll("#modal button, #menu button, #panel button, #stbar button")].find(x=>x.offsetParent&&x.textContent.trim().startsWith(t));if(b){b.click();return true}return false},t);
 const modalTxt=()=>p.evaluate(()=>{const m=document.querySelector("#modal");return m.classList.contains("hide")?"(closed)":m.querySelector("#mbody").innerText.replace(/\s+/g," ").slice(0,140)});
 const scene=async(tag)=>{let n=0;await snap(tag+"-1");for(let i=0;i<12;i++){const nx=await p.evaluate(()=>{const b=document.querySelector("#stn");if(!b)return null;return b.textContent});if(!nx)break;n++;await p.waitForTimeout(80);await p.evaluate(()=>{document.querySelector("#stn").click()});await p.waitForTimeout(60);const t=await p.evaluate(()=>{const b=document.querySelector("#stn");return b?b.textContent:null});if(i==1)await snap(tag+"-2");await p.evaluate(()=>{const b=document.querySelector("#stn");if(b)b.click()});await p.waitForTimeout(80)}return n};
 const tapOK=async()=>p.evaluate(()=>{const bs=[...document.querySelectorAll("#modal button")].filter(b=>b.offsetParent);const small=bs.filter(b=>{const r=b.getBoundingClientRect();return r.height<43||r.width<43}).map(b=>b.textContent.trim()+":"+Math.round(b.getBoundingClientRect().height));const ov=bs.some(b=>b.getBoundingClientRect().right>innerWidth+1);return small.join("|")+(ov?" OVERFLOW":"")});
 // === 開始 ===
 await load({place:"street",x:15,y:12});
 await p.evaluate(()=>document.getElementById("menuBtn").click());await p.waitForTimeout(300);await clickT("主線");await p.waitForTimeout(600);log("modal",await modalTxt());log("tap",await tapOK());await snap("modal0");
 await p.evaluate(()=>{const m=document.querySelector("#modal"),o=Element.prototype.add;const d=DOMTokenList.prototype.add;DOMTokenList.prototype.add=function(...a){if(this===m.classList&&a.includes("hide"))window.__hs=(window.__hs||[]).concat(new Error().stack.split("\n").slice(2,6).join(" < "));return d.apply(this,a)}});await clickT("開始第 1 章");for(const d of [50,300,800]){await p.waitForTimeout(d);log("t"+d,(await modalTxt()).slice(0,30)+" | toast="+await p.evaluate(()=>(document.querySelector("#toast")||{}).innerText))}log("intro1",await modalTxt());log("tap",await tapOK());
 await snap("intro");
 for(let i=0;i<8;i++){const done=await p.evaluate(()=>!document.querySelector("#stn"));if(done)break;await p.evaluate(()=>document.querySelector("#stn")&&document.querySelector("#stn").click());await p.waitForTimeout(150);await p.evaluate(()=>document.querySelector("#stn")&&document.querySelector("#stn").click());await p.waitForTimeout(150)}
 await p.waitForTimeout(500);log("mq after start",JSON.stringify(await mq()));
 log("DBG",JSON.stringify(await p.evaluate(()=>window.__st())));log("DBG2",await p.evaluate(()=>window.__dbg()));await p.waitForTimeout(300);log("m",await modalTxt());log("HS",JSON.stringify(await p.evaluate(()=>window.__hs)));log("bar",await p.evaluate(()=>{const b=document.getElementById("stbar");return b?b.innerText.replace(/\s+/g," "):"(no bar)"}));await snap("bar");
 // === 1.1 市政廳對話：不在市政廳按到 talk 不算（透過 UI 無法，直接測 RPC）→ 移到市政廳 ===
 await dbset("r.place='townhall';r.x=68;r.y=5;r.items.fi='townhall'");await p.reload();await p.waitForTimeout(2000);await hide();await snap("townhall");
 const rpcT=(op,id,choice)=>p.evaluate(async([op,id,choice])=>{const r=await fetch("/rest/v1/rpc/town_story",{method:"POST",body:JSON.stringify({rid:1,pin:"1111",op,id,choice})});return r.status+" "+(await r.text()).slice(0,90)},[op,id,choice]);
 const clickI=t=>p.evaluate(t=>{const b=[...document.querySelectorAll("#modal button, #panel button, #stbar button")].find(x=>x.offsetParent&&x.textContent.includes(t));if(b){b.click();return true}return false},t);
 const playAll=async(tag)=>{let n=0;for(let i=0;i<20;i++){const has=await p.evaluate(()=>!!(document.querySelector("#stn")&&document.querySelector("#stn").offsetParent));if(!has)break;if(n==0){await snap(tag+"-s1");log(tag+" tap",await tapOK())}n++;if(n==2)await snap(tag+"-s2");await p.evaluate(()=>{const b=document.querySelector("#stn");b&&b.offsetParent&&b.click()});await p.waitForTimeout(90);await p.evaluate(()=>{const b=document.querySelector("#stn");b&&b.offsetParent&&b.click()});await p.waitForTimeout(90)}return n};
 const waitScene=async(ms)=>{for(let t=0;t<ms/250;t++){if(await p.evaluate(()=>!!(document.querySelector("#stn")&&document.querySelector("#stn").offsetParent)))return true;await p.waitForTimeout(250)}return false};
 const closeM=()=>p.evaluate(()=>document.querySelector("#modal").classList.add("hide"));
 const reloadAt=async f=>{await dbset(f);await p.reload();await p.waitForTimeout(2200);await hide()};
 // 防跳關：現在是 1.1，不能做選擇、不能領
 log("choose早",await rpcT("choose","c1","a"));log("claim早",await rpcT("claim","1"));log("talk在街上(此時 place=street)",await rpcT("talk","townhall"));
 // 1.1：到市政廳（先暫停一次，暫停中點陳櫃員不推進）
 await reloadAt("r.place='townhall';r.x=68;r.y=5;r.items.fi='townhall';r.items.mq.p=1");
 log("暫停bar",await p.evaluate(()=>document.getElementById("stbar")?"有":"無"));
 await p.mouse.click(180,272);await p.waitForTimeout(900);log("暫停中 talk 後 t",JSON.stringify((await mq()).t));await closeM();
 await dbset("r.items.mq.p=0");await p.reload();await p.waitForTimeout(2200);await hide();
 await p.mouse.click(180,272);await p.waitForTimeout(900);log("npc modal",await modalTxt());log("1.1 t",JSON.stringify((await mq()).t));await snap("npc");await closeM();
 log("1.1 後等對話",await waitScene(6000));log("1.1 對話場數",await playAll("d11"));
 await p.waitForTimeout(600);log("bar 1.2",await p.evaluate(()=>{const b=document.getElementById("stbar");return b?b.innerText.replace(/\s+/g," "):"(no bar)"}));await snap("bar12");
 // 1.2 咖啡廳：先在餐廳做咖啡（不算），再到咖啡廳點特調
 await reloadAt("r.place='cafe';r.x=38;r.y=5;r.items.fi='cafe'");
 log("1.2 按鈕",await clickI("特調"));await p.waitForTimeout(1200);log("1.2 t",JSON.stringify((await mq()).t));
 log("1.2 對話",await waitScene(6000));log("1.2 對話場數",await playAll("d12"));
 // 1.3 餐廳
 await reloadAt("r.place='restaurant';r.x=5;r.y=14;r.items.fi='restaurant'");
 log("1.3 按鈕",await clickI("特餐"));await p.waitForTimeout(1200);log("1.3 t",JSON.stringify((await mq()).t));
 log("1.3 對話",await waitScene(6000));log("1.3 對話場數",await playAll("d13"));
 // 1.4 不在家不彈；回家彈出選擇
 await p.waitForTimeout(3000);log("非家 modal",await modalTxt());log("bar 1.4",await p.evaluate(()=>{const b=document.getElementById("stbar");return b?b.innerText.replace(/\s+/g," "):"(no bar)"}));
 log("早 choose(不在家)",await rpcT("choose","c1","a"));
 await reloadAt("r.place='home:1';r.x=2;r.y=11;r.items.dr=0");
 log("choose 場景",await waitScene(1)||await (async()=>{for(let i=0;i<20;i++){const m=await modalTxt();if(/怎麼辦/.test(m))return m;await p.waitForTimeout(300)}return "none"})());await snap("choice");log("tap",await tapOK());
 log("非法選項",await rpcT("choose","c1","z"));
 await clickI(w==390?"馬上拆開":"先洗澡再看");await p.waitForTimeout(900);log("choice 後 mq",JSON.stringify(await mq()));log("反應場數",await playAll("react"));
 log("claim 場景",await waitScene(8000));log("outro 場數",await playAll("outro"));
 await p.waitForTimeout(900);log("clear modal",await modalTxt());await snap("clear");log("tap",await tapOK());
 await clickI("繼續下一章");await p.waitForTimeout(900);
 const f=await it();log("結果",JSON.stringify({ch:f.mq.ch,dn:f.mq.dn,n:f.mq.n,titles:f.titles,snack:f.snack,w:f.w}));
 const mny=await p.evaluate(()=>JSON.parse(sessionStorage.getItem("mockdb")).res.find(x=>x.id==1).money);log("錢",mny+"（應 100000）");
 log("重領",await rpcT("claim","1"));
 // 第 2 章 intro 與 modal（進行中、已完成章）
 log("第2章 intro",await waitScene(5000));log("intro2 場數",await playAll("intro2"));
 await p.evaluate(()=>document.getElementById("menuBtn").click());await p.waitForTimeout(300);await clickT("主線");await p.waitForTimeout(700);log("modal 進行中",await modalTxt());await snap("modal1");log("tap",await tapOK());
 log("重看",await clickT("重看劇情"));await p.waitForTimeout(500);log("重看場數",await playAll("replay"));
 await p.waitForTimeout(500);
 out[w]={errs,L};
 await ctx.close();
}
await browser.close();srv.close();
console.log(L.join("\n"));console.log(JSON.stringify(Object.values(out).map(o=>o.errs)));
