// 小豬鎮：任何人都能建立自己的小鎮，拿邀請碼的朋友搬進來；需求隨現實時間下降，所有改動都經過 Supabase 的資料庫函式
const SB="https://gerqdagicybtyilihvvm.supabase.co/rest/v1/rpc/",SBK="sb_publishable_bPvbJFXUM_Ax2iPLeTS5zw_foV60x5y";
const rpc=(fn,body={})=>fetch(SB+fn,{method:"POST",keepalive:true,headers:{apikey:SBK,"Content-Type":"application/json"},body:JSON.stringify(body)})
 .then(async r=>{const j=await r.json().catch(()=>null);if(!r.ok)throw new Error((j&&j.message)||"連不上小鎮，等一下再試");if(j&&j.error)throw new Error(j.error);return j});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// ── 地圖：寬 34 格。市中心固定；住宅一排 3 間（5×4 格，門在正下方），住滿就往下多開一條街，最多 4 排 ──
const T=32,COLS=52,MAXROWS=4;let NR=2,OFF=new Set(),POOPS=[];
// 鎮長可以關掉的設施
const FEATS=[["cafe","咖啡廳","喝咖啡回精力"],["cinema","電影院","看電影心情大增"],["gym","健身房","練體能，打架更強"],["arena","格鬥場","打擂台、約打"],["slaughter","屠宰場","溜進去偷飼料，有賺有賠"],["arcade","小豬街機","猜拳、比大小、輪盤、21 點、下戰帖"]];
const setOff=a=>{OFF=new Set(a||[])};const isOn=k=>!OFF.has(k);
const setRows=n=>{NR=clamp(n||2,2,MAXROWS)};
const mapRows=()=>NR<=2?23:30+7*(NR-3);
const STREETS=["小豬大道","豬尾巴街","豬鼻子街","豬蹄巷"];
const ROOFS=["#d9534f","#3b7dd8","#b45cc4","#8b5a2b","#2e9e5b","#d8901a","#e0779b","#2a9d8f","#6c5ce7","#c0392b","#16a085","#7f8c8d"];
const homeXY=s=>{const k=Math.floor(s/3);return [[2,9,20][s%3],k==0?1:k==1?17:24+7*(k-2)]};
const door=s=>{const [x,y]=homeXY(s);return [x+2,y+4]};
const visitSpot=s=>{const d=door(s);return [d[0]+1,d[1]]};// 去朋友家站在門口旁邊，不要和主人疊在一起
const PLACES={
 restaurant:{r:[2,9,6,5],door:[5,14],name:"餐廳",block:1},
 market:{r:[24,9,8,5],door:[28,14],name:"超市",block:1},
 office:{r:[26,0,7,6],door:[29,6],name:"公司",block:1},
 park:{r:[25,17,9,5],door:[29,19],name:"公園"},
 cafe:{r:[35,0,6,5],door:[37,5],name:"咖啡廳",block:1},
 cinema:{r:[35,9,8,5],door:[39,14],name:"電影院",block:1},
 gym:{r:[35,17,6,4],door:[37,21],name:"健身房",block:1},
 arena:{r:[45,0,7,6],door:[48,6],name:"格鬥場",block:1},
 slaughter:{r:[45,9,7,5],door:[48,14],name:"屠宰場",block:1},
 plaza:{r:[12,8,10,7],door:[14,11],name:"廣場"}};
const FOUNTAIN=[16,10,2,3];
// 路上物件：位置要和資料庫 town_obj_near 一致；用法：[名稱, 按鈕, 說明]
const OBJS={vend:{x:19,y:5,name:"自動販賣機",acts:[["投一罐飲料 🥤","€30 · 精力 +12 · 偶爾掉兩罐"]]},trash:{x:8,y:14,name:"垃圾桶",acts:[["撿垃圾 🗑️","心情 +4 · 說不定撿到東西"]]},
 stall:{x:22,y:14,name:"烤地瓜攤",acts:[["買烤地瓜 🍠","€60 · 飽足 +25"]]},well:{place:"plaza",name:"小豬噴水池",acts:[["丟硬幣許願 🪙","€10 · 小機率願望成真"]]},
 dummy:{x:22,y:11,name:"人型靶",acts:[["揍人型靶 👊","免費 · 心情 +5 · 精力 −3 · 沒有冷卻，每揍 10 下體能 +1"]]},bench:{x:14,y:5,name:"長椅",acts:[["坐一下 💤","免費 · 精力 +20"]]},cooler:{x:10,y:14,name:"飲水機",acts:[["喝杯水 💦","免費 · 精力 +3 · 飽足 +3"]]},pwc:{x:18,y:19,name:"公共廁所",acts:[["上公廁 🚽","免費 · 膀胱回滿"]]},
 mailbox:{x:34,y:5,name:"郵筒",acts:[["查信箱 💌","免費 · 偶爾收到退款 · 一天最多領 3 次"]]},news:{x:14,y:19,name:"報攤",acts:[["買份報紙 📰","€20 · 心情 +8"]]},claw:{x:33,y:14,name:"夾娃娃機",acts:[["夾娃娃 🎁","€30 · 兩成夾到禮物"]]},lottery:{x:8,y:19,name:"刮刮樂攤",acts:[["刮一張 🍀","€100 · 有機會中大獎"]]},
 busker:{place:"plaza",name:"街頭藝人",acts:[["打賞 🎸","€50 · 心情 +15"]]},pond:{place:"park",name:"池塘",acts:[["餵鴨子 🐦","用一包零食 · 心情 +12","feed"]]},
 swing:{place:"park",name:"鞦韆",acts:[["盪鞦韆","心情 +12"]]},cat:{place:"park",name:"流浪貓",acts:[["摸摸貓 🐱","心情 +8 · 可能被抓"],["餵貓吃零食","用一包零食 · 心情 +15","feed"]]}};
const HOURS={cafe:[7,21,"咖啡廳","7:00～21:00"],cinema:[12,24,"電影院","12:00～24:00"],gym:[6,23,"健身房","6:00～23:00"],arena:[10,24,"格鬥場","10:00～24:00"],restaurant:[11,22,"餐廳","11:00～22:00"],market:[8,23,"超市","8:00～23:00"],stall:[16,24,"烤地瓜攤","16:00～24:00"]};
const tpHour=()=>new Date(Date.now()+8*36e5).getUTCHours();
const closedMsg=k=>{if(!isOn(k))return `這個小鎮沒有${(FEATS.find(f=>f[0]==k)||[,"這個設施"])[1]}`;const h=HOURS[k];if(!h)return null;const x=tpHour();return x>=h[0]&&x<h[1]?null:`${h[2]}休息中，營業時間 ${h[3]}`};
const objNear=(k,x,y,place)=>{const o=OBJS[k];return o.place?place==o.place:Math.abs(x-o.x)+Math.abs(y-o.y)<=2};
const inRect=(x,y,[rx,ry,rw,rh])=>x>=rx&&x<rx+rw&&y>=ry&&y<ry+rh;
const roadRowsAt=y=>y==6||y==7||y==15||y==16||(y>=22&&(y-22)%7<2&&Math.floor((y-22)/7)+2<NR);
const isRoad=(x,y)=>y<mapRows()&&(roadRowsAt(y)||((x==16||x==17)&&!(y>=8&&y<=14)));
const slotAt=(x,y)=>{for(let s=0;s<NR*3;s++){const [hx,hy]=homeXY(s);if(inRect(x,y,[hx,hy,5,4]))return s}return -1};
function blocked(x,y){if(x<0||y<0||x>=COLS||y>=mapRows())return true;if(inRect(x,y,FOUNTAIN))return true;if(slotAt(x,y)>=0)return true;
 for(const k in PLACES)if(PLACES[k].block&&isOn(k)&&inRect(x,y,PLACES[k].r))return true;return false}
// 最短路徑（上下左右走），找不到就回傳 null
function bfs(from,to){const key=(x,y)=>y*COLS+x,prev=new Map([[key(...from),null]]),q=[from];
 while(q.length){const [x,y]=q.shift();if(x==to[0]&&y==to[1]){const path=[];let k=key(x,y);while(k!=null){path.unshift([k%COLS,Math.floor(k/COLS)]);k=prev.get(k)}return path}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(!blocked(nx,ny)&&!prev.has(k)){prev.set(k,key(x,y));q.push([nx,ny])}}}
 return null}
// 點到的格子是哪裡：{slot} 房子、{dest} 公共地點或路上
function placeAt(x,y){const pp=POOPS.find(q=>q.x==x&&q.y==y);if(pp){const c=[[x,y+1],[x+1,y],[x-1,y],[x,y-1]].find(d=>!blocked(...d));if(c)return {dest:"street",door:c}}for(const k in OBJS){const o=OBJS[k];if(o.x!=null&&x==o.x&&y==o.y)return {dest:"street",door:[x,y+(y==5?1:0)],obj:k}}let s=slotAt(x,y);if(s<0)for(let i=0;i<NR*3;i++){const d=door(i);if(d[0]==x&&d[1]==y)s=i}if(s>=0)return {slot:s};
 for(const k in PLACES)if(isOn(k)&&inRect(x,y,PLACES[k].r))return {dest:k,door:PLACES[k].door};
 if(inRect(x,y,FOUNTAIN))return {dest:"plaza",door:PLACES.plaza.door};
 return blocked(x,y)?null:{dest:"street",door:[x,y]}}

// ── 需求：和資料庫同一套算法，只用來即時顯示（真正的數字以資料庫為準）──
const NEEDS=["hunger","energy","bladder","hygiene","fun"];
const NEED_INFO={hunger:["🍚","飽足"],energy:["⚡","精力"],bladder:["🚽","膀胱"],hygiene:["🛁","清潔"],fun:["🎉","心情"]};
// 個性特質（items.tr）與心情（由需求算，規則要和 town.sql 的 town_mood／town_pay 一致）
const FURN=[["bed","好床",5000,"睡覺精力每小時 +90"],["fridge","冰箱",8000,"在家吃飯 €30、飽足 +48"],["massage","按摩椅",9000,"快速休息精力 +100"],["shelf","書櫃",4000,"之後技能用，先佔位"],["sofa","沙發",6000,"看電視心情 +22"],["tvcab","電視櫃",5000,"看電視 10 分鐘一次"],["rug","地毯",1500,"裝飾"],["plant","盆栽",800,"裝飾"]];
const HOUSES=[["小屋",0,4],["公寓",10000,6],["獨棟",100000,8],["豪宅",200000,9]];// 名稱、升級價、家具格數
const hasF=(r,k)=>!!(r.items&&Array.isArray(r.items.fu)&&r.items.fu.includes(k));
function hasT(r,k){const t=r.items&&r.items.tr;return Array.isArray(t)&&t.includes(k)}
function moodOf(r){if(r.items&&r.items.sad)return"sad";const a=(r.hunger+r.energy+r.bladder+r.hygiene+r.fun)/5,m=Math.min(r.hunger,r.energy,r.bladder,r.hygiene,r.fun);return a<35||r.fun<20?"low":a<55||m<20||r.fun<40?"annoyed":a>=75&&r.fun>=65&&m>=40?"happy":"normal"}
const MOOD={happy:["😊","開心","薪水 +10%、好感 ×1.2、打架 +5"],normal:["🙂","普通","沒有加成"],annoyed:["😤","煩躁","薪水 −5%、好感 ×0.8、打架 −3"],low:["🥺","低落","薪水 −10%、好感 ×0.7、打架 −8"],sad:["🥺","心情谷底","薪水 −30%、好感 ×0.7、打架 −8，心情回到 20 才恢復"]};
const MOOD_WAGE={happy:110,normal:100,annoyed:95,low:90,sad:70};
const payOf=(base,r)=>Math.floor((base*MOOD_WAGE[moodOf(r)]*(hasT(r,"workaholic")?110:100)*2+10000)/20000);
function tickLocal(r,now){const h=Math.min(72,Math.max(0,(now-Date.parse(r.updated_at))/36e5)),o={...r},hm=hasT(r,"clean")?.7:1;
 // 離線保護（和 town_tick 一致）：最後動作 30 分鐘後的時間，消耗 ×0.4、需求最低停在 15
 const sa=r.seen_at?Date.parse(r.seen_at)+18e5:Infinity,t0=now-h*36e5,hon=Math.max(0,Math.min(h,(sa-t0)/36e5)),hof=h-hon,fl=(v,d)=>Math.max(v-d,Math.min(v,15));
 const dec=(k,rate)=>{o[k]=fl(o[k]-rate*hon,.4*rate*hof)};
 if(o.sleeping){o.energy+=(80+(hasF(r,"bed")?10:0))*h;dec("hunger",5);dec("bladder",7);dec("hygiene",2.4*hm);dec("fun",1.6)}
 else{dec("hunger",8);dec("bladder",10);dec("hygiene",5*hm);
  let e=o.energy-5*hon;if(hasT(r,"nightowl")){for(let t=t0;t<now;){const st=Math.min(.25,(now-t)/36e5),hr=(Math.floor(t/36e5)+8)%24;if(hr>=22||hr<6)e+=st*(t<sa?1:.4);t+=st*36e5}}o.energy=fl(e,.4*5*hof);
  const ex=(o.hunger<20||o.bladder<20||o.hygiene<20)?3*hon:0,exf=(o.hunger<20||o.bladder<20||o.hygiene<20)?.4*3*hof:0,v=o.fun-4*hon-ex;o.fun=fl(v,.4*4*hof+exf)}
 NEEDS.forEach(k=>o[k]=clamp(o[k],0,100));return o}

if(typeof module!=="undefined")module.exports={setOff,OBJS,objNear,T,COLS,setRows,mapRows,homeXY,door,visitSpot,PLACES,blocked,bfs,placeAt,slotAt,tickLocal,isRoad,hasT,moodOf,payOf,hasF,FURN,HOUSES};
if(typeof document!=="undefined")addEventListener("DOMContentLoaded",init);

function init(){
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const PXC={};
const KEEP=[];function preloadIcons(){if(!window.PIXICON)return;Object.keys(window.PIXICON_MAP||{}).forEach(e=>{const i=new Image();i.src=pxIcon(e);KEEP.push(i)})}
const PIMGS={};function cimgP(e){const u=pxIcon(e);if(!u)return{complete:false};if(!PIMGS[e]){const i=new Image();i.src=u;PIMGS[e]=i}return PIMGS[e]}
function pxIcon(e){return PXC[e]||(PXC[e]=window.PIXICON?PIXICON(e):"")}
setTimeout(preloadIcons,0);
const EMO=/(\p{Extended_Pictographic}(\uFE0F|\u200D\p{Extended_Pictographic})*)/gu;
function pxify(root){if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(w.nextNode()){const n=w.currentNode;if((EMO.test(n.nodeValue)||(CUR!="€"&&n.nodeValue.includes("€")))&&!n.parentElement.closest("textarea,input,canvas,select"))nodes.push(n);EMO.lastIndex=0}
 for(const n of nodes){const tv=CUR=="€"?n.nodeValue:n.nodeValue.replace(/€/g,()=>CUR);if(!EMO.test(tv)){EMO.lastIndex=0;n.nodeValue=tv;continue}EMO.lastIndex=0;const span=document.createElement("span");span.innerHTML=tv.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])).replace(EMO,m=>`<img class="px" alt="${m}" src="${pxIcon(m)}">`);n.replaceWith(...span.childNodes)}}
// 畫面任何地方新增的 emoji 都自動變成像素圖示（選單、彈窗、首頁、需求列）
{let q=new Set(),pend=false;new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)q.add(n.nodeType==3?n.parentElement:n);if(!pend){pend=true;requestAnimationFrame(()=>{pend=false;const l=[...q];q.clear();l.forEach(el=>el&&el.isConnected&&pxify(el))})}}).observe(document.body,{childList:true,subtree:true,characterData:false});
 addEventListener("load",()=>pxify(document.body))}
const toast=t=>{const el=$("toast");el.textContent=t;el.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("on"),2600)};
const SKIN=["#f1c9a5","#e0ac7e","#c68a5a","#8d5a3a"],HAIR=["#222222","#5a3a1a","#a0522d","#d9b26a","#c0c0c0","#c0392b"],SHIRT=["#d9534f","#3b7dd8","#b45cc4","#8b5a2b","#2e9e5b","#d8901a","#333a44","#f0f0f0"],STYLE=["短髮","長髮","光頭","帽子"];
const rp=a=>a[Math.floor(Math.random()*a.length)];
const randLook=()=>({skin:rp(SKIN),hair:rp(HAIR),shirt:rp(SHIRT),style:rp(["短髮","長髮","馬尾","捲髮","瀏海"]),eyes:rp(["圓眼","瞇眼","眼鏡"]),top:rp(["T恤","帽T","襯衫"]),pants:rp(["#2b2b3a","#3b5a8a","#6b4a2b"]),bottom:rp(["長褲","短褲","裙子"]),acc:"無"});
const QS=new URLSearchParams(location.search),TID=(QS.get("t")||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8);
{const i=(QS.get("i")||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8);if(i&&TID){try{sessionStorage.setItem("town-inv-"+TID,i)}catch(e){}history.replaceState(null,"","?t="+TID)}}
let CUR="NT$";
const CURS=[["€","歐元 €"],["$","美元 $"],["NT$","台幣 NT$"],["¥","日圓／人民幣 ¥"],["£","英鎊 £"],["₩","韓元 ₩"],["豬幣","豬幣"],["★","星幣 ★"]];
const curSel=cur=>`<label>貨幣<select id="cur" style="width:100%;margin-top:4px">${CURS.map(([v,n])=>`<option value="${v}" ${v==cur?"selected":""}>${n}</option>`).join("")}</select></label>`;
let S=null,R={},offset=0,me=null,pin=null,sel=null,zoomFar=false,camFree=false,busy=false,lastSeen=null;
const walkers={};// 每個人畫面上的位置與正在走的路
const now=()=>Date.now()+offset;
const taipeiHour=()=>new Date(now()+8*36e5).getUTCHours();
const isNight=()=>{const h=taipeiHour();return h>=19||h<6};
const bySlot=s=>Object.values(R).find(r=>r.slot==s);
const placeName=p=>p&&p.startsWith("home:")?((R[p.slice(5)]||{}).name||"空屋")+" 家":(PLACES[p]||{}).name||"路上";
const bondWith=id=>{const a=Math.min(me,id),b=Math.max(me,id),x=((S&&S.bonds)||[]).find(o=>o.a==a&&o.b==b);return x?x.s:0};
// 和資料庫 town_tier 一樣的 7 階
const bondLabel=v=>v>=60?"🤝 生死之交":v>=30?"💞 好麻吉":v>=10?"😊 好朋友":v<=-50?"⚔️ 宿敵":v<=-20?"😤 死對頭":v<=-5?"😒 有點不爽":"🙂 普通鄰居";
const NEXT_TIER=[[60,"生死之交"],[30,"好麻吉"],[10,"好朋友"]];
const tierHint=v=>{const n=NEXT_TIER.slice().reverse().find(([x])=>v<x);return n?`再 ${n[0]-v} 分變成「${n[1]}」`:"已經是最高等級"};
// 面對面：在同一個地方（不算路上），或在路上距離 2 格以內
const isNear=id=>{const a=R[me],b=R[id],wa=walkers[me],wb=walkers[id];if(!a||!b)return false;return (a.place==b.place&&a.place!="street"&&!(wa&&wa.path.length))||(Math.abs(wa.x-wb.x)+Math.abs(wa.y-wb.y)<=2.5)};
const BAD=["prank","egg","fight"];
const grudges=()=>{const done=new Set((S.events||[]).filter(e=>e.actor==me&&e.kind=="fight"&&Date.parse(e.at)>now()-6*36e5).map(e=>e.target));return (S.events||[]).filter(e=>e.target==me&&BAD.includes(e.kind)&&R[e.actor]&&Date.parse(e.at)>now()-3*864e5&&!done.has(e.actor))};
const THANKABLE=["feed","wash","visit","gift","note","greet","delivery","call","feast"];
const thankable=()=>{const done=new Set((S.events||[]).filter(e=>e.actor==me&&e.kind=="thank"&&Date.parse(e.at)>now()-12*36e5).map(e=>e.target));return (S.events||[]).filter(e=>e.target==me&&THANKABLE.includes(e.kind)&&R[e.actor]&&Date.parse(e.at)>now()-3*864e5&&!done.has(e.actor))};
const houseName=s=>`${STREETS[Math.floor(s/3)]} ${s%3+1} 號`;

// ── 我住的小鎮（存在這台手機）──
const mine=()=>{try{return JSON.parse(localStorage.getItem("town-mine")||"[]")}catch(e){return []}};
const saveMine=e=>{const l=mine().filter(x=>x.tid!=e.tid);l.unshift(e);try{localStorage.setItem("town-mine",JSON.stringify(l.slice(0,10)))}catch(er){}};
const dropMine=tid=>{try{localStorage.setItem("town-mine",JSON.stringify(mine().filter(x=>x.tid!=tid)))}catch(e){}};
const go=tid=>{location.search="?t="+tid};
// 裝置金鑰：每台手機自動產生一組，代替密碼（存在這台手機上，不用記）
const newKey=()=>{const a="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789",b=crypto.getRandomValues(new Uint8Array(32));return [...b].map(x=>a[x%a.length]).join("")};

