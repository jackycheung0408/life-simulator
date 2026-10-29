// 台灣人生模式：22 縣市、歷年概況、台灣大事、台灣才有的抉擇
// 數字為內政部、主計總處、衛福部等公開統計的概略值；早期年份為估計

// 縣市：[名稱, 人口（萬，近年）, 所得指數（全國=1）, 都市化（0～1）]
const TW_COUNTY=[["新北市",400,1.0,.9],["台中市",285,.98,.8],["高雄市",273,.95,.8],["台北市",250,1.35,1],["桃園市",230,1.05,.85],["台南市",186,.92,.7],
 ["彰化縣",124,.85,.5],["屏東縣",80,.8,.45],["雲林縣",67,.78,.35],["苗栗縣",54,.85,.45],["新竹縣",59,1.2,.6],["嘉義縣",48,.78,.3],["南投縣",48,.8,.35],
 ["宜蘭縣",45,.85,.5],["新竹市",45,1.25,.95],["基隆市",36,.92,.9],["花蓮縣",32,.82,.5],["嘉義市",26,.9,.9],["台東縣",21,.75,.35],["金門縣",14,.85,.4],["澎湖縣",11,.82,.4],["連江縣",1.4,.9,.3]];

// 歷年概況（線性內插）：[年, 男壽, 女壽, 人均所得 PPP（USD）, 嬰兒死亡‰, 大學就學率%, 總生育率]
const TW_YEARS=[[1950,53,56,1500,45,3,6.0],[1960,62,66,2600,35,6,5.75],[1970,66,71,5000,20,12,4.0],[1980,70,75,11000,9,20,2.5],
 [1990,71,77,20000,6,35,1.8],[2000,73,79,30000,6,60,1.7],[2010,76,82,43000,4,80,0.9],[2020,78,84,60000,4,90,1.0],[2025,78,84,72000,4,90,0.9]];
function twAt(y){let i=TW_YEARS.findIndex(r=>r[0]>y);if(i<0)return TW_YEARS.at(-1);if(i==0)return TW_YEARS[0];
 const a=TW_YEARS[i-1],b=TW_YEARS[i],t=(y-a[0])/(b[0]-a[0]);return a.map((v,k)=>v+(b[k]-v)*t)}

// 建立台灣出生的世界資料（格式和 world() 相同，讓其他程式照常運作）
function twWorld(year,county){
 const r=twAt(year),[,,inc,urb]=county;
 return {name:"台灣",city:county[0],mEx:r[1],fEx:r[2],gdp:r[3]*inc,im:r[4],uni:r[5],gini:.34,y0:year,tw:{county:county[0],urb,tfr:r[6]}};
}

