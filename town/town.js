// 小豬鎮：俯視的小鎮，6 位居民；需求隨現實時間下降，所有改動都經過 Supabase 的資料庫函式
const SB="https://gerqdagicybtyilihvvm.supabase.co/rest/v1/rpc/",SBK="sb_publishable_bPvbJFXUM_Ax2iPLeTS5zw_foV60x5y";
const rpc=(fn,body={})=>fetch(SB+fn,{method:"POST",headers:{apikey:SBK,"Content-Type":"application/json"},body:JSON.stringify(body)})
 .then(async r=>{const j=await r.json().catch(()=>null);if(!r.ok)throw new Error((j&&j.message)||"連不上小鎮，等一下再試");if(j&&j.error)throw new Error(j.error);return j});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// ── 地圖：34×22 格。房子 5×4 格，門在房子正下方 ──
const T=32,COLS=34,ROWS=23;
const IDS=["jacky","abel","cerina","bear","mike","rafael"];
const HOMES={jacky:[2,1],abel:[9,1],cerina:[20,1],bear:[2,17],mike:[9,17],rafael:[20,17]};
const ROOF={jacky:"#d9534f",abel:"#3b7dd8",cerina:"#b45cc4",bear:"#8b5a2b",mike:"#2e9e5b",rafael:"#d8901a"};
const door=id=>[HOMES[id][0]+2,HOMES[id][1]+4];
const PLACES={
 restaurant:{r:[2,9,6,5],door:[5,14],name:"餐廳",block:1},
 market:{r:[24,9,8,5],door:[28,14],name:"超市",block:1},
 office:{r:[26,0,7,6],door:[29,6],name:"公司",block:1},
 park:{r:[25,17,9,5],door:[29,19],name:"公園"},
 plaza:{r:[12,8,10,7],door:[14,11],name:"廣場"}};
const inRect=(x,y,[rx,ry,rw,rh])=>x>=rx&&x<rx+rw&&y>=ry&&y<ry+rh;
const isRoad=(x,y)=>y==6||y==7||y==15||y==16||((x==16||x==17)&&!(y>=8&&y<=14));
const FOUNTAIN=[16,10,2,3];
function blocked(x,y){if(x<0||y<0||x>=COLS||y>=ROWS)return true;if(inRect(x,y,FOUNTAIN))return true;
 for(const id of IDS){const [hx,hy]=HOMES[id];if(inRect(x,y,[hx,hy,5,4]))return true}
 for(const k in PLACES)if(PLACES[k].block&&inRect(x,y,PLACES[k].r))return true;return false}
// 最短路徑（上下左右走），找不到就回傳 null
function bfs(from,to){const key=(x,y)=>y*COLS+x,prev=new Map([[key(...from),null]]),q=[from];
 while(q.length){const [x,y]=q.shift();if(x==to[0]&&y==to[1]){const path=[];let k=key(x,y);while(k!=null){path.unshift([k%COLS,Math.floor(k/COLS)]);k=prev.get(k)}return path}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(!blocked(nx,ny)&&!prev.has(k)){prev.set(k,key(x,y));q.push([nx,ny])}}}
 return null}
// 點到的格子是哪個地點
function placeAt(x,y){for(const id of IDS){const [hx,hy]=HOMES[id];if(inRect(x,y,[hx,hy,5,4])||(x==hx+2&&y==hy+4))return {dest:"home:"+id,door:door(id)}}
 for(const k in PLACES)if(inRect(x,y,PLACES[k].r))return {dest:k,door:PLACES[k].door};
 if(inRect(x,y,FOUNTAIN))return {dest:"plaza",door:PLACES.plaza.door};
 return blocked(x,y)?null:{dest:"street",door:[x,y]}}

// ── 需求：和資料庫同一套算法，只用來即時顯示（真正的數字以資料庫為準）──
const NEEDS=["hunger","energy","bladder","hygiene","fun"];
const NEED_INFO={hunger:["🍚","飽足"],energy:["⚡","精力"],bladder:["🚽","膀胱"],hygiene:["🛁","清潔"],fun:["🎉","心情"]};
function tickLocal(r,now){if(!r.joined)return r;const h=Math.min(72,Math.max(0,(now-Date.parse(r.updated_at))/36e5)),o={...r};
 if(o.sleeping){o.energy+=14*h;o.hunger-=1.5*h;o.bladder-=1.5*h;o.hygiene-=.5*h;o.fun-=.3*h}else{o.hunger-=4*h;o.energy-=3*h;o.bladder-=5*h;o.hygiene-=2.5*h;o.fun-=2*h}
 NEEDS.forEach(k=>o[k]=clamp(o[k],0,100));return o}
// 去朋友家站在門口旁邊一格，不要和主人疊在一起
const visitSpot=id=>{const d=door(id);return [d[0]+1,d[1]]};
const placeName=(p,R)=>p&&p.startsWith("home:")?((R&&R[p.slice(5)]||{}).name||"")+" 家":(PLACES[p]||{}).name||"路上";

