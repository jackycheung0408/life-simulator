// 畫面：繪圖、音效、報表、成就、生涯管理、主迴圈、結局
// ── 畫面 ──
function drawFace(cv,p){const g=cv.getContext("2d");g.clearRect(0,0,16,16);const skin={拉:"#c68a5a",歐:"#f0c8a0",英:"#f2cfaa",非:"#7a4a2a",亞:"#e8c49a",中:"#c99a6a",華:"#ecc79c"}[p.region];
 g.fillStyle=p.age>55?"#ddd":"#2a1a10";g.fillRect(4,2,8,3);g.fillStyle=skin;g.fillRect(4,4,8,7);g.fillStyle="#111";g.fillRect(6,7,1,1);g.fillRect(9,7,1,1);g.fillRect(7,9,2,1);
 g.fillStyle=p.clubObj?["#c22","#26c","#ec3","#2a2","#fff"][p.clubObj.str%5]:"#555";g.fillRect(3,11,10,5)}
// 依年紀換場景：家裡 → 公園空地 → 學校操場 → 職業球場
const SKIN={拉:"#c68a5a",歐:"#f0c8a0",英:"#f2cfaa",非:"#7a4a2a",亞:"#e8c49a",中:"#c99a6a",華:"#ecc79c"};
function drawKid(g,x,y,p,t,ball){const k=Math.max(.45,p.h/180),hh=Math.round(22*k),walk=Math.floor(t)%2;
 g.fillStyle="#2a1a10";g.fillRect(x-3,y-hh-1,7,3);g.fillStyle=SKIN[p.region];g.fillRect(x-3,y-hh+1,7,6);g.fillStyle="#111";g.fillRect(x-1,y-hh+3,1,1);g.fillRect(x+2,y-hh+3,1,1);
 const body=Math.round(hh*.45);g.fillStyle=p.age<6?"#7ac":"#d33";g.fillRect(x-4,y-hh+7,9,body);g.fillStyle="#335";g.fillRect(x-3,y-hh+7+body,3,hh-7-body-0+(walk?0:-1));g.fillRect(x+1,y-hh+7+body,3,hh-7-body+(walk?-1:0));
 if(ball){g.fillStyle="#fff";g.fillRect(x+6,y-4,4,4);g.fillStyle="#000";g.fillRect(x+7,y-3,1,1)}}
function drawPitch(prog,goals){
 if(P&&P.age<13&&!P.club){const cv=$("pitch"),g=cv.getContext("2d"),W=320,H=140,t=performance.now()/300,p=P;
  if(p.age<p.touchAge){// 家裡
   g.fillStyle="#e8d9b5";g.fillRect(0,0,W,H);g.fillStyle="#b98a5a";g.fillRect(0,H-36,W,36);g.fillStyle="#8fc4e8";g.fillRect(40,20,60,40);g.strokeStyle="#fff";g.lineWidth=3;g.strokeRect(40,20,60,40);
   g.fillStyle="#c96";g.fillRect(220,H-70,70,34);g.fillStyle="#a74";g.fillRect(220,H-76,70,8);g.fillStyle="#f6c";g.fillRect(150,H-44,10,8);
   if(p.age<2){g.fillStyle="#fff";g.fillRect(120,H-60,50,24);g.strokeStyle="#c96";g.lineWidth=2;for(let i=0;i<6;i++){g.beginPath();g.moveTo(122+i*9,H-60);g.lineTo(122+i*9,H-36);g.stroke()}g.fillStyle=SKIN[p.region];g.fillRect(138,H-52,10,8)}
   else drawKid(g,140+Math.sin(t/2)*40,H-38,p,t,false)}
  else{// 公園、巷口、學校操場
   const school=p.age>=6;g.fillStyle="#9fd3f0";g.fillRect(0,0,W,H);g.fillStyle="#8a8fa8";for(let i=0;i<5;i++)g.fillRect(10+i*64,30-i%2*12,50,50+i%2*12);g.fillStyle="#cde";for(let i=0;i<5;i++)for(let j=0;j<3;j++)g.fillRect(18+i*64+j*14,40-i%2*12,8,8);
   g.fillStyle=school?"#c9a36b":"#5aa84a";g.fillRect(0,H-50,W,50);if(school){g.strokeStyle="#fff";g.lineWidth=2;g.strokeRect(20,H-46,W-40,42)}
   g.fillStyle="#ddd";g.fillRect(W-30,H-70,4,24);g.fillRect(W-12,H-70,4,24);g.fillRect(W-30,H-72,22,4);
   drawKid(g,60+prog*(W-120),H-12,p,t,true)}
  g.fillStyle="#222";g.font="10px monospace";g.fillText(p.age<p.touchAge?"HOME":p.age<6?"PARK":"SCHOOL",8,14);return}
 drawField(prog,goals)}
function drawField(prog,goals){const cv=$("pitch"),g=cv.getContext("2d"),W=320,H=140;
 for(let i=0;i<8;i++){g.fillStyle=i%2?"#2f8a3e":"#349645";g.fillRect(i*40,0,40,H)}
 g.strokeStyle="#e8f5e8";g.lineWidth=2;g.strokeRect(6,6,W-12,H-12);g.beginPath();g.moveTo(W/2,6);g.lineTo(W/2,H-6);g.stroke();g.beginPath();g.arc(W/2,H/2,18,0,Math.PI*2);g.stroke();g.strokeRect(6,H/2-30,34,60);g.strokeRect(W-40,H/2-30,34,60);
 g.fillStyle="#fff";g.fillRect(W-8,H/2-12,4,24);
 if(!P)return;const t=performance.now()/300,bx=60+prog*(W-130)+Math.sin(t)*6,by=H/2+Math.sin(t*1.3)*30;
 // 球員
 g.fillStyle="#222";g.fillRect(bx-3,by-12,6,4);g.fillStyle={拉:"#c68a5a",歐:"#f0c8a0",英:"#f2cfaa",非:"#7a4a2a",亞:"#e8c49a",中:"#c99a6a",華:"#ecc79c"}[P.region];g.fillRect(bx-3,by-9,6,5);
 g.fillStyle=P.clubObj?["#c22","#26c","#ec3","#2a2","#fff"][P.clubObj.str%5]:"#666";g.fillRect(bx-4,by-4,8,7);g.fillStyle="#111";g.fillRect(bx-3,by+3,2,(Math.floor(t)%2)?5:4);g.fillRect(bx+1,by+3,2,(Math.floor(t)%2)?4:5);
 g.fillStyle="#fff";g.fillRect(bx+5,by+6,4,4);g.fillStyle="#000";g.fillRect(bx+6,by+7,1,1);
 // 對手
 for(let i=0;i<3;i++){const ox=W-90+i*22,oy=H/2+Math.sin(t+i*2)*40;g.fillStyle="#335";g.fillRect(ox-3,oy-4,7,7);g.fillStyle="#111";g.fillRect(ox-2,oy+3,2,4);g.fillRect(ox+1,oy+3,2,4)}
 g.fillStyle="#ffd23f";g.font="10px monospace";g.fillText(`GOAL ${goals||0}`,10,18)}
let liveGoals=0;
// ── 8-bit 音效（可靜音）──
let muted=false;try{muted=localStorage.getItem("fb-mute")=="1"}catch{}
let AC=null;function sfx(kind){if(muted||toEnd||auto||typeof AudioContext=="undefined")return;try{AC=AC||new AudioContext();const seq={whistle:[[1800,.12],[0,.05],[1800,.25]],goal:[[523,.1],[659,.1],[784,.1],[1047,.3]],concede:[[392,.15],[311,.3]],win:[[523,.12],[659,.12],[784,.12],[1047,.12],[784,.1],[1047,.4]],lose:[[440,.2],[349,.2],[262,.45]],kick:[[180,.05]]}[kind];
 let t=AC.currentTime;for(const [f,d] of seq){if(f){const o=AC.createOscillator(),g=AC.createGain();o.type=kind=="whistle"?"triangle":"square";o.frequency.value=f;g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d)}t+=d}}catch{}}
// ── 大比賽動畫：雙方各 5 人跑位、球在腳下移動，進球時閃 GOAL 和彩帶 ──
function drawMatch(ms,fx){const cv=$("pitch");if(!cv)return;const g=cv.getContext("2d"),W=320,H=140,t=performance.now()/1000;
 for(let i=0;i<8;i++){g.fillStyle=i%2?"#2f8a3e":"#349645";g.fillRect(i*40,0,40,H)}
 g.strokeStyle="#e8f5e8";g.lineWidth=2;g.strokeRect(6,6,W-12,H-12);g.beginPath();g.moveTo(W/2,6);g.lineTo(W/2,H-6);g.stroke();g.beginPath();g.arc(W/2,H/2,18,0,Math.PI*2);g.stroke();g.strokeRect(6,H/2-30,34,60);g.strokeRect(W-40,H/2-30,34,60);
 g.fillStyle="#fff";g.fillRect(4,H/2-12,4,24);g.fillRect(W-8,H/2-12,4,24);
 // 球往進攻方向來回推進
 const att=Math.sin(t*.7+ms.m)*.5+.5,bx=40+att*(W-80)+Math.sin(t*3)*8,by=H/2+Math.sin(t*1.7)*38;
 const home=P.clubObj?["#c22","#26c","#ec3","#2a2","#eee"][P.clubObj.str%5]:"#c22";
 const dude=(x,y,c,me)=>{g.fillStyle=c;g.fillRect(x-3,y-4,7,7);g.fillStyle="#111";g.fillRect(x-2,y+3,2,(Math.floor(t*6)%2)?4:3);g.fillRect(x+1,y+3,2,(Math.floor(t*6)%2)?3:4);if(me){g.fillStyle="#ffd23f";g.fillRect(x-1,y-9,3,3)}};
 for(let i=0;i<5;i++){const fx_=[.18,.35,.45,.6,.72][i],x=20+fx_*(W-40)*(.6+att*.5),y=20+i*25+Math.sin(t+i)*6;dude(Math.min(W-14,x),y,home,i==3)}
 for(let i=0;i<5;i++){const fx_=[.82,.65,.55,.4,.28][i],x=20+fx_*(W-40)*(.75+att*.3),y=24+i*24+Math.cos(t+i)*6;dude(Math.min(W-14,x),y,"#335")}
 g.fillStyle="#fff";g.fillRect(bx-2,by-2,4,4);g.fillStyle="#000";g.fillRect(bx-1,by-1,1,1);
 // 記分板
 g.fillStyle="#000a";g.fillRect(W/2-58,8,116,18);g.fillStyle="#ffd23f";g.font="bold 11px monospace";g.textAlign="center";g.fillText(`${ms.us} : ${ms.them}   ${ms.m}'`,W/2,21);g.textAlign="left";
 if(fx&&fx.until>performance.now()){const k=(fx.until-performance.now())/1200;g.fillStyle=fx.us?"#ffd23f":"#ff4d4d";g.font=`bold ${22+Math.round((1-k)*10)}px monospace`;g.textAlign="center";g.fillText(fx.us?"GOAL!":"失球…",W/2,H/2+8);g.textAlign="left";
  if(fx.us)for(let i=0;i<40;i++){g.fillStyle=["#ffd23f","#ff4d4d","#3fa7ff","#4cd964","#fff"][i%5];g.fillRect((i*37+fx.seed)%W,((i*53+(1-k)*120)%H),3,3)}}}
