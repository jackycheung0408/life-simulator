// 人生事件：天賦、夢想、父母、朋友、日常事件、歷史事件
const TALENTS=["聰明","運動","藝術","社交","耐心","手巧"];
const DREAMS={聰明:["科學家","醫師","工程師"],運動:["運動員","教練","警察"],藝術:["畫家","音樂家","作家","演員"],社交:["老師","政治人物","主持人"],耐心:["護理師","研究員","農場主"],手巧:["廚師","木匠","設計師"]};
const LOW=c=>c.gdp<8000,RICH=c=>c.gdp>40000;

// 依年份與國家發生的歷史事件（只在對應年份活著時觸發）
const HISTORY=[
 [1966,1976,["中國"],"文化大革命開始，學校停課，家裡的日子變得小心翼翼。",{health:-3,happy:-10,edu:true}],
 [1959,1961,["中國"],"遇上大饑荒，家裡常常吃不飽。",{health:-12,happy:-10}],
 [1978,1985,["中國"],"改革開放，村裡開始有人做生意。",{inc:1.3,happy:5}],
 [1975,1979,["柬埔寨"],"政權更迭後全家被迫遷往鄉下勞動。",{health:-20,happy:-20,war:true}],
 [1994,1994,["盧安達"],"國內爆發種族屠殺，全家逃離家園。",{health:-15,happy:-25,war:true}],
 [1967,1970,["奈及利亞"],"內戰爆發，糧食短缺。",{health:-10,happy:-10,war:true}],
 [1980,1988,["伊朗","伊拉克"],"兩國爆發戰爭，親友被徵召上前線。",{happy:-15,war:true}],
 [1979,1989,["阿富汗"],"外國軍隊入侵，很多人逃到鄰國。",{happy:-15,war:true,flee:"巴基斯坦"}],
 [1991,2001,["阿富汗"],"內戰持續，城市一再易手。",{happy:-10,war:true}],
 [1955,1975,["越南"],"戰爭持續多年，家裡有人上了戰場。",{happy:-15,war:true}],
 [1991,1995,["克羅埃西亞","波士尼亞","塞爾維亞"],"南斯拉夫解體，戰火波及家鄉。",{happy:-20,war:true}],
 [1998,1999,["科索沃"],"戰爭爆發，全家暫時逃到鄰國。",{happy:-20,war:true}],
 [1991,1991,["俄羅斯","烏克蘭","白俄羅斯","哈薩克","烏茲別克","喬治亞","亞美尼亞","亞塞拜然","摩爾多瓦","立陶宛","拉脫維亞","愛沙尼亞","吉爾吉斯","塔吉克","土庫曼"],"蘇聯解體，國家一夜之間改變。",{inc:.7,happy:-8}],
 [2022,2030,["烏克蘭"],"戰爭爆發，空襲警報成了日常。",{happy:-20,war:true,flee:"波蘭"}],
 [2011,2024,["敘利亞"],"內戰爆發，城市陷入戰火。",{happy:-20,war:true,flee:"土耳其"}],
 [2015,2025,["葉門"],"內戰與饑荒同時降臨。",{health:-10,happy:-15,war:true}],
 [2023,2026,["蘇丹"],"首都爆發武裝衝突，許多人流離失所。",{happy:-20,war:true,flee:"埃及"}],
 [1998,2003,["剛果民主共和國"],"戰爭在東部延燒多年。",{happy:-15,war:true}],
 [1991,2002,["獅子山"],"內戰期間村莊遭到襲擊。",{happy:-20,war:true}],
 [1989,1989,["德國"],"柏林圍牆倒下，分隔多年的親戚終於見面。",{happy:12}],
 [1987,1987,["台灣"],"解除戒嚴，社會氣氛變得不一樣了。",{happy:6}],
 [1999,1999,["台灣"],"九二一大地震，家裡房子出現裂痕。",{happy:-6}],
 [1997,1997,["香港"],"香港主權移交。",{happy:0}],
 [1994,1994,["南非"],"第一次全民參與的民主選舉，排了很久的隊去投票。",{happy:12}],
 [1997,1998,["泰國","印尼","韓國","馬來西亞","菲律賓"],"亞洲金融風暴，工作和存款都受到衝擊。",{inc:.8,happy:-8}],
 [2004,2004,["印尼","斯里蘭卡","泰國","印度"],"南亞大海嘯襲擊沿海地區。",{happy:-10}],
 [2011,2011,["日本"],"東日本大地震，全國陷入哀傷。",{happy:-8}],
 [2008,2009,null,"全球金融海嘯，很多人丟了工作。",{inc:.92,happy:-5}],
 [2020,2021,null,"新冠疫情席捲全球，生活被迫停擺。",{health:-3,happy:-8}],
 [1969,1969,null,"從收音機或電視聽到人類登陸月球的消息。",{happy:3}],
];