if(typeof module!=="undefined")module.exports={T,COLS,ROWS,IDS,HOMES,PLACES,door,visitSpot,blocked,bfs,placeAt,tickLocal,isRoad};
if(typeof document!=="undefined")addEventListener("DOMContentLoaded",init);

function init(){
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const toast=t=>{const el=$("toast");el.textContent=t;el.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("on"),2600)};
const SKIN=["#f1c9a5","#e0ac7e","#c68a5a","#8d5a3a"],HAIR=["#222222","#5a3a1a","#a0522d","#d9b26a","#c0c0c0","#c0392b"],SHIRT=["#d9534f","#3b7dd8","#b45cc4","#8b5a2b","#2e9e5b","#d8901a","#333a44","#f0f0f0"],STYLE=["短髮","長髮","光頭","帽子"];
let S=null,R={},offset=0,me=null,pin=null,sel=null,zoomFar=false,camFree=false,busy=false,lastSeen=null;
const walkers={};// 每個人畫面上的位置與正在走的路
const now=()=>Date.now()+offset;
const taipeiHour=()=>new Date(now()+8*36e5).getUTCHours();
const isNight=()=>{const h=taipeiHour();return h>=19||h<6};

// ── 登入 ──
function saveAuth(){try{localStorage.setItem("town-auth",JSON.stringify({me,pin}))}catch(e){}}
function loadAuth(){try{return JSON.parse(localStorage.getItem("town-auth")||"null")}catch(e){return null}}
async function refresh(){const st=await rpc("town_state");apply(st)}
function apply(st){S=st;offset=Date.parse(st.now)-Date.now();R={};st.residents.forEach(r=>{R[r.id]=r;const w=walkers[r.id];
  if(!w)walkers[r.id]={x:r.x,y:r.y,path:[]};else if(r.id!=me&&(Math.abs(w.tx-r.x)>.01||Math.abs(w.ty-r.y)>.01||w.tx==null)){const p=bfs([Math.round(w.x),Math.round(w.y)],[Math.round(r.x),Math.round(r.y)]);w.path=p?p.slice(1):[[r.x,r.y]]}
  const ww=walkers[r.id];ww.tx=r.x;ww.ty=r.y});renderFeed();renderPanel();renderNeeds()}
function showLogin(){$("login").classList.remove("hide");$("game").classList.add("hide");$("lg").innerHTML=`<p class="mut">你是哪一位？</p><div class="who">${IDS.map(id=>{const r=R[id]||{name:id};return `<button data-id="${id}"><canvas width="40" height="44" data-look='${esc(JSON.stringify(r.look||{}))}' data-rid="${id}"></canvas><b>${esc(r.name)}</b><small>${r.joined?"已入住":"還沒入住"}</small></button>`}).join("")}</div>`;
 $("lg").querySelectorAll("canvas").forEach(c=>{const l=JSON.parse(c.dataset.look);miniPerson(c,Object.keys(l).length?l:{skin:SKIN[0],hair:"#999",shirt:"#bbb",style:"短髮"})});
 $("lg").querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>pinStep(b.dataset.id))}
function pinStep(id){const r=R[id],first=!r.joined;let look=r.look&&r.look.skin?r.look:{skin:SKIN[0],hair:HAIR[0],shirt:SHIRT[IDS.indexOf(id)],style:"短髮"};
 $("lg").innerHTML=`<p><b>${esc(r.name)}</b>${first?"，歡迎搬進小豬鎮！":""}</p>
  ${first?`<label>邀請碼（問 Jacky）<input id="inv" autocomplete="off" maxlength="12" style="text-transform:uppercase"></label>`:""}
  <label>${first?"設定 4 位數密碼（之後登入用）":"4 位數密碼"}<input id="pin" inputmode="numeric" pattern="\\d*" maxlength="4" autocomplete="off"></label>
  ${first?`<div id="lk"></div>`:""}<p class="err" id="lerr"></p>
  <div class="row"><button id="back">← 換人</button><button class="pri" id="go">${first?"搬進去":"進入小鎮"}</button></div>`;
 if(first)lookPicker($("lk"),look,l=>look=l);
 $("back").onclick=showLogin;$("pin").focus();
 $("go").onclick=async()=>{const p=$("pin").value.trim();if(!/^\d{4}$/.test(p)){$("lerr").textContent="密碼要是 4 位數字";return}
  $("go").disabled=true;try{const res=await rpc("town_login",{rid:id,pin:p,invite:first?$("inv").value.trim().toUpperCase():null,new_look:first?look:null});
   me=id;pin=p;lastSeen=res.last_seen;saveAuth();await enter()}catch(e){$("lerr").textContent=e.message;$("go").disabled=false}}}
