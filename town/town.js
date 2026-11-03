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
function placeAt(x,y){let s=slotAt(x,y);if(s<0)for(let i=0;i<NR*3;i++){const d=door(i);if(d[0]==x&&d[1]==y)s=i}if(s>=0)return {slot:s};
 for(const k in PLACES)if(inRect(x,y,PLACES[k].r))return {dest:k,door:PLACES[k].door};
 if(inRect(x,y,FOUNTAIN))return {dest:"plaza",door:PLACES.plaza.door};
 return blocked(x,y)?null:{dest:"street",door:[x,y]}}

// ── 需求：和資料庫同一套算法，只用來即時顯示（真正的數字以資料庫為準）──
const NEEDS=["hunger","energy","bladder","hygiene","fun"];
const NEED_INFO={hunger:["🍚","飽足"],energy:["⚡","精力"],bladder:["🚽","膀胱"],hygiene:["🛁","清潔"],fun:["🎉","心情"]};
function tickLocal(r,now){const h=Math.min(72,Math.max(0,(now-Date.parse(r.updated_at))/36e5)),o={...r};
 if(o.sleeping){o.energy+=14*h;o.hunger-=1.5*h;o.bladder-=1.5*h;o.hygiene-=.5*h;o.fun-=.3*h}else{o.hunger-=4*h;o.energy-=3*h;o.bladder-=5*h;o.hygiene-=2.5*h;o.fun-=2*h}
 NEEDS.forEach(k=>o[k]=clamp(o[k],0,100));return o}

if(typeof module!=="undefined")module.exports={T,COLS,setRows,mapRows,homeXY,door,visitSpot,PLACES,blocked,bfs,placeAt,slotAt,tickLocal,isRoad};
if(typeof document!=="undefined")addEventListener("DOMContentLoaded",init);

function init(){
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const toast=t=>{const el=$("toast");el.textContent=t;el.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("on"),2600)};
const SKIN=["#f1c9a5","#e0ac7e","#c68a5a","#8d5a3a"],HAIR=["#222222","#5a3a1a","#a0522d","#d9b26a","#c0c0c0","#c0392b"],SHIRT=["#d9534f","#3b7dd8","#b45cc4","#8b5a2b","#2e9e5b","#d8901a","#333a44","#f0f0f0"],STYLE=["短髮","長髮","光頭","帽子"];
const randLook=()=>({skin:SKIN[Math.floor(Math.random()*SKIN.length)],hair:HAIR[Math.floor(Math.random()*HAIR.length)],shirt:SHIRT[Math.floor(Math.random()*SHIRT.length)],style:STYLE[Math.floor(Math.random()*2)]});
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
const THANKABLE=["feed","wash","visit","gift","note","greet"];
const thankable=()=>{const done=new Set((S.events||[]).filter(e=>e.actor==me&&e.kind=="thank"&&Date.parse(e.at)>now()-12*36e5).map(e=>e.target));return (S.events||[]).filter(e=>e.target==me&&THANKABLE.includes(e.kind)&&R[e.actor]&&Date.parse(e.at)>now()-3*864e5&&!done.has(e.actor))};
const houseName=s=>`${STREETS[Math.floor(s/3)]} ${s%3+1} 號`;

// ── 我住的小鎮（存在這台手機）──
const mine=()=>{try{return JSON.parse(localStorage.getItem("town-mine")||"[]")}catch(e){return []}};
const saveMine=e=>{const l=mine().filter(x=>x.tid!=e.tid);l.unshift(e);try{localStorage.setItem("town-mine",JSON.stringify(l.slice(0,10)))}catch(er){}};
const dropMine=tid=>{try{localStorage.setItem("town-mine",JSON.stringify(mine().filter(x=>x.tid!=tid)))}catch(e){}};
const go=tid=>{location.search="?t="+tid};

// ── 首頁：建立小鎮、用代碼加入、我住的小鎮 ──
function landing(){$("title").textContent="🐷 小豬鎮";$("game").classList.add("hide");$("login").classList.remove("hide");const list=mine();
 $("lg").innerHTML=`<p class="mut">和朋友一起住在小鎮裡：照顧自己吃飯睡覺洗澡，也可以去朋友家幫忙或惡作劇。手機打開就能玩。</p>
  ${list.length?`<h2>我住的小鎮</h2><div class="list">${list.map(x=>`<button data-go="${esc(x.tid)}"><b>${esc(x.name||x.tid)}</b><small>${esc(x.me||"")} · 代碼 ${esc(x.tid)}</small></button>`).join("")}</div>`:""}
  ${standalone?"":`<div class="row" style="justify-content:flex-start"><button id="inst2">📲 加到手機主畫面，像 App 一樣打開</button></div>`}
  <h2>加入朋友的小鎮</h2><div class="inline"><input id="code" placeholder="小鎮代碼，例如 ABC234" maxlength="8" autocomplete="off" style="text-transform:uppercase"><button class="pri" id="join">前往</button></div><p class="err" id="jerr"></p>
  <h2>建立自己的小鎮</h2><label>小鎮名稱<input id="tn" maxlength="16" placeholder="例如：我們的小豬鎮"></label><label>你的名字<input id="mn" maxlength="12" placeholder="鎮上大家怎麼叫你"></label>
  <label>4 位數密碼（之後登入用）<input id="np" inputmode="numeric" maxlength="4" autocomplete="off"></label><div id="lk"></div><p class="err" id="cerr"></p><div class="row"><button class="pri" id="create">建立小鎮，當鎮長</button></div>`;
 $("lg").querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));if($("inst2"))$("inst2").onclick=installHelp;
 $("join").onclick=()=>{const c=$("code").value.trim().toUpperCase().replace(/[^A-Z0-9]/g,"");if(c.length<4){$("jerr").textContent="代碼是 6 個英文或數字";return}go(c)};
 let look=randLook();lookPicker($("lk"),look,l=>look=l);
 $("create").onclick=async()=>{const tn=$("tn").value.trim(),mn=$("mn").value.trim(),p=$("np").value.trim();
  if(!tn){$("cerr").textContent="幫小鎮取個名字";return}if(!mn){$("cerr").textContent="填你的名字";return}if(!/^\d{4}$/.test(p)){$("cerr").textContent="密碼要是 4 位數字";return}
  $("create").disabled=true;try{const r=await rpc("town_create",{town_name:tn,my_name:mn,pin:p,look});saveMine({tid:r.town_id,name:tn,rid:r.resident_id,pin:p,me:mn,invite:r.invite});go(r.town_id)}
  catch(e){$("cerr").textContent=e.message;$("create").disabled=false}}}