// ── 首頁：建立小鎮、用代碼加入、我住的小鎮 ──
function landing(){document.body.classList.remove("ingame");$("title").textContent="🐷 小豬鎮";$("game").classList.add("hide");$("login").classList.remove("hide");const list=mine();
 $("lg").innerHTML=`<div class="hero"><canvas id="heroCv" width="96" height="120"></canvas><div><h2 style="margin:0">和朋友住在同一個小鎮</h2><p class="mut" style="margin:4px 0 0">照顧自己吃飯睡覺洗澡，去朋友家幫忙、送禮、惡作劇，或扁他一頓。手機打開就能玩，不用下載。</p></div></div>
  ${list.length?`<h2>我住的小鎮</h2><div class="list">${list.map(x=>`<button class="big" data-go="${esc(x.tid)}"><span class="ai">🏡</span><span><b>${esc(x.name||x.tid)}</b><small>${esc(x.me||"")} · 點一下回家</small></span></button>`).join("")}</div>`:""}
  <div class="choose"><button class="big pri" id="cJoin"><span class="ai">💌</span><span><b>加入朋友的小鎮</b><small>有朋友給的邀請碼或連結</small></span></button>
   <button class="big" id="cNew"><span class="ai">🏛️</span><span><b>建立新小鎮</b><small>自己當鎮長，邀請朋友搬進來</small></span></button></div>
  <div id="fJoin" class="hide"><h2>加入朋友的小鎮</h2><p class="mut" style="margin:-4px 0 6px">輸入朋友給你的邀請碼。點朋友傳來的邀請連結會自動填好。</p><div class="inline"><input id="code" placeholder="邀請碼，例如 RCDR4V" maxlength="8" autocomplete="off" style="text-transform:uppercase"><button class="pri" id="join">前往</button></div><p class="err" id="jerr"></p></div>
  <div id="fNew" class="hide"><h2>建立新小鎮</h2><label>小鎮名稱<input id="tn" maxlength="16" placeholder="例如：我們的小豬鎮"></label><label>你的名字<input id="mn" maxlength="12" placeholder="鎮上大家怎麼叫你"></label>
  ${curSel("NT$")}<h2 style="margin-top:12px">小鎮特色</h2><p class="mut" style="margin:-4px 0 6px">勾選要開的設施，之後在鎮長設定隨時能改</p>${featChecks([])}
  <div id="lk"></div><p class="err" id="cerr"></p><div class="row"><button class="pri" id="create">建立小鎮，當鎮長</button></div></div>
  ${standalone?"":`<p style="margin-top:14px"><button class="ghost" id="inst2">📲 加到手機主畫面，像 App 一樣打開</button></p>`}`;
 const show=k=>{$("fJoin").classList.toggle("hide",k!="j");$("fNew").classList.toggle("hide",k!="n");$("cJoin").classList.toggle("pri",k!="n");$("cNew").classList.toggle("pri",k=="n");(k=="j"?$("code"):$("tn")).focus()};
 $("cJoin").onclick=()=>show("j");$("cNew").onclick=()=>show("n");miniPerson($("heroCv"),{skin:"#f1c9a5",hair:"#5a3a1a",style:"短髮",eyes:"圓眼",top:"T恤",shirt:"#e0779b",acc:"pigears",blush:true});
 $("lg").querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));if($("inst2"))$("inst2").onclick=installHelp;
 $("join").onclick=async()=>{const c=$("code").value.trim().toUpperCase().replace(/[^A-Z0-9]/g,"");if(c.length<4){$("jerr").textContent="邀請碼是 6 個英文或數字";return}
  // 小鎮代碼或邀請碼都可以；輸入的是邀請碼就記起來，等一下自動填好
  try{const f=await rpc("town_find",{code:c});if(!f){$("jerr").textContent="邀請碼不對，請朋友再傳一次";return}try{sessionStorage.setItem("town-inv-"+f.town_id,c)}catch(e){}go(f.town_id)}catch(e){$("jerr").textContent=e.message}};
 let look=randLook();lookPicker($("lk"),look,l=>look=l);
 $("create").onclick=async()=>{const tn=$("tn").value.trim(),mn=$("mn").value.trim(),p=newKey();
  if(!tn){$("cerr").textContent="幫小鎮取個名字";return}if(!mn){$("cerr").textContent="填你的名字";return}
  $("create").disabled=true;try{const r=await rpc("town_create",{town_name:tn,my_name:mn,pin:p,look});const off=readFeats();if(off.length)try{await rpc("town_features",{rid:r.resident_id,pin:p,off})}catch(e){}const cu=$("cur").value;if(cu!="NT$")try{await rpc("town_currency",{rid:r.resident_id,pin:p,cur:cu})}catch(e){}saveMine({tid:r.town_id,name:tn,rid:r.resident_id,pin:p,me:mn,invite:r.invite});go(r.town_id)}
  catch(e){$("cerr").textContent=e.message;$("create").disabled=false}}}

// ── 鎮內登入：我住在這裡，或用邀請碼搬進來 ──
async function refresh(){const st=await rpc("town_state",{tid:TID});apply(st)}
const seenLuck=new Set();
function apply(st){S=st;POOPS=st.poops||[];CUR=(st.town&&st.town.cur)||"NT$";try{fxFromEvents(st.events||[])}catch(e){}if(me)(st.events||[]).filter(e=>(e.kind=="luck"||e.kind=="rent")&&e.actor==me&&!seenLuck.has(e.id)).forEach(e=>{seenLuck.add(e.id);if(Date.parse(e.at)>Date.parse(st.now)-20e3)toast(e.msg)});offset=Date.parse(st.now)-Date.now();setRows(st.town.rows);R={};
 st.residents.forEach(r=>{R[r.id]=r;const w=walkers[r.id];
  if(!w)walkers[r.id]={x:r.x,y:r.y,path:[],tx:r.x,ty:r.y};else if(r.id!=me&&(Math.abs(w.tx-r.x)>.01||Math.abs(w.ty-r.y)>.01)){const p=bfs([Math.round(w.x),Math.round(w.y)],[Math.round(r.x),Math.round(r.y)]);w.path=p?p.slice(1):[[r.x,r.y]]}
  walkers[r.id].tx=r.x;walkers[r.id].ty=r.y});
 setOff(st.town.off);const key=st.town.rows+"|"+(st.town.off||[]).join()+"|"+st.residents.map(r=>r.id+":"+r.slot+":"+r.name+":"+JSON.stringify([(r.items||{}).roof,(r.items||{}).wall,(r.items||{}).d,(r.items||{}).hl])).join(",");if(key!=mapKey){mapKey=key;maps={}}
 $("title").textContent="🐷 "+st.town.name;if(me&&!R[me]){toast("你已經搬離這個小鎮");dropMine(TID);setTimeout(()=>go(""),1200)}
 renderFeed();renderPanel();renderNeeds();if(me)renderStrip();pxify($("feed"));pxify($("tab-rank"));pxify($("tab-ppl"))}
let mapKey="";
function townLogin(){document.body.classList.remove("ingame");$("login").classList.remove("hide");$("game").classList.add("hide");const res=Object.values(R),full=res.length>=12;
 $("lg").innerHTML=`<p class="mut">住了 ${res.length} 人${savedInv()?" · 邀請碼已自動填好":""}</p>
  ${res.length?`<h2>我住在這裡</h2><div class="who">${res.map(r=>`<button data-id="${r.id}"><canvas width="40" height="44" data-look='${esc(JSON.stringify(r.look||{}))}'></canvas><b>${esc(r.name)}</b><small>${r.mayor?"鎮長":houseName(r.slot)}</small></button>`).join("")}</div>`:""}
  ${full?`<p class="mut">小鎮已經住滿 12 人了。</p>`:`<h2>我要搬進來</h2><div class="row" style="justify-content:flex-start"><button class="pri" id="mv">用邀請碼搬進來</button></div>`}
  <div class="row" style="justify-content:flex-start"><button id="home2">← 小豬鎮首頁</button></div>`;
 $("lg").querySelectorAll("canvas").forEach(c=>{const l=JSON.parse(c.dataset.look);miniPerson(c,l.skin?l:{skin:SKIN[0],hair:"#999",shirt:"#bbb",style:"短髮"})});
 $("lg").querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>pinStep(+b.dataset.id));
 if($("mv"))$("mv").onclick=()=>joinStep();$("home2").onclick=()=>go("")}
const savedInv=()=>{try{return sessionStorage.getItem("town-inv-"+TID)||""}catch(e){return ""}};
function pinStep(id){const r=R[id];$("lg").innerHTML=`<p><b>${esc(r.name)}</b>，歡迎回來</p><p class="mut">在新的手機或電腦上，輸入一次小鎮的邀請碼就好，之後這台裝置會一直記得你。</p>
  <label>邀請碼（WeChat 群組裡的邀請訊息有，或問鎮長）<input id="inv" maxlength="8" autocomplete="off" style="text-transform:uppercase" value="${esc(savedInv())}"></label><p class="err" id="lerr"></p>
  <div class="row"><button id="back">← 換人</button><button class="pri" id="go">進入小鎮</button></div>`;
 $("back").onclick=townLogin;$("inv").focus();
 $("go").onclick=async()=>{const inv=$("inv").value.trim().toUpperCase();if(!inv){$("lerr").textContent="填小鎮的邀請碼";return}$("go").disabled=true;
  try{const k=newKey();await rpc("town_device",{tid:TID,invite:inv,rid:id,key:k});const res=await rpc("town_login",{rid:id,pin:k});me=id;pin=k;lastSeen=res.last_seen;saveMine({tid:TID,name:S.town.name,rid:id,pin:k,me:r.name});await enter()}catch(e){$("lerr").textContent=e.message;$("go").disabled=false}}}
function joinStep(){const free=[];for(let s=0;s<12;s++)if(!bySlot(s))free.push(s);const show=free.filter(s=>Math.floor(s/3)<NR);if(!show.length&&free.length)show.push(free[0]);let slot=show[0],look=randLook();
 $("lg").innerHTML=`<p><b>搬進${esc(S.town.name)}</b></p><label>邀請碼（問鎮長）<input id="inv" maxlength="8" autocomplete="off" style="text-transform:uppercase" value="${esc(savedInv())}"></label>
  <label>你的名字<input id="mn" maxlength="12"></label>
  <p class="mut" style="margin:10px 0 4px">選一間空屋</p><div class="houses">${show.map(s=>`<button class="sw${s==slot?" on":""}" data-s="${s}">${houseName(s)}${Math.floor(s/3)>=NR?"（新街）":""}</button>`).join("")}</div>
  <div id="lk"></div><p class="err" id="lerr"></p><div class="row"><button id="back">← 返回</button><button class="pri" id="go">搬進去</button></div>`;
 $("lg").querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{slot=+b.dataset.s;$("lg").querySelectorAll("[data-s]").forEach(x=>x.classList.toggle("on",x==b))});
 lookPicker($("lk"),look,l=>look=l);$("back").onclick=townLogin;
 $("go").onclick=async()=>{const inv=$("inv").value.trim().toUpperCase(),mn=$("mn").value.trim(),p=newKey();
  if(!inv){$("lerr").textContent="填鎮長給你的邀請碼";return}if(!mn){$("lerr").textContent="填你的名字";return}
  $("go").disabled=true;try{const r=await rpc("town_join",{tid:TID,invite:inv,my_name:mn,pin:p,look,want_slot:slot});me=r.resident_id;pin=p;lastSeen=null;saveMine({tid:TID,name:S.town.name,rid:me,pin:p,me:mn});await enter()}
  catch(e){$("lerr").textContent=e.message;$("go").disabled=false}}}
// ── 造型目錄（和資料庫 town_shop 一致）：[代號, 名稱, 價格, 解鎖條件]；沒價格的是基本款 ──
const WEAR={
 style:[["短髮"],["長髮"],["光頭"],["馬尾"],["捲髮"],["包頭"],["瀏海"],["twintail","雙馬尾",1200],["mohawk","刺蝟頭",1200]],
 eyes:[["圓眼"],["瞇眼"],["眼鏡"],["墨鏡"]],
 top:[["T恤"],["帽T"],["襯衫"],["suit","西裝",4500],["jersey","球衣",1800],["dress","洋裝",2400],["couple","情侶 T",0,"有好麻吉就解鎖"]],
 bottom:[["長褲"],["短褲"],["裙子"]],
 acc:[["無"],["棒球帽"],["毛帽"],["crown","皇冠",12000],["pigears","小豬耳朵",800],["headphones","耳機",3000],["scarf","圍巾",900],["bandage","繃帶頭",0,"被扁 10 次解鎖"]]};
const DECO=[["flowers","花圃",600],["mailbox","信箱",500],["lamp","路燈",1500],["bench","長椅",2000],["tree","小樹",1200],["pigstatue","小豬雕像",8000]];
const PANTS=["#2b2b3a","#3b5a8a","#6b4a2b","#7a7a7a","#c0392b","#e8e0cc"];
const ROOF_C=["#d9534f","#3b7dd8","#b45cc4","#8b5a2b","#2e9e5b","#d8901a","#e0779b","#2a9d8f","#34495e","#9a9a9a"],WALL_C=["#f4ead6","#fff3e0","#e8f1ff","#fde2ea","#e6f4e6","#f0e6ff","#e0e0e0","#ffe8b0"];
const wInfo=(k,v)=>WEAR[k].find(a=>a[0]==v)||[v];
const isPremium=(k,v)=>{const x=wInfo(k,v);return !!(x[2]||x[3])};
// 舊存檔的「帽子」髮型改成配件
const normLook=L=>{const o={skin:"#f1c9a5",hair:"#5a3a1a",style:"短髮",eyes:"圓眼",shirt:"#3b7dd8",top:"T恤",pants:"#2b2b3a",bottom:"長褲",acc:"無",...(L||{})};if(o.style=="帽子"){o.style="短髮";if(o.acc=="無")o.acc="棒球帽"}return o};
function lookPicker(el,look,cb,items){look=normLook(look);const owned=new Set(((items||{}).w)||[]);
 const tag=(k,v)=>{const x=wInfo(k,v);if(!isPremium(k,v))return "";if(owned.has(v))return " ✔";return x[3]?` 🔒`:` €${x[2]}`};
 const opts=(k,label)=>`<div class="lrow"><span>${label}</span>${WEAR[k].filter(a=>items||!isPremium(k,a[0])).map(a=>`<button class="sw${look[k]==a[0]?" on":""}${isPremium(k,a[0])&&!owned.has(a[0])?" lock":""}" data-k="${k}" data-v="${a[0]}" title="${a[3]||""}">${a[1]||a[0]}${tag(k,a[0])}</button>`).join("")}</div>`;
 const dots=(k,arr,label)=>`<div class="lrow"><span>${label}</span>${arr.map(v=>`<button class="sw dot${look[k]==v?" on":""}" data-k="${k}" data-v="${v}" style="background:${v}" aria-label="${label}"></button>`).join("")}</div>`;
 const tog=(k,label)=>`<button class="sw${look[k]?" on":""}" data-t="${k}">${label}</button>`;
 const draw=()=>{el.innerHTML=`<div class="lookbox"><canvas width="96" height="120"></canvas><div class="lookopts">
   ${dots("skin",SKIN,"膚色")}${opts("style","髮型")}${dots("hair",HAIR,"髮色")}${opts("eyes","眼睛")}<div class="lrow"><span>細節</span>${tog("blush","腮紅")}${tog("beard","鬍子")}</div>
   ${opts("top","上衣")}${dots("shirt",SHIRT,"顏色")}${opts("bottom","下身")}${dots("pants",PANTS,"顏色")}${opts("acc","配件")}
   ${items?`<p class="mut" style="margin:6px 0 0">€ 的款式在超市「🛍️ 造型與擺飾」買；🔒 要達成條件（滑過去看）。可以先試穿看看。</p>`:""}</div></div>`;
  miniPerson(el.querySelector("canvas"),look);
  el.querySelectorAll(".sw[data-k]").forEach(b=>b.onclick=()=>{look={...look,[b.dataset.k]:b.dataset.v};cb(look);draw()});
  el.querySelectorAll(".sw[data-t]").forEach(b=>b.onclick=()=>{look={...look,[b.dataset.t]:!look[b.dataset.t]};cb(look);draw()})};cb(look);draw()}
async function enter(){document.body.classList.add("ingame");$("menuBtn").classList.remove("hide");await refresh();setTimeout(()=>{const r=R[me];if(r&&$("modal").classList.contains("hide")){if(!r.items||r.items.tr===undefined)traitModal();else if(!r.items.wish)wishModal()}},1500);showTips();refreshBell().catch(()=>{});autoPush().catch(()=>{});$("login").classList.add("hide");$("game").classList.remove("hide");camFree=false;
 const w=walkers[me];cam.x=w.x*T;cam.y=w.y*T;resize();$("mayor").classList.toggle("hide",!R[me].mayor);
 const ent=mine().find(x=>x.tid==TID);if(ent&&ent.invite){shareModal(ent.invite,true);delete ent.invite;saveMine(ent);return}
 const mineEv=(S.events||[]).filter(e=>e.target==me&&(!lastSeen||e.at>lastSeen));
 if(mineEv.length){const who=[...new Set(thankable().map(e=>e.actor))];$("away").classList.remove("hide");
  $("away").innerHTML=`<b>你不在的時候</b>${mineEv.slice(0,6).map(e=>`<p>${esc(e.msg)}</p>`).join("")}<div class="row" style="justify-content:flex-start">${who.map(id=>`<button class="pri" data-t="${id}">💗 謝謝 ${esc(R[id].name)}</button>`).join("")}<button id="awayok">知道了</button></div>`;
  $("away").querySelectorAll("[data-t]").forEach(b=>b.onclick=async()=>{b.disabled=true;await act("thank",{target:+b.dataset.t});b.textContent="已道謝"});$("awayok").onclick=()=>$("away").classList.add("hide")}
 else $("away").classList.add("hide")}

// ── 邀請朋友 ──
const townURL=inv=>location.origin+location.pathname+"?t="+TID+(inv?"&i="+inv:"");
function shareModal(inv,fresh){const text=`來「${S.town.name}」當鄰居！🐷\n點連結就能搬進來：${townURL(inv)}\n（邀請碼：${inv}）`;$("modal").classList.remove("hide");
 $("mbody").innerHTML=`<h2>${fresh?"小鎮建好了！":"邀請朋友"}</h2><p>把這段訊息傳到 WeChat 群組。朋友點連結，邀請碼會自動填好，取個名字就能搬進來：</p><textarea id="shtxt" rows="4" readonly>${esc(text)}</textarea>
  <p class="mut">邀請碼只給想邀請的人。鎮長可以隨時在「🏛️ 鎮長」換一組新的。</p><div class="row"><button id="mc">關閉</button><button class="pri" id="mcp">複製訊息</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");$("mcp").onclick=async()=>{try{await navigator.clipboard.writeText(text);toast("已複製，貼到 WeChat 吧")}catch(e){$("shtxt").select();toast("請長按文字複製")}}}
const featChecks=off=>`<div class="list feats">${FEATS.map(([k,n,d])=>`<label class="mrow" style="cursor:pointer"><span><b>${n}</b> <small class="mut">${d}</small></span><input type="checkbox" data-f="${k}" ${off.includes(k)?"":"checked"} style="width:22px;height:22px"></label>`).join("")}</div>`;
const readFeats=()=>[...document.querySelectorAll("[data-f]")].filter(c=>!c.checked).map(c=>c.dataset.f);
async function mayorPanel(){let inv="",cta=[];try{cta=(await rpc("town_mayor",{rid:me,pin,act:"stats"})).stats||[]}catch(e){}
 const ctaHTML=()=>{const sh=cta.reduce((a,c)=>a+c.shows,0),cl=cta.reduce((a,c)=>a+c.clicks,0);return cta.length?`<p class="mut">近 7 天共顯示 ${sh} 次、點了 ${cl} 次（${sh?Math.round(cl/sh*100):0}%）</p><div class="list">${cta.map(c=>`<div class="mrow"><span><b>${esc(c.key)}</b></span><small class="mut">顯示 ${c.shows} · 點 ${c.clicks} · ${c.shows?Math.round(c.clicks/c.shows*100):0}%</small></div>`).join("")}</div>`:`<p class="mut">還沒有資料，大家玩一陣子就會出現。</p>`};try{inv=(await rpc("town_mayor",{rid:me,pin,act:"invite"})).invite}catch(e){toast(e.message);return}
 const draw=()=>{$("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>🏛️ 鎮長</h2><p>邀請碼：<b class="code">${esc(inv)}</b></p>
  <div class="row" style="justify-content:flex-start"><button class="pri" id="msh">邀請朋友</button><button id="mni">換一組新邀請碼</button></div>
  <h2 style="margin-top:16px">貨幣</h2>${curSel(CUR)}<div class="row" style="justify-content:flex-start"><button class="pri" id="mcs">儲存貨幣</button></div>
  <h2 style="margin-top:16px">小鎮特色</h2>${featChecks([...OFF])}<div class="row" style="justify-content:flex-start"><button class="pri" id="mfs">儲存設施</button></div>
  <h2 style="margin-top:16px">建議下一步統計</h2>${ctaHTML()}
  <h2 style="margin-top:16px">鎮民（${Object.keys(R).length}/12）</h2><div class="list">${Object.values(R).sort((a,b)=>a.slot-b.slot).map(r=>`<div class="mrow"><span><b>${esc(r.name)}</b> <small class="mut">${houseName(r.slot)}${r.mayor?" · 鎮長":""}</small></span>${r.id==me?"":`<button data-k="${r.id}">請他搬走</button>`}</div>`).join("")}</div>
  <div class="row"><button id="mc">關閉</button></div>`;
  $("mc").onclick=()=>$("modal").classList.add("hide");$("msh").onclick=()=>shareModal(inv);
  $("mcs").onclick=async()=>{try{await rpc("town_currency",{rid:me,pin,cur:$("cur").value});toast("貨幣換好了");setTimeout(()=>location.reload(),600)}catch(e){toast(e.message)}};
  $("mfs").onclick=async()=>{try{await rpc("town_features",{rid:me,pin,off:readFeats()});await refresh();toast("設施更新好了");draw()}catch(e){toast(e.message)}};
  $("mni").onclick=async()=>{if(!confirm("換新邀請碼後，舊的就不能用了。確定嗎？"))return;try{inv=(await rpc("town_mayor",{rid:me,pin,act:"newinvite"})).invite;toast("換好了");draw()}catch(e){toast(e.message)}};
  $("mbody").querySelectorAll("[data-k]").forEach(b=>b.onclick=async()=>{const r=R[b.dataset.k];if(!confirm(`確定請 ${r.name} 搬離小鎮？他的資料會被刪除，不能復原。`))return;
   try{await rpc("town_mayor",{rid:me,pin,act:"kick",target:r.id});await refresh();toast(`${r.name} 搬走了`);draw()}catch(e){toast(e.message)}})};draw()}