function lookPicker(el,look,cb){const row=(k,arr,label)=>`<div class="lrow"><span>${label}</span>${arr.map(v=>k=="style"?`<button class="sw${look[k]==v?" on":""}" data-k="${k}" data-v="${v}">${v}</button>`:`<button class="sw dot${look[k]==v?" on":""}" data-k="${k}" data-v="${v}" style="background:${v}" aria-label="${label}"></button>`).join("")}</div>`;
 const draw=()=>{el.innerHTML=`<div class="lookbox"><canvas id="lkcv" width="80" height="88"></canvas><div>${row("skin",SKIN,"膚色")}${row("hair",HAIR,"髮色")}${row("style",STYLE,"髮型")}${row("shirt",SHIRT,"衣服")}</div></div>`;
  miniPerson($("lkcv"),look);el.querySelectorAll(".sw").forEach(b=>b.onclick=()=>{look={...look,[b.dataset.k]:b.dataset.v};cb(look);draw()})};draw()}
async function enter(){await refresh();$("login").classList.add("hide");$("game").classList.remove("hide");camFree=false;
 const w=walkers[me];cam.x=w.x*T;cam.y=w.y*T;resize();
 const mine=(S.events||[]).filter(e=>e.target==me&&(!lastSeen||e.at>lastSeen));
 if(mine.length){$("away").classList.remove("hide");$("away").innerHTML=`<b>你不在的時候</b>${mine.slice(0,6).map(e=>`<p>${esc(e.msg)}</p>`).join("")}<button id="awayok">知道了</button>`;$("awayok").onclick=()=>$("away").classList.add("hide")}
 else $("away").classList.add("hide")}

// ── 動作 ──
async function act(a,extra={}){if(busy)return;busy=true;renderPanel();try{const st=await rpc("town_act",{rid:me,pin,act:a,...extra});apply(st)}catch(e){toast(e.message)}busy=false;renderPanel()}
function walkTo(dest,d){const w=walkers[me],p=bfs([Math.round(w.x),Math.round(w.y)],d);if(!p){toast("走不到那裡");return}
 w.path=p.slice(1);w.dest=dest;w.goal=d;camFree=false;R[me].place="walking";renderPanel()}
function arrived(w){const d=w.dest;w.dest=null;act("move",{px:w.goal[0],py:w.goal[1],dest:d})}

// ── 下方面板：依所在地點顯示可以做的事 ──
function btn(label,sub,fn,dis){return {label,sub,fn,dis}}
function renderPanel(){if(!S||!me)return;const r=tickLocal(R[me],now()),p=r.place,list=[];let title="",note="";
 if(walkers[me]&&walkers[me].path.length){title="走路中…";note="到了就可以做事"}
 else if(r.sleeping){title=`在${placeName(p,R)}睡覺 💤`;list.push(btn("起床","",()=>act("wake")))}
 else if(p=="home:"+me){title="你家";list.push(btn("吃飯","飽足 +40 · €10",()=>act("eat")),btn("上廁所","膀胱回滿",()=>act("toilet")),btn("洗澡","清潔回滿",()=>act("shower")),btn("看電視","心情 +25",()=>act("tv")),btn("睡覺","精力慢慢回來",()=>act("sleep")))}
 else if(p&&p.startsWith("home:")){const id=p.slice(5),t=tickLocal(R[id],now());title=`${t.name} 家`;
  if(!t.joined)note=`${t.name} 還沒搬進來`;else if(t.place!=p)note=`${t.name} 不在家，在${placeName(t.place,R)}`;
  else{note=`${t.name}${t.sleeping?" 在睡覺":""}：飽足 ${Math.round(t.hunger)}、清潔 ${Math.round(t.hygiene)}、心情 ${Math.round(t.fun)}`;
   list.push(btn("煮飯給他","他飽足 +35 · €10",()=>act("feed",{target:id})),btn("幫他洗澡","他清潔 +45",()=>act("wash",{target:id})));
   if(t.sleeping)list.push(btn("叫醒他","",()=>act("wakeup",{target:id})));
   list.push(btn("串門子","兩人心情 +15",()=>act("visit",{target:id})),btn("惡作劇","放個臭屁 💨",()=>act("prank",{target:id})))}}
 else if(p=="restaurant"){title="餐廳";list.push(btn("吃一頓","飽足 +55 · 心情 +10 · €30",()=>act("dine")))}
 else if(p=="office"){title="公司";list.push(btn("打工","+€120 · 累",()=>act("work")))}
 else if(p=="park"||p=="plaza"){title=placeName(p);list.push(btn("玩一下","心情 +20",()=>act("play")))}
 else if(p=="market"){title="超市";list.push(btn("逛逛","心情 +6",()=>act("browse")));note="買東西、送禮下一版開放"}
 else{title="路上";note="點地圖上的房子或地點，就會走過去"}
 if(sel&&sel!=me){const t=tickLocal(R[sel],now());note=`${t.name}：在${placeName(t.place,R)}${t.sleeping?"睡覺":""} · 飽足 ${Math.round(t.hunger)} · 清潔 ${Math.round(t.hygiene)} · 心情 ${Math.round(t.fun)}`;
  list.unshift(btn(`走去 ${t.name} 家`,"",()=>{sel=null;walkTo("home:"+t.id,visitSpot(t.id))}))}
 $("here").textContent=title;$("note").textContent=note;
 // 內容沒變就不重畫，避免按到一半按鈕被換掉
 const html=list.map((b,i)=>`<button data-i="${i}" ${busy?"disabled":""}><b>${b.label}</b>${b.sub?`<small>${b.sub}</small>`:""}</button>`).join("");
 panelFns=list;if(html!=lastPanel){lastPanel=html;$("acts").innerHTML=html;$("acts").querySelectorAll("button").forEach(b=>b.onclick=()=>panelFns[b.dataset.i].fn())}}