// ── 鎮內登入：我住在這裡，或用邀請碼搬進來 ──
async function refresh(){const st=await rpc("town_state",{tid:TID});apply(st)}
function apply(st){S=st;offset=Date.parse(st.now)-Date.now();setRows(st.town.rows);R={};
 st.residents.forEach(r=>{R[r.id]=r;const w=walkers[r.id];
  if(!w)walkers[r.id]={x:r.x,y:r.y,path:[],tx:r.x,ty:r.y};else if(r.id!=me&&(Math.abs(w.tx-r.x)>.01||Math.abs(w.ty-r.y)>.01)){const p=bfs([Math.round(w.x),Math.round(w.y)],[Math.round(r.x),Math.round(r.y)]);w.path=p?p.slice(1):[[r.x,r.y]]}
  walkers[r.id].tx=r.x;walkers[r.id].ty=r.y});
 const key=st.town.rows+"|"+st.residents.map(r=>r.id+":"+r.slot+":"+r.name).join(",");if(key!=mapKey){mapKey=key;maps={}}
 $("title").textContent="🐷 "+st.town.name;if(me&&!R[me]){toast("你已經搬離這個小鎮");dropMine(TID);setTimeout(()=>go(""),1200)}
 renderFeed();renderPanel();renderNeeds()}
let mapKey="";
function townLogin(){$("login").classList.remove("hide");$("game").classList.add("hide");const res=Object.values(R),full=res.length>=12;
 $("lg").innerHTML=`<p class="mut">小鎮代碼 <b>${esc(TID)}</b> · 住了 ${res.length} 人</p>
  ${res.length?`<h2>我住在這裡</h2><div class="who">${res.map(r=>`<button data-id="${r.id}"><canvas width="40" height="44" data-look='${esc(JSON.stringify(r.look||{}))}'></canvas><b>${esc(r.name)}</b><small>${r.mayor?"鎮長":houseName(r.slot)}</small></button>`).join("")}</div>`:""}
  ${full?`<p class="mut">小鎮已經住滿 12 人了。</p>`:`<h2>我要搬進來</h2><div class="row" style="justify-content:flex-start"><button class="pri" id="mv">用邀請碼搬進來</button></div>`}
  <div class="row" style="justify-content:flex-start"><button id="home2">← 小豬鎮首頁</button></div>`;
 $("lg").querySelectorAll("canvas").forEach(c=>{const l=JSON.parse(c.dataset.look);miniPerson(c,l.skin?l:{skin:SKIN[0],hair:"#999",shirt:"#bbb",style:"短髮"})});
 $("lg").querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>pinStep(+b.dataset.id));
 if($("mv"))$("mv").onclick=()=>joinStep();$("home2").onclick=()=>go("")}
function pinStep(id){const r=R[id];$("lg").innerHTML=`<p><b>${esc(r.name)}</b>，歡迎回來</p><label>4 位數密碼<input id="pin" inputmode="numeric" maxlength="4" autocomplete="off"></label><p class="err" id="lerr"></p>
  <div class="row"><button id="back">← 換人</button><button class="pri" id="go">進入小鎮</button></div>`;
 $("back").onclick=townLogin;$("pin").focus();
 $("go").onclick=async()=>{const p=$("pin").value.trim();if(!/^\d{4}$/.test(p)){$("lerr").textContent="密碼要是 4 位數字";return}$("go").disabled=true;
  try{const res=await rpc("town_login",{rid:id,pin:p});me=id;pin=p;lastSeen=res.last_seen;saveMine({tid:TID,name:S.town.name,rid:id,pin:p,me:r.name});await enter()}catch(e){$("lerr").textContent=e.message;$("go").disabled=false}}}