// ── 動作 ──
const floaters=[],fxs=[],FXIMG={};
// 動作對應的動畫：自己的動作在 act() 播；別人（或自己）的社交事件在收到新動態時播
const ACT_FX={coffee:"can",movie:"sparkle",workout:"fist",spar:"fight",sneak:"scooter",nap:"zzz",eat:"eat",dine:"eat",snack:"eat",toilet:"toilet",shower:"bubbles",tv:"tv",sleep:"zzz",work:"coins",play:"hearts",browse:"sparkle",buy:"bag",paint:"paint",wake:"sun"};
const OBJ_FX={dummy:"fight",bench:"zzz",cooler:"bubbles",pwc:"toilet",mailbox:"sparkle",news:"sparkle",claw:"hearts",lottery:"coins",busker:"hearts",pond:"hearts",vend:"can",trash:"sparkle",stall:"eat",well:"coin",swing:"hearts",cat:"hearts"};
const EV_FX={feed:["eat","t"],wash:["bubbles","t"],visit:["hearts","both"],gift:["gift","fly"],note:["msg","fly"],call:["phone","both"],delivery:["scooter","fly"],thank:["hearts","fly"],greet:["clap","mid"],fight:["fight","mid"],egg:["egg","fly"],prank:["fart","t"],makeup:["hearts","mid"],cowork:["coins","both"],promo:["sparkle","a"],wish:["sparkle","a"],feast:["eat","both"],wakeup:["alarm","t"],luck:["sparkle","a"],tier:["hearts","both"],look:["sparkle","a"],meet:["clap","a"],together:["hearts","a"]};
const spawnFx=(type,a,b)=>{if(!walkers[a])return;fxs.push({type,a,b:b&&walkers[b]?b:null,born:performance.now(),dur:type=="fight"?1800:type=="scooter"?2200:1500})};
let lastEvId=null;
function fxFromEvents(evs){const mx=Math.max(0,...evs.map(e=>e.id));if(lastEvId==null){lastEvId=mx;return}
 evs.filter(e=>e.id>lastEvId).forEach(e=>{const f=EV_FX[e.kind];if(!f)return;const [t,mode]=f;
  if(mode=="t")spawnFx(t,e.target||e.actor);else if(mode=="a")spawnFx(t,e.actor);else if(mode=="both"){spawnFx(t,e.actor);if(e.target&&e.target!=e.actor)spawnFx(t,e.target)}else spawnFx(t,e.actor,e.target)});lastEvId=mx}
// 動態、排行、人際、鎮民列：內容一樣就不重畫（每幾秒更新一次，重畫會讓圖示閃一下）
function stableHTML(el){if(!el)return;const d=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML");let last;Object.defineProperty(el,"innerHTML",{get(){return d.get.call(el)},set(v){if(v===last)return;last=v;d.set.call(el,v)}})}
["feed","tab-rank","tab-ppl","strip"].forEach(id=>stableHTML($(id)));
// 建議下一步統計：顯示（同一個建議 5 分鐘內只算一次）和點擊
const ctaKey=l=>l.replace(/\p{Extended_Pictographic}\uFE0F?/gu,"").replace(/\s+/g," ").trim().slice(0,24),ctaSeen={};
function track(kind,label){try{const key=ctaKey(label);if(!key||!me)return;if(kind=="show"){const t=Date.now();if(ctaSeen[key]&&t-ctaSeen[key]<3e5)return;ctaSeen[key]=t}rpc("town_track",{rid:me,pin,kind,key}).catch(()=>{})}catch(e){}}
// 只換內容變了的那一格；沒變的格子（和裡面的圖示）完全不動，才不會閃
function patchList(box,html){const t=document.createElement("div");t.innerHTML=html;const n=[...t.children];
 n.forEach((c,i)=>{const o=box.children[i];c._src=c.outerHTML;if(!o){box.appendChild(c);pxify(c)}else if(o._src!==c._src){o.replaceWith(c);pxify(c)}});
 while(box.children.length>n.length)box.lastElementChild.remove()}
// 按下去的回饋：按鈕亮框 → 成功閃綠／失敗搖晃，右上角顯示這次的結果
let pressed=null,fbTimer=0;
function press(b,fn){pressed=b.dataset.i;b.classList.add("working");const rs=fn();setTimeout(()=>{if(!busy)clearWorking()},350);return rs}
const clearWorking=()=>$("acts").querySelectorAll(".working").forEach(x=>x.classList.remove("working"));
function feedback(ok,msg){clearWorking();const b=pressed!=null&&$("acts").querySelector(`[data-i="${pressed}"]`);pressed=null;
 if(b){b.classList.remove("ok","err");void b.offsetWidth;b.classList.add(ok?"ok":"err");setTimeout(()=>b.classList.remove("ok","err"),700)}
 const f=$("fb");if(f&&msg){f.textContent=(ok?"✓ ":"✗ ")+msg;f.className=ok?"good":"bad";pxify(f);clearTimeout(fbTimer);fbTimer=setTimeout(()=>{f.className="hide"},3200)}}
async function act(a,extra={}){if(busy)return;busy=true;$("acts").classList.add("busy");const b0=tickLocal(R[me],now());try{const st=await rpc("town_act",{rid:me,pin,act:a,...extra});apply(st);
  if(ACT_FX[a])spawnFx(ACT_FX[a],me);if(a=="buy"){spawnFx("bag",me);toast("已放進背包")}if(a=="obj"&&OBJ_FX[extra.item])spawnFx(OBJ_FX[extra.item],me);
  const b1=tickLocal(R[me],now()),ic={hunger:"🍚",energy:"⚡",bladder:"🚽",hygiene:"🛁",fun:"🎉",money:"€"};let k=0;
  for(const f of ["money",...NEEDS]){const d=Math.round(b1[f]-b0[f]);if(Math.abs(d)>=1&&a!="move")floaters.push({t:f=="money"?`${d>0?"+":"−"}${CUR}${Math.abs(d)}`:`${ic[f]} ${d>0?"+":""}${d}`,good:d>0,born:performance.now()+k++*180})}
  if(a!="move")feedback(true,sumChanges(b0,b1,ic))}
 catch(e){toast(e.message);feedback(false,e.message)}busy=false;$("acts").classList.remove("busy");renderPanel()}
function sumChanges(b0,b1,ic){const o=[];for(const f of ["money",...NEEDS]){const d=Math.round(b1[f]-b0[f]);if(Math.abs(d)>=1)o.push(f=="money"?`${d>0?"+":"−"}€${Math.abs(d)}`:`${ic[f]}${d>0?"+":""}${d}`)}return o.join(" ")||"完成"}
function walkTo(dest,d){const w=walkers[me],p=bfs([Math.round(w.x),Math.round(w.y)],d);if(!p){toast("走不到那裡");return}
 w.path=p.slice(1);w.dest=dest;w.goal=d;camFree=false;if(!w.path.length)arrived(w);renderPanel()}
function arrived(w){const d=w.dest;w.dest=null;act("move",{px:w.goal[0],py:w.goal[1],dest:d})}
const goHouse=s=>{const o=bySlot(s);if(!o){toast(`${houseName(s)}是空屋，邀請朋友搬進來吧`);return}walkTo("home:"+o.id,o.id==me?door(s):visitSpot(s))};

// ── 下方面板：依所在地點顯示可以做的事 ──
const btn=(label,sub,fn,g)=>({label,sub,fn,g});
const ACT_ICON={吃飯:"🍚",上廁所:"🚽",洗澡:"🛁",看電視:"📺",睡覺:"😴",起床:"☀️",吃一頓:"🍽️",打工:"💼",玩一下:"🎈",逛逛:"👀",煮飯給他:"🍳",幫他洗澡:"🧽",叫醒他:"⏰",串門子:"🏠",惡作劇:"💨",送禮物:"🎁",盪鞦韆:"🎠",快速休息:"😴",餵貓吃零食:"🐟",取消:"✖️"};
const GROUP={tip:"建議下一步",self:"照顧自己",friend:"在他家",place:"在這裡",face:"面對面",online:"線上 · 在哪都能做",move:"移動"};let lastPanel="",panelFns=[];
function renderPanel(){if(!S||!me||!R[me])return;const r=tickLocal(R[me],now()),p=r.place,list=[];let title="",note="";
 if(walkers[me]&&walkers[me].path.length){title="走路中…";note="到了就可以做事"}
 else if(r.sleeping){title=`在${placeName(p)}睡覺 💤`;list.push(btn("起床","",()=>act("wake")))}
 else if(p=="home:"+me){title="你家";list.push(btn("吃飯",`飽足 +${hasF(r,"fridge")?48:40} · 精力 +15 · €${hasF(r,"fridge")?30:60}`,()=>act("eat")),btn("上廁所","膀胱回滿",()=>act("toilet")),btn("洗澡","清潔回滿 · 精力 +10 · 10 分鐘一次",()=>act("shower")),btn("看電視",`心情 +${hasF(r,"sofa")?22:15} · ${hasF(r,"tvcab")?10:15} 分鐘一次`,()=>act("tv")),btn("快速休息",`精力 +${hasF(r,"massage")?100:70} · 15 分鐘一次`,()=>act("nap")),btn("睡覺",`精力每小時 +${hasF(r,"bed")?90:80}`,()=>act("sleep")),btn("室內","擺家具、升級房子",()=>interiorModal(me)),btn("🎨 裝潢","換屋頂、牆壁顏色",()=>paintModal()))}
 else if(p&&p.startsWith("home:")&&R[p.slice(5)]){const id=+p.slice(5),t=tickLocal(R[id],now());title=`${t.name} 家`;const peek=btn("看室內",`${HOUSES[((R[id].items||{}).hl||1)-1][0]} · 看他怎麼布置`,()=>interiorModal(id));
  const gifts=(r.items||{}).gift||0,giftB=gifts?btn("送禮物",`他心情 +20 · 背包 🎁${gifts}`,()=>act("gift",{target:id})):btn("送禮物","先去超市買",()=>toast("背包沒有禮物，去超市買一份"));
  if(t.place!=p){note=`${t.name} 不在家，在${placeName(t.place)}。可以在門口留言或放禮物，他回來會看到 · ${bondLabel(bondWith(id))}`;list.push(giftB,peek,btn("丟雞蛋 🥚","好感 −1",()=>act("egg",{target:id})),btn(`📱 傳訊息給他`,"在哪都能傳",()=>noteModal(id)))}
  else{note=`${t.name}${t.sleeping?" 在睡覺":""}：飽足 ${Math.round(t.hunger)}、清潔 ${Math.round(t.hygiene)}、心情 ${Math.round(t.fun)} · ${bondLabel(bondWith(id))}`;list.push(giftB);
   list.push(peek,btn("煮飯給他","他飽足 +35 · €60",()=>act("feed",{target:id})),btn("幫他洗澡","他清潔 +45",()=>act("wash",{target:id})));
   if(t.sleeping)list.push(btn("叫醒他","",()=>act("wakeup",{target:id})));
   if(!t.sleeping)list.push(btn("串門子","兩人心情 +15",()=>act("visit",{target:id})));list.push(btn("惡作劇","放個臭屁 💨 · 好感 −2",()=>act("prank",{target:id})),btn("丟雞蛋 🥚","好感 −1",()=>act("egg",{target:id})));
   if(!t.sleeping)list.push(...faceActs(id))}}
 else if(p=="restaurant"){title="餐廳";list.push(btn("吃一頓","飽足 +55 · 精力 +20 · 心情 +10 · €250",()=>act("dine")));note="朋友也在的話，點他可以請吃大餐"}
 else if(p=="office"){title="公司";list.push(btn("打工",`+€${myWage()} · 隨時可打 · 累`,()=>act("work")));note=`今天已打工 ${workToday(R[me])} 次，目前薪水 ${workPct(workToday(R[me]))}%（前 4 次全額、5～8 次 50%、9～16 次 25%、之後 10%，次數不限）。有同事在的話，點他可以一起加班，薪水加倍`}
 else if(p=="park"||p=="plaza"){title=placeName(p);list.push(btn("玩一下","心情 +20",()=>act("play")));if(p=="plaza"&&isOn("arcade"))list.push(btn("小豬街機 🕹️","猜拳、比大小、命運輪盤、21 點",()=>gamesModal()))}
 else if(p=="cafe"){title="咖啡廳";list.push(btn("喝咖啡 ☕","€90 · 精力 +50 · 膀胱 −10 · 30 分鐘一次",()=>act("coffee")))}
 else if(p=="cinema"){title="電影院";list.push(btn("看電影 🎬","€300 · 心情 +35 · 1 小時一次",()=>act("movie")))}
 else if(p=="gym"){title="健身房";list.push(btn("健身 🏋️",`精力 −15 · 心情 +10 · 打架更強（${Math.min(10,(r.items||{}).fit||0)}/10）`,()=>act("workout")))}
 else if(p=="arena"){title="格鬥場";const it=r.items||{};list.push(btn("打擂台 🥊",`精力 −12 · 贏了拿獎金、連勝越多越貴 · 目前 ${it.streak||0} 連勝（最高 ${it.best||0}）`,()=>act("spar")));note="在這裡點別人可以約打：5 分鐘就能再打一次、贏的拿 €100（每人 30 分鐘領一次）、好感只扣 1"}
 else if(p=="slaughter"){title="屠宰場";list.push(btn("溜進去偷飼料 🔪","買通守衛 €400 · 精力 −10 · 約四成賺 €500～900 · 可能被屠夫追、被抓去賠 €1200 · 1 小時一次",()=>act("sneak")));note="健身越多，越跑得掉"}
 else if(p=="market"){title="超市";list.push(btn("買禮物 🎁","€300 · 送朋友心情 +20",()=>act("buy",{item:"gift"})),btn("買零食 🍪","€60 · 隨時吃，飽足 +20",()=>act("buy",{item:"snack"})),btn("🛍️ 造型與擺飾","新衣服、家門口擺飾",()=>shopModal()),btn("逛逛","心情 +6",()=>act("browse")))}
 else{title="路上";note="點地圖上的房子或地點，就會走過去"}
 // 公共場所遇到人：可以擊掌；一起吃飯、玩、加班時在場的人心情都會變好
 if(!r.sleeping&&["plaza","restaurant","market","park","office"].includes(p)&&!(walkers[me]&&walkers[me].path.length)){const here=Object.values(R).filter(o=>o.id!=me&&o.place==p&&!o.sleeping);
  if(here.length&&!(sel&&R[sel]))note=(note?note+" · ":"")+`${here.map(o=>o.name).join("、")} 也在這裡：一起做事大家心情都 +5，點他可以擊掌或扁他`}
 if(!r.sleeping&&!(walkers[me]&&walkers[me].path.length))for(const q of POOPS)if(Math.abs(q.x-walkers[me].x)+Math.abs(q.y-walkers[me].y)<=2)list.push(btn("清掉便便 💩","領 €30",()=>act("sweep",{item:String(q.id)}),"place"));
 if(!r.sleeping&&!(walkers[me]&&walkers[me].path.length))for(const k in OBJS)if(objNear(k,walkers[me].x,walkers[me].y,p))for(const [l,sub,v] of OBJS[k].acts)if(v!="feed"||((r.items||{}).snack))list.push(btn(l,`${OBJS[k].name} · ${sub}`,()=>act("obj",{item:k,note:v||null}),"place"));
 if(!r.sleeping&&(r.items||{}).snack&&!(walkers[me]&&walkers[me].path.length))list.push(btn("吃零食 🍪",`飽足 +20 · 還有 ${(r.items||{}).snack} 包`,()=>act("snack"),"self"));
 if(sel&&R[sel]&&sel!=me){const t=tickLocal(R[sel],now());note=`${t.name}：在${placeName(t.place)}${t.sleeping?"睡覺":""} · 飽足 ${Math.round(t.hunger)} · 清潔 ${Math.round(t.hygiene)} · 心情 ${Math.round(t.fun)} · ${bondLabel(bondWith(t.id))}`;
  const face=isNear(t.id)&&!t.sleeping&&!r.sleeping;title=`和 ${t.name} 互動`;
  list.length=0;if(face)list.push(...faceActs(t.id));list.push(...onlineActs(t.id));
  if(!face)list.push(btn(`走到 ${t.name} 旁邊`,`他在${placeName(t.place)} · 面對面才能擊掌、扁他`,()=>walkToPerson(t.id)));
  list.push(btn(`去 ${t.name} 家`,"煮飯、洗澡、串門子要到他家",()=>{sel=null;goHouse(t.slot)}),btn("取消","",()=>{sel=null;lastPanel="";renderPanel()}))}
 // 店家休息中：只留說明，按鈕拿掉
 const cm=closedMsg(p);if(cm&&!sel){title+="（休息中）";note=cm;for(let i=list.length-1;i>=0;i--)if(!list[i].g||list[i].g=="place")list.splice(i,1)}
 for(let i=list.length-1;i>=0;i--)if(/烤地瓜/.test(list[i].label)&&closedMsg("stall"))list.splice(i,1);
 $("here").textContent=title;$("note").textContent=note;
 // 內容沒變就不重畫，避免按到一半按鈕被換掉
 if(!sel){const t=nextStep(r,p);if(t){list.unshift({...t,g:"tip"});track("show",t.label)}}
 const dg=p=="home:"+me?"self":p&&p.startsWith("home:")?"friend":"place";list.forEach(b=>{if(!b.g)b.g=/^(走|去 |取消)/.test(b.label)?"move":dg});
 const order=[...new Set(list.map(b=>b.g))],multi=order.length>1;
 const html=order.map(g=>(multi?`<div class="grp">${GROUP[g]}</div>`:"")+list.map((b,i)=>{if(b.g!=g)return "";
   // 圖示放大在左邊；壞事用紅色；錢不夠就標出來
   const m=b.label.match(/^(\p{Extended_Pictographic}\uFE0F?)\s*(.*)$/u)||b.label.match(/^(.*?)\s*(\p{Extended_Pictographic}\uFE0F?)$/u),txt=m?(m[2].match(/\p{Extended_Pictographic}/u)?m[1]:m[2]):b.label,ic=m?(m[2].match(/\p{Extended_Pictographic}/u)?m[2]:m[1]):(ACT_ICON[b.label]||(b.g=="move"?"🚶":"•"));
   const cost=+((b.sub||"").match(/€(\d+)(?!\d)/)||[])[1]||0,poor=cost&&/€\d+/.test(b.sub)&&!/\+€/.test(b.sub)&&r.money<cost,bad=/扁|雞蛋|臭屁|惡作劇|叫醒/.test(b.label);
   return `<button data-i="${i}" class="act${b.g=="tip"?" cta":""}${bad?" bad":""}${poor?" poor":""}${b.g=="move"?" ghost":""}"><span class="ai">${ic}</span><span class="at"><b>${esc(txt)}</b>${b.sub||poor?`<small>${poor?`錢不夠（要 €${cost}）`:b.sub}</small>`:""}</span></button>`}).join("")).join("");
 panelFns=list;if(html!=lastPanel){lastPanel=html;patchList($("acts"),html)}}
$("acts").addEventListener("click",ev=>{const b=ev.target.closest("button[data-i]");if(!b||busy)return;const f=panelFns[b.dataset.i];if(f){if(f.g=="tip")track("click",f.label);press(b,f.fn)}});
let lastNeeds="";
function renderNeeds(){if(!S||!me||!R[me])return;const r=tickLocal(R[me],now());
 const html=NEEDS.map(k=>{const v=Math.round(r[k]),[ic,nm]=NEED_INFO[k];return `<div class="need${v<20?" low":""}" title="${nm} ${v}"><span>${ic}</span><i><b style="width:${v}%;background:${v<20?"var(--bad)":v<50?"var(--warn)":"var(--good)"}"></b></i><small><em>${nm} </em>${v}</small></div>`}).join("")+`<div class="need money"><span>${MOOD[moodOf(r)][0]}</span><small>€${r.money}${(r.items||{}).gift?` · 🎁${r.items.gift}`:""}${(r.items||{}).snack?` · 🍪${r.items.snack}`:""}</small></div>`;
 if(html!=lastNeeds){lastNeeds=html;patchList($("needs"),html)}}
// 每週排行（最近 7 天）
// 排行榜：頒獎台（前三名大頭貼）＋其餘名次＋你的名次；最近 7 天的事件，加上現在的存款和好友數
function renderRank(){const w=(S&&S.week)||{},all=Object.values(R);
 const fromWeek=k=>(w[k]||[]).filter(x=>R[x.id]).map(x=>({id:x.id,n:x.n}));
 const rich=all.map(r=>({id:r.id,n:r.money})).sort((a,b)=>b.n-a.n),friends=all.map(r=>({id:r.id,n:((S&&S.bonds)||[]).filter(b=>(b.a==r.id||b.b==r.id)&&b.s>=10).length})).filter(x=>x.n>0).sort((a,b)=>b.n-a.n);
 const cats=[["work","💼","最勤勞","次打工",fromWeek("work")],["popular","💗","最受歡迎","次被照顧",fromWeek("popular")],["kind","🤲","最愛照顧人","次照顧別人",fromWeek("kind")],
  ["rich","💰","小鎮首富","€",rich],["friends","🤝","人緣最好","個好朋友",friends],["punched","🤕","最欠扁","次被欺負",fromWeek("punched")]];
 const av=(id,big)=>`<canvas class="rav${big?" big":""}" width="28" height="34" data-look='${esc(JSON.stringify((R[id]||{}).look||{}))}'></canvas>`;
 const val=(c,x)=>c[0]=="rich"?`€${x.n}`:`${x.n} ${c[3]}`;
 $("tab-rank").innerHTML=`<p class="mut" style="margin:0 0 8px">次數類是最近 7 天；首富和人緣是現在的狀態。</p>`+cats.map(c=>{const L=c[4];if(!L.length)return `<div class="rk"><div class="rkh">${c[1]} ${c[2]}</div><p class="mut">還沒有人上榜，搶第一！</p></div>`;
  const top=[L[1],L[0],L[2]],mine=L.findIndex(x=>x.id==me);
  return `<div class="rk"><div class="rkh">${c[1]} ${c[2]}</div><div class="podium">${top.map((x,i)=>x?`<div class="pd p${[2,1,3][i]}${x.id==me?" me":""}">${av(x.id,i==1)}<b>${esc(R[x.id].name)}</b><small>${val(c,x)}</small><div class="step">${[2,1,3][i]}</div></div>`:`<div class="pd empty"></div>`).join("")}</div>
   ${L.length>3?`<div class="rest">${L.slice(3,8).map((x,i)=>`<div class="rr${x.id==me?" me":""}"><span>${i+4}</span><b>${esc(R[x.id].name)}</b><small>${val(c,x)}</small></div>`).join("")}</div>`:""}
   ${me&&mine<0&&c[0]!="punched"?`<p class="mut mine">你還沒上榜</p>`:mine>=0?`<p class="mine">你是第 <b>${mine+1}</b> 名</p>`:""}</div>`}).join("");
 $("tab-rank").querySelectorAll("canvas.rav").forEach(c=>{try{const l=JSON.parse(c.dataset.look);miniPerson(c,l)}catch(e){}})}
function renderPeople(){const list=Object.values(R).filter(o=>o.id!=me).map(o=>({o,v:bondWith(o.id)})).sort((a,b)=>b.v-a.v);
 $("tab-ppl").innerHTML=(list.length?list.map(({o,v})=>`<div class="mrow"><span><b>${esc(o.name)}</b> <small class="mut">${esc(career(o).name)}${titlesOf(o).length?" · "+esc(titlesOf(o).slice(-1)[0]):""} · ${bondLabel(v)} · ${v>0?"+":""}${v}</small><i class="bond"><b style="left:50%;width:${Math.abs(v)/2}%;${v<0?`left:${50-Math.abs(v)/2}%;background:var(--bad)`:"background:var(--good)"}"></b></i><small class="mut">${tierHint(v)} · 在${placeName(o.place)}</small></span><button data-w="${o.id}">互動</button></div>`).join(""):`<p class="mut">鎮上還沒有其他人，邀請朋友搬進來吧。</p>`)
  +`<p class="mut" style="margin-top:10px">送禮 +5、煮飯洗澡 +4、請吃大餐 +4、串門子一起加班 +3、道謝擊掌 +2、留言 +1；叫醒 −1、丟雞蛋 −2、惡作劇 −3、扁人 −4、丟雞蛋 −1、惡作劇 −2、和好 +10。好麻吉以上照顧對方效果 ×1.3。</p>`;
 $("tab-ppl").querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{sel=+b.dataset.w;lastPanel="";renderPanel();$("here").scrollIntoView({behavior:"smooth",block:"center"})})}