let lastPanel="",panelFns=[];
function renderNeeds(){if(!S||!me)return;const r=tickLocal(R[me],now());
 $("needs").innerHTML=NEEDS.map(k=>{const v=Math.round(r[k]),[ic,nm]=NEED_INFO[k];return `<div class="need${v<20?" low":""}" title="${nm} ${v}"><span>${ic}</span><i><b style="width:${v}%;background:${v<20?"var(--bad)":v<50?"var(--warn)":"var(--good)"}"></b></i><small>${nm} ${v}</small></div>`}).join("")+`<div class="need money"><span>💰</span><small>€${r.money}</small></div>`}
function renderFeed(){const ev=(S&&S.events)||[];const fmt=a=>{const d=new Date(Date.parse(a)+8*36e5),t=new Date(now()+8*36e5);const hm=`${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`;return d.toISOString().slice(0,10)==t.toISOString().slice(0,10)?hm:`${d.getUTCMonth()+1}/${d.getUTCDate()} ${hm}`};
 $("feed").innerHTML=ev.length?ev.slice(0,30).map(e=>`<p class="${e.target==me?"mine":""}"><span>${fmt(e.at)}</span>${esc(e.msg)}</p>`).join(""):`<p class="mut">小鎮還很安靜。</p>`}

// ── 畫面：靜態地圖畫一次（白天、晚上各一張），動態的人與噴水池每幀畫 ──
const cv=$("cv"),g=cv.getContext("2d"),cam={x:0,y:0,s:1};let maps={};
const rnd=(()=>{let s=7;return()=>(s=(s*9301+49297)%233280)/233280})();
const grassV=[...Array(ROWS)].map(()=>[...Array(COLS)].map(()=>rnd()));
const trees=[];for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++)if(!blocked(i,j)&&!isRoad(i,j)&&!inRect(i,j,PLACES.plaza.r)&&!inRect(i,j,PLACES.park.r)&&grassV[j][i]<.1&&!IDS.some(id=>{const d=door(id);return Math.abs(d[0]-i)<=1&&Math.abs(d[1]-j)<=1}))trees.push([i,j]);
[[26,18],[28,18],[31,18],[33,18],[27,20],[32,20]].forEach(t=>trees.push(t));
function buildMap(night){const c=document.createElement("canvas");c.width=COLS*T;c.height=ROWS*T;const m=c.getContext("2d");
 const sign=(t,x,y)=>{m.font="600 14px sans-serif";const w=m.measureText(t).width+14;m.fillStyle="rgba(20,20,20,.8)";m.fillRect(x-w/2,y-11,w,22);m.fillStyle="#fff";m.textAlign="center";m.textBaseline="middle";m.fillText(t,x,y+1)};
 const win=(x,y)=>{m.fillStyle=night?"#ffd76a":"#bfe3ff";m.fillRect(x,y,16,14);m.fillStyle="rgba(255,255,255,.5)";m.fillRect(x,y,16,3);m.fillStyle="#3a3a3a";m.fillRect(x+7,y,2,14)};
 for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++){const v=grassV[j][i];m.fillStyle=v<.5?"#7cc46a":"#74bb62";m.fillRect(i*T,j*T,T,T);if(v>.92){m.fillStyle="#f5f0a0";m.fillRect(i*T+10,j*T+12,4,4)}}
 m.fillStyle="#8d8d8d";for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++)if(isRoad(i,j))m.fillRect(i*T,j*T,T,T);
 m.fillStyle="#e8e8e8";for(let i=0;i<COLS*T;i+=36){m.fillRect(i,7*T-1,18,3);m.fillRect(i,16*T-1,18,3)}for(let j=0;j<6*T;j+=36){m.fillRect(17*T-1,j,3,18)}for(let j=17*T;j<ROWS*T;j+=36)m.fillRect(17*T-1,j,3,18);
 const [px,py,pw,ph]=PLACES.plaza.r;for(let j=py;j<py+ph;j++)for(let i=px;i<px+pw;i++){m.fillStyle=(i+j)%2?"#cbbf9f":"#d9cfb4";m.fillRect(i*T,j*T,T,T)}
 m.fillStyle="#5aa84f";const [qx,qy,qw,qh]=PLACES.park.r;m.fillRect(qx*T,qy*T,qw*T,qh*T);m.fillStyle="#d9cfb4";m.fillRect(qx*T,19*T+10,qw*T,12);m.fillStyle="#8b5a2b";m.fillRect(30*T,18*T+4,44,10);m.fillRect(30*T+4,18*T+14,4,8);m.fillRect(30*T+36,18*T+14,4,8);
 IDS.forEach(id=>{const [hx,hy]=HOMES[id],X=hx*T,Y=hy*T,W=5*T;m.fillStyle="rgba(0,0,0,.18)";m.fillRect(X+8,Y+T+10,W,3*T);m.fillStyle="#f4ead6";m.fillRect(X,Y+T,W,3*T-6);
  m.fillStyle=ROOF[id];m.fillRect(X-8,Y,W+16,T+14);m.fillStyle="rgba(0,0,0,.15)";for(let k=0;k<W+16;k+=12)m.fillRect(X-8+k,Y,6,T+14);m.fillStyle="rgba(255,255,255,.25)";m.fillRect(X-8,Y,W+16,4);
  win(X+20,Y+T+26);win(X+W-36,Y+T+26);m.fillStyle="#7a4a24";m.fillRect(X+W/2-11,Y+3*T+4,22,T-10);m.fillStyle="#e0b050";m.fillRect(X+W/2+5,Y+3*T+18,3,3);
  m.fillStyle="#cbbf9f";m.fillRect(X+W/2-10,Y+4*T,20,T)});
 const bld=(k,wall,roof,deco)=>{const [x,y,w,h]=PLACES[k].r,X=x*T,Y=y*T,W=w*T,H=h*T;m.fillStyle="rgba(0,0,0,.18)";m.fillRect(X+8,Y+16,W,H);m.fillStyle=wall;m.fillRect(X,Y+14,W,H-14);m.fillStyle=roof;m.fillRect(X-6,Y,W+12,20);deco(X,Y,W,H)};
 bld("office","#b8c4cf","#5f6b78",(X,Y,W,H)=>{for(let a=0;a<5;a++)for(let b=0;b<3;b++)win(X+16+a*40,Y+36+b*40);m.fillStyle="#555";m.fillRect(X+W/2-14,Y+H-36,28,36)});
 bld("restaurant","#fff3e0","#c0392b",(X,Y,W,H)=>{for(let k=0;k<W;k+=24){m.fillStyle=(k/24)%2?"#fff":"#e74c3c";m.fillRect(X+k,Y+20,24,16)}win(X+20,Y+60);win(X+W-36,Y+60);m.fillStyle="#7a4a24";m.fillRect(X+W/2-12,Y+H-44,24,44)});
 bld("market","#eef7ea","#2e8b57",(X,Y,W,H)=>{m.fillStyle=night?"#ffe9a8":"#cfeefc";m.fillRect(X+14,Y+44,W-28,46);m.fillStyle="#2e8b57";for(let k=X+14;k<X+W-14;k+=28)m.fillRect(k,Y+44,3,46);m.fillStyle="#7a4a24";m.fillRect(X+W/2-14,Y+H-44,28,44)});
 trees.forEach(([i,j])=>{const x=i*T+16,y=j*T+18;m.fillStyle="rgba(0,0,0,.2)";m.beginPath();m.ellipse(x+4,y+12,14,5,0,0,7);m.fill();m.fillStyle="#6b4423";m.fillRect(x-3,y,6,12);m.fillStyle=night?"#2f6b3a":"#3f9a4c";m.beginPath();m.arc(x,y-4,14,0,7);m.fill();m.fillStyle=night?"#3d7f48":"#5cbf63";m.beginPath();m.arc(x-4,y-9,7,0,7);m.fill()});
 IDS.forEach(id=>{const [hx,hy]=HOMES[id];sign((R[id]?R[id].name:id)+" 的家",hx*T+2.5*T,hy*T+T/2+6)});
 sign("公司",29.5*T,10);sign("餐廳",5*T,9*T+10);sign("超市",28*T,9*T+10);sign("公園",29.5*T,17*T+12);sign("小豬廣場",17*T,8*T+14);
 if(night){m.fillStyle="rgba(18,28,78,.45)";m.fillRect(0,0,c.width,c.height);IDS.forEach(id=>{const [hx,hy]=HOMES[id];m.fillStyle="rgba(255,215,106,.4)";m.fillRect(hx*T+16,hy*T+T+22,24,22);m.fillRect(hx*T+5*T-40,hy*T+T+22,24,22)})}
 return c}
