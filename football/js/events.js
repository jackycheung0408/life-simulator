// 事件：抉擇視窗、成長、大比賽、各種隨機事件
// ── 抉擇視窗 ──
function ask(q,opts,info){
 const avail=opts.filter(o=>!o[3]||o[3]());
 if(auto||toEnd){const o=pick(avail.length?avail:opts);say(`${q} → ${o[0]}`);o[1]();return Promise.resolve()}
 return new Promise(res=>{$("mtag").textContent=`${P.age} 歲 · ${P.y0+P.age} 年`;$("mctx").textContent=P.retired?"退休後":P.club?`${P.club}${P.phase?" · "+P.phase:""}`:P.stage||"";$("modal").classList.remove("hide");
  $("choice").innerHTML=`<h2 style="margin-top:10px">${q}</h2>${info?`<p class="mut">${info}</p>`:""}`+opts.map((o,i)=>{const ok=!o[3]||o[3]();return `<button class="opt" data-i="${i}" ${ok?"":"disabled"}>${o[0]}${o[2]?`<small>${o[2]}</small>`:""}</button>`}).join("");
  $("choice").querySelectorAll(".opt").forEach(b=>b.onclick=()=>{const o=opts[b.dataset.i],before=ovr(P);b.classList.add("picked");$("choice").querySelectorAll(".opt").forEach(x=>x.disabled=true);
   say(`${q} → ${o[0]}`);o[1]();setTimeout(()=>{$("modal").classList.add("hide");render();const d=ovr(P)-before;toast(d?`${o[0]}：能力 ${d>0?"+":""}${d}`:`選擇了「${o[0]}」`);res()},380)})});
}

// ── 成長：訓練重心 + 天賦上限 + 上場時間 + 年齡 ──
// ── 人際：教練、經紀人、最好的隊友、伴侶，各有名字與關係值（0～100）──
function newName(p){const nm=NM[p.region];return p.region=="華"?pick(nm.姓)+pick(nm.男):pick(nm.男)+" "+pick(nm.姓)}
function rel(p,k,d){p.rel=p.rel||{};const r=p.rel[k];if(!r)return 50;if(d){r.v=clamp(r.v+d,0,100)}return r.v}
function meet(p,k,name,v){p.rel=p.rel||{};p.rel[k]={name:name||newName(p),v:v??50};return p.rel[k]}
const RELN={coach:"總教練",agent:"經紀人",mate:"最好的隊友",partner:"伴侶"};
// ── 特質：你的選擇會留下特質，改變之後的機率 ──
const TRAITS={職業態度:"成長稍快、教練更信任",苦練:"成長稍快",自律:"受傷少、老化慢",夜生活:"成長變慢、容易受傷、容易鬧新聞",火爆:"名氣↑ 但容易和教練起衝突",
 領袖:"更容易當隊長，退休後當教練更順",媒體寵兒:"名氣成長快、球隊更常來挖角，退休後容易當球評",拚命:"比賽評分↑ 但受傷風險↑",會保養:"受傷少、能踢比較久",
 球商:"關鍵時刻成功率↑、能力下滑較慢",正直:"名氣與形象↑",貪財:"被禁賽或醜聞的風險↑"};
function tag(p,k){p.tags=p.tags||{};const first=!p.tags[k];p.tags[k]=Math.min(3,(p.tags[k]||0)+1);if(first)say(`獲得特質「${k}」：${TRAITS[k]}`,1)}
function T(p,k){return (p.tags&&p.tags[k])||0}
// ── 育成計劃：每週 7 天的訓練表，決定哪些能力進步、累積多少疲勞 ──
const ACTS={
 技術:{w:{盤帶:.55,傳球:.45},fat:10,c:"#3fa7ff"},射門:{w:{射門:1},fat:10,c:"#ff4d4d"},體能:{w:{體能:.6,速度:.4},fat:16,c:"#4cd964"},
 防守:{w:{防守:1},fat:12,c:"#b07cff"},戰術:{w:{傳球:.5,防守:.5},fat:6,c:"#ffd23f"},撲救:{w:{防守:.8,速度:.2},fat:10,c:"#ff9f40",gk:1},
 讀書:{w:{},fat:-6,c:"#a9c2ad",study:1},休息:{w:{},fat:-22,c:"#556b5c"}};
const KID_ACTS=["技術","體能","讀書","休息"];
const PRESETS={均衡:["技術","體能","射門","休息","戰術","防守","休息"],進攻:["射門","技術","射門","休息","體能","射門","休息"],防守:["防守","戰術","防守","休息","體能","防守","休息"],恢復週:["技術","休息","戰術","休息","休息","體能","休息"],拚命練:["技術","體能","射門","防守","體能","技術","射門"]};
const DAYS=["一","二","三","四","五","六","日"];
let plan=PRESETS.均衡.slice(),dayPick=null;
function actsFor(p){return p.age<13?KID_ACTS:Object.keys(ACTS).filter(k=>(!ACTS[k].gk||p.pos=="GK")&&(!ACTS[k].study||p.age<20))}
function planShare(){const s={};ATTR.forEach(k=>s[k]=0);plan.forEach(d=>{for(const[k,v]of Object.entries(ACTS[d].w))s[k]+=v/7});return s}
function planFat(){return plan.reduce((a,d)=>a+ACTS[d].fat,0)}
// 一段時間（frac=一年中的比例）的成長與疲勞
// 球風：看能力最突出的兩項（相對自己的平均），也會影響關鍵時刻與教練戰術
const STYLES={"速度,射門":"速度型射手","射門,體能":"禁區殺手","射門,盤帶":"技術型前鋒","傳球,盤帶":"組織核心","傳球,射門":"進攻組織者","防守,體能":"鐵血硬漢","防守,速度":"速度型後衛","傳球,防守":"節拍器","速度,盤帶":"突破快馬","體能,速度":"全場奔跑機","盤帶,射門":"技術型前鋒","傳球,速度":"邊路傳中手"};
function styleOf(p){if(p.age<13)return "還沒定型";const avg=ATTR.reduce((t,k)=>t+p.a[k],0)/6,top=ATTR.slice().sort((a,b)=>p.a[b]-p.a[a]);if(p.a[top[0]]-avg<4)return "全面均衡型";
 const key=[top[0],top[1]].sort((a,b)=>ATTR.indexOf(a)-ATTR.indexOf(b)).join(",");return STYLES[key]||STYLES[[top[1],top[0]].join(",")]||`${top[0]}專家`}
// 不改動能力，估算這份課表一季大概會讓各能力變多少（給課表面板用）
function planEstimate(p){const sh=planShare(),age=p.age,o=ovr(p),room=Math.max(0,p.pot-o);let base=(age<17?3.2:age<21?2.4:age<25?1.4:age<29?.4:age<32?-.8:-(age-29)*.9);
 if(age>=12&&age<29)base*=.6+.6*Math.min(1,room/12)+.6*.4;const fat=p.fat||0,tired=(fat>80?.55:fat>60?.85:1);const e={};
 ATTR.forEach(k=>{let d=base>0?base*(.4+7.5*sh[k])*tired:base+2.2*sh[k]*tired;if(age>=15&&age<=34)d+=3.2*(sh[k]-1/6)*tired;if((k=="速度"||k=="體能")&&age>=29)d-=(age-28)*.25;
  if(room<=0&&d>0&&base>0)d*=.35;e[k]=d});return e}
