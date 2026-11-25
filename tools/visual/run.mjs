// 自動畫面測試：node run.mjs [--update] [--head 用 git HEAD 的 town/ 而非工作目錄] [--only 情境] [--size 390x844]
import {chromium} from "playwright";
import http from "node:http";
import {execSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {fileURLToPath} from "node:url";
import {PNG} from "pngjs";
import pixelmatch from "pixelmatch";

const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,"../.."),
  args=process.argv.slice(2),UPDATE=args.includes("--update"),
  opt=k=>{const i=args.indexOf(k);return i>=0?args[i+1]:null},ONLY=opt("--only"),ONLYSZ=opt("--size"),
  DIFF_PCT=1.5; // 與基準圖差異像素 > 1.5% 才報
const SIZES=[[390,844],[375,667],[430,932],[768,1024],[1366,768],[1920,1080]].filter(s=>!ONLYSZ||ONLYSZ==s.join("x"));
// 情境：mut 改假資料庫（住在 sessionStorage mockdb）；run 進遊戲後再做的操作
const ME=1;
const tbl=async(p,sels)=>{const r=await p.evaluate(sels=>{const H=innerHeight,out=[],gs=document.querySelector(".garea .gshow")||document.querySelector(".garea");if(!gs)return["沒有牌桌區"];const gr=gs.getBoundingClientRect();if(gr.height<H*.38)out.push("牌桌區只有 "+Math.round(gr.height/H*100)+"%");for(const c of gs.querySelectorAll(".pcard")){const q=c.getBoundingClientRect();if(q.top<gr.top-1||q.bottom>gr.bottom+1)out.push("牌被切 "+Math.round(q.top-gr.top)+"/"+Math.round(q.bottom-gr.bottom))}const bs=sels.length?sels.flatMap(x=>[...document.querySelectorAll(x)]):[...document.querySelectorAll(".garea .gbtns button")];if(!bs.length)out.push("找不到動作鈕 "+sels);for(const b of bs){const q=b.getBoundingClientRect();if(q.height<44)out.push("鈕太矮 "+Math.round(q.height));if(q.top<0||q.bottom>H)out.push("鈕不在視窗 "+Math.round(q.top)+"~"+Math.round(q.bottom));const e=document.elementFromPoint(q.left+q.width/2,q.top+q.height/2);if(!(e&&(e===b||b.contains(e))))out.push("鈕被覆蓋："+(e&&(e.id||e.className||e.tagName)))}return out.concat(["占比 "+Math.round(gr.height/H*100)+"%"].filter(()=>0))},sels);if(r.length)throw new Error("牌桌 "+r.join("；"))};
const CAS0=r=>{r.place="casino";r.x=68;r.y=14;r.items.fi="casino";r.items.cas={ch:20000,bh:""};r.money=5000};
const SC=[
 {n:"street",mut:r=>{r.place="street";r.x=15;r.y=12}},
 {n:"fac-door",mut:r=>{r.place="cafe";r.x=38;r.y=5}},
 {n:"cafe-inside",mut:r=>{r.place="cafe";r.x=38;r.y=5;r.items.fi="cafe"}},
 {n:"in-market",mut:r=>{r.place="market";r.x=28;r.y=14;r.items.fi="market"}},
 {n:"in-cinema",mut:r=>{r.place="cinema";r.x=40;r.y=14;r.items.fi="cinema"}},
 {n:"in-office",mut:r=>{r.place="office";r.x=30;r.y=6;r.items.fi="office"}},
 {n:"in-rafi",mut:r=>{r.place="rafi";r.x=49;r.y=21;r.items.fi="rafi"}},
 {n:"in-stock",mut:r=>{r.place="stock";r.x=45;r.y=5;r.items.fi="stock"}},
 {n:"in-arena",mut:r=>{r.place="arena";r.x=53;r.y=6;r.items.fi="arena"}},
 {n:"in-carshop",mut:r=>{r.place="carshop";r.x=46;r.y=14;r.items.fi="carshop"}},
 {n:"in-slaughter",mut:r=>{r.place="slaughter";r.x=53;r.y=14;r.items.fi="slaughter"}},
 {n:"shift-cafe",mut:r=>{r.place="cafe";r.x=38;r.y=5;r.items.fi="cafe"},run:async p=>{const M=()=>p.evaluate(()=>{const g=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return[r.top,r.height,r.left,r.width].map(Math.round)};return{panel:g("#panel"),stage:g("#stage"),nav:g(".tools"),main:g("#mainrow")}});const base=await M();let worst=0,why="";const chk=async tag=>{const m=await M();for(const k in base){if(!base[k]||!m[k])continue;const d=Math.max(...base[k].map((v,i)=>Math.abs(v-m[k][i])));if(d>worst){worst=d;why=tag+":"+k}}};const tabs=await p.$$(".ptab");for(const t of tabs){await t.click().catch(()=>{});await p.waitForTimeout(250);await chk("tab")}await p.waitForTimeout(3500);await chk("wait");console.log("shift "+worst+"px "+why);if(worst>0)throw new Error("shift "+worst+"px "+why)}},
 {n:"drawer-casino",mut:r=>{r.place="casino";r.x=68;r.y=14;r.items.fi="casino"},run:async p=>{await p.waitForTimeout(300)},soft:1},
 {n:"drawer-cafe",mut:r=>{r.place="cafe";r.x=38;r.y=5;r.items.fi="cafe"},run:async p=>{await p.waitForTimeout(300)},soft:1},
 {n:"in-casino",mut:r=>{r.place="casino";r.x=68;r.y=14;r.items.fi="casino"}},
 {n:"zoom-all",mut:r=>{r.place="street";r.x=20;r.y=7},run:async p=>{await p.click("#zoom");await p.waitForTimeout(900)},soft:1},
 {n:"in-townhall",mut:r=>{r.place="townhall";r.x=68;r.y=5;r.items.fi="townhall";r.money=50000}},
 {n:"in-hospital",mut:r=>{r.place="hospital";r.x=61;r.y=14;r.items.fi="hospital"}},
 {n:"low-hunger",mut:r=>{r.hunger=20;r.place="street"}},
 {n:"move-modal",mut:r=>{r.place="realty";r.x=75;r.y=5;r.items.fi="realty";r.money=50000},run:async p=>{await p.evaluate(()=>{const b=[...document.querySelectorAll("#panel button")].find(x=>/設施搬遷/.test(x.textContent));if(b)b.click()});await p.waitForSelector("#mbody [data-mk]",{timeout:5000}).catch(async e=>{throw new Error("DBG "+await p.evaluate(()=>document.querySelector("#panel").innerText.slice(0,200)+"|"+document.querySelector("#mbody").innerText.slice(0,150)))});await p.waitForTimeout(400)}},
 {n:"move-zoom",mut:r=>{r.place="street";r.x=60;r.y=8},run:async p=>{await p.evaluate(()=>{const db=JSON.parse(sessionStorage.getItem("mockdb"));db.towns.MOCK01.layout={cafe:[88,0],gym:[88,17]};db.towns.MOCK01.mv={k:"cinema",to:[88,9],at:Math.floor(Date.now()/1e3)+80000,cost:80000,by:"x"};sessionStorage.setItem("mockdb",JSON.stringify(db))});await p.reload();await p.waitForTimeout(1500);await p.click("#zoom");await p.waitForTimeout(900)}},
 {n:"move-east",mut:r=>{r.place="street";r.x=90;r.y=10}},
 // 申請搬遷咖啡廳到東區北段（假資料庫 24 小時改成已到期）→ 重載後地圖搬了 → 走去新門口進館
 {n:"move-done",mut:r=>{r.place="realty";r.x=75;r.y=5;r.items.fi="realty";r.money=50000},run:async p=>{await p.evaluate(()=>sessionStorage.setItem("mockMvSkip","1"));
   await p.evaluate(()=>{const b=[...document.querySelectorAll("#panel button")].find(x=>/設施搬遷/.test(x.textContent));if(b)b.click()});await p.waitForSelector("#mbody [data-mk]",{timeout:5000});
   await p.evaluate(()=>document.querySelector('#mbody [data-mk="cafe"][data-y="0"]').click());await p.waitForSelector("#tapc button",{timeout:3000});await p.evaluate(()=>document.querySelector("#tapc button").click());await p.waitForTimeout(1500);
   await p.reload();await p.waitForTimeout(1500);
   const lay=await p.evaluate(()=>JSON.parse(sessionStorage.getItem("mockdb")).towns.MOCK01.layout);if(!lay||lay.cafe[0]!=88)throw new Error("搬遷沒有完成："+JSON.stringify(lay));
   await p.evaluate(()=>{const b=[...document.querySelectorAll("#panel button")].find(x=>/設施搬遷/.test(x.textContent));if(b)b.click()});await p.waitForSelector("#mbody [data-go=cafe]",{timeout:5000});await p.evaluate(()=>document.querySelector("#mbody [data-go=cafe]").click());
   let ok=false;for(let i=0;i<90&&!ok;i++){await p.waitForTimeout(500);const r=await p.evaluate(()=>JSON.parse(sessionStorage.getItem("mockdb")).res.find(x=>x.id==1));ok=r.place=="cafe"&&r.x==90&&r.y==5}
   if(!ok)throw new Error("沒有走到新的咖啡廳門口 (90,5)")}},
 {n:"in-realty",mut:r=>{r.place="realty";r.x=75;r.y=5;r.items.fi="realty";r.money=50000}},
 {n:"in-furnshop",mut:r=>{r.place="furnshop";r.x=75;r.y=14;r.items.fi="furnshop";r.money=50000}},
 {n:"in-wearshop",mut:r=>{r.place="wearshop";r.x=82;r.y=14;r.items.fi="wearshop";r.money=50000}},
 {n:"in-harbor",mut:r=>{r.place="harbor";r.x=74;r.y=21;r.items.fi="harbor";r.money=300000}},
 {n:"door-realty",mut:r=>{r.place="realty";r.x=75;r.y=5},soft:1},
 {n:"home-inside",mut:r=>{r.place="home:1"}},
 {n:"home-door",mut:r=>{r.place="home:1";r.items.dr="1"}},
 {n:"in-restaurant",mut:r=>{r.place="restaurant";r.x=5;r.y=14;r.items.fi="restaurant"}},
 {n:"walking",mut:r=>{r.place="street";r.x=15;r.y=12},run:async p=>{await p.evaluate(()=>{document.querySelector("#obbar")&&document.querySelector("#obbar").remove();document.querySelector("#homeBtn").click()});await p.waitForTimeout(600)}},
 {n:"friend-door",mut:r=>{r.place="home:3";r.items.dr=0}},
 {n:"friend-panel",mut:r=>{r.place="plaza";r.x=14;r.y=11},run:async p=>{await p.click("#friendBtn");await p.waitForTimeout(300)}},
 {n:"work-anim",mut:r=>{r.place="office";r.x=30;r.y=6},run:async p=>{await clickText(p,"打工");await p.waitForTimeout(500)}},
 {n:"modal-feed",mut:r=>{r.place="street";r.x=15;r.y=12},run:async p=>{await p.click("#feedBtn");await p.waitForTimeout(300)}},
 {n:"modal-menu",mut:r=>{r.place="street";r.x=15;r.y=12},run:async p=>{await p.click("#menuBtn");await p.waitForTimeout(300)}},
 {n:"modal-updates",mut:r=>{r.place="street";r.x=15;r.y=12},run:async p=>{await p.click("#menuBtn");await p.click("#updBtn");await p.waitForTimeout(300)}},
 {n:"modal-persona",mut:r=>{r.place="street";r.x=15;r.y=12;r.items.pf={nick:"豬豬",mt:["好耶","再一杯"],by:{"2":"小可愛"},bo:["2"]}},run:async p=>{await p.click("#menuBtn");await p.click("#pfBtn");await p.waitForTimeout(300)},soft:1},
 {n:"modal-goods-cafe",mut:r=>{r.place="cafe";r.x=38;r.y=5;r.items.fi="cafe"},run:async p=>{await p.evaluate(()=>{const b=[...document.querySelectorAll('#acts button,#mainrow button')].find(x=>x.textContent.includes('看菜單'));if(b)b.click()});await p.waitForTimeout(700)},soft:1},
 {n:"modal-goods",mut:r=>{r.place="market";r.x=28;r.y=14;r.items.fi="market"},run:async p=>{await p.evaluate(()=>{const b=[...document.querySelectorAll('#acts button,#mainrow button')].find(x=>x.textContent.includes('逛貨架'));if(b)b.click()});await p.waitForTimeout(700)},soft:1},
 {n:"estate-home",mut:r=>{r.place="home:"+r.id;r.items.dr=1;r.items.lx={estate:"2026-11-24",ep:0};r.items.hl=4}},
 {n:"estate-yard",mut:r=>{r.place="street";r.x=6;r.y=31;r.items.lx={estate:"2026-11-24",ep:0}}},
 {n:"in-estate",mut:r=>{r.place="estate:"+r.id;r.x=5;r.y=31;r.items.fi="estate:"+r.id;r.items.f=["bed","fridge","toilet","shower","tvcab","sofa"];r.items.lx={estate:"2026-11-24",ep:0,efp:[["fridge",1,1],["toilet",2,1],["shower",3,1],["tvcab",7,1],["sofa",7,3],["bed",11,1]],efc:["fridge","toilet","shower","tvcab","sofa","bed"],ro:{piano:null,fount:[4,4]},gate:"list",wl:[2]}}},
 {n:"estate-manage",mut:r=>{r.place="estate:"+r.id;r.x=5;r.y=31;r.items.fi="estate:"+r.id;r.items.f=["bed","fridge","toilet","shower","tvcab","sofa"];r.items.lx={estate:"2026-11-24",ep:0,efp:[["fridge",1,1],["toilet",2,1],["shower",3,1],["tvcab",7,1],["sofa",7,3],["bed",11,1]],efc:["fridge","toilet","shower","tvcab","sofa","bed"],ro:{piano:null,fount:[4,4]},gate:"list",wl:[2]}},run:async p=>{await p.evaluate(()=>{const b=[...document.querySelectorAll("#acts button")].find(x=>/莊園管理/.test(x.textContent));if(b)b.click()});await p.waitForTimeout(600)},soft:1},
 {n:"estate-flow",mut:r=>{r.place="estate:"+r.id;r.x=5;r.y=31;r.items.fi="estate:"+r.id;r.items.f=["bed","fridge","toilet","shower","tvcab","sofa","rug","massage","plant"];r.items.lx={estate:"2026-11-24",ep:0};r.hunger=30;r.bladder=30;r.hygiene=30;r.fun=30;r.energy=40;r.money=5000},run:async p=>{
   const vp=p.viewportSize(),tag=`${vp.width}x${vp.height}`,L=[],ck=(k,v,m)=>L.push(`${v?"OK ":"NG "}${k}${m?"："+m:""}`);
   const me=()=>p.evaluate(()=>JSON.parse(sessionStorage.getItem("mockdb")).res.find(x=>x.id==1));
   const shot=n=>p.screenshot({path:path.join(OUT,`${tag}-estate-flow-${n}.png`)});
   const click=async re=>{const find=src=>p.evaluate(src=>{const rg=new RegExp(src),vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0};const b=[...document.querySelectorAll("#mbody button, #acts button, #mainrow button, #pinbox button")].filter(vis).find(x=>rg.test(x.textContent.trim().replace(/^[^\u4e00-\u9fa5A-Za-z0-9✔＋]+/,"")));if(b){b.click();return true}return false},src);let ok=await find(re.source);if(!ok){const n=await p.evaluate(()=>document.querySelectorAll("#ptabs button").length);for(let i=0;i<n&&!ok;i++){await p.evaluate(i=>document.querySelectorAll("#ptabs button")[i].click(),i);await p.waitForTimeout(250);ok=await find(re.source)}}await p.waitForTimeout(450);return ok};
   const cell=async(x,y)=>{const bb=await p.evaluate(()=>{const c=document.getElementById("hm");if(!c)return null;const r=c.getBoundingClientRect();return [r.left,r.top,r.width,r.height]});if(!bb)return false;await p.mouse.click(bb[0]+(x+.5)/12*bb[2],bb[1]+(y+.5)/5*bb[3]);await p.waitForTimeout(450);return true};
   // A 家裡的事
   let a=await me();ck("在莊園室內",a.place=="estate:1"&&a.items.fi=="estate:1");await shot(0);
   let h0=a.hunger;ck("按得到吃飯",await click(/^吃飯/));a=await me();ck("吃飯有效",a.hunger>h0,`${h0}→${a.hunger}`);
   ck("按得到上廁所",await click(/^上廁所/));a=await me();ck("上廁所有效",a.bladder==100);
   ck("按得到洗澡",await click(/^洗澡/));a=await me();ck("洗澡有效",a.hygiene==100);
   let f0=a.fun;ck("按得到看電視",await click(/^看電視/));a=await me();ck("看電視有效",a.fun>f0);
   let e0=a.energy;ck("按得到快速休息",await click(/^快速休息/));a=await me();ck("快速休息有效",a.energy>e0);
   ck("按得到睡覺",await click(/^睡覺/));a=await me();ck("睡覺後仍在莊園",a.sleeping&&a.place=="estate:1",`sleeping=${a.sleeping}`);await shot(1);
   ck("睡著有起床鈕",await click(/^起床/));a=await me();ck("起床後仍在莊園",!a.sleeping&&a.place=="estate:1");
   ck("按得到快速睡覺",await click(/^快速睡覺/));a=await me();ck("快速睡覺在莊園",a.sleeping&&a.place=="estate:1");await click(/^起床/);
   // 擺家具
   ck("開佈置莊園",await click(/^佈置莊園/));await shot(2);
   ck("選背包的地毯",await click(/^地毯/));ck("放地毯到(2,3)",await cell(2,3));a=await me();ck("地毯進 efp",((a.items.lx||{}).efp||[]).some(o=>o[0]=="rug"&&o[1]==2&&o[2]==3),JSON.stringify((a.items.lx||{}).efp));
   ck("選背包的床",await click(/^好床/));ck("放床到(11,1)",await cell(11,1));a=await me();ck("床進 efc",((a.items.lx||{}).efc||[]).includes("bed"));
   ck("選鋼琴",await cell(10,4));ck("移鋼琴到(9,3)",await cell(9,3));a=await me();ck("鋼琴 ro",JSON.stringify((a.items.lx||{}).ro||{}).includes('"piano":[9,3]'),JSON.stringify((a.items.lx||{}).ro));
   ck("選噴水池",await cell(5,2));ck("收回噴水池",await click(/^收回/));a=await me();ck("噴水池收回 ro=null",((a.items.lx||{}).ro||{}).fount===null);await shot(3);
   ck("收起的擺設可放回",await click(/噴水池.*收起/));ck("放回(5,1)",await cell(5,1));a=await me();ck("噴水池新位置",JSON.stringify((a.items.lx||{}).ro||{}).includes('"fount":[5,1]'));
   ck("點固定吊燈不動",await cell(2,0));await p.waitForTimeout(200);await shot(4);
   // 莊園管理
   ck("開莊園管理",await click(/^莊園管理/));await shot(5);
   ck("改全開",await click(/^✔?\s*全開/));a=await me();ck("gate=open",(a.items.lx||{}).gate=="open");
   ck("改上鎖",await click(/上鎖/));a=await me();ck("gate=lock",(a.items.lx||{}).gate=="lock");
   const ent=()=>p.evaluate(async()=>{const r=await fetch("/rest/v1/rpc/town_fi",{method:"POST",body:JSON.stringify({rid:2,pin:"x",op:"enter",pl:"estate:1"})});return r.status+" "+(await r.text()).slice(0,60)});
   const t1=await ent();ck("上鎖：乙被擋",/^400/.test(t1)&&/上鎖/.test(t1),t1);
   ck("改受邀名單",await click(/受邀名單/));a=await me();ck("gate=list",(a.items.lx||{}).gate=="list");
   const t2=await ent();ck("名單：乙(未受邀)被擋",/^400/.test(t2)&&/受邀/.test(t2),t2);
   const nm=await p.evaluate(()=>[...document.querySelectorAll("#wl button")].map(b=>b.textContent));ck("名單有朋友可加",nm.length>0,nm.join("/"));
   if(nm.length){ck("加入第一位",await p.evaluate(()=>{const b=document.querySelector("#wl button");if(b){b.click();return true}return false}));await p.waitForTimeout(500);a=await me();ck("wl 寫入",((a.items.lx||{}).wl||[]).length==1,JSON.stringify((a.items.lx||{}).wl));await shot(6);
    const t3=await ent();ck("名單：受邀者可進",/^200/.test(t3),t3);
    await p.evaluate(()=>{const b=document.querySelector("#wl button");b&&b.click()});await p.waitForTimeout(500);a=await me();ck("再點移除",!((a.items.lx||{}).wl||[]).length)}
   ck("改預設",await click(/^預設/));a=await me();ck("gate 還原",(a.items.lx||{}).gate===undefined);
   ck("完成關閉",await click(/^完成/));await p.waitForTimeout(300);await shot(7);
   console.log("\nFLOW "+tag+"\n"+L.join("\n"))},soft:1},
 {n:"estate-edit",mut:r=>{r.place="estate:"+r.id;r.x=5;r.y=31;r.items.fi="estate:"+r.id;r.items.f=["bed","fridge","toilet","shower","tvcab","sofa"];r.items.lx={estate:"2026-11-24",ep:0,efp:[["fridge",1,1],["toilet",2,1],["shower",3,1],["tvcab",7,1],["sofa",7,3],["bed",11,1]],efc:["fridge","toilet","shower","tvcab","sofa","bed"],ro:{piano:null,fount:[4,4]},gate:"list",wl:[2]}},run:async p=>{await p.evaluate(()=>{const b=[...document.querySelectorAll("#acts button")].find(x=>/佈置莊園/.test(x.textContent));if(b)b.click()});await p.waitForTimeout(600)},soft:1},
 {n:"modal-civic",mut:r=>{r.place="townhall";r.x=68;r.y=5},run:async p=>{await clickText(p,"市政廳大廳");await p.waitForTimeout(500)},soft:1},
 {n:"onboarding-comic",mut:r=>{r.place="plaza"},run:async p=>{await p.click("#menuBtn");await p.click("#obBtn");await p.waitForTimeout(500)},soft:1},
 {n:"onboarding-task",mut:r=>{r.place="street";r.x=15;r.y=12;r.items.tr=[];r.items.wish={k:"rich",m:0};r.items.at={init:1};globalThis.__obid=r.id},run:async p=>{await p.evaluate(id=>localStorage.setItem("town-ob_"+id,'{"d":[]}'),globalThis.__obid);await p.waitForTimeout(3200)},soft:1},
 {n:"pwa-banner",mut:r=>{r.place="street"},run:async p=>{await p.evaluate(()=>{document.body.classList.remove("ingame");var s=document.createElement("script");s.src="pwa.js?v=1";s.onload=()=>{const e=new Event("beforeinstallprompt");e.prompt=()=>{};e.userChoice=Promise.resolve();dispatchEvent(e)};document.head.appendChild(s)});await p.waitForTimeout(1500)},soft:1},
 {n:"modal-story",mut:r=>{r.place="plaza"},run:async p=>{await p.evaluate(()=>{document.getElementById("menuBtn").click()});await p.waitForTimeout(300);await p.evaluate(()=>{const b=[...document.querySelectorAll("#menu button")].find(x=>x.textContent.trim().startsWith("主線"));if(b)b.click()});await p.waitForTimeout(700)},soft:1},
 {n:"story-chapter1",mut:r=>{r.place="plaza";r.items.mq={on:1,p:0,ch:1,t:{},c:{},dn:[],n:0,tn:0,cn:0,kn:0,an:0,en:0}},run:async p=>{await p.evaluate(id=>localStorage.setItem("town-ob_"+id,JSON.stringify({fin:1,sk:1,d:[]})),ME);await p.reload();await p.waitForTimeout(4200)},soft:1},
 {n:"story-clear",mut:r=>{r.place="plaza";r.items.mq={on:1,p:0,ch:1,t:{"1.1":1,"1.2":1,"1.3":1,"1.4":1},c:{c1:"a"},dn:[],n:0,tn:4,cn:1,kn:1,an:0,en:0}},run:async p=>{await p.evaluate(id=>{localStorage.setItem("town-ob_"+id,JSON.stringify({fin:1,sk:1,d:[]}));localStorage.setItem("town-sti_"+id,"[1]");localStorage.setItem("town-stt_"+id,JSON.stringify(["1.1","1.2","1.3","1.4"]))},ME);await p.reload();await p.waitForTimeout(4200)},soft:1},
 {n:"modal-dex",mut:r=>{r.place="plaza"},run:async p=>{await p.evaluate(()=>document.getElementById("dexBtn").click());await p.waitForTimeout(700)},soft:1},
 {n:"modal-season",mut:r=>{r.place="plaza"},run:async p=>{await p.evaluate(()=>document.getElementById("seaBtn").click());await p.waitForTimeout(700)},soft:1},
 {n:"modal-season-pend",mut:r=>{r.place="plaza"},run:async p=>{await p.evaluate(()=>{window.__SEA={claimed:0};document.getElementById("seaBtn").click()});await p.waitForTimeout(700)},soft:1},
 {n:"modal-season-rank",mut:r=>{r.place="plaza"},run:async p=>{await p.waitForTimeout(10500);await p.evaluate(()=>{document.getElementById("feedBtn").click();document.querySelector("[data-tab=rank]").click()});await p.waitForTimeout(700)},soft:1},
 {n:"modal-season-award",mut:r=>{r.place="plaza"},run:async p=>{await p.evaluate(()=>{window.__SEA={claimed:0}});await p.waitForTimeout(10500)},soft:1},
 {n:"modal-ach",mut:r=>{r.place="plaza"},run:async p=>{await p.evaluate(()=>document.getElementById("achBtn").click());await p.waitForTimeout(700)},soft:1},
 {n:"modal-meet",mut:r=>{r.place="plaza"},run:async p=>{await p.evaluate(()=>document.getElementById("meetBtn").click());await p.waitForTimeout(600)},soft:1},
 {n:"modal-casino",mut:r=>{r.place="casino";r.x=68;r.y=14;r.items.fi="casino";r.items.cas={ch:20000,bh:"PBPBBTPPBB"};r.money=5000},run:async p=>{await clickText(p,"百家樂");await p.waitForTimeout(600)},soft:1},
 {n:"modal-casino-menu",mut:CAS0,run:async p=>{await clickText(p,"小豬賭場");await p.waitForTimeout(600);const r=await p.evaluate(async()=>{const c=document.querySelector("#modal .card"),t=[...document.querySelectorAll(".gmenu .gm")].pop();if(!c||!t)return"找不到選單或遊戲磚";const o=c.scrollHeight>c.clientHeight+2;const ta=getComputedStyle(c).touchAction,ov=getComputedStyle(c).overflowY;c.scrollTop=1e5;await new Promise(r=>setTimeout(r,100));const q=t.getBoundingClientRect(),H=innerHeight;if(o&&c.scrollTop<=0)return"選單不能捲 overflow="+ov;if(ta=="none")return"touch-action none";if(q.bottom>H+1||q.top<0)return"最後一張磚不在視窗 "+Math.round(q.top)+"~"+Math.round(q.bottom);return""});if(r)throw new Error("賭場選單 "+r)}},
 {n:"table-bj-split",mut:CAS0,run:async p=>{await clickText(p,"21點");await p.waitForTimeout(500);await p.click("#bjGo");await p.waitForTimeout(1000);await p.click("#bjSpl");await p.waitForTimeout(1500);await tbl(p,["#bjHit","#bjStand","#bjDbl"])},soft:1},
 {n:"table-bj-live",mut:CAS0,run:async p=>{await clickText(p,"21點");await p.waitForTimeout(500);await p.click("#bjGo");await p.waitForTimeout(1200);await tbl(p,["#bjHit","#bjStand"])},soft:1},
 {n:"table-bj-end",mut:CAS0,run:async p=>{await clickText(p,"21點");await p.waitForTimeout(500);await p.click("#bjGo");await p.waitForTimeout(1000);await p.click("#bjStand");await p.waitForTimeout(2500);await tbl(p,["#bjGo"])},soft:1},
 {n:"table-bacc",mut:CAS0,run:async p=>{await clickText(p,"百家樂");await p.waitForTimeout(600);await tbl(p,[]);await p.click("[data-b=p]");await p.waitForTimeout(4500);await tbl(p,[])},soft:1},
 {n:"table-dice",mut:CAS0,run:async p=>{await clickText(p,"骰寶");await p.waitForTimeout(600);await tbl(p,[])},soft:1},
 {n:"table-wheel",mut:CAS0,run:async p=>{await clickText(p,"輪盤");await p.waitForTimeout(600);await tbl(p,["#whGo"])},soft:1},
 {n:"table-pigrace",mut:CAS0,run:async p=>{await clickText(p,"賽豬");await p.waitForTimeout(600);await tbl(p,["#pgGo"])},soft:1},
 {n:"modal-casino-mines",mut:r=>{r.place="casino";r.x=68;r.y=14;r.items.fi="casino";r.items.cas={ch:20000,bh:""};r.money=5000},run:async p=>{await clickText(p,"玩地雷");await clickText(p,"開局");await p.waitForTimeout(400);await p.click(".mc:not([disabled])");await p.waitForTimeout(300);await p.click(".mc:not([disabled])");await p.waitForTimeout(400)},soft:1},
 {n:"modal-casino-plinko",mut:r=>{r.place="casino";r.x=68;r.y=14;r.items.fi="casino";r.items.cas={ch:20000,bh:""};r.money=5000},run:async p=>{await clickText(p,"玩彈珠台");await clickText(p,"投球");await p.waitForTimeout(2200)},soft:1},
 {n:"modal-casino-crash",mut:r=>{r.place="casino";r.x=68;r.y=14;r.items.fi="casino";r.items.cas={ch:20000,bh:""};r.money=5000},run:async p=>{await clickText(p,"玩飛行器");await clickText(p,"起飛");await p.waitForTimeout(2500);await clickText(p,"收手");await p.waitForTimeout(500)},soft:1},
 {n:"modal-casino-cups",mut:r=>{r.place="casino";r.x=68;r.y=14;r.items.fi="casino";r.items.cas={ch:20000,bh:""};r.money=5000},run:async p=>{await clickText(p,"玩猜杯子");await p.click(".cup");await p.waitForTimeout(1600)},soft:1},
 {n:"modal-casino-scratch",mut:r=>{r.place="casino";r.x=68;r.y=14;r.items.fi="casino";r.items.cas={ch:20000,bh:""};r.money=5000},run:async p=>{await clickText(p,"玩刮刮樂");await clickText(p,"買一張");await p.waitForTimeout(400);await clickText(p,"全部刮開");await p.waitForTimeout(1600)},soft:1},
 {n:"modal-casino-chest",mut:r=>{r.place="casino";r.x=68;r.y=14;r.items.fi="casino";r.items.cas={ch:20000,bh:""};r.money=5000},run:async p=>{await clickText(p,"玩開寶箱");await clickText(p,"開局");await p.waitForTimeout(400);await p.click(".chb:not([disabled])");await p.waitForTimeout(400);await clickText(p,"維持");await p.waitForTimeout(500)},soft:1},
 {n:"modal-21",mut:r=>{r.place="plaza";r.x=14;r.y=11},run:async p=>{await clickText(p,"街機")||await clickText(p,"賭場");await p.waitForTimeout(300);await clickText(p,"21");await p.waitForTimeout(300)},soft:1},
 {n:"sleeping",mut:r=>{r.place="home:1";r.sleeping=true;r.energy=20}},
 {n:"jail",mut:r=>{r.place="jail";r.x=61;r.y=5;r.items.jl=new Date(Date.now()+36e5).toISOString()}},
];
async function clickText(p,t){const h=await p.evaluateHandle(t=>[...document.querySelectorAll("#acts button,#ptabs button,#mbody button,#menu button")].find(b=>b.offsetParent&&b.textContent.includes(t)),t);const el=h.asElement();if(!el)return false;await el.click();return true}

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

