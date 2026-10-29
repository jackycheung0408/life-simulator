// 擬真細節：稅與勞健保、通膨、房貸租屋、保險意外、感情、孩子、健康老化、朋友圈
// 依賴：say、ask、pick、R、money、moneyShort、ledger、REGION、NAMES、P

// ── 稅與勞健保：薪水先扣稅與社會保險，退休後領年金 ──
function taxRate(L){
 const c=L.c,g=c.gdp,inc=L.inc||0;
// 自營、非正式工作（攤販、農漁民等）在中低所得國家多半不用繳所得稅與社會保險
 if(informal(L))return .01;
 if(c.tw)return .05+(inc>g*1.5?.07:inc>g*.8?.03:0);                    // 綜所稅級距概估
 return g>40000?.18+(inc>g*1.5?.1:0):g>15000?.1:g>5000?.05:.02;
}
function informal(L){return !L.c.tw&&L.c.gdp<20000&&["農民","攤販","漁夫","清潔工","小店老闆","建築工人"].includes(L.job)}
function socialRate(L){const g=L.c.gdp;if(informal(L))return 0;return L.c.tw?.035:g>40000?.08:g>15000?.05:g>5000?.02:0} // 勞保＋健保自付
function netPay(L){return L.inc*(1-taxRate(L)-socialRate(L))}
function pension(L){
 const g=L.c.gdp,last=L.lastInc||g*.4,yrs=L.workYears||0;
 if(L.c.tw)return Math.min(last,g*.5)*.0155*Math.min(yrs,45);           // 勞保年金：投保薪資有上限，每年資 1.55%
 return g>15000?Math.min(last,g*.8)*Math.min(.5,yrs*.012):g*.06;
}

// ── 通膨：現金每年被物價吃掉一點；台灣每隔幾年報一次便當價格 ──
function inflation(L){const g=L.c.gdp;return L.c.tw?.015:g>40000?.02:g>10000?.04:.07}
const BENTO=[[1960,5],[1970,10],[1980,35],[1990,50],[2000,60],[2010,75],[2020,100],[2030,130],[2060,250]];
function bento(y){for(let i=1;i<BENTO.length;i++)if(y<=BENTO[i][0]){const [y0,p0]=BENTO[i-1],[y1,p1]=BENTO[i];return Math.round(p0+(p1-p0)*(y-y0)/(y1-y0))}return 250}
function inflationYear(L){
 if(L.money>0){const lost=L.money*inflation(L);L.money-=lost;ledger(L,"通膨",-lost)}
 if(L===P&&L.c.tw&&L.age>=10&&L.age%12==0)say(L,`現在一個排骨便當要 ${bento(L.c.y0+L.age)} 元。`);
}

// ── 房貸與租屋 ──
function housePrice(L){return L.c.gdp*(L.c.tw?(L.c.tw.county=="台北市"?16:L.c.tw.county=="新北市"?12:8):L.c.gdp>40000?7:5)}
function mortgageYear(L){
 if(L.house&&!L.mort){const price=housePrice(L),loan=price*.8;L.mort={left:loan,rate:L.c.tw?.02:.04,years:30};
  if(L===P)say(L,`房貸 ${moneyShort(loan)}，分 30 年還，利率 ${(L.mort.rate*100).toFixed(1)}%。`)}
 if(L.mort&&L.mort.left>0){
  if(R()<.12){const d=(R()<.5?1:-1)*.005;L.mort.rate=Math.max(.01,L.mort.rate+d);if(L===P)say(L,d>0?`央行升息，房貸利率漲到 ${(L.mort.rate*100).toFixed(2)}%，每個月要多繳一些。`:`利率調降到 ${(L.mort.rate*100).toFixed(2)}%，房貸壓力小了一點。`)}
  const r=L.mort.rate,n=Math.max(1,L.mort.years),pay=L.mort.left*r/(1-Math.pow(1+r,-n));
  L.mort.left=Math.max(0,L.mort.left*(1+r)-pay);L.mort.years--;L.mortPay=pay;
  if(L.mort.left<1){L.mortPay=0;if(L===P)say(L,"房貸終於繳清了！房子完全是自己的。")}
 }else L.mortPay=0;
}
async function rentYear(L){
 if(L.house||!(L.moved||L.abroad)||L.age<20)return;
 if(R()<.12)await ask(L,"房東說租約到期後要收回房子",[
  ["搬到通勤比較遠、但便宜的地方",()=>{L.rentAdj=-.02;L.health-=1;L.happy-=1},"房租↓ 通勤累"],
  ["附近找一間，租金貴一點",()=>{L.rentAdj=.02},"房租↑"],
  ["和朋友合租",()=>{L.rentAdj=-.04;L.rel+=2},"房租↓↓ 人際↑"],
  ["搬回老家住",()=>{L.moved=false;L.abroad=L.abroad&&null;L.rel+=1;L.happy-=1},"幾乎不用房租"]]);
}