function joinStep(){const free=[];for(let s=0;s<12;s++)if(!bySlot(s))free.push(s);const show=free.filter(s=>Math.floor(s/3)<NR);if(!show.length&&free.length)show.push(free[0]);let slot=show[0],look=randLook();
 $("lg").innerHTML=`<p><b>搬進${esc(S.town.name)}</b></p><label>邀請碼（問鎮長）<input id="inv" maxlength="8" autocomplete="off" style="text-transform:uppercase"></label>
  <label>你的名字<input id="mn" maxlength="12"></label><label>設定 4 位數密碼（之後登入用）<input id="pin" inputmode="numeric" maxlength="4" autocomplete="off"></label>
  <p class="mut" style="margin:10px 0 4px">選一間空屋</p><div class="houses">${show.map(s=>`<button class="sw${s==slot?" on":""}" data-s="${s}">${houseName(s)}${Math.floor(s/3)>=NR?"（新街）":""}</button>`).join("")}</div>
  <div id="lk"></div><p class="err" id="lerr"></p><div class="row"><button id="back">← 返回</button><button class="pri" id="go">搬進去</button></div>`;
 $("lg").querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{slot=+b.dataset.s;$("lg").querySelectorAll("[data-s]").forEach(x=>x.classList.toggle("on",x==b))});
 lookPicker($("lk"),look,l=>look=l);$("back").onclick=townLogin;
 $("go").onclick=async()=>{const inv=$("inv").value.trim().toUpperCase(),mn=$("mn").value.trim(),p=$("pin").value.trim();
  if(!inv){$("lerr").textContent="填鎮長給你的邀請碼";return}if(!mn){$("lerr").textContent="填你的名字";return}if(!/^\d{4}$/.test(p)){$("lerr").textContent="密碼要是 4 位數字";return}
  $("go").disabled=true;try{const r=await rpc("town_join",{tid:TID,invite:inv,my_name:mn,pin:p,look,want_slot:slot});me=r.resident_id;pin=p;lastSeen=null;saveMine({tid:TID,name:S.town.name,rid:me,pin:p,me:mn});await enter()}
  catch(e){$("lerr").textContent=e.message;$("go").disabled=false}}}
function lookPicker(el,look,cb){const row=(k,arr,label)=>`<div class="lrow"><span>${label}</span>${arr.map(v=>k=="style"?`<button class="sw${look[k]==v?" on":""}" data-k="${k}" data-v="${v}">${v}</button>`:`<button class="sw dot${look[k]==v?" on":""}" data-k="${k}" data-v="${v}" style="background:${v}" aria-label="${label}"></button>`).join("")}</div>`;
 const draw=()=>{el.innerHTML=`<div class="lookbox"><canvas id="lkcv" width="80" height="88"></canvas><div>${row("skin",SKIN,"膚色")}${row("hair",HAIR,"髮色")}${row("style",STYLE,"髮型")}${row("shirt",SHIRT,"衣服")}</div></div>`;
  miniPerson(el.querySelector("canvas"),look);el.querySelectorAll(".sw[data-k]").forEach(b=>b.onclick=()=>{look={...look,[b.dataset.k]:b.dataset.v};cb(look);draw()})};draw()}