function grow(p,minutes,frac=1){
 if(p.age<p.touchAge)return;
 const o=ovr(p),room=Math.max(0,p.pot-o),age=p.age,sh=planShare(),fat=p.fat||0;
 const env=(p.academy==5||(p.clubObj&&p.clubObj.tier>=4))?1:clamp(.72+(p.cs-50)/140,.72,1); // 足球環境：強國或頂級聯賽練得比較快
 let base=(age<8?2.6:age<12?3.4:age<17?3.2:age<21?2.4:age<25?1.4:age<29?.4:age<32?-.8:-(age-29)*.9);if(base>0)base*=env;
 if(age>=12&&age<29)base*=.6+.6*Math.min(1,room/12)+minutes*.4;
 const tired=(fat>80?.55:fat>60?.85:1)*(1+.05*T(p,"職業態度")+.05*T(p,"苦練")-.08*T(p,"夜生活"));
 for(const k of ATTR){let d=base>0?base*frac*(.7+R()*.6)*(.4+7.5*sh[k])*tired:base*frac*(.7+R()*.6)+frac*2.2*sh[k]*tired;
  if((k=="速度"||k=="體能")&&age>=29)d-=frac*(age-28)*.25*(sh.體能>.15?.6:1)*(1-.12*T(p,"自律"));
  if(base<0)d*=1-.1*T(p,"球商");
  // 此消彼長：練得多的能力往上、沒練的慢慢退，讓課表真的決定你的風格
  if(age>=15&&age<=34)d+=frac*3.2*(sh[k]-1/6)*tired;
  if(p.pos=="GK"&&k=="射門")d*=.2;p.a[k]=clamp(p.a[k]+d,5,99)}
 if(age>=13){p.focus=p.focus||{};ATTR.forEach(k=>{p.focus[k]=Math.max(0,(p.focus[k]||0)*(1-.08*frac)+(sh[k]-1/6)*frac*2)})}
 if(base>0)p.s.反應=clamp(p.s.反應+base*frac*(.3+minutes*.6),1,99);
 const now=ovr(p);if(now>p.pot)ATTR.forEach(k=>p.a[k]-=(now-p.pot)*.5);capAttrs(p);
 // 疲勞：一週總負荷超過 30 就會累積
 p.fat=clamp(fat+(planFat()-30)*frac*4,0,100);const rest=plan.filter(d=>d=="休息").length;
 if(rest>=2)p.health=Math.min(100,p.health+frac*12);if(rest==0)p.morale-=frac*6;
 if(p.age>=6&&p.age<20&&!plan.includes("讀書"))p.grade=clamp((p.grade||60)-frac*7,0,100);
 if(p.age<13&&p.age>=p.touchAge){const play=plan.filter(d=>d=="技術"||d=="體能").length;
  if(play>=6&&R()<frac*.5){const t=pick([["每天都在踢球，作業都沒寫，被爸媽沒收了球鞋一個月。",()=>{p.grade-=4;p.morale-=4;plan=plan.map((d,i)=>i%2?"讀書":d)}],["連續踢太久，膝蓋和腳踝痠痛，醫生說小孩子也需要休息。",()=>{p.health-=6;p.fat=Math.min(100,(p.fat||0)+10)}],["老師打電話給爸媽，說你上課一直打瞌睡。",()=>{p.grade-=5}]]);say(t[0]);t[1]()}}
 if(plan.includes("讀書")&&p.age<20)p.grade=clamp((p.grade||60)+frac*plan.filter(d=>d=="讀書").length*3-frac*3,0,100);
}
// 小孩子沒有「訓練」，只有放學後的時間怎麼用；13 歲進青訓才有正式課表
const KID_NAME={技術:"踢球",體能:"跑跑跳跳",讀書:"寫功課",休息:"玩耍、看卡通"};
function renderPlan(){
 const p=P,kid=p.age<13;$("planCard").classList.toggle("hide",p.age<p.touchAge);if(p.age<p.touchAge)return;
 $("planTitle").textContent=kid?"放學後的時間（每週）":"育成計劃・每週訓練表";
 const acts=actsFor(p);plan=plan.map(d=>acts.includes(d)?d:(acts.includes("技術")?"技術":acts[0]));
 const sh=planShare(),fat=planFat(),load=fat<=20?["輕鬆","var(--g)"]:fat<=40?["適中","var(--y)"]:["吃重，容易受傷","var(--ac)"];
 $("focus").innerHTML=`<div class="days">${plan.map((d,i)=>`<button class="day" data-i="${i}" style="--c:${ACTS[d].c}"><span>週${DAYS[i]}</span><b>${kid?KID_NAME[d]||d:d}</b></button>`).join("")}</div>
  <div class="presets">${p.age<13?"":Object.keys(PRESETS).map(k=>`<button class="pre" data-k="${k}">${k}</button>`).join("")}</div>
  ${kid?`<div class="plan-sum"><span>功課 <b>${Math.round(p.grade||60)}</b></span><span>疲勞 <b style="color:${(p.fat||0)>60?"var(--ac)":"var(--fg)"}">${Math.round(p.fat||0)}</b></span>${!plan.includes("讀書")&&p.age>=6?`<span style="color:var(--ac)">一週都沒寫功課，成績會往下掉</span>`:""}${!plan.includes("休息")?`<span style="color:var(--ac)">一天都沒休息，身體會吃不消</span>`:""}</div>`:`<div class="plan-sum"><span>每週負荷 <b style="color:${load[1]}">${load[0]}</b></span><span>目前疲勞 <b style="color:${(p.fat||0)>70?"var(--ac)":"var(--fg)"}">${Math.round(p.fat||0)}</b></span>${(()=>{const est=planEstimate(p);return `<span class="est">一季預估：${ATTR.map(k=>`<i class="${est[k]>.3?"up":est[k]<-.3?"down":""}">${k} ${est[k]>=0?"+":""}${est[k].toFixed(1)}</i>`).join("")}</span>`})()}<span class="style">目前球風：<b>${styleOf(p)}</b></span>${ATTR.map(k=>`<span class="hide">${k} ${"▮".repeat(Math.round(sh[k]*14))||"·"}</span>`).join("")}</div>${(()=>{const lim=Math.min(97,Math.min(ageCap(p.age),p.pot)+6),maxed=ATTR.filter(k=>sh[k]>.05&&p.a[k]>=lim-.5);return maxed.length?`<div class="plan-warn">⚠ ${maxed.join("、")}已經到目前的上限（${Math.round(lim)}），再練也不會進步，可以把時間改練其他能力。</div>`:""})()}`}`;
 $("focus").querySelectorAll(".day").forEach(b=>b.onclick=()=>{const i=+b.dataset.i;dayPick=dayPick===i?null:i;renderPlan()});
 if(dayPick!=null){const box=document.createElement("div");box.className="daymenu";box.innerHTML=`<div class="mut">週${DAYS[dayPick]}要做什麼？</div>`+acts.map(a=>`<button data-a="${a}" style="border-top:4px solid ${ACTS[a].c}" class="${plan[dayPick]==a?"on":""}">${kid?KID_NAME[a]||a:a}</button>`).join("")+`<button data-all="1">整週都這樣</button>`;
  $("focus").querySelector(".days").after(box);box.querySelectorAll("button").forEach(x=>x.onclick=()=>{if(x.dataset.all){plan=plan.map(()=>plan[dayPick])}else plan[dayPick]=x.dataset.a;dayPick=null;renderPlan()})}
 $("focus").querySelectorAll(".pre").forEach(b=>b.onclick=()=>{plan=PRESETS[b.dataset.k].slice();renderPlan();toast(`訓練計劃：${b.dataset.k}`)});
 $("focusTip").textContent=kid?"點某一天，從選單挑要做什麼。踢球多，球技進步；寫功課多，成績比較好。13 歲進青訓後會有正式的訓練表。":(ovr(p)>=p.pot-1&&p.age>=16?"⚠ 已接近天賦上限，靠一般訓練很難再進步。名師指導、大賽表現、出國挑戰有機會突破上限。":"")+"點某一天，從選單挑訓練內容。練得越多進步越快，但疲勞超過 70 容易受傷；一週至少休息兩天比較健康。";
}

// ── 關鍵時刻：比賽中由你決定怎麼踢 ──
// ── 逐場大比賽：90 分鐘即時比分，中間有 2～3 個關鍵時刻由你決定 ──
async function potUp(p,n,why){if(p.age>=29)return;p.potUps=(p.potUps||0)+1;p.pot=Math.min(99,p.pot+n);say(`${why}，潛力上限提高到 ${Math.round(p.pot)}。`,1)}
// 各國的國內盃賽正式名稱
const CUPS={英格蘭:"英格蘭足總盃",西班牙:"西班牙國王盃",德國:"德國足協盃",義大利:"義大利盃",法國:"法國盃",葡萄牙:"葡萄牙盃",荷蘭:"荷蘭盃",巴西:"巴西盃",阿根廷:"阿根廷盃",美國:"美國公開盃",沙烏地阿拉伯:"沙烏地國王盃",日本:"天皇盃",韓國:"韓國足協盃",中國:"中國足協盃",墨西哥:"墨西哥盃",台灣:"台灣足協盃",奈及利亞:"奈及利亞足總盃"};
const cupName=ct=>CUPS[ct]||`${ct}盃`;
// 洲際盃賽：歐冠、南美自由盃、中北美冠軍盃、亞冠、非冠
const CONT={英格蘭:"歐",西班牙:"歐",德國:"歐",義大利:"歐",法國:"歐",葡萄牙:"歐",荷蘭:"歐",巴西:"南美",阿根廷:"南美",美國:"中北美",墨西哥:"中北美",日本:"亞",韓國:"亞",中國:"亞",沙烏地阿拉伯:"亞",奈及利亞:"非"};
const CONT_CUP={歐:"歐洲冠軍聯賽",南美:"南美自由盃",中北美:"中北美冠軍盃",亞:"亞洲冠軍聯賽",非:"非洲冠軍聯賽"};
// 有資格參賽：歐洲看頂級聯賽，其他洲看是不是聯賽前兩強
function contOk(c){const r=CONT[c.ct];if(!r)return false;if(r=="歐")return c.tier>=4;return CLUBS.filter(x=>x.lg==c.lg).sort((a,b)=>b.str-a.str).slice(0,2).includes(c)}
const EU7=["英格蘭","西班牙","德國","義大利","法國","葡萄牙","荷蘭"];
async function bigMatch(kind,oppStr,myStr){
 const p=P;
 // 宿敵：常輸給同一隊會變成宿敵，之後在同一個賽事範圍內有機會打復仇戰
 if(!kind.opp&&p.nemesis&&p.nemesis!=p.club&&p.clubObj&&R()<.6){const nc=CLUBS.find(c=>c.name==p.nemesis),me=p.clubObj;
  if(nc&&(kind.scope=="league"?nc.lg==me.lg:kind.scope=="cup"?nc.ct==me.ct:kind.scope=="cont"?CONT[nc.ct]==CONT[me.ct]&&contOk(nc):true)){kind.opp=nc.name;kind.revenge=1;oppStr=Math.max(oppStr,nc.str)}}
 if(kind.revenge)say(`🔥 復仇戰！再次碰上宿敵${kind.opp}${p.rivalP?`和他們的 ${p.rivalP}`:""}。`,1);
 const st={goals:0,assists:0,cleans:0,apps:0},opp=kind.opp||(()=>{const me=p.clubObj,EU=["英格蘭","西班牙","德國","義大利","法國","葡萄牙","荷蘭"];
  // 聯賽比賽找同聯賽、盃賽找同國家、歐冠找歐洲球隊
  const pool=CLUBS.filter(c=>c.name!=p.club&&(kind.scope=="league"?c.lg==me.lg:kind.scope=="cup"?c.ct==me.ct:kind.scope=="cont"?CONT[c.ct]==CONT[me.ct]&&contOk(c):true));
  const near=pool.filter(c=>Math.abs(c.str-oppStr)<8);return (near.length?pick(near):pool.length?pick(pool):{name:kind.scope=="league"?"聯賽對手":"對手"}).name})();
 let us=0,them=0,fx=null;sfx("whistle");const moments=[15+Math.floor(R()*20),45+Math.floor(R()*20),75+Math.floor(R()*12)].slice(0,R()<.5?2:3);
 say(`⚔ ${kind.name}：${kind.team||p.club} vs ${opp}`,1);
 const os=(p.stars||[]).find(s=>s.active&&(s.club==opp||(kind.team&&s.c==opp)));if(os)say(`對方陣中有 ${os.n}。`);
 for(let m=0;m<=90;m+=5){const u0=us,t0=them;
  // 雙方依實力隨機進球
  if(R()<.055*(1+(myStr-oppStr)/40))us++;if(R()<.055*(1+(oppStr-myStr)/40))them++;
  if(moments.includes(m)||moments.some(x=>x>m-5&&x<m)){const ok=await keyMoment(Object.assign(st,{label:`${kind.name} · 第 ${m} 分鐘 · ${us}:${them}`}));
   if(ok&&(p.pos=="FW"||p.pos=="MF"))us++;else if(!ok&&(p.pos=="GK"||p.pos=="DF"))them++}
  $("ticker").textContent=`${kind.name}｜${kind.team||p.club} ${us} : ${them} ${opp}｜第 ${m} 分鐘`;
  if(us>u0||them>t0){fx={until:performance.now()+1200,us:us>u0,seed:Math.floor(R()*300)};sfx(us>u0?"goal":"concede")}
  if(!toEnd)await animMatch({us,them,m},Math.max(40,(fx&&fx.until>performance.now()?1300:420)/mult),fx);
 }
 let res=us>them?"勝":us<them?"敗":"和";
 if(res=="和"&&kind.ko){const ok=R()<.5+(myStr-oppStr)/80+(p.pos=="GK"?p.a.防守/400:p.a.射門/500);res=ok?"勝":"敗";say(`延長賽後進入 PK 大戰……${ok?"你們贏了！":"輸了。"}`)}
 sfx("whistle");setTimeout(()=>sfx(res=="勝"?"win":res=="敗"?"lose":"kick"),450);
 say(`${kind.name}終場 ${us}:${them}，${res=="勝"?"贏球":res=="敗"?"輸球":"和局"}${res=="勝"&&st.goals?`，你進了 ${st.goals} 球`:""}。`,res=="勝");
 if(os){if(res=="敗"&&R()<.6){os.goals++;say(`${os.n}打進關鍵一球。`)}else if(res=="勝"){p.fame+=2;say(`你們擊敗了 ${os.n} 領軍的${opp}。`)}}
 if(CLUBS.some(c=>c.name==opp)){p.h2h=p.h2h||{};const h=p.h2h[opp]=p.h2h[opp]||{w:0,l:0};if(res=="勝")h.w++;else if(res=="敗")h.l++;
  if(kind.revenge&&res=="勝"){p.revenge=(p.revenge||0)+1;p.fame+=6;p.morale+=8;p.pop=clamp((p.pop??50)+6,0,100);say(`終於在復仇戰擊敗宿敵${opp}，一吐怨氣！`,1);if(h.w>=h.l){say(`和${opp}的恩怨告一段落。`);p.nemesis=null}}
  else if(kind.revenge&&res=="敗"){p.morale-=5;say(`又輸給了${opp}，${p.rivalP||"對手"}賽後還在社群上嘲諷你。`)}
  else if(!p.nemesis&&h.l>=2&&h.l>h.w){p.nemesis=opp;p.rivalP=newName({region:pick(Object.keys(NM))});say(`${opp}已經讓你輸了 ${h.l} 次，他們的 ${p.rivalP} 每次都盯死你。${opp}成為你的宿敵。`,1)}}
 p.bigGames=(p.bigGames||0)+1;if(res=="勝"){p.bigWins=(p.bigWins||0)+1;if(st.goals+st.assists>0&&R()<.3)potUp(p,1+R(),"大賽中的亮眼表現讓你找到新的自信");p.fame+=kind.fame||3;p.morale+=4;rel(p,"coach",3)}else p.morale-=3;
 if(!kind.team&&p.club)await pressTalk(res,opp);
 return {res,goals:st.goals,assists:st.assists};
}
// ── 球迷與媒體：粉絲數（萬人）、球迷支持度、賽後記者會 ──
// 依特質多一個專屬選項：火爆的人會嗆、正直的人說實話、媒體寵兒會耍嘴皮、領袖替全隊發言
function traitOpt(p,ctx){const o=[];
 if(T(p,"火爆"))o.push(["（火爆）直接開嗆",()=>{p.fame+=4;p.fans=(p.fans||0)*1.06;if(R()<.35){p.morale-=4;p.pop=clamp((p.pop??50)-6,0,100);say("話說太重，被聯盟約談。")}else say("這段發言成了本週最熱門的話題。",1)},"你的個性 · 名氣↑ 風險高"]);
 if(T(p,"正直"))o.push(["（正直）實話實說，承認自己的問題",()=>{p.pop=clamp((p.pop??50)+6,0,100);rel(p,"coach",3);say("坦白的態度讓球迷更支持你。")},"你的個性 · 支持度↑"]);
 if(T(p,"媒體寵兒"))o.push(["（媒體寵兒）用一句金句收尾",()=>{p.fame+=3;p.fans=(p.fans||0)*1.08;p.pop=clamp((p.pop??50)+3,0,100);say("你的金句被做成梗圖瘋傳。",1)},"你的個性 · 幾乎不會翻車"]);
 if(T(p,"領袖")&&ctx!="money")o.push(["（領袖）代表全隊發言",()=>{rel(p,"mate",6);rel(p,"coach",4);p.morale+=3},"你的個性 · 更衣室凝聚力↑"]);
 if(T(p,"貪財")&&ctx=="money")o.push(["（貪財）把條件談到最滿",()=>{if(R()<.6){p.wage*=1.25;say(`談到最好的條件，年薪 ${eur(p.wage)}。`,1)}else{p.pop=clamp((p.pop??50)-5,0,100);say("被媒體說成只認錢的球員。")}},"你的個性 · 年薪↑ 形象↓"]);
 if(T(p,"夜生活")&&ctx=="party")o.push(["（夜生活）帶大家去續攤",()=>{rel(p,"mate",6);p.fat=Math.min(100,(p.fat||0)+15)},"你的個性 · 疲勞↑"]);
 return o.slice(0,1)}