// ── 保險與意外 ──
async function insuranceYear(L){
 if(!L.insAsked&&L.job&&L.age>=25&&L.age<=40&&R()<.25){L.insAsked=true;const g=L.c.gdp;
  await ask(L,"業務員朋友推薦你買保險",[
   ["醫療險＋意外險",()=>{L.ins={med:1,acc:1,prem:g*.03}},"每年保費 · 看病和意外有理賠"],
   ["只買意外險",()=>{L.ins={acc:1,prem:g*.008}},"保費便宜"],
   ["醫療、壽險全包",()=>{L.ins={med:1,acc:1,life:1,prem:g*.07}},"保費貴 · 保障最完整"],
   ["不買，靠自己存",()=>{L.ins=null},"省保費 · 出事要自己扛"]],"台灣有健保，但住院、手術還是有不少自費")}
 if(L.ins){L.money-=L.ins.prem;ledger(L,"保費",-L.ins.prem)}
 // 意外：車禍、跌倒
 if(L.age>=16&&R()<.025){const g=L.c.gdp,cost=g*(R()<.7?.05:.3),what=pick(["騎車被汽車擦撞，摔斷了手","下樓梯踩空，腳踝骨折","工作時受傷，住院一週"]);
  L.health-=8;L.happy-=3;
  if(L.ins&&L.ins.acc){L.money-=cost*.1;say(L,`${what}。還好有意外險，理賠了大部分醫藥費。`)}
  else{L.money-=cost;ledger(L,"意外醫藥費",-cost);say(L,`${what}，醫藥費花了 ${money(cost)}。`)}}
}

// ── 感情的起伏：伴侶有工作和收入，婚姻有吵架、外遇、離婚 ──
function partnerSetup(L){
 if(L.partner&&L.pInc==null){const g=L.c.gdp,works=R()<(L.c.tw||g>15000?.8:.5);L.pInc=works?g*.45*(.7+R()*.8):0;
  if(L===P&&!works)say(L,`${L.partnerName||"伴侶"}沒有在外面工作，家裡靠你一個人的收入。`)}
 if(!L.partner)L.pInc=null;
}
async function loveYear(L){
 partnerSetup(L);if(!L.partner)return;const nm=L.partnerName||"伴侶";
 if(R()<.07)await ask(L,`和${nm}為了${pick(["家事分配","錢怎麼花","要不要跟長輩住","工作太忙"])}大吵一架`,[
  ["先道歉，好好談",()=>{L.rel+=2;L.happy+=1},"感情↑"],["冷戰幾天",()=>{L.happy-=3;L.loveDmg=(L.loveDmg||0)+1},"感情↓"],
  ["找朋友訴苦",()=>{L.rel+=1;L.happy-=1},""],["一起去做伴侶諮商",()=>{L.money-=L.c.gdp*.02;L.happy+=2;L.loveDmg=0},"花錢 · 感情修復"]]);
 if(L.age>=30&&L.age<=60&&R()<.012)await ask(L,`發現${nm}和別人有曖昧`,[
  ["原諒，重新開始",()=>{L.happy-=8;L.loveDmg=(L.loveDmg||0)+1},"幸福↓"],["分居一段時間冷靜",()=>{L.happy-=6;L.loveDmg=(L.loveDmg||0)+2},""],
  ["離婚",()=>{divorce(L,"因為外遇離婚了。")},"財產對分"]]);
 if((L.loveDmg||0)>=3&&R()<.25)await ask(L,`和${nm}的關係越來越冷淡`,[
  ["試著挽回",()=>{L.loveDmg=1;L.happy+=1},""],["和平分開",()=>divorce(L,"和平離婚，偶爾還會聊聊孩子的事。"),"財產對分"],["為了孩子先維持",()=>{L.happy-=3},"幸福↓"]]);
}
function divorce(L,t){const half=Math.max(0,L.money)/2;L.money-=half;ledger(L,"離婚財產分配",-half);L.partner=false;L.divorced=true;L.loveDmg=0;L.happy-=10;L.wedDone=false;say(L,t)}

// ── 孩子的成長抉擇 ──
async function kidChoices(L){
 if(!L.kidList)return;const g=L.c.gdp;
 for(const k of L.kidList){const a=L.age-k.born;k.done=k.done||{};
  if(a==6&&!k.done.school){k.done.school=1;await ask(L,`${k.name}要上小學了`,[
   ["讀住家附近的公立學校",()=>{},"免學費"],["讀私立學校",()=>{L.money-=g*.15;k.edge=(k.edge||0)+1},"每年學費高"],
   ["上公立，但加報才藝班",()=>{L.money-=g*.04;k.edge=(k.edge||0)+.5;L.happy+=1},"學鋼琴、畫畫或游泳"]])}
  if(a==13&&!k.done.cram){k.done.cram=1;await ask(L,`${k.name}上國中了，同學都在補習`,[
   ["每天補習",()=>{L.money-=g*.06;k.edge=(k.edge||0)+1;L.rel-=1},"開銷↑ 成績↑ 親子時間少"],["只補弱科",()=>{L.money-=g*.02;k.edge=(k.edge||0)+.5},"適中"],
   ["讓他自己讀",()=>{L.rel+=1},"省錢 · 親子關係好"]])}
  if(a==15&&!k.done.teen&&R()<.6){k.done.teen=1;await ask(L,`${k.name}進入叛逆期，常常晚歸、頂嘴`,[
   ["嚴格管教",()=>{L.happy-=2;if(R()<.4)say(L,`${k.name}和你冷戰了好幾個月。`)},""],["找時間好好聊",()=>{L.rel+=2;L.happy+=1},"人際↑"],
   ["給他空間",()=>{if(R()<.3){L.happy-=3;say(L,`${k.name}的成績一落千丈。`)}},"有風險"]])}
  if(a==18&&!k.done.uni){k.done.uni=1;const ok=R()<.45+(k.edge||0)*.15;
   say(L,ok?`${k.name}考上了理想的大學！`:`${k.name}沒考上理想的學校。`);
   await ask(L,ok?`${k.name}考上大學，學費怎麼辦？`:`${k.name}接下來怎麼走？`,ok?[
    ["你全額負擔",()=>{L.money-=g*.25;L.happy+=3},"花一筆大錢"],["讓他申請學貸",()=>{L.happy+=1},"孩子畢業後自己還"],["送他出國讀",()=>{L.money-=g*1.2;L.happy+=4},"花費很高",g*1.2]]:[
    ["重考一年",()=>{L.money-=g*.06},"補習費"],["去讀技職學校",()=>{},"學一技之長"],["先工作再說",()=>{L.happy-=1},""]])}
 }
}