// 動態：每種事一個圖示，名字粗體，分今天／昨天，跟我有關的用左邊色條標出來
// ── 職業階梯與人生願望（資料在 items：works 累計打工、wish、titles、meals；門檻要和 town.sql 一致）──
const JOBS=[["實習生",0,190],["員工",10,260],["組長",30,350],["經理",70,520],["主管",150,800]];
const jobLv=n=>JOBS.reduce((a,j,i)=>n>=j[1]?i:a,0);
const career=r=>{const n=(r.items&&r.items.works)||0,lv=jobLv(n),nx=JOBS[lv+1];return{n,lv,name:JOBS[lv][0],wage:JOBS[lv][2],next:nx?nx[0]:null,left:nx?nx[1]-n:0}};
const dayKey=()=>new Date(now()+8*36e5).toISOString().slice(0,10);
const workToday=r=>{const d=r.items&&r.items.dc;return d&&d.d==dayKey()?(d.work||0):0};
const workPct=n=>n<4?100:n<8?50:n<16?25:10;// 今天前 4 次全額、5～8 次 50%、之後 25%（打工與加班都算，台灣時間 0 點重置）
const RENT=[350,600,1200,2500];const rentOf=r=>RENT[Math.min(3,Math.max(0,((r.items&&r.items.hl)||1)-1))];
const myWage=()=>Math.floor(payOf(career(R[me]).wage,tickLocal(R[me],now()))*workPct(workToday(R[me]))/100);
const WISHES={rich:["首富","持有金錢",[30000,100000,300000],["小富翁","大富翁","小豬首富"],r=>r.money],pop:["人氣王","好朋友以上的人數",[5,10,20],["交友廣闊","萬人迷","人氣王"],r=>(S.bonds||[]).filter(b=>(b.a==r.id||b.b==r.id)&&b.s>=10).length],
 fight:["格鬥冠軍","擂台最高連勝",[3,7,15],["擂台新秀","擂台猛將","格鬥冠軍"],r=>(r.items&&r.items.best)||0],food:["美食家","累計吃飯／大餐",[30,100,300],["老饕","美食家","食神"],r=>(r.items&&r.items.meals)||0],
 work:["打工王","職位（組長、經理、主管）",[2,3,4],["勤勞蜜蜂","職場達人","打工王"],r=>career(r).lv]};
const WISH_BONUS=[200,500,1000];
const titlesOf=r=>(r.items&&r.items.titles)||[];
const nameTag=r=>{const t=titlesOf(r),tk=tickLocal(r,now()),n=t.length?r.name+" "+t[t.length-1]:r.name;return MOOD[moodOf(tk)][0]+" "+n};
const TRAITS={foodie:["吃貨","吃東西的飽足效果 +30%"],athlete:["運動家","健身進步更快、打架和擂台更強"],social:["社交達人","好感增加 +30%"],workaholic:["工作狂","薪水 +10%"],
 nightowl:["夜貓子","晚上 10 點到早上 6 點，醒著精力掉得慢"],clean:["愛乾淨","清潔掉得比較慢"],lucky:["幸運兒","路上壞事少、路邊好事多"],romantic:["浪漫","送出的禮物效果加倍"]};
function traitModal(){const sel=[];$("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>選 2 個個性</h2><p class="mut">只有加成，沒有壞處。選了就不能改，也可以先跳過。</p><div class="list">${Object.entries(TRAITS).map(([k,v])=>`<button data-tk="${k}" style="width:100%;text-align:left;margin-bottom:6px"><b>${v[0]}</b><br><small>${v[1]}</small></button>`).join("")}</div><p class="err" id="terr"></p><div class="row"><button id="tskip">先跳過</button><button class="pri" id="tok" disabled>選好了</button></div>`;
 const bs=[...$("mbody").querySelectorAll("[data-tk]")],upd=()=>{bs.forEach(b=>b.classList.toggle("pri",sel.includes(b.dataset.tk)));$("tok").disabled=sel.length!=2;$("tok").textContent=sel.length==2?"選好了":`再選 ${2-sel.length} 個`};
 bs.forEach(b=>b.onclick=()=>{const k=b.dataset.tk,i=sel.indexOf(k);if(i>=0)sel.splice(i,1);else if(sel.length<2)sel.push(k);upd()});upd();
 const go=async ks=>{try{apply(await rpc("town_traits",{rid:me,pin,ks}));$("modal").classList.add("hide");if(ks.length)toast("個性訂好了");if(!(R[me].items&&R[me].items.wish))setTimeout(wishModal,300);else if(ks.length)lifeModal()}catch(e){$("terr").textContent=e.message}};
 $("tok").onclick=()=>go(sel);$("tskip").onclick=()=>go([])}
function lifeModal(){const r=R[me],c=career(r),w=(r.items&&r.items.wish)||{},k=WISHES[w.k],m=w.m||0,t=titlesOf(r);$("modal").classList.remove("hide");
 let wh;if(k){const v=k[4](r),ms=k[2],cur=ms[Math.min(m,2)];wh=`<div class="mrow"><span><b>${k[0]}</b> <small class="mut">${m>=3?"三個里程碑都達成了":w.k=="work"?`第 ${m+1} 關：升到「${JOBS[cur][0]}」（現在${c.name}）`:`第 ${m+1} 關：${k[1]} ${Math.min(v,cur)} / ${cur}`}</small></span></div><div class="list">${ms.map((x,i)=>`<div class="mrow"><span>${i<m?"✔":"・"} ${w.k=="work"?"升到「"+JOBS[x][0]+"」":k[1]+" "+x}　<small class="mut">稱號「${k[3][i]}」＋€${WISH_BONUS[i]}</small></span></div>`).join("")}</div>`;if(m>=3)wh+=`<div class="row" style="justify-content:flex-start"><button id="lwNew">換一個新願望</button></div>`}
 else wh=`<p class="mut">${w.k=="none"?"你選擇先不訂願望。":"還沒選願望。"}</p><div class="row" style="justify-content:flex-start"><button id="lwNew" class="pri">選一個願望</button></div>`;
 $("mbody").innerHTML=`<h2>我的人生</h2><div class="mrow"><span><b>${c.name}</b> <small class="mut">每次打工 €${payOf(c.wage,tickLocal(r,now()))} · 已打工 ${c.n} 次</small></span></div><p class="mut">今天已打工 ${workToday(r)} 次，目前薪水 ${workPct(workToday(r))}% · 每天房租水電 €${rentOf(r)}（每天第一次上線扣）</p><p class="mut">${c.next?`再打工 ${c.left} 次升「${c.next}」`:"已經是最高職位了"}</p>
 <h3>個性與心情</h3><p><span class="sw on">${MOOD[moodOf(tickLocal(r,now()))][0]} ${MOOD[moodOf(tickLocal(r,now()))][1]}</span> <small class="mut">${MOOD[moodOf(tickLocal(r,now()))][2]}</small></p>${(r.items&&r.items.tr&&r.items.tr.length)?r.items.tr.map(k=>`<div class="mrow"><span><b>${TRAITS[k][0]}</b> <small class="mut">${TRAITS[k][1]}</small></span></div>`).join(""):`<p class="mut">還沒有個性特質。</p><div class="row" style="justify-content:flex-start"><button id="ltNew" class="pri">選個性</button></div>`}
 <h3>人生願望</h3>${wh}<h3>稱號</h3><p>${t.length?t.map(x=>`<span class="sw on">${esc(x)}</span>`).join(" "):'<span class="mut">還沒有稱號</span>'}</p><div class="row"><button id="lclose">關閉</button></div>`;
 $("lclose").onclick=()=>$("modal").classList.add("hide");if($("lwNew"))$("lwNew").onclick=()=>wishModal();if($("ltNew"))$("ltNew").onclick=()=>traitModal()}
function wishModal(){$("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>選一個人生願望</h2><p class="mut">每達成一個里程碑，有獎金、稱號和動態公告。可以先跳過。</p><div class="list">${Object.entries(WISHES).map(([k,v])=>`<button data-wk="${k}" style="width:100%;text-align:left;margin-bottom:6px"><b>${v[0]}</b><br><small>${v[1]}：${v[2].join("、")}</small></button>`).join("")}</div><div class="row"><button id="wskip">先跳過</button></div>`;
 const pick=async k=>{try{apply(await rpc("town_wish",{rid:me,pin,k}));$("modal").classList.add("hide");if(k!="skip"){toast("願望訂好了");lifeModal()}}catch(e){toast(e.message)}};
 $("mbody").querySelectorAll("[data-wk]").forEach(b=>b.onclick=()=>pick(b.dataset.wk));$("wskip").onclick=()=>pick("skip")}
const KIND_ICON={promo:"📈",wish:"🎯",duel:"✊",feed:"🍚",wash:"🛁",visit:"🏠",note:"📱",call:"📞",delivery:"🛵",gift:"🎁",thank:"💗",greet:"🙌",fight:"👊",egg:"🥚",prank:"💨",makeup:"🤝",wakeup:"⏰",cowork:"💼",feast:"🍖",tier:"💞",look:"✨",join:"🏡",found:"🏛️",expand:"🛣️",leave:"📦",meet:"👋",together:"🎉",accident:"💦",passout:"😵",luck:"🍀",rent:"🧾"};
const GOOD=["feed","wash","visit","note","call","delivery","gift","thank","greet","makeup","cowork","feast"],BADK=["fight","egg","prank","wakeup"];
let feedFilter="all",feedSeen=0;
function renderFeed(){renderRank();renderPeople();const all=((S&&S.events)||[]).filter(e=>e.kind!="rent"||e.actor==me).slice().sort((a,b)=>b.at.localeCompare(a.at)||b.id-a.id);
 const day=a=>new Date(Date.parse(a)+8*36e5).toISOString().slice(0,10),today=day(new Date(now()).toISOString()),yest=day(new Date(now()-864e5).toISOString());
 const hm=a=>{const d=new Date(Date.parse(a)+8*36e5);return `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`};
 const names=Object.values(R).map(r=>r.name).sort((a,b)=>b.length-a.length);
 const bold=t=>{let h=esc(t);for(const n of names){const e=esc(n);h=h.split(e).join(`<b>${e}</b>`)}return h};
 const ev=all.filter(e=>feedFilter=="all"||(feedFilter=="me"&&(e.target==me||e.actor==me))||(feedFilter=="good"&&GOOD.includes(e.kind))||(feedFilter=="bad"&&BADK.includes(e.kind)));
 const ok=new Set(me?thankable().map(e=>e.id):[]),bad=new Set(me?grudges().map(e=>e.id):[]),shown=new Set();let lastDay="";
 // 未讀：別人對我做的、我還沒看過的
 const unread=all.filter(e=>e.target==me&&e.actor!=me&&e.id>feedSeen).length;$("feedBadge").textContent=unread?unread:"";$("feedBadge2").textContent=unread||"";$("feedBadge2").classList.toggle("hide",!unread);$("feedBadge").classList.toggle("hide",!unread||!$("tab-feed").classList.contains("hide"));
 $("feed").innerHTML=ev.length?ev.slice(0,40).map(e=>{const d=day(e.at);let head="";if(d!=lastDay){lastDay=d;head=`<div class="day">${d==today?"今天":d==yest?"昨天":d.slice(5).replace("-","/")}</div>`}
  const t=ok.has(e.id)&&!shown.has(e.actor);if(t)shown.add(e.actor);const g=bad.has(e.id)&&!shown.has("g"+e.actor);if(g)shown.add("g"+e.actor);
  const cls=e.target==me&&e.actor!=me?(BADK.includes(e.kind)?" bad":" mine"):"";
  const who=e.actor==me?e.target:e.actor;return head+`<div class="ev${cls}${who&&who!=me&&R[who]?" tap":""}" ${who&&who!=me&&R[who]?`data-who="${who}"`:""}><span class="ic">${KIND_ICON[e.kind]||"•"}</span><span class="tx">${bold(e.msg)}</span><span class="tm">${hm(e.at)}</span>${t||g?`<span class="ea">${t?`<button class="thx" data-t="${e.actor}">💗 謝謝</button>`:""}${g?`<button class="thx" data-g="${e.actor}">😤 報仇</button>`:""}</span>`:""}</div>`}).join(""):`<p class="mut">${feedFilter=="all"?"小鎮還很安靜。":"沒有符合的動態。"}</p>`;
 $("feed").querySelectorAll(".ev[data-who]").forEach(el=>el.onclick=e=>{if(e.target.closest("button"))return;focusPerson(+el.dataset.who)});
 $("feed").querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>act("thank",{target:+b.dataset.t}));
 $("feed").querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{walkToPerson(+b.dataset.g);toast("走過去找他算帳，到了就能扁他（報仇有加成）");$("stage").scrollIntoView({behavior:"smooth"})})}
// 面對面才能做的事：擊掌、扁他、和好
function faceActs(id){return faceActs0(id).map(b=>({...b,g:"face"}))}
function faceActs0(id){const t=R[id],b=bondWith(id),mp=R[me].place,coop=[];
 if(mp=="office"&&t.place=="office")coop.push(btn(`和 ${t.name} 一起加班 💼`,"薪水加倍 · 2 小時一次",()=>act("cowork",{target:id})));
 if(mp=="restaurant"&&t.place=="restaurant")coop.push(btn(`請 ${t.name} 吃大餐 🍖`,"€600 · 兩人飽足 +70",()=>act("feast",{target:id})));
 const out=[...coop,btn(`和 ${t.name} 擊掌 🙌`,"兩人心情 +8 · 好感 +2",()=>act("greet",{target:id})),
  btn(`扁 ${t.name} 👊`,b>=30?"好麻吉之間是打打鬧鬧 · 好感 +1":"比精力、心情和運氣 · 好感 −4",()=>act("fight",{target:id}))];
 if(b<0)out.push(btn(`和 ${t.name} 和好 🤝`,"好感 +8",()=>act("makeup",{target:id})));return out}
// 走到某人身邊：他在室內就走到那個地點的門口，在路上就走到他旁邊
function walkToPerson(id){const t=R[id];if(!t)return;sel=id;if(t.place.startsWith("home:")){const o=R[t.place.slice(5)];if(o){walkTo(t.place,o.id==me?door(o.slot):visitSpot(o.slot));return}}
 if(PLACES[t.place]){walkTo(t.place,PLACES[t.place].door);return}const w=walkers[id],g=[Math.round(w.x),Math.round(w.y)],nb=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>[g[0]+dx,g[1]+dy]).find(p=>!blocked(...p))||g;walkTo("street",nb)}
// 鏡頭移到某人身上，並打開跟他互動的按鈕
function focusPerson(id){if(!R[id]||!walkers[id])return;sel=id==me?null:id;const w=walkers[id];camFree=true;cam.x=(w.x+.5)*T;cam.y=(w.y+.5)*T;lastPanel="";renderPanel();$("stage").scrollIntoView({behavior:"smooth",block:"start"})}
// 地圖角落一排大頭貼：10 分鐘內有動作的人算在線上
let stripKey="";function renderStrip(){const list=Object.values(R).sort((a,b)=>(b.id==me)-(a.id==me)||a.slot-b.slot),on=r=>r.id==me||Date.parse(r.seen_at)>now()-10*6e4;
 const key=list.map(r=>r.id+":"+on(r)+":"+JSON.stringify(r.look)).join("|");if(key==stripKey)return;stripKey=key;
 $("strip").innerHTML=list.map(r=>`<button data-p="${r.id}" class="${on(r)?"on":"off"}" title="${esc(r.name)}${on(r)?" · 在線上":""}"><canvas width="28" height="34"></canvas><span>${esc(r.name.slice(0,4))}</span></button>`).join("");
 $("strip").querySelectorAll("[data-p]").forEach((b,i)=>{miniPerson(b.querySelector("canvas"),list[i].look);b.onclick=()=>focusPerson(+b.dataset.p)})}
