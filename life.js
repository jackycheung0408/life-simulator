// 出生登記、家人、性格、宗教節慶、存活曲線、人生地圖、存檔
// 依賴 index.html 的全域：P、S、say、ask、pick、R、NAMES、REGION、money、$、cfg

// 主要宗教（依國家的多數宗教概略分類）
const RELIGION=(()=>{const m={
 伊斯蘭教:"埃及,伊朗,伊拉克,土耳其,沙烏地阿拉伯,葉門,敘利亞,約旦,科威特,阿曼,阿聯,卡達,巴林,利比亞,突尼西亞,阿爾及利亞,摩洛哥,茅利塔尼亞,蘇丹,亞塞拜然,烏茲別克,哈薩克,塔吉克,土庫曼,吉爾吉斯,巴基斯坦,孟加拉,阿富汗,印尼,馬來西亞,馬爾地夫,索馬利亞,吉布地,尼日,馬利,塞內加爾,幾內亞,甘比亞,葛摩,巴勒斯坦,阿爾巴尼亞,科索沃,查德,布吉納法索",
 印度教:"印度,尼泊爾,模里西斯",
 佛教:"泰國,緬甸,柬埔寨,寮國,斯里蘭卡,不丹,蒙古",
 民間信仰:"中國,台灣,香港,澳門,越南,新加坡,韓國,日本,北韓",
 東正教:"俄羅斯,烏克蘭,白俄羅斯,塞爾維亞,保加利亞,羅馬尼亞,希臘,喬治亞,亞美尼亞,摩爾多瓦,北馬其頓,蒙特內哥羅,塞普勒斯,衣索比亞,厄利垂亞"};
 const o={};for(const [r,l] of Object.entries(m))for(const n of l.split(","))o[n]=r;return n=>o[n]||"基督宗教"})();
const FESTIVAL={伊斯蘭教:["齋戒月結束，全家換上新衣，到親戚家拜訪。","宰牲節，家裡把肉分給鄰居和窮人。"],印度教:["排燈節，家家戶戶點起小油燈。","灑紅節，大家在街上互相潑彩色粉末。"],佛教:["新年潑水節，整條街都濕透了。","跟著家人到寺廟供養僧侶。"],民間信仰:["過年時全家圍爐，長輩發了紅包。","中秋節一家人在外面賞月。","清明節跟著家人去掃墓。"],東正教:["復活節，家裡染了彩蛋。","聖誕節前夕，全家一起吃了十二道菜。"],基督宗教:["聖誕節，全家人聚在一起交換禮物。","復活節，跟著家人上教堂。"]};

const URBAN=g=>Math.min(.95,.2+Math.log10(Math.max(800,g))*.16-.35); // 所得越高，都市人口越多（概估）
const FERT=g=>g<3000?5:g<8000?3.6:g<20000?2.3:1.6;                     // 總生育率（概估，依所得）
const PJOB_LOW=["農民","攤販","日薪工人","漁夫","家管"],PJOB_MID=["工廠作業員","店員","司機","建築工人","家管","小店老闆"],PJOB_HI=["工程師","教師","公務員","醫師","經理","小企業老闆"];

// 出生時決定的家庭
function makeFamily(L){
 const reg=REGION(L.raw),low=L.c.gdp<8000;
 const surname=()=>"";
 const mAge=Math.round((low?19:25)+R()*10),fAge=mAge+Math.round(1+R()*7);
 const urban=R()<URBAN(L.c.gdp);
 const pool=(L.cls>=3&&!low?PJOB_HI:L.cls<=1||low?PJOB_LOW:PJOB_MID).filter(j=>!(urban&&["農民","漁夫"].includes(j)));
 const nSib=Math.max(0,Math.round(FERT(L.c.gdp)-1+(R()-.5)*2));
 const sibs=[];let age=0;for(let i=0;i<nSib;i++){age+=2+Math.floor(R()*3);sibs.push({sex:R()<.5?"男":"女",age,married:false})}
 L.fam={mother:{name:pick(NAMES[reg]["女"]),age:mAge,job:pick(pool.concat(["家管"])),alive:true},
  father:{name:pick(NAMES[reg]["男"]),age:fAge,job:pick(pool.filter(j=>j!="家管")),alive:true},
  sibs,grand:R()<.8,religion:RELIGION(L.raw),urban};
 L.parentAlive=true;
}
const sibName=s=>`${s.age>0?(s.sex=="男"?"哥哥":"姊姊"):""}`;
function familyLine(L){
 const f=L.fam,s=f.sibs.length?`上面有${[...f.sibs].reverse().map(x=>`${x.age}歲的${sibName(x)}`).join("、")}。`:"是家裡第一個孩子。";
 return `${s}家人信仰${f.religion}。`;
}

