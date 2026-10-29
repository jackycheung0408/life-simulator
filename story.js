// 讓人生像真的：日常小事、有名字的孩子、錢的明細、善意的回響
// 依賴：say、ask、pick、R、NAMES、REGION、money

// 日常小事（依年齡段）；每年挑 0～2 件，讓紀錄不只有大事
const DAILY=[
 [4,12,["在巷口跟鄰居的孩子玩到天黑才回家。","下雨天把紙船放進水溝，追著它跑了好遠。","第一次自己綁好鞋帶，得意了一整天。","偷偷把不愛吃的青菜藏在碗底，被發現了。","發燒那晚，媽媽整夜沒睡守在床邊。","在學校交到了一個會分你點心的朋友。"]],
 [13,19,["半夜躲在被子裡聽廣播。","和朋友騎腳踏車到很遠的地方，回程迷路了。","第一次被老師叫起來在全班面前發表。","考試前一天才開始讀書，後悔得要命。","和家人為了晚歸的事吵了一架。","收到一封沒有署名的信。"]],
 [20,39,["下班路上看到很美的晚霞，停下來看了好一會兒。","搬家時翻出小時候的照片。","和老朋友約吃飯，聊到店家打烊。","生了一場小感冒，在家躺了三天。","第一次自己下廚請朋友吃飯。","在路邊撿到一隻流浪貓，最後還是帶回家了。"]],
 [40,64,["發現自己開始需要老花眼鏡。","週末早上去市場買菜，跟熟識的老闆聊了幾句。","翻到年輕時寫的日記，笑著又放回去。","在健康檢查報告上看到幾個紅字。","學會用手機和遠方的親戚視訊。","和老同學辦了一場同學會，大家都變了好多。"]],
 [65,120,["每天早上到公園做運動。","把種了很多年的盆栽分給鄰居。","一個人坐在窗邊，想起很久以前的事。","孫子女教你玩新的遊戲，你一直輸。","去參加老朋友的告別式，回家後沉默了很久。","整理舊物，把重要的東西一件件交代給家人。"]]];
function dailyLife(L){
 const band=DAILY.find(b=>L.age>=b[0]&&L.age<=b[1]);if(!band)return;
 L.dailySeen=L.dailySeen||{};
 const n=R()<.55?1:R()<.3?2:0;
 for(let i=0;i<n;i++){const t=pick(band[2]);if(L.dailySeen[t])continue;L.dailySeen[t]=1;say(L,t)}
}

// 孩子：出生時取名，之後的事會標出孩子幾歲
function syncKids(L){
 L.kidList=L.kidList||[];
 while(L.kidList.length<L.kids){
  const sex=R()<.5?"男":"女",pool=NAMES[REGION(L.raw)][sex].filter(n=>n!==L.name&&n!==L.partnerName&&!L.kidList.some(k=>k.name==n));
  const k={name:pick(pool.length?pool:NAMES[REGION(L.raw)][sex]),sex,born:L.age,done:{}};L.kidList.push(k);
  if(L===P)say(L,`孩子取名叫${k.name}。`);
 }
}
const KID_EVENTS=[
 [6,6,1,(L,k)=>`${k.name}上小學了，第一天哭著不肯進教室。`],
 [8,12,.15,(L,k)=>pick([`${k.name}在學校畫了一張全家福，貼在冰箱上。`,`${k.name}說長大要當太空人。`,`${k.name}半夜做惡夢，跑來跟你一起睡。`])],
 [13,17,.18,(L,k)=>pick([`${k.name}進入叛逆期，跟你說話越來越少。`,`${k.name}偷偷交了男女朋友，被你發現了。`,`${k.name}考試考差了，把成績單藏起來。`])],
 [14,18,.06,(L,k)=>{L.happy-=4;return `${k.name}在學校跟同學打架，你被叫到學校。你先帶孩子去吃了一碗麵，才問發生了什麼事。`}],
 [18,18,1,(L,k)=>`${k.name}畢業了。`],
 [21,24,.35,(L,k)=>{L.happy+=6;return `${k.name}領到第一份薪水，請全家人吃了一頓飯。`}],
 [22,30,.15,(L,k)=>{L.money+=L.c.gdp*.05;return `${k.name}開始每個月拿孝親費回家，你偷偷幫孩子存了起來。`}],
 [24,34,.12,(L,k)=>{if(k.married)return null;k.married=true;const cost=L.c.gdp*.35;L.money-=cost;ledger(L,"資助孩子結婚",-cost);L.happy+=6;return `${k.name}結婚了。你出了一筆錢幫忙辦婚禮。`}],
 [26,40,.08,(L,k)=>{if(k.left)return null;k.left=true;return `${k.name}搬出去住了，家裡突然安靜好多。`}],
];
function kidEvents(L){
 syncKids(L);
 for(const k of L.kidList){const a=L.age-k.born;if(a<=0||k.gone)continue;
  for(let i=0;i<KID_EVENTS.length;i++){const e=KID_EVENTS[i];if(a<e[0]||a>e[1]||k.done[i])continue;
   if(R()<e[2]){const t=e[3](L,k);if(t){k.done[i]=1;say(L,t+`（${k.name} ${a} 歲）`)}break}}}
}

// 錢的明細：每年記下大筆收支，年底告訴玩家錢花到哪裡
function ledger(L,cat,amt){L.led=L.led||{};L.led[cat]=(L.led[cat]||0)+amt}
function moneyYear(L){
 const c=L.c;
 // 欠債要付利息
 if(L.money<0){const it=-L.money*.06;L.money-=it;ledger(L,"債務利息",-it)}
 // 房租或房貸（成年、沒和父母住）
 if(L.age>=20&&!L.house&&(L.job||L.partner)){const rent=c.gdp*(L.moved?.12:.07);L.money-=rent;ledger(L,"房租",-rent);
  if(R()<.04){const up=c.gdp*.03;L.money-=up;ledger(L,"房租上漲",-up);if(L===P)say(L,`房東通知要漲房租，生活更緊了。（−${money(up)}）`)}}
 if(L.kids&&L.age<55)ledger(L,"養孩子",-L.inc*.02*L.kids);
 // 欠太多會失眠
 if(L.money<-c.gdp*.5&&R()<.35){L.happy-=4;L.health-=1;if(L===P)say(L,`還欠著 ${money(-L.money)} 的債，晚上常常睡不著。`)}
 // 年底報告：只在有大筆變化時說
 if(L===P&&L.led){const items=Object.entries(L.led).filter(([,v])=>Math.abs(v)>c.gdp*.02).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,3);
  if(items.length&&R()<.6)say(L,`今年的大筆收支：${items.map(([k,v])=>`${k} ${v>0?"+":"−"}${money(Math.abs(v))}`).join("・")}`)}
 L.led={};
}

// 善意的回響：曾經幫過的人，幾年後回來道謝
async function kindness(L){
 if(L.age>=16&&L.age<=70&&!L.kindAt&&R()<.04){
  await ask(L,"公車上，一位老人家提著兩大袋東西站不穩",[["讓座，下車時幫忙提回家",()=>{L.kindAt=L.age;L.rel+=2;L.happy+=2},"人際↑"],["假裝沒看到",()=>{}]]);
 }
 if(L.kindAt&&!L.kindBack&&L.age-L.kindAt>=4&&R()<.25){L.kindBack=true;L.happy+=8;say(L,"幾年前你幫忙提東西的那位老人家，家人輾轉找到你，送來一箱自家種的水果。")}
}

async function storyYear(L){kidEvents(L);moneyYear(L);dailyLife(L);await kindness(L)}
