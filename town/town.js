// 小豬鎮：任何人都能建立自己的小鎮，拿邀請碼的朋友搬進來；需求隨現實時間下降，所有改動都經過 Supabase 的資料庫函式
const SB="https://gerqdagicybtyilihvvm.supabase.co/rest/v1/rpc/",SBK="sb_publishable_bPvbJFXUM_Ax2iPLeTS5zw_foV60x5y";
const rpc=(fn,body={})=>fetch(SB+fn,{method:"POST",keepalive:true,headers:{apikey:SBK,"Content-Type":"application/json"},body:JSON.stringify(body)})
 .then(async r=>{const j=await r.json().catch(()=>null);if(!r.ok)throw new Error((j&&j.message)||"連不上小鎮，等一下再試");if(j&&j.error)throw new Error(j.error);return j});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// ── 地圖：寬 34 格。市中心固定；住宅一排 3 間（5×4 格，門在正下方），住滿就往下多開一條街，最多 4 排 ──
const T=32,COLS=34,MAXROWS=4;let NR=2;
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
 plaza:{r:[12,8,10,7],door:[14,11],name:"廣場"}};
const FOUNTAIN=[16,10,2,3];
// 路上物件：位置要和資料庫 town_obj_near 一致；用法：[名稱, 按鈕, 說明]
const OBJS={vend:{x:19,y:5,name:"自動販賣機",acts:[["投一罐飲料 🥤","€10 · 精力 +12 · 偶爾掉兩罐"]]},trash:{x:8,y:14,name:"垃圾桶",acts:[["撿垃圾 🗑️","心情 +4 · 說不定撿到東西"]]},
 stall:{x:22,y:14,name:"烤地瓜攤",acts:[["買烤地瓜 🍠","€8 · 飽足 +25"]]},well:{place:"plaza",name:"小豬噴水池",acts:[["丟硬幣許願 🪙","€1 · 一成機率願望成真"]]},
 swing:{place:"park",name:"鞦韆",acts:[["盪鞦韆","心情 +12"]]},cat:{place:"park",name:"流浪貓",acts:[["摸摸貓 🐱","心情 +8 · 可能被抓"],["餵貓吃零食","用一包零食 · 心情 +15","feed"]]}};
const objNear=(k,x,y,place)=>{const o=OBJS[k];return o.place?place==o.place:Math.abs(x-o.x)+Math.abs(y-o.y)<=2};
const inRect=(x,y,[rx,ry,rw,rh])=>x>=rx&&x<rx+rw&&y>=ry&&y<ry+rh;
const roadRowsAt=y=>y==6||y==7||y==15||y==16||(y>=22&&(y-22)%7<2&&Math.floor((y-22)/7)+2<NR);
const isRoad=(x,y)=>y<mapRows()&&(roadRowsAt(y)||((x==16||x==17)&&!(y>=8&&y<=14)));
const slotAt=(x,y)=>{for(let s=0;s<NR*3;s++){const [hx,hy]=homeXY(s);if(inRect(x,y,[hx,hy,5,4]))return s}return -1};
function blocked(x,y){if(x<0||y<0||x>=COLS||y>=mapRows())return true;if(inRect(x,y,FOUNTAIN))return true;if(slotAt(x,y)>=0)return true;
 for(const k in PLACES)if(PLACES[k].block&&inRect(x,y,PLACES[k].r))return true;return false}
// 最短路徑（上下左右走），找不到就回傳 null
function bfs(from,to){const key=(x,y)=>y*COLS+x,prev=new Map([[key(...from),null]]),q=[from];
 while(q.length){const [x,y]=q.shift();if(x==to[0]&&y==to[1]){const path=[];let k=key(x,y);while(k!=null){path.unshift([k%COLS,Math.floor(k/COLS)]);k=prev.get(k)}return path}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(!blocked(nx,ny)&&!prev.has(k)){prev.set(k,key(x,y));q.push([nx,ny])}}}
 return null}
// 點到的格子是哪裡：{slot} 房子、{dest} 公共地點或路上
function placeAt(x,y){for(const k in OBJS){const o=OBJS[k];if(o.x!=null&&x==o.x&&y==o.y)return {dest:"street",door:[x,y+(y==5?1:0)],obj:k}}let s=slotAt(x,y);if(s<0)for(let i=0;i<NR*3;i++){const d=door(i);if(d[0]==x&&d[1]==y)s=i}if(s>=0)return {slot:s};
 for(const k in PLACES)if(inRect(x,y,PLACES[k].r))return {dest:k,door:PLACES[k].door};
 if(inRect(x,y,FOUNTAIN))return {dest:"plaza",door:PLACES.plaza.door};
 return blocked(x,y)?null:{dest:"street",door:[x,y]}}

// ── 需求：和資料庫同一套算法，只用來即時顯示（真正的數字以資料庫為準）──
const NEEDS=["hunger","energy","bladder","hygiene","fun"];
const NEED_INFO={hunger:["🍚","飽足"],energy:["⚡","精力"],bladder:["🚽","膀胱"],hygiene:["🛁","清潔"],fun:["🎉","心情"]};
function tickLocal(r,now){const h=Math.min(72,Math.max(0,(now-Date.parse(r.updated_at))/36e5)),o={...r};
 if(o.sleeping){o.energy+=14*h;o.hunger-=1.5*h;o.bladder-=1.5*h;o.hygiene-=.5*h;o.fun-=.3*h}else{o.hunger-=4*h;o.energy-=3*h;o.bladder-=5*h;o.hygiene-=2.5*h;o.fun-=2*h}
 NEEDS.forEach(k=>o[k]=clamp(o[k],0,100));return o}

if(typeof module!=="undefined")module.exports={OBJS,objNear,T,COLS,setRows,mapRows,homeXY,door,visitSpot,PLACES,blocked,bfs,placeAt,slotAt,tickLocal,isRoad};
if(typeof document!=="undefined")addEventListener("DOMContentLoaded",init);