async function animMatch(ms,dur,fx){const end=performance.now()+dur;do{drawMatch(ms,fx);await new Promise(r=>setTimeout(r,40))}while(performance.now()<end&&!toEnd&&!pendingSkip)}
async function playPhase(ph,st,apps){
 if(toEnd)return;const p=P,total=secPerSeason*420;let w=0,last=performance.now();
 while(w<total){await new Promise(r=>setTimeout(r,50));const now=performance.now();if(!paused)w+=(now-last)*mult;last=now;if(pendingSkip||toEnd)w=total;
  const t=Math.min(1,w/total);$("ticker").textContent=`${p.y0+p.age} 球季 · ${p.phase} · 已出賽 ${st.apps} / ${apps} 場 · ${p.pos=="GK"?`零封 ${st.cleans}`:`進球 ${st.goals} · 助攻 ${st.assists}`} · 疲勞 ${Math.round(p.fat||0)}`;
  $("sFill").style.width=((ph+t)/4*100)+"%";drawPitch((ph+t)/4,st.goals)}
}
async function playSeasonVisual(apps,goals){
 if(toEnd)return;const p=P,total=secPerSeason*1000;let w=0,last=performance.now(),shown=0;
 while(w<total){await new Promise(r=>setTimeout(r,50));const now=performance.now();if(!paused)w+=(now-last)*mult;last=now;if(pendingSkip||toEnd)w=total;
  const t=Math.min(1,w/total),m=Math.min(11,Math.floor(t*10));const g2=Math.round(goals*t);
  if(g2>shown){shown=g2;toast(`⚽ 進球！本季第 ${shown} 球`)}$("ticker").textContent=`${p.y0+p.age} 球季 · 第 ${Math.round(apps*t)} 場 / ${apps} 場 · ${p.pos=="GK"?"":`進球 ${g2}`}`;
  $("sFill").style.width=t*100+"%";drawPitch(t,g2)}
}
async function quietYear(){if(toEnd||P.retired)return;const total=secPerSeason*(P.age<6?60:P.age<13?120:P.age<16?200:260);/* 童年快轉，16 歲後才是重點 */let w=0,last=performance.now();while(w<total){await new Promise(r=>setTimeout(r,50));const now=performance.now();if(!paused)w+=(now-last)*mult;last=now;if(pendingSkip||toEnd)w=total;$("sFill").style.width=Math.min(100,w/total*100)+"%";if(P.age<13)$("ticker").textContent=P.age<P.touchAge?`${P.age} 歲，還沒碰過足球`:`${P.age} 歲 · ${P.stage} · 身高 ${Math.round(P.h)} 公分`;drawPitch(Math.min(1,w/total),0)}}
function render(){try{renderMgr()}catch(e){}
 const p=P,o=ovr(p);$("ovr").textContent=p.age<p.touchAge?"??":Math.round(o);$("pos").textContent=p.age<11&&!(p.done&&p.done.pos)?"—":posCode(p);$("nm").textContent=p.name.split(" ").pop();$("age").textContent=p.age;
 $("fut").className="fut"+(o>=75?"":o>=65?" silver":" bronze");$("who").textContent=`${p.name}（${POS[p.pos]}）`;
 $("where").textContent=p.retired?`已退休 · ${p.after||""}`:p.club?`${p.club} · ${p.clubObj.lg} · 合約剩 ${Math.max(0,p.contract)} 年`:`${p.c} · ${p.stage}`;
 $("sL").textContent=`${p.age} 歲`;$("sR").textContent=`${p.age+1} 歲`;drawFace($("face"),p);
 const FIFA=p.pos=="GK"?{速度:"SPD",射門:"SHO",傳球:"KIC",盤帶:"DRI",防守:"GK",體能:"PHY"}:{速度:"PAC",射門:"SHO",傳球:"PAS",盤帶:"DRI",防守:"DEF",體能:"PHY"};
 // 數值區分成四塊：六大能力 → 基本資料 → 人際 → 特質
 const MAIN=["身價","年薪","健康","疲勞","名氣","球迷支持"];
 const CHIP_TIP={身高:"影響頭球、強壯，也影響適合的位置",位置:"決定綜合評分怎麼算；教練可能幫你改位置","逆足／花式":"逆足影響射門、傳球成功率；花式影響過人類關鍵時刻",天賦上限:"能力最高能長到哪裡；苦練、名師、大賽表現有機會提高",身價:"轉會費的參考：看能力、年齡、聯賽等級、球迷支持",年薪:"每年收入的 55% 存下來；看能力、名氣、經紀人",存款:"可以花在名醫、特訓、投資",健康:"太低會更容易受傷、提早退休",疲勞:"超過 65 受傷機率明顯升高；排休息日可以降",名氣:"影響年薪、代言、國家隊與球評邀約；沒有上限",粉絲:"社群追蹤人數；受名氣和球迷支持影響",球迷支持:"0～100；影響身價 ±20%，太低主場會噓你",宿敵:"常輸給的球隊；再遇到會打復仇戰",功課:"太低爸媽可能不讓你踢球"};
 // 每項能力佔綜合評分的比重：依目前位置的細項權重加總
 const dw=DPW[dpOf(p)],tw=Object.values(dw).reduce((a,b)=>a+b,0),share={};ATTR.forEach(k=>{share[k]=Object.keys(faceMap(p,k)).reduce((t,x)=>t+(dw[x]||0),0)/tw});
 const face=p.age<p.touchAge?`<div class="stat" style="grid-column:1/-1"><span>足球能力</span><b>還沒碰過足球</b></div>`:ATTR.map(k=>`<div class="stat" data-tip="${esc(`<b>${k} ${Math.round(p.a[k])}</b>　佔綜合評分 ${Math.round(share[k]*100)}%<br>`+Object.keys(faceMap(p,k)).map(x=>`${x} ${Math.round(p.s[x])}`).join("　"))}"><span>${FIFA[k]} ${k}<em class="wt">${Math.round(share[k]*100)}%</em></span><b>${Math.round(p.a[k])}${(()=>{const d=p.a[k]-((p.yStart||{})[k]??p.a[k]);return Math.abs(d)>=.3?` <small class="${d>0?"up":"down"}">${d>0?"▲":"▼"}${Math.abs(d).toFixed(1)}</small>`:""})()}</b><div class="bar"><i style="width:${p.a[k]}%"></i></div></div>`).join("");
 // 數值等級：一眼看出好壞
 const grade=(k,v)=>k=="名氣"?(v<20?"無名":v<60?"小有名氣":v<130?"全國知名":v<250?"國際球星":"傳奇"):k=="球迷支持"?(v<30?"低迷":v<60?"普通":v<80?"愛戴":"狂熱"):k=="健康"?(v<50?"很差":v<75?"普通":"良好"):k=="疲勞"?(v>70?"危險":v>45?"偏高":"正常"):"";
 const info=[["身高",Math.round(p.h)+" cm"],["位置",p.age<11&&!p.done?.pos?"還沒固定":posName(p)],["逆足／花式",p.age<10?"未知":`${p.wf}★／${p.sm}★`],["天賦上限",p.age<16?"？？":Math.round(p.pot)],
  ...(p.age<13?[["功課",p.age<6?"還沒上學":Math.round(p.grade||60)],["健康",Math.round(p.health)]]:[["身價",p.club?eur(value(p)):"—"],["年薪",p.club?eur(p.wage):"—"],["存款",eur(Math.max(0,p.money))],["健康",Math.round(p.health)],["疲勞",Math.round(p.fat||0)],["名氣",Math.round(p.fame)],["粉絲",fansTxt(p.fans||0)],["球迷支持",Math.round(p.pop??50)],...(p.nemesis?[["宿敵",p.nemesis]]:[])])]
  .map(([k,v])=>`<div class="chip${MAIN.includes(k)||p.age<13?"":" more"}" data-tip="${esc(CHIP_TIP[k]||k)}"><span>${k}${grade(k,+v)?`<em class="gr g-${grade(k,+v)}">${grade(k,+v)}</em>`:""}</span><b${k=="疲勞"&&v>70?' style="color:var(--ac)"':""}>${v}</b></div>`).join("");
 const rels=p.rel&&Object.keys(p.rel).length?`<div class="relbox">${Object.entries(p.rel).map(([k,r])=>`<div class="relrow"><span>${RELN[k]}<small>${r.name}${k=="coach"&&p.coachStyle?`・${p.coachStyle}`:""}</small></span><i><u style="width:${r.v}%;background:${r.v>=60?"var(--g)":r.v<35?"var(--ac)":"var(--y)"}"></u></i><em>${Math.round(r.v)}</em></div>`).join("")}</div>`:"";
 const traits=Object.keys(p.tags||{}).length?`<div class="traitbox"><span class="mut">特質</span>${Object.entries(p.tags).map(([k,v])=>`<span class="trait" title="${TRAITS[k]}">${k}${v>1?" ×"+v:""}</span>`).join("")}</div>`:"";
 const how=p.age<p.touchAge?"":`<div class="howto">綜合評分 <b>${Math.round(o)}</b> 依「${DPN[dpOf(p)]}」計算，最看重 ${ATTR.slice().sort((a,b)=>share[b]-share[a]).slice(0,3).map(k=>`${k} ${Math.round(share[k]*100)}%`).join("、")}。卡片右上角是比重，滑過能力或數值看說明。</div>`;
 const moreOpen=window.moreOpen;$("stats").innerHTML=`<div class="faces">${face}</div>${how}<div class="chips${moreOpen?" open":""}">${info}</div>${p.age>=p.touchAge?`<button class="moreBtn" onclick="sharePlayer()">📸 匯出球員卡</button> `:""}${p.age>=13?`<button class="moreBtn" onclick="window.moreOpen=!window.moreOpen;render()">${moreOpen?"▴ 收起":"▾ 更多數值（身高、天賦、存款、粉絲、人際、特質…）"}</button>`:""}${moreOpen||p.age<13?rels+traits:""}`;
 $("career").innerHTML=[["出賽",p.apps],[p.pos=="GK"?"零封":"進球",p.pos=="GK"?p.cleans:p.goals],["助攻",p.assists],["國家隊出賽",p.caps],["冠軍",p.trophies.length],["個人獎項",p.awards.length]].map(([k,v])=>`<div class="stat"><span>${k}</span><b>${v}</b></div>`).join("");
 $("ovrChart").innerHTML=chart(p.ovrHist,"能力值");
}
// 圖表懸停：每個年齡一條看不見的直條，滑到上面就顯示當年數值（手機點一下）
const fmtV=(s,v)=>/歐元/.test(s.n)?eur(v):Math.round(v*10)/10;
function hoverCols(xsAll,X,W,H,tipOf){const u=[...new Set(xsAll)].sort((a,b)=>a-b);return u.map((a,i)=>{const l=i?(+X(u[i-1])+ +X(a))/2:+X(a)-6,r=i<u.length-1?(+X(a)+ +X(u[i+1]))/2:+X(a)+6;return `<rect class="hz" x="${l}" y="0" width="${Math.max(2,r-l)}" height="${H}" data-tip="${esc(tipOf(a))}"/>`}).join("")}
document.addEventListener("pointermove",e=>{const t=e.target.closest?.("[data-tip]"),tp=$("tip");if(!tp)return;if(!t){tp.style.display="none";return}tp.innerHTML=t.dataset.tip;tp.style.display="block";const w=tp.offsetWidth;tp.style.left=Math.min(innerWidth-w-8,e.clientX+12)+"px";tp.style.top=(e.clientY+14)+"px"});
document.addEventListener("pointerdown",e=>{const t=e.target.closest?.("[data-tip]"),tp=$("tip");if(t&&tp){tp.innerHTML=t.dataset.tip;tp.style.display="block";tp.style.left=Math.min(innerWidth-tp.offsetWidth-8,e.clientX+12)+"px";tp.style.top=(e.clientY+14)+"px"}else if(tp)tp.style.display="none"});
function chart(arr,label){const v=arr.map((x,i)=>[i,x]).filter(x=>x[1]!=null);if(v.length<2)return"";const W=300,H=80,n=Math.max(40,v[v.length-1][0]);const pts=v.map(([i,x])=>`${(i/n*W).toFixed(1)},${(H-x/100*H).toFixed(1)}`).join(" ");const pk=v.reduce((a,b)=>b[1]>a[1]?b:a);
 return `<div class="mut" style="font-size:13px">${label}　最高 ${Math.round(pk[1])}（${pk[0]} 歲）</div><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#ffd23f" stroke-width="2.5"/>${hoverCols(v.map(x=>x[0]),i=>(i/n*W).toFixed(1),W,H,a=>`${a} 歲｜${label} ${Math.round(arr[a])}`)}</svg>`}

