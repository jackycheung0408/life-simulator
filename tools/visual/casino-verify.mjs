// 賭場修復實測（Playwright 手機模擬 + mock）：node casino-verify.mjs [尺寸 390x844]
import {chromium} from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {fileURLToPath} from "node:url";
const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,"../..");
const only=process.argv[2];
const SIZES=[[390,844],[375,667]].filter(s=>!only||only==s.join("x"));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"cv-"));
fs.cpSync(path.join(ROOT,"town"),tmp,{recursive:true});
fs.copyFileSync(path.join(ROOT,"tools/town-mock.js"),path.join(tmp,"mock.js"));
let html=fs.readFileSync(path.join(tmp,"index.html"),"utf8");
html=html.replace(/<head[^>]*>/,m=>m+'<script src="mock.js"></script>');fs.writeFileSync(path.join(tmp,"index.html"),html);
const MIME={".html":"text/html",".js":"text/javascript",".json":"application/json",".woff2":"font/woff2",".css":"text/css",".png":"image/png",".svg":"image/svg+xml"};
const srv=http.createServer((q,s)=>{let f=path.join(tmp,decodeURIComponent(q.url.split("?")[0]));if(f.endsWith("/"))f+="index.html";fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);return s.end()}s.writeHead(200,{"content-type":MIME[path.extname(f)]||"application/octet-stream"});s.end(d)})});
await new Promise(r=>srv.listen(0,r));const BASE=`http://localhost:${srv.address().port}/index.html?t=MOCK01`;
const date=new Date().toISOString().slice(0,10),OUT=path.join(HERE,"out",date);fs.mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch();const log=[];const say=(...a)=>{const s=a.join(" ");log.push(s);console.log(s)};
async function mk(w,h,chips=20000,cash=5000){
 const ctx=await browser.newContext({viewport:{width:w,height:h},serviceWorkers:"block",hasTouch:true});const p=await ctx.newPage();const errs=[];
 p.on("pageerror",e=>errs.push(e.message));p.on("console",m=>{if(m.type()=="error"&&!/Failed to load|favicon/.test(m.text()))errs.push(m.text())});p.__errs=errs;
 await p.addInitScript(()=>{try{localStorage.setItem("town-tips","1");localStorage.setItem("town-mine",JSON.stringify([{tid:"MOCK01",name:"測試小鎮",rid:1,pin:"1111",me:"阿明",at:Date.now()}]))}catch(e){}});
 await p.goto(BASE);await p.waitForSelector("#panel",{timeout:8000}).catch(()=>{});await p.waitForTimeout(800);
 await p.evaluate(([ch,cash])=>{const db=JSON.parse(sessionStorage.getItem("mockdb")),r=db.res.find(x=>x.id==1);r.items=r.items||{};r.items.tr=[];r.items.wish={k:"none",m:0};r.items.at={init:1,st:0,ag:0,ch:0,iq:0,lk:0};r.place="casino";r.x=68;r.y=14;r.items.fi="casino";r.items.cas={ch,bh:""};r.money=cash;sessionStorage.setItem("mockdb",JSON.stringify(db))},[chips,cash]);
 await p.reload();await p.waitForTimeout(1200);
 for(let i=0;i<5;i++){await p.waitForTimeout(400);const o=await p.evaluate(()=>!document.querySelector("#modal").classList.contains("hide"));if(!o)break;await p.evaluate(()=>document.querySelector("#modal").classList.add("hide"))}
 await p.evaluate(()=>{for(const id of["upd","tips"]){const u=document.getElementById(id);if(u)u.classList.add("hide")}});
 return p}