const sayHi=(L,t)=>{(L.highlights=L.highlights||[]).push(t)};
const clamp=L=>{L.health=Math.max(0,Math.min(100,L.health));L.happy=Math.max(0,Math.min(100,L.happy))};

// 一般事件：[最小歲, 最大歲, 機率, 條件, 動作]
const EVENTS=[
 // 童年
 [1,4,.15,L=>true,L=>say(L,pick(["說出了第一句話。","學會走路，跌跌撞撞地追著家人跑。","第一次看到海（或河）。"]))],
 [3,10,.08,L=>LOW(L.c),L=>{L.health-=8;say(L,pick(["感染了瘧疾，好不容易退燒。","得了嚴重的腹瀉，瘦了一大圈。","營養不良，個子比同齡孩子小。"]))}],
 [3,10,.04,L=>!LOW(L.c),L=>{say(L,pick(["得了水痘，在家休息了兩週。","第一次去遊樂園。","養了一隻小狗。"]))}],
 [5,12,.12,L=>true,L=>{L.friends=(L.friends||0)+1;say(L,`認識了一輩子的好朋友${pick(NAMES[REGION(L.raw)][pick(["男","女"])])}。`)}],
 [6,12,.06,L=>L.edu==0&&LOW(L.c),L=>{L.happy-=3;say(L,pick(["每天走很遠的路去挑水。","跟著大人下田幫忙。","在市場幫忙顧攤。"]))}],
 [6,15,.03,L=>true,L=>{L.happy-=8;say(L,"父母離婚了，跟著其中一方生活。")}],
 [6,15,.05,L=>L.talent=="運動",L=>{say(L,"在學校運動會拿到第一名。");L.happy+=5}],
 [6,15,.05,L=>L.talent=="藝術",L=>{say(L,"畫的圖被老師貼在教室後面。");L.happy+=5}],
 [6,15,.05,L=>L.talent=="聰明"&&L.edu>=1,L=>{say(L,"成績總是全班前幾名。");L.smart=true}],
 [8,15,.03,L=>L.cls<=1,L=>{L.happy-=5;say(L,"家裡太窮，曾經餓著肚子去上學。")}],
 [10,10,1,L=>true,L=>{L.dream=pick(DREAMS[L.talent]);say(L,`長大後想當${L.dream}。`)}],
 [10,17,.04,L=>LOW(L.c)&&L.sex=="女",L=>ask(L,"家人安排了一門婚事，要怎麼做？",[["聽從家人",()=>{L.partner=true;L.childMarriage=true;L.edu=Math.min(L.edu,1);L.happy-=10;say(L,"年紀很小就結婚了。")}],["拒絕並繼續讀書",()=>{L.happy-=3;if(R()<.5){L.edu=Math.max(L.edu,1);say(L,"說服了家人，繼續上學。")}else say(L,"沒能說服家人，但婚事暫時擱下了。")}]])],
 // 青少年
 [13,19,.06,L=>true,L=>{L.happy+=6;say(L,"第一次心動。")}],
 [13,19,.03,L=>true,L=>{L.happy-=10;say(L,pick(["在學校被霸凌了一段時間。","和家人大吵一架，離家出走了一晚。"]))}],
 [14,19,.04,L=>!$("soft").checked,L=>{L.happy-=12;say(L,"經歷了一段很憂鬱的時期。（台灣安心專線 1925）")}],
 [15,20,.04,L=>true,L=>ask(L,"朋友找你一起喝酒，要去嗎？",[["一起去",()=>{L.drink=(L.drink||0)+1;L.happy+=2}],["不去",()=>{}]])],
 [15,25,.02,L=>(L.drink||0)>=2,L=>{L.health-=6;L.alcohol=true;say(L,"喝酒越喝越多，開始影響身體。")}],
 [16,22,.05,L=>L.talent=="藝術",L=>{say(L,"組了一個樂團，在小地方表演過。");L.happy+=5}],
 [16,25,.03,L=>L.cls<=1&&LOW(L.c),L=>{say(L,"為了養家，到城市打工。");L.inc*=1.2;L.happy-=3}],
 // 成年
 [18,30,.03,L=>L.edu==3,L=>ask(L,"有機會出國留學，要去嗎？",[["去",()=>{L.money-=L.inc*.5;L.inc*=1.3;L.studiedAbroad=true;sayHi(L,"曾出國留學。")}],["不去",()=>{}]])],
 [18,40,.02,L=>true,L=>{say(L,"參加了一場改變人生的旅行。");L.happy+=6}],
 [20,60,.03,L=>L.job,L=>{L.inc*=1.15;say(L,"工作表現不錯，升職加薪。")}],
 [20,60,.025,L=>L.job,L=>{const old=L.job;L.job=null;L.happy-=10;say(L,`公司裁員，失去了${old}的工作。`);L.lostJob=old}],
 [20,60,.2,L=>!L.job&&L.lostJob&&L.age<65,L=>{L.job=L.lostJob;L.lostJob=null;L.inc*=.9;say(L,`重新找到${L.job}的工作。`)}],
 [22,55,.04,L=>L.dream&&!L.dreamDone&&L.job,L=>ask(L,`想試試看當${L.dream}嗎？`,[["放手一試",()=>{const ok=R()<(L.edu==3?.5:.25)+(L.smart?.15:0);if(ok){L.job=L.dream;L.dreamDone=true;L.happy+=15;say(L,`成為了${L.dream}，那是夢寐以求的工作。`);sayHi(L,`曾當過${L.dream}，那是從小的夢想。`)}else{L.happy-=5;say(L,"試了，但沒有成功。")}}],["算了",()=>{}]])],
 [25,55,.02,L=>L.job&&L.money>L.inc,L=>ask(L,"想自己創業嗎？",[["創業",()=>{if(R()<.4){L.job="老闆";L.inc*=2;say(L,"創業成功，開了自己的店。");sayHi(L,"白手起家開了自己的事業。")}else{L.money-=L.inc;L.happy-=10;say(L,"創業失敗，賠了不少錢。")}}],["不要",()=>{}]])],
 [25,50,.03,L=>L.money>L.inc*2&&!L.house,L=>ask(L,"要買房子嗎？",[["買",()=>{L.house=true;L.money-=L.inc*2;L.happy+=8;say(L,"買下了自己的房子。")}],["再等等",()=>{}]])],
 [25,45,.02,L=>L.partner&&L.kids==0,L=>ask(L,"一直沒有孩子，要考慮收養嗎？",[["收養",()=>{L.kids++;L.adopted=true;L.happy+=10;say(L,"收養了一個孩子，迎進家中成為家人。");sayHi(L,"收養了一個孩子。")}],["不要",()=>{}]])],
 [25,60,.015,L=>L.partner&&!L.childMarriage,L=>{L.partner=false;L.divorced=true;L.happy-=12;say(L,"和伴侶分開了。")}],
 [28,60,.04,L=>L.divorced&&!L.partner,L=>{L.partner=true;L.partnerYears=0;L.happy+=8;say(L,"遇到新的伴侶，重新開始。")}],
 [30,60,.02,L=>L.talent=="社交"&&L.job,L=>ask(L,"有人邀請你出來參選地方議員，要參選嗎？",[["參選",()=>{if(R()<.4){L.politician=true;say(L,"當選地方議員。");sayHi(L,"一邊工作，一邊擔任地方議員。")}else say(L,"落選了。")}],["不參選",()=>{}]])],
 [30,70,.015,L=>L.talent=="藝術",L=>{say(L,"寫的書（或作品）出版了。");sayHi(L,"留下了自己的作品。");L.happy+=10}],
 [30,70,.02,L=>true,L=>{L.money+=L.inc*.5;say(L,pick(["中了一張小額彩券。","繼承了一筆小小的遺產。"]))}],
 [30,70,.012,L=>!$("soft").checked,L=>{L.money-=L.inc*.8;L.happy-=8;say(L,"迷上了賭博，輸掉不少積蓄。")}],
 [30,75,.025,L=>true,L=>{L.health-=10;say(L,pick(["被診斷出高血壓。","發現有糖尿病。","腰背開始出問題。"]))}],
 [35,75,.015,L=>true,L=>ask(L,"被診斷出癌症，要接受治療嗎？",[["接受治療",()=>{L.money-=L.inc*(RICH(L.c)?.3:1.5);if(R()<(RICH(L.c)?.75:.4)){L.health-=5;say(L,"治療成功，病情控制住了。")}else{L.health-=25;say(L,"治療效果不好。")}}],["不治療",()=>{L.health-=35}]])],
 [35,70,.03,L=>L.kids,L=>{L.happy+=6;say(L,pick(["孩子大學畢業了。","孩子結婚了。","孩子第一次帶薪水回家。"]))}],
 [35,65,.015,L=>L.kids,L=>{L.happy-=6;say(L,"和孩子為了一件事冷戰了很久。")}],
 [40,70,.02,L=>(L.friends||0)>0,L=>{L.happy+=5;say(L,"和童年好友重逢，聊了一整晚。")}],
 [40,80,.01,L=>L.abroad,L=>{L.citizen=true;say(L,`成為${L.abroad}公民。`);sayHi(L,`成為${L.abroad}公民。`)}],
 [45,80,.03,L=>L.parentAlive,L=>ask(L,"年邁的父母需要人照顧，要怎麼做？",[["搬回去照顧",()=>{L.caregiver=true;L.happy-=3;L.inc*=.9;sayHi(L,"在身邊照顧年邁的父母。")}],["請人照顧",()=>{L.money-=L.inc*.4}]])],
 [55,90,.03,L=>true,L=>{L.happy+=4;say(L,pick(["開始學一樣新東西。","每天早上去公園散步。","種了一小片菜園。"]))}],
 [60,95,.025,L=>true,L=>{L.happy-=6;say(L,"一位老朋友過世了。")}],
 [65,95,.02,L=>!$("soft").checked,L=>{L.health-=10;say(L,"記憶力開始變差。")}],
 [70,100,.02,L=>L.grand,L=>{L.happy+=6;say(L,"孫子女來家裡住了一段時間。")}],
];

