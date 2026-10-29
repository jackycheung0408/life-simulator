// 讓人生像真的：日常小事、有名字的孩子、錢的明細、善意的回響
// 依賴：say、ask、pick、R、NAMES、REGION、money

// 日常小事（依年齡段）；每年挑 0～2 件，讓紀錄不只有大事
const DAILY=[
 [4,12,["第一次掉牙，把牙齒丟到屋頂上。","在作業簿上畫滿了小人。","和同學交換貼紙，換到一張很稀有的。","被狗追，從此不敢走那條路。","學會騎腳踏車，膝蓋摔破了好幾次。","過年拿到紅包，偷偷數了好幾遍。","和好朋友吵架，隔天又和好了。","在雜貨店門口玩抽抽樂。","第一次一個人去買東西，緊張得找錯錢。","颱風天停課，在家看了一整天卡通。","被選上當班長，上台時腿一直抖。","養的蠶寶寶結繭了。","在夜市套圈圈，套中一隻玩偶。","生日那天，家人買了一個小蛋糕。","在巷口跟鄰居的孩子玩到天黑才回家。","下雨天把紙船放進水溝，追著它跑了好遠。","第一次自己綁好鞋帶，得意了一整天。","偷偷把不愛吃的青菜藏在碗底，被發現了。","發燒那晚，媽媽整夜沒睡守在床邊。","在學校交到了一個會分你點心的朋友。"]],
 [13,19,["偷偷喜歡班上的某個人。","段考考砸了，不敢拿考卷回家。","和朋友在操場聊到很晚。","迷上一個樂團，把歌詞抄滿整本筆記本。","畢業旅行那晚，大家都沒睡。","第一次自己搭長途車去外地。","被罰站在走廊上。","失眠的晚上，在窗邊看了好久的月亮。","半夜躲在被子裡聽廣播。","和朋友騎腳踏車到很遠的地方，回程迷路了。","第一次被老師叫起來在全班面前發表。","收到一封沒有署名的信。"]],
 [20,39,["加班到很晚，便利商店的店員都認得你了。","參加朋友的婚禮，喝到有點醉。","第一次自己繳水電費，才知道生活不便宜。","被主管當眾罵了一頓。","週末去爬山，看到很美的雲海。","租的房子漏水，跟房東交涉了好久。","收到家裡寄來的一箱菜。","颱風天被困在公司。","下班路上看到很美的晚霞，停下來看了好一會兒。","搬家時翻出小時候的照片。","和老朋友約吃飯，聊到店家打烊。","生了一場小感冒，在家躺了三天。"]],
 [40,64,["孩子考試，你比孩子還緊張。","腰開始痠痛，彎腰變得吃力。","在公司被年輕同事叫「大哥／大姐」。","陪爸媽去醫院回診。","學會用網路訂東西。","被拉進家族群組，每天收到早安圖。","和伴侶散步時，聊起剛認識的時候。","換了一副新眼鏡，世界變清楚了。","發現自己開始需要老花眼鏡。","週末早上去市場買菜，跟熟識的老闆聊了幾句。","翻到年輕時寫的日記，笑著又放回去。","在健康檢查報告上看到幾個紅字。","學會用手機和遠方的親戚視訊。","和老同學辦了一場同學會，大家都變了好多。"]],
 [65,120,["每天早上跟鄰居在公園聊天。","學會用手機看影片，看到睡著。","在廟口下了一下午的棋。","記性變差，常常找不到鑰匙。","收到孩子寄來的照片，看了好幾遍。","牙齒不好，換了一副假牙。","看電視看到一半睡著了。","每天早上到公園做運動。","把種了很多年的盆栽分給鄰居。","一個人坐在窗邊，想起很久以前的事。","孫子女教你玩新的遊戲，你一直輸。","去參加老朋友的告別式，回家後沉默了很久。","整理舊物，把重要的東西一件件交代給家人。"]]];
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
 if(L.money<0){const it=-L.money*.03;L.money-=it;ledger(L,"債務利息",-it)}
 // 房租或房貸（成年、沒和父母住）
 // 一般生活費已含在每年的儲蓄裡；離鄉打拚或出國的人另外多付一筆房租
  if(L.age>=20&&!L.house&&L.job&&R()<.04){const up=L.inc*.03;L.money-=up;ledger(L,"房租上漲",-up);if(L===P)say(L,`房東通知要漲房租，生活更緊了。（−${money(up)}）`)}
 // 欠太多會失眠
 if(L.money<-c.gdp*.5&&R()<.35){L.happy-=4;L.health-=1;if(L===P)say(L,`還欠著 ${money(-L.money)} 的債，晚上常常睡不著。`)}
 // 年底報告：只在有大筆變化時說
 if(L===P&&L.led){const ROUTINE=["吃","穿","住","行","其他","養孩子","薪水"],items=Object.entries(L.led).filter(([k,v])=>Math.abs(v)>c.gdp*.02&&(!ROUTINE.includes(k)||Object.keys(L.led).some(x=>!ROUTINE.includes(x)&&Math.abs(L.led[x])>c.gdp*.02))).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,3);
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