// 存活曲線：用同一套死亡率模型，從 0 歲推到 100 歲
function survival(L){
 const base={c:L.c,ex:L.ex,health:75,smoke:false};let s=1;const out=[1];
 for(let a=1;a<=100;a++){base.age=a-1;s*=1-mortality({...base,age:a-1});out.push(s)}
 return out;
}
function survivalSVG(L){
 const s=L.surv||(L.surv=survival(L)),W=300,H=110;
 const pts=s.map((v,a)=>`${(a/100*W).toFixed(1)},${(H-v*H).toFixed(1)}`).join(" ");
 const x=L.age/100*W,y=H-(s[Math.min(100,L.age)]*H);
 return `<svg viewBox="-28 -6 ${W+36} ${H+24}" style="width:100%;max-width:420px">
  ${[0,.5,1].map(v=>`<line x1="0" x2="${W}" y1="${H-v*H}" y2="${H-v*H}" stroke="var(--line)"/><text x="-4" y="${H-v*H+4}" font-size="9" text-anchor="end" fill="var(--mut)">${v*100}%</text>`).join("")}
  ${[0,20,40,60,80,100].map(a=>`<text x="${a/100*W}" y="${H+14}" font-size="9" text-anchor="middle" fill="var(--mut)">${a}</text>`).join("")}
  <polyline points="${pts}" fill="none" stroke="var(--ac)" stroke-width="2"/>
  <circle class="svpulse" cx="${x}" cy="${y}" r="4" fill="none" stroke="var(--y)" stroke-width="2"/><circle class="svdot" cx="${x}" cy="${y}" r="4" fill="var(--ac)"/></svg>`;
}
const survivePct=L=>{const v=(L.surv||(L.surv=survival(L)))[Math.min(100,L.age)]*100;return v>=99?Math.min(99.9,v).toFixed(1):Math.round(v)};

// 人生地圖：一年一格，越幸福顏色越深；外框標到當地平均壽命
function lifeMap(L){
 const n=Math.max(Math.ceil(L.ex),L.age+1);let h="";
 for(let a=0;a<n;a++){const v=L.hist?.[a];const st=v==null?"background:transparent":`background:color-mix(in srgb,var(--ac) ${Math.round(15+v*.85)}%,transparent)`;
  h+=`<i title="${a}歲${v!=null?" · 幸福 "+Math.round(v):""}" style="${st};${a<L.ex?"":"border-style:dashed"}"></i>`}
 return `<div class="lmap">${h}</div>`;
}

// 畫面上方的家庭場景（用表情符號組成）
function scene(L){
 const f=L.fam;if(!f)return "";
 const me=L.age<3?"👶":L.age<13?(L.sex=="男"?"👦":"👧"):L.age<60?(L.sex=="男"?"👨":"👩"):(L.sex=="男"?"👴":"👵");
 const ppl=[];
 if(L.age<25||L.caregiver){if(f.father.alive)ppl.push(f.father.age+L.age>=65?"👴":"👨");if(f.mother.alive)ppl.push(f.mother.age+L.age>=65?"👵":"👩")}
 if(L.age<20)f.sibs.filter(s=>!s.married).forEach(s=>ppl.push(s.age+L.age<13?(s.sex=="男"?"👦":"👧"):(s.sex=="男"?"🧑":"👩")));
 ppl.push(me);if(L.partner)ppl.push(L.sex=="男"?"👩":"👨");for(let i=0;i<Math.min(L.kids,4);i++)ppl.push(L.age<45?"🧒":"🧑");
 const home=L.abroad?"✈️🏙️":L.house?"🏡":f.urban||L.moved?"🏢":"🛖";
 const place=`${L.abroad||L.c.name}${f.urban||L.moved?" · "+L.c.city:" · 鄉村"}`;
 const living=L.age<20?"與父母同住":L.partner?(L.kids?"和伴侶、孩子同住":"和伴侶同住"):L.caregiver?"和年邁的父母同住":"一個人住";
 return `<div class="scene"><span class="home">${home}</span><span class="ppl">${ppl.join("")}</span></div><div class="mut">${place} · ${living}</div>`;
}

