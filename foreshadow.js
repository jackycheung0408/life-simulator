// 伏筆：小時候的小事埋下一條線，幾十年後回收
// 每條：[代號, 埋下年齡範圍, 機率, 條件, 埋下的事（可抉擇）, 最早回收年齡（距埋下幾年）, 回收]
const SEEDS=[
 ["cat",[7,12],.05,L=>1,L=>ask(L,"放學路上看到一隻淋雨的小貓",[["抱回家",()=>{L.seed.cat=1;L.happy+=2;say(L,"偷偷把淋雨的小貓抱回家，取名「小雨」。")}],["給牠一點吃的就走",()=>{L.seed.cat=2}],["趕快回家",()=>{}]]),
  20,L=>L.seed.cat==1?say(L,"整理舊相簿，翻到和「小雨」的合照，那隻貓陪你走過了整個青春期。","伏筆回收："+L.seedAt.cat+" 歲那年撿到的小貓"):(L.happy+=3,say(L,"在路邊餵了一隻流浪貓，忽然想起小時候那個下雨天。","伏筆回收："+L.seedAt.cat+" 歲那年遇到的小貓"))],
 ["capsule",[13,16],.06,L=>L.edu>=1,L=>{L.seed.capsule=pick(["當上老闆","環遊世界","跟初戀結婚","不要變成無聊的大人","讓爸媽過好日子"]);say(L,`和同學在校園埋了時光膠囊，寫下願望：「${L.seed.capsule}」。`)},
  20,L=>{const w=L.seed.capsule,ok=w=="當上老闆"?/老闆/.test(L.job||L.lastJob||""):w=="跟初戀結婚"?L.partner&&L.partnerYears>15:w=="讓爸媽過好日子"?L.money>L.c.gdp*2:R()<.4;
   L.happy+=ok?8:2;say(L,ok?`同學會挖出時光膠囊，紙條上寫著「${w}」——你做到了。`:`同學會挖出時光膠囊，紙條上寫著「${w}」。大家笑成一團，你也笑了。`,"伏筆回收："+L.seedAt.capsule+" 歲埋下的時光膠囊")}],
 ["teacher",[9,14],.05,L=>L.edu>=1,L=>{L.seed.teacher=pick(["寫作","畫畫","唱歌","數學"]);L.know+=2;say(L,`老師在你的作業上寫：「你很有${L.seed.teacher}的天分，不要放棄。」`)},
  25,L=>{const t=L.seed.teacher;if(L.happy>45||R()<.5){L.happy+=10;say(L,`重拾${t}，作品第一次被很多人看見。想起當年那位老師。`,"伏筆回收："+L.seedAt.teacher+" 歲時老師的一句話");sayHi(L,`晚年重拾${t}，圓了小時候的夢。`)}else{L.happy-=2;say(L,`在抽屜找到當年那本作業，「不要放棄」四個字還在。你已經很久沒碰${t}了。`,"伏筆回收："+L.seedAt.teacher+" 歲時老師的一句話")}}],
 ["promise",[16,19],.05,L=>1,L=>{L.seed.promise=pick(["阿傑","小芳","阿明","小雯","阿豪"]);say(L,`畢業前和好友${L.seed.promise}約定：「三十歲那年，一起去看海。」`)},
  12,L=>{const n=L.seed.promise;if(L.rel>45&&R()<.6){L.happy+=8;L.rel+=4;say(L,`${n}真的打電話來：「說好的，去看海。」你們在海邊坐了一整晚。`,"伏筆回收："+L.seedAt.promise+" 歲時的約定")}else{L.happy-=3;say(L,`想起和${n}的看海約定，但你們早就斷了聯絡。`,"伏筆回收："+L.seedAt.promise+" 歲時的約定")}}],
 ["lend",[22,35],.04,L=>L.money>L.c.gdp*.3,L=>{const amt=Math.round(L.c.gdp*.25);return ask(L,"老同學開口借錢，說家裡出事了",[["借他",()=>{L.money-=amt;L.seed.lend=amt;L.rel+=2;say(L,"借了一筆錢給老同學。")},"錢↓ 人際↑",amt],["婉拒",()=>{L.rel-=2;L.seed.lend=-1}]],`大約 ${money(amt)}`)},
  10,L=>{const a=L.seed.lend;if(a<0){if(R()<.5)say(L,"聽說當年找你借錢的老同學後來撐過去了，只是再也沒聯絡。","伏筆回收："+L.seedAt.lend+" 歲那年婉拒借錢");return}
   if(R()<.55){L.money+=a*1.5;L.happy+=6;say(L,`老同學登門還錢，還多包了一份：「那年只有你肯幫我。」`,"伏筆回收："+L.seedAt.lend+" 歲借出的那筆錢")}else{L.happy-=4;say(L,"當年借錢的老同學，電話早就打不通了。","伏筆回收："+L.seedAt.lend+" 歲借出的那筆錢")}}],
 ["checkup",[35,45],.04,L=>1,L=>ask(L,"媽媽一直叫你去做健康檢查",[["去做",()=>{L.seed.checkup=1;L.money-=L.c.gdp*.02;say(L,"去做了全身健康檢查。")}],["沒空，以後再說",()=>{L.seed.checkup=2}]]),
  8,L=>{if(L.seed.checkup==1){L.health+=10;say(L,"定期檢查發現一個小腫瘤，還在早期，切掉就沒事了。","伏筆回收："+L.seedAt.checkup+" 歲開始做健康檢查")}else{L.health-=12;say(L,"身體不舒服去看醫生，醫生說：「早幾年檢查就好了。」","伏筆回收："+L.seedAt.checkup+" 歲沒去做健康檢查")}}],
];
function foreshadowYear(L){L.seed=L.seed||{};L.seedAt=L.seedAt||{};L.seedDone=L.seedDone||{};
 const jobs=[];
 for(const [id,[a,b],p,cond,plant,gap,pay] of SEEDS){
  if(L.seedDone[id])continue;
  if(L.seedAt[id]==null){if(L.age>=a&&L.age<=b&&R()<p&&cond(L)){L.seedAt[id]=L.age;jobs.push(()=>plant(L))}continue}
  // 埋了但沒有真的選（例如「趕快回家」）就不回收
  if(L.seed[id]==null){L.seedDone[id]=1;continue}
  if(L.age>=L.seedAt[id]+gap&&R()<.3){L.seedDone[id]=1;jobs.push(()=>pay(L))}}
 return jobs.reduce((pr,j)=>pr.then(j),Promise.resolve())}