function person(x,y,look,tk,moving,label,isMe,state){const u=1.6,b=moving?Math.floor(tk/7)%2:0,L=look&&look.skin?look:{skin:"#f1c9a5",hair:"#999",shirt:"#bbb",style:"短髮"};
 if(isMe){g.strokeStyle="#ffd23f";g.lineWidth=3;g.beginPath();g.ellipse(x,y+12*u,11*u,4*u,0,0,7);g.stroke()}
 g.fillStyle="rgba(0,0,0,.25)";g.fillRect(x-5*u,y+10*u,10*u,3*u);
 if(state.sleeping){g.fillStyle=L.shirt;g.fillRect(x-9*u,y+2*u,14*u,7*u);g.fillStyle=L.skin;g.fillRect(x+5*u,y+2*u,7*u,7*u);g.fillStyle=L.hair;g.fillRect(x+10*u,y+2*u,2*u,7*u);g.font="bold 16px sans-serif";g.fillStyle="#fff";g.fillText("Zz",x+14*u,y-6*u+Math.sin(tk/20)*3)}
 else{g.fillStyle="#2b2b3a";g.fillRect(x-4*u,y+5*u,3*u,(6-b*2)*u);g.fillRect(x+1*u,y+5*u,3*u,(4+b*2)*u);g.fillStyle=L.shirt;g.fillRect(x-5*u,y-3*u,10*u,9*u);g.fillStyle=L.skin;g.fillRect(x-4*u,y-11*u,8*u,8*u);
  g.fillStyle=L.hair;if(L.style=="長髮"){g.fillRect(x-5*u,y-12*u,10*u,3*u);g.fillRect(x-5*u,y-10*u,2*u,8*u);g.fillRect(x+3*u,y-10*u,2*u,8*u)}else if(L.style=="帽子"){g.fillRect(x-5*u,y-13*u,10*u,3*u);g.fillRect(x-6*u,y-10*u,12*u,2*u)}else if(L.style!="光頭")g.fillRect(x-4*u,y-12*u,8*u,3*u);
  g.fillStyle="#222";g.fillRect(x-2*u,y-8*u,u,2*u);g.fillRect(x+2*u,y-8*u,u,2*u)}
 if(state.stink){g.strokeStyle="#7bd36b";g.lineWidth=2;for(let k=-1;k<=1;k++){g.beginPath();for(let s=0;s<10;s++)g.lineTo(x+k*8*u+Math.sin(tk/6+s)*2,y-14*u-s*2.2);g.stroke()}}
 g.font="600 13px sans-serif";g.textAlign="center";g.textBaseline="middle";const tag=label+(state.hungry?" 🍚":""),w=g.measureText(tag).width+10;g.fillStyle=isMe?"rgba(160,110,0,.9)":"rgba(0,0,0,.65)";g.fillRect(x-w/2,y-30*u,w,18);g.fillStyle="#fff";g.fillText(tag,x,y-30*u+9)}