// ── 健康與老化細節 ──
async function healthYear(L){
 const g=L.c.gdp;
 // 慢性病：40 歲後可能出現，之後每年要吃藥回診
 if(!L.chronic&&L.age>=40&&R()<.03+(L.smoke?.02:0)+(L.health<50?.03:0)){L.chronic=pick(["高血壓","糖尿病","高血脂"]);
  await ask(L,`健檢發現有${L.chronic}`,[["乖乖吃藥、定期回診",()=>{L.chronicCare=1},"每年醫藥費"],["改變飲食、開始運動",()=>{L.chronicCare=1;L.health+=3;L.happy-=1},"健康↑"],["覺得沒什麼，先不管",()=>{L.chronicCare=0},"有風險"]])}
 if(L.chronic){if(L.chronicCare){const m=g*(L.c.tw?.005:.02);L.money-=m;ledger(L,"慢性病藥費",-m)}else if(R()<.15){L.health-=6;if(L===P)say(L,`沒控制好的${L.chronic}讓身體越來越差。`)}}
 // 工作壓力與失眠
 if(L.job&&L.focus=="工作"&&L.health<65&&!L.burnSeen&&R()<.15){L.burnSeen=true;await ask(L,"連續好幾個月失眠，上班時常心悸",[
  ["請假休息一個月",()=>{L.money-=L.inc/12;L.health+=6;L.happy+=3},"少一個月薪水"],["去看身心科",()=>{L.money-=g*.01;L.health+=3;L.happy+=4},""],["咬牙撐下去",()=>{L.health-=6;L.happy-=4},"健康↓↓"]])}
 // 失智：75 歲後
 if(!L.dementia&&L.age>=75&&R()<.02*(1+(L.age-75)/10)*(L.know>70?.7:1)){L.dementia=true;L.know-=15;L.happy-=5;say(L,"開始常常忘記事情，醫生說是輕度失智。")}
}

// ── 朋友圈：有名字的朋友，會疏遠、重逢、介紹工作 ──
function friendsSetup(L){
 if(L.pals||L.age<8)return;const reg=REGION(L.raw||"台灣"),pool=[...(NAMES[reg]||NAMES["華"]).男,...(NAMES[reg]||NAMES["華"]).女].filter(n=>n!==L.name&&n!==L.partnerName);
 L.pals=[0,1,2].map(()=>({name:pick(pool),close:60+R()*30,from:L.age}));
 if(L===P)say(L,`在學校交到好朋友：${L.pals.map(f=>f.name).join("、")}。`);
}
async function friendsYear(L){
 friendsSetup(L);if(!L.pals)return;
 for(const f of L.pals){if(f.gone)continue;f.close-=L.focus=="家人"||L.focus=="愛情"?1:2.5;if(L.age>70&&R()<.03){f.gone=1;L.happy-=6;if(L===P)say(L,`老朋友${f.name}過世了，你去送了最後一程。`)}}
 const live=L.pals.filter(f=>!f.gone);if(!live.length)return;const f=pick(live);
 if(f.close<35&&!f.faded&&R()<.3){f.faded=1;if(L===P)say(L,`和${f.name}越來越少聯絡，上次見面已經是好幾年前。`)}
 else if(f.faded&&R()<.05){f.faded=0;f.close=60;L.happy+=4;if(L===P)say(L,`在路上巧遇多年不見的${f.name}，約了吃飯聊到很晚。`)}
 else if(L.age>=24&&L.age<=40&&!f.wed&&R()<.08){f.wed=1;await ask(L,`${f.name}要結婚了，邀請你參加婚禮`,[
  ["包大紅包出席",()=>{L.money-=L.c.gdp*.01;f.close+=10;L.rel+=2},"感情↑"],["包一般的紅包出席",()=>{L.money-=L.c.gdp*.005;f.close+=5},""],["人不到，禮到",()=>{L.money-=L.c.gdp*.004;f.close-=3},""]])}
 else if(L.job&&f.close>55&&L.age>=25&&L.age<=50&&!L.referSeen&&R()<.05){L.referSeen=true;await ask(L,`${f.name}說他公司缺人，問你要不要過去`,[
  ["跳過去",()=>{L.inc*=1.12;L.rel+=1;say(L,`靠${f.name}的介紹換了工作，薪水多了一成多。`)},"收入↑"],["謝謝他，但留在原公司",()=>{},""],["介紹別的朋友過去",()=>{L.rel+=3},"人際↑"]])}
}