// 台灣大事：每個人經歷的方式不同
// y 年份、a 最低年齡、p 會在紀錄中出現的機率、v 一般經歷（隨機挑一種）、e 效果、f 統計小字
// local：住在特定縣市的人有機會直接受影響（c 縣市、p 機率、v 經歷、e 效果）
// odd：少數人的特殊遭遇（p 機率、v 經歷、e 效果）
const TW_HISTORY=[
 {y:1959,a:0,p:.9,v:["電台說中南部大淹水，大人們整晚守著收音機。","颱風過後的豪雨淹了好多地方，親戚家也泡了水。"],e:{happy:-2},f:"1959 年 8 月 7 日的豪雨造成中南部嚴重水災。",
  local:{c:["台中市","彰化縣","雲林縣","南投縣","苗栗縣","嘉義縣"],p:.6,v:["八七水災，家裡的田泡在水裡好幾天，稻子全沒了。","大水沖進家裡，全家爬到屋頂上等水退。"],e:{happy:-8,money:-.3}}},
 {y:1968,a:6,p:1,v:["九年國民義務教育開始實施，國中不用再考試就能讀。"],e:{edu:true},f:"台灣自 1968 年起實施九年國民義務教育。"},
 {y:1971,a:10,p:.7,v:["新聞說台灣退出了聯合國，大人們的臉色都很沉重。","學校朝會時，校長講了很久台灣退出聯合國的事。","聽說有親戚因為退出聯合國，開始辦移民。"],e:{happy:-2}},
 {y:1974,a:15,p:.8,v:["十大建設陸續動工，到處都在蓋高速公路、港口和工廠。","附近開始蓋工廠，很多人去應徵。"],e:{inc:1.05},f:"十大建設於 1970 年代推動，包括中山高速公路、桃園機場等。",
  odd:{p:.15,v:["你在十大建設的工地找到一份工作，薪水比以前好很多。"],e:{inc:1.15}}},
 {y:1979,a:10,p:.7,v:["美國和台灣斷交了，電視上一直播放相關新聞。","聽說美國要和台灣斷交，街上有人在抗議。"],e:{happy:-3}},
 {y:1987,a:10,p:.95,v:["政府宣布解除戒嚴，街頭的氣氛不一樣了。","解嚴了，爸媽說以後講話不用再那麼小心。","電視上說解嚴了，大人們聊到很晚。"],e:{happy:3},f:"台灣於 1987 年 7 月 15 日解除長達 38 年的戒嚴。",
  odd:{p:.08,v:["解嚴後，你終於可以回大陸探望失散多年的親人。"],e:{happy:8}}},
 {y:1988,a:10,p:.4,v:["報禁解除，路邊的報紙一下子多了好多種。","家裡開始訂第二份報紙。"],e:{}},
 {y:1990,a:15,p:.5,v:["一群大學生在中正紀念堂廣場靜坐，要求政治改革。"],e:{},
  odd:{p:.12,v:["你也跑去中正紀念堂廣場參加靜坐，在那裡待了好幾天。"],e:{rel:3}}},
 {y:1995,a:0,p:.9,v:["全民健康保險開辦，看病只要帶一張健保卡。","家裡收到健保卡，爸媽說以後看病不用怕花大錢了。"],e:{health:3},f:"全民健保於 1995 年 3 月 1 日開辦。"},
 {y:1996,a:20,p:.85,v:["第一次總統直選，你排隊投下了一票。","第一次總統直選，投票所外大排長龍。","總統直選那天，全家一起去投票。"],e:{happy:3},f:"1996 年台灣舉行首次總統直接民選。",
  odd:{p:.15,v:["總統直選前，台海飛彈演習讓你緊張了好一陣子。"],e:{happy:-4}}},
 {y:1999,a:0,p:1,v:["921 大地震，半夜被搖醒，全家跑到外面不敢進屋。","921 地震那晚，停電又停水，全家在外面睡了好幾天。","被 921 地震搖醒，櫃子上的東西全摔到地上。"],e:{happy:-4},f:"1999 年 9 月 21 日的集集大地震造成逾兩千人罹難。",
  local:{c:["南投縣","台中市"],p:.35,v:["921 地震把家裡的房子震垮了，全家在組合屋住了一年多。","921 地震那晚，鄰居家整棟倒了下來。"],e:{happy:-15,money:-.8,health:-4}},
  odd:{p:.05,v:["921 地震後，你到災區當了好幾個月的志工。"],e:{rel:5,happy:3}}},
 {y:2000,a:20,p:.5,v:["第一次政黨輪替。","第一次政黨輪替，開票那晚大家都守在電視前。"],e:{}},
 {y:2001,a:20,p:.6,v:["開始全面週休二日，週末終於可以好好休息。","週休二日上路，假日開始有時間出去走走。"],e:{happy:3}},
 {y:2003,a:0,p:.95,v:["SARS 疫情爆發，出門都要戴口罩、量體溫。","SARS 期間，學校每天早上都要量體溫。","SARS 那陣子，大家都不太敢去醫院。"],e:{happy:-4},f:"2003 年 SARS 疫情期間，台灣累計數百例病例。",
  odd:{p:.04,v:["SARS 期間，你因為接觸過病人被居家隔離了兩週。"],e:{happy:-6}}},
 {y:2008,a:20,p:.7,v:["全球金融海嘯，公司開始放無薪假。","金融海嘯來了，股票跌了一大半。","金融海嘯，身邊好幾個朋友被裁員。"],e:{inc:.96,happy:-3},
  odd:{p:.12,v:["金融海嘯期間，你被迫放了半年無薪假。"],e:{money:-.2,happy:-6}}},
 {y:2009,a:0,p:.85,v:["八八風災的新聞畫面讓人心痛，大家都在捐款。","莫拉克颱風帶來破紀錄的雨量，南部山區受創嚴重。"],e:{happy:-2},f:"2009 年莫拉克颱風重創南台灣，小林村幾乎全村被掩埋。",
  local:{c:["高雄市","屏東縣","台東縣","台南市","嘉義縣"],p:.3,v:["莫拉克颱風帶來的大水淹進家裡，家具全泡壞了。","八八風災後，回老家的路斷了好幾個月。"],e:{happy:-8,money:-.3}}},
 {y:2014,a:15,p:.75,v:["太陽花學運，學生占領立法院，大家都在討論服貿。","太陽花學運期間，家裡吃飯時常為了服貿吵起來。"],e:{},
  odd:{p:.12,v:["太陽花學運那幾週，你每天下班都去立法院外面坐一下。"],e:{rel:2}}},
 {y:2016,a:20,p:.5,v:["台灣選出第一位女性總統。"],e:{}},
 {y:2019,a:18,p:.6,v:["同性婚姻合法化，台灣成為亞洲第一個這麼做的國家。","新聞說同婚通過了，有朋友第二天就去登記。"],e:{happy:1},f:"2019 年 5 月 24 日起同性伴侶可以登記結婚。"},
 {y:2020,a:0,p:.95,v:["COVID-19 疫情爆發，口罩要排隊用健保卡買。","疫情來了，出國的計畫全部取消。","疫情期間，每天下午兩點都在看記者會。"],e:{happy:-3}},
 {y:2021,a:0,p:.9,v:["疫情升到三級警戒，學校停課、餐廳禁止內用。","三級警戒期間，整整兩個月都待在家裡。"],e:{happy:-5},f:"2021 年 5 月全台進入三級警戒，持續約兩個月。",
  odd:{p:.08,v:["你確診了 COVID-19，在防疫旅館隔離了十幾天。"],e:{health:-6,happy:-4}}},
 {y:2024,a:0,p:.85,v:["花蓮外海發生大地震，全台都感受到強烈搖晃。","0403 地震時，捷運和高鐵都停了下來。"],e:{happy:-2},f:"2024 年 4 月 3 日花蓮發生規模 7.2 的地震。",
  local:{c:["花蓮縣"],p:.35,v:["0403 地震讓家附近的大樓傾斜，好幾天都不敢回家。"],e:{happy:-10,money:-.3}}},
];
// 套用一件大事的效果
function twApply(L,e){L.happy+=e.happy||0;L.health+=e.health||0;L.rel+=e.rel||0;if(e.inc)L.inc*=e.inc;if(e.money){const m=L.c.gdp*-e.money;L.money-=m;ledger(L,"災害損失",-m)}}
function twHistory(L,yr){
 for(const h of TW_HISTORY){const key=h.y+h.v[0];if(h.y!==yr||L.age<h.a||L.twSeen[key])continue;L.twSeen[key]=1;
  if(h.e.edu&&L.age<=15&&L.edu>=1&&L.edu<2)L.twFreeJunior=true;
  const lo=h.local&&h.local.c.includes(L.c.tw.county)&&R()<h.local.p,od=h.odd&&R()<h.odd.p;
  if(lo){say(L,pick(h.local.v),h.f);twApply(L,h.local.e)}
  else if(R()<h.p){say(L,pick(h.v),h.f);twApply(L,h.e)}
  else twApply(L,{inc:h.e.inc}); // 沒注意到，經濟影響還是會在
  if(od){say(L,pick(h.odd.v));twApply(L,h.odd.e)}
 }
}