function miniPerson(c,look){const m=c.getContext("2d");m.clearRect(0,0,c.width,c.height);const s=c.width/40;m.save();m.scale(s,s);
 const L=look;m.fillStyle="#2b2b3a";m.fillRect(14,32,5,8);m.fillStyle="#2b2b3a";m.fillRect(21,32,5,8);m.fillStyle=L.shirt;m.fillRect(12,20,16,14);m.fillStyle=L.skin;m.fillRect(13,6,14,14);m.fillStyle=L.hair;
 if(L.style=="長髮"){m.fillRect(11,4,18,5);m.fillRect(11,8,3,14);m.fillRect(26,8,3,14)}else if(L.style=="帽子"){m.fillRect(11,2,18,5);m.fillRect(9,7,22,3)}else if(L.style!="光頭")m.fillRect(13,4,14,5);m.fillStyle="#222";m.fillRect(17,12,2,3);m.fillRect(22,12,2,3);m.restore()}
let W=0,Hh=0,dpr=1;
function resize(){const box=$("stage");dpr=Math.min(2,devicePixelRatio||1);W=box.clientWidth;Hh=Math.round(Math.min(innerHeight*.58,Math.max(300,W*.8)));cv.width=W*dpr;cv.height=Hh*dpr;cv.style.height=Hh+"px";
 cam.s=zoomFar?Math.min(W/(COLS*T),Hh/(ROWS*T)):W/((W<600?11:17)*T)}