// 債務太重：可以協商、求助或聲請更生
async function debtRelief(L){
 const base=Math.max(L.inc||0,L.c.gdp*.3);if(L.money>-base*2.5||L.debtHelped)return;L.debtHelped=true;
 await ask(L,`欠了 ${money(-L.money)}，利息越滾越多`,[
  ["和銀行協商分期、降息",()=>{L.money*=.85;L.happy-=2;say(L,"和銀行談成分期，利息降低了一些。")},"債務減少一點"],
  ["向家人求助",()=>{const h=Math.min(-L.money*.5,L.c.gdp*(L.cls+1)*.3);L.money+=h;L.rel-=2;say(L,`家人湊了 ${money(h)} 幫你還債。`)},"人際↓"],
  ["聲請更生（法院協助減債）",()=>{L.money*=.3;L.happy-=6;L.rel-=1;say(L,"聲請更生，之後幾年生活被嚴格限制。")},"債務大減 · 信用受損"],
  ["多兼一份工還債",()=>{L.inc*=1.15;L.health-=5;say(L,"白天上班，晚上再兼一份差。")},"收入↑ 健康↓"]]);
}

// 每年依序執行（在 storyYear 裡呼叫）
async function realismYear(L){
 if(L.job){L.lastInc=L.inc;L.workYears=(L.workYears||0)+1}
 inflationYear(L);mortgageYear(L);partnerSetup(L);trackLife(L);
 await rentYear(L);await insuranceYear(L);await loveYear(L);await kidChoices(L);await healthYear(L);await friendsYear(L);await mishapYear(L);await debtRelief(L);
 if(L.money>-(L.inc||L.c.gdp*.3))L.debtHelped=false;
}

// ── 自己決定花錢：沒工作前花爸媽的零用錢，有收入後花自己的存款 ──
// [名稱, 最小年齡, 最大年齡, 花費(人均GDP倍數), 效果, 一年最多幾次]
const SHOP=[
 ["零食飲料",4,17,.001,{happy:1},3],["玩具",4,11,.004,{happy:3},1],["漫畫書",8,17,.002,{happy:1,know:1},2],["電動遊戲",8,25,.006,{happy:3,health:-1},1],
 ["新衣服",12,90,.008,{happy:2,rel:1},2],["智慧型手機",13,90,.03,{happy:3,rel:1},1],["演唱會",15,50,.006,{happy:4,rel:1},1],["和朋友聚餐",15,90,.003,{rel:2,happy:1},3],
 ["一趟國內旅行",18,85,.02,{happy:4,health:1},1],["出國旅行",20,80,.08,{happy:7,know:1},1],["健身房年費",18,70,.015,{health:4},1],["才藝或語言課",8,70,.02,{know:4},1],
 ["高級餐廳",20,90,.01,{happy:3},2],["請爸媽吃飯",18,70,.005,{rel:3,happy:1},2],["捐款給公益團體",20,90,.01,{happy:2,rel:1},1],["按摩紓壓",25,90,.004,{health:1,happy:2},2],
];
function allowance(L){return L.c.gdp*(.01+L.cls*.008)*(L.age<12?.5:1)} // 一年的零用錢額度，看家境
function shopWallet(L){return !L.job&&L.age<22?"parents":"self"}
function renderShop(){
 const el=$("shop");if(!el||!P)return;const L=P,mode=shopWallet(L),y=L.age;
 if(L.shopYear!==y){L.shopYear=y;L.shopCnt={};L.pocket=allowance(L)}
 const left=mode=="parents"?L.pocket:L.money,items=SHOP.filter(s=>y>=s[1]&&y<=s[2]);
 el.innerHTML=`<p style="margin:10px 0 4px"><b>花錢</b> <span class="mut">${mode=="parents"?`還沒工作，花的是爸媽給的零用錢：今年剩 ${money(Math.max(0,left))}`:`花自己的存款：${money(left)}`}</span></p>`+
  items.map((s,i)=>{const cost=s[3]*L.c.gdp,used=(L.shopCnt[s[0]]||0)>=s[5],poor=cost>left&&mode=="parents";
   return `<button class="buy" data-n="${s[0]}" ${used||poor?"disabled":""}>${s[0]}<small>${money(cost)}${used?" · 今年買過了":""}</small></button>`}).join("");
 el.querySelectorAll(".buy").forEach(b=>b.onclick=()=>buyItem(b.dataset.n));
}
function buyItem(n){
 const L=P,s=SHOP.find(x=>x[0]==n),cost=s[3]*L.c.gdp,before=snap(L),mode=shopWallet(L);
 if(mode=="parents"){L.pocket-=cost;if(L.pocket<allowance(L)*.2&&R()<.3){L.rel-=1;say(L,"一直跟爸媽要錢，被念了一頓。")}}
 else{L.money-=cost;ledger(L,"自己花的",-cost)}
 for(const k in s[4])L[k]+=s[4][k];L.shopCnt[n]=(L.shopCnt[n]||0)+1;
 say(L,`${mode=="parents"?"用零用錢":"花錢"}買了${n}。`);const d=diffText(before,snap(L));toast(`${n}：${d||"已購買"}`);render();renderShop();
}