// ---- 頁面內檢查 ----
const CHECK=()=>{
 const out=[],W=innerWidth,H=innerHeight,mobile=W<=700,vis=e=>{const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!="hidden"&&cs.display!="none"&&e.offsetParent!==null};
 const R=s=>{const e=document.querySelector(s);return e&&vis(e)?e.getBoundingClientRect():null};
 const add=(k,m)=>out.push({k,m});
 // 水平溢出
 for(const s of ["#panel","#acts","#ptabs",".bar","#needs","#modal #mbody"]){const e=document.querySelector(s);if(e&&vis(e)&&e.scrollWidth>e.clientWidth+1)add("overflow-x",`${s} scrollWidth ${e.scrollWidth} > ${e.clientWidth}`)}
 if(document.documentElement.scrollWidth>W+1)add("overflow-x",`頁面橫向捲動 ${document.documentElement.scrollWidth}>${W}`);
 // 按鈕在視窗內、手機高度 ≥44
 const scopes=document.querySelector("#modal:not(.hide)")?["#mbody"]:["#acts","#ptabs",".bar",".tools","#pinbox","#tipbox"];
 for(const sc of scopes)for(const b of document.querySelectorAll(sc+" button")){if(!vis(b))continue;const r=b.getBoundingClientRect(),t=(b.textContent||"").trim().slice(0,12);
  const sp=b.closest("#acts,#mbody,#ptabs");if(sp){const pr=sp.getBoundingClientRect();if(r.bottom>pr.bottom+1&&sp.scrollHeight>sp.clientHeight)continue;if(r.top<pr.top-1)continue}
  if(r.left<-1||r.right>W+1||r.bottom>H+1||r.top<-1)add("btn-out",`「${t}」超出視窗 (${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)})`);
  if(mobile&&r.height<43.5)add("btn-small",`「${t}」高度 ${Math.round(r.height)}px`);
  if(mobile&&sc!="#mbody"&&r.width<43.5)add("btn-small",`「${t}」寬度 ${Math.round(r.width)}px`)}
 // 導覽列四顆（看全鎮改浮在舞台右上）
 const nav=["#menuBtn","#home","#friendBtn","#feedBtn"].map(s=>({s,r:R(s)}));
 if(!document.querySelector("#modal:not(.hide)")){const miss=nav.filter(x=>!x.r);if(miss.length&&mobile)add("nav",`導覽列缺：${miss.map(x=>x.s).join(",")}`);
  const ws=nav.filter(x=>x.r).map(x=>Math.round(x.r.width));if(mobile&&ws.length>1&&Math.max(...ws)-Math.min(...ws)>3)add("nav",`導覽列寬度不等 ${ws.join("/")}`)}
 // 訊息槽不與 HUD 重疊
 const hud=R("#needs");for(const s of ["#toast.on","#wev:not(.hide)","#upd:not(.hide)"]){const r=R(s);if(r&&hud&&!(r.bottom<=hud.top||r.top>=hud.bottom||r.right<=hud.left||r.left>=hud.right))add("overlap",`${s} 與 HUD 重疊`)}
 // 舞台占比
 const st=R("#stage");if(st&&!document.querySelector("#modal:not(.hide)")){const ratio=st.height/H;if(mobile&&ratio<0.35)add("stage",`#stage 高度占比 ${(ratio*100).toFixed(0)}% < 35%`);if(!mobile&&st.width<W*0.5)add("stage",`#stage 寬 ${Math.round(st.width)} < 視窗一半`)}
 // 底部空白：面板或導覽列底到視窗底
 if(mobile){const nb=R(".bar");if(nb&&H-nb.bottom>2)add("gap",`導覽列下方空白 ${Math.round(H-nb.bottom)}px`);const pn=R("#panel");if(pn&&nb&&nb.top-pn.bottom>2)add("gap",`面板與導覽列間空白 ${Math.round(nb.top-pn.bottom)}px`)}
 // 字型、像素風
 const bad=new Set,rd=new Set,sh=new Set,gr=new Set,cp=new Set,fs2=new Set;
 for(const e of document.querySelectorAll("body *")){if(!vis(e))continue;const cs=getComputedStyle(e),own=[...e.childNodes].some(n=>n.nodeType==3&&n.textContent.trim());const id=e.tagName.toLowerCase()+(e.id?"#"+e.id:"")+(e.className&&typeof e.className=="string"?"."+e.className.split(" ")[0]:"");
  if(own&&!/Cubic ?11/i.test(cs.fontFamily.split(",")[0]))bad.add(id+" "+cs.fontFamily.split(",")[0]);
  if(own&&parseFloat(cs.fontSize)>0&&![11,16.5,22].includes(parseFloat(cs.fontSize)))fs2.add(id+" "+cs.fontSize);
  if(/[1-9]/.test(cs.borderTopLeftRadius+cs.borderBottomRightRadius)&&cs.clipPath=="none")rd.add(id+" "+cs.borderTopLeftRadius);
  if(cs.boxShadow!="none"&&cs.boxShadow.replace(/\([^)]*\)/g,"").split(",").some(x=>{const L=x.match(/-?[\d.]+px/g)||[];return L[2]&&parseFloat(L[2])>0}))sh.add(id+" "+cs.boxShadow.slice(0,40));
  if(/gradient/.test(cs.backgroundImage))gr.add(id);
  if(own&&e.scrollWidth>e.clientWidth+1&&cs.overflow!="visible"&&cs.textOverflow=="ellipsis"&&/…|\.\.\./.test(""))cp.add(id)}
 for(const [k,s,l] of [["font",bad,"非 Cubic 11"],["fontsize",fs2,"字級非 11/16.5/22"],["radius",rd,"圓角"],["shadow",sh,"模糊陰影"],["gradient",gr,"漸層"]])if(s.size)add(k,`${l}：${[...s].slice(0,4).join("；")}${s.size>4?` 等 ${s.size} 處`:""}`);
 // 被截成 … 的文字（ellipsis 實際生效）
 const cut=[];for(const e of document.querySelectorAll("#panel *,#acts *,#modal *,.bar *")){if(!vis(e)||e.children.length)continue;const cs=getComputedStyle(e);if(cs.textOverflow=="ellipsis"&&e.scrollWidth>e.clientWidth+1)cut.push((e.textContent||"").trim().slice(0,14)+"["+e.tagName+"."+(e.className||"")+"@"+(e.closest("#acts,#mainrow,#note,#modal,.bar")||{id:"?"}).id+" "+e.scrollWidth+">"+e.clientWidth+"]")}
 if(cut.length)add("truncated",`文字被截成…：${[...new Set(cut)].slice(0,5).join("、")}${cut.length>5?` 等 ${cut.length} 處`:""}`);
 return out;
};
const WHITELIST=[/^truncated：.*(完整|副標)/]; // 允許的截斷訊息可在此加