async function pressTalk(res,opp){const p=P;if(R()>.25)return;p.pop=p.pop??50;
 const q=res=="勝"?`贏下${opp}之後，記者把麥克風遞到你面前`:res=="敗"?`輸給${opp}之後，記者追問你的表現`:`和${opp}踢平之後，記者問你怎麼看`;
 await ask(q,[["感謝隊友和球迷",()=>{p.pop=clamp(p.pop+3,0,100);rel(p,"coach",2);rel(p,"mate",2)},"支持度↑ 教練隊友好感↑"],
  ["說一句有梗的話，製造話題",()=>{p.fame+=3;p.fans=(p.fans||0)*1.04;if(R()<.3){p.pop=clamp(p.pop-8,0,100);rel(p,"coach",-4);say("那句話被剪成迷因，有人笑也有人罵，教練不太高興。")}else say("這句話在社群上瘋傳，粉絲數一夜暴增。",1)},"名氣↑ 可能翻車"],
  [res=="勝"?"挑釁對手":"批評裁判",()=>{p.fame+=2;p.pop=clamp(p.pop+(R()<.5?4:-6),0,100);if(R()<.35){p.money-=.02;say("被聯盟以不當言論罰款。")}},"兩極 · 可能被罰款"],
  ["不接受採訪",()=>{p.pop=clamp(p.pop-2,0,100)},"支持度稍降"],...traitOpt(p,"press")])}
const MEDIA=[
 p=>p.pop<35&&ask("球迷在社群發起標籤要你離隊，主場比賽開始有噓聲",[["公開道歉，承諾會更努力",()=>{p.pop=clamp(p.pop+8,0,100);p.morale-=2},"支持度↑"],["發文嗆回去",()=>{tag(p,"火爆");p.pop=clamp(p.pop-6,0,100);p.fame+=2},"支持度↓ 名氣↑"],["關掉留言，用表現說話",()=>{p.edge=1},"下一個關鍵時刻成功率↑"]]),
 p=>p.pop>75&&ask("球迷票選你為本季最受歡迎球員，球隊想用你做宣傳主視覺",[["好，出席活動",()=>{p.fans=(p.fans||0)*1.1;p.fame+=3;p.money+=.01},"粉絲↑ 收入↑"],["只拍照片，不出席",()=>{p.fans=(p.fans||0)*1.04},""],["讓給隊友",()=>{rel(p,"mate",6);p.pop=clamp(p.pop+3,0,100)},"隊友好感↑"]]),
 p=>ask(RV("小報寫你「私下和其他球隊接觸」","八卦網站說你「已經談好下家」","記者拍到你和別隊高層吃飯"),[["召開記者會否認",()=>{p.pop=clamp(p.pop+(R()<.6?3:-4),0,100)},"看運氣"],["曖昧不回應",()=>{p.fame+=2;rel(p,"coach",-4);p.pop=clamp(p.pop-4,0,100)},"話題↑ 教練好感↓"],["交給經紀人處理",()=>{rel(p,"agent",3)},""]]),
 p=>ask("你的社群帳號被駭，發出一堆奇怪的貼文",[["立刻發聲明",()=>{p.pop=clamp(p.pop+1,0,100)},""],["自嘲一番，順勢做梗",()=>{p.fans=(p.fans||0)*1.08;p.fame+=2;if(R()<.2){p.pop=clamp(p.pop-5,0,100);say("有人覺得你不夠認真，還是被罵了。")}},"粉絲↑"],["乾脆刪掉帳號",()=>{p.fans=(p.fans||0)*.8;p.morale+=3},"粉絲↓ 心情↑"]]),
 p=>ask("知名 YouTuber 想找你拍挑戰影片",[["一起拍",()=>{p.fans=(p.fans||0)*1.12+5;p.fat=clamp((p.fat||0)+5,0,100)},"粉絲↑ 疲勞↑"],["只錄一段祝福",()=>{p.fans=(p.fans||0)*1.03},""],["婉拒",()=>{},""]]),
 p=>p.fame>60&&ask("你在慈善活動上的影片被大量轉發",[["順勢成立基金會",()=>{tag(p,"正直");p.money-=.05;p.pop=clamp(p.pop+8,0,100)},"支持度↑ 花錢"],["低調帶過",()=>{p.pop=clamp(p.pop+3,0,100)},""],["拿來接更多代言",()=>{p.money+=.05;p.pop=clamp(p.pop-3,0,100)},"收入↑ 形象↓"]]),
];
async function mediaYear(rating){const p=P;const _ask=ask;p.pop=p.pop??50;p.fans=p.fans||0;
 p.pop=clamp(p.pop+(50-p.pop)*.3+(rating-5.9)*6+(p.captain?1:0)-(p.morale<30?3:0),0,100);
 if(R()<.3){p.mSeen=p.mSeen||[];ask=(q,o,i)=>_ask(q,o.concat(traitOpt(p,"press")),i);for(const i of MEDIA.map((_,i)=>i).filter(i=>!p.mSeen.includes(i)).sort(()=>R()-.5)){const r=MEDIA[i](p);if(r){p.mSeen.push(i);await r;break}}ask=_ask}
 p.fans=Math.max(0,p.fans*.92+p.fame*.25*(1+.3*T(p,"媒體寵兒"))+(p.pop-50)*.1);p.maxFans=Math.max(p.maxFans||0,p.fans);
 if(p.pop<25){p.morale-=4;say("主場球迷的噓聲越來越大，你踢得很不自在。")}}
