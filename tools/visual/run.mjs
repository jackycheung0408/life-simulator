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
 {n:"drawer-casino",mut:r=>{r.place="casino";r.x=68;r.y=14;r.items.fi="casino"},run:async p=>{await p.waitForTimeout(300)},soft:1},
 {n:"drawer-cafe",mut:r=>{r.place="cafe";r.x=38;r.y=5;r.items.fi="cafe"},run:async p=>{await p.waitForTimeout(300)},soft:1},
 {n:"in-casino",mut:r=>{r.place="casino";r.x=68;r.y=14;r.items.fi="casino"}},
 {n:"home-inside",mut:r=>{r.place="home:1"}},
 {n:"friend-door",mut:r=>{r.place="home:3";r.items.dr=0}},
 {n:"friend-panel",mut:r=>{r.place="plaza";r.x=14;r.y=11},run:async p=>{await p.click("#friendBtn");await p.waitForTimeout(300)}},
 {n:"work-anim",mut:r=>{r.place="office";r.x=30;r.y=6},run:async p=>{await clickText(p,"打工");await p.waitForTimeout(500)}},
 {n:"modal-feed",mut:r=>{r.place="street";r.x=15;r.y=12},run:async p=>{await p.click("#feedBtn");await p.waitForTimeout(300)}},
 {n:"modal-menu",mut:r=>{r.place="street";r.x=15;r.y=12},run:async p=>{await p.click("#menuBtn");await p.waitForTimeout(300)}},
 {n:"modal-updates",mut:r=>{r.place="street";r.x=15;r.y=12},run:async p=>{await p.click("#menuBtn");await p.click("#updBtn");await p.waitForTimeout(300)}},
 {n:"modal-casino",mut:r=>{r.place="casino";r.x=68;r.y=14;r.items.fi="casino";r.items.cas={ch:20000,bh:"PBPBBTPPBB"};r.money=5000},run:async p=>{await clickText(p,"百家樂");await p.waitForTimeout(600)},soft:1},
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
 const cut=[];for(const e of document.querySelectorAll("#panel *,#acts *,#modal *,.bar *")){if(!vis(e)||e.children.length)continue;const cs=getComputedStyle(e);if(cs.textOverflow=="ellipsis"&&e.scrollWidth>e.clientWidth+1)cut.push((e.textContent||"").trim().slice(0,14))}
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
  }catch(e){fails.push("run｜"+String(e.message).split("\n")[0].slice(0,100))}
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