// 國家統計面板
function countryPanel(L){
 const c=L.c,raw=C.find(x=>x[0]==L.raw);
 const rows=[["每年出生",raw?`${raw[1]>=1?raw[1].toLocaleString()+" 萬":Math.round(raw[1]*1e4).toLocaleString()} 人`:"—"],["人口",raw?`${raw[2].toLocaleString()} 百萬`:"—"],
  ["平均壽命 女／男",`${Math.round(c.fEx)}／${Math.round(c.mEx)} 歲`],["嬰兒死亡率",`每千人 ${Math.round(c.im)} 人`],["人均所得（PPP）",`US$${Math.round(c.gdp).toLocaleString()}`],
  ["吉尼係數",c.gini],["大學就學率",`${Math.round(c.uni)}%`],["主要宗教",L.fam?.religion||"—"],["都市人口（估）",`${Math.round(URBAN(c.gdp)*100)}%`],["總生育率（估）",`${FERT(c.gdp)} 人`]];
 return rows.map(r=>`<div class="row"><span class="mut">${r[0]}</span><span>${r[1]}</span></div>`).join("")+`<div class="mut" style="margin-top:6px">資料：世界銀行 WDI；標「估」者依所得概估</div>`;
}

// 出生登記
function birthCard(L,home){
 const f=L.fam,u5=Math.min(60,L.c.im*1.3/10).toFixed(1),pct=["後 20%","後 20～40%","中間 40～60%","前 20～40%","前 20%"][L.cls];
 const h=home!==""?world(C[home],"now"):null,ex=Math.round(L.ex);
 const cmp=h?`<h2 style="margin-top:14px">和你的出生地比一比</h2><div class="row"><span></span><b>你的${h.name}（現在）</b><b>這個孩子的${L.c.name}（${L.c.y0}）</b></div>
  <div class="row"><span>平均壽命</span><span>${Math.round(L.sex=="男"?h.mEx:h.fEx)} 歲</span><span>${ex} 歲</span></div>
  <div class="row"><span>5 歲前離世機率</span><span>${Math.min(60,h.im*1.3/10).toFixed(1)}%</span><span>${u5}%</span></div>
  <div class="row"><span>人均所得</span><span>${money(h.gdp)}</span><span>${money(L.c.gdp)}</span></div>`:"";
 return `<div class="cert"><div class="row" style="border:0"><b>出生登記</b><span class="mut">No. ${L.raw.slice(0,2)}-${L.c.y0}-${Math.floor(1e6+R()*9e6)}</span></div>
 <div class="cert-seal">已登記</div>
 <div class="cert-head"><canvas id="certAvatar" width="80" height="80"></canvas><div><div class="mut">名字</div><h1 style="font-size:1.9rem;margin:0">${L.name}</h1><div class="mut">${L.sex=="男"?"男孩":"女孩"} · ${L.c.y0} 年</div></div></div>
 <div class="kpis"><div><span class="mut">平均壽命</span><b>${ex} 歲</b></div><div><span class="mut">5 歲前離世</span><b>${u5}%</b></div><div><span class="mut">家境</span><b>${["貧困","偏低","中等","小康","富裕"][L.cls]}</b></div></div>
 <p>${L.c.y0} 年，你出生在${L.c.tw?"台灣"+L.c.tw.county+(f.urban?"":"的鄉下"):L.c.name+(f.urban?L.c.city:"的鄉村")}，一個所得${pct}的家庭，是個${L.sex=="男"?"男孩":"女孩"}。${familyLine(L)}</p>
 <div class="grid">${[["性別",L.sex=="男"?"男性":"女性"],["出生地",L.c.tw?L.c.tw.county+(f.urban?"":"（鄉下）"):f.urban?L.c.city+"（城市）":"鄉村"],["家境",`${"●".repeat(L.cls+1)}${"○".repeat(4-L.cls)} ${pct}`],
  ["母親",`${f.mother.name}・${f.mother.age}歲・${f.mother.job}`],["父親",`${f.father.name}・${f.father.age}歲・${f.father.job}`],["宗教",f.religion],
  ["平均壽命",ex+" 歲"],["5 歲前離世機率",u5+"%"],["人均所得",money(L.c.gdp)]].map(k=>`<div><div class="mut">${k[0]}</div><b>${k[1]}</b></div>`).join("")}</div>
 ${cmp}
 <h2 style="margin-top:14px">同一秒出生的另外四個人</h2>${S.map(s=>`<div class="row"><b>${s.name}</b><span class="mut">${s.c.name}${s.fam.urban?s.c.city:"鄉村"} · ${s.sex} · ${CLS[s.cls]}家庭</span></div>`).join("")}
 <p class="mut">活到平均壽命約需 ${cfg.l} 分鐘（1 年 ≈ ${Math.round(cfg.l*60/L.ex)} 秒）。中途關掉會存在這個瀏覽器，下次可以接著過。</p></div>`;
}

