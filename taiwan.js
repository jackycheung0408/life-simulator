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

// 台灣大事：[年, 起始年齡下限, 說明, 效果, 統計小字]
const TW_HISTORY=[
 [1959,0,"八七水災，中南部大淹水，家裡的田泡在水裡好幾天。",{happy:-6},"1959 年 8 月 7 日的豪雨造成中南部嚴重水災。"],
 [1968,6,"九年國民義務教育開始實施，國中不用再考試就能讀。",{edu:true},"台灣自 1968 年起實施九年國民義務教育。"],
 [1971,10,"新聞說台灣退出了聯合國，大人們的臉色都很沉重。",{happy:-2}],
 [1974,15,"十大建設陸續動工，到處都在蓋高速公路、港口和工廠。",{inc:1.08},"十大建設於 1970 年代推動，包括中山高速公路、桃園機場等。"],
 [1979,10,"美國和台灣斷交了，電視上一直播放相關新聞。",{happy:-3}],
 [1987,10,"政府宣布解除戒嚴，街頭的氣氛不一樣了。",{happy:4},"台灣於 1987 年 7 月 15 日解除長達 38 年的戒嚴。"],
 [1988,10,"報禁解除，路邊的報紙一下子多了好多種。",{}],
 [1990,15,"一群大學生在中正紀念堂廣場靜坐，要求政治改革。",{}],
 [1995,0,"全民健康保險開辦，看病只要帶一張健保卡。",{health:3},"全民健保於 1995 年 3 月 1 日開辦。"],
 [1996,20,"第一次總統直選，你排隊投下了一票。",{happy:3},"1996 年台灣舉行首次總統直接民選。"],
 [1999,0,"921 大地震，半夜被搖醒，全家跑到外面不敢進屋。",{happy:-8,health:-2},"1999 年 9 月 21 日的集集大地震造成逾兩千人罹難。"],
 [2000,20,"第一次政黨輪替。",{}],
 [2001,20,"開始全面週休二日，週末終於可以好好休息。",{happy:3}],
 [2003,0,"SARS 疫情爆發，出門都要戴口罩、量體溫。",{happy:-5},"2003 年 SARS 疫情期間，台灣累計數百例病例。"],
 [2008,20,"全球金融海嘯，公司開始放無薪假。",{inc:.95,happy:-5}],
 [2009,0,"八八風災，莫拉克颱風帶來破紀錄的雨量，南部山區受創嚴重。",{happy:-6},"2009 年莫拉克颱風重創南台灣，小林村幾乎全村被掩埋。"],
 [2014,15,"太陽花學運，學生占領立法院，大家都在討論服貿。",{}],
 [2016,20,"台灣選出第一位女性總統。",{}],
 [2019,18,"同性婚姻合法化，台灣成為亞洲第一個這麼做的國家。",{happy:1},"2019 年 5 月 24 日起同性伴侶可以登記結婚。"],
 [2020,0,"COVID-19 疫情爆發，口罩要排隊用健保卡買。",{happy:-4}],
 [2021,0,"疫情升到三級警戒，學校停課、餐廳禁止內用。",{happy:-6},"2021 年 5 月全台進入三級警戒，持續約兩個月。"],
 [2024,0,"花蓮外海發生大地震，全台都感受到強烈搖晃。",{happy:-3},"2024 年 4 月 3 日花蓮發生規模 7.2 的地震。"],
];

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
 L.hist[0]=L.happy;makeFamily(L);L.fam.urban=R()<county[3];return L;
}

// 台灣才有的人生抉擇與事件（每年檢查）
async function twYear(L,f){
 const c=L.c,yr=c.y0+L.age,t=c.tw;if(!t)return;
 L.twSeen=L.twSeen||{};
 for(const h of TW_HISTORY){if(h[0]!==yr||L.age<h[1]||L.twSeen[h[0]+h[2]])continue;L.twSeen[h[0]+h[2]]=1;
  const e=h[3];say(L,h[2],h[4]);L.happy+=e.happy||0;L.health+=e.health||0;if(e.inc)L.inc*=e.inc;if(e.edu&&L.age<=15&&L.edu>=1&&L.edu<2)L.twFreeJunior=true}

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
   ["拚一下",()=>{if(R()<rate/100+L.know/250+(f=="學業"?.1:0)-.1){L.edu=3;L.know+=8;say(L,yr<1990?"考上大學了！家裡放鞭炮慶祝。":"考上大學了。");if(L.cls<=2){L.money-=c.gdp*.4;ledger(L,"就學貸款",-c.gdp*.4);say(L,"申請了就學貸款。")}}else say(L,"沒考上大學。")},"知識↑ · 家境普通要背就貸"],
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