const ct=async(p,t)=>{const h=await p.evaluateHandle(t=>[...document.querySelectorAll("#mbody button,#acts button,#mainrow button,#ptabs button,#menu button")].find(b=>b.offsetParent&&b.textContent.includes(t)),t);const el=h.asElement();if(!el)return false;await el.evaluate(b=>b.click());return true};
const shot=(p,n)=>p.screenshot({path:path.join(OUT,n+".png")});
const open=async(p,t)=>{await ct(p,"小豬賭場");await p.waitForTimeout(500);await ct(p,t);await p.waitForTimeout(700)};
const closeM=p=>p.evaluate(()=>{document.querySelector("#modal").classList.add("hide")});
const reopen=async(p,t)=>{await closeM(p);await p.waitForTimeout(200);await open(p,t)};
const count=p=>p.evaluate(()=>{window.__c={};const f=window.fetch;window.fetch=(u,o)=>{try{const b=JSON.parse(o.body||"{}");if(b.game)window.__c[b.game]=(window.__c[b.game]||0)+1}catch(e){}return f(u,o)}});
const rect=(p,sel)=>p.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return null;const r=e.getBoundingClientRect();return{y:Math.round(r.y),h:Math.round(r.height),b:Math.round(r.bottom)}},sel);
for(const [w,h] of SIZES){const T=`${w}x${h}`;say(`\n===== ${T} =====`);if(process.env.DBG){const p=await mk(w,h);await ct(p,"小豬賭場");await p.waitForTimeout(800);say(await p.evaluate(()=>[...document.querySelectorAll("#mbody button")].map(b=>b.textContent.trim().slice(0,12)).join("|")));await shot(p,"dbg-menu");say(JSON.stringify(await p.evaluate(()=>{const b=[...document.querySelectorAll("#mbody button")].find(b=>b.textContent.includes("百家樂"));const r=b.getBoundingClientRect();const e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return [b.dataset.g,r.x,r.y,r.width,r.height,e.className,e.dataset.g||e.parentElement.dataset.g]})));continue;await p.waitForTimeout(800);say(await p.evaluate(()=>document.querySelector("#mbody").innerText.slice(0,200)));await shot(p,"dbg-bacc");continue}
 // 1 21 點關畫面續玩
 {const p=await mk(w,h);await open(p,"21點");await p.click("#bjGo");await p.waitForTimeout(900);
  await p.click("#bjSpl");await p.waitForTimeout(700);
  const before=await p.evaluate(()=>({hands:document.querySelectorAll(".bjh").length,chips:document.getElementById("gMoney").textContent}));
  await reopen(p,"21點");await p.waitForTimeout(900);
  const after=await p.evaluate(()=>({hands:document.querySelectorAll(".bjh").length,hit:!!document.getElementById("bjHit"),go:!!document.getElementById("bjGo"),chips:document.getElementById("gMoney").textContent}));
  say("[1 bj 續玩]",JSON.stringify(before),"→",JSON.stringify(after),after.hands==before.hands&&after.hit&&!after.go&&after.chips==before.chips?"✅":"❌");await shot(p,`fix-bj-resume-${T}`);
  // 另一台裝置開新局 → 導回
  await p.evaluate(()=>{});say("  console錯誤：",p.__errs.length?p.__errs.join("|"):"無")}
 // 2 防連點
 {const p=await mk(w,h);await p.evaluate(()=>{window.__rpcDelay=400});await open(p,"21點");await p.click("#bjGo");await p.waitForTimeout(1200);await count(p);
  await p.dblclick("#bjHit");await p.waitForTimeout(1500);const c1=await p.evaluate(()=>window.__c);
  say("[2 雙擊要牌 bj_hit 次數]",JSON.stringify(c1),(c1.bj_hit||0)==1?"✅":"❌");
  await p.evaluate(()=>{window.__c={}});const stand=await p.$("#bjStand");if(stand){await p.dblclick("#bjStand");await p.waitForTimeout(1500)}
  await p.evaluate(()=>{});const c2=await p.evaluate(()=>window.__c);say("   雙擊停牌",JSON.stringify(c2),(c2.bj_stand||0)<=1?"✅":"❌");
  await p.waitForTimeout(500);await p.evaluate(()=>{window.__c={}});if(await p.$("#bjGo")){await p.dblclick("#bjGo");await p.waitForTimeout(1500)}
  const c3=await p.evaluate(()=>window.__c);say("   雙擊再來一局→gamesModal 重繪 bj_start",JSON.stringify(c3));
  await p.evaluate(()=>{window.__c={}});await ct(p,"發牌")||0;
  await p.click("#bjGo").catch(()=>{});await p.waitForTimeout(1200);await p.evaluate(()=>{window.__c={}});if(await p.$("#bjDbl:not([disabled])")){await p.dblclick("#bjDbl");await p.waitForTimeout(1500)}
  const c4=await p.evaluate(()=>window.__c);say("   雙擊加倍",JSON.stringify(c4),(c4.bj_double||0)<=1?"✅":"❌")}
 // 3 小螢幕牌桌占比
 for(const [tab,key] of [["輪盤","#whGo"],["骰寶",null],["地雷",null],["賽豬","#pgGo"],["百家樂",null],["比大小","#hlGo"]]){const p=await mk(w,h);await open(p,tab);if(tab=="地雷"){await ct(p,"玩地雷");await p.waitForTimeout(400)}
  const m=await p.evaluate(()=>{const H=innerHeight,g=document.querySelector(".garea .gshow")||document.querySelector(".garea"),a=document.querySelector(".garea"),tray=document.querySelector(".ctray"),bb=document.querySelector(".betbar");const r=e=>e?Math.round(e.getBoundingClientRect().height):null;const ch=[...document.querySelectorAll(".ctray .chip")].map(x=>Math.round(x.getBoundingClientRect().height));return{H,show:r(g),garea:r(a),tray:r(tray),betbar:r(bb),trayScroll:tray?tray.scrollWidth>tray.clientWidth:null,chipMin:ch.length?Math.min(...ch):null,pct:g?Math.round(g.getBoundingClientRect().height/H*100):null,acts:[...document.querySelectorAll(".garea .gbtns button,.garea [id$=Go]")].map(b=>Math.round(b.getBoundingClientRect().height)).slice(0,6)}});
  say(`[3 ${tab} ${T}]`,JSON.stringify(m),(m.pct>=38||m.garea/ m.H>=.38)?"✅":"❌");await shot(p,`fix-${tab}-${T}`);await p.context().close()}
 // 5 籌碼提示
 {const p=await mk(w,h,0,5000);await open(p,"骰寶");const t=await p.evaluate(()=>document.querySelector(".nochip")?.textContent);say("[5a 0 籌碼]",t);await shot(p,`fix-nochip0-${T}`);
  await p.click(".nochip [data-cin]");await p.waitForTimeout(800);const t2=await p.evaluate(()=>({chips:document.getElementById("gMoney")?.textContent,no:!!document.querySelector(".nochip")}));say("   按換籌碼後",JSON.stringify(t2),t2.no?"❌":"✅")}
 {const p=await mk(w,h,30,5000);await open(p,"骰寶");const t=await p.evaluate(()=>document.querySelector(".nochip")?.textContent);say("[5a 30 籌碼]",t);await shot(p,`fix-nochip30-${T}`)}
 // 妞妞全押
 {const p=await mk(w,h,9000,5000);await open(p,"妞妞");await p.click("[data-chip=all]");await p.waitForTimeout(200);const v=await p.evaluate(()=>({bet:document.getElementById("bstack")?.textContent,disabledChips:[...document.querySelectorAll(".ctray .chip")].filter(c=>c.disabled).map(c=>c.dataset.chip)}));say("[5c 妞妞 9000 籌碼全押]",JSON.stringify(v),"（應 3000）");
  const rule=await p.evaluate(()=>{const r=document.getElementById("rulesPop");return r?r.textContent.includes("籌碼要有押注 3 倍")&&!r.textContent.includes("現金"):"沒規則浮層"});say("   規則寫籌碼：",rule)}
 // 百家樂規則動畫文字
 {const p=await mk(w,h);await open(p,"百家樂");await p.click("#rulesBtn");await p.waitForTimeout(200);const t=await p.evaluate(()=>document.getElementById("rulesPop")?.textContent.slice(-60));say("[5d 百家樂規則尾]",t)}
 // 老虎機規則
 {const p=await mk(w,h);await open(p,"老虎機");await p.click("#rulesBtn").catch(()=>{});const t=await p.evaluate(()=>(document.getElementById("rulesPop")||document.getElementById("gArea")).textContent.match(/累積大獎[^。]*。[^。]*。[^。]*。/)?.[0]);say("[4 老虎機規則]",t)}
 // 牌九、比大小 續玩
 for(const [tab,go,key] of [["牌九","#pjGo","[data-s]"],["比大小","#hlGo","[data-hl]"]]){const p=await mk(w,h);await open(p,tab);await p.click(go);await p.waitForTimeout(900);const n1=await p.evaluate(k=>document.querySelectorAll(k).length,key);const chips1=await p.evaluate(()=>document.getElementById("gMoney").textContent);
  await reopen(p,tab);await p.waitForTimeout(900);const n2=await p.evaluate(k=>document.querySelectorAll(k).length,key),chips2=await p.evaluate(()=>document.getElementById("gMoney").textContent);
  say(`[1 ${tab} 續玩]`,`選項 ${n1}→${n2}`,`籌碼 ${chips1}→${chips2}`,n1>0&&n1==n2&&chips1==chips2?"✅":"❌");await shot(p,`fix-${tab}-resume-${T}`)}
 // 開局遇舊牌局→導回
 {const p=await mk(w,h);await open(p,"21點");await p.click("#bjGo");await p.waitForTimeout(900);
  // 模擬：畫面被重設為尚未開局但伺服器有牌局
  await p.evaluate(()=>{gameTab="";});await closeM(p);await open(p,"21點");await p.waitForTimeout(700);
  say("[1 bj 再開同桌自動接回]",await p.evaluate(()=>!!document.getElementById("bjHit")))}
}
await browser.close();srv.close();fs.rmSync(tmp,{recursive:true,force:true});
fs.writeFileSync(path.join(OUT,"casino-verify-log.txt"),log.join("\n"));