function bondsModal(){const list=Object.values(R).filter(o=>o.id!=me).map(o=>({o,v:bondWith(o.id)})).sort((a,b)=>b.v-a.v);$("modal").classList.remove("hide");
 $("mbody").innerHTML=`<h2>👥 人際關係</h2>${list.length?list.map(({o,v})=>`<div class="mrow"><span><b>${esc(o.name)}</b> <small class="mut">${esc(career(o).name)}${titlesOf(o).length?" · "+esc(titlesOf(o).slice(-1)[0]):""} · ${bondLabel(v)} · ${v>0?"+":""}${v}</small><i class="bond"><b style="left:50%;width:${Math.abs(v)/2}%;${v<0?`left:${50-Math.abs(v)/2}%;background:var(--bad)`:"background:var(--good)"}"></b></i><small class="mut">${tierHint(v)}</small></span><button data-w="${o.id}">互動</button></div>`).join(""):`<p class="mut">鎮上還沒有其他人，邀請朋友搬進來吧。</p>`}
  <p class="mut" style="margin-top:10px">送禮 +5、煮飯洗澡 +4、串門子 +3、道謝擊掌 +2、留言 +1；叫醒 −1、丟雞蛋 −2、惡作劇 −3、扁人 −4、丟雞蛋 −1、惡作劇 −2、和好 +10。好麻吉以上照顧對方效果 ×1.3。</p><div class="row"><button id="mc">關閉</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");$("mbody").querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{$("modal").classList.add("hide");walkToPerson(+b.dataset.w)})}
// 新手提示：第一次進小鎮時顯示，看過就不再出現
function showTips(){let seen=null;try{seen=localStorage.getItem("town-tips")}catch(e){}if(seen)return;const el=$("tips");el.classList.remove("hide");
 el.innerHTML=`<b>👋 新手小提示</b><p>🗺️ 點地圖上的房子或地點，角色會自己走過去。</p><p>👆 點地圖上的人，可以傳訊息、打電話；走到他旁邊還能擊掌或扁他。</p><p>🍚 上面的需求會隨現實時間下降，快見底時下方會出現粉紅色的「建議下一步」。</p><div class="row"><button class="pri" id="tipok">知道了</button></div>`;
 $("tipok").onclick=()=>{el.classList.add("hide");try{localStorage.setItem("town-tips","1")}catch(e){}}}
// 建議下一步：最缺的需求先處理，其次是錢、道謝、邀請朋友
function nextStep(r,p){if(r.sleeping||(walkers[me]&&walkers[me].path.length))return null;const atHome=p=="home:"+me,goHome=l=>btn(l,"走回家",()=>goHouse(r.slot));
 const [k,v]=NEEDS.map(k=>[k,r[k]]).sort((a,b)=>a[1]-b[1])[0];
 if(v<35){const sub=`${NEED_INFO[k][0]} ${NEED_INFO[k][1]}只剩 ${Math.round(v)}`;
  if(k=="hunger")return p=="restaurant"?btn("吃一頓 🍽️",sub,()=>act("dine")):atHome?btn("吃飯 🍚",sub,()=>act("eat")):btn("回家吃飯 🍚",sub,()=>goHouse(r.slot));
  if(k=="bladder")return atHome?btn("上廁所 🚽",sub,()=>act("toilet")):btn("回家上廁所 🚽",sub,()=>goHouse(r.slot));
  if(k=="hygiene")return atHome?btn("洗澡 🛁",sub,()=>act("shower")):btn("回家洗澡 🛁",sub,()=>goHouse(r.slot));
  if(k=="energy")return atHome?btn("快速休息 😴",sub,()=>act("nap")):p=="cafe"&&!closedMsg("cafe")?btn("喝咖啡 ☕",sub,()=>act("coffee")):!closedMsg("cafe")?btn("去咖啡廳 ☕",sub+" · 喝咖啡回精力",()=>walkTo("cafe",PLACES.cafe.door)):btn("回家睡覺 😴",sub,()=>goHouse(r.slot));
  return p=="park"||p=="plaza"?btn("玩一下 🎈",sub,()=>act("play")):btn("去公園走走 🎈",sub,()=>walkTo("park",PLACES.park.door))}
 if(r.money<200)return p=="office"?btn("打工 💼",`只剩 €${r.money}，賺點錢`,()=>act("work")):btn("去公司打工 💼",`只剩 €${r.money}`,()=>walkTo("office",PLACES.office.door));
 const du=((S&&S.duels)||[]).find(d=>d.b==me&&R[d.a]);if(du&&isOn("arcade"))return btn(`應戰 ${R[du.a].name} 的戰帖 ✊`,`猜拳賭 €${du.bet}`,()=>duelModal(du.a,du));
 const th=thankable()[0];if(th&&R[th.actor])return btn(`謝謝 ${R[th.actor].name} 💗`,"他剛照顧過你",()=>act("thank",{target:th.actor}));
 if(Object.keys(R).length<2&&R[me].mayor)return btn("邀請朋友搬進來 ✉️","小鎮只有你一個人",()=>$("invite").click());
 return null}
// 線上互動：用手機就能做，在哪裡都可以
function onlineActs(id){return onlineActs0(id).map(b=>({...b,g:"online"}))}
function onlineActs0(id){const t=R[id],gifts=((R[me].items||{}).gift)||0;return [
  btn(`📱 傳訊息給 ${t.name}`,"在哪都能傳 · 好感 +1",()=>noteModal(id)),
  btn(`📞 打電話給 ${t.name}`,t.sleeping?"他在睡覺，會被你吵醒 · 好感 −1":"兩人心情 +5 · 好感 +1",()=>act("call",{target:id})),
  btn(`🛵 幫 ${t.name} 叫外送`,"€200 · 他飽足 +30 · 好感 +3",()=>act("delivery",{target:id})),
  ...(isOn("arcade")?[btn(`✊ 向 ${t.name} 下戰帖`,"猜拳賭錢，他回來應戰",()=>duelModal(id))]:[]),
  btn(`📦 寄禮物給 ${t.name}`,gifts?`€60 運費 · 他心情 +20 · 背包 🎁${gifts}`:"先去超市買禮物",()=>gifts?act("gift",{target:id}):toast("背包沒有禮物，去超市買一份"))]}
// ── 街機小遊戲（在廣場玩，和莊家比，結果由伺服器決定）──
const RPS={r:["✊","石頭"],p:["✋","布"],s:["✌️","剪刀"]},CARD=n=>({1:"A",11:"J",12:"Q",13:"K"}[n]||String(n));
const bjTotal=cs=>{let t=0,a=0;for(const c of cs){if(c==1){a++;t+=11}else t+=Math.min(c,10)}while(t>21&&a){t-=10;a--}return t};
const cardHTML=(n,hidden)=>`<span class="pcard${hidden?" back":""}">${hidden?"?":CARD(n)}</span>`;
let gameTab="rps",gameBet=50;
async function playGame(game,extra={}){const res=await rpc("town_game",{rid:me,pin,game,bet:gameBet,...extra});R[me].money=res.money;renderNeeds();return res.game}
function gamesModal(){$("modal").classList.remove("hide");const tabs=[["rps","✊ 猜拳"],["hl","🃏 比大小"],["wheel","🎡 輪盤"],["bj","♠ 21點"]];
 $("mbody").innerHTML=`<h2>🕹️ 小豬街機</h2><p class="mut">你有 €<b id="gMoney">${R[me].money}</b> · 押注 €50～€1000 · 一天 40 局</p>
  <div class="tabs">${tabs.map(([k,l])=>`<button data-g="${k}" class="${gameTab==k?"on":""}">${l}</button>`).join("")}</div>
  <div class="chips">押注 ${[50,100,200,500,1000].map(b=>`<button data-bet="${b}" class="${gameBet==b?"on":""}">€${b}</button>`).join("")}</div>
  <div id="gArea" class="garea"></div><div class="row"><button id="mc">離開街機</button></div>`;
 $("mc").onclick=()=>{$("modal").classList.add("hide");refresh().catch(()=>{})};
 $("mbody").querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{gameTab=b.dataset.g;gamesModal()});
 $("mbody").querySelectorAll("[data-bet]").forEach(b=>b.onclick=()=>{gameBet=+b.dataset.bet;$("mbody").querySelectorAll("[data-bet]").forEach(x=>x.classList.toggle("on",x==b))});
 const area=$("gArea"),money=()=>$("gMoney").textContent=R[me].money,err=e=>{area.querySelector(".gres")?area.querySelector(".gres").textContent=e.message:toast(e.message)};
 const result=(win,extra="")=>`<p class="gres ${win>gameBet?"good":win==gameBet?"":"bad"}">${win>gameBet?`贏了 €${win-gameBet}！`:win==gameBet?"平手，退回押注":`輸了 €${gameBet}`}${extra}</p>`;
 if(gameTab=="rps"){area.innerHTML=`<p>出一個：</p><div class="gbtns">${Object.entries(RPS).map(([k,[ic,n]])=>`<button class="gbig" data-m="${k}">${ic}<span>${n}</span></button>`).join("")}</div><div id="gShow" class="gshow"></div>`;
  area.querySelectorAll("[data-m]").forEach(b=>b.onclick=async()=>{area.querySelectorAll("[data-m]").forEach(x=>x.disabled=true);const show=$("gShow");let i=0;const spin=setInterval(()=>{show.innerHTML=`<div class="vs"><b>${RPS[b.dataset.m][0]}</b> VS <b>${Object.values(RPS)[i++%3][0]}</b></div>`},90);
   try{const g=await playGame("rps",{choice:b.dataset.m});await new Promise(r=>setTimeout(r,700));clearInterval(spin);show.innerHTML=`<div class="vs"><b>${RPS[g.you][0]}</b> VS <b>${RPS[g.house][0]}</b></div><p class="mut">你出${RPS[g.you][1]}，莊家出${RPS[g.house][1]}</p>`+result(g.win);money()}catch(e){clearInterval(spin);show.innerHTML=`<p class="gres bad">${esc(e.message)}</p>`}
   area.querySelectorAll("[data-m]").forEach(x=>x.disabled=false)})}
 if(gameTab=="hl"){area.innerHTML=`<p class="mut">翻一張牌，猜下一張更大還是更小（一樣大算輸）。越難猜中賠越多。</p><div id="gShow" class="gshow"></div><div class="gbtns"><button class="pri" id="hlGo">發牌（押 €${gameBet}）</button></div>`;
  $("hlGo").onclick=async()=>{try{const g=await playGame("hl_start");money();const c=g.card,hi=13-c,lo=c-1,pay=k=>k?(0.92*13/k).toFixed(2):"—";
   $("gShow").innerHTML=`<div class="cards">${cardHTML(c)}${cardHTML(0,true)}</div>`;
   area.querySelector(".gbtns").innerHTML=`<button class="gbig" data-hl="hi" ${hi?"":"disabled"}>▲ 更大<span>×${pay(hi)}</span></button><button class="gbig" data-hl="lo" ${lo?"":"disabled"}>▼ 更小<span>×${pay(lo)}</span></button>`;
   area.querySelectorAll("[data-hl]").forEach(b=>b.onclick=async()=>{try{const r2=await playGame("hl_guess",{choice:b.dataset.hl});$("gShow").innerHTML=`<div class="cards">${cardHTML(r2.card)}${cardHTML(r2.next)}</div>`+result(r2.win);money();
    area.querySelector(".gbtns").innerHTML=`<button class="pri" id="hlGo">再來一局（押 €${gameBet}）</button>`;$("hlGo").onclick=()=>gamesModal()}catch(e){toast(e.message)}})}catch(e){toast(e.message)}}}
 if(gameTab=="wheel"){const SEG=["銘謝","銘謝","銘謝","銘謝","銘謝","銘謝","×0.5","×1","×2","×5"],COL=["#3a4a8c","#2b3870","#3a4a8c","#2b3870","#3a4a8c","#2b3870","#2e9e5b","#d8901a","#e0779b","#d4a017"];
  area.innerHTML=`<div class="wheelbox"><canvas id="wh" width="240" height="240"></canvas><div class="wptr">▼</div></div><div class="gbtns"><button class="pri" id="whGo">轉！（押 €${gameBet}）</button></div><div id="gShow"></div>`;
  const cv2=$("wh"),m=cv2.getContext("2d");let ang=0;const draw=a=>{m.clearRect(0,0,240,240);for(let i=0;i<10;i++){const a0=a+i*Math.PI/5-Math.PI/2-Math.PI/10;m.beginPath();m.moveTo(120,120);m.arc(120,120,110,a0,a0+Math.PI/5);m.fillStyle=COL[i];m.fill();m.strokeStyle="#0b0b14";m.lineWidth=3;m.stroke();
    m.save();m.translate(120,120);m.rotate(a0+Math.PI/10);m.fillStyle="#fff";m.font="bold 13px Cubic11,sans-serif";m.textAlign="right";m.fillText(SEG[i],100,5);m.restore()}m.beginPath();m.arc(120,120,16,0,7);m.fillStyle="#fff";m.fill();m.stroke()};draw(0);
  $("whGo").onclick=async()=>{$("whGo").disabled=true;try{const g=await playGame("wheel");const target=-g.slot*Math.PI/5,start=ang,end=target-Math.PI*2*(5+Math.floor(Math.random()*2)),t0=performance.now();
   await new Promise(res=>{const step=t=>{const k=Math.min(1,(t-t0)/2600),e=1-Math.pow(1-k,3);ang=start+(end-start)*e;draw(ang);if(k<1)requestAnimationFrame(step);else res()};requestAnimationFrame(step)});ang=target;
   $("gShow").innerHTML=result(g.win,` · 轉到「${SEG[g.slot]}」`);money()}catch(e){toast(e.message)}$("whGo").disabled=false}}
 if(gameTab=="bj"){area.innerHTML=`<p class="mut">比莊家接近 21 點又不爆。莊家補到 17 點。開局 21 點賠 2.5 倍。</p><div id="gShow" class="gshow"></div><div class="gbtns"><button class="pri" id="bjGo">發牌（押 €${gameBet}）</button></div>`;
  const show=(g)=>{const p=bjTotal(g.p),d=bjTotal(g.d);$("gShow").innerHTML=`<p>莊家 <b>${g.done?d:"?"}</b></p><div class="cards">${g.d.map(c=>cardHTML(c)).join("")}${g.done?"":cardHTML(0,true)}</div><p>你 <b>${p}</b>${g.bust?" 爆了！":g.bj?" 21 點！":""}</p><div class="cards">${g.p.map(c=>cardHTML(c)).join("")}</div>`+(g.done?result(g.win):"");
   area.querySelector(".gbtns").innerHTML=g.done?`<button class="pri" id="bjGo">再來一局（押 €${gameBet}）</button>`:`<button class="gbig" id="bjHit">要牌</button><button class="gbig" id="bjStand">停牌</button>`;
   if(g.done){$("bjGo").onclick=()=>gamesModal();money()}else{$("bjHit").onclick=async()=>{try{show(await playGame("bj_hit"))}catch(e){toast(e.message)}};$("bjStand").onclick=async()=>{try{show(await playGame("bj_stand"))}catch(e){toast(e.message)}}}};
  $("bjGo").onclick=async()=>{try{show(await playGame("bj_start"));money()}catch(e){toast(e.message)}}}}
// 猜拳戰帖：發起（線上就能下）、應戰
function duelModal(id,duel){const t=R[id];let bet=200,mv=null;$("modal").classList.remove("hide");
 $("mbody").innerHTML=duel?`<h2>✊ ${esc(t.name)} 向你下戰帖</h2><p>押注 €${duel.bet}，贏的人拿走 €${duel.bet*2}。他已經出好拳了，你出什麼？</p><div class="gbtns">${Object.entries(RPS).map(([k,[ic,n]])=>`<button class="gbig" data-m="${k}">${ic}<span>${n}</span></button>`).join("")}</div><div class="row"><button id="dno">拒絕（他拿回押注）</button><button id="mc">之後再說</button></div>`
  :`<h2>✊ 向 ${esc(t.name)} 下戰帖</h2><p class="mut">先押錢並出拳，他應戰時出拳就比；24 小時沒回應自動退錢。</p><div class="chips">押注 ${[50,200,500,1000,2000].map(b=>`<button data-bet="${b}" class="${bet==b?"on":""}">€${b}</button>`).join("")}</div><div class="gbtns">${Object.entries(RPS).map(([k,[ic,n]])=>`<button class="gbig" data-m="${k}">${ic}<span>${n}</span></button>`).join("")}</div><div class="row"><button id="mc">取消</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");
 $("mbody").querySelectorAll("[data-bet]").forEach(b=>b.onclick=()=>{bet=+b.dataset.bet;$("mbody").querySelectorAll("[data-bet]").forEach(x=>x.classList.toggle("on",x==b))});
 if($("dno"))$("dno").onclick=async()=>{try{apply(await rpc("town_duel",{rid:me,pin,act:"decline",duel:duel.id}));$("modal").classList.add("hide")}catch(e){toast(e.message)}};
 $("mbody").querySelectorAll("[data-m]").forEach(b=>b.onclick=async()=>{try{const st=await rpc("town_duel",duel?{rid:me,pin,act:"accept",choice:b.dataset.m,duel:duel.id}:{rid:me,pin,act:"challenge",target:id,bet,choice:b.dataset.m});apply(st);$("modal").classList.add("hide");
  toast(duel?(st.events[0]||{}).msg||"比完了":`戰帖送出，等 ${t.name} 應戰`)}catch(e){toast(e.message)}})}
// 超市：造型與擺飾
// 穿上某件造型（買了自動穿、背包裡也能換）
async function wearOn(id){const k=["style","top","acc"].find(k=>WEAR[k].some(a=>a[0]==id));if(!k)return;const look=normLook(R[me].look);look[k]=id;try{await rpc("town_login",{rid:me,pin,new_look:look});mapKey="";await refresh();toast("穿上了")}catch(e){toast(e.message)}}
function shopModal(){const it=R[me].items||{},w=new Set(it.w||[]),d=new Set(it.d||[]),f=new Set(it.f||[]);$("modal").classList.remove("hide");
 const row=(id,name,price,has,kind)=>`<div class="mrow"><span><b>${name}</b> <small class="mut">€${price}</small></span>${has?`<small class="mut">✔ 已在背包</small>`:`<button data-b="${kind}:${id}">買</button>`}</div>`;
 $("mbody").innerHTML=`<h2>🛍️ 造型與擺飾</h2><p class="mut">你有 €${R[me].money} · 背包：零食 ${it.snack||0}、禮物 ${it.gift||0}。買了放進背包；造型自動穿上，擺飾自動放門口（最多 4 樣）。</p>
  <h3>造型</h3>${["style","top","acc"].map(k=>WEAR[k].filter(a=>a[2]).map(a=>row(a[0],a[1],a[2],w.has(a[0]),"w")).join("")).join("")}
  <p class="mut">🔒 情侶 T：和人變成好麻吉就能穿。繃帶頭：被扁 10 次就能戴。</p>
  <h3>門口擺飾</h3>${DECO.map(([id,n,pr])=>row(id,n,pr,d.has(id),"d")).join("")}
  <h3>室內家具</h3><p class="mut">買了放進背包，到家裡「室內」擺放，每種一件。</p>${FURN.map(([id,n,pr,ds])=>`<div class="mrow"><span><b>${n}</b> <small class="mut">€${pr} · ${ds}</small></span>${f.has(id)?`<small class="mut">✔ 已在背包</small>`:`<button data-b="f:${id}">買</button>`}</div>`).join("")}<div class="row"><button id="bagGo">看背包</button><button id="mc">關閉</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");$("bagGo").onclick=()=>bagModal();
 $("mbody").querySelectorAll("[data-b]").forEach(b=>b.onclick=async()=>{b.disabled=true;const [k,id]=b.dataset.b.split(":"),had=((R[me].items||{})[k]||[]).includes(id);await act("buy",{item:b.dataset.b});if(k=="w"&&!had&&((R[me].items||{}).w||[]).includes(id))await wearOn(id);shopModal()})}
// 背包：把 snack、gift、rg、w、f、d 整理成分類（讀取層，不搬資料）
const FIC={bed:"🛏️",sofa:"🛋️",fridge:"🧊",plant:"🪴",shelf:"📚",massage:"💺",rug:"🟥",tvcab:"📺"},DIC={flowers:"🌷",mailbox:"✉️",lamp:"💡",bench:"🪑",tree:"🌳",pigstatue:"🏛️"};
const BAG_TABS=[["food","食物"],["gift","禮物"],["wear","服飾"],["furn","家具"],["deco","擺飾"]];
const bagCount=r=>{const it=r.items||{};return (it.snack||0)+(it.gift||0)+(it.rg||[]).length+(it.w||[]).length+(it.f||[]).length+(it.d||[]).length};
function bagModal(tab){tab=tab||"food";const r=R[me],it=r.items||{},look=normLook(r.look),rg=it.rg||[],fu=it.fu||[];$("modal").classList.remove("hide");
 const row=(ic,name,sub,btn)=>`<div class="mrow"><span>${ic} <b>${esc(name)}</b> <small class="mut">${sub}</small></span>${btn}</div>`;
 const cnt={food:it.snack||0,gift:(it.gift||0)+rg.length,wear:(it.w||[]).length,furn:(it.f||[]).length,deco:(it.d||[]).length};
 let body="";
 if(tab=="food")body=it.snack?row("🍪","零食",`× ${it.snack} · 飽足 +20`,`<button data-eat="1">吃</button>`):'<p class="mut">沒有食物。超市可以買零食</p>';
 if(tab=="gift")body=(it.gift?row("🎁","禮物",`× ${it.gift} · 到朋友面板「送禮物」送出`,""):"")+rg.map(g=>row("📦",`${g.name} 的禮物`,"未拆",`<button data-u="${g.id}">拆開</button><button data-g="${g.id}">轉送</button>`)).join("")||(body||"")
 if(tab=="gift"&&!body)body='<p class="mut">沒有禮物。超市可以買，朋友送的也會在這裡</p>';
 if(tab=="wear")body=(it.w||[]).map(id=>{const k=["style","top","acc"].find(k=>WEAR[k].some(a=>a[0]==id)),a=k&&wInfo(k,id),on=k&&look[k]==id;return row("👗",a?a[1]:id,on?"穿著中":"",on?"":`<button data-w="${id}">穿上</button>`)}).join("")||'<p class="mut">沒有特別款服飾。超市可以買</p>';
 if(tab=="furn")body=(it.f||[]).map(k=>{const a=FURN.find(x=>x[0]==k)||[k,k],pl=fu.includes(k);return row(FIC[k]||"🛍️",a[1],pl?"已擺在家裡":"在背包，還沒擺",pl?"":`<button data-p="1">去擺放</button>`)}).join("")||'<p class="mut">沒有家具。超市可以買</p>';
 if(tab=="deco")body=(it.d||[]).map(k=>{const a=DECO.find(x=>x[0]==k)||[k,k];return row(DIC[k]||"🛍️",a[1],"放在門口","")}).join("")||'<p class="mut">沒有擺飾。超市可以買</p>';
 $("mbody").innerHTML=`<h2>🛍️ 背包</h2><div class="chips">${BAG_TABS.map(([k,n])=>`<button data-t="${k}" class="${tab==k?"on":""}">${n}${cnt[k]?" "+cnt[k]:""}</button>`).join("")}</div>${body}<div class="row"><button id="mc">關閉</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");
 $("mbody").querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>bagModal(b.dataset.t));
 const bind=(sel,fn)=>$("mbody").querySelectorAll(sel).forEach(b=>b.onclick=async()=>{b.disabled=true;await fn(b);bagModal(tab)});
 bind("[data-eat]",()=>act("snack"));bind("[data-u]",async b=>{await act("unwrap",{item:b.dataset.u})});bind("[data-g]",async b=>{await act("regift",{item:b.dataset.g});toast("轉成你的禮物了，可以送人")});
 bind("[data-w]",b=>wearOn(b.dataset.w));
 $("mbody").querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{if(R[me].place=="home:"+me)interiorModal(me);else toast("要先回家才能擺家具")})}