// 生活中的小抉擇：原本直接寫結果的事，改成讓你自己選
const SMALL=[
 [7,12,"暑假作業還有一大疊",[["每天寫一點",{know:2}],["最後一天熬夜趕完",{happy:1,health:-1}],["拜託哥哥姊姊幫忙",{rel:1,know:-1}]]],
 [13,18,"段考前一週，朋友約你去玩",[["拒絕，在家讀書",{know:3,rel:-1}],["玩一天就回來讀",{happy:2,know:1}],["考完再說，先去玩",{happy:3,know:-2}]]],
 [15,18,"學校社團開始招生",[["熱音社",{happy:2,rel:2}],["籃球隊",{health:3,rel:1}],["讀書會",{know:3}],["不參加，回家休息",{happy:1}]]],
 [15,19,"晚上朋友約你出去，但家裡有門禁",[["準時回家",{rel:1}],["晚一點回去，回家被罵",{happy:1,rel:-1}],["說服爸媽讓你去",{rel:2,know:1}]]],
 [16,22,"想找一份打工",[["速食店",{rel:1,health:-1},.03],["家教",{know:2},.04],["不打工，專心讀書",{know:2}]]],
 [20,35,"想運動一下，要怎麼開始？",[["報名健身房",{health:3},-.03],["每天下班去跑步",{health:2,happy:1}],["假日爬山",{health:2,rel:1}],["算了，太累",{happy:1,health:-1}]]],
 [20,40,"想要一台代步的交通工具",[["存錢買新機車",{happy:2},-.08],["買二手機車",{happy:1},-.03],["繼續搭公車",{health:1}]]],
 [20,50,"路邊有一隻流浪貓跟著你",[["帶回家養",{happy:5},-.03],["每天帶飼料來餵",{happy:2}],["聯絡動物協會",{rel:1}]]],
 [22,45,"週末朋友想來你家玩",[["親自下廚招待",{rel:3,happy:1},-.01],["叫外送",{rel:2},-.015],["改約在外面",{rel:1}]]],
 [65,85,"社區開了長青班",[["學書法",{know:2,happy:1}],["學跳舞",{health:2,rel:2}],["學用手機",{know:3}],["不去，在家比較自在",{happy:1}]]],
];
async function smallChoice(L){
 if(R()>.4)return;L.smallSeen=L.smallSeen||{};
 const ok=SMALL.filter(x=>L.age>=x[0]&&L.age<=x[1]&&!L.smallSeen[x[2]]);if(!ok.length)return;
 const x=pick(ok);L.smallSeen[x[2]]=1;
 await ask(L,x[2],x[3].map(([t,e,m])=>{const cost=m?Math.abs(m)*L.c.gdp:0;return [t,()=>{for(const k in e)L[k]+=e[k];if(m){L.money+=m*L.c.gdp;ledger(L,m>0?"打工":"花費",m*L.c.gdp)}},m>0?`收入 +${money(cost)}`:m<0?`約 ${money(cost)}`:"",m<0?cost:0]}));
}

// 性別薪資落差（女性薪資約少幾成）：依富裕程度與地區概估
function payGap(c){if(c.tw)return .14;const r=REGION(c.name);return c.gdp>40000?.12:r=="中東"||r=="南亞"?.3:.2}