// ── 報表：每季數據、能力成長、身價與收入、轉會、傷病、國家隊 ──
let repTab="生平";const repTabs={reports:"能力細項",endReports:"生平"}; // 遊戲中已有紀錄欄，報表就不再重複顯示生平
function lines(series,W=320,H=120,maxV){const all=series.flatMap(s=>s.pts.map(x=>x[1])),mx=maxV||Math.max(1,...all),xs=series.flatMap(s=>s.pts.map(x=>x[0])),x0=Math.min(...xs),x1=Math.max(x0+1,...xs);
 const X=a=>((a-x0)/(x1-x0)*(W-30)+26).toFixed(1),Y=v=>(H-14-(v/mx)*(H-24)).toFixed(1);
 return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;background:var(--pitch);border:2px solid var(--line)">${[0,.5,1].map(f=>`<line x1="26" x2="${W}" y1="${Y(mx*f)}" y2="${Y(mx*f)}" stroke="#2f5a3a"/><text x="2" y="${+Y(mx*f)+4}" font-size="9" fill="#a9c2ad">${/歐元/.test(series[0].n)?eur(mx*f).replace("€",""):mx<10?(mx*f).toFixed(1):Math.round(mx*f)}</text>`).join("")}
  <text x="26" y="${H-2}" font-size="9" fill="#a9c2ad">${x0} 歲</text><text x="${W-30}" y="${H-2}" font-size="9" fill="#a9c2ad">${x1} 歲</text>
  ${series.map(s=>`<polyline points="${s.pts.map(([a,v])=>X(a)+","+Y(v)).join(" ")}" fill="none" stroke="${s.c}" stroke-width="2"/>`).join("")}
  ${hoverCols(xs,X,W,H,a=>`<b>${a} 歲</b>`+series.map(s=>{const q=s.pts.find(x=>x[0]==a);return q?`<br><i style="background:${s.c}"></i>${s.n.replace(/（.*）/,"")}：${fmtV(s,q[1])}`:""}).join(""))}</svg>
  <div class="legend">${series.map(s=>`<span><i style="background:${s.c}"></i>${s.n}</span>`).join("")}</div>`}
function reportHTML(p,inGame){(p.injList||[]).forEach(i=>{i.lv=i.lv||(i.bad?"重":"輕")});
 const tabs=[...(inGame?[]:["生平"]),...(p.stars?["同世代"]:[]),...((p.arcs||[]).length?["伏筆"]:[]),"能力細項","每季","榮譽","能力成長","身價與收入","轉會","傷病","國家隊"],yh=(p.yhist||[]).filter(r=>r.age<=(p.retireAge||p.age));let body="";
 if(repTab=="生平"){const ra=p.retireAge||(p.footEnd?p.age:99),st=[["嬰幼兒",0,5],["童年",6,12],["青少年",13,17],[p.debut?"職業生涯":"成年・追夢",18,ra],["退休後",ra+1,200]];
  // 成就通知不放進生平；同樣的句子只留第一次
  const seen=new Set(),log=p.log.filter(([,t])=>!t.startsWith("🏅")&&!seen.has(t)&&seen.add(t));
  const line=(t,h)=>{const m=t.split(" → ");return `<p class="${h?"hi":""}">${m.length==2?`<span class="q">${m[0]}</span><span class="a">${m[1]}</span>`:t}</p>`};
  const only=window.lifeOnly;
  body=`<p><button class="linkbtn" id="lifeOnly">${only?"顯示全部事件":"只看重要時刻"}</button>　<span class="mut" style="font-size:12px">點階段標題可以展開或收合</span></p>`+st.map(([n,a,b],si)=>{const ev=log.filter(([g,,h])=>g>=a&&g<=b&&(!only||h));if(!ev.length)return "";const ages=[...new Set(ev.map(e=>e[0]))],ch=ev.filter(e=>e[1].includes(" → ")).length,hi=ev.filter(e=>e[2]).length;
   return `<details class="life-st"${only||n.includes("職業")||n.includes("追夢")?" open":""}><summary><h3>${n}<small>${a}～${Math.min(b,p.age)} 歲</small></h3></summary><div class="life-sum"><span>${ev.length} 件事</span><span>做了 ${ch} 個選擇</span>${hi?`<span>★ 重要時刻 ${hi}</span>`:""}</div>${ages.map(g=>`<div class="age-row"><span class="y">${g} 歲</span><div>${ev.filter(e=>e[0]==g).map(([,t,h])=>line(t,h)).join("")}</div></div>`).join("")}</details>`}).join("")||`<p class="mut">剛出生。</p>`}
 if(repTab=="同世代")body=starTable(p);
 if(repTab=="伏筆")body=`<p class="mut">當年的選擇，後來怎麼影響了你。</p>`+(p.arcs||[]).map(a=>`<div class="arc"><div class="arc-y"><b>${a.from}</b><span>→</span><b>${a.y}</b></div><div>${a.txt}</div></div>`).join("");
 if(repTab=="能力細項"){const fm=k=>faceMap(p,k);body=`<p class="mut">位置 ${DPN[dpOf(p)]}（${dpOf(p)}）· 綜合能力 ${ovr(p)} · 逆足 ${"★".repeat(p.wf)} · 花式 ${"★".repeat(p.sm)}。綜合能力依位置加權細項計算（參考 FIFA）。</p><div class="subs">${ATTR.map(k=>`<div><b>${k} ${Math.round(p.a[k])}</b>${Object.keys(fm(k)).map(x=>`<div class="sub"><span>${x}</span><i style="width:${p.s[x]}%"></i><em>${Math.round(p.s[x])}</em></div>`).join("")}</div>`).join("")}<div><b>其他</b><div class="sub"><span>反應</span><i style="width:${p.s.反應}%"></i><em>${Math.round(p.s.反應)}</em></div></div></div>
  <p class="mut">各位置綜合能力：${Object.keys(DPW).map(d=>{const w=DPW[d];let t=0,sw=0;for(const k in w){t+=p.s[k]*w[k];sw+=w[k]}return `${DPN[d]} ${Math.round(t/sw)}`}).join("、")}</p>`}
 if(repTab=="榮譽"){const all=[...p.trophies.map(([y,t])=>[y,"🏆",t]),...p.awards.map(([y,t])=>[y,"🥇",t])].sort((a,b)=>a[0]-b[0]);const cnt={};all.forEach(([,,t])=>cnt[t]=(cnt[t]||0)+1);
  body=all.length?`<p>${Object.entries(cnt).sort((a,b)=>b[1]-a[1]).map(([t,n])=>`<span class="trait" style="margin:2px">${t}${n>1?" ×"+n:""}</span>`).join("")}</p><div class="tbl"><table><tr><th>年</th><th></th><th style="text-align:left">榮譽</th></tr>${all.map(([y,i,t])=>`<tr><td>${y}</td><td>${i}</td><td style="text-align:left">${t}</td></tr>`).join("")}</table></div>`:`<p class="mut">還沒有任何冠軍或個人獎項。</p>`}
 if(repTab=="每季")body=p.seasons.length?`<div class="tbl"><table class="seas"><tr><th>年</th><th>歲</th><th>球隊</th><th>名次</th><th>角色</th><th>出賽</th><th>先發</th><th>分鐘</th><th>${p.pos=="GK"?"零封":"進球"}</th><th>助攻</th><th>評分</th><th>最佳</th><th>牌</th><th>能力</th><th>身價</th><th>年薪</th><th style="text-align:left">榮譽</th></tr>${p.seasons.map(s=>`<tr><td>${s.y}</td><td>${s.age}</td><td>${s.club}</td><td>${s.pos??"—"}</td><td>${s.role||""}</td><td>${s.apps}</td><td>${s.starts??"—"}</td><td>${s.mins??"—"}</td><td>${p.pos=="GK"?s.cleans||0:s.goals}</td><td>${s.assists}</td><td>${s.rating}</td><td>${s.motm??"—"}</td><td>${s.yel!=null?`${s.yel}/${s.red}`:"—"}</td><td>${s.ovr}</td><td>${eur(s.val)}</td><td>${s.wage?eur(s.wage):"—"}</td><td class="hon">${[...p.trophies.filter(t=>t[0]==s.y).map(t=>"🏆 "+t[1]),...p.awards.filter(a=>a[0]==s.y).map(a=>"🥇 "+a[1])].join("<br>")||"<span class=mut>—</span>"}</td></tr>`).join("")}
  <tr class="tot"><td colspan="5">合計</td><td>${p.apps}</td><td>${p.seasons.reduce((a,s)=>a+(s.starts||0),0)}</td><td>${p.seasons.reduce((a,s)=>a+(s.mins||0),0).toLocaleString()}</td><td>${p.pos=="GK"?p.cleans:p.goals}</td><td>${p.assists}</td><td>${p.seasons.length?(p.seasons.reduce((a,s)=>a+s.rating,0)/p.seasons.length).toFixed(2):"—"}</td><td>${p.seasons.reduce((a,s)=>a+(s.motm||0),0)}</td><td>${p.seasons.reduce((a,s)=>a+(s.yel||0),0)}/${p.seasons.reduce((a,s)=>a+(s.red||0),0)}</td><td>${Math.round(p.peak)}</td><td>${eur(p.maxValue)}</td><td></td><td class="hon">🏆 ${p.trophies.length}　🥇 ${p.awards.length}</td></tr></table></div>`:`<p class="mut">還沒有職業球季。</p>`;
 if(repTab=="能力成長")body=yh.length>1?lines([...ATTR.map((k,i)=>({n:k,c:["#3fa7ff","#ff4d4d","#ffd23f","#b07cff","#4cd964","#ff9f40"][i],pts:yh.map(r=>[r.age,r.a[k]])})),{n:"綜合能力",c:"#fff",pts:yh.map(r=>[r.age,r.ovr])}],320,140,100)+`<p class="mut">身高：${yh.map(r=>`${r.age}歲 ${Math.round(r.h)}`).filter((_,i)=>i%3==0).join("、")} 公分</p>`:`<p class="mut">資料還不夠。</p>`;
 if(repTab=="身價與收入"){const v=yh.filter(r=>r.val);const fm=x=>eur(x);
  body=v.length>1?`<div class="mut" style="font-size:13px">身價（最高 ${fm(Math.max(...v.map(r=>r.val)))}）</div>`+lines([{n:"身價（百萬歐元）",c:"#ffd23f",pts:v.map(r=>[r.age,r.val])}],320,100)+
   `<div class="mut" style="font-size:13px;margin-top:8px">年薪（最高 ${fm(Math.max(...v.map(r=>r.wage)))}）</div>`+lines([{n:"年薪（百萬歐元）",c:"#4cd964",pts:v.map(r=>[r.age,r.wage])}],320,100)+
   `<div class="tbl" style="margin-top:8px"><table><tr><th>歲</th><th style="text-align:left">球隊</th><th>身價</th><th>年薪</th><th>存款</th></tr>${v.map(r=>`<tr><td>${r.age}</td><td style="text-align:left">${r.club}</td><td>${fm(r.val)}</td><td>${fm(r.wage)}</td><td>${fm(Math.max(0,r.money))}</td></tr>`).join("")}</table></div>
   <p>累計稅前收入約 ${eur(p.seasons.reduce((a,s)=>a+(s.wage||0),0))}，目前存款 ${eur(Math.max(0,p.money))}。</p>`:`<p class="mut">還沒有職業合約。</p>`}
 if(repTab=="轉會")body=(p.moves||[]).length?`<div class="tbl"><table><tr><th>年</th><th>歲</th><th>從</th><th>到</th><th>方式</th><th>轉會費</th></tr>${p.moves.map(m=>`<tr><td>${m.y}</td><td>${m.age}</td><td>${m.from}</td><td>${m.to}</td><td>${m.type}</td><td>${m.fee?eur(m.fee):"—"}</td></tr>`).join("")}</table></div><p>轉會費合計 ${eur(p.moves.reduce((a,m)=>a+m.fee,0))}</p>`:`<p class="mut">還沒有轉會紀錄。</p>`;
 if(repTab=="傷病")body=(p.injList||[]).length?`<div class="tbl"><table><tr><th>歲</th><th>傷勢</th><th>嚴重</th><th>缺席</th><th>當時疲勞</th></tr>${p.injList.map(i=>`<tr><td>${i.age}</td><td>${i.t||"受傷"}</td><td>${i.lv}傷${i.chronic?"（舊傷）":""}</td><td>${i.games!=null?i.games+" 場":"—"}</td><td>${i.fat}</td></tr>`).join("")}</table></div><p class="mut">疲勞超過 65 時受傷機率明顯升高。</p>`:`<p class="mut">沒有受過傷。</p>`;
 if(repTab=="國家隊")body=(p.intl||[]).length?`<div class="tbl"><table><tr><th>年</th><th>歲</th><th>出賽</th><th>進球</th></tr>${p.intl.map(i=>`<tr><td>${i.y}</td><td>${i.age}</td><td>${i.caps}</td><td>${i.g}</td></tr>`).join("")}<tr class="tot"><td colspan="2">合計</td><td>${p.caps}</td><td>${p.intlGoals}</td></tr></table></div><p>參加世界盃 ${p.wc||0} 次。</p>`:`<p class="mut">還沒有入選國家隊。${p.c}國家隊大約要能力 ${Math.max(55,p.cs-4)} 以上。</p>`;
 return `<div class="rtabs">${tabs.map(t=>`<button class="rt${t==repTab?" on":""}" data-t="${t}">${t}</button>`).join("")}</div>${body}`;
}
function drawReport(id){const el=$(id);if(!el||!P)return;repTab=repTabs[id];el.innerHTML=reportHTML(P,id=="reports");const lo=el.querySelector("#lifeOnly");if(lo)lo.onclick=()=>{window.lifeOnly=!window.lifeOnly;drawReport(id)};el.querySelectorAll(".rt").forEach(b=>b.onclick=()=>{repTabs[id]=b.dataset.t;drawReport(id)})}

// ── 挑戰與成就：每項分銅、銀、金、鑽石四級，跨局保留最佳紀錄 ──
const TIER=["🥉 銅","🥈 銀","🥇 金","💎 鑽石"];
const sameClub=p=>{const m={};p.seasons.forEach(s=>m[s.club]=(m[s.club]||0)+1);return Math.max(0,...Object.values(m))};
const ctOf=n=>CLUBS.find(c=>c.name==n)?.ct;
const ACH=[
 // [名稱, 說明, 計算(本局), 門檻, 是否跨局累加]
 ["出賽","職業出賽場數",p=>p.apps,[100,300,500,750]],
 ["進球","職業進球數",p=>p.goals,[30,100,250,500]],
 ["助攻","職業助攻數",p=>p.assists,[30,80,150,250]],
 ["零封","門將或後衛的零封場數",p=>p.cleans,[30,100,200,300]],
 ["巔峰","生涯最高綜合能力",p=>Math.round(p.peak),[70,78,85,91]],
 ["身價","生涯最高身價（百萬歐元）",p=>+p.maxValue.toFixed(1),[5,30,80,150]],
 ["存款","生涯累積存款（百萬歐元）",p=>+Math.max(0,p.money).toFixed(2),[1,10,40,100]],
 ["冠軍","拿下的冠軍數",p=>p.trophies.length,[2,6,12,25]],
 ["個人獎項","金靴、最佳新秀、世界足球先生等",p=>p.awards.length,[2,5,10,20]],
 ["大賽之王","贏下的大比賽",p=>p.bigWins||0,[3,10,20,35]],
 ["國家隊","國家隊出賽場數",p=>p.caps,[10,50,100,150]],
 ["國家英雄","國家隊進球數",p=>p.intlGoals,[5,20,40,70]],
 ["世界盃","參加世界盃次數",p=>p.wc||0,[1,2,3,5]],
 ["五大聯賽","在五大聯賽出賽的季數",p=>p.seasons.filter(s=>s.apps>0&&TOP5.includes(s.lg)).length,[2,6,10,15]],
 ["台灣之光","台灣球員在五大聯賽出賽的季數",p=>p.c=="台灣"?p.seasons.filter(s=>s.apps>0&&TOP5.includes(s.lg)).length:0,[1,3,6,10]],
 ["留洋","在外國聯賽出賽的季數",p=>p.seasons.filter(s=>s.apps>0&&ctOf(s.club)!=p.c).length,[3,8,12,16]],
 ["環遊世界","踢過職業的國家數",p=>new Set(p.seasons.filter(s=>s.apps>0).map(s=>ctOf(s.club))).size,[2,4,5,7]],
 ["旅人","待過的職業球隊數",p=>p.clubsPlayed.length,[3,6,9,12]],
 ["一隊效忠","在同一支球隊踢的季數",sameClub,[6,10,14,18]],
 ["長青樹","職業生涯年數",p=>p.debut?((p.retireAge||p.age)-p.debut):0,[8,13,17,21]],
 ["少年得志","一線隊初登場越早越好（40 減初登場年齡）",p=>p.debut?40-p.debut:0,[21,22,23,24]],
 ["浴火重生","受重傷後仍然回到球場的次數",p=>(p.injList||[]).filter(i=>i.bad).length&&p.seasons.some(s=>s.apps>0&&s.age>((p.injList||[]).find(i=>i.bad)?.age||99))?(p.injList||[]).filter(i=>i.bad).length:0,[1,2,3,5]],
 ["突破極限","潛力上限被提高的次數",p=>p.potUps||0,[2,4,6,9]],
 ["人格特質","收集到的特質種類",p=>Object.keys(p.tags||{}).length,[3,6,9,12]],
 ["好人緣","人際關係都在 70 以上的人數",p=>Object.values(p.rel||{}).filter(r=>r.v>=70).length,[1,2,3,4]],
 ["人瑞","享年",p=>p.alive?0:p.age,[80,90,95,100]],
 ["堅持到底","被青訓放走後，仍然踢上一線隊（跨局累加）",p=>p.released&&p.debut?1:0,[1,3,6,10],1],
 ["人氣王","生涯最高粉絲數（萬人）",p=>Math.round(p.maxFans||0),[100,1000,5000,10000]],
 ["一雪前恥","在復仇戰擊敗宿敵的次數",p=>p.revenge||0,[1,2,4,6]],
 ["名帥之路","退休後當教練的最高層級（1 低級別 → 5 國家隊）",p=>p.cMax||0,[1,3,4,5]],
 ["伯樂","當球探發掘的國腳人數",p=>p.scoutHits||0,[1,2,3,5]],
 ["同世代之王","同世代排行贏過的人數",p=>{const r=(!p.alive||p.footEnd)&&starRank(p);return r?r.all.length-r.rank:0},[10,18,25,30]],
 ["傳奇","退休時獲得的傳奇榮譽（球衣退役、名人堂）",p=>(p.honors||[]).length,[1,2,3,4]],
 ["說到做到","達成的每季目標數",p=>p.goalsDone||0,[5,12,20,30]],
 ["追夢次數","玩過的生涯數（跨局累加）",p=>p.alive?0:1,[1,5,15,30],1],
 ["落寞的追夢人","沒能成為職業球員的生涯數（跨局累加）",p=>p.footEnd&&!p.debut?1:0,[1,3,10,20],1],
 ["職業總進球","所有生涯加起來的進球（跨局累加）",p=>p.alive?0:p.goals,[50,300,1000,3000],1],
];
function tierOf(v,th){let t=0;th.forEach((x,i)=>{if(v>=x)t=i+1});return t}
function achStore(){try{return JSON.parse(localStorage.getItem("fb-ach2")||"{}")}catch{return {}}}
// 本局的值：一般成就取最佳；跨局成就在結局時才加總
function checkAch(p,final){const st=achStore();p.achGot=p.achGot||{};
 for(const [n,d,f,th,acc] of ACH){if(acc&&!final)continue;const v=f(p);const best=acc?(st[n]||0)+(p.achAdded?.[n]?0:v):Math.max(st[n]||0,v);
  if(acc){p.achAdded=p.achAdded||{};if(!p.achAdded[n]){p.achAdded[n]=1;st[n]=best}}else st[n]=best;
  const t=tierOf(acc?best:v,th),old=p.achGot[n]||0;if(t>old){p.achGot[n]=t;say(`🏅 成就「${n}」達到 ${TIER[t-1]}（${d}：${acc?best:v}）`,1);toast(`🏅 ${n} ${TIER[t-1]}`)}}
 try{localStorage.setItem("fb-ach2",JSON.stringify(st))}catch{}}
function achWall(){const st=achStore();let pts=0;const max=ACH.length*4;
 const html=ACH.map(([n,d,f,th])=>{const v=st[n]||0,t=tierOf(v,th);pts+=t;const nx=th[t]??null,prev=t?th[t-1]:0,pct=nx==null?100:Math.min(100,(v-prev)/(nx-prev)*100);
  return `<div class="ach t${t}"><b>${t?TIER[t-1].split(" ")[0]:"🔒"} ${n}</b><span>${d}</span><div class="ab"><i style="width:${pct}%"></i></div><small>${nx==null?"已達最高級":`最佳 ${v}　下一級 ${nx}`}</small></div>`}).join("");
 return `<div class="mut">成就點數 ${pts} / ${max}（每項最高 4 級）</div><div class="achs">${html}</div>`}

// ── 生涯管理：球員主動出擊 ──
const MGR=[
 ["要求轉會","主動請經紀人找新球隊",p=>p.club&&!p.loanTo,async p=>{const o=ovr(p),c=p.clubObj,ag=rel(p,"agent");
   const pref=await new Promise(res=>ask("想去什麼樣的球隊？",[["更強的球隊，挑戰自己",()=>res("up")],["能固定先發的球隊",()=>res("start")],["薪水最高的球隊",()=>res("pay")],["回到家鄉",()=>res("home")]]));
   let pool=poolFor(p).filter(x=>x.name!=c.name);
   pool=pref=="up"?pool.filter(x=>x.str>c.str&&x.str<=o+3+(ag-50)/10):pref=="start"?pool.filter(x=>x.str<=o&&x.str>=o-8):pref=="pay"?pool.sort((a,b)=>wageOf(b,p)-wageOf(a,p)).filter(x=>x.str<=o+4).slice(0,6):pool.filter(x=>x.ct==p.c&&x.str<=o+6);
   pool=pool.sort(()=>R()-.5).filter(()=>R()<.45+(ag-50)/150+p.fame/600).slice(0,3);
   rel(p,"coach",-8);if(!pool.length){say("經紀人問了一圈，沒有球隊願意接手。教練知道你想走，關係變差了。");return}
   await ask("經紀人帶回了幾份報價",pool.map(x=>{const fee=value(p)*(.8+R()*.5);return [`轉會到${x.name}（${x.lg}）`,()=>{p._fee=fee;say(`主動要求轉會，以 ${eur(fee)} 加盟${x.name}。`,1);sign(x,3)},`實力 ${x.str} · ${roleOf(p,x)} · 年薪約 ${eur(wageOf(x,p))}`]}).concat([["還是留下來",()=>{p.morale-=2},"教練已經知道你想走"]]))}],
 ["談加薪","找球隊重談合約",p=>p.club,async p=>{const ag=rel(p,"agent"),c=p.clubObj,base=wageOf(c,p);
   await ask(`想怎麼談？（目前年薪 ${eur(p.wage)}，市場行情約 ${eur(base)}）`,[
    ["要求加薪三成，不然不續約",()=>{if(R()<.3+(ag-50)/150+(ovr(p)-c.str)/40){p.wage*=1.3;p.contract=Math.max(p.contract,2);say(`球隊讓步，年薪加到 ${eur(p.wage)}。`,1)}else{rel(p,"coach",-6);p.morale-=4;say("球隊拒絕，還把你放上轉會名單。");p.contract=Math.min(p.contract,1)}},"高風險"],
    ["用延長合約換小幅加薪",()=>{p.wage=Math.max(p.wage*1.1,base*.95);p.contract+=2;say(`延長兩年，年薪 ${eur(p.wage)}。`)},"穩健"],
    ["要求加入解約金條款",()=>{p.releaseClause=1;say("合約加入解約金條款，強隊報價時比較容易放人。")},"轉會更自由"]])}],
 ["申請外租","想去小球隊拿上場時間",p=>p.club&&p.role&&p.role!="主力"&&!p.loanTo,async p=>{const o=ovr(p),c=p.clubObj,lo=poolFor(p).filter(x=>x.str<=o+3&&x.str>=o-8&&x.name!=c.name).sort(()=>R()-.5).slice(0,3);
   if(!lo.length){say("找不到願意接手的球隊。");return}
   await ask("有這些球隊願意租借你一季",lo.map(x=>[`租借到${x.name}`,()=>{p.loanFrom=c;p.loanTo=x;p.club=x.name;p.clubObj=x;if(!p.clubsPlayed.includes(x.name))p.clubsPlayed.push(x.name);say(`主動申請外租到${x.name}。`,1)},`${x.lg} · ${roleOf(p,x)}`]).concat([["算了",()=>{}]]))}],
 ["換經紀人","挑一位新的經紀人",p=>p.age>=17,async p=>{const c=[["國際大牌經紀公司",80+R()*15,.1],["業界口碑不錯的經紀人",60+R()*20,.06],["剛出道的年輕經紀人",35+R()*40,.03]];
   await ask(`目前的經紀人：${p.rel?.agent?.name||"沒有"}（可信度 ${rel(p,"agent")}）`,c.map(([n,q,cut])=>[n,()=>{meet(p,"agent",null,Math.round(q));p.agentCut=cut;say(`換了新經紀人（${n}）。`)},`抽成 ${Math.round(cut*100)}% · 能力約 ${Math.round(q/10)*10}`]).concat([["不換了",()=>{}]]))}],
 ["經營個人品牌","社群、代言、公益",p=>p.age>=16,async p=>{await ask("想怎麼經營自己？",[
    ["開社群頻道，分享訓練日常",()=>{p.fame+=4+R()*4;tag(p,"媒體寵兒");p.fat=Math.min(100,(p.fat||0)+5)},"名氣↑ 有點分心"],
    ["成立家鄉的兒童足球基金會",()=>{p.money-=.05;p.fame+=5;tag(p,"正直");say("成立兒童足球基金會，幫助家鄉的孩子。",1)},"花錢 · 形象↑",()=>p.money>.05],
    ["接一個大品牌代言",()=>{const m=.05+p.fame*.003;p.money+=m;p.fame+=2;say(`簽下代言，收入 ${eur(m)}。`)},"收入↑",()=>p.fame>30],
    ["低調，只專心踢球",()=>{p.a.體能+=.8},""]])}],
 ["國家隊","主動爭取或退出國家隊",p=>p.age>=18&&p.club,async p=>{await ask(p.caps?`你已經代表${p.c}出賽 ${p.caps} 場`:`還沒入選${p.c}國家隊`,p.caps?[
    ["宣布退出國家隊，專心俱樂部",()=>{p.intlRetired=1;p.fat=Math.max(0,(p.fat||0)-10);say("宣布從國家隊退休。",1)},"不再入選，疲勞↓"],["繼續為國家而戰",()=>{p.morale+=2},""]]:[
    ["公開表態想為國家效力",()=>{p.fame+=1;if(R()<.4)p.cs=Math.max(40,p.cs-3)},"國家隊門檻略降"],["考慮歸化別的國家隊",()=>{if(p.age<=27){p.cs=Math.max(p.cs,70);say("取得第二國籍，可以代表新的國家隊。",1)}},"",()=>p.age<=27],["不急",()=>{}]])}],
 ["宣布最後一季","這季踢完就退休",p=>p.club&&p.age>=28&&!p.lastSeason,async p=>{await ask("確定這是最後一季嗎？",[["確定，好好告別",()=>{p.lastSeason=p.age;p.fame+=5;say("宣布這是職業生涯的最後一季，各地球迷都來送行。",1)},"季末退休"],["再想想",()=>{}]])}],
];
// 不能使用時說明原因
const MGR_WHY={申請外租:p=>p.loanTo?"租借中":p.role=="主力"?"你已經是主力":"",宣布最後一季:p=>p.age<28?"28 歲以後才能宣布":p.lastSeason?"已經宣布了":"",要求轉會:p=>p.loanTo?"租借中不能轉會":"",國家隊:p=>p.age<18?"18 歲以後":""};
MGR.push(
 ["私人特訓","自費加強一項能力",p=>p.age>=15&&p.money>=.01,async p=>{const cost=Math.max(.01,Math.min(.5,p.wage*.06));await ask(`請私人教練一對一特訓（花費約 ${eur(cost)}）`,ATTR.map(k=>[`加強${k}`,()=>{p.money-=cost;p.a[k]+=1.5+R()*1.5;p.focus=p.focus||{};p.focus[k]=(p.focus[k]||0)+.8;capAttrs(p);say(`請私人教練加強${k}，${k}進步到 ${Math.round(p.a[k])}。`,1)},`目前 ${Math.round(p.a[k])}`]).concat([["算了",()=>{}]]))}],
 ["改踢位置","向教練要求換位置",p=>p.club&&p.age>=16&&p.pos!="GK",async p=>{const cur=rateAt(p,dpOf(p)),now=posName(p);
   // 列出每個精確位置：綜合評分變化、最看重的三項細項
   const opts=POS9.filter(([d,n])=>n!=now).map(([d,n,side])=>{const r=rateAt(p,d),diff=r-cur,top=Object.entries(DPW[d]).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]).join("、");
    return [`改踢${n}　${cur} → ${r}（${diff>=0?"+":""}${diff}）`,()=>{if(R()<.4+(rel(p,"coach")-50)/100+(diff>0?.15:0)){setDp(p,d);p.side=side||null;say(`教練同意讓你改踢${n}，綜合評分 ${cur} → ${r}。`,1)}else{rel(p,"coach",-3);say("教練拒絕了，要你先在原位置證明自己。")}},`看重：${top}`]}).sort((a,b)=>{const n=x=>+x[0].match(/（([+-]?\d+)）/)[1];return n(b)-n(a)});
   await ask(`想改踢哪個位置？（目前 ${now}，綜合 ${cur}，教練關係 ${rel(p,"coach")}）`,opts.concat([["不換",()=>{}]]),"依評分變化排序；評分越高，教練越容易同意")}],
 ["找教練談話","爭取上場、請教戰術",p=>!!p.club,async p=>{await ask(`找總教練談話（目前關係 ${rel(p,"coach")}，戰術「${p.coachStyle||"—"}」）`,[["爭取更多上場時間",()=>{if(R()<.35+(rel(p,"coach")-50)/120+(ovr(p)-p.clubObj.str)/40){rel(p,"coach",8);say("教練答應給你更多機會。",1)}else{rel(p,"coach",-5);say("教練覺得你還不夠格。")}},"看教練關係與實力"],["請教戰術要求",()=>{rel(p,"coach",4);const k=TAC[p.coachStyle]||["傳球"];k.forEach(x=>{p.a[x]+=.8});say(`照教練的戰術要求加練${k.join("、")}。`)},"配合戰術，能力小幅↑"],["只是打聲招呼",()=>{rel(p,"coach",2)},""]])}],
 ["休假充電","降低疲勞、回復心情",p=>p.age>=16&&(p.fat||0)>20,async p=>{await ask("想怎麼休息？",[["和家人出國旅行",()=>{p.fat=Math.max(0,(p.fat||0)-35);p.morale+=6;p.money-=.01},"疲勞↓↓ 花點錢"],["在家完全放空一週",()=>{p.fat=Math.max(0,(p.fat||0)-25);p.morale+=3},"疲勞↓"],["去做物理治療",()=>{p.fat=Math.max(0,(p.fat||0)-20);p.health+=6},"健康↑"]])}]);
function renderMgr(){const el=$("mgr");if(!el||!P)return;const p=P;p.mgrUsed=p.mgrUsed||{};
 $("mgrCard").classList.toggle("hide",p.age<16||p.retired||!!p.footEnd);
 el.innerHTML=MGR.map(([n,d,ok],i)=>{const used=p.mgrUsed[n]===p.age,can=ok(p)&&!used;const why=!can&&!used&&MGR_WHY[n]?MGR_WHY[n](p):"";return `<button class="mg" data-i="${i}" ${can?"":"disabled"}><b>${n}</b><small>${used?"本季已使用":why||d}</small></button>`}).join("");
 el.querySelectorAll(".mg").forEach(b=>b.onclick=async()=>{const [n,,,fn]=MGR[b.dataset.i];paused=true;p.mgrUsed[n]=p.age;await fn(p);paused=false;render();renderMgr()})}

// ── 主迴圈 ──
async function loop(){
 while(P.alive&&!P.footEnd){
  if(P.club&&!P.retired)await season();else{await quietYear();await season()}
  pendingSkip=false;checkAch(P);if(!auto&&!toEnd)TOUR.forEach(([sel],i)=>{let f=1;try{f=localStorage.getItem("fb-tour"+sel)}catch{}const el=document.querySelector(sel);if(!f&&el&&el.offsetParent&&!$("tour"))tour(i,true)});render();renderPlan();drawReport("reports");save();
 }
 finish();
}
function slots(){try{return JSON.parse(localStorage.getItem("fb-saves")||"{}")}catch{return {}}}
// 最多保留 6 個進行中的生涯；空間不夠就刪掉最舊的
// 存檔前先瘦身：同世代球星只留必要欄位，紀錄太長時把舊的一般事件拿掉（重要時刻保留）
function slim(p){const q={...p};delete q.a;delete q.clubObj;delete q._sb;delete q._gala;delete q.table;delete q.lastTable;if(q.log.length>900)q.log=q.log.filter((l,i)=>l[2]||i>q.log.length-500);return q}
function save(){const all=slots();P.id=P.id||Date.now()+"";all[P.id]={P:slim(P),plan,t:Date.now()};
 Object.keys(all).sort((a,b)=>all[b].t-all[a].t).slice(6).forEach(k=>delete all[k]);
 for(let i=0;i<5;i++){try{localStorage.setItem("fb-saves",JSON.stringify(all));return}catch{const old=Object.keys(all).filter(k=>k!=P.id).sort((a,b)=>all[a].t-all[b].t)[0];if(old)delete all[old];else P.log=P.log.slice(-300)}}}
function score(p){return Math.round(p.peak*1.2+p.trophies.length*8+p.awards.length*12+p.caps*.3+p.goals*.15+(p.wc||0)*6)}
function finish(){
 try{const all=slots();delete all[P.id];localStorage.setItem("fb-saves",JSON.stringify(all))}catch{}
 const p=P;$("game").classList.add("hide");$("end").classList.remove("hide");scrollTo(0,0);
 const sc=score(p),title=p.awards.some(a=>a[1]=="世界足球先生")?"世界足球先生":p.trophies.some(t=>t[1]=="世界盃冠軍")?"世界冠軍":p.peak>=85?"一代球星":p.peak>=75?"職業好手":p.debut?"職業球員":p.footEnd?({青訓:"青訓營畢業生",業餘:"業餘球員",學校隊:"學校隊隊員",少年隊:"少年隊球員"}[p.stage]||"踢過球的孩子"):"追夢的人";
 const early=!!p.footEnd;
 const tro=p.trophies.reduce((a,[,t])=>(a[t]=(a[t]||0)+1,a),{});
 $("cert").innerHTML=`<h2>${early?"足球生涯卡":"足球生涯證書"}</h2>${early?`<p style="margin:0 0 10px;font-size:16px">${esc(p.footEnd)}<br><span class="mut">之後的人生：${esc(p.after)}</span></p>`:""}<div style="display:flex;gap:14px;align-items:center"><canvas id="cface" width="16" height="16" style="width:84px;height:84px;image-rendering:pixelated;border:3px solid #16241a"></canvas><div><div style="font-size:28px;font-weight:900">${esc(p.name)}</div><div>${early?`${p.y0} 出生 · 踢球 ${Math.max(0,p.age-p.touchAge)} 年`:`${p.y0} — ${p.y0+p.age}`} · ${p.c} · ${POS[p.pos]}</div><div style="background:#16241a;color:#ffd23f;display:inline-block;padding:2px 8px;margin-top:4px">${title}</div></div></div>
 <div class="grid" style="margin:12px 0">${[["生涯評分",sc],["巔峰能力",Math.round(p.peak)],["出賽",p.apps],[p.pos=="GK"?"零封":"進球",p.pos=="GK"?p.cleans:p.goals],["助攻",p.assists],["國家隊",`${p.caps} 場 ${p.intlGoals} 球`],["最高身價",eur(p.maxValue)],["待過的球隊",p.clubsPlayed.length],...((p.honors||[]).length?[["傳奇榮譽",p.honors.length+" 項"]]:[]),["受傷",p.injuries+" 次"],[early?"結束時":"退休",early?p.age+" 歲":p.retireAge?p.retireAge+" 歲":"—"],["走到哪一關",p.debut?"職業一線隊":p.club?"職業預備隊":({青訓:"青訓營",業餘:"業餘聯賽",學校隊:"學校隊",少年隊:"少年隊"}[p.stage]||"街頭")],["之後",esc(p.afterDetail||p.after||"—")],...(early?[]:[["享年",p.age+" 歲"]])].map(([k,v])=>`<div class="stat"><span>${k}</span><b>${v}</b></div>`).join("")}</div>
 <div><b>榮譽</b>　<span class="trophies">${"🏆".repeat(Math.min(15,p.trophies.length))}${"🥇".repeat(Math.min(8,p.awards.length))}</span></div>
 <div class="mut" style="font-size:13px">${Object.entries(tro).map(([t,n])=>`${t} ×${n}`).join("、")||"沒有冠軍"}${p.awards.length?"；"+[...new Set(p.awards.map(a=>a[1]))].join("、"):""}</div>
 <div style="margin:8px 0;padding:8px;background:#16241a;color:#f4f1de">${(()=>{const od=realOdds(p.c),t5=p.clubsPlayed.some(n=>{const c=CLUBS.find(x=>x.name==n);return c&&TOP5.includes(c.lg)}),pro=!!p.debut;
  return t5?`你踢進了五大聯賽。在真實的${p.c}，同年出生的男孩約 ${oneIn(od.top5)} 做得到。`:pro?`你踢上了職業一線隊。在真實的${p.c}，同年出生的男孩約 ${oneIn(od.pro)} 做得到。`:`你沒能踢上職業一線隊。在真實的${p.c}，也只有約 ${oneIn(od.pro)} 能成為職業球員。`})()}</div>
 ${(p.honors||[]).length?`<div><b>傳奇榮譽</b>　${p.honors.map(esc).join("、")}</div>`:""}<div><b>效力過</b>　${p.clubsPlayed.join(" → ")||"沒有職業球隊"}</div>${(()=>{const r=starRank(p);return r?`<div><b>同世代排行</b>　第 ${r.rank} / ${r.all.length} 名，${esc(p.c)}第 ${r.hrank} / ${r.home.length} 名（前三：${r.all.slice(0,3).map(x=>esc(x.n)).join("、")}）</div>`:""})()}
 <div class="chart" style="margin-top:10px">${chart(p.ovrHist,"能力值變化")}</div>`;
 drawFace($("cface"),p);
 checkAch(p,true);$("endAch").innerHTML=`<b>這段生涯的成就</b><br>${Object.entries(p.achGot||{}).map(([n,t])=>`${TIER[t-1].split(" ")[0]} ${n}`).join("　")||"沒有"}`;drawReport("endReports");const _unused=p.seasons.map(s=>`<div class="row"><span>${s.y}（${s.age}歲）${s.club}</span><span>${s.apps} 場 · ${s.goals} 球 · 評分 ${s.rating}${s.titles.length?" · 🏆":""}</span></div>`).join("")||"<p class='mut'>沒有職業球季。</p>";
 try{const h=JSON.parse(localStorage.getItem("fb-hof")||"[]");h.push({name:p.name,c:p.c,pos:p.pos,sc,title:(p.card?p.card+"・":"")+title,peak:Math.round(p.peak),goals:p.goals,tro:p.trophies.length,y:`${p.y0}–${p.y0+p.age}`});h.sort((a,b)=>b.sc-a.sc);localStorage.setItem("fb-hof",JSON.stringify(h.slice(0,20)))}catch{}
 p._sc=sc;p._title=title;$("cardImg").onclick=()=>shareCard(p);$("upload").onclick=()=>uploadCareer(p);if(!p.debut){$("upload").classList.add("hide")}
 $("share").onclick=async()=>{const text=`我在足球員模擬器踢了一生：${p.name}（${p.c}·${POS[p.pos]}），巔峰能力 ${Math.round(p.peak)}，${p.goals} 球、${p.trophies.length} 座冠軍。${location.href.split("?")[0]}`;try{if(navigator.share)await navigator.share({text});else{await navigator.clipboard.writeText(text);toast("已複製分享文字")}}catch{}};
}

// ── 生涯卡圖片：1080×1350，可以直接傳到 LINE 或 IG ──
function cardCanvas(p){const W=1080,H=1350,cv=document.createElement("canvas");cv.width=W;cv.height=H;const g=cv.getContext("2d");
 const C=IMG();g.fillStyle=C.bg0;g.fillRect(0,0,W,H);g.fillStyle=C.stripe;for(let i=0;i<8;i++)g.fillRect(0,400+i*130,W,65);
 g.strokeStyle=C.frame;g.lineWidth=16;g.strokeRect(24,24,W-48,H-48);
 const fc=document.createElement("canvas");fc.width=fc.height=16;drawFace(fc,p);g.imageSmoothingEnabled=false;g.fillStyle="#ffd23f";g.fillRect(76,96,272,272);g.drawImage(fc,84,104,256,256);
 const F=(sz,w=900)=>`${w} ${sz}px "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif`;
 g.fillStyle=C.acc;g.font=F(34,700);g.fillText(p.footEnd?"足球生涯卡":"足球生涯證書",392,140);
 g.fillStyle=C.fg;let ns=72;g.font=F(ns);while(g.measureText(p.name).width>620&&ns>36){ns-=4;g.font=F(ns)}g.fillText(p.name,392,226);
 g.font=F(34,500);g.fillText(`${p.c} · ${POS[p.pos]} · ${p.y0}–${p.y0+p.age}`,392,286);
 g.font=F(36);g.fillStyle="#ffd23f";g.fillRect(392,312,Math.min(600,g.measureText(p._title).width+56),58);g.fillStyle="#0f2a1a";g.fillText(p._title,420,354);
 const items=[["生涯評分",p._sc],["巔峰能力",Math.round(p.peak)],["出賽",p.apps],[p.pos=="GK"?"零封":"進球",p.pos=="GK"?p.cleans:p.goals],["助攻",p.assists],["冠軍",p.trophies.length],["個人獎項",p.awards.length],["國家隊",`${p.caps} 場`],["最高身價",eur(p.maxValue)],["最多粉絲",fansTxt(p.maxFans||0)],["宿敵",p.nemesis||(p.revenge?"已復仇":"—")],["之後",p.afterDetail||p.after||"—"]];
 items.forEach(([k,v],i)=>{const x=76+(i%3)*316,y=420+Math.floor(i/3)*170;g.fillStyle="#f4f1de";g.fillRect(x,y,296,150);g.fillStyle="#5d6e60";g.font=F(28,500);g.fillText(k,x+20,y+44);
  g.fillStyle="#16241a";const t=String(v);let sz=56;g.font=F(sz);while(g.measureText(t).width>260&&sz>32){sz-=4;g.font=F(sz)}
  if(g.measureText(t).width<=260){g.fillText(t,x+20,y+112);return}
  // 太長就拆成多行小字
  g.font=F(26,700);let line="",ly=y+80;for(const ch of t.replace(/，/g,"，\n")){if(ch=="\n"||g.measureText(line+ch).width>260){g.fillText(line,x+20,ly);ly+=32;line=ch=="\n"?"":ch}else line+=ch}if(line)g.fillText(line,x+20,ly)});
 g.fillStyle=C.fg;g.font=F(30,500);const full=p.clubsPlayed.join(" → ")||"沒有職業球隊";let cl=full;while(g.measureText("效力過："+cl+"…").width>920&&cl.length>4)cl=cl.slice(0,-1);g.fillText("效力過："+cl+(cl!==full?"…":""),76,1130);
 g.fillStyle="#ffd23f";g.font=F(40);const sr=starRank(p);g.fillText((sr?`同世代第 ${sr.rank} / ${sr.all.length} 名　`:"")+("🏆".repeat(Math.min(sr?8:12,p.trophies.length))||(sr?"":"踢過，就不後悔")),76,1200);
 g.fillStyle=C.mut;g.font=F(26,500);g.fillText("足球員模擬器 · "+location.host+location.pathname,76,1270);return cv}