// 在家裝潢：換屋頂、牆壁顏色（€300）
function paintModal(){const it=R[me].items||{};$("modal").classList.remove("hide");
 const pal=(k,arr,cur)=>`<div class="houses">${arr.map(c=>`<button class="sw dot${cur==c?" on":""}" data-p="${k}:${c}" style="background:${c}" aria-label="${k}"></button>`).join("")}</div>`;
 $("mbody").innerHTML=`<h2>🎨 裝潢</h2><p class="mut">換一次 €300，你有 €${R[me].money}。</p><h3>屋頂</h3>${pal("roof",ROOF_C,it.roof||ROOFS[R[me].slot])}<h3>牆壁</h3>${pal("wall",WALL_C,it.wall||"#f4ead6")}
  <h3>門口擺飾</h3><p class="mut">${(it.d||[]).map(x=>(DECO.find(a=>a[0]==x)||[x,x])[1]).join("、")||"還沒有，去超市買"}</p><div class="row"><button id="mc">關閉</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");$("mbody").querySelectorAll("[data-p]").forEach(b=>b.onclick=async()=>{await act("paint",{item:b.dataset.p});paintModal()})}
// 家具畫法（像素方塊）：在 s×s 的格子裡畫
function furnDraw(m,id,x,y,s){const u=s/12,R=(a,b,w,h,c)=>{m.fillStyle=c;m.fillRect(x+a*u,y+b*u,w*u,h*u)};
 if(id=="bed"){R(1,4,10,6,"#8b5a2b");R(1,3,10,3,"#fff");R(1,5,10,5,"#e0779b");R(1,3,3,3,"#f4f1de")}
 if(id=="fridge"){R(3,1,6,10,"#dfe6ea");R(3,5,6,1,"#8a9aa5");R(7,2,1,2,"#8a9aa5");R(7,7,1,2,"#8a9aa5")}
 if(id=="massage"){R(2,3,8,7,"#5a3a2a");R(3,1,6,5,"#7a4a34");R(2,9,8,2,"#3a2212")}
 if(id=="shelf"){R(2,1,8,10,"#8b5a2b");[2,5,8].forEach(a=>{R(3,a,6,2,"#c0392b");R(5,a,2,2,"#3b7dd8");R(7,a,2,2,"#2e9e5b")});R(2,10,8,1,"#5a3a1a")}
 if(id=="sofa"){R(1,4,10,4,"#3b7dd8");R(1,7,10,3,"#2f64b0");R(0,5,2,5,"#2f64b0");R(10,5,2,5,"#2f64b0")}
 if(id=="tvcab"){R(2,6,8,4,"#8b5a2b");R(3,1,6,5,"#222");R(4,2,4,3,"#6fc6ff")}
 if(id=="rug"){R(1,3,10,7,"#c0392b");R(2,4,8,5,"#f1c40f");R(3,5,6,3,"#c0392b")}
 if(id=="plant"){R(4,7,4,4,"#b5651d");R(3,3,6,5,"#2e9e5b");R(5,1,2,4,"#4caf50")}}
// 室內畫面：3×3 格，自己的家可以擺家具、升級；朋友的家只能看
function interiorModal(id,sel){const o=R[id],mine=id==me,it=o.items||{},hl=it.hl||1,fu=[...Array(9)].map((_,i)=>(it.fu||[])[i]||""),used=fu.filter(Boolean).length,cap=HOUSES[hl-1][2];
 $("modal").classList.remove("hide");const owned=(it.f||[]).filter(k=>!fu.includes(k)),nx=HOUSES[hl];
 const cell=i=>`<button class="sw${sel===i?" on":""}" data-c="${i}" style="width:30%;aspect-ratio:1;padding:0;background:${(i%3+Math.floor(i/3))%2?"#d9c9a8":"#e6d8b8"}"><canvas width="72" height="72" data-f="${fu[i]}" style="width:100%;height:100%"></canvas></button>`;
 $("mbody").innerHTML=`<h2>${esc(o.name)} 的家</h2><p class="mut">${HOUSES[hl-1][0]} · 家具 ${used}/${cap} 格${mine?` · 你有 €${o.money}`:""}</p>
  <div class="houses" style="gap:4px">${[...Array(9).keys()].map(cell).join("")}</div>
  ${mine?(sel!=null?(fu[sel]?`<div class="row"><button data-x="${sel}">收回${(FURN.find(a=>a[0]==fu[sel])||[0,fu[sel]])[1]}</button></div>`:`<h3>放進這一格</h3>${owned.length?owned.map(k=>{const a=FURN.find(x=>x[0]==k)||[k,k];return `<div class="mrow"><span><b>${a[1]}</b> <small class="mut">${a[3]||""}</small></span><button data-s="${k}">放</button></div>`}).join(""):'<p class="mut">背包沒有家具，去超市買</p>'}`):'<p class="mut">點一格來擺放或收回家具</p>')
  +(nx?`<div class="row"><button data-up="1">升級成${nx[0]} €${nx[1]}（家具 ${nx[2]} 格）</button></div>`:'<p class="mut">已經是最高級的豪宅</p>'):""}
  <div class="row"><button id="mc">關閉</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");
 $("mbody").querySelectorAll("canvas[data-f]").forEach(c=>{const m=c.getContext("2d");m.imageSmoothingEnabled=false;if(c.dataset.f)furnDraw(m,c.dataset.f,0,0,72)});
 if(!mine)return;
 $("mbody").querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>interiorModal(id,+b.dataset.c));
 const go=async(a,ex)=>{await act(a,ex);interiorModal(id,sel)};
 $("mbody").querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>go("furn",{item:`set:${sel}:${b.dataset.s}`}));
 $("mbody").querySelectorAll("[data-x]").forEach(b=>b.onclick=()=>go("furn",{item:`clr:${sel}`}));
 $("mbody").querySelectorAll("[data-up]").forEach(b=>b.onclick=()=>go("upgrade"))}
function noteModal(id){const t=R[id];$("modal").classList.remove("hide");const quick=["記得吃飯！🍚","晚安 🌙","今天加油！💪","想你了 🥺","快去洗澡 🛁","下次一起吃飯？"];
 $("mbody").innerHTML=`<h2>📱 傳訊息給 ${esc(t.name)}</h2><div class="houses">${quick.map(q=>`<button class="sw" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div><input id="ntx" maxlength="30" placeholder="或自己寫（最多 30 字）" style="margin-top:10px"><p class="err" id="nerr"></p>
  <div class="row"><button id="mc">取消</button><button class="pri" id="ms">傳送</button></div>`;
 $("mbody").querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{$("ntx").value=b.dataset.q});$("mc").onclick=()=>$("modal").classList.add("hide");
 $("ms").onclick=async()=>{const v=$("ntx").value.trim();if(!v){$("nerr").textContent="寫一句話，或點上面的選項";return}$("modal").classList.add("hide");await act("note",{target:id,note:v})}}

// ── 畫面：靜態地圖畫一次（白天、晚上各一張，房子或人數變了才重畫），動態的人與噴水池每幀畫 ──
const cv=$("cv"),g=cv.getContext("2d"),cam={x:0,y:0,s:1};let maps={};
const grassV=(()=>{let s=7;const r=()=>(s=(s*9301+49297)%233280)/233280;return [...Array(40)].map(()=>[...Array(COLS)].map(r))})();
// 門口擺飾
function deco(m,d,x,y,night){const R=(a,b,w,h,c)=>{m.fillStyle=c;m.fillRect(x+a,y+b,w,h)};
 if(d=="flowers"){R(-10,2,22,6,"#6b4423");[["#e74c3c",-8],["#f1c40f",-2],["#e0779b",4],["#9b59b6",9]].forEach(([c,a])=>{R(a,-4,4,4,c);R(a+1,0,2,3,"#2e7d32")})}
 if(d=="mailbox"){R(-1,-6,3,14,"#6b4423");R(-6,-14,13,9,"#c0392b");R(7,-14,2,5,"#f1c40f")}
 if(d=="lamp"){R(-1,-22,3,30,"#444");R(-5,-26,11,6,night?"#ffd76a":"#ddd");if(night){m.fillStyle="rgba(255,215,106,.25)";m.beginPath();m.arc(x,y-22,18,0,7);m.fill()}}
 if(d=="bench"){R(-12,-4,26,4,"#8b5a2b");R(-12,-10,26,3,"#8b5a2b");R(-10,0,3,6,"#5a3a1a");R(9,0,3,6,"#5a3a1a")}
 if(d=="tree"){R(-2,-2,4,10,"#6b4423");m.fillStyle=night?"#2f6b3a":"#4caf50";m.beginPath();m.arc(x,y-8,10,0,7);m.fill()}
 if(d=="pigstatue"){R(-8,2,16,6,"#9a9a9a");m.fillStyle="#f6a5c0";m.beginPath();m.arc(x,y-6,9,0,7);m.fill();R(-8,-16,4,4,"#ec7fa6");R(4,-16,4,4,"#ec7fa6");R(-4,-6,8,5,"#ec7fa6");R(-4,-11,2,2,"#222");R(2,-11,2,2,"#222")}}
function buildMap(night){const ROWS=mapRows(),c=document.createElement("canvas");c.width=COLS*T;c.height=ROWS*T;const m=c.getContext("2d");
 const sign=(t,x,y,bg)=>{m.font="600 14px sans-serif";const w=m.measureText(t).width+14;m.fillStyle=bg||"rgba(20,20,20,.8)";m.fillRect(x-w/2,y-11,w,22);m.fillStyle="#fff";m.textAlign="center";m.textBaseline="middle";m.fillText(t,x,y+1)};
 const win=(x,y,lit)=>{m.fillStyle=night&&lit!==false?"#ffd76a":"#bfe3ff";m.fillRect(x,y,16,14);m.fillStyle="rgba(255,255,255,.5)";m.fillRect(x,y,16,3);m.fillStyle="#3a3a3a";m.fillRect(x+7,y,2,14)};
 for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++){const v=grassV[j][i];m.fillStyle=v<.5?"#7cc46a":"#74bb62";m.fillRect(i*T,j*T,T,T);if(v>.92){m.fillStyle="#f5f0a0";m.fillRect(i*T+10,j*T+12,4,4)}}
 m.fillStyle="#8d8d8d";for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++)if(isRoad(i,j))m.fillRect(i*T,j*T,T,T);
 m.fillStyle="#e8e8e8";for(let j=0;j<ROWS;j++)if(roadRowsAt(j)&&!roadRowsAt(j-1))for(let i=0;i<COLS*T;i+=36)m.fillRect(i,(j+1)*T-1,18,3);
 for(let j=0;j<ROWS*T;j+=36)if(!(j>=8*T&&j<15*T))m.fillRect(17*T-1,j,3,18);
 const [px,py,pw,ph]=PLACES.plaza.r;for(let j=py;j<py+ph;j++)for(let i=px;i<px+pw;i++){m.fillStyle=(i+j)%2?"#cbbf9f":"#d9cfb4";m.fillRect(i*T,j*T,T,T)}
 m.fillStyle="#5aa84f";const [qx,qy,qw,qh]=PLACES.park.r;m.fillRect(qx*T,qy*T,qw*T,qh*T);m.fillStyle="#d9cfb4";m.fillRect(qx*T,19*T+10,qw*T,12);m.fillStyle="#8b5a2b";m.fillRect(30*T,18*T+4,44,10);m.fillRect(30*T+4,18*T+14,4,8);m.fillRect(30*T+36,18*T+14,4,8);
 for(let s=0;s<NR*3;s++){const [hx,hy]=homeXY(s),X=hx*T,Y=hy*T,W=5*T,o=bySlot(s);m.fillStyle="rgba(0,0,0,.18)";m.fillRect(X+8,Y+T+10,W,3*T);const it=(o&&o.items)||{};m.fillStyle=o?(it.wall||"#f4ead6"):"#e2ddd2";m.fillRect(X,Y+T,W,3*T-6);
  m.fillStyle=o?(it.roof||ROOFS[s]):"#9a9a9a";m.fillRect(X-8,Y,W+16,T+14);m.fillStyle="rgba(0,0,0,.15)";for(let k=0;k<W+16;k+=12)m.fillRect(X-8+k,Y,6,T+14);m.fillStyle="rgba(255,255,255,.25)";m.fillRect(X-8,Y,W+16,4);
  win(X+20,Y+T+26,!!o);win(X+W-36,Y+T+26,!!o);m.fillStyle="#7a4a24";m.fillRect(X+W/2-11,Y+3*T+4,22,T-10);m.fillStyle="#e0b050";m.fillRect(X+W/2+5,Y+3*T+18,3,3);m.fillStyle="#cbbf9f";m.fillRect(X+W/2-10,Y+4*T,20,T);
  {const hl=o?(it.hl||1):1;
   if(hl>=2){m.fillStyle="rgba(0,0,0,.22)";m.fillRect(X-8,Y+T+10,W+16,6);[X+20,X+W-36].forEach(a=>{m.fillStyle="#8b5a2b";m.fillRect(a-2,Y+T+40,20,6);m.fillStyle="#e74c3c";m.fillRect(a,Y+T+36,4,4);m.fillStyle="#f1c40f";m.fillRect(a+8,Y+T+36,4,4)})}
   if(hl>=3){m.fillStyle="#8d8d8d";m.fillRect(X+W-30,Y-16,16,24);m.fillStyle="#6d6d6d";m.fillRect(X+W-32,Y-20,20,6);m.fillStyle="#f4f1de";for(let k=-6;k<W+8;k+=14){if(k>W/2-26&&k<W/2+26)continue;m.fillRect(X+k,Y+3*T+14,4,18)}m.fillRect(X-6,Y+3*T+20,W/2-26+6,3);m.fillRect(X+W/2+26,Y+3*T+20,W/2-26+6,3)}
   if(hl>=4){m.fillStyle="#f1c40f";m.fillRect(X-8,Y,W+16,5);m.fillStyle="#e8d9a8";[W/2-30,W/2+22].forEach(a=>{m.fillRect(X+a,Y+T+30,8,2*T-12);m.fillStyle="#cdbb85";m.fillRect(X+a-2,Y+T+26,12,6);m.fillStyle="#e8d9a8"})}}
  sign(o?o.name+" 的家":"空屋",X+W/2,Y+T/2+6,o?null:"rgba(90,90,90,.85)");
  ((it.d)||[]).slice(0,4).forEach((d,i)=>deco(m,d,X+[16,48,144,172][i],Y+4*T+18,night))}
 const bld=(k,wall,roof,deco)=>{if(!isOn(k))return;const [x,y,w,h]=PLACES[k].r,X=x*T,Y=y*T,W=w*T,H=h*T;m.fillStyle="rgba(0,0,0,.18)";m.fillRect(X+8,Y+16,W,H);m.fillStyle=wall;m.fillRect(X,Y+14,W,H-14);m.fillStyle=roof;m.fillRect(X-6,Y,W+12,20);deco(X,Y,W,H)};
 bld("office","#b8c4cf","#5f6b78",(X,Y,W,H)=>{for(let a=0;a<5;a++)for(let b=0;b<3;b++)win(X+16+a*40,Y+36+b*40);m.fillStyle="#555";m.fillRect(X+W/2-14,Y+H-36,28,36)});
 bld("restaurant","#fff3e0","#c0392b",(X,Y,W,H)=>{for(let k=0;k<W;k+=24){m.fillStyle=(k/24)%2?"#fff":"#e74c3c";m.fillRect(X+k,Y+20,24,16)}win(X+20,Y+60);win(X+W-36,Y+60);m.fillStyle="#7a4a24";m.fillRect(X+W/2-12,Y+H-44,24,44)});
 bld("market","#eef7ea","#2e8b57",(X,Y,W,H)=>{m.fillStyle=night?"#ffe9a8":"#cfeefc";m.fillRect(X+14,Y+44,W-28,46);m.fillStyle="#2e8b57";for(let k=X+14;k<X+W-14;k+=28)m.fillRect(k,Y+44,3,46);m.fillStyle="#7a4a24";m.fillRect(X+W/2-14,Y+H-44,28,44)});
 bld("arena","#5a3a2a","#b22222",(X,Y,W,H)=>{m.fillStyle="#2b1d14";m.fillRect(X+16,Y+30,W-32,H-56);m.strokeStyle="#ffd23f";m.lineWidth=3;for(let k=0;k<3;k++)m.strokeRect(X+24+k*6,Y+38+k*6,W-48-k*12,H-72-k*12);m.fillStyle="#fee761";m.font="bold 16px sans-serif";m.textAlign="center";m.fillText("FIGHT",X+W/2,Y+H/2+6);m.fillStyle="#3a2212";m.fillRect(X+W/2-14,Y+H-30,28,30)});
 bld("slaughter","#8a8a7a","#4a4a42",(X,Y,W,H)=>{m.fillStyle="#6b1b1b";for(let k=0;k<5;k++)m.fillRect(X+20+k*40,Y+H-24-(k%2)*6,6,4);m.fillStyle="#333";m.fillRect(X+20,Y+34,W-40,6);for(let k=X+30;k<X+W-30;k+=34){m.fillStyle="#bbb";m.fillRect(k,Y+40,3,14);m.fillRect(k-4,Y+52,10,3)}m.fillStyle="#2a2a2a";m.fillRect(X+W/2-16,Y+H-40,32,40);m.fillStyle="#c0392b";m.font="bold 14px sans-serif";m.textAlign="center";m.fillText("危險",X+W/2,Y+H-46)});
 bld("cafe","#f3e1c7","#6b4423",(X,Y,W,H)=>{for(let k=0;k<W;k+=24){m.fillStyle=(k/24)%2?"#fff":"#2e7d32";m.fillRect(X+k,Y+20,24,14)}win(X+18,Y+50);win(X+W-34,Y+50);m.fillStyle="#7a4a24";m.fillRect(X+W/2-12,Y+H-40,24,40);m.fillStyle="#fff";m.fillRect(X+W/2-30,Y+56,14,10);m.fillStyle="#6b4423";m.fillRect(X+W/2-28,Y+58,10,6)});
 bld("cinema","#3b2a4a","#c0392b",(X,Y,W,H)=>{m.fillStyle="#1b1b2f";m.fillRect(X+20,Y+26,W-40,26);m.fillStyle="#fee761";m.font="bold 18px sans-serif";m.textAlign="center";m.fillText("CINEMA",X+W/2,Y+46);for(let k=X+10;k<X+W-10;k+=16){m.fillStyle=night?"#ffe36a":"#d6b33a";m.fillRect(k,Y+58,6,6)}m.fillStyle="#7a1d2b";m.fillRect(X+W/2-20,Y+H-44,40,44)});
 bld("gym","#c9d1dc","#34495e",(X,Y,W,H)=>{win(X+16,Y+40);win(X+W-32,Y+40);m.fillStyle="#222";m.fillRect(X+W/2-22,Y+34,44,6);m.fillRect(X+W/2-28,Y+28,8,18);m.fillRect(X+W/2+20,Y+28,8,18);m.fillStyle="#555";m.fillRect(X+W/2-12,Y+H-36,24,36)});
 const trees=[];for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++)if(!blocked(i,j)&&!isRoad(i,j)&&!inRect(i,j,PLACES.plaza.r)&&!inRect(i,j,PLACES.park.r)&&!Object.values(OBJS).some(q=>q.x==i&&q.y==j)&&grassV[j][i]<.1&&![...Array(NR*3).keys()].some(s=>{const d=door(s),[hx,hy]=homeXY(s);return (Math.abs(d[0]-i)<=1&&Math.abs(d[1]-j)<=1)||(j==hy+4&&i>=hx&&i<hx+5)}))trees.push([i,j]);
 [[26,18],[28,18],[31,18],[33,18],[27,20],[32,20]].forEach(t=>trees.push(t));
 trees.forEach(([i,j])=>{const x=i*T+16,y=j*T+18;m.fillStyle="rgba(0,0,0,.2)";m.beginPath();m.ellipse(x+4,y+12,14,5,0,0,7);m.fill();m.fillStyle="#6b4423";m.fillRect(x-3,y,6,12);m.fillStyle=night?"#2f6b3a":"#3f9a4c";m.beginPath();m.arc(x,y-4,14,0,7);m.fill();m.fillStyle=night?"#3d7f48":"#5cbf63";m.beginPath();m.arc(x-4,y-9,7,0,7);m.fill()});
 for(let k=0;k<NR;k++){const y=k==0?6:k==1?15:22+7*(k-2);sign(STREETS[k],8*T,y*T+T,"rgba(60,60,60,.8)")}
 {const R0=(x,y,w,h,c)=>{m.fillStyle=c;m.fillRect(x,y,w,h)},o=OBJS;
  let X=o.vend.x*T,Y=o.vend.y*T;R0(X+4,Y-14,24,40,"#c0392b");R0(X+8,Y-10,16,14,night?"#ffe9a8":"#cfeefc");R0(X+8,Y+8,16,4,"#222");R0(X+10,Y+16,12,6,"#7f1d1d");
  X=o.trash.x*T;Y=o.trash.y*T;R0(X+8,Y+4,16,22,"#2e7d32");R0(X+6,Y,20,5,"#1b5e20");
  X=o.stall.x*T;Y=o.stall.y*T;R0(X+2,Y+8,28,16,"#8b5a2b");R0(X,Y-10,32,8,"#e74c3c");R0(X+14,Y-2,4,10,"#5a3a1a");R0(X+6,Y+4,6,4,"#c0602b");R0(X+16,Y+4,6,4,"#c0602b");
  const S=(k,f)=>{X=o[k].x*T;Y=o[k].y*T;f()};
  S("bench",()=>{R0(X+2,Y+8,28,4,"#a8703a");R0(X+2,Y+14,28,5,"#8b5a2b");R0(X+4,Y+19,4,8,"#5a3a1a");R0(X+24,Y+19,4,8,"#5a3a1a")});
  S("cooler",()=>{R0(X+8,Y+6,16,20,"#cfe9f7");R0(X+10,Y,12,8,"#5dade2");R0(X+12,Y+14,8,4,"#2471a3")});
  S("mailbox",()=>{R0(X+6,Y+6,20,14,"#1f5fbf");R0(X+8,Y+10,16,3,"#fff");R0(X+14,Y+20,4,10,"#555")});
  S("claw",()=>{R0(X+2,Y-8,28,34,"#e84393");R0(X+6,Y-4,20,18,"#fdebd0");R0(X+14,Y-4,2,8,"#aaa");R0(X+10,Y+16,12,4,"#222")});
  S("news",()=>{R0(X+2,Y+8,28,16,"#e67e22");R0(X,Y-4,32,8,"#2980b9");R0(X+6,Y+10,8,8,"#fff");R0(X+18,Y+10,8,8,"#f1c40f")});
  S("pwc",()=>{R0(X+4,Y-10,24,36,"#7f8c8d");R0(X+8,Y-4,16,10,"#fff");R0(X+12,Y+10,8,16,"#34495e")});
  S("dummy",()=>{R0(X+14,Y-10,4,40,"#6b4423");R0(X+4,Y-2,24,5,"#8b5a2b");R0(X+8,Y-22,16,14,"#e0c28a");R0(X+8,Y-22,16,3,"#c9a96a");R0(X+11,Y-17,3,3,"#222");R0(X+18,Y-17,3,3,"#222");R0(X+8,Y-6,16,16,"#d9a441");R0(X+12,Y-2,8,8,"#c0392b");R0(X+14,Y+0,4,4,"#fff")});
  S("lottery",()=>{R0(X+2,Y+8,28,16,"#c0392b");R0(X,Y-6,32,10,"#f1c40f");R0(X+8,Y+10,16,8,"#fff")});
  X=29*T;Y=21*T;R0(X,Y-24,4,30,"#6b4423");R0(X+28,Y-24,4,30,"#6b4423");R0(X,Y-26,32,4,"#6b4423");R0(X+10,Y-22,2,18,"#888");R0(X+20,Y-22,2,18,"#888");R0(X+8,Y-4,16,4,"#d8901a")}
 sign("公司",29.5*T,10);sign("餐廳",5*T,9*T+10);sign("超市",28*T,9*T+10);sign("公園",29.5*T,17*T+12);sign("小豬廣場",17*T,8*T+14);if(isOn("cafe"))sign("咖啡廳",38*T,10);if(isOn("cinema"))sign("電影院",39*T,9*T+10);if(isOn("gym"))sign("健身房",38*T,17*T+10);if(isOn("arena"))sign("格鬥場",48.5*T,10);if(isOn("slaughter"))sign("屠宰場",48.5*T,9*T+10);
 if(night){m.fillStyle="rgba(18,28,78,.45)";m.fillRect(0,0,c.width,c.height)}
 return c}