// ── 意外與突發開銷：人生不會一路順遂，每年約三到四成機率遇到一件 ──
// [最小年齡, 最大年齡, 條件, 事件]
const MISHAPS=[
 [18,90,L=>true,async L=>{const c=L.c.gdp*.04;await ask(L,"接到自稱銀行客服的電話，說你的帳戶被盜用",[["照指示去 ATM 操作",()=>{L.money-=c*3;L.happy-=6;say(L,`被詐騙集團騙走 ${money(c*3)}。`)},"可能是詐騙"],["掛掉，打 165 反詐騙專線查證",()=>{L.know+=1},"安全"],["先打給家人商量",()=>{L.rel+=1},"安全"]])}],
 [20,85,L=>L.car||L.age<60,async L=>{const c=L.c.gdp*(L.car?.04:.015);L.money-=c;ledger(L,"交通工具維修",-c);say(L,`${L.car?"車子":"機車"}突然故障，修理花了 ${money(c)}。`)}],
 [18,90,L=>true,async L=>{const c=L.c.gdp*.012;L.money-=c;L.happy-=2;say(L,pick(["手機摔壞了，只好買一支新的。","在路上被偷了錢包，證件也要重辦。","家裡的冷氣壞了，整台換新。"])+`（−${money(c)}）`)}],
 [25,70,L=>L.parentAlive,async L=>{const c=L.c.gdp*.1;await ask(L,"爸媽突然住院，需要一筆醫藥費和看護",[["你全額負擔",()=>{L.money-=c;L.rel+=3},"人際↑",c],["和兄弟姊妹分攤",()=>{L.money-=c*.4;L.rel+=1},""],["請假自己照顧",()=>{L.money-=L.inc/12;L.health-=2;L.rel+=3},"少一個月薪水"]])}],
 [22,64,L=>L.job,async L=>{const old=L.job;await ask(L,"公司宣布組織調整，你的部門要被裁撤",[["接受資遣，領一筆資遣費",()=>{L.money+=L.inc*.25;L.lostJob=old;L.job=null;L.happy-=6;say(L,`失去了${old}的工作，開始找下一份。`)},"有資遣費 · 暫時沒工作"],["接受調職到外縣市",()=>{L.moved=true;L.happy-=4;L.rel-=2},"保住工作 · 離家遠"],["接受減薪兩成留下來",()=>{L.inc*=.8;L.happy-=3},"收入↓"]])}],
 [20,90,L=>L.house||L.moved,async L=>{const c=L.c.gdp*.05;L.money-=c;L.happy-=3;say(L,pick(["颱風把屋頂掀了一角，家裡漏水嚴重。","樓上漏水滲到你家，牆壁發霉要重新整修。","家裡遭小偷，值錢的東西被搬走不少。"])+`（−${money(c)}）`)}],
 [30,85,L=>true,async L=>{const c=L.c.gdp*.025;L.money-=c;L.health-=4;say(L,pick(["牙齒痛到睡不著，做了根管治療和假牙。","腰椎突出，做了好幾個月的復健。","眼睛看不清楚，動了白內障手術。"])+`（自費 −${money(c)}）`)}],
 [25,70,L=>L.money>L.c.gdp*.3,async L=>{const c=L.c.gdp*.15;await ask(L,"親戚開口跟你借一筆不小的錢",[["借他",()=>{L.money-=c;L.rel+=2;if(R()<.5)say(L,"親戚後來說還不出來，這筆錢就這樣沒了。");else{L.money+=c;say(L,"親戚過了兩年把錢還清了。")}},"可能拿不回來"],["借一半",()=>{L.money-=c*.5;L.rel+=1},""],["婉拒",()=>{L.rel-=3},"人際↓"]])}],
 [20,60,L=>L.job,async L=>{L.happy-=4;L.health-=2;say(L,pick(["碰到很難搞的主管，每天上班都很痛苦。","同事把錯推到你身上，被記了一支警告。","公司連續好幾個月要求無償加班。"]))}],
 [18,90,L=>L.c.gdp>8000,async L=>{const c=L.c.gdp*.03;L.money-=c;say(L,pick(["收到一張超速罰單和違規停車罰單。","補繳了一筆以前漏報的稅。","房東要求負擔修繕費用。"])+`（−${money(c)}）`)}],
];
async function mishapYear(L){
 if(L.age<18||R()>.35)return;
 const ok=MISHAPS.filter(m=>L.age>=m[0]&&L.age<=m[1]&&m[2](L));if(ok.length)await pick(ok)[3](L);
}