// 食衣住行：成年後自己負擔，依國家所得、城鄉、住哪裡、家庭人數與花錢習慣計算
function livingCost(L){
 const c=L.c,g=c.gdp,city=L.moved||L.abroad||L.fam?.urban,sp=L===P?spend:1,adult=L.partner?1.6:1;
 const food=g*.14*adult*(.85+sp*.15)*(c.gdp<5000?1.3:1);              // 窮國吃的佔比高
 const cloth=g*.03*adult*(.6+sp*.4)*(L.sex=="女"?1.15:1);
 const live=L.house?g*.12:(L.moved||L.abroad)?g*(city?.14:.09):g*.05;  // 房貸／租屋／住家裡（給家裡的孝親費）
 const go=L.car?g*.06:g*(city?.025:.035);
 const kids=(L.kids||0)*g*.07*(L.age<55?1:0);
 const etc=g*.07*adult*(.6+sp*.4);                                       // 手機、保險、娛樂、紅白包
 return {吃:food,穿:cloth,住:live,行:go,其他:etc,養孩子:kids};
}
// 一年的收入與開銷（存款卡片的逐月動畫也用這個）
// 年終獎金月數：依地區習慣與當年景氣（台灣約 1～2 個月，很多地區有第 13 個月薪水）
function bonusMonths(L){
 if(!L.job)return 0;if(L.bonusAge===L.age)return L.bonusM;
 const r=L.c.tw?"華":REGION(L.c.name),base=L.c.tw?1.5:["華","韓"].includes(r)?1.5:["拉","歐"].includes(r)?1:L.c.gdp<8000?0:.5;
 L.bonusAge=L.age;L.bonusM=Math.max(0,Math.round((base+(R()-.5)*(L.focus=="工作"?2:1.4))*2)/2);return L.bonusM;
}
function yearFlow(L){
 const cost=livingCost(L),full=Object.values(cost).reduce((a,b)=>a+b,0);
 const income=L.job?L.inc:L.age>=65?L.c.gdp*.15:0;                     // 退休後的年金
 // 人會依收入調整生活：開銷最多花到收入的 85%～99%（看花錢習慣）；沒收入時靠家人接濟，只算最低開銷
 const sp=L===P?spend:1,total=income?Math.min(full,income*(.85+sp*.07)):L.c.gdp*.06;
 return {cost,income,total,full};
}
function livingYear(L){
 if(L.age<18||!L.job&&L.age<22)return;                                  // 學生時期由家裡負擔
 const {cost,income,total,full}=yearFlow(L),b=bonusMonths(L);
 if(L===P&&b>=2.5&&R()<.7)say(L,`公司今年業績好，年終領了 ${b} 個月！`);else if(L===P&&L.job&&b==0&&L.c.gdp>8000&&R()<.5)say(L,"今年公司說景氣不好，沒有年終。");
 if(L===P&&income&&full>income*1.05&&R()<.3)say(L,pick(["薪水不夠花，只好搬去更便宜的地方住。","每個月都在算錢，能省則省。","外食改成自己煮，衣服也很少買新的。"]));
 L.money+=income-total;if(income)ledger(L,"薪水",income);
 for(const k in cost)ledger(L,k,-cost[k]*total/Object.values(cost).reduce((a,b)=>a+b,0));
 if(L===P&&(L.age==22||L.age%10==0)&&income)say(L,`一年的生活開銷：吃 ${moneyShort(cost.吃)}・穿 ${moneyShort(cost.穿)}・住 ${moneyShort(cost.住)}・行 ${moneyShort(cost.行)}${cost.養孩子?`・孩子 ${moneyShort(cost.養孩子)}`:""}`);
}
// 孩子出生後的育嬰抉擇：女性比較常被期待離開職場
async function parentLeave(L){
 const k=L.kids||0;if(k<=(L.leaveSeen||0)){L.leaveSeen=k;return}L.leaveSeen=k;if(!L.job)return;
 const she=L.sex=="女";
 await ask(L,she?"孩子出生了，工作要怎麼安排？":"孩子出生了，伴侶問你能不能幫忙帶",[
  ["請育嬰假半年",()=>{L.money-=L.inc*.3;L.rel+=3;L.happy+=2;if(!she)say(L,"成了公司少數請育嬰假的爸爸。")},"收入少半年 · 人際↑"],
  ["辭職專心帶孩子",()=>{L.lostJob=L.job;L.job=null;L.rel+=4;L.happy+=1;say(L,"離開職場，在家照顧孩子。")},"沒有收入 · 人際↑"],
  ["請爸媽幫忙帶",()=>{L.rel+=1;L.happy-=1},"照常上班"],
  ["送托嬰中心",()=>{L.money-=L.c.gdp*.15;ledger(L,"托嬰",-L.c.gdp*.15)},"每年一筆開銷"]]);
}