// 畫一個角色：(x,y) 是身體中心，u 是一格像素的大小
function drawChar(c,x,y,u,L0,st,tk){const L=normLook(L0),b=st.moving?Math.floor(tk/7)%2:0,R=(cx,cy,w,h,col)=>{c.fillStyle=col;c.fillRect(x+cx*u,y+cy*u,w*u,h*u)},H=L.hair;
 if(st.sleeping){R(-9,2,14,7,"#7fa8d8");for(let i=-8;i<5;i+=3)R(i,2,1,7,"#5d86b8");R(5,2,7,7,L.skin);R(10,2,2,7,H);return}// 睡衣
 const bare=L.bottom!="長褲"||L.top=="dress",leg=bare?L.skin:L.pants;
 R(-4,5,3,6-b*2,leg);R(1,5,3,4+b*2,leg);R(-4,11-b*2,3,1,"#3a2a20");R(1,9+b*2,3,1,"#3a2a20");
 if(L.top!="dress"){if(L.bottom=="短褲")R(-4,5,8,3,L.pants);if(L.bottom=="裙子")R(-5,5,10,3,L.pants)}
 const sc=L.top=="suit"?"#2c3140":L.top=="couple"?"#f06b9b":L.shirt;R(-5,-3,10,9,sc);
 if(L.top=="dress")R(-6,4,12,4,sc);if(L.top=="帽T"){R(-4,-3,8,1.5,"rgba(0,0,0,.25)");R(-2,2,4,2,"rgba(0,0,0,.18)")}
 if(L.top=="襯衫")R(-1.5,-3,3,2,"#fff");if(L.top=="suit"){R(-1,-3,2,6,"#fff");R(-.5,-2,1,4,"#c0392b")}
 if(L.top=="jersey"){R(-5,-1,10,1,"#fff");R(-1,1,2,3,"#fff")}if(L.top=="couple"){R(-1.5,0,1.5,1.5,"#fff");R(0,0,1.5,1.5,"#fff");R(-.75,1.2,1.5,1,"#fff")}
 if(st.dirty){R(-3,0,2,1,"#6b4a2b");R(2,2,1,1,"#6b4a2b");R(-1,4,2,1,"#6b4a2b")}
 R(-4,-11,8,8,L.skin);
 const hs={短髮:()=>R(-4,-12,8,3,H),長髮:()=>{R(-5,-12,10,3,H);R(-5,-10,2,8,H);R(3,-10,2,8,H)},光頭:()=>{},馬尾:()=>{R(-4,-12,8,3,H);R(4,-10,2,5,H)},
  捲髮:()=>{R(-5,-12,10,2,H);R(-5,-10,1,3,H);R(4,-10,1,3,H);R(-3,-13,2,1,H);R(1,-13,2,1,H)},包頭:()=>{R(-4,-12,8,2,H);R(-2,-14,4,2,H)},瀏海:()=>{R(-4,-12,8,3,H);R(-4,-9,5,1,H)},
  twintail:()=>{R(-4,-12,8,3,H);R(-6,-10,2,6,H);R(4,-10,2,6,H)},mohawk:()=>R(-1,-14,2,4,H)};(hs[L.style]||hs.短髮)();
 const ey={圓眼:()=>{R(-2,-8,1,2,"#222");R(2,-8,1,2,"#222")},瞇眼:()=>{R(-3,-7,2,.8,"#222");R(1,-7,2,.8,"#222")},
  眼鏡:()=>{R(-3,-9,3,.6,"#222");R(1,-9,3,.6,"#222");R(-3,-9,.6,2.4,"#222");R(3.4,-9,.6,2.4,"#222");R(-2,-8,1,1.4,"#222");R(2,-8,1,1.4,"#222")},墨鏡:()=>R(-3.5,-8.5,7.5,2,"#111")};(ey[L.eyes]||ey.圓眼)();
 if(L.blush){R(-4,-6,1.5,1,"#ff9fb0");R(2.5,-6,1.5,1,"#ff9fb0")}if(L.beard)R(-4,-5,8,2,H);
 if(st.bruised){R(1,-9,3,3,"#6b3fa0");R(-4,-6,4,1,"#fff");R(-3,-7,1,3,"#fff")}
 const ac={棒球帽:()=>{R(-5,-13,10,3,"#c0392b");R(-6,-10.5,7,1.2,"#a02a20")},毛帽:()=>{R(-5,-14,10,4,"#e67e22");R(-1,-15,2,1,"#fff")},
  crown:()=>{R(-4,-15,8,2.5,"#f1c40f");R(-4,-16.5,1.2,1.5,"#f1c40f");R(-.6,-17,1.2,2,"#f1c40f");R(2.8,-16.5,1.2,1.5,"#f1c40f");R(-.5,-14.5,1,1,"#e74c3c")},
  pigears:()=>{R(-5,-14.5,3,3,"#f6a5c0");R(2,-14.5,3,3,"#f6a5c0");R(-4.3,-13.8,1.5,1.5,"#ec7fa6");R(2.8,-13.8,1.5,1.5,"#ec7fa6")},
  headphones:()=>{R(-5,-13.2,10,1,"#333");R(-6,-9,2,3,"#333");R(4,-9,2,3,"#333")},scarf:()=>{R(-5,-4,10,2,"#c0392b");R(2,-2,2,3,"#c0392b")},bandage:()=>{R(-4,-11,8,1.5,"#fff");R(2,-12.5,2,1.5,"#fff")}};(ac[L.acc]||(()=>{}))()}
const CIMG={};const cimg=e=>{if(!CIMG[e]){const i=new Image();i.src=pxIcon(e);CIMG[e]=i}return CIMG[e]};
// 置中畫一行字，emoji 換成像素圖示；回傳寬度
function textIcons(t,cx,cy,sz,measureOnly){const parts=t.split(EMO).filter(x=>x&&!/^[\uFE0F\u200D]+$/.test(x));let w=0;const ws=parts.map(p=>{EMO.lastIndex=0;const ic=EMO.test(p);EMO.lastIndex=0;const pw=ic?sz+2:g.measureText(p).width;w+=pw;return [p,ic,pw]});
 if(measureOnly)return w;let x=cx-w/2;g.textAlign="left";for(const [p,ic,pw] of ws){if(ic){const im=cimg(p);if(im.complete)g.drawImage(im,x+1,cy-sz/2,sz,sz)}else g.fillText(p,x,cy);x+=pw}g.textAlign="center";return w}
function person(x,y,look,tk,moving,label,isMe,state){const u=1.6;
 if(isMe){g.strokeStyle="#ffd23f";g.lineWidth=3;g.beginPath();g.ellipse(x,y+12*u,11*u,4*u,0,0,7);g.stroke()}
 g.fillStyle="rgba(0,0,0,.25)";g.fillRect(x-5*u,y+10*u,10*u,3*u);drawChar(g,x,y,u,look,{...state,moving},tk);
 if(state.sleeping){g.font="bold 16px sans-serif";g.fillStyle="#fff";g.fillText("Zz",x+14*u,y-6*u+Math.sin(tk/20)*3)}
 if(state.stink){g.strokeStyle="#7bd36b";g.lineWidth=2;for(let k=-1;k<=1;k++){g.beginPath();for(let s=0;s<10;s++)g.lineTo(x+k*8*u+Math.sin(tk/6+s)*2,y-16*u-s*2.2);g.stroke()}}
 g.font="600 13px sans-serif";g.textAlign="center";g.textBaseline="middle";const tag=label+(state.bruised?" 🤕":"")+(state.hungry?" 🍚":""),w=textIcons(tag,0,0,14,true)+10,ty=y-32*u;g.fillStyle=isMe?"rgba(160,110,0,.9)":"rgba(0,0,0,.65)";g.fillRect(x-w/2,ty,w,18);g.fillStyle="#fff";textIcons(tag,x,ty+9,14);
 // 心情泡泡
 if(state.bubble){g.font="500 12px sans-serif";const bw=textIcons(state.bubble,0,0,13,true)+14,by=ty-26;g.fillStyle="rgba(255,255,255,.95)";g.beginPath();g.roundRect?g.roundRect(x-bw/2,by,bw,22,8):g.rect(x-bw/2,by,bw,22);g.fill();g.beginPath();g.moveTo(x-5,by+22);g.lineTo(x+5,by+22);g.lineTo(x,by+28);g.fill();g.fillStyle="#2c2620";textIcons(state.bubble,x,by+11,13)}}
function miniPerson(c,L){const m=c.getContext("2d"),u=c.height/30;m.clearRect(0,0,c.width,c.height);drawChar(m,c.width/2,17.5*u,u,L,{},0)}
let W=0,Hh=0,dpr=1;
const isMob=()=>matchMedia("(max-width:700px)").matches;
function resize(){const box=$("stage");dpr=Math.min(2,devicePixelRatio||1);W=box.clientWidth;Hh=isMob()?Math.round(box.clientHeight||innerHeight):Math.round(Math.min(innerHeight*.58,Math.max(300,W*.8)));cv.width=W*dpr;cv.height=Hh*dpr;cv.style.height=Hh+"px";
 // 平常地圖要填滿畫面（不留黑邊）；按「看全鎮」才縮到看得到整個鎮
 const fit=Math.min(W/(COLS*T),Hh/(mapRows()*T)),cover=Math.max(W/(COLS*T),Hh/(mapRows()*T));cam.minS=zoomFar?fit:cover;const def=W/((W<600?9:17)*T);cam.maxS=def*2.5;
 if(!cam.user)cam.s=zoomFar?cam.minS:def;cam.s=clamp(cam.s,cam.minS,cam.maxS)}
if(window.visualViewport)visualViewport.addEventListener("resize",resize);
// iPhone Safari：避免兩指縮放到整個網頁
document.addEventListener("gesturestart",e=>e.preventDefault());
addEventListener("resize",resize);
let tk=0,last=performance.now();const bubbles={};
// 心情泡泡：依狀態說一句話
function moodLine(id,r){const c=[];if(r.hunger<25)c.push("好餓…🍚","肚子在叫了");if(r.bladder<25)c.push("要尿尿了😣");if(r.hygiene<25)c.push("好像有點臭…");if(r.energy<20)c.push("好睏…😪");
 if(r.bruised)c.push("誰扁我的給我出來😤","臉好痛…");if(r.fun>80)c.push("今天心情超好✨","耶～");if(id!=me&&bondWith(id)<=-20)c.push("哼！","看什麼看");if(id!=me&&bondWith(id)>=30)c.push("嗨麻吉！💞");
 if(c.length&&Math.random()<.7)return rp(c);return rp(["好想吃火鍋…","今天天氣真好","有人要一起吃飯嗎？","想去公園走走","上班好累…","🎵～","晚餐吃什麼？","想睡午覺","有人在嗎？"])}
function frame(t){const dt=Math.min(.1,(t-last)/1000);last=t;tk++;requestAnimationFrame(frame);if(!S||!me||!R[me]||$("game").classList.contains("hide"))return;
 const night=isNight(),key=night?"n":"d";if(!maps[key])maps[key]=buildMap(night);const MW=COLS*T,MH=mapRows()*T;
 for(const id in walkers){const w=walkers[id];if(!R[id]||!w.path.length)continue;const [nx,ny]=w.path[0],dx=nx-w.x,dy=ny-w.y,d=Math.hypot(dx,dy),sp=4.5*dt;w.moving=true;
  if(d<=sp){w.x=nx;w.y=ny;w.path.shift();if(!w.path.length){w.moving=false;if(id==me&&w.dest)arrived(w)}}else{w.x+=dx/d*sp;w.y+=dy/d*sp}}
 const mw=walkers[me];if(!camFree){const off=isMob()?(($("panel").offsetHeight||0)-($("needs").offsetHeight||0))/2/cam.s:0;cam.x+=((mw.x+.5)*T-cam.x)*.12;cam.y+=((mw.y+.5)*T+off-cam.y)*.12}
 // 慣性：放手後繼續滑，慢慢停下
 if(!down&&!pinch&&(Math.abs(cam.vx||0)>.01||Math.abs(cam.vy||0)>.01)){cam.x+=cam.vx*dt*1000;cam.y+=cam.vy*dt*1000;const f=Math.pow(.92,dt*60);cam.vx*=f;cam.vy*=f}
 const vw=W/cam.s,vh=Hh/cam.s,mob=isMob(),pt=mob?(($("needs").offsetHeight||0)+8)/cam.s:0,pb=mob?(($("panel").offsetHeight||0)+8)/cam.s:0,mg=T;
 const bx=[vw/2-mg,MW-vw/2+mg],by=[vh/2-pt-mg,MH-vh/2+pb+mg];
 cam.x=bx[0]>bx[1]?MW/2:clamp(cam.x,bx[0],bx[1]);cam.y=by[0]>by[1]?MH/2+(pb-pt)/2:clamp(cam.y,by[0],by[1]);
 const ox=cam.x-vw/2,oy=cam.y-vh/2;cam.ox=ox;cam.oy=oy;
 g.setTransform(1,0,0,1,0,0);g.fillStyle="#3d6b35";g.fillRect(0,0,cv.width,cv.height);g.setTransform(dpr*cam.s,0,0,dpr*cam.s,-ox*dpr*cam.s,-oy*dpr*cam.s);g.imageSmoothingEnabled=false;g.drawImage(maps[key],0,0);
 const fx=17*T,fy=11.5*T;g.fillStyle="#9a9a9a";g.beginPath();g.arc(fx,fy,48,0,7);g.fill();g.fillStyle="#4aa3e0";g.beginPath();g.arc(fx,fy,40,0,7);g.fill();g.strokeStyle="#bfe6ff";g.lineWidth=2;g.beginPath();g.arc(fx,fy,18+(tk%50)/2.2,0,7);g.stroke();
 g.fillStyle="#f6a5c0";g.beginPath();g.arc(fx,fy-4,15,0,7);g.fill();g.fillRect(fx-15,fy-21,8,9);g.fillRect(fx+7,fy-21,8,9);g.fillStyle="#ec7fa6";g.fillRect(fx-7,fy-2,14,9);g.fillStyle="#8a3a55";g.fillRect(fx-4,fy+1,3,3);g.fillRect(fx+2,fy+1,3,3);g.fillStyle="#222";g.fillRect(fx-8,fy-11,3,3);g.fillRect(fx+5,fy-11,3,3);
 g.fillStyle="#bfe6ff";g.fillRect(fx-1,fy-26-((tk%30)/30)*16,3,5);
 // 公園的流浪貓：在公園裡慢慢走來走去
 {const cx=(25.5+4*(1+Math.sin(t/7000)))*T,cy=(18.6+.8*Math.sin(t/3100))*T;g.fillStyle="#555";g.fillRect(cx-8,cy-4,16,8);g.fillRect(cx+6,cy-10,8,8);g.fillRect(cx+6,cy-12,2,3);g.fillRect(cx+12,cy-12,2,3);g.fillRect(cx-12,cy-8+Math.sin(t/300)*2,4,8);g.fillStyle="#ffd23f";g.fillRect(cx+8,cy-8,2,2);g.fillRect(cx+11,cy-8,2,2)}
 for(const q of POOPS){const im=cimgP("💩");if(im.complete)g.drawImage(im,q.x*T+2,q.y*T+2,T-4,T-4)}
 // 人：依 y 排序，前面的蓋住後面的；在家睡覺的人在屋裡看不到，改在屋頂畫 💤；晚上有人在家的窗戶亮燈
 const list=Object.values(R).map(r=>({id:r.id,w:walkers[r.id],r:tickLocal(r,now())})).filter(o=>!(o.r.sleeping&&o.r.place=="home:"+o.id&&!o.w.path.length)).sort((a,b)=>a.w.y-b.w.y);
 const nowMs=Date.now();for(const o of list){const bb=bubbles[o.id]||(bubbles[o.id]={next:nowMs+2e3+Math.random()*15e3});if(nowMs>bb.next){bb.text=Math.random()<.6?moodLine(o.id,o.r):null;bb.until=nowMs+4500;bb.next=nowMs+18e3+Math.random()*25e3}
  person((o.w.x+.5)*T,(o.w.y+.5)*T,o.r.look,tk,o.w.moving,nameTag(o.r),o.id==me,{sleeping:o.r.sleeping&&!o.w.path.length,stink:o.r.hygiene<25,dirty:o.r.hygiene<25,hungry:o.r.hunger<20,bruised:o.r.bruised,bubble:o.r.sleeping?null:o.r.bladder<20?"快憋不住 🚽":bb.text&&nowMs<bb.until?bb.text:null})}
 for(const r of Object.values(R)){if(r.place!="home:"+r.id)continue;const [hx,hy]=homeXY(r.slot);if(night){g.fillStyle="rgba(255,215,106,.35)";g.fillRect(hx*T+16,hy*T+T+22,24,22);g.fillRect(hx*T+5*T-40,hy*T+T+22,24,22)}
  if(r.sleeping){g.font="bold 18px sans-serif";g.fillStyle="#fff";g.textAlign="center";{const im=cimg("💤");if(im.complete)g.drawImage(im,hx*T+4.2*T-10,hy*T+T-12+Math.sin(tk/25)*4,20,20)}}}
 // 互動動畫
 {const nowp=performance.now(),IMG=FXIMG;const img=e=>{if(!IMG[e]){const i=new Image();i.src=pxIcon(e);IMG[e]=i}return IMG[e]};const icon=(e,x,y,s)=>{const i=img(e);if(i.complete)g.drawImage(i,x-s/2,y-s/2,s,s)};
  const pos=id=>{const w=walkers[id];return [(w.x+.5)*T,(w.y+.5)*T]};
  for(let i=fxs.length-1;i>=0;i--){const f=fxs[i],k=(nowp-f.born)/f.dur;if(k>=1||!walkers[f.a]){fxs.splice(i,1);continue}const [ax,ay]=pos(f.a),[bx,by]=f.b?pos(f.b):[ax,ay],e=Math.sin(k*Math.PI);
   g.save();g.imageSmoothingEnabled=false;g.globalAlpha=k>.8?(1-k)*5:1;
   const up=(em,n=1,spread=14)=>{for(let j=0;j<n;j++)icon(em,ax+(j-(n-1)/2)*spread+Math.sin(k*9+j)*3,ay-50-k*40-j*4,24)};
   const fly=(em,arc=60)=>{const x=ax+(bx-ax)*k,y=ay+(by-ay)*k-50-Math.sin(k*Math.PI)*arc;icon(em,x,y,26)};
   switch(f.type){
    case "eat":up("🍚");if(k>.3)for(let j=0;j<4;j++){g.fillStyle="#f5e6b8";g.fillRect(ax-10+j*6,ay-30+((k*60+j*7)%20),3,3)}break;
    case "toilet":up("🚽");break;
    case "bubbles":for(let j=0;j<6;j++){const bx2=ax+Math.sin(j*2.1+k*6)*18,by2=ay-20-((k*80+j*15)%50);g.strokeStyle="#bfe6ff";g.lineWidth=2;g.beginPath();g.arc(bx2,by2,3+j%3,0,7);g.stroke()}up("🛁");break;
    case "tv":g.fillStyle=`rgba(120,190,255,${.25+.2*Math.sin(nowp/80)})`;g.beginPath();g.arc(ax,ay-10,30,0,7);g.fill();up("📺");break;
    case "zzz":for(let j=0;j<3;j++){g.font="bold "+(12+j*4)+"px sans-serif";g.fillStyle="#fff";g.fillText("Z",ax+10+j*8,ay-30-j*10-k*20)}break;
    case "coins":for(let j=0;j<5;j++)icon("🪙",ax-20+j*10,ay-30-Math.abs(Math.sin(k*8+j))*30,16);break;
    case "coin":icon("🪙",ax,ay-40-e*40,18);if(k>.6)icon("✨",ax,ay-60,24);break;
    case "hearts":for(let j=0;j<3;j++)icon("💗",ax+(j-1)*16+Math.sin(k*6+j)*6,ay-40-k*50-j*8,18);if(f.b)fly("💗",40);break;
    case "sparkle":for(let j=0;j<5;j++){const a2=j*1.25+k*4;icon("✨",ax+Math.cos(a2)*28*e,ay-30+Math.sin(a2)*28*e,16)}break;
    case "bag":up("🛍️");break;case "paint":up("🎨");break;case "sun":up("☀️");break;case "can":up("🥤");break;
    case "gift":fly("🎁");if(k>.85)icon("✨",bx,by-50,28);break;
    case "msg":fly("💌",40);break;
    case "phone":icon("📞",ax+Math.sin(nowp/40)*3,ay-55,24);break;
    case "scooter":{const x=ax+(bx-ax)*k,y=ay+(by-ay)*k-10;icon("🛵",x,y,28);break}
    case "clap":{const mx=(ax+bx)/2,my=(ay+by)/2;icon("🙌",mx,my-50-e*10,28);if(k<.5)for(let j=0;j<6;j++){const a2=j*1.05;g.fillStyle="#ffd23f";g.fillRect(mx+Math.cos(a2)*k*60,my-50+Math.sin(a2)*k*60,4,4)}break}
    case "fight":{const mx=(ax+bx)/2,my=(ay+by)/2-10;g.fillStyle="rgba(230,230,230,.9)";for(let j=0;j<7;j++){const a2=j*.9+nowp/120;g.beginPath();g.arc(mx+Math.cos(a2)*18,my+Math.sin(a2)*12,12+Math.sin(nowp/60+j)*3,0,7);g.fill()}
      icon(["👊","💥","⭐"][Math.floor(nowp/150)%3],mx+Math.sin(nowp/70)*14,my-6,26);icon("💥",mx-16,my-18+Math.sin(nowp/90)*6,18);break}
    case "egg":{if(k<.75){const kk=k/.75,x=ax+(bx-ax)*kk,y=ay+(by-ay)*kk-50-Math.sin(kk*Math.PI)*60;icon("🥚",x,y,22)}else{g.fillStyle="#fff";g.beginPath();g.ellipse(bx,by-40,16,8,0,0,7);g.fill();g.fillStyle="#ffcc33";g.beginPath();g.arc(bx,by-40,6,0,7);g.fill()}break}
    case "fart":{for(let j=0;j<5;j++){g.fillStyle=`rgba(140,200,90,${.6-j*.1})`;g.beginPath();g.arc(ax+Math.sin(j+k*3)*20,ay-k*40-j*6,10+k*14,0,7);g.fill()}icon("💨",ax+16,ay-30,22);break}
    case "alarm":icon("⏰",ax+Math.sin(nowp/30)*4,ay-55,26);break}
   g.restore()}}
 // 飄字：剛做完的動作讓數值變多少
 {const mw2=walkers[me],nowp=performance.now();for(let i=floaters.length-1;i>=0;i--){const f=floaters[i],age=(nowp-f.born)/1400;if(age>1){floaters.splice(i,1);continue}if(age<0)continue;
  g.globalAlpha=1-age;g.font="700 15px sans-serif";g.textAlign="center";g.lineWidth=4;g.strokeStyle="rgba(0,0,0,.6)";const fx2=(mw2.x+.5)*T+(i%2?14:-14),fy2=(mw2.y+.5)*T-70-age*40;g.strokeText(f.t,fx2,fy2);g.fillStyle=f.good?"#7CFC8A":"#ff8a80";g.fillText(f.t,fx2,fy2);g.globalAlpha=1}}
 if(tk%30==0){renderNeeds();if(!walkers[me].path.length)renderPanel()}}