// 台灣模式的地區統計面板
function twPanel(L){
 const c=L.c,t=c.tw,rows=[["出生縣市",t.county],["出生年份",c.y0+" 年"],["平均壽命 女／男",`${Math.round(c.fEx)}／${Math.round(c.mEx)} 歲`],["嬰兒死亡率",`每千人 ${Math.round(c.im)} 人`],
  ["大學就學率",`${Math.round(c.uni)}%`],["總生育率",t.tfr.toFixed(2)],["人均所得（PPP，依縣市調整）",`US$${Math.round(c.gdp).toLocaleString()}`],["都市化程度",`${Math.round(t.urb*100)}%`]];
 return rows.map(r=>`<div class="row"><span class="mut">${r[0]}</span><span>${r[1]}</span></div>`).join("")+`<div class="mut" style="margin-top:6px">資料：內政部、主計總處、衛福部公開統計的概略值；早期年份為估計</div>`;
}
// 台灣出生：縣市依人口抽選
function twLife(year){
 const county=wpick(TW_COUNTY,x=>x[1]),c=twWorld(year,county),sex=R()<.51?"男":"女",cls=Math.floor(R()*5);
 const L={c,raw:"台灣",sex,name:pick(NAMES["華"][sex]),age:0,cls,know:45+R()*10+cls*2,rel:55+R()*10,hist:[],inc:c.gdp*Math.exp((cls-2)*c.gini*1.4),health:70+R()*20+cls*2,happy:60,edu:0,
  money:0,partner:null,partnerYears:0,widowed:false,kids:0,grand:0,job:null,jobYears:0,smoke:false,abroad:null,alive:true,events:[],notes:[],ex:sex=="男"?c.mEx:c.fEx,cause:null};
 {L.bias={health:(R()-.5)*12,know:(R()-.5)*10,rel:(R()-.5)*10,happy:(R()-.5)*10};const b=statBase(L);for(const k in b)L[k]=b[k]+L.bias[k]}L.hist[0]=L.happy;makeFamily(L);L.fam.urban=R()<county[3];return L;
}

