// 讓人生像真的：日常小事、有名字的孩子、錢的明細、善意的回響
// 依賴：say、ask、pick、R、NAMES、REGION、money

// 日常小事（依年齡段）；每年挑 0～2 件，讓紀錄不只有大事
const DAILY=[
 [4,12,["第一次掉牙，把牙齒丟到屋頂上。","在作業簿上畫滿了小人。","和同學交換貼紙，換到一張很稀有的。","被狗追，從此不敢走那條路。","學會騎腳踏車，膝蓋摔破了好幾次。","過年拿到紅包，偷偷數了好幾遍。","和好朋友吵架，隔天又和好了。","在雜貨店門口玩抽抽樂。","第一次一個人去買東西，緊張得找錯錢。","颱風天停課，在家看了一整天卡通。","被選上當班長，上台時腿一直抖。","養的蠶寶寶結繭了。","暑假作業拖到最後一天才寫。","在夜市套圈圈，套中一隻玩偶。","生日那天，家人買了一個小蛋糕。","在巷口跟鄰居的孩子玩到天黑才回家。","下雨天把紙船放進水溝，追著它跑了好遠。","第一次自己綁好鞋帶，得意了一整天。","偷偷把不愛吃的青菜藏在碗底，被發現了。","發燒那晚，媽媽整夜沒睡守在床邊。","在學校交到了一個會分你點心的朋友。"]],
 [13,19,["偷偷喜歡班上的某個人。","第一次打工，領到薪水買了想要很久的東西。","段考考砸了，不敢拿考卷回家。","和朋友在操場聊到很晚。","迷上一個樂團，把歌詞抄滿整本筆記本。","畢業旅行那晚，大家都沒睡。","第一次自己搭長途車去外地。","被罰站在走廊上。","參加社團，認識了一群好朋友。","失眠的晚上，在窗邊看了好久的月亮。","半夜躲在被子裡聽廣播。","和朋友騎腳踏車到很遠的地方，回程迷路了。","第一次被老師叫起來在全班面前發表。","考試前一天才開始讀書，後悔得要命。","和家人為了晚歸的事吵了一架。","收到一封沒有署名的信。"]],
 [20,39,["加班到很晚，便利商店的店員都認得你了。","存錢買了一台想要很久的機車。","參加朋友的婚禮，喝到有點醉。","第一次自己繳水電費，才知道生活不便宜。","被主管當眾罵了一頓。","週末去爬山，看到很美的雲海。","租的房子漏水，跟房東交涉了好久。","收到家裡寄來的一箱菜。","報名健身房，去了三次就沒再去。","颱風天被困在公司。","下班路上看到很美的晚霞，停下來看了好一會兒。","搬家時翻出小時候的照片。","和老朋友約吃飯，聊到店家打烊。","生了一場小感冒，在家躺了三天。","第一次自己下廚請朋友吃飯。","在路邊撿到一隻流浪貓，最後還是帶回家了。"]],
 [40,64,["孩子考試，你比孩子還緊張。","腰開始痠痛，彎腰變得吃力。","在公司被年輕同事叫「大哥／大姐」。","陪爸媽去醫院回診。","學會用網路訂東西。","被拉進家族群組，每天收到早安圖。","和伴侶散步時，聊起剛認識的時候。","換了一副新眼鏡，世界變清楚了。","發現自己開始需要老花眼鏡。","週末早上去市場買菜，跟熟識的老闆聊了幾句。","翻到年輕時寫的日記，笑著又放回去。","在健康檢查報告上看到幾個紅字。","學會用手機和遠方的親戚視訊。","和老同學辦了一場同學會，大家都變了好多。"]],
 [65,120,["每天早上跟鄰居在公園聊天。","學會用手機看影片，看到睡著。","在廟口下了一下午的棋。","記性變差，常常找不到鑰匙。","收到孩子寄來的照片，看了好幾遍。","去上社區的長青班。","牙齒不好，換了一副假牙。","看電視看到一半睡著了。","每天早上到公園做運動。","把種了很多年的盆栽分給鄰居。","一個人坐在窗邊，想起很久以前的事。","孫子女教你玩新的遊戲，你一直輸。","去參加老朋友的告別式，回家後沉默了很久。","整理舊物，把重要的東西一件件交代給家人。"]]];