// 幼年性格抉擇：2～4 歲，四選一，累積成個性
const TEMPER=[
 [2,"路邊有一隻小狗朝你走過來",[["抱緊大人，不敢看",{know:1,rel:-1,t:"謹慎"}],["學狗叫，逗得旁邊的人都笑了",{rel:3,t:"外向"}],["蹲下來輕輕摸牠的頭",{rel:2,happy:1,t:"體貼"}],["被舔了一臉還是一直跟著牠走",{health:2,t:"堅毅"}]]],
 [3,"拿到一個沒看過的玩具",[["拆開來看裡面是什麼",{know:3,t:"好奇"}],["拿去和別人一起玩",{rel:3,t:"外向"}],["自己安靜地玩很久",{know:1,happy:2,t:"專注"}],["玩不出來也不肯放手",{health:1,know:1,t:"堅毅"}]]],
 [4,"家裡來了客人",[["主動打招呼、表演唱歌",{rel:3,happy:1,t:"外向"}],["躲進房間",{happy:-1,know:1,t:"謹慎"}],["幫忙端點心",{rel:2,t:"體貼"}],["問客人一大堆問題",{know:2,rel:1,t:"好奇"}]]],
 [2,"第一次看到大海",[["衝進水裡，怎麼叫都不回來",{health:2,t:"堅毅"}],["蹲在沙灘上撿貝殼",{know:2,t:"專注"}],["抓著大人的手不敢靠近",{know:1,t:"謹慎"}],["一直問海的另一邊是哪裡",{know:3,t:"好奇"}]]],
 [2,"晚上停電，屋裡一片黑",[["哇哇大哭",{happy:-1,t:"謹慎"}],["拿手電筒照牆壁玩影子",{know:2,happy:1,t:"好奇"}],["跑去抱住哥哥姊姊",{rel:2,t:"體貼"}],["自己摸黑找到蠟燭",{health:1,t:"堅毅"}]]],
 [3,"在公園跌倒，膝蓋擦破皮",[["忍著不哭自己站起來",{health:2,t:"堅毅"}],["哭著找大人",{rel:1,t:"謹慎"}],["研究傷口流出來的血",{know:2,t:"好奇"}],["一跛一跛繼續去溜滑梯",{happy:2,t:"外向"}]]],
 [3,"看到別的小朋友在哭",[["把手上的糖果分給他",{rel:3,t:"體貼"}],["跑過去問他怎麼了",{rel:2,know:1,t:"外向"}],["站在旁邊看",{know:1,t:"謹慎"}],["繼續玩自己的",{happy:1,t:"專注"}]]],
 [3,"大人給你一盒蠟筆",[["把牆壁畫滿了",{happy:2,t:"外向"}],["畫了一整天的同一隻貓",{know:2,t:"專注"}],["把每一支都拿起來聞聞看",{know:2,t:"好奇"}],["畫一張送給媽媽",{rel:3,t:"體貼"}]]],
 [4,"第一天去幼兒園",[["拉著大人的衣服不放",{happy:-1,rel:1,t:"謹慎"}],["一進門就找人一起玩",{rel:3,t:"外向"}],["把教室每個角落都摸過一遍",{know:2,t:"好奇"}],["哭完就乖乖坐好",{health:1,t:"堅毅"}]]],
 [4,"弟弟妹妹或鄰居小孩搶走你的玩具",[["搶回來",{health:1,t:"堅毅"}],["讓給他",{rel:2,t:"體貼"}],["去告訴大人",{know:1,t:"謹慎"}],["拿另一個玩具跟他交換",{know:2,rel:1,t:"好奇"}]]],
 [4,"大人在煮飯，你在旁邊看",[["吵著要幫忙",{rel:2,t:"體貼"}],["一直問為什麼油會跳",{know:3,t:"好奇"}],["偷吃還沒煮好的東西",{happy:2,t:"外向"}],["乖乖在旁邊看完",{know:1,t:"專注"}]]],
 [4,"下雨天不能出去玩",[["在窗邊看雨滴賽跑",{know:2,t:"專注"}],["用棉被在客廳搭帳篷",{happy:2,t:"好奇"}],["吵著要出去踩水",{health:1,t:"堅毅"}],["打電話給阿公阿嬤聊天",{rel:2,t:"外向"}]]],
];
// 每個人 2～4 歲各抽一題，不一定每年都有
async function temperament(L){
 if(L.age<2||L.age>4)return;const pool=TEMPER.filter(x=>x[0]==L.age);if(!pool.length||R()<.25&&L.age<4)return;const t=pick(pool);
 await ask(L,t[1],t[2].map(([label,e])=>[label,()=>{L.know+=e.know||0;L.rel+=e.rel||0;L.happy+=e.happy||0;L.health+=e.health||0;(L.traits=L.traits||[]).push(e.t)}]));
 if(L.age==4&&L.traits){const top=Object.entries(L.traits.reduce((a,x)=>(a[x]=(a[x]||0)+1,a),{})).sort((a,b)=>b[1]-a[1])[0][0];L.persona=top;say(L,`慢慢看得出來，這孩子的個性偏${top}。`)}
}