// 生涯卡：先跳出預覽，再選下載、複製或分享（電腦版的分享選單沒有「儲存」）
// ── 主題：auto（跟系統）→ 淺色 → 深色 輪流切換；圖片也跟著目前的主題 ──
function themeNow(){const t=document.documentElement.dataset.theme;return t||(matchMedia&&matchMedia("(prefers-color-scheme: light)").matches?"light":"dark")}
function applyTheme(){let t="auto";try{t=localStorage.getItem("fb-theme")||"auto"}catch{}if(t=="auto")delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=t;document.documentElement.dataset.resolved=themeNow();const b=$("themeBtn");if(b)b.textContent={auto:"🌓 自動",light:"☀️ 淺色",dark:"🌙 深色"}[t]}
function cycleTheme(){let t="auto";try{t=localStorage.getItem("fb-theme")||"auto"}catch{}t={auto:"light",light:"dark",dark:"auto"}[t];try{localStorage.setItem("fb-theme",t)}catch{}applyTheme();toast({auto:"跟隨系統的深淺色",light:"淺色主題",dark:"深色主題"}[t])}
// 圖片用的配色
function IMG(){return themeNow()=="light"?{bg0:"#f6f8f0",bg1:"#dfe8d6",stripe:"#00000008",fg:"#1d2b20",mut:"#5a6b5d",acc:"#a36a00",line:"#00000022",frame:"#a36a00"}:{bg0:"#0f2a1a",bg1:"#050a06",stripe:"#ffffff07",fg:"#f4f1de",mut:"#a9c2ad",acc:"#ffd23f",line:"#ffffff22",frame:"#ffd23f"}}
// ── 分享：圖片預覽 + 系統分享（IG、LINE）、下載、複製、LINE / FB 連結 ──
const SITE="https://jackycheung0408.github.io/life-simulator/football/";
function showShare(cv,fn,text){const url=cv.toDataURL("image/png"),enc=encodeURIComponent;
 document.body.insertAdjacentHTML("beforeend",`<div id="cardPv"><img src="${url}"><div class="mut" style="font-size:13px">手機可以長按圖片儲存，或按「分享」直接傳到 IG、LINE</div><div class="pvb">${navigator.canShare?'<button class="pri" id="cpShare">📤 分享到 IG / LINE…</button>':""}<a class="btn${navigator.canShare?"":" pri"}" id="cpDl" href="${url}" download="${fn}">⬇ 下載圖片</a><button id="cpCopy">📋 複製圖片</button><button id="cpLine">💬 LINE 分享連結</button><button id="cpFb">📘 FB 分享連結</button><button id="cpX">關閉</button></div></div>`);
 const close=()=>$("cardPv").remove();$("cpX").onclick=close;$("cardPv").onclick=e=>{if(e.target.id=="cardPv")close()};
 $("cpCopy").onclick=()=>cv.toBlob(async b=>{try{await navigator.clipboard.write([new ClipboardItem({"image/png":b})]);toast("已複製圖片，可以直接貼上")}catch{toast("這個瀏覽器不能複製圖片，請改用下載")}},"image/png");
 $("cpLine").onclick=()=>window.open(`https://social-plugins.line.me/lineit/share?url=${enc(SITE)}&text=${enc(text)}`,"_blank","noopener");
 $("cpFb").onclick=()=>window.open(`https://www.facebook.com/sharer/sharer.php?u=${enc(SITE)}&quote=${enc(text)}`,"_blank","noopener");
 if($("cpShare"))$("cpShare").onclick=()=>cv.toBlob(async b=>{const f=new File([b],fn,{type:"image/png"});try{if(navigator.canShare({files:[f]}))await navigator.share({files:[f],text:text+" "+SITE});else await navigator.share({text:text+" "+SITE,url:SITE})}catch{}},"image/png")}