function dailyLife(L){
 const band=DAILY.find(b=>L.age>=b[0]&&L.age<=b[1]);if(!band)return;
 L.dailySeen=L.dailySeen||{};
 const n=R()<.6?1:R()<.7?2:0;
 for(let i=0;i<n;i++){const left=band[2].filter(t=>!L.dailySeen[t]);if(!left.length)break;const t=pick(left);L.dailySeen[t]=1;say(L,t)}
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
 // 一般生活費已含在每年的儲蓄裡；離鄉打拚或出國的人另外多付一筆房租
 if(L.age>=20&&!L.house&&(L.moved||L.abroad)&&L.job){const rent=L.inc*.08;L.money-=rent;ledger(L,"房租",-rent)}
 if(L.age>=20&&!L.house&&L.job&&R()<.04){const up=L.inc*.03;L.money-=up;ledger(L,"房租上漲",-up);if(L===P)say(L,`房東通知要漲房租，生活更緊了。（−${money(up)}）`)}
 if(L.kids&&L.age<55)ledger(L,"養孩子",-L.inc*.02*L.kids);
 // 欠太多會失眠
 if(L.money<-c.gdp*.5&&R()<.35){L.happy-=4;L.health-=1;if(L===P)say(L,`還欠著 ${money(-L.money)} 的債，晚上常常睡不著。`)}
 // 年底報告：只在有大筆變化時說
 if(L===P&&L.led){const ROUTINE=["房租","養孩子"],items=Object.entries(L.led).filter(([k,v])=>Math.abs(v)>c.gdp*.02&&(!ROUTINE.includes(k)||Object.keys(L.led).some(x=>!ROUTINE.includes(x)&&Math.abs(L.led[x])>c.gdp*.02))).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,3);
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


// 花錢的機會：每年有機會遇到一件想花錢的事（once 只會遇到一次）
const SPEND=[
 {id:"trip",min:18,max:75,cost:L=>L.inc*.08,q:"朋友揪你出國玩一趟",yes:"跟著去",y:L=>{L.happy+=6;L.rel+=2},no:"這次先不去",n:L=>{L.rel-=1}},
 {id:"phone",min:14,max:80,cost:L=>L.c.gdp*.03,q:"新手機出了，你的舊手機越來越卡",yes:"換新的",y:L=>{L.happy+=3},no:"再撐一年",n:()=>{}},
 {id:"car",once:1,min:22,max:60,cost:L=>L.c.gdp*.6,q:"想買一台車，通勤和帶家人出門都方便",yes:"買車",y:L=>{L.happy+=5;L.car=true},no:"繼續搭車騎車",n:()=>{}},
 {id:"class",min:18,max:60,cost:L=>L.c.gdp*.05,q:"看到一門想上的課程（語言、證照、才藝）",yes:"報名",y:L=>{L.know+=5;if(L.job)L.inc*=1.02},no:"算了",n:()=>{}},
 {id:"parents",min:22,max:65,cost:L=>L.inc*.06,q:"爸媽年紀大了，想帶他們好好吃一頓、包個紅包",yes:"包大一點",y:L=>{L.rel+=4;L.happy+=3},no:"意思一下就好",n:L=>{L.rel+=1}},
 {id:"reno",once:1,min:30,max:70,cost:L=>L.c.gdp*.4,q:"家裡老舊，想整修一下",yes:"整修",y:L=>{L.happy+=5;L.health+=1},no:"住得下去就好",n:()=>{}},
 {id:"pet",once:1,min:10,max:70,cost:L=>L.c.gdp*.05,q:"路邊有隻小狗一直跟著你",yes:"帶回家養",y:L=>{L.happy+=7;L.pet=true},no:"送到收容所",n:()=>{}},
 {id:"checkup",min:40,max:85,cost:L=>L.c.gdp*.04,q:"醫院推出自費健康檢查",yes:"去做",y:L=>{L.health+=4},no:"身體還好，不用",n:()=>{}},
 {id:"lend",min:25,max:70,cost:L=>L.inc*.15,q:"老朋友手頭緊，開口跟你借錢",yes:"借他",y:L=>{L.rel+=3;L.lent=L.inc*.15;L.lentAt=L.age},no:"婉拒",n:L=>{L.rel-=3}},
 {id:"invest",min:25,max:65,cost:L=>L.inc*.2,q:"同事說有一檔股票很有潛力",yes:"投一筆",y:L=>{const r=R()<.45?2:R()<.6?.3:1.2;L.money+=L.inc*.2*r;ledger(L,"投資",L.inc*.2*(r-1));say(L,r>1.5?"那檔股票真的漲了一倍！":r<.5?"股票套牢，賠了七成。":"股票小賺一點。")},no:"不碰",n:()=>{}},
];
async function spendYear(L){
 if(L.lent&&L.age-L.lentAt>=2&&R()<.3){if(R()<.6){L.money+=L.lent;say(L,`朋友把之前借的 ${money(L.lent)} 還給你了。`)}else{L.rel-=2;say(L,"借出去的錢，朋友一直沒還，也不好意思開口。")}L.lent=0}
 if(L.age<14||R()>.3||L.money<=0&&L.age<22)return;
 L.spent=L.spent||{};
 const ok=SPEND.filter(e=>L.age>=e.min&&L.age<=e.max&&!(e.once&&L.spent[e.id]));if(!ok.length)return;
 const e=pick(ok),cost=Math.max(e.cost(L),1);
 await ask(L,e.q,[[e.yes,()=>{L.spent[e.id]=1;L.money-=cost;ledger(L,"花費",-cost);e.y(L)},`約 ${money(cost)}`,cost],["花少一點，挑便宜的",()=>{L.money-=cost*.4;ledger(L,"花費",-cost*.4);L.happy+=2},`約 ${money(cost*.4)}`,cost*.4],[e.no,()=>{e.n(L)},"省下來"]]);
}

async function storyYear(L){kidEvents(L);moneyYear(L);dailyLife(L);await kindness(L);await spendYear(L)}