// 家人隨年齡發生的事
async function familyEvents(L){
 const f=L.fam;if(!f)return;
 for(const k of ["mother","father"]){const p=f[k];if(!p.alive)continue;const a=p.age+L.age;
  const q=Math.min(.5,.0004*Math.exp(.085*(a-20))*(L.c.gdp<8000?1.6:1));
  if(R()<q){p.alive=false;L.happy-=12;say(L,`${k=="mother"?"母親":"父親"}${p.name}在 ${a} 歲時離開了人世。`)}}
 L.parentAlive=f.mother.alive||f.father.alive;
 if(L.age>=6&&L.age<=17&&f.mother.alive&&f.father.alive&&R()<.04){L.happy-=4;say(L,`父母又吵了一架，你躲在房裡不敢出聲。（母親 ${f.mother.age+L.age} 歲・父親 ${f.father.age+L.age} 歲）`)}
 for(const s of f.sibs){const a=s.age+L.age;if(!s.married&&a>=20&&a<=35&&R()<.12){s.married=true;say(L,`${sibName(s)}結婚了，全家人一起拍了照。`)}}
 if(f.grand&&L.age<=30){if(R()<.05)say(L,pick(["外婆塞了一大袋自己做的點心給你。","爺爺教你一個他小時候玩的遊戲。","打電話給奶奶，她的聲音比以前虛弱了。"]));
  if(L.age>=8&&R()<.05){f.grand=false;L.happy-=6;say(L,"祖父母中最疼你的那一位過世了。")}}
 if(L.age>=4&&R()<.1)say(L,pick(FESTIVAL[f.religion]));
}