function shareCard(p){const sr=starRank(p);showShare(cardCanvas(p),`${p.name}-生涯卡.png`,`我在足球員模擬器踢了一生：${p.name}（${p.c}・${POS[p.pos]}），巔峰 ${Math.round(p.peak)}、${p.goals} 球、${p.trophies.length} 座冠軍${sr?`，同世代第 ${sr.rank} 名`:""}。你能踢到哪裡？`)}
// ── 球員卡：FIFA 風格，1080×1080 正方形（IG 貼文、LINE、FB 都適用）；左邊卡片、右邊數據，上下緣對齊 ──
function playerCardCanvas(p){const W=1080,H=1080,cv=document.createElement("canvas");cv.width=W;cv.height=H;const g=cv.getContext("2d"),o=Math.round(ovr(p));
 const F=(sz,w=900)=>`${w} ${sz}px "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif`;
 const tier=o>=85?["#1a1030","#b07cff","#e7d4ff","ICON"]:o>=75?["#2a2000","#ffd23f","#fff2b0","GOLD"]:o>=65?["#22282b","#c9d3d8","#f2f6f8","SILVER"]:["#2a1608","#c98a4b","#f0d0a8","BRONZE"];
 // 版面格線：外框 40、內容區 80～1000；卡片與右欄共用上緣 TOP、下緣 BOT
 const TOP=120,BOT=900,L=80,CW=470,RX=L+CW+70,RW=1000-RX;
 const C=IMG(),bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,C.bg0);bg.addColorStop(1,C.bg1);g.fillStyle=bg;g.fillRect(0,0,W,H);
 g.fillStyle=C.stripe;for(let i=0;i<W;i+=90)g.fillRect(i,0,45,H);g.strokeStyle=C.frame;g.lineWidth=10;g.strokeRect(36,36,W-72,H-72);
 // 左：盾牌卡片
 const cx=L,cy=TOP,cw=CW,ch=BOT-TOP,mid=cx+cw/2;g.save();g.beginPath();g.moveTo(cx+46,cy);g.lineTo(cx+cw-46,cy);g.lineTo(cx+cw,cy+56);g.lineTo(cx+cw,cy+ch-120);g.lineTo(mid,cy+ch);g.lineTo(cx,cy+ch-120);g.lineTo(cx,cy+56);g.closePath();
 const cg=g.createLinearGradient(cx,cy,cx+cw,cy+ch);cg.addColorStop(0,tier[2]);cg.addColorStop(.5,tier[1]);cg.addColorStop(1,tier[2]);g.fillStyle=cg;g.fill();g.lineWidth=10;g.strokeStyle="#050a06";g.stroke();g.clip();
 g.fillStyle="#ffffff2a";g.beginPath();g.moveTo(cx,cy+210);g.lineTo(cx+cw,cy+90);g.lineTo(cx+cw,cy+135);g.lineTo(cx,cy+255);g.fill();g.restore();
 g.fillStyle=tier[0];g.textAlign="center";const lx=cx+105;
 g.font=F(120);g.fillText(o,lx,cy+150);g.font=F(46);g.fillText(posCode(p),lx,cy+205);g.font=F(24,700);g.fillText(p.c,lx,cy+245);g.fillText(tier[3],lx,cy+278);
 const fc=document.createElement("canvas");fc.width=fc.height=16;drawFace(fc,p);g.imageSmoothingEnabled=false;g.drawImage(fc,cx+cw-280,cy+50,240,240);
 let ns=50;g.font=F(ns);while(g.measureText(p.name).width>cw-90&&ns>26){ns-=2;g.font=F(ns)}g.fillText(p.name,mid,cy+365);
 g.fillRect(mid-150,cy+388,300,4);
 const FIFA=p.pos=="GK"?{速度:"SPD",射門:"SHO",傳球:"KIC",盤帶:"DRI",防守:"GK",體能:"PHY"}:{速度:"PAC",射門:"SHO",傳球:"PAS",盤帶:"DRI",防守:"DEF",體能:"PHY"};
 // 兩欄能力：數字靠右、縮寫靠左，對齊在同一條線
 ATTR.forEach((k,i)=>{const col=mid+(i%2?95:-95),y=cy+460+Math.floor(i/2)*66;g.textAlign="right";g.font=F(48);g.fillText(Math.round(p.a[k]),col-6,y);g.textAlign="left";g.font=F(28,700);g.fillText(FIFA[k],col+8,y)});
 g.textAlign="center";g.font=F(24,700);g.fillText(`逆足 ${"★".repeat(p.wf)}　花式 ${"★".repeat(p.sm)}`,mid,cy+655);
 // 右欄：標題 → 四列資訊 → 2×2 數據；上緣對齊卡片頂、數據底對齊卡片底
 g.textAlign="left";g.fillStyle=C.acc;g.font=F(34);g.fillText("足球員模擬器",RX,TOP+34);g.fillStyle=C.mut;g.font=F(24,500);g.fillText("我的球員",RX,TOP+72);
 const line=y=>{g.fillStyle=C.line;g.fillRect(RX,y,RW,2)};line(TOP+98);
 const rows=[["球風",styleOf(p),1],["球隊",p.club||p.stage||"—"],["聯賽",p.clubObj?p.clubObj.lg:"—"],["年齡",`${p.age} 歲`]];
 rows.forEach(([k,v,big],i)=>{const y=TOP+150+i*102;g.fillStyle=C.mut;g.font=F(24,500);g.fillText(k,RX,y);g.fillStyle=big?C.acc:C.fg;let sz=big?46:38;g.font=F(sz);while(g.measureText(String(v)).width>RW&&sz>22){sz-=2;g.font=F(sz)}g.fillText(String(v),RX,y+48)});
 line(TOP+560);
 const st=[["出賽",p.apps],[p.pos=="GK"?"零封":"進球",p.pos=="GK"?p.cleans:p.goals],["冠軍",p.trophies.length],["身價",p.club?eur(value(p)):"—"]];
 st.forEach(([k,v],i)=>{const x=RX+(i%2)*(RW/2),y=TOP+640+Math.floor(i/2)*120;g.fillStyle=C.acc;g.font=F(50);g.fillText(String(v),x,y);g.fillStyle=C.mut;g.font=F(24,500);g.fillText(k,x,y+38)});
 // 底部網址置中
 g.fillStyle=C.line;g.fillRect(L,BOT+50,1000-L,2);g.fillStyle=C.mut;g.textAlign="center";g.font=F(24,500);g.fillText("jackycheung0408.github.io/life-simulator/football",W/2,BOT+98);g.textAlign="left";return cv}
