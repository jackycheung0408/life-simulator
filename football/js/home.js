// 首頁：抽卡、選項、存檔、排行榜
// ── 首頁 ──
const cfg={w:"world",pos:"FW",mode:"real",card:null,stars:"real"};
// ── 抽卡：稀有度決定潛力範圍 ──
const RARITY=[["銅卡",60,45,58,"#c98a4b"],["銀卡",28,58,68,"#c9d3d8"],["金卡",10,68,80,"#ffd23f"],["傳奇卡",2,80,92,"#b07cff"]];
let draws=3,redraws=3;const drawn=[];
function drawCard(){if(!draws)return;draws--;const r=wpick(RARITY,x=>x[1]),pot=Math.round(r[2]+R()*(r[3]-r[2])),flair=pick(["天生射手的嗅覺","大局觀","爆發力","不服輸的個性","左腳魔法","鋼鐵般的意志","驚人的彈跳","冷靜的頭腦"]);
 drawn.push({r:r[0],pot,flair,c:r[4]});if(drawn.length==1||pot>Math.max(...drawn.slice(0,-1).map(x=>x.pot)))cfg.card=drawn.length-1;renderCards(true)}
function renderCards(anim){
 const stars={"銅卡":1,"銀卡":2,"金卡":3,"傳奇卡":4};
 $("cards").innerHTML=[0,1,2].map(i=>{const d=drawn[i];if(!d)return `<button class="gc back" data-draw="1"><div class="gc-in"><div class="gc-logo">⚽</div><div class="gc-q">?</div><small>點我翻牌</small></div></button>`;
  const sel=cfg.card===i;return `<button class="gc r${stars[d.r]}${sel?" sel":""}${anim&&i==drawn.length-1?" flip":""}" data-i="${i}"><div class="gc-in"><div class="gc-top"><span>${d.r}</span><span>${"★".repeat(stars[d.r])}</span></div><div class="gc-num">${d.pot}</div><div class="gc-lab">POTENTIAL 潛力上限</div><div class="gc-flair">${d.flair}</div></div><i class="gc-shine"></i>${sel?'<em class="gc-rib">使用中</em>':""}</button>`}).join("");
 $("cards").querySelectorAll(".gc").forEach(b=>b.onclick=()=>{if(b.dataset.draw){drawCard();return}cfg.card=+b.dataset.i;renderCards()});
 $("redraw").classList.toggle("hide",draws>0||!redraws);$("redraw").textContent=`🔄 整組重抽（還有 ${redraws} 次）`;
 $("noCard").textContent=cfg.card===null&&drawn.length?"✔ 不使用天賦卡（照真實機率）":"不使用天賦卡";
 const d=drawn[drawn.length-1];if(anim&&d)toast(`抽到${d.r}！潛力 ${d.pot}`)}
document.querySelectorAll(".md").forEach(b=>b.onclick=()=>{document.querySelectorAll(".md").forEach(x=>x.classList.remove("on"));b.classList.add("on");cfg.mode=b.dataset.v;
 $("mdTip").textContent=cfg.mode=="pro"?"保送職業模式：一定會拿到職業合約，但從哪個等級的聯賽起步、能不能踢到頂級，還是看你的能力和選擇。":"現實模式：大多數孩子會在青訓評估或試訓時被淘汰，足球生涯隨時可能結束。"});
document.querySelectorAll(".w").forEach(b=>b.onclick=()=>{document.querySelectorAll(".w").forEach(x=>x.classList.remove("on"));b.classList.add("on");cfg.w=b.dataset.v});
document.querySelectorAll(".p").forEach(b=>b.onclick=()=>{document.querySelectorAll(".p").forEach(x=>x.classList.remove("on"));b.classList.add("on");cfg.pos=b.dataset.v});
document.querySelectorAll(".s").forEach(b=>b.onclick=()=>{document.querySelectorAll(".s").forEach(x=>x.classList.remove("on"));b.classList.add("on");secPerSeason=+b.dataset.v});
document.querySelectorAll(".sp").forEach(b=>b.onclick=()=>{document.querySelectorAll(".sp").forEach(x=>x.classList.remove("on"));b.classList.add("on");mult=+b.dataset.m});
document.querySelectorAll(".st").forEach(b=>b.onclick=()=>{document.querySelectorAll(".st").forEach(x=>x.classList.remove("on"));b.classList.add("on");cfg.stars=b.dataset.v});
$("tourBtn").onclick=()=>tour(0);
const muteTxt=()=>{$("muteBtn").textContent=muted?"🔇":"🔊"};muteTxt();$("muteBtn").onclick=()=>{muted=!muted;try{localStorage.setItem("fb-mute",muted?"1":"0")}catch{}muteTxt();if(!muted)sfx("kick")};
$("pause").onclick=()=>{paused=!paused;$("pause").textContent=paused?"▶ 繼續":"⏸ 暫停"};
$("skipQ").onclick=()=>{pendingSkip=true};
$("auto").onchange=e=>{auto=e.target.checked;toast(auto?"之後的抉擇自動決定":"之後的抉擇由你決定")};
$("skipEnd").onclick=e=>{const b=e.currentTarget;if(!b.dataset.arm){b.dataset.arm=1;b.textContent="再按一次確認";setTimeout(()=>{delete b.dataset.arm;if(!toEnd)b.textContent="⏩ 跳到結局"},3000);return}
 toEnd=true;b.textContent="⏩ 快速跑完中…";const open=!$("modal").classList.contains("hide")&&[...$("choice").querySelectorAll(".opt:not([disabled])")];if(open&&open.length)pick(open).click()};