// 可重複發生的事件（依 EVENTS 索引）；其餘一生只發生一次
const REPEAT=new Set([1,2,4,15,20,21,22,23,24,25,26,29,34,36,38,41,42,44]);

async function lifeEvents(L,f){
 const c=L.c,yr=c.y0+L.age;
 if(!L.init){L.init=true;L.raw=L.c.name;L.talent=pick(TALENTS);L.parentAlive=true;say(L,`從小就特別${L.talent=="聰明"?"聰明":L.talent=="社交"?"會和人相處":L.talent=="耐心"?"有耐心":L.talent=="手巧"?"手巧":"有"+L.talent+"天分"}。`)}
 // 父母老去
 if(L.parentAlive&&L.age>20&&R()<(L.age-15)/700){L.parentAlive=false;L.happy-=10;say(L,"父母離開了人世。")}
 // 歷史
 if(cfg.w!="now"||yr<=today.getFullYear()+5)for(const h of HISTORY){
  if(yr<h[0]||yr>h[1]||(h[2]&&!h[2].includes(L.raw))||L.abroad)continue;
  const key=h[3];L.seen=L.seen||{};if(L.seen[key])continue;L.seen[key]=1;
  const e=h[4];if(e.war&&$("soft").checked){say(L,"國家經歷了一段動盪的時期。");continue}
  say(L,key);L.health+=e.health||0;L.happy+=e.happy||0;if(e.inc)L.inc*=e.inc;if(e.edu&&L.age<20&&L.edu>1)L.edu=1;
  if(e.war)sayHi(L,"經歷過戰爭。");
  if(e.flee&&L.age>=18)await ask(L,`要逃到${e.flee}嗎？`,[["逃難",()=>{L.abroad=e.flee;L.inc*=.6;L.happy-=5;say(L,`成為難民，逃到${e.flee}。`);sayHi(L,`曾以難民身分逃到${e.flee}。`)}],["留下",()=>{L.health-=8}]]);
 }
 // 今日主題事件
 if(L.age>=10&&R()<.02)say(L,`這一年，「${THEME[0]}」在身邊引起很大的話題。`);
 // 一般事件：每年最多兩件
 L.done=L.done||{};let n=0;
 for(let i=0;i<EVENTS.length;i++){const e=EVENTS[i];if(n>=2)break;if(L.age<e[0]||L.age>e[1]||(L.done[i]&&!REPEAT.has(i)))continue;
  if(R()<e[2]*(f=="享受"?1.1:1)&&e[3](L)){L.done[i]=1;await e[4](L);n++}}
 clamp(L);
}