async function enter(){await refresh();$("login").classList.add("hide");$("game").classList.remove("hide");camFree=false;
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
async function act(a,extra={}){if(busy)return;busy=true;renderPanel();try{const st=await rpc("town_act",{rid:me,pin,act:a,...extra});apply(st)}catch(e){toast(e.message)}busy=false;renderPanel()}
function walkTo(dest,d){const w=walkers[me],p=bfs([Math.round(w.x),Math.round(w.y)],d);if(!p){toast("走不到那裡");return}
 w.path=p.slice(1);w.dest=dest;w.goal=d;camFree=false;if(!w.path.length)arrived(w);renderPanel()}
function arrived(w){const d=w.dest;w.dest=null;act("move",{px:w.goal[0],py:w.goal[1],dest:d})}
const goHouse=s=>{const o=bySlot(s);if(!o){toast(`${houseName(s)}是空屋，邀請朋友搬進來吧`);return}walkTo("home:"+o.id,o.id==me?door(s):visitSpot(s))};

// ── 下方面板：依所在地點顯示可以做的事 ──
const btn=(label,sub,fn)=>({label,sub,fn});let lastPanel="",panelFns=[];
function renderPanel(){if(!S||!me||!R[me])return;const r=tickLocal(R[me],now()),p=r.place,list=[];let title="",note="";
 if(walkers[me]&&walkers[me].path.length){title="走路中…";note="到了就可以做事"}
 else if(r.sleeping){title=`在${placeName(p)}睡覺 💤`;list.push(btn("起床","",()=>act("wake")))}
 else if(p=="home:"+me){title="你家";list.push(btn("吃飯","飽足 +40 · €10",()=>act("eat")),btn("上廁所","膀胱回滿",()=>act("toilet")),btn("洗澡","清潔回滿",()=>act("shower")),btn("看電視","心情 +25",()=>act("tv")),btn("睡覺","精力慢慢回來",()=>act("sleep")))}
 else if(p&&p.startsWith("home:")&&R[p.slice(5)]){const id=+p.slice(5),t=tickLocal(R[id],now());title=`${t.name} 家`;
  const gifts=(r.items||{}).gift||0,giftB=gifts?btn("送禮物",`他心情 +20 · 背包 🎁${gifts}`,()=>act("gift",{target:id})):btn("送禮物","先去超市買",()=>toast("背包沒有禮物，去超市買一份"));
  if(t.place!=p){note=`${t.name} 不在家，在${placeName(t.place)}。可以在門口留言或放禮物，他回來會看到 · ${bondLabel(bondWith(id))}`;list.push(btn("留言","寫一句話給他",()=>noteModal(id)),giftB,btn("丟雞蛋 🥚","好感 −2",()=>act("egg",{target:id})))}
  else{note=`${t.name}${t.sleeping?" 在睡覺":""}：飽足 ${Math.round(t.hunger)}、清潔 ${Math.round(t.hygiene)}、心情 ${Math.round(t.fun)} · ${bondLabel(bondWith(id))}`;list.push(giftB);
   list.push(btn("煮飯給他","他飽足 +35 · €10",()=>act("feed",{target:id})),btn("幫他洗澡","他清潔 +45",()=>act("wash",{target:id})));
   if(t.sleeping)list.push(btn("叫醒他","",()=>act("wakeup",{target:id})));
   if(!t.sleeping)list.push(btn("串門子","兩人心情 +15",()=>act("visit",{target:id})));list.push(btn("留言","寫一句話給他",()=>noteModal(id)),btn("惡作劇","放個臭屁 💨 · 好感 −3",()=>act("prank",{target:id})),btn("丟雞蛋 🥚","好感 −2",()=>act("egg",{target:id})));
   if(!t.sleeping)list.push(...faceActs(id))}}
 else if(p=="restaurant"){title="餐廳";list.push(btn("吃一頓","飽足 +55 · 心情 +10 · €30",()=>act("dine")))}
 else if(p=="office"){title="公司";list.push(btn("打工","+€120 · 累",()=>act("work")))}
 else if(p=="park"||p=="plaza"){title=placeName(p);list.push(btn("玩一下","心情 +20",()=>act("play")))}
 else if(p=="market"){title="超市";list.push(btn("買禮物 🎁","€20 · 送朋友心情 +20",()=>act("buy",{item:"gift"})),btn("買零食 🍪","€15 · 隨時吃，飽足 +20",()=>act("buy",{item:"snack"})),btn("逛逛","心情 +6",()=>act("browse")))}
 else{title="路上";note="點地圖上的房子或地點，就會走過去"}
 // 公共場所遇到人：可以擊掌；一起吃飯、玩、加班時在場的人心情都會變好
 if(!r.sleeping&&["plaza","restaurant","market","park","office"].includes(p)&&!(walkers[me]&&walkers[me].path.length)){const here=Object.values(R).filter(o=>o.id!=me&&o.place==p&&!o.sleeping);
  if(here.length&&!(sel&&R[sel]))note=(note?note+" · ":"")+`${here.map(o=>o.name).join("、")} 也在這裡：一起做事大家心情都 +5，點他可以擊掌或扁他`}
 if(!r.sleeping&&(r.items||{}).snack&&!(walkers[me]&&walkers[me].path.length))list.push(btn("吃零食 🍪",`飽足 +20 · 還有 ${(r.items||{}).snack} 包`,()=>act("snack")));
 if(sel&&R[sel]&&sel!=me){const t=tickLocal(R[sel],now());note=`${t.name}：在${placeName(t.place)}${t.sleeping?"睡覺":""} · 飽足 ${Math.round(t.hunger)} · 清潔 ${Math.round(t.hygiene)} · 心情 ${Math.round(t.fun)} · ${bondLabel(bondWith(t.id))}`;
  if(isNear(t.id)&&!t.sleeping&&!r.sleeping)list.unshift(...faceActs(t.id));else list.unshift(btn(`走到 ${t.name} 旁邊`,`他在${placeName(t.place)}`,()=>walkToPerson(t.id)));
  list.push(btn(`去 ${t.name} 家`,"",()=>{sel=null;goHouse(t.slot)}))}
 $("here").textContent=title;$("note").textContent=note;
 // 內容沒變就不重畫，避免按到一半按鈕被換掉
 const html=list.map((b,i)=>`<button data-i="${i}" ${busy?"disabled":""}><b>${b.label}</b>${b.sub?`<small>${b.sub}</small>`:""}</button>`).join("");
 panelFns=list;if(html!=lastPanel){lastPanel=html;$("acts").innerHTML=html;$("acts").querySelectorAll("button").forEach(b=>b.onclick=()=>panelFns[b.dataset.i].fn())}}
function renderNeeds(){if(!S||!me||!R[me])return;const r=tickLocal(R[me],now());
 $("needs").innerHTML=NEEDS.map(k=>{const v=Math.round(r[k]),[ic,nm]=NEED_INFO[k];return `<div class="need${v<20?" low":""}" title="${nm} ${v}"><span>${ic}</span><i><b style="width:${v}%;background:${v<20?"var(--bad)":v<50?"var(--warn)":"var(--good)"}"></b></i><small>${nm} ${v}</small></div>`}).join("")+`<div class="need money"><span>💰</span><small>€${r.money}${(r.items||{}).gift?` · 🎁${r.items.gift}`:""}${(r.items||{}).snack?` · 🍪${r.items.snack}`:""}</small></div>`}
function renderFeed(){const ev=(S&&S.events)||[];const fmt=a=>{const d=new Date(Date.parse(a)+8*36e5),t=new Date(now()+8*36e5);const hm=`${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`;return d.toISOString().slice(0,10)==t.toISOString().slice(0,10)?hm:`${d.getUTCMonth()+1}/${d.getUTCDate()} ${hm}`};
 const ok=new Set(me?thankable().map(e=>e.id):[]),bad=new Set(me?grudges().map(e=>e.id):[]),shown=new Set();
 $("feed").innerHTML=ev.length?ev.slice(0,30).map(e=>{const t=ok.has(e.id)&&!shown.has(e.actor);if(t)shown.add(e.actor);const g=bad.has(e.id)&&!shown.has("g"+e.actor);if(g)shown.add("g"+e.actor);return `<p class="${e.target==me?"mine":""}"><span>${fmt(e.at)}</span>${esc(e.msg)}${t?` <button class="thx" data-t="${e.actor}">💗 謝謝</button>`:""}${g?` <button class="thx" data-g="${e.actor}">😤 報仇</button>`:""}</p>`}).join(""):`<p class="mut">小鎮還很安靜。</p>`;
 $("feed").querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>act("thank",{target:+b.dataset.t}));
 $("feed").querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{walkToPerson(+b.dataset.g);toast("走過去找他算帳，到了就能扁他（報仇有加成）");$("stage").scrollIntoView({behavior:"smooth"})})}