// 台灣才有的人生抉擇與事件（每年檢查）
async function twYear(L,f){
 const c=L.c,yr=c.y0+L.age,t=c.tw;if(!t)return;
 const r=twAt(Math.min(yr,2025)),county=TW_COUNTY.find(x=>x[0]==t.county),g=r[3]*county[2];
 if(c.gdp>0){L.inc*=g/c.gdp;L.money*=1}c.gdp=g;c.uni=r[5];c.im=r[4];t.tfr=r[6];
 L.twSeen=L.twSeen||{};
 twHistory(L,yr);

 // 升學：國中（1968 前要考初中）、高中聯考／會考、大學聯考／學測
 if(L.age==12&&L.edu>=1&&yr<1968&&!L.twFreeJunior){if(R()<.5+L.cls*.08+L.know/400){L.edu=2;say(L,"考上了初中。")}else say(L,"沒考上初中，小學畢業就去工作了。","1968 年以前，小學畢業要考試才能升初中。")}
 if(L.age==15&&L.edu>=2)await ask(L,yr<2014?"國中畢業，要考高中聯考了":"國中畢業，要參加會考了",[
   ["每天補習到晚上",()=>{L.know+=6;L.happy-=4;L.money-=c.gdp*.05;ledger(L,"補習費",-c.gdp*.05)},"知識↑ 幸福↓ · 補習費"],
   ["照自己的步調讀",()=>{L.know+=2}],
   ["讀高職，早點學技術",()=>{L.twVoc=true;L.know+=1;say(L,"選擇讀高職。")},"畢業後比較快就業"]],
  yr<1990?"那個年代補習班林立，升學競爭非常激烈。":"");
 if(L.age==18&&L.edu==2&&!L.twCollegeAsked){L.twCollegeAsked=true;
  const rate=c.uni,name=yr<2002?"大學聯考":"學測";
  await ask(L,`要考${name}嗎？`,[
   ["拚一下",()=>{if(R()<rate/100+L.know/250+(f=="學業"?.1:0)-.1){L.edu=3;L.know+=8;say(L,yr<1990?"考上大學了！家裡放鞭炮慶祝。":"考上大學了。");if(L.cls<=2){L.money-=c.gdp*.25;ledger(L,"就學貸款",-c.gdp*.25);say(L,"申請了就學貸款。")}}else say(L,"沒考上大學。")},"知識↑ · 家境普通要背就貸"],
   ["重考一年",()=>{L.know+=5;L.happy-=5;L.twRetake=true;say(L,"決定重考，在補習班度過了一整年。")},"多一年，機會更大"],
   ["直接工作",()=>{}]],`這一年台灣的大學就學率大約 ${Math.round(rate)}%。`)}
 if(L.twRetake&&L.age==19&&L.edu==2){L.twRetake=false;if(R()<c.uni/100+L.know/200){L.edu=3;say(L,"重考後考上了大學。")}else say(L,"重考還是沒考上。")}

 // 兵役：男生 18～22 歲
 if(L.sex=="男"&&!L.twArmy&&L.age==(L.edu==3?22:19)){L.twArmy=true;
  const len=yr<1990?"兩到三年":yr<2008?"將近兩年":yr<2018?"一年":yr<2024?"四個月":"一年";
  say(L,`入伍當兵，役期${len}。`,yr>=2024?"2024 年起義務役恢復為一年。":"台灣的役期隨年代逐步縮短。");L.rel+=2;
  if(R()<.3)say(L,pick(["在部隊交到一輩子的好兄弟。","抽到外島，放假都要搭船回家。","退伍那天，跟同梯拍了好多照片。"]))}

 // 北漂：住在中南部或東部、年輕時
 if(!L.moved&&!L.abroad&&L.age>=20&&L.age<=32&&!["台北市","新北市"].includes(t.county)&&R()<.06)
  await ask(L,"要不要北上工作？",[["北漂打拚",()=>{L.moved=true;L.inc*=1.25;L.happy-=3;say(L,"一個人到台北租了間小套房。")},"收入↑ 但房租貴、離家遠"],["留在家鄉",()=>{L.happy+=2;L.rel+=1}]]);

 // 22K 年代
 if(yr>=2009&&yr<=2014&&L.age>=22&&L.age<=26&&L.edu==3&&!L.tw22k&&L.job){L.tw22k=true;say(L,"第一份工作的起薪只有兩萬出頭，朋友們都在抱怨低薪。","2009 年起「22K」成為大學畢業生低起薪的代名詞。")}

 // 西進與打工度假
 if(!L.abroad&&yr>=1992&&yr<=2015&&L.age>=28&&L.age<=45&&L.job&&R()<.025)
  await ask(L,"公司想派你去中國大陸的工廠當幹部",[["去",()=>{L.abroad="中國大陸";L.inc*=1.6;L.rel-=3;say(L,"成了台商幹部，一年只回台灣幾次。")},"收入↑ 家人聚少離多"],["不去",()=>{}]]);
 if(!L.abroad&&yr>=2004&&L.age>=20&&L.age<=30&&R()<.03)
  await ask(L,"朋友找你一起去澳洲打工度假",[["去一年",()=>{L.money+=c.gdp*.15;L.happy+=5;L.know+=2;say(L,"在澳洲的農場摘了一年水果，曬得很黑。")},"幸福↑ 存點錢 · 中斷職涯"],["不去",()=>{}]],"台灣與澳洲自 2004 年起有打工度假協議。");

 // 買房：房價和所得的比例越來越高
 if(!L.house&&L.age>=28&&L.age<=50&&L.job&&R()<.05){
  const ratio=yr<1990?6:yr<2005?8:yr<2015?12:15,price=L.inc*ratio,down=price*.2;
  await ask(L,`看上一間房子，總價約 ${money(price)}`,[
   ["付頭期款買下",()=>{L.house=true;L.money-=down;ledger(L,"買房頭期款",-down);L.happy+=6;say(L,"簽約買下了房子，背了三十年的房貸。")},"有自己的家 · 背房貸",down],
   ["跟家人借錢買",()=>{L.house=true;L.money-=down*.4;L.rel-=2;say(L,"跟家人借了頭期款，買下房子。")},"人際↓"],
   ["繼續租房",()=>{}]],`這時候的房價大約是年收入的 ${ratio} 倍。`)}

 // 生不生小孩（少子化）
 if(L.partner&&L.kids==0&&L.age>=27&&L.age<=40&&!L.twKidAsked&&R()<.2){L.twKidAsked=true;
  await ask(L,"你們討論要不要生小孩",[["生",()=>{L.kids++;L.happy+=4;say(L,"孩子出生了。")},"幸福↑ 開銷↑"],["再等等",()=>{L.twKidAsked=false}],["決定不生",()=>{L.twNoKid=true},"以後不會再問"]],
   `這一年台灣的總生育率約 ${t.tfr.toFixed(2)}，${t.tfr<1.2?"是全世界最低的地方之一":"一對夫妻平均生 "+t.tfr.toFixed(1)+" 個孩子"}。`)}

 // 新住民
 if(!L.partner&&L.sex=="男"&&yr>=1990&&yr<=2010&&L.age>=30&&L.age<=45&&R()<.03)
  await ask(L,"親戚介紹你認識一位來自越南的女生",[["交往看看",()=>{L.partner=true;L.partnerName=pick(["阮氏玲","黎氏芳","陳氏秋"]);L.happy+=6;say(L,`和${L.partnerName}結婚，她努力學中文，很快就適應了台灣的生活。`)},"人際↑"],["不了",()=>{}]],"1990 至 2000 年代，台灣有大量來自東南亞的新住民。");

 // 長照：父母老了
 if(L.parentAlive&&L.age>=45&&L.age<=65&&!L.twCare&&R()<.06){L.twCare=true;
  await ask(L,"爸媽年紀大了，需要有人照顧",[["請外籍看護",()=>{const cost=c.gdp*.25;L.money-=cost;ledger(L,"外籍看護",-cost);say(L,"請了一位印尼看護照顧爸媽。")},"每年一筆開銷"],["自己辭職照顧",()=>{L.job=null;L.caregiver=true;L.happy-=6;L.rel+=4;say(L,"辭掉工作，搬回家照顧爸媽。");sayHi(L,"曾辭職回家照顧年邁的父母。")},"沒收入 · 人際↑"],
   ["送去安養機構",()=>{const cost=c.gdp*.35;L.money-=cost;ledger(L,"安養機構",-cost);L.happy-=2},"開銷較大"]],"台灣在 2025 年進入超高齡社會，65 歲以上人口超過兩成。")}
}