function sharePlayer(){const p=P;if(!p||p.age<p.touchAge){toast("還沒開始踢球，等長大一點再匯出");return}const wasPaused=paused;paused=true;
 showShare(playerCardCanvas(p),`${p.name}-球員卡.png`,`我的球員 ${p.name}：${p.c}・${DPN[dpOf(p)]}，綜合 ${Math.round(ovr(p))}，球風「${styleOf(p)}」，${p.age} 歲在${p.club||p.stage}。來足球員模擬器養一個你的球員！`);
 const x=$("cpX");const old=x.onclick;x.onclick=()=>{old();paused=wasPaused}}

// ── 全球排行榜（Supabase）：只能新增與讀取；資料庫端有數值上限、髒話過濾、送出頻率限制，檢舉 3 次自動隱藏 ──
const SB="https://gerqdagicybtyilihvvm.supabase.co/rest/v1/",SBK="sb_publishable_bPvbJFXUM_Ax2iPLeTS5zw_foV60x5y",SBH={apikey:SBK,"Content-Type":"application/json"};
function devId(){let d=null;try{d=localStorage.getItem("fb-dev")}catch{}if(!d){d="d"+Math.random().toString(36).slice(2)+Date.now().toString(36);try{localStorage.setItem("fb-dev",d)}catch{}}return d}
async function uploadCareer(p){const b=$("upload");if(b.dataset.done)return;b.disabled=true;b.textContent="上傳中…";
 const row={device:devId(),name:p.name.slice(0,24),country:p.c.slice(0,12),pos:p.pos,title:String(p._title||"").slice(0,30),peak:Math.min(99,Math.round(p.peak)),apps:Math.min(1200,p.apps),goals:Math.min(1500,p.goals),trophies:Math.min(60,p.trophies.length),awards:Math.min(80,p.awards.length),score:Math.min(2500,p._sc||0),born:p.y0,died:p.y0+p.age};
 try{const r=await fetch(SB+"fb_careers",{method:"POST",headers:{...SBH,Prefer:"return=minimal"},body:JSON.stringify(row)});
  if(r.ok){b.dataset.done=1;b.textContent="✔ 已上傳";toast("已上傳到全球排行榜");return}
  const e=await r.json().catch(()=>({}));toast({"too fast":"送太快了，請一分鐘後再試","bad words":"名字含有不當字詞，無法上傳",busy:"現在上傳的人太多，請稍後再試"}[e.message]||"資料不符合排行榜規則，無法上傳")}catch{toast("連線失敗，請稍後再試")}
 b.disabled=false;b.textContent="🌍 上傳到全球排行榜"}