// ── 新手導覽：第一次玩時依序框出重點區塊（之後按「？」可以重看）──
const TOUR=[[".hud","時間會自己往前走","這裡是年齡和這一年的進度條。可以暫停、加速，或按「下一個抉擇」直接跳到下一個要你做決定的地方。"],
 ["#stats","你的能力","開始踢球後，六大能力（速度、射門……）決定綜合評分。小小的 ▲▼ 是今年的變化。下面還有身價、疲勞、名氣和人際關係。"],
 ["#planCard","每週訓練表","點一天就能換訓練內容（小時候是放學後的時間安排）。練什麼就長什麼，但疲勞超過 70 容易受傷；能力到上限時會提醒你改練別的。"],
 ["#mgrCard","生涯管理","想轉會、談加薪、換經紀人，從這裡主動提出。每項每季能用一次。"],
 ["#log","抉擇與紀錄","遇到抉擇時會跳出視窗，選項下方的小字是效果或成功率。你的每個選擇都會影響後面的人生，這裡會記下來。"]];
function tour(i=0,only=false){const old=document.querySelector(".tour-hi");if(old)old.classList.remove("tour-hi");$("tour")?.remove();
 if(i>=TOUR.length){paused=P?._tourPaused||false;$("pause").textContent=paused?"▶ 繼續":"⏸ 暫停";try{localStorage.setItem("fb-tour","1")}catch{}return}
 if((i==0||only)&&P){P._tourPaused=paused;paused=true}
 const [sel,t,d]=TOUR[i],el=document.querySelector(sel);
 // 還沒出現的區塊（例如嬰兒時期沒有訓練表）就跳過
 if(!el||!el.offsetParent){tour(only?TOUR.length:i+1);return}try{localStorage.setItem("fb-tour"+sel,"1")}catch{}
 el.classList.add("tour-hi");const top=document.querySelector("#game>.card");const off=sel==".hud"?0:(getComputedStyle(top).position=="sticky"?top.offsetHeight:0)+12;
 scrollTo({top:Math.max(0,el.getBoundingClientRect().top+scrollY-off),behavior:"smooth"})
 document.body.insertAdjacentHTML("beforeend",`<div id="tour"><h3>${t}</h3><p>${d}</p><div class="tn"><span>${only?"新功能":`${i+1} / ${TOUR.length}`}</span><span><button id="tSkip" class="linkbtn">略過</button> <button id="tNext" class="pri">${only?"知道了":i==TOUR.length-1?"開始踢球":"下一步"}</button></span></div></div>`);
 $("tNext").onclick=()=>tour(only?TOUR.length:i+1);$("tSkip").onclick=()=>tour(TOUR.length)}
function start(p){P=p;$("home").classList.add("hide");$("game").classList.remove("hide");scrollTo(0,0);renderPlan();render();loop();let seen=null;try{seen=localStorage.getItem("fb-tour")}catch{}if(!seen)setTimeout(()=>tour(0),400)}
$("draw").onclick=drawCard;$("redraw").onclick=()=>{if(!redraws)return;redraws--;draws=3;drawn.length=0;cfg.card=null;renderCards();toast(`重抽！還剩 ${redraws} 次機會`)};$("noCard").onclick=()=>{cfg.card=null;renderCards()};renderCards();
$("go").onclick=async()=>{const p=newPlayer(cfg.w,cfg.pos);p.mode=cfg.mode;
 if(cfg.card!==null&&drawn[cfg.card]){const d=drawn[cfg.card];p.pot=d.pot;p.talent=Math.max(30,d.pot-12);p.card=d.r;p.flair=d.flair}p.id=Date.now()+"";starsInit(p,cfg.stars);P=p;await reveal(p);say(`${p.name}出生在${p.c}。`,1);start(p)};