// 女孩受教育的機會：低所得的部分地區明顯較少（概估自 UNESCO 性別差距）
function girlSchool(L){if(L.sex!="女"||L.c.tw||L.c.gdp>15000)return 1;const r=REGION(L.c.name);return ["南亞","中東","非洲之角","西非","中非"].includes(r)?.72:["東非"].includes(r)?.85:.95}

// 婚禮習俗：依地區不同，誰出錢、花多少都不一樣
function weddingCustom(L){
 const r=L.c.tw?"華":REGION(L.c.name),g=L.c.gdp,he=L.sex=="男";
 if(r=="南亞")return {q:he?"要結婚了，女方家準備了嫁妝":"要結婚了，男方家期待一筆嫁妝",gift:he?g*.8:-g*1.2,note:"南亞部分地區仍有嫁妝習俗"};
 if(["西非","東非","中非","非洲之角","南非","中東"].includes(r))return {q:he?"要結婚了，得準備給女方家的聘禮":"要結婚了，男方家送來聘禮",gift:he?-g*1:g*.6,note:"許多地區有男方給聘禮的習俗"};
 if(r=="華"||r=="韓")return {q:"要結婚了，婚禮怎麼辦？",gift:he?-g*.3:g*.1,note:"男方通常負擔聘金，女方準備嫁妝"};
 return {q:"要結婚了，婚禮怎麼辦？",gift:0,note:""};
}
async function wedding(L){
 if(!L.partner||L.wedDone)return;L.wedDone=true;
 const w=weddingCustom(L),g=L.c.gdp;
 if(w.gift){L.money+=w.gift;ledger(L,w.gift>0?"嫁妝聘禮收入":"嫁妝聘禮",w.gift)}
 await ask(L,w.q,[
  ["大宴親友",()=>{L.money-=g*.4;ledger(L,"婚宴",-g*.4);L.rel+=5;L.happy+=4;L.money+=g*.25},"人際↑ 收紅包回收一部分",g*.15],
  ["簡單請幾桌",()=>{L.money-=g*.15;L.rel+=2;L.happy+=2;L.money+=g*.1},"花費適中"],
  ["只登記，不辦婚禮",()=>{L.happy+=1;L.rel-=1},"省錢 · 長輩可能不高興"],
  ["拿這筆錢去旅行",()=>{L.money-=g*.12;L.happy+=5},"幸福↑"]],w.note);
}