let gbCountry="";
async function loadBoard(){const el=$("gb");if(!el)return;el.innerHTML="<p class='mut'>載入中…</p>";
 try{const q=`fb_careers?select=id,name,country,pos,title,peak,goals,trophies,score,born,died&order=score.desc&limit=30${gbCountry?`&country=eq.${encodeURIComponent(gbCountry)}`:""}`;
  const rows=await (await fetch(SB+q,{headers:SBH})).json();let rep=[];try{rep=JSON.parse(localStorage.getItem("fb-rep")||"[]")}catch{}
  el.innerHTML=rows.length?rows.map((x,i)=>`<div class="gbrow${i<3?" m"+(i+1):""}"><span class="gbn">${i<3?["🥇","🥈","🥉"][i]:i+1}</span><span class="gbp">${x.peak}</span><span class="gbm"><b>${esc(x.name)}</b><small>${esc(x.country)} · ${POS[x.pos]||""} · ${esc(x.title||"")} · ${x.born}–${x.died}</small></span><span class="gbs">⚽ ${x.goals}　🏆 ${x.trophies}</span><span class="gbsc">${x.score}</span>${rep.includes(x.id)?`<span class="gbr mut">已檢舉</span>`:`<button class="gbr linkbtn" data-id="${x.id}" title="名字不當可以檢舉，3 次自動隱藏">檢舉</button>`}</div>`).join(""):"<p class='mut'>還沒有人上傳。</p>";
  el.querySelectorAll("button.gbr").forEach(b=>b.onclick=async()=>{const id=+b.dataset.id;b.disabled=true;try{await fetch(SB+"rpc/fb_report",{method:"POST",headers:SBH,body:JSON.stringify({cid:id,dev:devId()})});rep.push(id);localStorage.setItem("fb-rep",JSON.stringify(rep));toast("已檢舉，謝謝回報");b.outerHTML='<span class="gbr mut">已檢舉</span>'}catch{toast("檢舉失敗")}})}
 catch{el.innerHTML="<p class='mut'>排行榜暫時無法載入。</p>"}}