function fansTxt(n){return n>=1e4?`${(n/1e4).toFixed(1)} 億`:n>=1?`${n>=100?Math.round(n):n.toFixed(1)} 萬`:`${Math.round(n*1e4)}`}
// ── 關鍵時刻：依位置隨機抽一個情境，每個選項顯示成功率（看對應的細項能力、疲勞、特質）──
async function keyMoment(st){
 const p=P,S=p.s,fat=(p.fat||0)/400,bonus=.02*((rel(p,"mate")-50)/25)+(p.edge?.15:0)+.04*T(p,"球商")+.03*T(p,"拚命");
 const av=(...k)=>k.reduce((t,x)=>t+(S[x]||0),0)/k.length+(/射手|殺手|前鋒/.test(styleOf(p))&&k.some(x=>/射|跑位/.test(x))?8:/組織|節拍|傳中/.test(styleOf(p))&&k.some(x=>/傳|視野/.test(x))?8:/硬漢|後衛/.test(styleOf(p))&&k.some(x=>/搶斷|盯人|強壯/.test(x))?8:/突破|快馬/.test(styleOf(p))&&k.some(x=>/盤帶|敏捷/.test(x))?8:0);
 // o(文字, 基礎機率, 能力值, 成功描述, 失敗描述, 成功效果, 額外說明)
 const o=(label,base,att,good,bad,fx,extra,foot)=>{const c=clamp(base+att/220-fat+bonus+(foot?(p.wf-3)*.04:0)+(extra=="花式"?(p.sm-3)*.04:0),.05,.95);
  return [label,()=>{const ok=R()<c;p.edge=0;p._ok=ok;say(ok?good:bad,ok);if(ok){fx&&fx();p.morale+=3;p.fame+=2}else p.morale-=2;toast(ok?"成功！":"沒有成功")},`成功率約 ${Math.round(c*100)}%${extra&&extra!="花式"?" · "+extra:""}`]};
 const G=()=>st.goals++,A=()=>st.assists++,C=()=>st.cleans++;
 const SC={
  FW:[["下半場，你單刀面對門將",[o("大力抽射近角",.2,av("射術","射門力量"),"一腳抽射直入近角！","球打在門柱上彈出。",G,"",1),o("挑射過門將",.12,av("盤帶技術","控球"),"輕輕一挑，球越過門將落網！","挑太高，球飛出橫樑。",()=>{G();p.fame+=2},"花式"),o("傳給包抄的隊友",.3,av("短傳","視野"),"橫傳給隊友推空門，助攻一次！","傳球被後衛攔截。",A),o("假動作晃過門將",.15,av("敏捷","盤帶技術"),"晃過門將推射空門！","被門將撲到腳下。",G,"花式")]],
      ["角球開出，你在禁區裡",[o("衝前點搶點",.15,av("頭球","彈跳"),"前點一甩頭，球應聲入網！","頭球頂偏了。",G),o("繞到後點包抄",.18,av("跑位","頭球"),"後點無人防守，你輕鬆頂進！","球被後衛解圍。",G),o("把球回做給隊友",.3,av("短傳","反應"),"回做給隊友，他一腳打進！","回做被斷。",A)]],
      ["你被絆倒，裁判判了 12 碼",[o("射左下角，穩穩的",.55,av("射術"),"球應聲入網！","門將猜對方向，撲了出來。",G,"",1),o("大力射右上角",.42,av("射門力量"),"一腳轟進死角，門將毫無機會！","球飛過橫樑。",()=>{G();p.fame+=1}),o("勺子點球",.3,av("反應"),"勺子點球騙過門將，全場瘋狂！","門將站著不動接住了球。",()=>{G();p.fame+=4},"成功名氣大增")]],
      ["禁區邊緣背身拿球",[o("轉身直接射門",.15,av("敏捷","射術"),"轉身一腳低射得手！","射門被擋出。",G,"",1),o("和隊友做牆傳球",.3,av("短傳","跑位"),"撞牆配合撕開防線，助攻隊友破門！","傳球被斷。",A),o("用身體護球造犯規",.4,av("強壯"),"成功造成犯規，球隊獲得好位置任意球。","被對手斷球。",null)]]],
  MF:[["中場拿球，前方隊友正在跑位",[o("直塞穿透防線",.25,av("短傳","視野"),"一記手術刀直塞，隊友破門！","直塞被斷。",A),o("禁區外遠射",.08,av("遠射","射門力量"),"一腳世界波掛進死角！","遠射高出橫樑。",()=>{G();p.fame+=2},"",1),o("自己帶球突破",.15,av("盤帶技術","敏捷"),"連過兩人後推射得手！","被對手剷斷。",G,"花式"),o("回傳，控制節奏",.6,av("控球"),"穩穩控住節奏，球隊守住比分。","回傳太軟，差點被抄截。",null)]],
      ["禁區前沿獲得任意球",[o("弧線繞過人牆",.1,av("遠射","射術"),"弧線球繞過人牆，直掛死角！","被人牆擋出。",()=>{G();p.fame+=2},"",1),o("大力抽射",.08,av("射門力量"),"大力抽射穿過人牆縫隙！","球打在人牆上。",G),o("傳給後點包抄的隊友",.25,av("傳中","視野"),"精準吊到後點，隊友頭球破門！","傳球太長出了底線。",A)]],
      ["球隊斷球，發動反擊",[o("長傳找邊路隊友",.25,av("長傳","視野"),"四十公尺長傳精準找到隊友，助攻破門！","長傳被攔截。",A),o("自己帶球長途奔襲",.12,av("衝刺速度","盤帶技術"),"一路帶到禁區，冷靜推射得手！","被追上來的後衛斷掉。",G),o("放慢節奏等隊友插上",.5,av("控球","視野"),"耐心組織，球隊穩住控球權。","被對手搶回球權。",null)]]],
  DF:[["對手前鋒高速突破，只剩你一個後衛",[o("果斷剷球",.2,av("搶斷","反應"),"乾淨俐落的剷斷，化解危機！","剷球犯規，吃了一張黃牌。",C),o("卡位逼他到邊線",.25,av("強壯","衝刺速度"),"把對手逼到邊線，球出界了。","被對手加速甩開。",C),o("戰術犯規拉倒他",.85,0,"拉倒對手，吃黃牌但阻止了進球。","",()=>{p.fame-=1},"一定會吃牌")]],
      ["角球進攻，你上前助攻",[o("頭球攻門",.12,av("頭球","彈跳"),"高高躍起頭球破門！後衛也能進球！","頭球頂偏。",()=>{G();p.fame+=2}),o("在前點擋人掩護隊友",.35,av("強壯"),"你卡住防守球員，隊友頭球得分！","被裁判判犯規。",A),o("留在後面防反擊",.6,av("盯人"),"守住後方，沒讓對手打出反擊。","對手還是打出了一次快攻。",null)]],
      ["對手一記長傳打到你身後",[o("頭球解圍",.3,av("頭球","彈跳"),"頂出一記漂亮的解圍。","頭球沒頂到，對手拿到球。",C),o("胸部停球再回傳門將",.15,av("控球"),"冷靜停球回傳，看台響起掌聲。","停球失誤，差點送對手一球。",C,"有風險"),o("大腳解圍",.5,av("長傳"),"一腳把球踢出危險區。","解圍踢偏。",C)]]],
  GK:[["比賽最後一分鐘，對手獲得 12 碼罰球",[o("撲向左邊",.2,av("撲救","門將反應"),"你撲向左邊，把球擋了出去！全場沸騰。","球進了，對手射向另一邊。",C),o("撲向右邊",.2,av("撲救","門將反應"),"飛身撲右，指尖碰到球，救了下來！","對手射向左邊，球進了。",C),o("站在中間不動",.1,av("門將反應"),"對手勺子點球，你站在原地穩穩接住！","對手射向角落，你來不及反應。",()=>{C();p.fame+=3},"賭對手射中間")]],
      ["對手單刀直入，你要怎麼守？",[o("衝出去封角度",.25,av("門將站位","門將反應"),"你衝出去封住角度，射門打在你身上！","被對手挑射過頭頂。",C),o("留在門線上等",.2,av("門將反應"),"一個神仙撲救！","球從腋下鑽進網。",C),o("倒地撲他腳下",.22,av("撲救"),"勇敢地撲在對手腳下，搶下球！","撲空了，對手推射空門。",C)]],
      ["一記高吊傳中飛向小禁區",[o("出擊把球拳擊出去",.3,av("手型","彈跳"),"果斷出擊，一拳把球打出禁區。","出擊撲空，對手頭球破門。",C),o("穩穩接住",.25,av("手型"),"高高躍起穩穩接住。","球從手中滑落。",C),o("留在門線上",.3,av("門將站位"),"站好位置，擋下對手的頭球。","對手頭球近距離得分。",C)]]]};
 // 同一個情境不連續出現，並加上比賽當下的處境，讓每次讀起來不一樣
 const L=SC[p.pos].filter(x=>x[0]!=p.lastKM),[q0,opts]=pick(L.length?L:SC[p.pos]);p.lastKM=q0;
 const q=`${pick(["大雨滂沱中","客場一片噓聲中","0:1 落後的情況下","比分還是 0:0","補時階段","全場球迷屏息","你剛吃了一張黃牌","對手剛換上生力軍","雙腿已經開始抽筋","教練在場邊大吼","主場球迷齊聲吶喊","1:1 平手"])}，${q0}`;
 p._ok=false;await ask(q,opts,(st.label||"關鍵時刻")+"　·　成功率依你的細項能力、疲勞、特質計算");return p._ok;
}