function init(){
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const toast=t=>{const el=$("toast");el.textContent=t;el.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("on"),2600)};
const SKIN=["#f1c9a5","#e0ac7e","#c68a5a","#8d5a3a"],HAIR=["#222222","#5a3a1a","#a0522d","#d9b26a","#c0c0c0","#c0392b"],SHIRT=["#d9534f","#3b7dd8","#b45cc4","#8b5a2b","#2e9e5b","#d8901a","#333a44","#f0f0f0"],STYLE=["短髮","長髮","光頭","帽子"];
const rp=a=>a[Math.floor(Math.random()*a.length)];
const randLook=()=>({skin:rp(SKIN),hair:rp(HAIR),shirt:rp(SHIRT),style:rp(["短髮","長髮","馬尾","捲髮","瀏海"]),eyes:rp(["圓眼","瞇眼","眼鏡"]),top:rp(["T恤","帽T","襯衫"]),pants:rp(["#2b2b3a","#3b5a8a","#6b4a2b"]),bottom:rp(["長褲","短褲","裙子"]),acc:"無"});
const TID=(new URLSearchParams(location.search).get("t")||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8);
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
function landing(){$("title").textContent="🐷 小豬鎮";$("game").classList.add("hide");$("login").classList.remove("hide");const list=mine();
 $("lg").innerHTML=`<p class="mut">和朋友一起住在小鎮裡：照顧自己吃飯睡覺洗澡，也可以去朋友家幫忙或惡作劇。手機打開就能玩。</p>
  ${list.length?`<h2>我住的小鎮</h2><div class="list">${list.map(x=>`<button data-go="${esc(x.tid)}"><b>${esc(x.name||x.tid)}</b><small>${esc(x.me||"")} · 代碼 ${esc(x.tid)}</small></button>`).join("")}</div>`:""}
  ${standalone?"":`<div class="row" style="justify-content:flex-start"><button id="inst2">📲 加到手機主畫面，像 App 一樣打開</button></div>`}
  <h2>加入朋友的小鎮</h2><div class="inline"><input id="code" placeholder="小鎮代碼，例如 ABC234" maxlength="8" autocomplete="off" style="text-transform:uppercase"><button class="pri" id="join">前往</button></div><p class="err" id="jerr"></p>
  <h2>建立自己的小鎮</h2><label>小鎮名稱<input id="tn" maxlength="16" placeholder="例如：我們的小豬鎮"></label><label>你的名字<input id="mn" maxlength="12" placeholder="鎮上大家怎麼叫你"></label>
  <div id="lk"></div><p class="err" id="cerr"></p><div class="row"><button class="pri" id="create">建立小鎮，當鎮長</button></div>`;
 $("lg").querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));if($("inst2"))$("inst2").onclick=installHelp;
 $("join").onclick=()=>{const c=$("code").value.trim().toUpperCase().replace(/[^A-Z0-9]/g,"");if(c.length<4){$("jerr").textContent="代碼是 6 個英文或數字";return}go(c)};
 let look=randLook();lookPicker($("lk"),look,l=>look=l);
 $("create").onclick=async()=>{const tn=$("tn").value.trim(),mn=$("mn").value.trim(),p=newKey();
  if(!tn){$("cerr").textContent="幫小鎮取個名字";return}if(!mn){$("cerr").textContent="填你的名字";return}
  $("create").disabled=true;try{const r=await rpc("town_create",{town_name:tn,my_name:mn,pin:p,look});saveMine({tid:r.town_id,name:tn,rid:r.resident_id,pin:p,me:mn,invite:r.invite});go(r.town_id)}
  catch(e){$("cerr").textContent=e.message;$("create").disabled=false}}}

// ── 鎮內登入：我住在這裡，或用邀請碼搬進來 ──
async function refresh(){const st=await rpc("town_state",{tid:TID});apply(st)}
const seenLuck=new Set();
function apply(st){S=st;if(me)(st.events||[]).filter(e=>e.kind=="luck"&&e.actor==me&&!seenLuck.has(e.id)).forEach(e=>{seenLuck.add(e.id);if(Date.parse(e.at)>Date.parse(st.now)-20e3)toast(e.msg)});offset=Date.parse(st.now)-Date.now();setRows(st.town.rows);R={};
 st.residents.forEach(r=>{R[r.id]=r;const w=walkers[r.id];
  if(!w)walkers[r.id]={x:r.x,y:r.y,path:[],tx:r.x,ty:r.y};else if(r.id!=me&&(Math.abs(w.tx-r.x)>.01||Math.abs(w.ty-r.y)>.01)){const p=bfs([Math.round(w.x),Math.round(w.y)],[Math.round(r.x),Math.round(r.y)]);w.path=p?p.slice(1):[[r.x,r.y]]}
  walkers[r.id].tx=r.x;walkers[r.id].ty=r.y});
 const key=st.town.rows+"|"+st.residents.map(r=>r.id+":"+r.slot+":"+r.name+":"+JSON.stringify([(r.items||{}).roof,(r.items||{}).wall,(r.items||{}).d])).join(",");if(key!=mapKey){mapKey=key;maps={}}
 $("title").textContent="🐷 "+st.town.name;if(me&&!R[me]){toast("你已經搬離這個小鎮");dropMine(TID);setTimeout(()=>go(""),1200)}
 renderFeed();renderPanel();renderNeeds();if(me)renderStrip()}
let mapKey="";
function townLogin(){$("login").classList.remove("hide");$("game").classList.add("hide");const res=Object.values(R),full=res.length>=12;
 $("lg").innerHTML=`<p class="mut">小鎮代碼 <b>${esc(TID)}</b> · 住了 ${res.length} 人</p>
  ${res.length?`<h2>我住在這裡</h2><div class="who">${res.map(r=>`<button data-id="${r.id}"><canvas width="40" height="44" data-look='${esc(JSON.stringify(r.look||{}))}'></canvas><b>${esc(r.name)}</b><small>${r.mayor?"鎮長":houseName(r.slot)}</small></button>`).join("")}</div>`:""}
  ${full?`<p class="mut">小鎮已經住滿 12 人了。</p>`:`<h2>我要搬進來</h2><div class="row" style="justify-content:flex-start"><button class="pri" id="mv">用邀請碼搬進來</button></div>`}
  <div class="row" style="justify-content:flex-start"><button id="home2">← 小豬鎮首頁</button></div>`;
 $("lg").querySelectorAll("canvas").forEach(c=>{const l=JSON.parse(c.dataset.look);miniPerson(c,l.skin?l:{skin:SKIN[0],hair:"#999",shirt:"#bbb",style:"短髮"})});
 $("lg").querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>pinStep(+b.dataset.id));
 if($("mv"))$("mv").onclick=()=>joinStep();$("home2").onclick=()=>go("")}
function pinStep(id){const r=R[id];$("lg").innerHTML=`<p><b>${esc(r.name)}</b>，歡迎回來</p><p class="mut">在新的手機或電腦上，輸入一次小鎮的邀請碼就好，之後這台裝置會一直記得你。</p>
  <label>邀請碼（WeChat 群組裡的邀請訊息有，或問鎮長）<input id="inv" maxlength="8" autocomplete="off" style="text-transform:uppercase"></label><p class="err" id="lerr"></p>
  <div class="row"><button id="back">← 換人</button><button class="pri" id="go">進入小鎮</button></div>`;
 $("back").onclick=townLogin;$("inv").focus();
 $("go").onclick=async()=>{const inv=$("inv").value.trim().toUpperCase();if(!inv){$("lerr").textContent="填小鎮的邀請碼";return}$("go").disabled=true;
  try{const k=newKey();await rpc("town_device",{tid:TID,invite:inv,rid:id,key:k});const res=await rpc("town_login",{rid:id,pin:k});me=id;pin=k;lastSeen=res.last_seen;saveMine({tid:TID,name:S.town.name,rid:id,pin:k,me:r.name});await enter()}catch(e){$("lerr").textContent=e.message;$("go").disabled=false}}}