// 面對面才能做的事：擊掌、扁他、和好
function faceActs(id){const t=R[id],b=bondWith(id),out=[btn(`和 ${t.name} 擊掌 🙌`,"兩人心情 +8 · 好感 +2",()=>act("greet",{target:id})),
  btn(`扁 ${t.name} 👊`,b>=30?"好麻吉之間是打打鬧鬧 · 好感 +1":"比精力、心情和運氣 · 好感 −6",()=>act("fight",{target:id}))];
 if(b<0)out.push(btn(`和 ${t.name} 和好 🤝`,"好感 +8",()=>act("makeup",{target:id})));return out}
// 走到某人身邊：他在室內就走到那個地點的門口，在路上就走到他旁邊
function walkToPerson(id){const t=R[id];if(!t)return;sel=id;if(t.place.startsWith("home:")){const o=R[t.place.slice(5)];if(o){walkTo(t.place,o.id==me?door(o.slot):visitSpot(o.slot));return}}
 if(PLACES[t.place]){walkTo(t.place,PLACES[t.place].door);return}const w=walkers[id],g=[Math.round(w.x),Math.round(w.y)],nb=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>[g[0]+dx,g[1]+dy]).find(p=>!blocked(...p))||g;walkTo("street",nb)}
function bondsModal(){const list=Object.values(R).filter(o=>o.id!=me).map(o=>({o,v:bondWith(o.id)})).sort((a,b)=>b.v-a.v);$("modal").classList.remove("hide");
 $("mbody").innerHTML=`<h2>👥 人際關係</h2>${list.length?list.map(({o,v})=>`<div class="mrow"><span><b>${esc(o.name)}</b> <small class="mut">${bondLabel(v)} · ${v>0?"+":""}${v}</small><i class="bond"><b style="left:50%;width:${Math.abs(v)/2}%;${v<0?`left:${50-Math.abs(v)/2}%;background:var(--bad)`:"background:var(--good)"}"></b></i><small class="mut">${tierHint(v)}</small></span><button data-w="${o.id}">找他</button></div>`).join(""):`<p class="mut">鎮上還沒有其他人，邀請朋友搬進來吧。</p>`}
  <p class="mut" style="margin-top:10px">送禮 +5、煮飯洗澡 +4、串門子 +3、道謝擊掌 +2、留言 +1；叫醒 −1、丟雞蛋 −2、惡作劇 −3、扁人 −6、和好 +8。好麻吉以上照顧對方效果 ×1.3。</p><div class="row"><button id="mc">關閉</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");$("mbody").querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{$("modal").classList.add("hide");walkToPerson(+b.dataset.w)})}
function noteModal(id){const t=R[id];$("modal").classList.remove("hide");const quick=["記得吃飯！🍚","晚安 🌙","今天加油！💪","想你了 🥺","快去洗澡 🛁","下次一起吃飯？"];
 $("mbody").innerHTML=`<h2>留言給 ${esc(t.name)}</h2><div class="houses">${quick.map(q=>`<button class="sw" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div><input id="ntx" maxlength="30" placeholder="或自己寫（最多 30 字）" style="margin-top:10px"><p class="err" id="nerr"></p>
  <div class="row"><button id="mc">取消</button><button class="pri" id="ms">留在門口</button></div>`;
 $("mbody").querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{$("ntx").value=b.dataset.q});$("mc").onclick=()=>$("modal").classList.add("hide");
 $("ms").onclick=async()=>{const v=$("ntx").value.trim();if(!v){$("nerr").textContent="寫一句話，或點上面的選項";return}$("modal").classList.add("hide");await act("note",{target:id,note:v})}}

// ── 畫面：靜態地圖畫一次（白天、晚上各一張，房子或人數變了才重畫），動態的人與噴水池每幀畫 ──
const cv=$("cv"),g=cv.getContext("2d"),cam={x:0,y:0,s:1};let maps={};
const grassV=(()=>{let s=7;const r=()=>(s=(s*9301+49297)%233280)/233280;return [...Array(40)].map(()=>[...Array(COLS)].map(r))})();
function buildMap(night){const ROWS=mapRows(),c=document.createElement("canvas");c.width=COLS*T;c.height=ROWS*T;const m=c.getContext("2d");
 const sign=(t,x,y,bg)=>{m.font="600 14px sans-serif";const w=m.measureText(t).width+14;m.fillStyle=bg||"rgba(20,20,20,.8)";m.fillRect(x-w/2,y-11,w,22);m.fillStyle="#fff";m.textAlign="center";m.textBaseline="middle";m.fillText(t,x,y+1)};
 const win=(x,y,lit)=>{m.fillStyle=night&&lit!==false?"#ffd76a":"#bfe3ff";m.fillRect(x,y,16,14);m.fillStyle="rgba(255,255,255,.5)";m.fillRect(x,y,16,3);m.fillStyle="#3a3a3a";m.fillRect(x+7,y,2,14)};
 for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++){const v=grassV[j][i];m.fillStyle=v<.5?"#7cc46a":"#74bb62";m.fillRect(i*T,j*T,T,T);if(v>.92){m.fillStyle="#f5f0a0";m.fillRect(i*T+10,j*T+12,4,4)}}
 m.fillStyle="#8d8d8d";for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++)if(isRoad(i,j))m.fillRect(i*T,j*T,T,T);
 m.fillStyle="#e8e8e8";for(let j=0;j<ROWS;j++)if(roadRowsAt(j)&&!roadRowsAt(j-1))for(let i=0;i<COLS*T;i+=36)m.fillRect(i,(j+1)*T-1,18,3);
 for(let j=0;j<ROWS*T;j+=36)if(!(j>=8*T&&j<15*T))m.fillRect(17*T-1,j,3,18);
 const [px,py,pw,ph]=PLACES.plaza.r;for(let j=py;j<py+ph;j++)for(let i=px;i<px+pw;i++){m.fillStyle=(i+j)%2?"#cbbf9f":"#d9cfb4";m.fillRect(i*T,j*T,T,T)}
 m.fillStyle="#5aa84f";const [qx,qy,qw,qh]=PLACES.park.r;m.fillRect(qx*T,qy*T,qw*T,qh*T);m.fillStyle="#d9cfb4";m.fillRect(qx*T,19*T+10,qw*T,12);m.fillStyle="#8b5a2b";m.fillRect(30*T,18*T+4,44,10);m.fillRect(30*T+4,18*T+14,4,8);m.fillRect(30*T+36,18*T+14,4,8);
 for(let s=0;s<NR*3;s++){const [hx,hy]=homeXY(s),X=hx*T,Y=hy*T,W=5*T,o=bySlot(s);m.fillStyle="rgba(0,0,0,.18)";m.fillRect(X+8,Y+T+10,W,3*T);m.fillStyle=o?"#f4ead6":"#e2ddd2";m.fillRect(X,Y+T,W,3*T-6);
  m.fillStyle=o?ROOFS[s]:"#9a9a9a";m.fillRect(X-8,Y,W+16,T+14);m.fillStyle="rgba(0,0,0,.15)";for(let k=0;k<W+16;k+=12)m.fillRect(X-8+k,Y,6,T+14);m.fillStyle="rgba(255,255,255,.25)";m.fillRect(X-8,Y,W+16,4);
  win(X+20,Y+T+26,!!o);win(X+W-36,Y+T+26,!!o);m.fillStyle="#7a4a24";m.fillRect(X+W/2-11,Y+3*T+4,22,T-10);m.fillStyle="#e0b050";m.fillRect(X+W/2+5,Y+3*T+18,3,3);m.fillStyle="#cbbf9f";m.fillRect(X+W/2-10,Y+4*T,20,T);
  sign(o?o.name+" 的家":"空屋",X+W/2,Y+T/2+6,o?null:"rgba(90,90,90,.85)")}
 const bld=(k,wall,roof,deco)=>{const [x,y,w,h]=PLACES[k].r,X=x*T,Y=y*T,W=w*T,H=h*T;m.fillStyle="rgba(0,0,0,.18)";m.fillRect(X+8,Y+16,W,H);m.fillStyle=wall;m.fillRect(X,Y+14,W,H-14);m.fillStyle=roof;m.fillRect(X-6,Y,W+12,20);deco(X,Y,W,H)};
 bld("office","#b8c4cf","#5f6b78",(X,Y,W,H)=>{for(let a=0;a<5;a++)for(let b=0;b<3;b++)win(X+16+a*40,Y+36+b*40);m.fillStyle="#555";m.fillRect(X+W/2-14,Y+H-36,28,36)});
 bld("restaurant","#fff3e0","#c0392b",(X,Y,W,H)=>{for(let k=0;k<W;k+=24){m.fillStyle=(k/24)%2?"#fff":"#e74c3c";m.fillRect(X+k,Y+20,24,16)}win(X+20,Y+60);win(X+W-36,Y+60);m.fillStyle="#7a4a24";m.fillRect(X+W/2-12,Y+H-44,24,44)});
 bld("market","#eef7ea","#2e8b57",(X,Y,W,H)=>{m.fillStyle=night?"#ffe9a8":"#cfeefc";m.fillRect(X+14,Y+44,W-28,46);m.fillStyle="#2e8b57";for(let k=X+14;k<X+W-14;k+=28)m.fillRect(k,Y+44,3,46);m.fillStyle="#7a4a24";m.fillRect(X+W/2-14,Y+H-44,28,44)});
 const trees=[];for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++)if(!blocked(i,j)&&!isRoad(i,j)&&!inRect(i,j,PLACES.plaza.r)&&!inRect(i,j,PLACES.park.r)&&grassV[j][i]<.1&&![...Array(NR*3).keys()].some(s=>{const d=door(s);return Math.abs(d[0]-i)<=1&&Math.abs(d[1]-j)<=1}))trees.push([i,j]);
 [[26,18],[28,18],[31,18],[33,18],[27,20],[32,20]].forEach(t=>trees.push(t));
 trees.forEach(([i,j])=>{const x=i*T+16,y=j*T+18;m.fillStyle="rgba(0,0,0,.2)";m.beginPath();m.ellipse(x+4,y+12,14,5,0,0,7);m.fill();m.fillStyle="#6b4423";m.fillRect(x-3,y,6,12);m.fillStyle=night?"#2f6b3a":"#3f9a4c";m.beginPath();m.arc(x,y-4,14,0,7);m.fill();m.fillStyle=night?"#3d7f48":"#5cbf63";m.beginPath();m.arc(x-4,y-9,7,0,7);m.fill()});
 for(let k=0;k<NR;k++){const y=k==0?6:k==1?15:22+7*(k-2);sign(STREETS[k],8*T,y*T+T,"rgba(60,60,60,.8)")}
 sign("公司",29.5*T,10);sign("餐廳",5*T,9*T+10);sign("超市",28*T,9*T+10);sign("公園",29.5*T,17*T+12);sign("小豬廣場",17*T,8*T+14);
 if(night){m.fillStyle="rgba(18,28,78,.45)";m.fillRect(0,0,c.width,c.height)}
 return c}