// ── 揭曉 ──
function reveal(p){return new Promise(res=>{const ov=document.createElement("div");ov.id="reveal";
 ov.innerHTML=`<div><div class="mut" style="margin-bottom:10px">— 一位未來的足球員誕生了 —</div><div class="slot" id="rvN">？？？</div><div id="rvS" style="margin:14px 0"></div><button class="pri hide" id="rvGo">開始踢球 ▶</button><br><button id="rvSkip" style="margin-top:10px">跳過 ⏭</button></div>`;
 document.body.appendChild(ov);let t=0,d=40,done=false;const n=ov.querySelector("#rvN");
 const spin=()=>{if(done)return;n.textContent=wpick(COUNTRIES,x=>x[1])[0];t+=d;d*=1.1;if(t>2400){n.textContent=p.c;n.style.color="var(--y)";stamps();return}setTimeout(spin,d)};spin();
 function stamps(){const od=realOdds(p.c);ov.querySelector("#rvS").insertAdjacentHTML("beforebegin",`<p class='mut' style='max-width:420px;margin:10px auto'>真實世界裡，${p.c}同年出生的約 ${Math.round(od.boys/1e4)} 萬名男孩中：成為職業球員約 <b style='color:var(--y)'>${oneIn(od.pro)}</b>，踢進五大聯賽約 <b style='color:var(--y)'>${oneIn(od.top5)}</b>。</p>`);const it=[["位置",POS[p.pos]],["國家隊強度",p.cs],["出身",p.bg],["體型",p.body],["性格",p.mind],["家境",["貧困","偏低","中等","小康","富裕"][p.cls]],["天賦",p.card?`${p.card}・${p.flair}`:p.talent>=70?"罕見":p.talent>=60?"不錯":p.talent>=50?"普通":"平庸"]];
  it.forEach(([k,v],i)=>setTimeout(()=>{const s=document.createElement("span");s.className="stamp";s.innerHTML=`<span>${k}</span><b>${v}</b>`;ov.querySelector("#rvS").appendChild(s);if(i==it.length-1)ov.querySelector("#rvGo").classList.remove("hide")},300+i*320))}
 const close=()=>{done=true;ov.remove();res()};ov.querySelector("#rvGo").onclick=close;ov.querySelector("#rvSkip").onclick=close})}