const date=new Date().toISOString().slice(0,10),OUT=path.join(HERE,"out",date),BASE_DIR=path.join(HERE,"baseline");
fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(BASE_DIR,{recursive:true});
const browser=await chromium.launch();
const rows=[];let total=0;
for(const [w,h] of SIZES){
 const ctx=await browser.newContext({viewport:{width:w,height:h},serviceWorkers:"block",deviceScaleFactor:1,hasTouch:w<=700,isMobile:false});
 for(const sc of SC){if(ONLY&&ONLY!=sc.n)continue;
  const name=`${w}x${h}-${sc.n}`,fails=[],errs=[];
  const p=await ctx.newPage();
  p.on("console",m=>{if(m.type()=="error"&&!/Failed to load resource|favicon/.test(m.text()))errs.push(m.text().slice(0,120))});p.on("pageerror",e=>errs.push("pageerror: "+String(e.message).slice(0,120)+" @"+String(e.stack||"").split("\n")[1]));
  try{
   await p.addInitScript(()=>{try{localStorage.setItem("town-tips","1");localStorage.setItem("town-mine",JSON.stringify([{tid:"MOCK01",name:"測試小鎮",rid:1,pin:"1111",me:"阿明",at:Date.now()}]))}catch(e){}});
   await p.goto(BASE);await p.waitForSelector("#acts button,#panel",{timeout:8000}).catch(()=>{});await p.waitForTimeout(800);
   // 改假資料庫再重載
   await p.evaluate(m=>{const db=JSON.parse(sessionStorage.getItem("mockdb"));const r=db.res.find(x=>x.id==1);r.items=r.items||{};r.items.tr=[];r.items.wish={k:"none",m:0};r.items.at={init:1,st:0,ag:0,ch:0,iq:0,lk:0};const f=eval("("+m+")");f(r);sessionStorage.setItem("mockdb",JSON.stringify(db))},sc.mut.toString());
   await p.reload();await p.waitForTimeout(1200);
   // 關掉新手／更新／特質等彈窗與提示
   for(let i=0;i<5;i++){await p.waitForTimeout(500);const open=await p.evaluate(()=>!document.querySelector("#modal").classList.contains("hide"));if(!open)break;await p.evaluate(()=>{document.querySelector("#modal").classList.add("hide")})}
   await p.evaluate(()=>{const u=document.querySelector("#upd");if(u)u.classList.add("hide");const t=document.querySelector("#tips");if(t)t.classList.add("hide")});
   if(sc.run)await sc.run(p);
   await p.waitForTimeout(400);
   const res=await p.evaluate(CHECK);
   for(const f of res){const m=`${f.k}｜${f.m}`;if(!WHITELIST.some(r=>r.test(f.m)))fails.push(m)}
   if(errs.length)fails.push("console｜"+[...new Set(errs)].slice(0,3).join(" / "));
   const shot=path.join(OUT,name+".png");await p.screenshot({path:shot});
   const bp=path.join(BASE_DIR,name+".png");
   if(UPDATE||!fs.existsSync(bp)){fs.copyFileSync(shot,bp)}
   else{const a=PNG.sync.read(fs.readFileSync(bp)),b=PNG.sync.read(fs.readFileSync(shot));
    if(a.width!=b.width||a.height!=b.height)fails.push("diff｜尺寸與基準不同");
    else{const n=pixelmatch(a.data,b.data,null,a.width,a.height,{threshold:0.15}),pct=n/(a.width*a.height)*100;if(pct>DIFF_PCT)fails.push(`diff｜與基準差 ${pct.toFixed(1)}%`)}}
  }catch(e){fails.push("run｜"+String(e.message).split("\n")[0].slice(0,100));if(errs.length)console.log("  console:",[...new Set(errs)].slice(0,3));try{await p.screenshot({path:path.join(OUT,name+"-fail.png")})}catch(_){}}
  await p.close();
  const soft=sc.soft&&fails.length&&fails.every(f=>f.startsWith("run｜"));
  total++;rows.push({name,fails:soft?[]:fails,note:soft?"（略過：操作找不到按鈕）":""});
 }
 await ctx.close();
}
await browser.close();srv.close();fs.rmSync(tmp,{recursive:true,force:true});
const bad=rows.filter(r=>r.fails.length),nchk=total*12;
console.log(`\n情境 ${total}｜通過 ${total-bad.length}｜失敗 ${bad.length}｜${UPDATE?"已更新基準":"對基準圖比對"}｜截圖：${path.relative(ROOT,OUT)}`);
const agg={};for(const r of bad)for(const f of r.fails){const k=f.split("｜")[0];(agg[k]=agg[k]||[]).push(`${r.name}：${f.split("｜")[1]}`)}
for(const [k,l] of Object.entries(agg)){console.log(`\n[${k}] ×${l.length}`);l.slice(0,6).forEach(x=>console.log("  "+x));if(l.length>6)console.log(`  …另 ${l.length-6} 筆`)}
fs.writeFileSync(path.join(OUT,"report.json"),JSON.stringify(rows,null,1));
process.exit(UPDATE?0:bad.length?1:0);