// 依性別與地區才會遇到的事
async function genderYear(L){
 const c=L.c,r=c.tw?"華":REGION(c.name),he=L.sex=="男",g=c.gdp;
 // 韓國男性兵役約一年半
 if(he&&r=="韓"&&L.age==20&&!L.served){L.served=true;await ask(L,"到了要服兵役的年紀",[["馬上入伍",()=>{L.health+=2;L.rel+=2;say(L,"入伍服役約一年半。")},"早點結束"],["讀完書再去",()=>{L.know+=2;L.happy-=2;say(L,"延後入伍，先把書讀完。")},"知識↑"],["申請替代役",()=>{L.rel+=1;say(L,"在公家機關服替代役。")},"較輕鬆"]])}
 // 職場：女性懷孕或婚後被暗示離職
 if(!he&&L.job&&L.partner&&L.age>=25&&L.age<=40&&!L.biasSeen&&R()<.08){L.biasSeen=true;await ask(L,"主管暗示你，結婚了應該會想辭職回家吧",[["據理力爭",()=>{L.happy-=2;L.rel-=1;if(R()<.5){L.inc*=1.05;say(L,"你證明了自己，還升了職。")}},"可能升職 · 氣氛差"],["默默做好自己的事",()=>{L.happy-=3},"幸福↓"],["換一間公司",()=>{L.inc*=.95;L.happy+=2;say(L,"換到一間比較友善的公司。")},"收入小降 · 幸福↑"],["向勞工局申訴",()=>{L.rel-=2;L.happy+=1;if(R()<.4)L.money+=L.inc*.3},"可能拿到賠償"]],"性別工作平等法禁止這類對待，但職場上仍常發生")}
 // 夜歸安全：女性在治安較差的地區更要小心
 if(!he&&L.age>=16&&L.age<=40&&!L.nightSeen&&R()<(g<15000?.05:.02)){L.nightSeen=true;await ask(L,"加班到很晚，回家的路很暗",[["叫車回家",()=>{L.money-=g*.002},"安全"],["請朋友來接",()=>{L.rel+=1},"人際↑"],["走大路快步回家",()=>{if(R()<.15){L.happy-=6;say(L,"路上被陌生人跟了一段，嚇得好幾天不敢晚歸。")}},"有點風險"]])}
 // 男性：被期待扛家計
 if(he&&L.partner&&L.kids&&L.job&&!L.breadSeen&&R()<.06){L.breadSeen=true;await ask(L,"長輩說男人要多賺錢養家",[["多兼一份差",()=>{L.inc*=1.1;L.health-=3;L.rel-=1},"收入↑ 健康↓"],["跟伴侶一起分擔",()=>{L.rel+=2},"人際↑"],["不理會，照自己的步調",()=>{L.happy+=1},""]])}
 // 女性 45～55 歲更年期
 if(!he&&L.age==50&&R()<.6){L.health-=3;L.happy-=2;say(L,"進入更年期，常常熱潮紅、睡不好。")}
 // 照顧父母：女兒常被期待放下工作
 if(!he&&L.parentAlive&&L.age>=45&&L.age<=60&&L.job&&!L.careSeen&&R()<.05){L.careSeen=true;await ask(L,"家人覺得照顧爸媽應該由女兒來",[["辭職照顧",()=>{L.lostJob=L.job;L.job=null;L.rel+=3;L.happy-=3},"沒收入"],["和兄弟輪流",()=>{L.rel+=1;L.happy-=1},"公平分擔"],["出錢請人照顧",()=>{L.money-=g*.2;ledger(L,"照顧費",-g*.2)},"每年開銷"]])}
}

// 理財：每隔幾年可以決定閒錢怎麼放，有賺有賠
// [名稱, 年報酬平均, 波動, 說明]
const INVEST={定存:[.015,.0,"穩穩的，但跟不上物價"],指數基金:[.06,.15,"長期多半會漲，偶爾大跌"],個股:[.07,.35,"可能翻倍，也可能腰斬"],加密貨幣:[.1,.8,"一年翻好幾倍或歸零都有可能"],買房收租:[.04,.08,"租金穩定，房價看景氣"]};
function gauss(){return Math.sqrt(-2*Math.log(R()||1e-9))*Math.cos(2*Math.PI*R())}
async function investYear(L){
 // 已投資的部分：每年結算
 if(L.inv&&L.inv.amt>0){const [mu,sd]=INVEST[L.inv.type];let r=mu+sd*gauss();if(L.inv.type=="加密貨幣"&&R()<.04)r=-.95;r=Math.max(-.95,r);
  const d=L.inv.amt*r;L.inv.amt+=d;ledger(L,"投資"+(d>=0?"獲利":"虧損"),0);
  if(L===P&&Math.abs(r)>.25)say(L,r>0?`${L.inv.type}今年大漲 ${Math.round(r*100)}%，帳面多了 ${money(d)}。`:`${L.inv.type}今年大跌 ${Math.round(-r*100)}%，帳面少了 ${money(-d)}。`);
  L.inv.years++;}
 // 每 3～5 年有機會調整一次
 if(L.age<22||!L.job||L.age>70)return;
 const idle=L.money,next=L.invNext||25;if(L.age<next||idle<L.inc*.3)return;
 L.invNext=L.age+3+Math.floor(R()*3);
 const cur=L.inv&&L.inv.amt>0?`目前放在${L.inv.type}：${money(L.inv.amt)}（本金 ${money(L.inv.base)}）`:"";
 const put=t=>()=>{const a=idle*.6;L.money-=a;if(L.inv&&L.inv.type==t){L.inv.amt+=a;L.inv.base+=a}else{if(L.inv&&L.inv.amt>0)L.money+=L.inv.amt;L.inv={type:t,amt:a,base:a,years:0}}};
 const opts=Object.keys(INVEST).filter(t=>t!="加密貨幣"||L.c.y0+L.age>=2013).filter(t=>t!="買房收租"||idle>L.c.gdp*1.5).sort(()=>R()-.5).slice(0,3).map(t=>[`把存款的六成放進${t}`,put(t),INVEST[t][2]]);
 if(L.inv&&L.inv.amt>0)opts.push(["全部賣掉，錢放回存款",()=>{const g=L.inv.amt-L.inv.base;L.money+=L.inv.amt;say(L,`賣掉${L.inv.type}，${g>=0?"賺了 "+money(g):"賠了 "+money(-g)}。`);if(g>0)L.happy+=3;else L.happy-=3;L.inv=null}]);
 opts.push(["維持現狀",()=>{}]);
 await ask(L,`手上有 ${money(idle)} 存款，要怎麼理財？`,opts.slice(0,5),cur);
}
// 未成年的花費（補習、才藝、看病）由家裡負擔，不會變成自己的負債
function minorGuard(L){if(L.age<18&&L.money<0){if(L===P&&!L.minorNote){L.minorNote=1;say(L,L.cls<=1?"補習和生活的錢，爸媽咬著牙借錢付了。":"這些開銷都是爸媽幫你付的。")}L.money=0}}