requestAnimationFrame(frame);

// ── 點地圖：拖曳＝移動視角，點一下＝走過去或看那個人 ──
let down=null,pinch=null;const ptrs=new Map();
const zoomAt=(ns,mx,my)=>{const rc=cv.getBoundingClientRect(),px=mx-rc.left,py=my-rc.top,wx=px/cam.s+cam.ox,wy=py/cam.s+cam.oy;ns=clamp(ns,cam.minS,cam.maxS);
 // 手指下的那個點保持不動
 cam.s=ns;cam.user=true;camFree=true;cam.x=wx-px/ns+W/(2*ns);cam.y=wy-py/ns+Hh/(2*ns)};
cv.addEventListener("pointerdown",e=>{e.preventDefault();cam.vx=cam.vy=0;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});cv.setPointerCapture(e.pointerId);
 if(ptrs.size==2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,s:cam.s,mx:(a.x+b.x)/2,my:(a.y+b.y)/2};down=null;return}
 down={x:e.clientX,y:e.clientY,ox:cam.x,oy:cam.y,moved:false,pinched:false}});
cv.addEventListener("pointermove",e=>{if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pinch&&ptrs.size>=2){const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;zoomAt(pinch.s*d/pinch.d,mx,my);
  cam.x-=(mx-pinch.mx)/cam.s;cam.y-=(my-pinch.my)/cam.s;pinch.mx=mx;pinch.my=my;pinch.s=cam.s;pinch.d=d;return}
 if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.hypot(dx,dy)>6){down.moved=true;camFree=true;const t=performance.now(),px=down.lx??down.x,py=down.ly??down.y,dt2=Math.max(1,t-(down.lt||t-16));
  cam.vx=-(e.clientX-px)/cam.s/dt2;cam.vy=-(e.clientY-py)/cam.s/dt2;down.lx=e.clientX;down.ly=e.clientY;down.lt=t;cam.x-=(e.clientX-px)/cam.s;cam.y-=(e.clientY-py)/cam.s}});
const endPtr=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2&&pinch){pinch=null;down=null}};
cv.addEventListener("pointercancel",endPtr);
cv.addEventListener("wheel",e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();zoomAt(cam.s*Math.exp(-e.deltaY*.01),e.clientX,e.clientY)},{passive:false});
cv.addEventListener("pointerup",e=>{const wasPinch=ptrs.size>=2||!down;endPtr(e);if(wasPinch)return;const d=down;down=null;
 // 停在原地才放手就不要慣性
 if(d.moved&&performance.now()-(d.lt||0)>80){cam.vx=cam.vy=0}if(d.moved||!S)return;const rc=cv.getBoundingClientRect(),wx=(e.clientX-rc.left)/cam.s+cam.ox,wy=(e.clientY-rc.top)/cam.s+cam.oy,tx=Math.floor(wx/T),ty=Math.floor(wy/T);
 const hit=Object.values(R).find(r=>r.id!=me&&Math.hypot((walkers[r.id].x+.5)*T-wx,(walkers[r.id].y+.2)*T-wy)<T*.8);
 if(hit){sel=sel==hit.id?null:hit.id;renderPanel();return}sel=null;
 if(R[me].sleeping){toast("先起床才能出門");return}
 const p=placeAt(tx,ty);if(!p){toast("那裡走不過去");return}if(p.slot!=null){goHouse(p.slot);return}walkTo(p.dest,p.door)});
$("zoom").onclick=()=>{zoomFar=!zoomFar;cam.user=false;$("zoom").textContent=zoomFar?"🔍 拉近":"🗺️ 看全鎮";camFree=zoomFar;resize()};
$("home").onclick=()=>{camFree=false;sel=null;lastPanel="";renderPanel()};
$("logout").onclick=()=>{if(!confirm("登出後要再輸入一次邀請碼才能進來。確定嗎？"))return;dropMine(TID);me=null;pin=null;townLogin()};
$("towns").onclick=()=>go("");
$("invite").onclick=async()=>{if(R[me].mayor){try{shareModal((await rpc("town_mayor",{rid:me,pin,act:"invite"})).invite)}catch(e){toast(e.message)}}else{const text=`來「${S.town.name}」當鄰居！🐷\n${townURL()}\n（邀請碼請問鎮長）`;try{await navigator.clipboard.writeText(text);toast("已複製網址，邀請碼請鎮長給")}catch(e){toast(townURL())}}};
$("mayor").onclick=mayorPanel;// 抽屜：點一下在「一般 → 拉高 → 收起」之間切換；也可以上下滑
const gripLabel=()=>{const p=$("panel");$("grip").textContent=p.classList.contains("min")?"▲ 展開":"▼ 收起"};
$("grip").onclick=()=>{const p=$("panel");p.classList.toggle("min");p.classList.remove("max");gripLabel()};gripLabel();
{let sy=null;$("grip").addEventListener("touchstart",e=>{sy=e.touches[0].clientY},{passive:true});$("grip").addEventListener("touchend",e=>{if(sy==null)return;const dy=e.changedTouches[0].clientY-sy,p=$("panel");if(dy<-30){p.classList.remove("min");p.classList.add("max")}else if(dy>30){if(p.classList.contains("max"))p.classList.remove("max");else p.classList.add("min")}sy=null;gripLabel()})}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("on",x==b));["feed","rank","ppl"].forEach(k=>$("tab-"+k).classList.toggle("hide",k!=b.dataset.tab));if(b.dataset.tab=="feed")markSeen()});
document.querySelectorAll("[data-ff]").forEach(b=>b.onclick=()=>{feedFilter=b.dataset.ff;document.querySelectorAll("[data-ff]").forEach(x=>x.classList.toggle("on",x==b));renderFeed()});
// 看過動態就清掉未讀（記在這台手機）
function markSeen(){const ev=(S&&S.events)||[];if(!ev.length)return;feedSeen=Math.max(feedSeen,...ev.map(e=>e.id));try{localStorage.setItem("town-seen-"+TID,feedSeen)}catch(e){}$("feedBadge").classList.add("hide")}
try{feedSeen=+localStorage.getItem("town-seen-"+TID)||0}catch(e){}
new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)&&!$("tab-feed").classList.contains("hide")&&S)setTimeout(markSeen,1500)}).observe($("feed"));
// 側邊選單
const closeMenu=()=>document.body.classList.remove("menu-open");
$("menuBtn").onclick=()=>{const r=R[me];if(r){$("bagN").textContent=bagCount(r)?" "+bagCount(r):"";miniPerson($("meCv"),r.look);$("meName").textContent=r.name;$("meSub").textContent=`${S.town.name} · €${r.money} · ${career(r).name}${r.mayor?" · 鎮長":""}`}document.body.classList.add("menu-open")};
$("menuBack").onclick=closeMenu;$("menuClose").onclick=closeMenu;
document.querySelectorAll("[data-go-tab]").forEach(b=>b.onclick=()=>{const t=b.dataset.goTab;document.querySelector(`[data-tab=${t}]`).click();if(isMob())document.body.classList.add("social");else $("social").scrollIntoView({behavior:"smooth"})});
$("feedBtn").onclick=()=>{document.body.classList.add("social");markSeen()};$("socialClose").onclick=()=>document.body.classList.remove("social");$("menu").addEventListener("click",e=>{if(e.target.closest("button"))closeMenu()});
$("life").onclick=lifeModal;$("bagBtn").onclick=()=>{closeMenu();bagModal()};
$("relook").onclick=()=>{let look=normLook(R[me].look);$("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>換造型</h2><div id="lk2"></div><div class="row"><button id="mc">取消</button><button class="pri" id="ms">儲存</button></div>`;
 lookPicker($("lk2"),look,l=>look=l,R[me].items||{});$("mc").onclick=()=>$("modal").classList.add("hide");$("ms").onclick=async()=>{try{await rpc("town_login",{rid:me,pin,new_look:look});mapKey="";await refresh();$("modal").classList.add("hide");toast("換好了")}catch(e){toast(e.message)}}};
$("report").onclick=report;
// 切到背景或關掉頁面：走到一半的路直接算到達，回來時人已經在目的地
const flush=()=>{const w=me&&walkers[me];if(w&&w.dest&&w.path.length){const [gx,gy]=w.goal;w.x=gx;w.y=gy;w.path=[];arrived(w)}};
document.addEventListener("visibilitychange",()=>{if(document.visibilityState=="hidden")flush();else if(S)refresh().catch(()=>{})});addEventListener("pagehide",flush);

// ── 今日日報：做成一張圖，長按儲存或下載後貼到 WeChat ──
function report(){const c=document.createElement("canvas");c.width=1080;c.height=1350;const m=c.getContext("2d"),day=new Date(now()+8*36e5).toISOString().slice(0,10);
 m.fillStyle="#fbf5e9";m.fillRect(0,0,1080,1350);m.fillStyle="#f6a5c0";m.fillRect(0,0,1080,200);m.fillStyle="#5a2338";m.textAlign="center";m.font="700 64px sans-serif";
 const tn=S.town.name.length>10?S.town.name.slice(0,10)+"…":S.town.name;m.fillText(`🐷 ${tn}日報`,540,110);m.font="500 34px sans-serif";m.fillText(day.replace(/-/g," / "),540,165);
 const today=(S.events||[]).filter(e=>new Date(Date.parse(e.at)+8*36e5).toISOString().slice(0,10)==day).reverse();
 m.textAlign="left";m.fillStyle="#3a2a20";m.font="700 40px sans-serif";m.fillText("今日大事",70,280);m.font="400 34px sans-serif";
 const lines=today.length?today.slice(-10).map(e=>{const d=new Date(Date.parse(e.at)+8*36e5);return `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}　${e.msg}`}):["今天小鎮很平靜，大家都在家耍廢。"];
 lines.forEach((t,i)=>{m.fillStyle=i%2?"#3a2a20":"#6b4a35";m.fillText(t.length>26?t.slice(0,26)+"…":t,70,345+i*52)});
 const rs=Object.values(R).sort((a,b)=>a.slot-b.slot).slice(0,7).map(r=>tickLocal(r,now())),y0=880;m.fillStyle="#3a2a20";m.font="700 40px sans-serif";m.fillText("鎮民現況",70,y0);m.font="400 32px sans-serif";
 rs.forEach((r,i)=>{const y=y0+60+i*56,worst=NEEDS.slice().sort((a,b)=>r[a]-r[b])[0],[ic,nm]=NEED_INFO[worst];
  m.fillStyle="#3a2a20";m.fillText(`${r.name}　在${placeName(r.place)}${r.sleeping?"睡覺":""}`,70,y);m.fillStyle=r[worst]<25?"#c0392b":"#6b4a35";m.fillText(`${ic} ${nm}最低 ${Math.round(r[worst])}`,700,y)});
 m.fillStyle="#9a7a60";m.font="400 26px sans-serif";m.textAlign="center";m.fillText(`🐷 小豬鎮`,540,1310);
 const url=c.toDataURL("image/png");$("modal").classList.remove("hide");
 $("mbody").innerHTML=`<h2>今日日報</h2><img src="${url}" alt="今日日報" style="width:100%;border-radius:8px"><p class="mut">手機：長按圖片儲存，再傳到 WeChat 群組。</p><div class="row"><button id="mc">關閉</button><button id="mcp">複製圖片</button><button class="pri" id="mdl">下載</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");$("mdl").onclick=()=>{const a=document.createElement("a");a.href=url;a.download=`小豬鎮日報-${day}.png`;a.click()};
 $("mcp").onclick=()=>c.toBlob(async b=>{try{await navigator.clipboard.write([new ClipboardItem({"image/png":b})]);toast("已複製，可以貼到 WeChat")}catch(e){toast("這個瀏覽器不能複製圖片，請長按圖片儲存")}})}

// ── 加到主畫面：Android 直接安裝；iPhone 要用 Safari 的分享選單；WeChat 要先用瀏覽器打開 ──
const standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone;let installEvt=null;
addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvt=e});
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
function installHelp(){if(installEvt){installEvt.prompt();installEvt.userChoice.then(c=>{if(c.outcome=="accepted")toast("裝好了，從主畫面打開小豬鎮吧");installEvt=null});return}
 const ua=navigator.userAgent,wx=/MicroMessenger/i.test(ua),ios=/iPhone|iPad|iPod/i.test(ua);$("modal").classList.remove("hide");
 $("mbody").innerHTML=`<h2>📲 加到主畫面</h2>${wx?`<p>在 WeChat 裡不能直接安裝：</p><ol><li>點右上角「⋯」</li><li>選「在瀏覽器打開」${ios?"（Safari）":"（Chrome）"}</li><li>再按一次「📲 加到主畫面」</li></ol>`
  :ios?`<ol><li>用 <b>Safari</b> 打開這個網址</li><li>點下方的分享按鈕 <b>⬆️</b></li><li>往下滑，選「<b>加入主畫面</b>」</li><li>按「新增」</li></ol>`
  :`<ol><li>點瀏覽器右上角「⋮」</li><li>選「<b>安裝應用程式</b>」或「<b>加到主畫面</b>」</li></ol>`}
  <p class="mut">裝好後主畫面會有小豬圖示，打開就直接進你的小鎮，畫面沒有網址列，像一般 App。</p><div class="row"><button id="mc">知道了</button></div>`;$("mc").onclick=()=>$("modal").classList.add("hide")}
if(!standalone){$("install").classList.remove("hide");$("install").onclick=installHelp}

// ── 手機通知：有人對你做了什麼、需求快見底時通知（iPhone 要先加到主畫面，iOS 16.4 以上）──
const PUSH="https://gerqdagicybtyilihvvm.supabase.co/functions/v1/town-push";
const pushOK=()=>"serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window;
const b64=s=>{const p="=".repeat((4-s.length%4)%4),raw=atob((s+p).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))};
async function pushState(){if(!pushOK())return null;const reg=await navigator.serviceWorker.ready;return reg.pushManager.getSubscription()}
async function refreshBell(){const s=await pushState().catch(()=>null);$("bell").textContent=s&&Notification.permission=="granted"?"🔔 通知開著":"🔕 開啟通知"}
async function bell(){const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent);
 if(!pushOK()){toast(ios&&!standalone?"iPhone 要先「加到主畫面」，從主畫面打開才能收通知":"這個瀏覽器不支援通知");if(ios&&!standalone)installHelp();return}
 const cur=await pushState();
 if(cur&&Notification.permission=="granted"){if(!confirm("要關掉這支手機的通知嗎？"))return;
  try{await rpc("town_push_sub",{rid:me,pin,endpoint:cur.endpoint,turn_on:false});await cur.unsubscribe();toast("已關掉通知")}catch(e){toast(e.message)}refreshBell();return}
 const perm=await Notification.requestPermission();if(perm!="granted"){toast("沒有允許通知。要開的話，到手機設定裡允許這個網站通知");return}
 await subscribe(cur,false)}
async function subscribe(cur,quiet){
 try{const k=await fetch(PUSH,{headers:{apikey:SBK}}).then(r=>{if(!r.ok)throw new Error("通知服務還沒準備好，請稍後再試");return r.json()});
  const reg=await navigator.serviceWorker.ready,sub=cur||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(k.key)}),j=sub.toJSON();
  await rpc("town_push_sub",{rid:me,pin,endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth,turn_on:true});
  if(!quiet)toast("通知開好了：有人對你做了什麼、或你快撐不住時會通知你");}catch(e){if(!quiet)toast(e.message||"開啟通知失敗")}refreshBell()}
// 進小鎮時：之前允許過就自動開；還沒問過就主動問一次（瀏覽器規定一定要本人按允許）
async function autoPush(){if(!pushOK()||!me)return;const cur=await pushState().catch(()=>null);
 if(Notification.permission=="granted"){await subscribe(cur,true);return}
 let asked=null;try{asked=localStorage.getItem("town-push-asked")}catch(e){}
 if(Notification.permission!="default"||asked)return;try{localStorage.setItem("town-push-asked","1")}catch(e){}
 setTimeout(()=>{if(!$("modal").classList.contains("hide"))return;$("modal").classList.remove("hide");
  $("mbody").innerHTML=`<h2>🔔 開啟通知？</h2><p>有人來你家煮飯、留言、送禮、丟雞蛋或扁你，或是你快餓昏、快憋不住時，手機會通知你。</p><p class="mut">晚上 11 點到早上 8 點不吵你。之後可以隨時按「🔔 通知開著」關掉。</p><div class="row"><button id="mc">之後再說</button><button class="pri" id="ms">開啟通知</button></div>`;
  $("mc").onclick=()=>$("modal").classList.add("hide");$("ms").onclick=async()=>{$("modal").classList.add("hide");await bell()}},2500)}
$("bell").onclick=bell;

// ── 開始：沒有代碼就是首頁；有代碼就讀小鎮，這台手機住過就自動登入；每 15 秒同步一次 ──
(async()=>{if(!TID){const l=mine();if(standalone&&l.length==1){go(l[0].tid);return}landing();return}
 try{await refresh()}catch(e){$("lg").innerHTML=`<p class="err">${esc(e.message)}</p><div class="row" style="justify-content:flex-start"><button id="home3">← 小豬鎮首頁</button></div>`;$("home3").onclick=()=>go("");return}
 const a=mine().find(x=>x.tid==TID);
 if(a&&R[a.rid]){try{const res=await rpc("town_login",{rid:a.rid,pin:a.pin});me=a.rid;pin=a.pin;lastSeen=res.last_seen;await enter()}catch(e){townLogin()}}else townLogin();
 setInterval(()=>{if(document.visibilityState=="visible"&&S)refresh().catch(()=>{})},15000)})();
}