function person(x,y,look,tk,moving,label,isMe,state){const u=1.6,b=moving?Math.floor(tk/7)%2:0,L=look&&look.skin?look:{skin:"#f1c9a5",hair:"#999",shirt:"#bbb",style:"短髮"};
 if(isMe){g.strokeStyle="#ffd23f";g.lineWidth=3;g.beginPath();g.ellipse(x,y+12*u,11*u,4*u,0,0,7);g.stroke()}
 g.fillStyle="rgba(0,0,0,.25)";g.fillRect(x-5*u,y+10*u,10*u,3*u);
 if(state.sleeping){g.fillStyle=L.shirt;g.fillRect(x-9*u,y+2*u,14*u,7*u);g.fillStyle=L.skin;g.fillRect(x+5*u,y+2*u,7*u,7*u);g.fillStyle=L.hair;g.fillRect(x+10*u,y+2*u,2*u,7*u);g.font="bold 16px sans-serif";g.fillStyle="#fff";g.fillText("Zz",x+14*u,y-6*u+Math.sin(tk/20)*3)}
 else{g.fillStyle="#2b2b3a";g.fillRect(x-4*u,y+5*u,3*u,(6-b*2)*u);g.fillRect(x+1*u,y+5*u,3*u,(4+b*2)*u);g.fillStyle=L.shirt;g.fillRect(x-5*u,y-3*u,10*u,9*u);g.fillStyle=L.skin;g.fillRect(x-4*u,y-11*u,8*u,8*u);
  g.fillStyle=L.hair;if(L.style=="長髮"){g.fillRect(x-5*u,y-12*u,10*u,3*u);g.fillRect(x-5*u,y-10*u,2*u,8*u);g.fillRect(x+3*u,y-10*u,2*u,8*u)}else if(L.style=="帽子"){g.fillRect(x-5*u,y-13*u,10*u,3*u);g.fillRect(x-6*u,y-10*u,12*u,2*u)}else if(L.style!="光頭")g.fillRect(x-4*u,y-12*u,8*u,3*u);
  g.fillStyle="#222";g.fillRect(x-2*u,y-8*u,u,2*u);g.fillRect(x+2*u,y-8*u,u,2*u);
  if(state.bruised){g.fillStyle="#6b3fa0";g.fillRect(x+1*u,y-9*u,3*u,3*u);g.fillStyle="#fff";g.fillRect(x-4*u,y-6*u,4*u,u);g.fillRect(x-3*u,y-7*u,u,3*u)}}
 if(state.stink){g.strokeStyle="#7bd36b";g.lineWidth=2;for(let k=-1;k<=1;k++){g.beginPath();for(let s=0;s<10;s++)g.lineTo(x+k*8*u+Math.sin(tk/6+s)*2,y-14*u-s*2.2);g.stroke()}}
 g.font="600 13px sans-serif";g.textAlign="center";g.textBaseline="middle";const tag=label+(state.bruised?" 🤕":"")+(state.hungry?" 🍚":""),w=g.measureText(tag).width+10;g.fillStyle=isMe?"rgba(160,110,0,.9)":"rgba(0,0,0,.65)";g.fillRect(x-w/2,y-30*u,w,18);g.fillStyle="#fff";g.fillText(tag,x,y-30*u+9)}