function joinStep(){const free=[];for(let s=0;s<12;s++)if(!bySlot(s))free.push(s);const show=free.filter(s=>Math.floor(s/3)<NR);if(!show.length&&free.length)show.push(free[0]);let slot=show[0],look=randLook();
 $("lg").innerHTML=`<p><b>搬進${esc(S.town.name)}</b></p><label>邀請碼（問鎮長）<input id="inv" maxlength="8" autocomplete="off" style="text-transform:uppercase"></label>
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
 style:[["短髮"],["長髮"],["光頭"],["馬尾"],["捲髮"],["包頭"],["瀏海"],["twintail","雙馬尾",100],["mohawk","刺蝟頭",100]],
 eyes:[["圓眼"],["瞇眼"],["眼鏡"],["墨鏡"]],
 top:[["T恤"],["帽T"],["襯衫"],["suit","西裝",250],["jersey","球衣",150],["dress","洋裝",150],["couple","情侶 T",0,"有好麻吉就解鎖"]],
 bottom:[["長褲"],["短褲"],["裙子"]],
 acc:[["無"],["棒球帽"],["毛帽"],["crown","皇冠",300],["pigears","小豬耳朵",80],["headphones","耳機",120],["scarf","圍巾",60],["bandage","繃帶頭",0,"被扁 10 次解鎖"]]};
const DECO=[["flowers","花圃",40],["mailbox","信箱",30],["lamp","路燈",60],["bench","長椅",80],["tree","小樹",50],["pigstatue","小豬雕像",200]];
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
async function enter(){$("menuBtn").classList.remove("hide");await refresh();refreshBell().catch(()=>{});autoPush().catch(()=>{});$("login").classList.add("hide");$("game").classList.remove("hide");camFree=false;
 const w=walkers[me];cam.x=w.x*T;cam.y=w.y*T;resize();$("mayor").classList.toggle("hide",!R[me].mayor);
 const ent=mine().find(x=>x.tid==TID);if(ent&&ent.invite){shareModal(ent.invite,true);delete ent.invite;saveMine(ent);return}
 const mineEv=(S.events||[]).filter(e=>e.target==me&&(!lastSeen||e.at>lastSeen));
 if(mineEv.length){const who=[...new Set(thankable().map(e=>e.actor))];$("away").classList.remove("hide");
  $("away").innerHTML=`<b>你不在的時候</b>${mineEv.slice(0,6).map(e=>`<p>${esc(e.msg)}</p>`).join("")}<div class="row" style="justify-content:flex-start">${who.map(id=>`<button class="pri" data-t="${id}">💗 謝謝 ${esc(R[id].name)}</button>`).join("")}<button id="awayok">知道了</button></div>`;
  $("away").querySelectorAll("[data-t]").forEach(b=>b.onclick=async()=>{b.disabled=true;await act("thank",{target:+b.dataset.t});b.textContent="已道謝"});$("awayok").onclick=()=>$("away").classList.add("hide")}
 else $("away").classList.add("hide")}

// ── 邀請朋友 ──
const townURL=()=>location.origin+location.pathname+"?t="+TID;
function shareModal(inv,fresh){const text=`來「${S.town.name}」當鄰居！🐷\n${townURL()}\n邀請碼：${inv}`;$("modal").classList.remove("hide");
 $("mbody").innerHTML=`<h2>${fresh?"小鎮建好了！":"邀請朋友"}</h2><p>把這段訊息傳到 WeChat 群組，朋友點網址、輸入邀請碼就能搬進來：</p><textarea id="shtxt" rows="4" readonly>${esc(text)}</textarea>
  <p class="mut">邀請碼只給想邀請的人。鎮長可以隨時在「🏛️ 鎮長」換一組新的。</p><div class="row"><button id="mc">關閉</button><button class="pri" id="mcp">複製訊息</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");$("mcp").onclick=async()=>{try{await navigator.clipboard.writeText(text);toast("已複製，貼到 WeChat 吧")}catch(e){$("shtxt").select();toast("請長按文字複製")}}}
async function mayorPanel(){let inv="";try{inv=(await rpc("town_mayor",{rid:me,pin,act:"invite"})).invite}catch(e){toast(e.message);return}
 const draw=()=>{$("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>🏛️ 鎮長</h2><p>邀請碼：<b class="code">${esc(inv)}</b></p>
  <div class="row" style="justify-content:flex-start"><button class="pri" id="msh">邀請朋友</button><button id="mni">換一組新邀請碼</button></div>
  <h2 style="margin-top:16px">鎮民（${Object.keys(R).length}/12）</h2><div class="list">${Object.values(R).sort((a,b)=>a.slot-b.slot).map(r=>`<div class="mrow"><span><b>${esc(r.name)}</b> <small class="mut">${houseName(r.slot)}${r.mayor?" · 鎮長":""}</small></span>${r.id==me?"":`<button data-k="${r.id}">請他搬走</button>`}</div>`).join("")}</div>
  <div class="row"><button id="mc">關閉</button></div>`;
  $("mc").onclick=()=>$("modal").classList.add("hide");$("msh").onclick=()=>shareModal(inv);
  $("mni").onclick=async()=>{if(!confirm("換新邀請碼後，舊的就不能用了。確定嗎？"))return;try{inv=(await rpc("town_mayor",{rid:me,pin,act:"newinvite"})).invite;toast("換好了");draw()}catch(e){toast(e.message)}};
  $("mbody").querySelectorAll("[data-k]").forEach(b=>b.onclick=async()=>{const r=R[b.dataset.k];if(!confirm(`確定請 ${r.name} 搬離小鎮？他的資料會被刪除，不能復原。`))return;
   try{await rpc("town_mayor",{rid:me,pin,act:"kick",target:r.id});await refresh();toast(`${r.name} 搬走了`);draw()}catch(e){toast(e.message)}})};draw()}

// ── 動作 ──
const floaters=[];
async function act(a,extra={}){if(busy)return;busy=true;renderPanel();const b0=tickLocal(R[me],now());try{const st=await rpc("town_act",{rid:me,pin,act:a,...extra});apply(st);
  const b1=tickLocal(R[me],now()),ic={hunger:"🍚",energy:"⚡",bladder:"🚽",hygiene:"🛁",fun:"🎉",money:"€"};let k=0;
  for(const f of ["money",...NEEDS]){const d=Math.round(b1[f]-b0[f]);if(Math.abs(d)>=1&&a!="move")floaters.push({t:f=="money"?`${d>0?"+":"−"}€${Math.abs(d)}`:`${ic[f]} ${d>0?"+":""}${d}`,good:d>0,born:performance.now()+k++*180})}}
 catch(e){toast(e.message)}busy=false;renderPanel()}
function walkTo(dest,d){const w=walkers[me],p=bfs([Math.round(w.x),Math.round(w.y)],d);if(!p){toast("走不到那裡");return}
 w.path=p.slice(1);w.dest=dest;w.goal=d;camFree=false;if(!w.path.length)arrived(w);renderPanel()}
function arrived(w){const d=w.dest;w.dest=null;act("move",{px:w.goal[0],py:w.goal[1],dest:d})}
const goHouse=s=>{const o=bySlot(s);if(!o){toast(`${houseName(s)}是空屋，邀請朋友搬進來吧`);return}walkTo("home:"+o.id,o.id==me?door(s):visitSpot(s))};

// ── 下方面板：依所在地點顯示可以做的事 ──
const btn=(label,sub,fn,g)=>({label,sub,fn,g});
const GROUP={self:"照顧自己",friend:"在他家",place:"在這裡",face:"面對面",online:"線上 · 在哪都能做",move:"移動"};let lastPanel="",panelFns=[];
function renderPanel(){if(!S||!me||!R[me])return;const r=tickLocal(R[me],now()),p=r.place,list=[];let title="",note="";
 if(walkers[me]&&walkers[me].path.length){title="走路中…";note="到了就可以做事"}
 else if(r.sleeping){title=`在${placeName(p)}睡覺 💤`;list.push(btn("起床","",()=>act("wake")))}
 else if(p=="home:"+me){title="你家";list.push(btn("吃飯","飽足 +40 · €10",()=>act("eat")),btn("上廁所","膀胱回滿",()=>act("toilet")),btn("洗澡","清潔回滿",()=>act("shower")),btn("看電視","心情 +25",()=>act("tv")),btn("睡覺","精力慢慢回來",()=>act("sleep")),btn("🎨 裝潢","換屋頂、牆壁顏色",()=>paintModal()))}
 else if(p&&p.startsWith("home:")&&R[p.slice(5)]){const id=+p.slice(5),t=tickLocal(R[id],now());title=`${t.name} 家`;
  const gifts=(r.items||{}).gift||0,giftB=gifts?btn("送禮物",`他心情 +20 · 背包 🎁${gifts}`,()=>act("gift",{target:id})):btn("送禮物","先去超市買",()=>toast("背包沒有禮物，去超市買一份"));
  if(t.place!=p){note=`${t.name} 不在家，在${placeName(t.place)}。可以在門口留言或放禮物，他回來會看到 · ${bondLabel(bondWith(id))}`;list.push(giftB,btn("丟雞蛋 🥚","好感 −2",()=>act("egg",{target:id})),btn(`📱 傳訊息給他`,"在哪都能傳",()=>noteModal(id)))}
  else{note=`${t.name}${t.sleeping?" 在睡覺":""}：飽足 ${Math.round(t.hunger)}、清潔 ${Math.round(t.hygiene)}、心情 ${Math.round(t.fun)} · ${bondLabel(bondWith(id))}`;list.push(giftB);
   list.push(btn("煮飯給他","他飽足 +35 · €10",()=>act("feed",{target:id})),btn("幫他洗澡","他清潔 +45",()=>act("wash",{target:id})));
   if(t.sleeping)list.push(btn("叫醒他","",()=>act("wakeup",{target:id})));
   if(!t.sleeping)list.push(btn("串門子","兩人心情 +15",()=>act("visit",{target:id})));list.push(btn("惡作劇","放個臭屁 💨 · 好感 −3",()=>act("prank",{target:id})),btn("丟雞蛋 🥚","好感 −2",()=>act("egg",{target:id})));
   if(!t.sleeping)list.push(...faceActs(id))}}
 else if(p=="restaurant"){title="餐廳";list.push(btn("吃一頓","飽足 +55 · 心情 +10 · €30",()=>act("dine")));note="朋友也在的話，點他可以請吃大餐"}
 else if(p=="office"){title="公司";list.push(btn("打工","+€120 · 累",()=>act("work")));note="有同事在的話，點他可以一起加班，薪水加倍"}
 else if(p=="park"||p=="plaza"){title=placeName(p);list.push(btn("玩一下","心情 +20",()=>act("play")))}
 else if(p=="market"){title="超市";list.push(btn("買禮物 🎁","€20 · 送朋友心情 +20",()=>act("buy",{item:"gift"})),btn("買零食 🍪","€15 · 隨時吃，飽足 +20",()=>act("buy",{item:"snack"})),btn("🛍️ 造型與擺飾","新衣服、家門口擺飾",()=>shopModal()),btn("逛逛","心情 +6",()=>act("browse")))}
 else{title="路上";note="點地圖上的房子或地點，就會走過去"}
 // 公共場所遇到人：可以擊掌；一起吃飯、玩、加班時在場的人心情都會變好
 if(!r.sleeping&&["plaza","restaurant","market","park","office"].includes(p)&&!(walkers[me]&&walkers[me].path.length)){const here=Object.values(R).filter(o=>o.id!=me&&o.place==p&&!o.sleeping);
  if(here.length&&!(sel&&R[sel]))note=(note?note+" · ":"")+`${here.map(o=>o.name).join("、")} 也在這裡：一起做事大家心情都 +5，點他可以擊掌或扁他`}
 if(!r.sleeping&&!(walkers[me]&&walkers[me].path.length))for(const k in OBJS)if(objNear(k,walkers[me].x,walkers[me].y,p))for(const [l,sub,v] of OBJS[k].acts)list.push(btn(l,`${OBJS[k].name} · ${sub}`,()=>act("obj",{item:k,note:v||null}),"place"));
 if(!r.sleeping&&(r.items||{}).snack&&!(walkers[me]&&walkers[me].path.length))list.push(btn("吃零食 🍪",`飽足 +20 · 還有 ${(r.items||{}).snack} 包`,()=>act("snack"),"self"));
 if(sel&&R[sel]&&sel!=me){const t=tickLocal(R[sel],now());note=`${t.name}：在${placeName(t.place)}${t.sleeping?"睡覺":""} · 飽足 ${Math.round(t.hunger)} · 清潔 ${Math.round(t.hygiene)} · 心情 ${Math.round(t.fun)} · ${bondLabel(bondWith(t.id))}`;
  const face=isNear(t.id)&&!t.sleeping&&!r.sleeping;title=`和 ${t.name} 互動`;
  list.length=0;if(face)list.push(...faceActs(t.id));list.push(...onlineActs(t.id));
  if(!face)list.push(btn(`走到 ${t.name} 旁邊`,`他在${placeName(t.place)} · 面對面才能擊掌、扁他`,()=>walkToPerson(t.id)));
  list.push(btn(`去 ${t.name} 家`,"煮飯、洗澡、串門子要到他家",()=>{sel=null;goHouse(t.slot)}),btn("取消","",()=>{sel=null;lastPanel="";renderPanel()}))}
 $("here").textContent=title;$("note").textContent=note;
 // 內容沒變就不重畫，避免按到一半按鈕被換掉
 const dg=p=="home:"+me?"self":p&&p.startsWith("home:")?"friend":"place";list.forEach(b=>{if(!b.g)b.g=/^(走|去 |取消)/.test(b.label)?"move":dg});
 const order=[...new Set(list.map(b=>b.g))],multi=order.length>1;
 const html=order.map(g=>(multi?`<div class="grp">${GROUP[g]}</div>`:"")+list.map((b,i)=>b.g!=g?"":`<button data-i="${i}" ${busy?"disabled":""}><b>${b.label}</b>${b.sub?`<small>${b.sub}</small>`:""}</button>`).join("")).join("");
 panelFns=list;if(html!=lastPanel){lastPanel=html;$("acts").innerHTML=html;$("acts").querySelectorAll("button").forEach(b=>b.onclick=()=>panelFns[b.dataset.i].fn())}}
function renderNeeds(){if(!S||!me||!R[me])return;const r=tickLocal(R[me],now());
 $("needs").innerHTML=NEEDS.map(k=>{const v=Math.round(r[k]),[ic,nm]=NEED_INFO[k];return `<div class="need${v<20?" low":""}" title="${nm} ${v}"><span>${ic}</span><i><b style="width:${v}%;background:${v<20?"var(--bad)":v<50?"var(--warn)":"var(--good)"}"></b></i><small><em>${nm} </em>${v}</small></div>`}).join("")+`<div class="need money"><span>💰</span><small>€${r.money}${(r.items||{}).gift?` · 🎁${r.items.gift}`:""}${(r.items||{}).snack?` · 🍪${r.items.snack}`:""}</small></div>`}
// 每週排行（最近 7 天）
function renderRank(){const w=(S&&S.week)||{},med=["🥇","🥈","🥉"],cat=[["work","💼 最勤勞","次打工"],["popular","💗 最受歡迎","次被照顧"],["kind","🤲 最愛照顧人","次照顧別人"],["punched","🤕 最欠扁","次被欺負"]];
 $("tab-rank").innerHTML=`<p class="mut">最近 7 天</p>`+cat.map(([k,t,u])=>`<div class="rank"><b>${t}</b>${(w[k]||[]).length?(w[k]).map((x,i)=>`<p>${med[i]} ${esc((R[x.id]||{}).name||"搬走的鄰居")} <small class="mut">${x.n} ${u}</small></p>`).join(""):`<p class="mut">還沒有人上榜</p>`}</div>`).join("")}
function renderPeople(){const list=Object.values(R).filter(o=>o.id!=me).map(o=>({o,v:bondWith(o.id)})).sort((a,b)=>b.v-a.v);
 $("tab-ppl").innerHTML=(list.length?list.map(({o,v})=>`<div class="mrow"><span><b>${esc(o.name)}</b> <small class="mut">${bondLabel(v)} · ${v>0?"+":""}${v}</small><i class="bond"><b style="left:50%;width:${Math.abs(v)/2}%;${v<0?`left:${50-Math.abs(v)/2}%;background:var(--bad)`:"background:var(--good)"}"></b></i><small class="mut">${tierHint(v)} · 在${placeName(o.place)}</small></span><button data-w="${o.id}">互動</button></div>`).join(""):`<p class="mut">鎮上還沒有其他人，邀請朋友搬進來吧。</p>`)
  +`<p class="mut" style="margin-top:10px">送禮 +5、煮飯洗澡 +4、請吃大餐 +4、串門子一起加班 +3、道謝擊掌 +2、留言 +1；叫醒 −1、丟雞蛋 −2、惡作劇 −3、扁人 −6、和好 +8。好麻吉以上照顧對方效果 ×1.3。</p>`;
 $("tab-ppl").querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{sel=+b.dataset.w;lastPanel="";renderPanel();$("here").scrollIntoView({behavior:"smooth",block:"center"})})}
// 動態：每種事一個圖示，名字粗體，分今天／昨天，跟我有關的用左邊色條標出來
const KIND_ICON={feed:"🍚",wash:"🛁",visit:"🏠",note:"📱",call:"📞",delivery:"🛵",gift:"🎁",thank:"💗",greet:"🙌",fight:"👊",egg:"🥚",prank:"💨",makeup:"🤝",wakeup:"⏰",cowork:"💼",feast:"🍖",tier:"💞",look:"✨",join:"🏡",found:"🏛️",expand:"🛣️",leave:"📦",meet:"👋",together:"🎉",accident:"💦",passout:"😵",luck:"🍀"};
const GOOD=["feed","wash","visit","note","call","delivery","gift","thank","greet","makeup","cowork","feast"],BADK=["fight","egg","prank","wakeup"];
let feedFilter="all",feedSeen=0;
function renderFeed(){renderRank();renderPeople();const all=((S&&S.events)||[]).slice().sort((a,b)=>b.at.localeCompare(a.at)||b.id-a.id);
 const day=a=>new Date(Date.parse(a)+8*36e5).toISOString().slice(0,10),today=day(new Date(now()).toISOString()),yest=day(new Date(now()-864e5).toISOString());
 const hm=a=>{const d=new Date(Date.parse(a)+8*36e5);return `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`};
 const names=Object.values(R).map(r=>r.name).sort((a,b)=>b.length-a.length);
 const bold=t=>{let h=esc(t);for(const n of names){const e=esc(n);h=h.split(e).join(`<b>${e}</b>`)}return h};
 const ev=all.filter(e=>feedFilter=="all"||(feedFilter=="me"&&(e.target==me||e.actor==me))||(feedFilter=="good"&&GOOD.includes(e.kind))||(feedFilter=="bad"&&BADK.includes(e.kind)));
 const ok=new Set(me?thankable().map(e=>e.id):[]),bad=new Set(me?grudges().map(e=>e.id):[]),shown=new Set();let lastDay="";
 // 未讀：別人對我做的、我還沒看過的
 const unread=all.filter(e=>e.target==me&&e.actor!=me&&e.id>feedSeen).length;$("feedBadge").textContent=unread?unread:"";$("feedBadge").classList.toggle("hide",!unread||!$("tab-feed").classList.contains("hide"));
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
 if(mp=="office"&&t.place=="office")coop.push(btn(`和 ${t.name} 一起加班 💼`,"兩人各 +€200 · 4 小時一次",()=>act("cowork",{target:id})));
 if(mp=="restaurant"&&t.place=="restaurant")coop.push(btn(`請 ${t.name} 吃大餐 🍖`,"€60 · 兩人飽足 +70",()=>act("feast",{target:id})));
 const out=[...coop,btn(`和 ${t.name} 擊掌 🙌`,"兩人心情 +8 · 好感 +2",()=>act("greet",{target:id})),
  btn(`扁 ${t.name} 👊`,b>=30?"好麻吉之間是打打鬧鬧 · 好感 +1":"比精力、心情和運氣 · 好感 −6",()=>act("fight",{target:id}))];
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
 $("mbody").innerHTML=`<h2>👥 人際關係</h2>${list.length?list.map(({o,v})=>`<div class="mrow"><span><b>${esc(o.name)}</b> <small class="mut">${bondLabel(v)} · ${v>0?"+":""}${v}</small><i class="bond"><b style="left:50%;width:${Math.abs(v)/2}%;${v<0?`left:${50-Math.abs(v)/2}%;background:var(--bad)`:"background:var(--good)"}"></b></i><small class="mut">${tierHint(v)}</small></span><button data-w="${o.id}">互動</button></div>`).join(""):`<p class="mut">鎮上還沒有其他人，邀請朋友搬進來吧。</p>`}
  <p class="mut" style="margin-top:10px">送禮 +5、煮飯洗澡 +4、串門子 +3、道謝擊掌 +2、留言 +1；叫醒 −1、丟雞蛋 −2、惡作劇 −3、扁人 −6、和好 +8。好麻吉以上照顧對方效果 ×1.3。</p><div class="row"><button id="mc">關閉</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");$("mbody").querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{$("modal").classList.add("hide");walkToPerson(+b.dataset.w)})}
// 線上互動：用手機就能做，在哪裡都可以
function onlineActs(id){return onlineActs0(id).map(b=>({...b,g:"online"}))}
function onlineActs0(id){const t=R[id],gifts=((R[me].items||{}).gift)||0;return [
  btn(`📱 傳訊息給 ${t.name}`,"在哪都能傳 · 好感 +1",()=>noteModal(id)),
  btn(`📞 打電話給 ${t.name}`,t.sleeping?"他在睡覺，會被你吵醒 · 好感 −1":"兩人心情 +5 · 好感 +1",()=>act("call",{target:id})),
  btn(`🛵 幫 ${t.name} 叫外送`,"€25 · 他飽足 +30 · 好感 +3",()=>act("delivery",{target:id})),
  btn(`📦 寄禮物給 ${t.name}`,gifts?`€5 運費 · 他心情 +20 · 背包 🎁${gifts}`:"先去超市買禮物",()=>gifts?act("gift",{target:id}):toast("背包沒有禮物，去超市買一份"))]}
// 超市：造型與擺飾
function shopModal(){const it=R[me].items||{},w=new Set(it.w||[]),d=new Set(it.d||[]);$("modal").classList.remove("hide");
 const row=(id,name,price,has,kind)=>`<div class="mrow"><span><b>${name}</b> <small class="mut">€${price}</small></span>${has?`<small class="mut">✔ 已擁有</small>`:`<button data-b="${kind}:${id}">買</button>`}</div>`;
 $("mbody").innerHTML=`<h2>🛍️ 造型與擺飾</h2><p class="mut">你有 €${R[me].money}。買了的造型到「👗 換造型」穿；擺飾會自動放在你家門口（最多 4 樣）。</p>
  <h3>造型</h3>${["style","top","acc"].map(k=>WEAR[k].filter(a=>a[2]).map(a=>row(a[0],a[1],a[2],w.has(a[0]),"w")).join("")).join("")}
  <p class="mut">🔒 情侶 T：和人變成好麻吉就能穿。繃帶頭：被扁 10 次就能戴。</p>
  <h3>門口擺飾</h3>${DECO.map(([id,n,pr])=>row(id,n,pr,d.has(id),"d")).join("")}<div class="row"><button id="mc">關閉</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");$("mbody").querySelectorAll("[data-b]").forEach(b=>b.onclick=async()=>{b.disabled=true;await act("buy",{item:b.dataset.b});shopModal()})}
// 在家裝潢：換屋頂、牆壁顏色（€50）
function paintModal(){const it=R[me].items||{};$("modal").classList.remove("hide");
 const pal=(k,arr,cur)=>`<div class="houses">${arr.map(c=>`<button class="sw dot${cur==c?" on":""}" data-p="${k}:${c}" style="background:${c}" aria-label="${k}"></button>`).join("")}</div>`;
 $("mbody").innerHTML=`<h2>🎨 裝潢</h2><p class="mut">換一次 €50，你有 €${R[me].money}。</p><h3>屋頂</h3>${pal("roof",ROOF_C,it.roof||ROOFS[R[me].slot])}<h3>牆壁</h3>${pal("wall",WALL_C,it.wall||"#f4ead6")}
  <h3>門口擺飾</h3><p class="mut">${(it.d||[]).map(x=>(DECO.find(a=>a[0]==x)||[x,x])[1]).join("、")||"還沒有，去超市買"}</p><div class="row"><button id="mc">關閉</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");$("mbody").querySelectorAll("[data-p]").forEach(b=>b.onclick=async()=>{await act("paint",{item:b.dataset.p});paintModal()})}
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
  sign(o?o.name+" 的家":"空屋",X+W/2,Y+T/2+6,o?null:"rgba(90,90,90,.85)");
  ((it.d)||[]).slice(0,4).forEach((d,i)=>deco(m,d,X+[16,48,144,172][i],Y+4*T+18,night))}
 const bld=(k,wall,roof,deco)=>{const [x,y,w,h]=PLACES[k].r,X=x*T,Y=y*T,W=w*T,H=h*T;m.fillStyle="rgba(0,0,0,.18)";m.fillRect(X+8,Y+16,W,H);m.fillStyle=wall;m.fillRect(X,Y+14,W,H-14);m.fillStyle=roof;m.fillRect(X-6,Y,W+12,20);deco(X,Y,W,H)};
 bld("office","#b8c4cf","#5f6b78",(X,Y,W,H)=>{for(let a=0;a<5;a++)for(let b=0;b<3;b++)win(X+16+a*40,Y+36+b*40);m.fillStyle="#555";m.fillRect(X+W/2-14,Y+H-36,28,36)});
 bld("restaurant","#fff3e0","#c0392b",(X,Y,W,H)=>{for(let k=0;k<W;k+=24){m.fillStyle=(k/24)%2?"#fff":"#e74c3c";m.fillRect(X+k,Y+20,24,16)}win(X+20,Y+60);win(X+W-36,Y+60);m.fillStyle="#7a4a24";m.fillRect(X+W/2-12,Y+H-44,24,44)});
 bld("market","#eef7ea","#2e8b57",(X,Y,W,H)=>{m.fillStyle=night?"#ffe9a8":"#cfeefc";m.fillRect(X+14,Y+44,W-28,46);m.fillStyle="#2e8b57";for(let k=X+14;k<X+W-14;k+=28)m.fillRect(k,Y+44,3,46);m.fillStyle="#7a4a24";m.fillRect(X+W/2-14,Y+H-44,28,44)});
 const trees=[];for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++)if(!blocked(i,j)&&!isRoad(i,j)&&!inRect(i,j,PLACES.plaza.r)&&!inRect(i,j,PLACES.park.r)&&grassV[j][i]<.1&&![...Array(NR*3).keys()].some(s=>{const d=door(s);return Math.abs(d[0]-i)<=1&&Math.abs(d[1]-j)<=1}))trees.push([i,j]);
 [[26,18],[28,18],[31,18],[33,18],[27,20],[32,20]].forEach(t=>trees.push(t));
 trees.forEach(([i,j])=>{const x=i*T+16,y=j*T+18;m.fillStyle="rgba(0,0,0,.2)";m.beginPath();m.ellipse(x+4,y+12,14,5,0,0,7);m.fill();m.fillStyle="#6b4423";m.fillRect(x-3,y,6,12);m.fillStyle=night?"#2f6b3a":"#3f9a4c";m.beginPath();m.arc(x,y-4,14,0,7);m.fill();m.fillStyle=night?"#3d7f48":"#5cbf63";m.beginPath();m.arc(x-4,y-9,7,0,7);m.fill()});
 for(let k=0;k<NR;k++){const y=k==0?6:k==1?15:22+7*(k-2);sign(STREETS[k],8*T,y*T+T,"rgba(60,60,60,.8)")}
 {const R0=(x,y,w,h,c)=>{m.fillStyle=c;m.fillRect(x,y,w,h)},o=OBJS;
  let X=o.vend.x*T,Y=o.vend.y*T;R0(X+4,Y-14,24,40,"#c0392b");R0(X+8,Y-10,16,14,night?"#ffe9a8":"#cfeefc");R0(X+8,Y+8,16,4,"#222");R0(X+10,Y+16,12,6,"#7f1d1d");
  X=o.trash.x*T;Y=o.trash.y*T;R0(X+8,Y+4,16,22,"#2e7d32");R0(X+6,Y,20,5,"#1b5e20");
  X=o.stall.x*T;Y=o.stall.y*T;R0(X+2,Y+8,28,16,"#8b5a2b");R0(X,Y-10,32,8,"#e74c3c");R0(X+14,Y-2,4,10,"#5a3a1a");R0(X+6,Y+4,6,4,"#c0602b");R0(X+16,Y+4,6,4,"#c0602b");
  X=29*T;Y=21*T;R0(X,Y-24,4,30,"#6b4423");R0(X+28,Y-24,4,30,"#6b4423");R0(X,Y-26,32,4,"#6b4423");R0(X+10,Y-22,2,18,"#888");R0(X+20,Y-22,2,18,"#888");R0(X+8,Y-4,16,4,"#d8901a")}
 sign("公司",29.5*T,10);sign("餐廳",5*T,9*T+10);sign("超市",28*T,9*T+10);sign("公園",29.5*T,17*T+12);sign("小豬廣場",17*T,8*T+14);
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
function person(x,y,look,tk,moving,label,isMe,state){const u=1.6;
 if(isMe){g.strokeStyle="#ffd23f";g.lineWidth=3;g.beginPath();g.ellipse(x,y+12*u,11*u,4*u,0,0,7);g.stroke()}
 g.fillStyle="rgba(0,0,0,.25)";g.fillRect(x-5*u,y+10*u,10*u,3*u);drawChar(g,x,y,u,look,{...state,moving},tk);
 if(state.sleeping){g.font="bold 16px sans-serif";g.fillStyle="#fff";g.fillText("Zz",x+14*u,y-6*u+Math.sin(tk/20)*3)}
 if(state.stink){g.strokeStyle="#7bd36b";g.lineWidth=2;for(let k=-1;k<=1;k++){g.beginPath();for(let s=0;s<10;s++)g.lineTo(x+k*8*u+Math.sin(tk/6+s)*2,y-16*u-s*2.2);g.stroke()}}
 g.font="600 13px sans-serif";g.textAlign="center";g.textBaseline="middle";const tag=label+(state.bruised?" 🤕":"")+(state.hungry?" 🍚":""),w=g.measureText(tag).width+10,ty=y-32*u;g.fillStyle=isMe?"rgba(160,110,0,.9)":"rgba(0,0,0,.65)";g.fillRect(x-w/2,ty,w,18);g.fillStyle="#fff";g.fillText(tag,x,ty+9);
 // 心情泡泡
 if(state.bubble){g.font="500 12px sans-serif";const bw=g.measureText(state.bubble).width+14,by=ty-26;g.fillStyle="rgba(255,255,255,.95)";g.beginPath();g.roundRect?g.roundRect(x-bw/2,by,bw,22,8):g.rect(x-bw/2,by,bw,22);g.fill();g.beginPath();g.moveTo(x-5,by+22);g.lineTo(x+5,by+22);g.lineTo(x,by+28);g.fill();g.fillStyle="#2c2620";g.fillText(state.bubble,x,by+11)}}
function miniPerson(c,L){const m=c.getContext("2d"),u=c.height/30;m.clearRect(0,0,c.width,c.height);drawChar(m,c.width/2,17.5*u,u,L,{},0)}
let W=0,Hh=0,dpr=1;
function resize(){const box=$("stage");dpr=Math.min(2,devicePixelRatio||1);W=box.clientWidth;Hh=Math.round(Math.min(innerHeight*.58,Math.max(300,W*.8)));cv.width=W*dpr;cv.height=Hh*dpr;cv.style.height=Hh+"px";
 cam.s=zoomFar?Math.min(W/(COLS*T),Hh/(mapRows()*T)):W/((W<600?11:17)*T)}
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
 const mw=walkers[me];if(!camFree){cam.x+=((mw.x+.5)*T-cam.x)*.12;cam.y+=((mw.y+.5)*T-cam.y)*.12}
 const vw=W/cam.s,vh=Hh/cam.s;let ox=clamp(cam.x-vw/2,0,Math.max(0,MW-vw)),oy=clamp(cam.y-vh/2,0,Math.max(0,MH-vh));if(vw>MW)ox=(MW-vw)/2;if(vh>MH)oy=(MH-vh)/2;cam.ox=ox;cam.oy=oy;
 g.setTransform(1,0,0,1,0,0);g.fillStyle="#3d6b35";g.fillRect(0,0,cv.width,cv.height);g.setTransform(dpr*cam.s,0,0,dpr*cam.s,-ox*dpr*cam.s,-oy*dpr*cam.s);g.imageSmoothingEnabled=false;g.drawImage(maps[key],0,0);
 const fx=17*T,fy=11.5*T;g.fillStyle="#9a9a9a";g.beginPath();g.arc(fx,fy,48,0,7);g.fill();g.fillStyle="#4aa3e0";g.beginPath();g.arc(fx,fy,40,0,7);g.fill();g.strokeStyle="#bfe6ff";g.lineWidth=2;g.beginPath();g.arc(fx,fy,18+(tk%50)/2.2,0,7);g.stroke();
 g.fillStyle="#f6a5c0";g.beginPath();g.arc(fx,fy-4,15,0,7);g.fill();g.fillRect(fx-15,fy-21,8,9);g.fillRect(fx+7,fy-21,8,9);g.fillStyle="#ec7fa6";g.fillRect(fx-7,fy-2,14,9);g.fillStyle="#8a3a55";g.fillRect(fx-4,fy+1,3,3);g.fillRect(fx+2,fy+1,3,3);g.fillStyle="#222";g.fillRect(fx-8,fy-11,3,3);g.fillRect(fx+5,fy-11,3,3);
 g.fillStyle="#bfe6ff";g.fillRect(fx-1,fy-26-((tk%30)/30)*16,3,5);
 // 公園的流浪貓：在公園裡慢慢走來走去
 {const cx=(25.5+4*(1+Math.sin(t/7000)))*T,cy=(18.6+.8*Math.sin(t/3100))*T;g.fillStyle="#555";g.fillRect(cx-8,cy-4,16,8);g.fillRect(cx+6,cy-10,8,8);g.fillRect(cx+6,cy-12,2,3);g.fillRect(cx+12,cy-12,2,3);g.fillRect(cx-12,cy-8+Math.sin(t/300)*2,4,8);g.fillStyle="#ffd23f";g.fillRect(cx+8,cy-8,2,2);g.fillRect(cx+11,cy-8,2,2)}
 // 人：依 y 排序，前面的蓋住後面的；在家睡覺的人在屋裡看不到，改在屋頂畫 💤；晚上有人在家的窗戶亮燈
 const list=Object.values(R).map(r=>({id:r.id,w:walkers[r.id],r:tickLocal(r,now())})).filter(o=>!(o.r.sleeping&&o.r.place=="home:"+o.id&&!o.w.path.length)).sort((a,b)=>a.w.y-b.w.y);
 const nowMs=Date.now();for(const o of list){const bb=bubbles[o.id]||(bubbles[o.id]={next:nowMs+2e3+Math.random()*15e3});if(nowMs>bb.next){bb.text=Math.random()<.6?moodLine(o.id,o.r):null;bb.until=nowMs+4500;bb.next=nowMs+18e3+Math.random()*25e3}
  person((o.w.x+.5)*T,(o.w.y+.5)*T,o.r.look,tk,o.w.moving,o.r.name,o.id==me,{sleeping:o.r.sleeping&&!o.w.path.length,stink:o.r.hygiene<25,dirty:o.r.hygiene<25,hungry:o.r.hunger<20,bruised:o.r.bruised,bubble:!o.r.sleeping&&bb.text&&nowMs<bb.until?bb.text:null})}
 for(const r of Object.values(R)){if(r.place!="home:"+r.id)continue;const [hx,hy]=homeXY(r.slot);if(night){g.fillStyle="rgba(255,215,106,.35)";g.fillRect(hx*T+16,hy*T+T+22,24,22);g.fillRect(hx*T+5*T-40,hy*T+T+22,24,22)}
  if(r.sleeping){g.font="bold 18px sans-serif";g.fillStyle="#fff";g.textAlign="center";g.fillText("💤",hx*T+4.2*T,hy*T+T+4+Math.sin(tk/25)*4)}}
 // 飄字：剛做完的動作讓數值變多少
 {const mw2=walkers[me],nowp=performance.now();for(let i=floaters.length-1;i>=0;i--){const f=floaters[i],age=(nowp-f.born)/1400;if(age>1){floaters.splice(i,1);continue}if(age<0)continue;
  g.globalAlpha=1-age;g.font="700 15px sans-serif";g.textAlign="center";g.lineWidth=4;g.strokeStyle="rgba(0,0,0,.6)";const fx2=(mw2.x+.5)*T+(i%2?14:-14),fy2=(mw2.y+.5)*T-70-age*40;g.strokeText(f.t,fx2,fy2);g.fillStyle=f.good?"#7CFC8A":"#ff8a80";g.fillText(f.t,fx2,fy2);g.globalAlpha=1}}
 if(tk%30==0){renderNeeds();if(!walkers[me].path.length)renderPanel()}}
requestAnimationFrame(frame);

// ── 點地圖：拖曳＝移動視角，點一下＝走過去或看那個人 ──
let down=null;
cv.addEventListener("pointerdown",e=>{down={x:e.clientX,y:e.clientY,ox:cam.x,oy:cam.y,moved:false};cv.setPointerCapture(e.pointerId)});
cv.addEventListener("pointermove",e=>{if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.hypot(dx,dy)>8){down.moved=true;camFree=true;cam.x=down.ox-dx/cam.s;cam.y=down.oy-dy/cam.s}});
cv.addEventListener("pointerup",e=>{if(!down)return;const d=down;down=null;if(d.moved||!S)return;const rc=cv.getBoundingClientRect(),wx=(e.clientX-rc.left)/cam.s+cam.ox,wy=(e.clientY-rc.top)/cam.s+cam.oy,tx=Math.floor(wx/T),ty=Math.floor(wy/T);
 const hit=Object.values(R).find(r=>r.id!=me&&Math.hypot((walkers[r.id].x+.5)*T-wx,(walkers[r.id].y+.2)*T-wy)<T*.8);
 if(hit){sel=sel==hit.id?null:hit.id;renderPanel();return}sel=null;
 if(R[me].sleeping){toast("先起床才能出門");return}
 const p=placeAt(tx,ty);if(!p){toast("那裡走不過去");return}if(p.slot!=null){goHouse(p.slot);return}walkTo(p.dest,p.door)});
$("zoom").onclick=()=>{zoomFar=!zoomFar;$("zoom").textContent=zoomFar?"🔍 拉近":"🗺️ 看全鎮";camFree=zoomFar;resize()};
$("home").onclick=()=>{camFree=false};
$("logout").onclick=()=>{if(!confirm("登出後要再輸入一次邀請碼才能進來。確定嗎？"))return;dropMine(TID);me=null;pin=null;townLogin()};
$("towns").onclick=()=>go("");
$("invite").onclick=async()=>{if(R[me].mayor){try{shareModal((await rpc("town_mayor",{rid:me,pin,act:"invite"})).invite)}catch(e){toast(e.message)}}else{const text=`來「${S.town.name}」當鄰居！🐷\n${townURL()}\n（邀請碼請問鎮長）`;try{await navigator.clipboard.writeText(text);toast("已複製網址，邀請碼請鎮長給")}catch(e){toast(townURL())}}};
$("mayor").onclick=mayorPanel;$("grip").onclick=()=>$("panel").classList.toggle("min");
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("on",x==b));["feed","rank","ppl"].forEach(k=>$("tab-"+k).classList.toggle("hide",k!=b.dataset.tab));if(b.dataset.tab=="feed")markSeen()});
document.querySelectorAll("[data-ff]").forEach(b=>b.onclick=()=>{feedFilter=b.dataset.ff;document.querySelectorAll("[data-ff]").forEach(x=>x.classList.toggle("on",x==b));renderFeed()});
// 看過動態就清掉未讀（記在這台手機）
function markSeen(){const ev=(S&&S.events)||[];if(!ev.length)return;feedSeen=Math.max(feedSeen,...ev.map(e=>e.id));try{localStorage.setItem("town-seen-"+TID,feedSeen)}catch(e){}$("feedBadge").classList.add("hide")}
try{feedSeen=+localStorage.getItem("town-seen-"+TID)||0}catch(e){}
new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)&&!$("tab-feed").classList.contains("hide")&&S)setTimeout(markSeen,1500)}).observe($("feed"));
$("menuBtn").onclick=()=>$("menu").classList.toggle("hide");$("menu").addEventListener("click",e=>{if(e.target.closest("button"))$("menu").classList.add("hide")});
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
 m.fillStyle="#9a7a60";m.font="400 26px sans-serif";m.textAlign="center";m.fillText(`小豬鎮 · 代碼 ${TID}`,540,1310);
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
