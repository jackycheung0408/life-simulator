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


let fail=0;const ck=(n,ok,x="")=>{console.log((ok?"OK  ":"FAIL ")+n+" "+x);if(!ok)fail++};
const b2=await chromium.launch({args:["--autoplay-policy=no-user-gesture-required"]});
for(const [name,pre] of [["全新",null],["舊資料 m:0 無 mc",'{"s":1,"m":0,"v":1}'],["明確關過 mc:1 m:0",'{"s":1,"m":0,"v":1,"mc":1}']]){
 const ctx=await b2.newContext({viewport:{width:390,height:844},serviceWorkers:"block",hasTouch:true});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(String(e.message)));
 await p.addInitScript(([pre])=>{try{if(pre&&!sessionStorage.getItem("_s")){sessionStorage.setItem("_s","1");localStorage.setItem("town-snd",pre)}localStorage.setItem("town-tips","1");localStorage.setItem("town-acct-nag",new Date().toDateString());localStorage.setItem("town-ob_1",JSON.stringify({fin:1,sk:1,d:[]}));localStorage.setItem("town-mine",JSON.stringify([{tid:"MOCK01",name:"測試小鎮",rid:1,pin:"1111",me:"阿明",at:Date.now()}]))}catch(e){}},[pre]);
 await p.goto(BASE);await p.waitForTimeout(2500);
 await p.mouse.click(200,300);await p.waitForTimeout(2500);
 const st=await p.evaluate(()=>({g:SFX.get(),run:window.TMUSIC&&TMUSIC.running(),d:window.TMUSIC&&TMUSIC.dbg()}));console.log(name,JSON.stringify(st));
 const want=name=="明確關過 mc:1 m:0"?0:1;ck(name+" 音樂狀態",st.g.m==want&&!!st.run==!!want&&(!want||st.d.themes.length==1),"");
 if(want){await p.evaluate(()=>SFX.music(false));await p.reload();await p.waitForTimeout(2500);await p.mouse.click(200,300);await p.waitForTimeout(1500);const s2=await p.evaluate(()=>({m:SFX.get().m,run:window.TMUSIC&&TMUSIC.running(),ls:localStorage.getItem("town-snd")}));ck(name+" 手動關後重整仍關",s2.m==0&&!s2.run,JSON.stringify(s2))}
 ck(name+" 無 pageerror",errs.length==0,errs.join(";"));await ctx.close()}
await b2.close();await browser.close();srv.close();process.exit(fail?1:0);