addEventListener("resize",resize);
let tk=0,last=performance.now();
function frame(t){const dt=Math.min(.1,(t-last)/1000);last=t;tk++;requestAnimationFrame(frame);if(!S||!me||$("game").classList.contains("hide"))return;
 const night=isNight(),key=night?"n":"d";if(!maps[key])maps[key]=buildMap(night);
 for(const id of IDS){const w=walkers[id];if(!w||!w.path.length)continue;const [nx,ny]=w.path[0],dx=nx-w.x,dy=ny-w.y,d=Math.hypot(dx,dy),sp=4.5*dt;w.moving=true;
  if(d<=sp){w.x=nx;w.y=ny;w.path.shift();if(!w.path.length){w.moving=false;if(id==me&&w.dest)arrived(w)}}else{w.x+=dx/d*sp;w.y+=dy/d*sp}}
 const mw=walkers[me];if(!camFree){cam.x+=((mw.x+.5)*T-cam.x)*.12;cam.y+=((mw.y+.5)*T-cam.y)*.12}
 const vw=W/cam.s,vh=Hh/cam.s;let ox=clamp(cam.x-vw/2,0,Math.max(0,COLS*T-vw)),oy=clamp(cam.y-vh/2,0,Math.max(0,ROWS*T-vh));if(vw>COLS*T)ox=(COLS*T-vw)/2;if(vh>ROWS*T)oy=(ROWS*T-vh)/2;cam.ox=ox;cam.oy=oy;
 g.setTransform(1,0,0,1,0,0);g.fillStyle="#3d6b35";g.fillRect(0,0,cv.width,cv.height);g.setTransform(dpr*cam.s,0,0,dpr*cam.s,-ox*dpr*cam.s,-oy*dpr*cam.s);g.imageSmoothingEnabled=false;g.drawImage(maps[key],0,0);
 const fx=17*T,fy=11.5*T;g.fillStyle="#9a9a9a";g.beginPath();g.arc(fx,fy,48,0,7);g.fill();g.fillStyle="#4aa3e0";g.beginPath();g.arc(fx,fy,40,0,7);g.fill();g.strokeStyle="#bfe6ff";g.lineWidth=2;g.beginPath();g.arc(fx,fy,18+(tk%50)/2.2,0,7);g.stroke();
 g.fillStyle="#f6a5c0";g.beginPath();g.arc(fx,fy-4,15,0,7);g.fill();g.fillRect(fx-15,fy-21,8,9);g.fillRect(fx+7,fy-21,8,9);g.fillStyle="#ec7fa6";g.fillRect(fx-7,fy-2,14,9);g.fillStyle="#8a3a55";g.fillRect(fx-4,fy+1,3,3);g.fillRect(fx+2,fy+1,3,3);g.fillStyle="#222";g.fillRect(fx-8,fy-11,3,3);g.fillRect(fx+5,fy-11,3,3);
 g.fillStyle="#bfe6ff";g.fillRect(fx-1,fy-26-((tk%30)/30)*16,3,5);
 // 人：依 y 排序，前面的蓋住後面的；在家睡覺的人在屋裡看不到
 const list=IDS.filter(id=>R[id]&&R[id].joined).map(id=>({id,w:walkers[id],r:tickLocal(R[id],now())})).filter(o=>!(o.r.sleeping&&o.r.place=="home:"+o.id&&!o.w.path.length)).sort((a,b)=>a.w.y-b.w.y);
 for(const o of list)person((o.w.x+.5)*T,(o.w.y+.5)*T,o.r.look,tk,o.w.moving,o.r.name,o.id==me,{sleeping:o.r.sleeping&&!o.w.path.length,stink:o.r.hygiene<25,hungry:o.r.hunger<20});
 IDS.forEach(id=>{const r=R[id];if(r&&r.joined&&r.sleeping&&r.place=="home:"+id){const [hx,hy]=HOMES[id];g.font="bold 18px sans-serif";g.fillStyle="#fff";g.textAlign="center";g.fillText("💤",hx*T+4.2*T,hy*T+T+4+Math.sin(tk/25)*4)}});
 if(tk%30==0){renderNeeds();if(!walkers[me].path.length)renderPanel()}}
requestAnimationFrame(frame);

// ── 點地圖：拖曳＝移動視角，點一下＝走過去或看那個人 ──
let down=null;
cv.addEventListener("pointerdown",e=>{down={x:e.clientX,y:e.clientY,ox:cam.x,oy:cam.y,moved:false};cv.setPointerCapture(e.pointerId)});
cv.addEventListener("pointermove",e=>{if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.hypot(dx,dy)>8){down.moved=true;camFree=true;cam.x=down.ox-dx/cam.s;cam.y=down.oy-dy/cam.s}});
cv.addEventListener("pointerup",e=>{if(!down)return;const d=down;down=null;if(d.moved||!S)return;const rc=cv.getBoundingClientRect(),wx=(e.clientX-rc.left)/cam.s+cam.ox,wy=(e.clientY-rc.top)/cam.s+cam.oy,tx=Math.floor(wx/T),ty=Math.floor(wy/T);
 const hit=IDS.find(id=>id!=me&&R[id]&&R[id].joined&&Math.hypot((walkers[id].x+.5)*T-wx,(walkers[id].y+.2)*T-wy)<T*.8);
 if(hit){sel=sel==hit?null:hit;renderPanel();return}sel=null;
 if(R[me].sleeping){toast("先起床才能出門");return}
 const p=placeAt(tx,ty);if(!p){toast("那裡走不過去");return}walkTo(p.dest,p.dest.startsWith("home:")&&p.dest!="home:"+me?visitSpot(p.dest.slice(5)):p.door)});