// ── 看板：收支、資產、人際、職涯與健康 ──
function bbar(v,max,color){const w=Math.max(0,Math.min(100,v/max*100));return `<div class="bb"><i style="width:${w}%;background:${color||"var(--y)"}"></i></div>`}
function brow(k,v){return `<div class="br"><span>${k}</span><b>${v}</b></div>`}
function renderBoards(){
 const el=$("boards");if(!el||!P)return;const L=P,g=L.c.gdp;
 // 收支（每月）
 let money1="";
 if(L.age>=18&&(L.job||L.age>=22)){const {cost,income,total,full}=yearFlow(L),k=total/Math.max(1,full),mx=Math.max(income,full)/12;
  money1=brow("每月收入",moneyShort(income/12))+Object.entries(cost).filter(([,v])=>v>0).map(([n,v])=>`<div class="br"><span>${n}</span><b>${moneyShort(v*k/12)}</b></div>${bbar(v*k/12,mx,"var(--ac)")}`).join("")+
   (L.ins?brow("保費",moneyShort(L.ins.prem/12)):"")+(L.mortPay?brow("房貸（含在住）",moneyShort(L.mortPay/12)):"")+(()=>{const bal=income-total-(L.ins?L.ins.prem:0);return brow("每月結餘",`<span style="color:${bal>=0?"var(--g)":"var(--ac)"}">${bal>=0?"+":"−"}${moneyShort(Math.abs(bal)/12)}</span>`)})();
 }else money1=`<p class="mut">${L.age<18?"還未成年，生活開銷由家裡負擔。":"還在讀書，靠家裡和打工過活。"}${L.pocket!=null?`<br>今年零用錢剩 ${money(Math.max(0,L.pocket))}`:""}</p>`;
 // 資產
 const inv=L.inv&&L.inv.amt>0?L.inv.amt:0,house=L.house?housePrice(L):0,loan=L.mort?L.mort.left:0,net=L.money+inv+house-loan;
 const assets=brow("現金存款",(L.money<0?"−":"")+moneyShort(Math.abs(L.money)))+(inv?brow(`投資（${L.inv.type}）`,`${moneyShort(inv)} <small style="color:${inv>=L.inv.base?"var(--g)":"var(--ac)"}">${inv>=L.inv.base?"+":""}${Math.round((inv/L.inv.base-1)*100)}%</small>`):"")+
  (house?brow("房子市值",moneyShort(house)):"")+(loan?brow("房貸未還",`−${moneyShort(loan)}`):"")+brow("淨資產",`<span style="color:${net>=0?"var(--g)":"var(--ac)"}">${net<0?"−":""}${moneyShort(Math.abs(net))}</span>`)+
  brow("保險",L.ins?[L.ins.med&&"醫療",L.ins.acc&&"意外",L.ins.life&&"壽險"].filter(Boolean).join("、"):"沒有");
 // 人際關係
 const fam=[];if(L.fam){if(L.fam.fatherAlive!==false&&L.parentAlive!==false)fam.push("爸媽");}
 const ppl=(L.partner?`<div class="br"><span>❤ ${L.partnerName||"伴侶"}</span><b>${L.loveDmg>=2?"關係緊張":"感情穩定"}</b></div>`:L.divorced?brow("感情","離婚"):L.widowed?brow("感情","伴侶已過世"):brow("感情","單身"))+
  (L.kidList||[]).map(k=>brow(`${k.sex=="男"?"👦":"👧"} ${k.name}`,`${L.age-k.born} 歲`)).join("")+
  (L.pals||[]).map(f=>`<div class="br"><span>${f.name}</span><b>${f.gone?"已過世":f.faded?"很少聯絡":f.close>70?"摯友":"朋友"}</b></div>${f.gone?"":bbar(f.close,100,"var(--b)")}`).join("")+
  brow("父母",L.parentAlive===false?"已離世":"健在");
 // 職涯與健康
 const career=brow("工作",L.job||(L.age>=65&&L.workYears?"已退休":L.lostJob?"待業中":"—"))+(L.job?brow("年資",`${L.jobYears||0} 年`):"")+(L.workYears?brow("總工作年數",`${L.workYears} 年`):"")+
  (L.age>=50&&L.workYears?brow("預估勞保年金",`${moneyShort(pension(L)/12)}／月`):"")+brow("慢性病",L.chronic?`${L.chronic}${L.chronicCare?"（控制中）":"（未治療）"}`:"無")+(L.dementia?brow("失智","輕度"):"")+brow("吸菸",L.smoke?"有":"無");
 el.innerHTML=[["收支（每月）",money1],["資產",assets],["人際關係",ppl],["職涯與健康",career]].map(([t,b])=>`<div class="board"><h3>${t}</h3>${b}</div>`).join("");
}