// ── 每個階段一定會遇到的抉擇 ──
const PRO_EVENTS=[
 p=>ask("總教練說你這季可能不在先發名單",[["加練，證明自己",()=>{tag(p,"職業態度");p.a.體能+=2;p.fat=clamp((p.fat||0)+15,0,100)},"能力↑ 疲勞↑"],["要求租借到小球隊打主力",()=>{p.loan=true;p.a.盤帶+=1.5;p.a.傳球+=1.5;p.fame-=2;say("租借到小球隊半季，固定先發。")},"上場時間↑ 曝光↓"],["當面跟教練吵",()=>{tag(p,"火爆");p.morale-=8;if(R()<.4){p.contract=0;say("和教練鬧翻，被放上轉會名單。")}},"風險高"]]),
 p=>ask("隊長退休了，教練問你願不願意戴上隊長臂章",[["接下",()=>{tag(p,"領袖");p.captain=true;p.fame+=5;p.morale+=4;say("成為球隊隊長。",1)},"名氣↑ 壓力↑"],["讓給更資深的隊友",()=>{p.morale+=1},""],["先觀察一季再說",()=>{},""]]),
 p=>ask("運動品牌想找你代言",[["簽約代言",()=>{p.money+=Math.max(.02,p.fame*.01);p.fame+=3},"收入↑"],["專心踢球，婉拒",()=>{p.a.體能+=1},""],["只接家鄉的公益活動",()=>{p.fame+=2;p.morale+=3},"形象↑"]]),
 p=>ask("德比戰前，對手後衛在媒體上挑釁你",[["在社群上回嗆",()=>{tag(p,"火爆");p.fame+=3;if(R()<.35){p.morale-=5;say("比賽中情緒失控吃了紅牌，被禁賽兩場。")}},"名氣↑ 可能失控"],["不回應",()=>{p.morale+=1},""],["用場上表現回答",()=>{p.edge=1},"下一個關鍵時刻成功率↑"]]),
 p=>ask("大腿有點緊，教練問你要不要上場踢關鍵戰",[["打止痛針上場",()=>{tag(p,"拚命");p.fame+=2;if(R()<.3){p.injuryLeft=1;p.injuries++;p.health-=15;say("比賽中傷勢加重，要休息好一陣子。",1)}},"可能傷得更重"],["只踢下半場",()=>{p.fat=clamp((p.fat||0)-5,0,100)},"折衷"],["休息，養好傷",()=>{tag(p,"會保養");p.fat=clamp((p.fat||0)-20,0,100);p.health+=5},"疲勞↓"]]),
 p=>ask("隊友在更衣室公開批評你不夠拚",[["私下找他好好談",()=>{p.morale+=3},"關係修復"],["向教練反映",()=>{p.morale-=1},""],["在訓練中證明自己",()=>{tag(p,"職業態度");p.a.體能+=1.5;p.fat=clamp((p.fat||0)+10,0,100)},"能力↑ 疲勞↑"]]),
 p=>ask("電視台想幫你做一集專訪",[["接受專訪",()=>{tag(p,"媒體寵兒");p.fame+=4;if(R()<.2){p.fame-=8;say("專訪中一句話被斷章取義，被罵了好幾天。")}},"名氣↑ 有風險"],["婉拒",()=>{},""],["只聊家鄉和家人",()=>{p.fame+=2;p.morale+=2},"形象↑"]]),
 p=>ask("經紀人想幫你談加薪，可能會跟球隊鬧僵",[["硬談",()=>{if(R()<.55){p.wage*=1.2;say(`談成加薪，年薪變成 ${eur(p.wage)}。`)}else{p.morale-=5;say("談判破局，球隊高層對你很不滿。")}},"可能加薪兩成"],["用延長合約換加薪",()=>{p.contract+=2;p.wage*=1.08;say(`延長合約兩年，年薪 ${eur(p.wage)}。`)},"穩"],["不談，專心踢球",()=>{p.morale+=1},""]]),
 p=>ask("球迷在社群網路上狂罵你最近表現差",[["發文回應",()=>{if(R()<.5){p.fame+=2}else{p.morale-=4}},"兩極"],["關掉社群一段時間",()=>{p.morale+=2},""],["找運動心理師聊聊",()=>{tag(p,"自律");p.morale+=5;p.money-=.01},"心情↑"]]),
 p=>ask("教練想把你改踢其他位置",[["接受挑戰",()=>{const np=bestDp(p);if(np!=dpOf(p)){setDp(p,np);say(`改踢${DPN[np]}（${np}）。`,1)}else say("教練看了之後，覺得你原本的位置最適合。")},"位置改變"],["堅持原本的位置",()=>{p.morale-=1},""],["只在必要時客串",()=>{},""]]),
 p=>ask("短暫休假，朋友邀你出國玩",[["去放鬆一下",()=>{p.morale+=6;p.fat=clamp((p.fat||0)-30,0,100);p.a.體能-=1},"疲勞↓↓"],["留下來自主訓練",()=>{p.a.體能+=1.5},"能力↑"],["回家陪爸媽",()=>{p.morale+=4;p.fat=clamp((p.fat||0)-20,0,100)},"心情↑"]]),
];
const YOUTH_EVENTS=[
 p=>ask("青年隊比賽前一天剛好是段考",[["去比賽，考試隨便寫",()=>{p.a.體能+=1;p.grade-=8},"功課↓"],["請假專心考試",()=>{p.grade+=6;p.morale-=2},"功課↑"],["考完直接衝去比賽",()=>{p.fat=clamp((p.fat||0)+15,0,100);p.grade+=2},"很累"]]),
 p=>ask("外國俱樂部的球探說下週會來看你比賽",[["拚盡全力表現",()=>{if(ovr(p)>=38+R()*10){p.scouted=true;p.academy=Math.max(p.academy||0,4);say("球探留下名片，說之後會再聯絡你。",1)}else say("那場比賽踢得很緊張，球探沒有再出現。")},"可能被看上"],["照平常踢",()=>{},""],["裝病不上場，怕表現不好",()=>{p.morale-=4},""]]),
 p=>ask("家裡經濟變緊，爸媽希望你週末去打工",[["週末去打工",()=>{p.money+=.002;p.fat=clamp((p.fat||0)+12,0,100);p.morale+=1},"家裡輕鬆一點"],["繼續練球，答應以後再回報",()=>{p.morale-=3},"家裡氣氛變差"],["申請體育獎學金",()=>{if((p.grade||60)>=60&&ovr(p)>=35){say("拿到體育獎學金！",1);p.money+=.003}else say("獎學金沒有申請上。")},"要成績和球技都夠"]]),
 p=>ask("隊上的學長常常欺負你",[["告訴教練",()=>{p.morale+=2},""],["忍下來",()=>{p.morale-=5},"心情↓"],["在練習中用球技讓他閉嘴",()=>{p.a.盤帶+=1.5;p.morale+=2},"盤帶↑"]]),
 p=>ask("最近一直抽高，膝蓋痛到上下樓梯都很吃力",[["停練一個月休養",()=>{tag(p,"會保養");p.fat=0;p.health+=8},"恢復"],["減少訓練量",()=>{p.fat=clamp((p.fat||0)-15,0,100)},""],["咬牙照練",()=>{tag(p,"拚命");p.a.體能+=1;if(R()<.35){p.injuryLeft=1;p.health-=12;say("膝蓋發炎，被迫休息了半年。")}},"可能受傷"]]),
 p=>ask("有人找你一起拍足球短影音",[["一起拍",()=>{p.fame+=3;p.a.盤帶+=.5},"名氣↑"],["不拍，專心練",()=>{p.a.盤帶+=.5},""],["只拍訓練日常",()=>{p.fame+=1.5},""]]),
 p=>ask("喜歡上班上的一個人",[["鼓起勇氣告白",()=>{if(R()<.5){p.morale+=6;say("對方答應了，每天放學一起走回家。")}else{p.morale-=4;say("被拒絕了，難過了好幾天。")}},"可能成功"],["默默放在心裡",()=>{},""],["專心踢球，不想分心",()=>{p.a.體能+=.5},""]]),
 p=>ask("教練因為全隊輸球，罰大家跑操場二十圈",[["全力跑完",()=>{p.a.體能+=1.5;p.fat=clamp((p.fat||0)+10,0,100)},"體能↑"],["偷懶少跑幾圈",()=>{if(R()<.4){p.morale-=3;say("被教練抓到，隔週被放板凳。")}},"可能被抓"],["幫跑不動的隊友打氣",()=>{p.morale+=3},"人緣↑"]]),
];
// 預備隊時期
const RESERVE_EVENTS=[
 p=>ask("一線隊缺人，教練臨時叫你跟著去客場",[["全力準備，說不定能上場",()=>{if(R()<.35){p.debut=p.debut||p.age;p.apps++;p.fame+=2;say("最後十分鐘替補上場，完成一線隊初登場！",1)}else say("坐在板凳上看完整場，但學到很多。")},"可能初登場"],["當作觀摩學習",()=>{p.a.傳球+=.8},""],["說身體不舒服推掉",()=>{p.morale-=3},"教練印象↓"]]),
 p=>ask("預備隊教練私下說，一線隊的位置被新買的球員卡住了",[["加練，搶回位置",()=>{p.a.體能+=1.5;p.fat=clamp((p.fat||0)+12,0,100)},"能力↑ 疲勞↑"],["請經紀人找出路",()=>{p.contract=Math.min(p.contract,0)},"可能轉隊"],["耐心等機會",()=>{p.morale+=1},""]]),
 p=>ask("預備隊比賽的球場只有幾十個觀眾，你覺得有點迷惘",[["寫下目標，每天提醒自己",()=>{p.morale+=4},"心情↑"],["跟家人聊聊",()=>{p.morale+=3},""],["開始想要不要放棄足球",()=>{p.morale-=4;p.doubt=(p.doubt||0)+1},"心情↓"]]),
];
// 人際事件
PRO_EVENTS.push(
 p=>{const c=p.rel?.coach;if(!c)return Promise.resolve();return ask(`總教練 ${c.name} 找你單獨談話，說想調整你的踢法`,[["照他說的改",()=>{rel(p,"coach",10);p.a.傳球+=1;plant(p,"coach",3,{name:c.name})},"教練信任↑ · 會影響未來"],["說出自己的想法",()=>{rel(p,"coach",R()<.6?6:-6)},"看他的個性"],["表面答應，比賽照舊",()=>{rel(p,"coach",-10);p.a.盤帶+=.5},"教練信任↓"]],`目前和教練的關係：${rel(p,"coach")}`)},
 p=>{const m=p.rel?.mate;if(!m)return Promise.resolve();return ask(`最好的隊友 ${m.name} 最近狀態很差，常常一個人坐在更衣室`,[["約他出去吃飯聊聊",()=>{rel(p,"mate",15);p.morale+=2;say(`${m.name}說謝謝你陪他度過低潮。`);plant(p,"mate",3,{name:m.name})},"感情↑ · 會影響未來"],["加練時拉著他一起",()=>{rel(p,"mate",8);p.a.體能+=1},""],["自己的事都顧不完了",()=>{rel(p,"mate",-12)},"感情↓"]],`和 ${m.name} 的關係：${rel(p,"mate")}`)},
 p=>{const m=p.rel?.mate;if(!m||rel(p,"mate")<60)return Promise.resolve();return ask(`${m.name}要轉會到別的國家了，臨走前問你要不要一起去`,[["叫經紀人去談，一起轉會",()=>{p.contract=0;p.followMate=1;say(`決定在合約到期後跟著 ${m.name} 一起走。`)},"可能轉隊"],["祝福他，留下來",()=>{rel(p,"mate",-5);meet(p,"mate",null,45)},"換一位隊友"],["約好以後一起退休、一起開足球學校",()=>{p.mateDream=1;rel(p,"mate",10)},"退休後的伏筆"]])},
 p=>{const a=p.rel?.agent;if(!a)return Promise.resolve();return ask(`經紀人 ${a.name} 說有一支球隊願意開高薪，但要你下個月就決定`,[["全權交給他處理",()=>{if(rel(p,"agent")>=60){p.wage*=1.12;say("經紀人幫你談成加薪。")}else{p.money-=p.wage*.1;rel(p,"agent",-15);say("後來才發現經紀人私下拿了回扣。")}},"看經紀人可不可靠"],["自己親自去談",()=>{rel(p,"agent",-5);p.wage*=1.04},""],["換一位經紀人",()=>{meet(p,"agent",null,40+R()*40);say("換了新的經紀人。")},"重新開始"]],`經紀人可信度：${rel(p,"agent")}`)},
 p=>{const pt=p.rel?.partner;if(!pt||p.clubObj?.ct==p.c)return Promise.resolve();return ask(`${pt.name}在國外住不習慣，想搬回家鄉`,[["跟家鄉球隊談轉會",()=>{p.goHome=1;rel(p,"partner",12);p.contract=Math.min(p.contract,0)},"可能回國踢球"],["請家人來陪伴",()=>{rel(p,"partner",6);p.money-=.05},"花一筆錢"],["說服對方再撐一下",()=>{rel(p,"partner",-12);p.morale-=3},"感情↓"]],`和 ${pt.name} 的關係：${rel(p,"partner")}`)},
);
// 更多一線隊事件
PRO_EVENTS.push(
 p=>ask("聽說國外有一位傳奇教練開設私人特訓營",[["自費飛去參加一個月",()=>{p.money-=.05;ATTR.forEach(k=>p.a[k]+=.6);if(R()<.55)potUp(p,2+R()*2,"傳奇教練的特訓讓你脫胎換骨")},"花錢 · 可能突破上限"],["請他寄訓練菜單就好",()=>{p.a.體能+=1},""],["沒時間",()=>{},""]]),
 p=>ask("運動科學團隊建議你做一套完整的體能檢測",[["照數據重新設計訓練",()=>{p.a.體能+=1.5;p.a.速度+=1;if(R()<.3)potUp(p,1+R(),"科學化訓練找到你的潛能")},"體能↑"],["只做基本檢查",()=>{p.health+=3},""],["相信自己的感覺",()=>{},""]]),
);
PRO_EVENTS.push(
 p=>ask("有陌生人私訊，說只要這場故意踢差就給你一大筆錢",[["立刻拒絕並向聯盟舉報",()=>{tag(p,"正直");p.fame+=4;p.morale+=2;say("舉報打假球集團，聯盟公開表揚。",1);plant(p,"whistle",3)},"形象↑ · 會影響未來"],["不理他",()=>{},""],["收下錢",()=>{tag(p,"貪財");p.money+=.3;if(R()<.6){p.banned=2;p.fame-=40;p.contract=0;say("打假球被查到，遭禁賽兩年、球隊解約。",1)}else plant(p,"bribe",3+Math.floor(R()*3))},"違法 · 可能被禁賽 · 會影響未來"]]),
 p=>ask("賽後被抽中藥檢，但你前幾天吃了感冒藥",[["主動向隊醫說明",()=>{p.morale+=1},"安全"],["什麼都不說",()=>{if(R()<.25){p.injuryLeft=1;p.fame-=10;say("藥檢呈陽性，被禁賽半季。",1)}},"有風險"],["請律師準備",()=>{p.money-=.02},"花錢買安心"]]),
 p=>ask("自由球員市場有一支中東球隊開出三倍年薪",[["心動，叫經紀人去談",()=>{p.contract=0;p.wantMoney=1},"合約到期時優先考慮"],["拒絕，還想在歐洲拚",()=>{p.morale+=2},""],["拿來跟現在的球隊談加薪",()=>{p.wage*=1.1},"年薪↑"]]),
 p=>ask("球隊連輸五場，總教練被炒了",[["跟新教練好好表現",()=>{const ns=pick(Object.keys(TAC));p.coachStyle=ns;meet(p,"coach",null,50);say(`新教練偏好「${ns}」，看重${TAC[ns].join("、")}。`,1);p.a.傳球+=1;p.morale+=1},""],["私下支持舊教練",()=>{p.morale-=2;if(R()<.3){p.contract=Math.min(p.contract,1);say("新教練不太喜歡你。")}},"可能被冷凍"],["專心踢好自己的比賽",()=>{p.morale+=1},""]]),
 p=>ask("家鄉的少年足球隊邀請你回去辦一場訓練營",[["免費回去教小朋友",()=>{p.fame+=3;p.morale+=5;say("回家鄉辦訓練營，小朋友們圍著你要簽名。",1);plant(p,"camp",7)},"心情↑ 名氣↑ · 會影響未來"],["捐一筆錢就好",()=>{p.money-=.05;p.fame+=2},""],["賽季太忙，婉拒",()=>{},""]]),
 p=>ask("訓練中被隊友不小心踢傷，對方一直跟你道歉",[["原諒他，繼續練",()=>{p.morale+=2;p.health-=3},""],["休息幾天",()=>{p.fat=clamp((p.fat||0)-15,0,100)},"疲勞↓"],["在媒體前抱怨",()=>{p.morale-=3;p.fame-=2},"更衣室氣氛↓"]]),
 p=>ask("有人提議你歸化去踢另一個國家的國家隊",[["考慮看看",()=>{p.cs=Math.max(p.cs,72);say("拿到第二國籍，有機會入選新國家的國家隊。",1)},"國家隊門檻改變",()=>p.caps==0&&p.age<=27],["只想代表自己的國家",()=>{p.morale+=3},""],["等更好的機會",()=>{},""]]),
);
// 更多青少年事件
YOUTH_EVENTS.push(
 p=>ask("教練說你太依賴慣用腳",[["每天加練逆足",()=>{tag(p,"苦練");if(p.wf<5&&R()<.5){p.wf++;say(`逆足進步到 ${"★".repeat(p.wf)}。`,1)}p.fat=clamp((p.fat||0)+6,0,100)},"逆足可能升級"],["專心把慣用腳練到最好",()=>{p.s.射術+=1.5},"射術↑"],["不理他",()=>{},""]]),
 p=>ask("看到街頭足球高手的花式影片",[["每天苦練花式動作",()=>{tag(p,"苦練");if(p.sm<5&&R()<.45){p.sm++;say(`花式技巧進步到 ${"★".repeat(p.sm)}。`,1)}},"花式可能升級"],["只練實用的過人",()=>{p.s.盤帶技術+=1.5},"盤帶↑"],["覺得太花俏",()=>{},""]]),
 p=>ask("學校老師說你如果再缺課，就不能參加比賽",[["乖乖上課補進度",()=>{p.grade+=8;p.fat=clamp((p.fat||0)-10,0,100)},"功課↑"],["請教練跟學校溝通",()=>{p.grade-=2},""],["改讀體育班",()=>{p.a.體能+=1.5;p.grade-=4},"練球時間↑"]]),
 p=>ask("全國青年盃決賽，延長賽 PK 大戰輪到你",[["射左下角",()=>{if(R()<.45+p.a.射門/250){say("罰進了！球隊拿下全國冠軍。",1);p.fame+=4;p.morale+=6}else say("被門將撲出，哭著走回中線。")},"看射門"],["射正中間",()=>{if(R()<.5){say("勺子點球騙過門將，全場尖叫！",1);p.fame+=5}else say("門將站著不動接住了球。")},"賭一把"],["跟隊友換順序",()=>{p.morale-=2},""]]),
 p=>ask("隔壁城市的強隊想挖角你",[["轉過去，接受更強的訓練",()=>{p.a.傳球+=1;p.a.盤帶+=1;p.morale-=2},"能力↑ 離家遠"],["留在原隊當核心",()=>{p.morale+=3},""],["叫爸媽決定",()=>{},""]]),
 p=>ask("營養師說你的飲食太亂，常吃炸物和含糖飲料",[["完全照營養師的菜單吃",()=>{tag(p,"自律");p.a.體能+=1.5;p.morale-=1},"體能↑"],["少吃一點就好",()=>{p.a.體能+=.5},""],["年輕不怕，照吃",()=>{p.morale+=1},""]]),
 p=>ask("看到心中偶像在電視上踢出一記任意球",[["每天加練一百次任意球",()=>{p.a.射門+=1.5;p.fat=clamp((p.fat||0)+8,0,100)},"射門↑"],["研究他的比賽影片",()=>{tag(p,"球商");p.a.傳球+=1},"球商↑"],["只是看看",()=>{},""]]),
);
const MINOR=[
 p=>{const w=g("proWho");p.morale+=1;return pick([`${w}在更衣室放了一首老歌，全隊一起大合唱。`,`和${w}打賭輸了，請大家喝飲料。`,`${w}教你幾句外國話，大家笑成一團。`])},
 p=>{const c=g("city");p.fame+=.5;return pick([`在${c}的咖啡店被球迷認出來，老闆請你喝一杯。`,`${c}的小學生寫信說你是他的偶像。`])},
 p=>{p.s.反應=clamp(p.s.反應+.5,1,99);return pick(["睡前看了一場經典比賽的重播，學到新的跑位。","在訓練中被教練點名示範，有點緊張但完成了。"])},
 p=>{const wx=g("weather");p.fat=clamp((p.fat||0)+4,0,100);return `${wx}天的訓練特別辛苦。`},
 p=>{const f=g("family");p.morale+=2;return pick([`${f}來看你比賽，在看台上舉著自己做的加油牌。`,`${f}寄來一箱家鄉的水果。`])},
 p=>{p.morale+=2;return pick(["球迷在社群上做了一支你的精華影片，點閱破十萬。","收到一位小球迷寄來的手寫卡片。","下大雨，訓練改到室內，大家玩起了足球網球。"])},
 p=>{p.fat=clamp((p.fat||0)+6,0,100);return pick(["客場搭了十幾個小時的巴士，下車時腿都麻了。","連續三場比賽間隔不到四天，身體很疲憊。"])},
 p=>{p.a.傳球+=.4;return pick(["和新來的隊友練出默契，傳球越來越順。","看了好幾場自己比賽的錄影，發現不少可以改進的地方。"])},
 p=>{p.morale-=2;return pick(["比賽中被裁判漏判一個點球，整晚睡不著。","被對手踩了一腳，腳背腫了好幾天。","家鄉的老朋友說很久沒見到你了。"])},
 p=>{p.fame+=1;return pick(["地方報紙刊出你的專訪。","在路上第一次被球迷認出來要合照。"])},
 p=>{p.health-=2;return pick(["感冒發燒，請假兩天。","吃壞肚子，賽前一直跑廁所。"])},
 p=>{p.money+=.002;return pick(["幫社區少年隊上了一堂課，拿到一點車馬費。","二手市場賣掉舊球鞋，被球迷高價收藏。"])},
];
// ── 隨機事件產生器：人物、地點、情境、結果隨機組合，每段人生都不一樣 ──
const G={
 kidWho:["同班的阿明","隔壁的大哥哥","表哥","新轉學來的同學","社區的阿伯","學校的體育老師","一起長大的玩伴","補習班認識的朋友"],
 teenWho:["隊上的學長","同屆的隊友","班上的同學","青訓的室友","以前的國小同學","別隊的對手","教練的兒子","住在附近的退役球員"],
 proWho:["一位老隊友","新來的外籍隊友","隊上的門將","青年隊的學弟","隊醫","球隊的翻譯","老家的朋友","一位退役的傳奇球員"],
 place:["河堤旁的空地","廟口廣場","學校後面的停車場","海邊的沙灘","公園的籃球場","社區的頂樓","下雨後的泥巴地","高架橋下"],
 city:["城北","海港區","老街","山邊小鎮","工業區","市中心","大學城","河對岸"],
 skill:[["一招假射真扣","盤帶技術"],["外腳背傳球","短傳"],["頭球的起跳時機","頭球"],["門前的跑位","跑位"],["卡位用肩膀的技巧","強壯"],["第一腳停球","控球"],["長傳轉移","長傳"],["彈地遠射","遠射"],["倒地剷球的時機","搶斷"],["反越位的啟動","衝刺速度"],["呼吸調節的跑法","耐力"],["看對手膝蓋判斷方向","攔截"]],
 body:["腳踝","膝蓋","大腿後側","小腿","腰","肩膀","鼠蹊部","腳趾"],
 food:["夜市的鹽酥雞","媽媽的牛肉麵","隊友阿嬤做的便當","便利商店的御飯糰","路邊攤的烤玉米"],
 media:["地方電視台","體育網站","知名 YouTuber","球迷論壇","報紙體育版","Podcast 節目"],
 rumor:["和某位明星交往","私下想轉會","和教練不合","酒駕被攔檢","在夜店打架","收了球鞋廠商的錢"],
 sponsor:["當地的牛肉麵店","一間運動飲料公司","手機遊戲廠商","汽車經銷商","老家的農會","一個網紅品牌"],
 weather:["颱風","寒流","大雪","暴雨","熱浪","沙塵暴"],
 family:["阿公","阿嬤","媽媽","爸爸","哥哥","姊姊","舅舅"],
 trouble:["住院開刀","生意失敗欠了錢","心情很低落","要搬家","身體不太好"],
};
const g=k=>pick(G[k]);
// 每個模板回傳一個抉擇；效果也帶隨機
const GEN={
 kid:[
  p=>{const w=g("kidWho"),pl=g("place");return ask(`${w}約你去${pl}踢球`,[["馬上衝去",()=>{p.a.盤帶+=.8+R();say(`在${pl}踢到天黑，${pick(["球技又進步了一點","鞋子都踢破了","被蚊子叮了滿腿包"])}。`)},"球技↑"],["寫完功課再去",()=>{p.grade+=2;p.a.傳球+=.5},"兩邊兼顧"],["今天想在家",()=>{p.morale+=1},""]])},
  p=>{const w=g("kidWho"),[sk,at]=g("skill");return ask(`${w}教你${sk}`,[["認真學，一直練到會",()=>{p.s[at]=clamp(p.s[at]+2+R()*2,1,99);say(`學會了${sk}。`)},`${at}↑`],["學一點就去玩",()=>{p.s[at]=clamp(p.s[at]+1,1,99)},""],["覺得很難，放棄",()=>{p.morale-=1},""]])},
  p=>{const f=g("family"),t=g("trouble");return ask(`${f}${t}，家裡氣氛很沉重`,[["每天去陪${f}",()=>{p.morale+=2;p.fat=Math.max(0,(p.fat||0)-10)},"家人↑"],["用踢球轉移心情",()=>{p.a.射門+=1},""],["偷偷躲起來哭",()=>{p.morale-=3},""]].map(o=>[o[0].replace("${f}",f),o[1],o[2]]))},
  p=>{const wx=g("weather");return ask(`${wx}來了，學校停課`,[["在家對著牆壁練球",()=>{p.a.盤帶+=1;say(pick(["被樓下鄰居抗議。","練到媽媽喊吃飯。"]))},"盤帶↑"],["看了一整天的球賽影片",()=>{p.s.視野=clamp(p.s.視野+1.5,1,99)},"視野↑"],["睡一整天",()=>{p.fat=Math.max(0,(p.fat||0)-15)},""]])},
  p=>{const fd=g("food");return ask(`比賽前一天，${fd}看起來好好吃`,[["吃到飽",()=>{p.morale+=3;if(R()<.4){p.health-=4;say("隔天肚子痛，比賽踢得很辛苦。")}},"可能拉肚子"],["吃一點就好",()=>{p.morale+=1},""],["忍住，乖乖吃清淡的",()=>{p.a.體能+=.5},""]])},
 ],
 teen:[
  p=>{const w=g("teenWho"),pl=g("place");return ask(`${w}找你去${pl}踢地下街頭賽，聽說有獎金`,[["去，順便練膽量",()=>{p.a.盤帶+=1.2;if(R()<.3){p.health-=6;say("比賽太粗野，被踢傷了腳。")}else{p.money+=.0005;say("贏了一點獎金。")}},"可能受傷"],["去看就好",()=>{p.s.視野=clamp(p.s.視野+1,1,99)},""],["不去，教練會生氣",()=>{rel(p,"coach",2)},""]])},
  p=>{const w=g("teenWho"),[sk,at]=g("skill");return ask(`${w}私下教你${sk}，說這是他的祕密武器`,[["每天加練",()=>{p.s[at]=clamp(p.s[at]+2.5+R()*2,1,99);p.fat=Math.min(100,(p.fat||0)+6);say(`${sk}越來越熟練。`)},`${at}↑`],["學起來但比賽不敢用",()=>{p.s[at]=clamp(p.s[at]+1,1,99)},""],["覺得沒用",()=>{},""]])},
  p=>{const m=g("media");return ask(`${m}想拍一集「明日之星」介紹你`,[["好啊，大方入鏡",()=>{p.fame+=2+R()*3;if(R()<.25){p.morale-=3;say("影片底下有人留言酸你，看了很難過。")}},"名氣↑"],["只拍訓練，不受訪",()=>{p.fame+=1},""],["拒絕，怕分心",()=>{p.a.體能+=.5},""]])},
  p=>{const b=g("body");return ask(`最近${b}一直隱隱作痛`,[["去看運動醫學門診",()=>{p.money-=.0003;p.health+=4;say(`醫生說${b}只是發炎，休息幾天就好。`)},"安心"],["貼藥布繼續練",()=>{if(R()<.35){p.injuryLeft=1;p.health-=10;say(`${b}的傷勢惡化，休息了好幾個月。`)}},"有風險"],["減少訓練量",()=>{p.fat=Math.max(0,(p.fat||0)-15)},""]])},
  p=>{const c=g("city");return ask(`${c}的一支青年隊想借你去打一場邀請賽`,[["去，多一場比賽經驗",()=>{p.a.傳球+=1;p.s.反應=clamp(p.s.反應+1.5,1,99);if(R()<.4){p.scouted=true;say("邀請賽表現亮眼，有球探留下聯絡方式。",1)}},"可能被球探看到"],["教練不准，留下",()=>{rel(p,"coach",3)},""],["當天剛好要考試",()=>{p.grade+=3},""]])},
  p=>{const f=g("family"),t=g("trouble");return ask(`家裡傳來消息：${f}${t}`,[["請假回家幾天",()=>{p.morale+=2;p.fat=Math.max(0,(p.fat||0)-10)},""],["把這份心情帶到球場上",()=>{p.a.射門+=1;p.morale-=1},""],["打電話關心，但留在隊上",()=>{},""]])},
 ],
 pro:[
  p=>{const sp=g("sponsor");return ask(`${sp}想找你拍廣告`,[["接，收入不錯",()=>{const m=.01+p.fame*.002*(.5+R());p.money+=m;p.fame+=1;say(`拍廣告賺了 ${eur(m)}。`)},"收入↑"],["只接公益廣告",()=>{p.fame+=2;tag(p,"正直")},"形象↑"],["婉拒",()=>{},""]])},
  p=>{const m=g("media"),r=g("rumor");return ask(`${m}報導你「${r}」`,[["發聲明澄清",()=>{if(R()<.6){p.fame+=1;say("澄清之後，風波很快平息。")}else{p.fame-=4;say("越描越黑，新聞炒了好幾天。")}},"看運氣"],["不回應",()=>{p.fame-=1},""],["請律師提告",()=>{p.money-=.02;p.morale+=2},"花錢"]])},
  p=>{const w=g("proWho"),[sk,at]=g("skill");return ask(`${w}說可以教你${sk}`,[["每天訓練後留下來練",()=>{p.s[at]=clamp(p.s[at]+2+R()*2,1,99);if(R()<.25)potUp(p,1+R()*1.5,"名師指點讓你打開新的視野");p.fat=Math.min(100,(p.fat||0)+8);say(`練成了${sk}。`)},`${at}↑ 疲勞↑`],["偶爾請教",()=>{p.s[at]=clamp(p.s[at]+1,1,99)},""],["沒興趣",()=>{},""]])},
  p=>{const wx=g("weather");return ask(`客場遇到${wx}，比賽可能延期`,[["主動要求照常比賽",()=>{p.fame+=1;if(R()<.3){p.health-=6;say("在惡劣天氣下踢完比賽，感冒了好幾天。")}},""],["聽聯盟安排",()=>{},""],["趁空檔帶隊友去吃當地美食",()=>{rel(p,"mate",6);p.morale+=3},"隊友感情↑"]])},
  p=>{const b=g("body");return ask(`賽前熱身時${b}拉了一下`,[["請隊醫評估再說",()=>{p.fat=Math.max(0,(p.fat||0)-8)},"安全"],["堅持先發",()=>{tag(p,"拚命");if(R()<.35){p.injuryLeft=1;p.health-=12;say(`${b}受傷，休息了一段時間。`)}},"可能受傷"],["主動要求替補",()=>{rel(p,"coach",3)},"教練信任↑"]])},
  p=>{const c=g("city");return ask(`球隊辦了一場到${c}的社區活動`,[["帶小朋友踢球",()=>{p.fame+=2;p.morale+=3},"心情↑"],["簽名合照就好",()=>{p.fame+=1},""],["推說身體不舒服",()=>{rel(p,"coach",-3)},""]])},
  p=>{const f=g("family"),t=g("trouble");return ask(`${f}${t}，需要你幫忙`,[["匯一筆錢回家",()=>{p.money-=.02+R()*.05;p.morale+=2},"花錢"],["請假回去陪",()=>{rel(p,"coach",-4);p.morale+=4},"教練信任↓"],["請家人先處理",()=>{p.morale-=3},""]])},
 ,
  p=>{const w=g("proWho");return ask(RV(`${w}在更衣室跟你借錢，說家裡出事`,`${w}半夜打電話說想找人聊聊`),[["二話不說幫忙",()=>{p.money-=.01;rel(p,"mate",8);p.morale+=1;plant(p,"lend",4,{name:w})},"隊友好感↑ · 會影響未來"],["先問清楚狀況",()=>{p.morale+=1},""],["婉拒，怕扯上麻煩",()=>{rel(p,"mate",-4)},""]])},
  p=>{const c=g("city");return ask(RV(`在${c}的路邊看到一群小孩在踢破球`,`開車經過${c}，看到孩子們在空地踢球`),[["下車跟他們踢一場",()=>{p.morale+=4;p.fame+=1.5;if(R()<.4)say("有人拍下影片上傳，網友說你很接地氣。",1)},"心情↑"],["送他們一顆新球",()=>{p.fame+=1;p.money-=.0005},""],["趕時間，開走了",()=>{},""]])},
  p=>{const [sk,at]=g("skill");return ask(RV(`分析師說你的${sk}是弱點，對手都在針對`,`球探報告寫你「${sk}不夠好」`),[["整個月專練這個",()=>{p.s[at]=clamp(p.s[at]+2.5,1,99);p.fat=Math.min(100,(p.fat||0)+10)},`${at}↑ 疲勞↑`],["揚長避短，練自己的強項",()=>{p.morale+=2},""],["不理會報告",()=>{},""]])},
  p=>{const m=g("media");return ask(RV(`${m}想做一集你的成長紀錄片`,`${m}邀請你回母校拍一支短片`),[["答應，帶他們回老家",()=>{p.fame+=3;p.morale+=3;p.fans=(p.fans||0)*1.05},"名氣↑"],["只接受文字專訪",()=>{p.fame+=1},""],["婉拒，想保留隱私",()=>{p.morale+=1},""]])},
  p=>{const fd=g("food");return ask(RV(`客場旅館附近有很有名的${fd}`,`隊友偷帶了${fd}回宿舍`),[["吃一點，放鬆一下",()=>{p.morale+=3;if(R()<.25){p.health-=3;say("吃太多，隔天訓練跑不動。")}},"心情↑"],["只吃營養師的餐",()=>{tag(p,"自律")},"自律"],["幫全隊買宵夜",()=>{rel(p,"mate",5);p.money-=.001},"隊友好感↑"]])},
  p=>{const b=g("body");return ask(RV(`年紀漸長，${b}恢復得越來越慢`,`隊醫說你的${b}需要好好保養`),[["花錢請私人物理治療師",()=>{p.money-=.03;p.health+=6;tag(p,"會保養")},"健康↑"],["減少加練",()=>{p.fat=Math.max(0,(p.fat||0)-15)},"疲勞↓"],["撐著，不想被看出來",()=>{if(R()<.3){p.injuryLeft=1;p.health-=10;say(`${b}的傷終於撐不住了。`,1)}},"可能受傷"]],undefined)},
 ],
};
GEN.teen.push(
  p=>{const w=g("teenWho");return ask(RV(`${w}說要去別的青訓營試訓，問你要不要一起`,`${w}偷偷告訴你，他打算放棄足球`),[["陪他一起努力",()=>{p.morale+=2;rel(p,"mate",6)},"友情↑"],["專心顧好自己",()=>{p.a.體能+=1},""],["勸他想清楚",()=>{p.morale+=1},""]])},
  p=>{const pl=g("place");return ask(RV(`在${pl}發現一個沒人的練球好地方`,`下雨後，${pl}積了一灘水`),[["每天清晨去自主訓練",()=>{tag(p,"苦練");p.a.盤帶+=1;p.a.體能+=1},"能力↑"],["帶朋友一起去踢",()=>{p.morale+=3},"心情↑"],["算了，回家打電動",()=>{p.morale+=1},""]])},
  p=>{const f=g("family");return ask(RV(`${f}偷偷存錢幫你買了一雙好球鞋`,`${f}每週末開車載你去比賽`),[["寫一張卡片謝謝他",()=>{p.morale+=4},"心情↑"],["發誓要踢出成績回報",()=>{p.a.射門+=1;p.morale+=2},"射門↑"],["覺得理所當然",()=>{},""]])},
  p=>{const m=g("media");return ask(RV(`${m}的留言區有人說你「只是運氣好」`,`同學把你的比賽影片傳到群組，被嘲笑跑姿很怪`),[["當成動力，加練",()=>{p.a.速度+=1;tag(p,"苦練")},"速度↑"],["回嗆",()=>{tag(p,"火爆");p.morale-=1},""],["不看留言",()=>{p.morale+=1},""]])});
