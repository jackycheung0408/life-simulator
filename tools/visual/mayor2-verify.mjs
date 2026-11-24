// 鎮長管理權第二批的手機畫面實測：node mayor2-verify.mjs；截圖在 out/<日期>/mayor2-*.png，結果列在最後
import {chromium} from "playwright";
import http from "node:http";import fs from "node:fs";import path from "node:path";import os from "node:os";
import {fileURLToPath} from "node:url";
const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,"../..");
const OUT=path.join(HERE,"out",new Date().toISOString().slice(0,10));fs.mkdirSync(OUT,{recursive:true});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"townm2-"));fs.cpSync(path.join(ROOT,"town"),tmp,{recursive:true});
fs.copyFileSync(path.join(ROOT,"tools/town-mock.js"),path.join(tmp,"mock.js"));
let html=fs.readFileSync(path.join(tmp,"index.html"),"utf8");html=html.replace(/<head[^>]*>/,m=>m+'<script src="mock.js"></script>');fs.writeFileSync(path.join(tmp,"index.html"),html);
const MIME={".html":"text/html",".js":"text/javascript",".json":"application/json",".woff2":"font/woff2",".css":"text/css",".png":"image/png",".svg":"image/svg+xml"};
const srv=http.createServer((q,s)=>{let f=path.join(tmp,decodeURIComponent(q.url.split("?")[0]));if(f.endsWith("/"))f+="index.html";fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);return s.end()}s.writeHead(200,{"content-type":MIME[path.extname(f)]||"application/octet-stream","cache-control":"no-store"});s.end(d)})});
await new Promise(r=>srv.listen(0,r));const BASE=`http://localhost:${srv.address().port}/index.html?t=MOCK01`;
const L=[],ck=(k,v,m)=>{L.push(`${v?"OK ":"NG "}${k}${m?"："+m:""}`)};
const br=await chromium.launch();
async function run(w,h,rid){
 const tag=`${w}x${h}${rid==1?"":"-officer"}`,ctx=await br.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,hasTouch:true,isMobile:true}),p=await ctx.newPage(),errs=[];
 p.on("pageerror",e=>errs.push(String(e.message).slice(0,150)));p.on("console",m=>{if(m.type()=="error"&&!/Failed to load resource|favicon/.test(m.text()))errs.push(m.text().slice(0,150))});
 await p.addInitScript(rid=>{try{localStorage.setItem("town-tips","1");localStorage.setItem("town-acct-nag",new Date().toDateString());localStorage.setItem("town-mine",JSON.stringify([{tid:"MOCK01",name:"測試小鎮",rid,pin:"1111",me:"x",at:Date.now()}]))}catch(e){}},rid);
 await p.goto(BASE);await p.waitForSelector("#acts button,#panel",{timeout:8000}).catch(()=>{});await p.waitForTimeout(800);
 await p.evaluate(rid=>{const db=JSON.parse(sessionStorage.getItem("mockdb"));db.res.forEach(r=>{r.items=r.items||{};r.items.tr=[];r.items.wish={k:"none",m:0};r.items.at={init:1,st:0,ag:0,ch:0,iq:0,lk:0};r.place="street";r.x=15;r.y=12});
  if(rid==2){db.pw={MOCK01:{off:[],log:[],vote:null,hist:[],officers:{sheriff:{id:2,name:"小美",until:new Date(Date.now()+2*864e5).toISOString()},treasurer:{id:3,name:"阿華",until:new Date(Date.now()+2*864e5).toISOString()}}}}}
  db.towns.MOCK01.fund=60000;sessionStorage.setItem("mockdb",JSON.stringify(db))},rid);
 await p.reload();await p.waitForTimeout(1200);
 for(let i=0;i<5;i++){await p.waitForTimeout(400);const open=await p.evaluate(()=>!document.querySelector("#modal").classList.contains("hide"));if(!open)break;await p.evaluate(()=>document.querySelector("#modal").classList.add("hide"))}
 const shot=n=>p.screenshot({path:path.join(OUT,`mayor2-${tag}-${n}.png`)});
 const btns=()=>p.evaluate(()=>[...document.querySelectorAll("#mbody button")].filter(b=>b.offsetParent).map(b=>({t:b.textContent.replace(/\s+/g," ").trim(),dis:!!b.dataset.dis||parseFloat(b.style.opacity)==0.45,h:Math.round(b.getBoundingClientRect().height)})));
 const click=async re=>{const ok=await p.evaluate(s=>{const b=[...document.querySelectorAll("#mbody button")].filter(b=>b.offsetParent).find(b=>new RegExp(s).test(b.textContent));if(b){b.scrollIntoView({block:"center"});b.click();return true}return false},re.source);await p.waitForTimeout(700);return ok};
 const db=()=>p.evaluate(()=>JSON.parse(sessionStorage.getItem("mockdb")));
 const open=async()=>{await p.evaluate(()=>document.querySelector("#modal").classList.add("hide"));await p.click("#menuBtn");await p.waitForTimeout(200);await p.click("#powBtn");await p.waitForTimeout(900)};
 const overflow=()=>p.evaluate(()=>{const m=document.querySelector("#mbody");return m.scrollWidth>m.clientWidth+2||document.documentElement.scrollWidth>innerWidth+2});
 await open();await shot("0-list");
 const b0=await btns();ck(tag+" 清單有新權力",["全鎮活動","任命官員","全民紅包","搬設施"].every(n=>b0.some(b=>b.t.includes(n))));
 ck(tag+" 無橫向溢出",!(await overflow()));ck(tag+" 按鈕高度≥44",b0.filter(b=>/全鎮活動|任命官員|全民紅包|搬設施/.test(b.t)).every(b=>b.h>=44),JSON.stringify(b0.filter(b=>/全鎮活動|任命官員|全民紅包|搬設施/.test(b.t)).map(b=>b.h)));
 if(rid==1){
  // A 全鎮活動
  await click(/^全鎮活動/);await shot("1-event");let b=await btns();ck("活動選單三種＋費用",b.filter(x=>/市集日|慶典|煙火夜/.test(x.t)).length==3&&b.some(x=>/\$[\d,]+/.test(x.t)),JSON.stringify(b.map(x=>x.t)));
  await click(/煙火夜/);await shot("2-after-event");let d=await db();ck("煙火夜發動：基金 −2800（7 人 ×1.4）、world=fireworks",d.towns.MOCK01.fund==60000-2800&&d.pw.MOCK01.world&&d.pw.MOCK01.world.k=="fireworks",`fund=${d.towns.MOCK01.fund} ${JSON.stringify(d.pw.MOCK01.world)}`);
  b=await btns();const ev=b.find(x=>x.t.startsWith("全鎮活動"));ck("事件進行中全鎮活動灰掉並寫原因",ev&&ev.dis&&ev.t.includes("已有全鎮事件進行中"),ev&&ev.t);
  await p.evaluate(()=>{const d=JSON.parse(sessionStorage.getItem("mockdb"));d.pw.MOCK01.world=null;sessionStorage.setItem("mockdb",JSON.stringify(d))});
  // B 任命
  await click(/^任命官員/);await shot("3-appoint");b=await btns();ck("任命選單：警長／財務官",b.some(x=>x.t.includes("任命警長"))&&b.some(x=>x.t.includes("任命財務官")),JSON.stringify(b.map(x=>x.t)));
  await click(/^任命警長/);await shot("4-pick");await click(/小美/);d=await db();ck("任命警長小美",d.pw.MOCK01.officers.sheriff&&d.pw.MOCK01.officers.sheriff.name=="小美");
  await shot("5-after-appoint");await click(/^任命官員/);await click(/^任命財務官/);b=await btns();const xm=b.find(x=>x.t.startsWith("小美"));ck("一人一職：小美在財務官名單灰掉",xm&&xm.dis&&xm.t.includes("已經擔任另一個官職"),xm&&xm.t);
  await click(/阿華/);d=await db();ck("任命財務官阿華",d.pw.MOCK01.officers.treasurer&&d.pw.MOCK01.officers.treasurer.name=="阿華");
  await shot("6-officers-section");
  // C 紅包
  await click(/^全民紅包/);await shot("7-payout");b=await btns();ck("紅包 4 檔，15%／20% 交投票",b.filter(x=>/基金 \d+%/.test(x.t)).length==4&&b.filter(x=>x.t.includes("交居民投票")).length==2,JSON.stringify(b.map(x=>x.t)));
  // 15% 投票先做（發起投票也算今天那 1 次的檢查，但沒通過前不記次數）
  await click(/基金 15%/);await shot("8-vote");let d2=await db();ck("15% 建立投票",d2.pw.MOCK01.vote&&d2.pw.MOCK01.vote.k=="payout");
  const bt=await p.evaluate(()=>document.querySelector("#mbody").textContent);ck("投票卡寫『全民紅包：基金 15%』",bt.includes("全民紅包：基金 15%"));
  await p.evaluate(()=>{const d=JSON.parse(sessionStorage.getItem("mockdb"));d.pw.MOCK01.vote=null;sessionStorage.setItem("mockdb",JSON.stringify(d))});
  await click(/^關閉/);await open();await click(/^全民紅包/);
  const f0=(await db()).towns.MOCK01.fund,m0=(await db()).res.reduce((t,x)=>t+x.money,0);
  await click(/基金 10%/);d=await db();const per=Math.min(2000,Math.floor(f0*.1/7));ck("紅包 10%：每人 "+per+"，基金與現金守恆",d.towns.MOCK01.fund==f0-per*7&&d.res.reduce((t,x)=>t+x.money,0)==m0+per*7,`fund ${f0}→${d.towns.MOCK01.fund}`);
  await shot("9-after-payout");b=await btns();const pb=b.find(x=>x.t.startsWith("全民紅包"));ck("發完後全民紅包灰掉（3 天一次）",pb&&pb.dis&&pb.t.includes("今天用完了"),pb&&pb.t);
  // D 搬設施
  await p.evaluate(()=>{const d=JSON.parse(sessionStorage.getItem("mockdb"));d.pw.MOCK01.vote=null;sessionStorage.setItem("mockdb",JSON.stringify(d))});
  await open();b=await btns();const rl=b.find(x=>x.t.startsWith("搬設施"));ck("搬設施按鈕可按（FEATS 開）",rl&&!rl.dis,rl&&rl.t);
  await click(/^搬設施/);await p.waitForTimeout(500);await shot("10-relocate");const modalHidden=await p.evaluate(()=>document.querySelector("#modal").classList.contains("hide"));ck("搬設施：關視窗並走去不動產公司",modalHidden);
  await open();await p.evaluate(()=>{const m=document.querySelector("#mbody");m.scrollTop=m.scrollHeight});await shot("11-log");
  const lg=await p.evaluate(()=>document.querySelector("#mbody").textContent);ck("紀錄文字：發動煙火夜／任命警長／每人紅包",lg.includes("發動煙火夜")&&lg.includes("任命警長")&&lg.includes("每人 $"),"");
 } else {
  const sec=await p.evaluate(()=>document.querySelector("#mbody").textContent);ck("官員區塊顯示警長與財務官與辭職鈕",sec.includes("警長")&&sec.includes("小美")&&sec.includes("財務官")&&sec.includes("辭職"));
  let b=await btns();const j=b.find(x=>x.t.startsWith("關進監獄")),g=b.find(x=>x.t.startsWith("發補助")),e=b.find(x=>x.t.startsWith("全鎮活動"));
  ck("警長可用關進監獄、標「警長代行」",j&&!j.dis&&j.t.includes("警長代行"),j&&j.t);ck("警長不能用發補助／全鎮活動",g&&g.dis&&e&&e.dis,`${g&&g.dis} ${e&&e.dis}`);
  await shot("1-officer-list");
  await click(/^關進監獄/);await shot("2-officer-pick");
  await click(/阿傑/);b=await btns();ck("警長選單只到 60 分鐘",!b.some(x=>/2 小時/.test(x.t))&&b.some(x=>/1 小時/.test(x.t)),JSON.stringify(b.map(x=>x.t)));await shot("3-officer-time");
  await click(/30 分鐘/);let d=await db();ck("警長關人成功、紀錄 via=sheriff",d.pw.MOCK01.log.some(e=>e.k=="jail"&&e.via=="sheriff"),JSON.stringify(d.pw.MOCK01.log.map(e=>e.via)));
  await shot("4-officer-after");b=await btns();const j2=b.find(x=>x.t.startsWith("關進監獄"));ck("警長今天用過後灰掉",j2&&j2.dis&&j2.t.includes("今天已經用過"),j2&&j2.t);
  const lg=await p.evaluate(()=>document.querySelector("#mbody").textContent);ck("紀錄標（警長）",lg.includes("（警長）"));
  await click(/辭職/);await shot("5-resigned");d=await db();ck("警長辭職",!d.pw.MOCK01.officers.sheriff||Date.parse(d.pw.MOCK01.officers.sheriff.until)<Date.now()===false?!d.pw.MOCK01.officers.sheriff:true);
 }
 ck(tag+" 無 console／pageerror",errs.length==0,errs.join(" | "));
 await ctx.close();
}
for(const [w,h] of [[390,844],[375,667]]){await run(w,h,1);}
await run(390,844,2);await run(375,667,2);
await br.close();srv.close();
console.log(L.join("\n"));console.log("截圖資料夾",OUT);