// ── 一生回顧：結局時逐段播放，再留下一張總結卡 ──
function trackLife(L){(L.mhist=L.mhist||[])[L.age]=L.money+(L.inv&&L.inv.amt>0?L.inv.amt:0)-(L.mort?L.mort.left:0)+(L.house?housePrice(L):0)}
function spark(arr,color,label,fmt){
 const v=arr.map((x,i)=>[i,x]).filter(([,x])=>x!=null);if(v.length<2)return"";
 const mn=Math.min(0,...v.map(x=>x[1])),mx=Math.max(...v.map(x=>x[1]),1),W=300,H=70,n=Math.max(...v.map(x=>x[0]))||1;
 const pts=v.map(([i,x])=>`${(i/n*W).toFixed(1)},${(H-(x-mn)/(mx-mn||1)*H).toFixed(1)}`).join(" "),pk=v.reduce((a,b)=>b[1]>a[1]?b:a);
 return `<div class="lr-chart"><div class="lr-cl"><span>${label}</span><small>最高 ${fmt(pk[1])}（${pk[0]} 歲）</small></div><svg viewBox="-4 -4 ${W+8} ${H+8}" preserveAspectRatio="none"><line x1="0" x2="${W}" y1="${H-(0-mn)/(mx-mn||1)*H}" y2="${H-(0-mn)/(mx-mn||1)*H}" stroke="var(--line)" stroke-dasharray="3 3"/><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5"/><circle cx="${pk[0]/n*W}" cy="${H-(pk[1]-mn)/(mx-mn||1)*H}" r="4" fill="${color}"/></svg></div>`;
}
function lifeReview(L){
 const ev=L.events,stages=[["童年",0,12],["青少年",13,19],["青年",20,39],["中年",40,64],["老年",65,130]];
 const ageOf=e=>+e.slice(0,e.indexOf("歲"));
 const pickIn=(a,b)=>{const xs=ev.filter(e=>{const g=ageOf(e);return g>=a&&g<=b});const hi=xs.filter(e=>MILESTONE.test(e)&&!/→/.test(e));const ch=xs.filter(e=>/→/.test(e));return [...hi.slice(0,3),...ch.slice(0,2)].slice(0,4)};
 const chapters=stages.filter(([,a])=>L.age>=a).map(([n,a,b])=>{const xs=pickIn(a,Math.min(b,L.age));const hp=(L.hist||[]).slice(a,Math.min(b,L.age)+1).filter(x=>x!=null);const avg=hp.length?Math.round(hp.reduce((p,q)=>p+q,0)/hp.length):null;
  return `<div class="lr-ch"><div class="lr-ch-h"><b>${n}</b><span>${a}～${Math.min(b,L.age)} 歲</span>${avg!=null?`<em>平均幸福 ${avg}</em>`:""}</div>${xs.length?xs.map(e=>`<p>${e.slice(e.indexOf("：")+1)}</p>`).join(""):`<p class="mut">平靜地過去了。</p>`}</div>`}).join("");
 const choices=ev.filter(e=>/→/.test(e)).length,hp=L.hist||[],best=hp.reduce((a,x,i)=>x!=null&&x>(hp[a]??-1)?i:a,0),worst=hp.reduce((a,x,i)=>x!=null&&x<(hp[a]??999)?i:a,0);
 const net=(L.mhist||[]).filter(x=>x!=null).pop()||L.money;
 const facts=[["做過的抉擇",choices+" 次"],["最快樂的一年",best+" 歲"],["最低潮的一年",worst+" 歲"],["最後的淨資產",(net<0?"−":"")+moneyShort(Math.abs(net))],["好朋友",(L.pals||[]).filter(f=>!f.faded&&!f.gone).length+" 位還保持聯絡"],["工作",L.lastJob||L.job||L.lostJob||"沒有"]];
 return `<div class="lr"><h2>一生回顧</h2><div class="lr-facts">${facts.map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join("")}</div>
  ${spark(hp,"var(--ac)","幸福",x=>Math.round(x))}${spark(L.mhist||[],"var(--g)","淨資產",x=>(x<0?"−":"")+moneyShort(Math.abs(x)))}
  <div class="lr-chs">${chapters}</div></div>`;
}
// 結局前的回顧播放：一段一段淡入
function playReview(L){
 return new Promise(res=>{const ov=document.createElement("div");ov.id="reveal";
  const lines=[`${L.name}`,`${L.c.y0} – ${L.c.y0+L.age}`,`在${L.c.tw?"台灣"+L.c.tw.county:L.c.name}度過了 ${L.age} 年`,...[["童年",0,12],["青少年",13,19],["青年",20,39],["中年",40,64],["老年",65,130]].filter(([,a])=>L.age>=a).map(([n,a,b])=>{const e=L.events.filter(x=>{const g=+x.slice(0,x.indexOf("歲"));return g>=a&&g<=b&&MILESTONE.test(x)&&!/→/.test(x)})[0];return e?`${n}・${e.slice(e.indexOf("：")+1)}`:`${n}・平靜地過去了`})];
  ov.innerHTML=`<div class="rv-box lr-play">${lines.map((t,i)=>`<p style="animation-delay:${i*.9}s" class="${i==0?"lr-name":i<3?"lr-sub":""}">${t}</p>`).join("")}<button class="pri" id="lrGo" style="animation-delay:${lines.length*.9}s">看完整回顧 ▶</button></div>`;
  document.body.appendChild(ov);ov.querySelector("#lrGo").onclick=()=>{ov.classList.add("rv-out");setTimeout(()=>{ov.remove();res()},350)};
 });
}