// 同一種事件最近用過就先跳過，避免連續兩年都是「寒流停課」
async function genEvent(kind){const p=P,L=GEN[kind];p.genRecent=p.genRecent||[];const fit=L.map((_,i)=>kind+i).filter(k=>evOk(L[+k.slice(kind.length)],p));if(!fit.length)return;const ok=fit.filter(k=>!p.genRecent.includes(k)),k=ok.length?pick(ok):pick(fit);
 p.genRecent.push(k);if(p.genRecent.length>L.length-1)p.genRecent.shift();await L[+k.slice(kind.length)](p)}
// 事件觸發條件：用題目裡的關鍵字對應，跟現況不符的事件不會被抽到
// （例如已經是一線隊主力，就不會再有「一線隊缺人，叫你跟去客場」）
const EV_OK=[
 ["一線隊缺人",p=>!p.debut],["可能不在先發名單",p=>p.role=="輪換"||p.role=="替補"],["戴上隊長臂章",p=>!p.captain&&p.age>=24&&p.role=="主力"],
 ["運動品牌想找你代言",p=>p.fame>=20],["德比戰前",p=>p.role!="預備隊"],["關鍵戰",p=>p.role!="預備隊"],["電視台想幫你做一集專訪",p=>p.fame>=25],
 ["經紀人想幫你談加薪",p=>!!p.rel?.agent],["狂罵你最近表現差",p=>p.role!="預備隊"&&p.fame>=15],["中東球隊開出三倍年薪",p=>EU7.includes(p.clubObj?.ct)&&ovr(p)>=70&&p.age>=26],
 ["家鄉的少年足球隊邀請你",p=>p.fame>=20],["歸化",p=>p.caps==0&&p.age<=27],["私人特訓營",p=>p.money>=.1],["隊友在更衣室公開批評你",p=>p.role!="預備隊"],
 ["是段考",p=>p.age<=18],["一直抽高",p=>p.age<=16],["喜歡上班上的",p=>p.age<=18],["學校老師說你如果再缺課",p=>p.age<=18],
 ["想找你拍廣告",p=>p.fame>=10],["報導你「",p=>p.fame>=15],["點閱破十萬",p=>p.fame>=10],["被球迷認出來",p=>p.fame>=5],["地方報紙刊出你的專訪",p=>p.fame>=5],
 ["一線隊的位置被新買的球員卡住",p=>!p.debut||p.role=="預備隊"]];