$("zoom").onclick=()=>{zoomFar=!zoomFar;$("zoom").textContent=zoomFar?"🔍 拉近":"🗺️ 看全鎮";camFree=zoomFar;resize()};
$("home").onclick=()=>{camFree=false};
$("logout").onclick=()=>{try{localStorage.removeItem("town-auth")}catch(e){}me=null;pin=null;showLogin()};
$("relook").onclick=()=>{let look={...R[me].look};$("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>換造型</h2><div id="lk2"></div><div class="row"><button id="mc">取消</button><button class="pri" id="ms">儲存</button></div>`;
 lookPicker($("lk2"),look,l=>look=l);$("mc").onclick=()=>$("modal").classList.add("hide");$("ms").onclick=async()=>{try{await rpc("town_login",{rid:me,pin,new_look:look});await refresh();$("modal").classList.add("hide");toast("換好了")}catch(e){toast(e.message)}}};
$("report").onclick=report;

// ── 小豬鎮日報：做成一張圖，長按儲存或下載後貼到 WeChat ──
function report(){const c=document.createElement("canvas");c.width=1080;c.height=1350;const m=c.getContext("2d"),day=new Date(now()+8*36e5).toISOString().slice(0,10);
 m.fillStyle="#fbf5e9";m.fillRect(0,0,1080,1350);m.fillStyle="#f6a5c0";m.fillRect(0,0,1080,200);m.fillStyle="#5a2338";m.font="700 72px sans-serif";m.textAlign="center";m.fillText("🐷 小豬鎮日報",540,110);m.font="500 34px sans-serif";m.fillText(day.replace(/-/g," / "),540,165);
 const today=(S.events||[]).filter(e=>new Date(Date.parse(e.at)+8*36e5).toISOString().slice(0,10)==day).reverse();
 m.textAlign="left";m.fillStyle="#3a2a20";m.font="700 40px sans-serif";m.fillText("今日大事",70,280);m.font="400 34px sans-serif";
 const lines=today.length?today.slice(-10).map(e=>{const d=new Date(Date.parse(e.at)+8*36e5);return `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}　${e.msg}`}):["今天小鎮很平靜，大家都在家耍廢。"];
 lines.forEach((t,i)=>{m.fillStyle=i%2?"#3a2a20":"#6b4a35";m.fillText(t.length>26?t.slice(0,26)+"…":t,70,345+i*52)});
 const y0=880;m.fillStyle="#3a2a20";m.font="700 40px sans-serif";m.fillText("鎮民現況",70,y0);m.font="400 32px sans-serif";
 IDS.map(id=>tickLocal(R[id],now())).filter(r=>r.joined).forEach((r,i)=>{const y=y0+60+i*58,worst=NEEDS.slice().sort((a,b)=>r[a]-r[b])[0],[ic,nm]=NEED_INFO[worst];
  m.fillStyle="#3a2a20";m.fillText(`${r.name}　在${placeName(r.place,R)}${r.sleeping?"睡覺":""}`,70,y);m.fillStyle=r[worst]<25?"#c0392b":"#6b4a35";m.fillText(`${ic} ${nm}最低 ${Math.round(r[worst])}`,700,y)});
 m.fillStyle="#9a7a60";m.font="400 26px sans-serif";m.textAlign="center";m.fillText("jackycheung0408.github.io/life-simulator/town",540,1310);
 const url=c.toDataURL("image/png");$("modal").classList.remove("hide");
 $("mbody").innerHTML=`<h2>小豬鎮日報</h2><img src="${url}" alt="小豬鎮日報" style="width:100%;border-radius:8px"><p class="mut">手機：長按圖片儲存，再傳到 WeChat 群組。</p><div class="row"><button id="mc">關閉</button><button id="mcp">複製圖片</button><button class="pri" id="mdl">下載</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");$("mdl").onclick=()=>{const a=document.createElement("a");a.href=url;a.download=`小豬鎮日報-${day}.png`;a.click()};
 $("mcp").onclick=()=>c.toBlob(async b=>{try{await navigator.clipboard.write([new ClipboardItem({"image/png":b})]);toast("已複製，可以貼到 WeChat")}catch(e){toast("這個瀏覽器不能複製圖片，請長按圖片儲存")}})}

// ── 開始：先讀小鎮，有存密碼就自動登入；每 15 秒同步一次 ──
(async()=>{try{await refresh()}catch(e){$("lg").innerHTML=`<p class="err">${esc(e.message)}</p>`;return}
 const a=loadAuth();if(a&&a.me&&R[a.me]&&R[a.me].joined){try{const res=await rpc("town_login",{rid:a.me,pin:a.pin});me=a.me;pin=a.pin;lastSeen=res.last_seen;await enter();}catch(e){showLogin()}}else showLogin();
 setInterval(()=>{if(document.visibilityState=="visible"&&S)refresh().catch(()=>{})},15000)})();
}