// ── 人生證書（結局）：和出生登記成對的黑底版本 ──
function deathCard(L){
 const c=L.c,place=c.tw?"台灣 "+c.tw.county:c.name,net=(L.mhist||[]).filter(x=>x!=null).pop()??L.money,diff=L.age-Math.round(L.ex);
 const cells=[["享年",L.age+" 歲"],["教育",EDU[L.edu]],["工作",L.lastJob||L.job||L.lostJob||"—"],["伴侶",L.partner?(L.partnerName||"有"):L.widowed?"已先離開":L.divorced?"離婚":"單身"],["孩子",(L.kids||0)+" 人"],["孫子女",(L.grand||0)+" 人"],["淨資產",(net<0?"−":"")+moneyShort(Math.abs(net))],["做過的抉擇",L.events.filter(e=>/→/.test(e)).length+" 次"]];
 return `<div class="dc">
  <div class="dc-top"><div><div class="dc-title">人生證書</div><div class="dc-mut">CERTIFICATE OF A LIFE</div></div><div class="dc-seal">圓滿</div></div>
  <div class="bc-id"><canvas id="endAvatar" width="80" height="80"></canvas><div><div class="dc-mut">姓名</div><div class="bc-name">${L.name}</div><div class="dc-years">${c.y0} — ${c.y0+L.age}</div><div class="bc-tags dc-tags"><span>${L.sex=="男"?"♂":"♀"} ${place}</span><span>${title(L)}</span></div></div></div>
  <p class="dc-line">${L.age} 歲時因${L.cause||"衰老"}離開人世，${diff>=0?`比當地平均壽命多活了 ${diff} 年`:`比當地平均壽命早了 ${-diff} 年`}。</p>
  <div class="dc-grid">${cells.map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join("")}</div>
  <div class="dc-epi" id="dcEpi">${L.notes&&L.notes.length?"「"+esc(L.notes[L.notes.length-1].replace(/^\d+歲：/,""))+"」":"在下方留一句話給這個人，會刻在這裡。"}</div>
 </div>`;
}

// ── 追思館牆：墓碑卡片、蠟燭火光、最新／最多蠟燭排序、點開看完整人生 ──
let HALL=[],hallSort="new";
function hallCard(m,i){
 const mine=lit().includes(m.id),y1=m.born+m.age,glow=Math.min(1,m.candles/20);
 return `<div class="tomb" data-i="${i}" style="--glow:${glow}"><div class="flames">${"🕯".repeat(Math.min(5,Math.max(1,Math.ceil(m.candles/3))))}</div>
  <b>${esc(m.name)}</b><span class="ty">${m.born}–${y1}</span><span class="tp">${esc(m.country)}</span><span class="tt">${esc(m.data?.title||"")}</span>
  <button class="candle${mine?" on":""}" data-id="${m.id}" ${mine?"disabled":""}>🕯 <b>${m.candles}</b></button></div>`;
}
function drawHall(){
 const list=[...HALL].sort((a,b)=>hallSort=="new"?new Date(b.created_at)-new Date(a.created_at):b.candles-a.candles);
 $("memorial").innerHTML=`<div class="hall-tabs"><button data-s="new" class="${hallSort=="new"?"on":""}">最新</button><button data-s="hot" class="${hallSort=="hot"?"on":""}">最多蠟燭</button><span class="mut">共 ${HALL.length} 段人生 · 已點亮 ${HALL.reduce((a,x)=>a+x.candles,0)} 支蠟燭</span></div><div class="hall">${list.map((m)=>hallCard(m,HALL.indexOf(m))).join("")}</div>`;
 $("memorial").querySelectorAll(".hall-tabs button").forEach(b=>b.onclick=()=>{hallSort=b.dataset.s;drawHall()});
 $("memorial").querySelectorAll(".candle").forEach(b=>b.onclick=ev=>{ev.stopPropagation();b.disabled=true;
  sb("rpc/light_candle",{method:"POST",body:JSON.stringify({life_id:+b.dataset.id})}).then(n=>{const m=HALL.find(x=>x.id==b.dataset.id);m.candles=n;try{localStorage.setItem("candles-lit",JSON.stringify([...lit(),m.id]))}catch{}toast(`為 ${m.name} 點了一支蠟燭`);drawHall()}).catch(()=>{b.disabled=false;toast("暫時無法點蠟燭")})});
 $("memorial").querySelectorAll(".tomb").forEach(t=>t.onclick=()=>openTomb(HALL[t.dataset.i]));
}
function openTomb(m){
 const ov=document.createElement("div");ov.id="reveal";const mine=lit().includes(m.id);
 ov.innerHTML=`<div class="rv-box tomb-big"><div class="dc"><div class="dc-top"><div><div class="dc-title">${esc(m.name)}</div><div class="dc-mut">${m.born} — ${m.born+m.age} · ${esc(m.country)} · ${esc(m.data?.sex||"")} · 享年 ${m.age} 歲</div></div><div class="dc-seal">追思</div></div>
  <p class="dc-tt">${esc(m.data?.title||"")}</p><p class="dc-line" style="text-align:left">${esc(m.data?.story||"")}</p>${m.words?`<div class="dc-epi">「${esc(m.words)}」</div>`:""}
  <p class="dc-mut">${new Date(m.created_at).toLocaleDateString()} 留在追思館</p></div>
  <button class="pri" id="tbCandle" ${mine?"disabled":""}>🕯 ${mine?"你已點過蠟燭":"點一支蠟燭"}（${m.candles}）</button><button class="rv-skip" id="tbClose">關閉</button></div>`;
 document.body.appendChild(ov);const close=()=>{ov.remove();drawHall()};
 ov.onclick=e=>{if(e.target===ov)close()};ov.querySelector("#tbClose").onclick=close;
 ov.querySelector("#tbCandle").onclick=e=>{e.target.disabled=true;sb("rpc/light_candle",{method:"POST",body:JSON.stringify({life_id:m.id})}).then(n=>{m.candles=n;try{localStorage.setItem("candles-lit",JSON.stringify([...lit(),m.id]))}catch{}e.target.textContent=`🕯 已點亮（${n}）`;toast("點了一支蠟燭")}).catch(()=>{e.target.disabled=false})};
}