function miniPerson(c,L){const m=c.getContext("2d");m.clearRect(0,0,c.width,c.height);m.save();m.scale(c.width/40,c.width/40);
 m.fillStyle="#2b2b3a";m.fillRect(14,32,5,8);m.fillRect(21,32,5,8);m.fillStyle=L.shirt;m.fillRect(12,20,16,14);m.fillStyle=L.skin;m.fillRect(13,6,14,14);m.fillStyle=L.hair;
 if(L.style=="長髮"){m.fillRect(11,4,18,5);m.fillRect(11,8,3,14);m.fillRect(26,8,3,14)}else if(L.style=="帽子"){m.fillRect(11,2,18,5);m.fillRect(9,7,22,3)}else if(L.style!="光頭")m.fillRect(13,4,14,5);m.fillStyle="#222";m.fillRect(17,12,2,3);m.fillRect(22,12,2,3);m.restore()}
let W=0,Hh=0,dpr=1;
function resize(){const box=$("stage");dpr=Math.min(2,devicePixelRatio||1);W=box.clientWidth;Hh=Math.round(Math.min(innerHeight*.58,Math.max(300,W*.8)));cv.width=W*dpr;cv.height=Hh*dpr;cv.style.height=Hh+"px";
 cam.s=zoomFar?Math.min(W/(COLS*T),Hh/(mapRows()*T)):W/((W<600?11:17)*T)}