// 工作後的「今年重心」：學業＝進修，工作＝拚職涯，各自會帶出抉擇
async function careerFocus(L){
 if(L.backAt===L.age){L.backAt=0;L.job=L.studyJob||L.job||"工程師";L.inc*=1.3;L.studyJob=null;say(L,`留學回國，重新當${L.job}，薪水比出國前高。`)}
 if(!L.job||L.age>=65)return;const f=L.focus,g=L.c.gdp;
 if(f=="學業"&&R()<.3)await ask(L,"想利用下班時間進修",[
  ["考專業證照",()=>{L.money-=g*.03;L.know+=4;if(R()<.6){L.inc*=1.06;say(L,"考到證照，公司幫你調薪。")}else say(L,"證照沒考過，明年再拚。")},"可能加薪"],
  ["讀在職碩士（兩年）",()=>{L.money-=g*.3;L.know+=8;L.health-=2;L.lockUntil=L.age+2;L.mbaAt=L.age+2},"知識↑↑ 兩年內很忙"],
  ["上免費線上課程",()=>{L.know+=2},"知識↑"],
  ["學第二外語",()=>{L.money-=g*.02;L.know+=3;if(R()<.3)L.abroadOk=true},"以後可能有外派機會"]]);
 if(L.mbaAt===L.age){L.mbaAt=0;L.edu=Math.max(L.edu,3);L.inc*=1.12;say(L,"拿到在職碩士學位，薪水也跟著往上調。")}
 if(f=="工作"&&R()<.3)await ask(L,"今年想在工作上拚什麼？",[
  ["爭取升遷",()=>{if(R()<.35+L.know/300){L.inc*=1.15;L.happy+=3;say(L,"升上主管，責任和薪水都變多了。")}else{L.happy-=3;say(L,"升遷名單上沒有你。")}},"成功機率看能力"],
  ["接下一個大案子",()=>{L.health-=3;if(R()<.55){L.inc*=1.08;say(L,"大案子做得漂亮，年終多領不少。")}else{L.happy-=2;say(L,"案子出了狀況，被主管念了好幾次。")}},"健康↓ 可能加薪"],
  ["跳槽到薪水更高的公司",()=>{if(R()<.6){L.inc*=1.18;L.rel-=1;say(L,"跳槽成功，薪水多了快兩成。")}else{L.happy-=2;say(L,"面試了好幾家，都沒有下文。")}},"有機會大幅加薪"],
  ["把工作做好就好",()=>{L.happy+=2},"幸福↑"]]);
}
async function storyYear(L){minorGuard(L);await careerFocus(L);await investYear(L);livingYear(L);await wedding(L);await genderYear(L);await parentLeave(L);await smallChoice(L);kidEvents(L);moneyYear(L);dailyLife(L);await kindness(L);await spendYear(L);minorGuard(L)}