function loadSlot(s){if(s.plan)plan=s.plan;const p=s.P;try{starsTopUp(p)}catch(e){}p.h=Math.round(hAt(p,p.age)*10)/10; // 舊存檔可能有錯誤的身高，載入時重新計算
 if(!p.s){p.s={};SUBS.forEach(k=>p.s[k]=30)}attachA(p);if(p.club)p.clubObj=CLUBS.find(c=>c.name==p.club);$("log").innerHTML=p.log.slice(-60).reverse().map(([a,t,h])=>`<p class="${h?"hi":""}"><span class="y">${a}歲</span>${t}</p>`).join("");start(p)}
// 舊版只有一個存檔，搬到多存檔
try{const old=JSON.parse(localStorage.getItem("fb-save"));if(old&&old.P&&old.P.alive){const all=slots();old.P.id=old.P.id||"old";all[old.P.id]={...old,t:Date.now()};localStorage.setItem("fb-saves",JSON.stringify(all))}localStorage.removeItem("fb-save")}catch{}
function renderSlots(){const all=slots(),ids=Object.keys(all).filter(k=>all[k].P&&all[k].P.alive).sort((a,b)=>all[b].t-all[a].t);
 $("resume").innerHTML=ids.length?`<div class="slots"><b>繼續之前的生涯</b>${ids.map(k=>{const q=all[k].P;return `<div class="slot-row"><button class="rs" data-k="${k}">▶ ${esc(q.name)}<small>${q.age} 歲 · ${esc(q.club||q.stage||"")} · ${esc(q.c)}</small></button><button class="del" data-k="${k}" title="刪除存檔">✕</button></div>`}).join("")}</div>`:"";
 $("resume").querySelectorAll(".rs").forEach(b=>b.onclick=()=>loadSlot(slots()[b.dataset.k]));
 $("resume").querySelectorAll(".del").forEach(b=>b.onclick=()=>{if(!b.dataset.arm){b.dataset.arm=1;b.textContent="確定？";setTimeout(()=>{delete b.dataset.arm;b.textContent="✕"},3000);return}const all=slots();delete all[b.dataset.k];localStorage.setItem("fb-saves",JSON.stringify(all));renderSlots()})}
try{renderSlots()}catch{}
try{const h=JSON.parse(localStorage.getItem("fb-hof")||"[]");$("hof").innerHTML=h.length?h.map((x,i)=>`<div class="hcard ${i<3?"m"+(i+1):""}"><div class="hrank">${i<3?["🥇","🥈","🥉"][i]:"#"+(i+1)}</div><div class="hpeak"><b>${x.peak}</b><small>巔峰</small></div><div class="hmain"><div class="hname">${esc(x.name)}</div><div class="htitle">${esc(x.title)}</div><div class="hmeta">${esc(x.c)} · ${POS[x.pos]||x.pos} · ${x.y}</div><div class="hstats"><span>⚽ ${x.goals}</span><span>🏆 ${x.tro}</span><span class="hsc">評分 ${x.sc}</span></div></div></div>`).join(""):"<p class='mut'>還沒有踢完的生涯。</p>"}catch{}
$("ctry").innerHTML=`<option value="world">🎲 足球世界隨機（依足球人口）</option>`+COUNTRIES.slice().sort((a,b)=>b[2]-a[2]).map(c=>`<option value="${c[0]}">${c[0]}（國家隊強度 ${c[2]}）</option>`).join("");
$("ctry").onchange=e=>{cfg.w=e.target.value};
$("oddsTbl").innerHTML=COUNTRIES.map(c=>c[0]).map(c=>{const o=realOdds(c);return `${c}：職業球員 ${oneIn(o.pro)}、五大聯賽 ${oneIn(o.top5)}`}).join("<br>");
$("achWall").innerHTML=achWall();
$("gbCtry").innerHTML=`<option value="">其他國家…</option>`+COUNTRIES.map(c=>`<option>${c[0]}</option>`).join("");
const gbSet=c=>{gbCountry=c;document.querySelectorAll(".gbt").forEach(x=>x.classList.toggle("on",x.dataset.c===c));loadBoard()};
document.querySelectorAll(".gbt").forEach(b=>b.onclick=()=>{$("gbCtry").value="";gbSet(b.dataset.c)});$("gbCtry").onchange=e=>{if(e.target.value)gbSet(e.target.value)};loadBoard();
drawPitch(0,0);