const evOk=(f,p)=>{const src=f.toString();for(const [k,c] of EV_OK)if(src.includes(k))return c(p);return true};
async function phaseEvent(pool){const p=P;p.evSeen=p.evSeen||{};const tag=pool===YOUTH_EVENTS?"y":"p";
 if(R()<.25){const ms=MINOR.filter(m=>evOk(m,p));if(ms.length){say(pick(ms)(p));return}}
 if(R()<.45){await genEvent(tag=="y"?"teen":"pro");return}
 const fit=pool.map((f,i)=>i).filter(i=>evOk(pool[i],p));if(!fit.length)return;
 const ok=fit.filter(i=>p.evSeen[tag+i]==null),ok2=fit.filter(i=>!(p.evSeen[tag+i]>=p.age-6));if(!ok.length&&!ok2.length)return;const i=ok.length?pick(ok):pick(ok2);
 p.evSeen[tag+i]=p.age;await pool[i](p)}
// 階段性的傷病檢查：疲勞越高越容易受傷
// 傷病分三級：輕傷缺席幾場、中傷缺席一兩個月、重傷可能整季報銷；中、重傷可以選復健方式，舊傷會讓之後更容易受傷
const INJ={輕:[["大腿後側輕微拉傷",2],["腳踝扭傷",3],["小腿抽筋拉傷",1],["腳趾挫傷",2]],中:[["大腿後側撕裂",6],["膝蓋內側副韌帶拉傷",8],["腳踝韌帶撕裂",7],["肋骨骨裂",5],["腹股溝拉傷",6]],重:[["十字韌帶斷裂",36],["阿基里斯腱斷裂",30],["脛骨骨折",24],["半月板撕裂開刀",16]]};
async function injuryCheck(frac){const p=P;const tm=1+.2*T(p,"夜生活")+.15*T(p,"拚命")-.15*T(p,"自律")-.2*T(p,"會保養")+.15*(p.chronic||0);const risk=tm*(.1+Math.max(0,p.age-28)*.02+(p.a.體能<50?.03:0))*frac+Math.max(0,(p.fat||0)-65)/220*frac*4;
 if(p.injuryLeft>0||(p.missG||0)>0||R()>risk)return;
 const lv=R()<.12?"重":R()<.45?"中":"輕",[name,wk]=pick(INJ[lv]);let games=Math.round(wk*(.8+R()*.4)),loss=lv=="重"?2:lv=="中"?.6:0;
 p.injuries++;p.fat=0;p.health-={輕:4,中:10,重:25}[lv];
 const it={age:p.age,bad:lv=="重",lv,t:name,games,fat:Math.round(p.fat||0)};(p.injList=p.injList||[]).push(it);
 say(`${lv=="重"?"🚑 ":""}${name}（${lv}傷），預計缺席 ${games} 場${games>=20?"，可能整季報銷":""}。${(p.fat||0)>65?"（疲勞累積太多）":""}`,lv!="輕");
 if(lv!="輕")await ask(`${name}，醫療團隊問你想怎麼復健`,[
  ["保守治療，完全養好再回來",()=>{games=Math.round(games*1.3);loss*=.4;say("慢慢復健，回來時身體狀況很好。");plant(p,"rest",5)},"缺席更久 · 能力損失少 · 會影響未來"],
  ["照醫生的進度",()=>{},"一般"],
  ["打針、提早復出",()=>{games=Math.round(games*.6);if(R()<.4){p.chronic=(p.chronic||0)+1;loss+=1;it.chronic=1;say(`太早復出，${name.slice(0,4)}變成了舊傷，之後更容易受傷。`,1)}else say("提早回到球場，暫時沒事。");plant(p,"earlyBack",3)},"缺席較短 · 可能變成舊傷 · 會影響未來"],
  ...(p.money>.2?[["花錢找國外名醫",()=>{p.money-=.1;games=Math.round(games*.8);loss*=.5},"花 €100K · 好得快又少損失"]]:[])]);
 it.games=games;ATTR.forEach(k=>p.a[k]-=loss);
 // 超過本季剩下的場次，就延續到下一季
 p.missG=games;if(games>20){p.injuryLeft=games>30?2:1}}