addEventListener("resize",resize);
let tk=0,last=performance.now();
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
 // 人：依 y 排序，前面的蓋住後面的；在家睡覺的人在屋裡看不到，改在屋頂畫 💤；晚上有人在家的窗戶亮燈
 const list=Object.values(R).map(r=>({id:r.id,w:walkers[r.id],r:tickLocal(r,now())})).filter(o=>!(o.r.sleeping&&o.r.place=="home:"+o.id&&!o.w.path.length)).sort((a,b)=>a.w.y-b.w.y);
 for(const o of list)person((o.w.x+.5)*T,(o.w.y+.5)*T,o.r.look,tk,o.w.moving,o.r.name,o.id==me,{sleeping:o.r.sleeping&&!o.w.path.length,stink:o.r.hygiene<25,hungry:o.r.hunger<20,bruised:o.r.bruised});
 for(const r of Object.values(R)){if(r.place!="home:"+r.id)continue;const [hx,hy]=homeXY(r.slot);if(night){g.fillStyle="rgba(255,215,106,.35)";g.fillRect(hx*T+16,hy*T+T+22,24,22);g.fillRect(hx*T+5*T-40,hy*T+T+22,24,22)}
  if(r.sleeping){g.font="bold 18px sans-serif";g.fillStyle="#fff";g.textAlign="center";g.fillText("💤",hx*T+4.2*T,hy*T+T+4+Math.sin(tk/25)*4)}}
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
$("logout").onclick=()=>{if(!confirm("登出後要再輸入密碼才能進來。確定嗎？"))return;dropMine(TID);me=null;pin=null;townLogin()};
$("towns").onclick=()=>go("");
$("invite").onclick=async()=>{if(R[me].mayor){try{shareModal((await rpc("town_mayor",{rid:me,pin,act:"invite"})).invite)}catch(e){toast(e.message)}}else{const text=`來「${S.town.name}」當鄰居！🐷\n${townURL()}\n（邀請碼請問鎮長）`;try{await navigator.clipboard.writeText(text);toast("已複製網址，邀請碼請鎮長給")}catch(e){toast(townURL())}}};
$("mayor").onclick=mayorPanel;$("bonds").onclick=bondsModal;
$("relook").onclick=()=>{let look={...R[me].look};$("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>換造型</h2><div id="lk2"></div><div class="row"><button id="mc">取消</button><button class="pri" id="ms">儲存</button></div>`;
 lookPicker($("lk2"),look,l=>look=l);$("mc").onclick=()=>$("modal").classList.add("hide");$("ms").onclick=async()=>{try{await rpc("town_login",{rid:me,pin,new_look:look});mapKey="";await refresh();$("modal").classList.add("hide");toast("換好了")}catch(e){toast(e.message)}}};
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

// ── 開始：沒有代碼就是首頁；有代碼就讀小鎮，這台手機住過就自動登入；每 15 秒同步一次 ──
(async()=>{if(!TID){const l=mine();if(standalone&&l.length==1){go(l[0].tid);return}landing();return}
 try{await refresh()}catch(e){$("lg").innerHTML=`<p class="err">${esc(e.message)}</p><div class="row" style="justify-content:flex-start"><button id="home3">← 小豬鎮首頁</button></div>`;$("home3").onclick=()=>go("");return}
 const a=mine().find(x=>x.tid==TID);
 if(a&&R[a.rid]){try{const res=await rpc("town_login",{rid:a.rid,pin:a.pin});me=a.rid;pin=a.pin;lastSeen=res.last_seen;await enter()}catch(e){townLogin()}}else townLogin();
 setInterval(()=>{if(document.visibilityState=="visible"&&S)refresh().catch(()=>{})},15000)})();
}