// 統計小知識（由資料計算，不另外編造數字）
function survivalNote(L){
 if(![15,30,50,70].includes(L.age))return;
 say(L,`同一年在${L.c.name}出生的${L.sex=="男"?"男生":"女生"}，大約 ${survivePct(L)}% 還活著。`);
}

// 存檔：每年存一次，關掉頁面後可以接著玩
// 多個存檔：每段人生用自己的 id 存，可同時保留好幾段
const SAVE_KEY="life-saves-v2";
function allSaves(){try{const o=JSON.parse(localStorage.getItem(SAVE_KEY))||{};const old=JSON.parse(localStorage.getItem("life-save-v1"));if(old&&old.P&&old.P.alive){old.P.id=old.P.id||"v1";o[old.P.id]={...old,t:0};localStorage.removeItem("life-save-v1");localStorage.setItem(SAVE_KEY,JSON.stringify(o))}return o}catch{return {}}}
function saveGame(){try{P.id=P.id||String(Date.now());const o=allSaves();o[P.id]={P,S,cfg,focusSel,spend,log:log.innerHTML,t:Date.now()};
 const keep=Object.entries(o).sort((a,b)=>b[1].t-a[1].t).slice(0,8);localStorage.setItem(SAVE_KEY,JSON.stringify(Object.fromEntries(keep)))}catch{}}
function deleteSave(id){try{const o=allSaves();delete o[id];localStorage.setItem(SAVE_KEY,JSON.stringify(o))}catch{}}
function clearSave(){if(P&&P.id)deleteSave(P.id)}

// ── 出生揭曉：像抽籤一樣轉動地名，慢慢停下，再一項項蓋章 ──
function revealBirth(L){
 return new Promise(res=>{
  const ov=document.createElement("div");ov.id="reveal";
  ov.innerHTML=`<div class="rv-box"><div class="rv-tag">— 正在決定你的出生地 —</div><div class="rv-slot"><span id="rvName">？？？</span></div><div class="rv-sub" id="rvSub">全世界每秒約有 4 個嬰兒出生</div><div id="rvStamps"></div><button class="pri hide" id="rvGo">查看出生登記 ▶</button><button class="rv-skip" id="rvSkip">跳過</button></div>`;
  document.body.appendChild(ov);
  const pool=L.c.tw?TW_COUNTY.map(x=>"台灣 · "+x[0]):C.map(x=>x[0]),final=L.c.tw?"台灣 · "+L.c.tw.county:L.c.name,name=ov.querySelector("#rvName");
  let t=0,delay=40,done=false;
  const finish=()=>{if(done)return;done=true;name.textContent=final;name.classList.add("rv-hit");stamps()};
  const spin=()=>{if(done)return;name.textContent=pick(pool);t+=delay;delay*=1.09;if(t>2600)return finish();setTimeout(spin,delay)};
  spin();
  const share=L.c.tw?null:(()=>{const tot=C.reduce((a,x)=>a+x[1],0),me=C.find(x=>x[0]==L.c.name);return me?(me[1]/tot*100):null})();
  function stamps(){
   ov.querySelector("#rvSub").textContent=share!=null?`每 100 個新生兒中，約有 ${share<1?share.toFixed(2):share.toFixed(1)} 個出生在這裡`:`${L.c.y0} 年出生的台灣寶寶`;
   const items=[["年份",L.c.y0+" 年"],["性別",L.sex=="男"?"男孩":"女孩"],["家境",["貧困","偏低","中等","小康","富裕"][L.cls]],["城鄉",L.fam.urban?"城市":"鄉村"],["平均壽命",Math.round(L.ex)+" 歲"]];
   const box=ov.querySelector("#rvStamps");
   items.forEach(([k,v],i)=>setTimeout(()=>{const d=document.createElement("div");d.className="rv-stamp";d.innerHTML=`<span>${k}</span><b>${v}</b>`;box.appendChild(d);if(i==items.length-1)ov.querySelector("#rvGo").classList.remove("hide")},500+i*380));
  }
  const close=()=>{ov.classList.add("rv-out");setTimeout(()=>{ov.remove();res()},350)};
  ov.querySelector("#rvGo").onclick=close;
  ov.querySelector("#rvSkip").onclick=()=>{done=true;close()};
 });
}
