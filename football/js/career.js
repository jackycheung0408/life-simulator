// 生涯：每一季、童年、青訓、職業球季、轉會、同世代、伏筆、第二人生
// ── 一季 ──
async function season(){
 const p=P;p.age++;
 heightYear(p);await starsYear(p);if(p.age>=13)await resolveSeeds(p);if(p.age>=16&&!p.retired&&(p.turns||0)<2&&R()<.04)await turningPoint(p);if(p.club&&!p.retired)await dualChoice(p);await storyYear(p);if(!p.retired)await worldYear(p);
 if(p.age<13){await childhood(p);p.ovrHist[p.age]=ovr(p);if(p.age>=p.touchAge)(p.yhist=p.yhist||[]).push({age:p.age,a:{...p.a},ovr:ovr(p),val:0,wage:0,money:p.money,h:p.h,fat:p.fat||0,club:p.stage});return}
 if(p.age==13&&!p.originDone){p.originDone=1;applyOrigin(p)}
 if(p.age==13){await academy();say("開始有正式的訓練課表了：射門、防守、戰術都能排進每週計劃。");toast("育成計劃解鎖更多訓練項目")}
 if(p.age>=17&&p.age<=22&&!p.club&&!p.retired)await firstContract();
 if(p.club&&!p.retired)await proSeason();else if(!p.retired){await youthYear(p.stage=="青訓"?.6:.3);await academyReview();if(p.age>=19&&!p.club){await amateur()}if(p.age==13&&p.stage=="學校隊"&&R()<.5)await ask("同學們都在準備升學考試，你還要繼續踢球嗎？",[["收心讀書，把足球當興趣",()=>endFootball("13 歲收心讀書，足球變成假日的興趣。",pick(["大學生，後來當上工程師","大學生，後來當上老師"])),"結束足球生涯"],["繼續踢，參加業餘球隊",()=>{p.stage="業餘"},"堅持"]]);}
 if(p.retired)await afterLife();
 p.ovrHist[p.age]=ovr(p);p.yStart={...p.a};if(p.age>=p.touchAge)(p.yhist=p.yhist||[]).push({age:p.age,a:{...p.a},ovr:ovr(p),val:p.club?value(p):0,wage:p.club?p.wage:0,money:p.money,h:p.h,fat:p.fat||0,club:p.club||p.stage});p.peak=Math.max(p.peak,ovr(p));p.maxValue=Math.max(p.maxValue,value(p));
}
// ── 身高：照生長曲線長高，青春期會突然抽高（晚熟的人晚一兩年）──
const HCURVE=[[0,.285],[1,.43],[2,.495],[3,.545],[4,.585],[5,.625],[6,.66],[7,.695],[8,.73],[9,.76],[10,.79],[11,.815],[12,.84],[13,.875],[14,.92],[15,.955],[16,.98],[17,.993],[18,1]];
function hAt(p,age){const x=Math.min(18,Math.max(0,age-(age>=11?p.bloom:0)));const i=Math.min(17,Math.floor(x)),f=x-i;const [,a]=HCURVE[i],[,b]=HCURVE[Math.min(18,i+1)];return p.hT*(a+(b-a)*f)}
function heightYear(p){const before=p.h;p.h=Math.round(hAt(p,p.age)*10)/10;const d=p.h-before;
 if(p.age>=12&&p.age<=17&&d>=8){say(`這一年長高了 ${Math.round(d)} 公分，膝蓋常常痠痛，動作也變得有點不協調。`);p.a.盤帶-=1.5;p.a.速度+=1}
 if(p.age==18){say(`身高定在 ${Math.round(p.h)} 公分。`);if(p.pos=="GK"&&p.h<182)say("以門將來說偏矮，教練常常提醒要加強彈跳。");const tall=(p.h-178)/10;p.s.頭球=clamp(p.s.頭球+tall*5,1,99);p.s.彈跳=clamp(p.s.彈跳+tall*3,1,99);p.s.強壯=clamp(p.s.強壯+tall*4,1,99);p.s.敏捷=clamp(p.s.敏捷-tall*4,1,99);p.s.加速=clamp(p.s.加速-tall*3,1,99)}}
// ── 童年：像真的孩子一樣長大，幾歲才碰到足球看家庭 ──
// 在 [a,b] 歲之間隨機某一年發生一次；到最後一年還沒發生就一定發生
function win(p,key,a,b,prob){p.done=p.done||{};if(p.done[key]||p.age<a||p.age>b)return false;if(p.age==b||R()<prob){p.done[key]=1;return true}return false}
async function childhood(p){
 const f=p.fam,first=p.age==p.touchAge;
 if(p.age>=1&&p.age<=3){const T=[
  [RV("一顆皮球滾到你腳邊","公園裡有顆球滾了過來"),[["追著球跑",()=>{p.s.加速+=1.5;p.s.耐力+=1;p.trait="好動"},"好動：速度↑"],["蹲下來研究它",()=>{p.s.控球+=1.5;p.s.視野+=1;p.trait="好奇"},"好奇：控球↑"],["一腳把它踢飛",()=>{p.s.射門力量+=1.5;p.trait="膽大"},"膽大：射門力量↑"],["抱著它不放",()=>{p.s.強壯+=1;p.trait="固執"},"固執：強壯↑"]]],
  [RV("在客廳學走路，跌倒了","第一次爬上沙發，又摔了下來"),[["自己爬起來繼續走",()=>{p.s.敏捷+=1.5;p.morale+=2},"敏捷↑"],["哭著找媽媽",()=>{p.morale+=1},""],["換個方法慢慢爬",()=>{p.s.反應+=1.5},"反應↑"]]],
  [RV("哥哥姊姊在玩積木","家裡來了一群小朋友"),[["搶過來自己玩",()=>{p.s.搶斷+=1.5},"搶斷↑"],["坐在旁邊一起堆",()=>{p.s.短傳+=1.5},"合作：短傳↑"],["把積木推倒大笑",()=>{p.s.盤帶技術+=1;p.morale+=2},""]]],
  [RV("爸媽帶你去海邊","第一次去游泳池玩水"),[["衝進水裡",()=>{p.s.耐力+=1.5},"耐力↑"],["在沙灘上跑來跑去",()=>{p.s.衝刺速度+=1.5},"速度↑"],["躲在大人後面",()=>{p.s.盯人+=1},"謹慎"]]],
 ];p.toddler=p.toddler||{};const ok=T.map((_,i)=>i).filter(i=>!p.toddler[i]);if(ok.length&&R()<.8){const i=pick(ok);p.toddler[i]=1;await ask(T[i][0],T[i][1],"幼兒時期的小個性，會悄悄影響之後的球風")}}
 if(p.age==1){say(pick(["學會走路了，搖搖晃晃地追著家裡的貓。","說出的第一個字是「媽媽」。","在公園的草地上爬來爬去。"]));p.stage="幼兒";return}
 if(p.age==2){say(R()<.3?"半夜發高燒，爸媽抱著你衝去急診。":pick(["很喜歡踢家裡的抱枕。","整天跟在"+(f.sib?"哥哥":"爸爸")+"後面跑。"]));return}
 if(first){p.stage="玩球的孩子";say(f.fan?`${f.sib?"哥哥":"爸爸"}是球迷，給了你人生第一顆足球，你抱著它不肯放。`:f.sib?"跟著哥哥到空地，第一次踢到球，就追著它跑了一整個下午。":`在${p.age>=6?"小學":"幼兒園"}的操場第一次踢到球，回家一直吵著還要再踢。`,1)}
 if(p.age<p.touchAge){say(pick(["開始上幼兒園，第一天哭著不肯進教室。","最喜歡在公園溜滑梯。","學會自己穿鞋子。"]));return}
 if(p.age>=p.touchAge)grow(p,.2);
 if(win(p,"c5",4,7,.4)&&f.cls>=0)await ask(RV("社區有幼兒足球班在招生","幼兒園老師說附近有足球體驗課","鄰居媽媽問要不要一起報名兒童足球隊","百貨公司辦了一場親子足球營"),[["報名參加",()=>{ATTR.forEach(k=>p.a[k]+=1);p.money-=.002},"每個月要繳學費",()=>f.cls>=1],["在家附近的空地自己踢",()=>{p.a.盤帶+=1.5},"免費"],["先學游泳和跑步",()=>{p.a.速度+=1;p.a.體能+=1.5},"體能底子↑"]]);
 if(p.age==6&&p.flair){const F={"天生射手的嗅覺":"射術","大局觀":"視野","爆發力":"加速","不服輸的個性":"耐力","左腳魔法":"盤帶技術","鋼鐵般的意志":"強壯","驚人的彈跳":"彈跳","冷靜的頭腦":"反應"};const k=F[p.flair];if(k){p.s[k]=clamp(p.s[k]+4,1,99);say(`大人們發現你有「${p.flair}」。`,1)}}
 if(p.age==10)say(`教練發現你${p.wf>=4?"左右腳都能射門":p.wf<=2?"幾乎只用慣用腳":"逆足還可以"}，${p.sm>=4?"腳下花樣很多":p.sm<=1?"踢法很樸實":"偶爾會耍點小技巧"}。（逆足 ${"★".repeat(p.wf)}、花式 ${"★".repeat(p.sm)}）`,1);
 if(p.age==6){p.stage="小學生";say("上小學了。"+(R()<.5?"下課十分鐘都在操場踢球。":"班上沒什麼人踢球，常常一個人對著牆壁踢。"))}
 if(win(p,"c7",6,9,.35))await ask(RV("放學後的時間要怎麼用？","下課鐘一響，你通常去哪裡？","爸媽問你放學後想參加什麼","同學們放學都去補習班，你呢？"),[["每天都去踢球",()=>{ATTR.forEach(k=>p.a[k]+=1.2);p.grade-=4},"球技↑ 功課↓"],["先寫完功課再去踢",()=>{p.a.傳球+=1;p.grade+=2},"兩邊兼顧"],["參加學校的足球隊",()=>{p.a.體能+=1.5;p.a.傳球+=1.5},"團隊配合↑"]]);
 if(p.age>=6&&!p.famHit&&R()<.08){p.famHit=1;const bad=pick([["爸爸工作的工廠倒閉了，家裡一下子變得很緊。",()=>{f.cls=Math.max(0,f.cls-1)}],["全家搬到另一個城市，要重新找踢球的地方。",()=>{p.morale-=5}],["爸媽離婚了，你跟著媽媽住。",()=>{p.morale-=8}]]);say(bad[0]);bad[1]()}
 if(win(p,"c9",8,11,.4)){const ok=ovr(p)>=24+R()*8;await ask(ok?"地方俱樂部的球探看上你，邀你加入少年隊":"想加入地方俱樂部的少年隊",[["加入少年隊",()=>{p.stage="少年隊";say("加入地方俱樂部的少年隊，每週練球三次。",1)},ok?"正規訓練":"要參加選拔",()=>ok||R()<.7],["繼續在街頭踢",()=>{p.a.盤帶+=3},"盤帶↑ 但少了正規訓練"],["請私人教練",()=>{ATTR.forEach(k=>p.a[k]+=1);p.money-=.01},"家裡要出錢",()=>f.cls>=2]])}
 if(win(p,"c11",9,12,.35))await ask(RV("期末考快到了，教練卻加開了練習","明天要考數學，今晚卻有校隊集訓","老師說成績再退步就不准參加比賽","段考週剛好撞上區域盃"),[["去練球",()=>{p.a.體能+=1;p.grade-=6;if(p.grade<45)say("成績單上好幾科不及格，被爸媽禁足一個月。")},"功課↓"],["請假準備考試",()=>{p.grade+=6;p.morale-=2},"功課↑"],["白天練球，晚上熬夜讀書",()=>{p.grade+=2;p.health-=4},"兩邊都顧，但很累"]]);
 if(win(p,"pos",11,13,.4)){const cur=dpOf(p),sug=bestDp(p),coach=pick(["教練","少年隊的新教練","帶隊的老教練"]),gkOk=p.h>=hAt(p,p.age);
  if(sug==cur)await ask(`${coach}說你很適合踢${DPN[sug]}（${sug}），要你專心練這個位置`,[[`專攻${DPN[sug]}`,()=>{p.a[sug=="ST"||sug=="W"?"射門":sug=="CB"||sug=="FB"||sug=="CDM"?"防守":"傳球"]+=2},"專精"],["想多試幾個位置",()=>{p.a.傳球+=1;p.a.防守+=1},"全面"],["試試看門將",()=>{setDp(p,"GK");p.a.防守+=6},"身高越高越吃香",()=>gkOk]]);
  else await ask(`${coach}看了你的身材和球風，建議你從${DPN[cur]}改踢${DPN[sug]}（${sug}）`,[[`聽教練的，改踢${DPN[sug]}`,()=>setDp(p,sug),"綜合能力會依新位置重新計算"],[`堅持踢${DPN[cur]}`,()=>{p.morale+=3},"夢想的位置"],["試試看門將",()=>{setDp(p,"GK");p.a.防守+=6},"身高越高越吃香",()=>gkOk]])}
 await kidRandom(p);
}
const RV=(...a)=>pick(a);
const KID_POOL=[
 [4,9,p=>ask(RV("鄰居的大孩子在空地踢球，叫你一起來","巷口有一群孩子缺一個人踢球"),[["衝過去一起踢",()=>{p.a.盤帶+=1.5;p.a.體能+=1},"球技↑"],["在旁邊看",()=>{p.a.傳球+=.5},""],["回家看卡通",()=>{p.morale+=2},""]])],
 [5,12,p=>ask(RV("踢球把鄰居家的窗戶打破了","球飛進隔壁的院子，打翻了花盆"),[["去按門鈴道歉",()=>{p.morale+=1;say("鄰居阿伯沒生氣，還把球還給你。")},""],["趕快跑走",()=>{if(R()<.5){p.morale-=3;say("被爸媽知道了，零用錢被扣光。")}},"可能被抓"],["用零用錢賠",()=>{p.money-=.0005},""]])],
 [6,12,p=>ask(RV("學校運動會要選比賽項目","體育課老師問誰要代表班上比賽"),[["跑百米",()=>{p.a.速度+=2},"速度↑"],["班際足球賽",()=>{p.a.盤帶+=1;p.a.傳球+=1;if(R()<.4)say("幫班上拿下足球賽冠軍！",1)},"球技↑"],["拔河",()=>{p.a.體能+=1.5},"體能↑"]])],
 [5,12,p=>ask(RV("世界盃半夜開打","電視轉播歐洲冠軍聯賽決賽，凌晨三點開踢"),[["偷偷爬起來看",()=>{p.morale+=4;p.health-=2;say(RV("看到偶像進球，興奮得睡不著。","比賽踢到 PK 大戰，你緊張得抱著枕頭。"))},"夢想↑"],["錄起來明天看",()=>{p.morale+=2},""],["乖乖睡覺",()=>{p.health+=1},""]])],
 [6,12,p=>ask(RV("暑假到了，有幾個夏令營可以選","爸媽問你暑假想參加什麼營隊"),[["足球營",()=>{ATTR.forEach(k=>p.a[k]+=.8);p.money-=.001},"球技↑",()=>p.fam.cls>=1],["科學營",()=>{p.grade+=5},"功課↑"],["回鄉下找阿公阿嬤",()=>{p.morale+=5;p.a.體能+=.5},"心情↑"]])],
 [7,12,p=>ask(RV("第一次輸掉很重要的比賽，你哭了","比賽被灌了五球，隊友都很沮喪"),[["回家後繼續練",()=>{p.a.射門+=1;p.morale+=1},"堅持"],["跟教練說不想踢了",()=>{p.morale-=4;p.doubt=(p.doubt||0)+1},"心情↓"],["找隊友一起檢討",()=>{p.a.傳球+=1;p.morale+=2},"團隊↑"]])],
 [7,12,p=>ask(RV("有同學笑你長得太矮，不適合踢球","別班的人說你太瘦，一撞就倒"),[["用球技證明",()=>{p.a.盤帶+=1.5},"盤帶↑"],["每天喝牛奶、跳繩",()=>{p.a.體能+=1},""],["很難過，躲起來",()=>{p.morale-=4},""]])],
 [6,12,p=>ask(RV("爸媽想讓你學鋼琴","媽媽幫你報名了英文補習班"),[["乖乖去上",()=>{p.grade+=4;p.morale-=1},"功課↑ 練球時間↓"],["吵著要去踢球",()=>{p.a.盤帶+=1;p.morale+=1},""],["兩邊都要",()=>{p.fat=clamp((p.fat||0)+10,0,100);p.grade+=2;p.a.盤帶+=.5},"很累"]])],
 [8,12,p=>ask(RV("同學約你翹課去河堤踢球","下午的課很無聊，有人提議偷溜去踢球"),[["一起去",()=>{p.a.盤帶+=1;if(R()<.5){p.grade-=6;say("被老師抓到，罰寫悔過書。")}},"可能被抓"],["乖乖上課",()=>{p.grade+=2},""],["放學後再約",()=>{p.a.傳球+=.5},""]])],
 [4,12,p=>{say(RV("撿到一隻流浪狗，每天陪你在公園踢球。","爺爺帶你去球場看了人生第一場職業比賽。","下雨天在家對著牆壁練顛球，被樓下鄰居抗議。","生日收到一件喜歡球員的球衣，穿到洗不掉顏色。","在公園認識一個外國小朋友，雖然語言不通，踢球卻很合。","颱風天停課，你在家看了一整天的足球影片。"));p.morale+=2;return Promise.resolve()}],
 [4,12,p=>{const t=RV(["感冒發燒，在家躺了一週。",-3],["腳踝扭傷，好幾週不能踢球。",-5],["長水痘，不能去學校也不能踢球。",-2]);say(t[0]);p.health+=t[1];return Promise.resolve()}],
 [8,12,p=>ask(RV("被選為校隊隊長","教練要你在比賽中戴隊長臂章"),[["接下來",()=>{p.morale+=4;p.fame+=1;say("成為校隊隊長。",1)},"責任↑"],["讓給更會踢的同學",()=>{p.morale+=1},""],["有點害怕，先拒絕",()=>{},""]])],
 [9,12,p=>ask(RV("最好的朋友要轉學了","一起踢球的好朋友要搬到別的城市"),[["送他一顆簽名足球",()=>{p.morale+=1},""],["約好長大一起踢職業",()=>{p.morale+=3},"夢想↑"],["難過到好幾天不想踢球",()=>{p.morale-=3},""]])],
];
async function kidRandom(p){if(p.age<4)return;if(p.age>=p.touchAge&&R()<.3)await genEvent("kid");p.kidSeen=p.kidSeen||{};
 const ok=KID_POOL.map((e,i)=>i).filter(i=>p.age>=KID_POOL[i][0]&&p.age<=KID_POOL[i][1]&&!p.kidSeen[i]);
 const n=R()<.1?2:R()<.6?1:0;for(let j=0;j<n&&ok.length;j++){const i=ok.splice(Math.floor(R()*ok.length),1)[0];p.kidSeen[i]=1;await KID_POOL[i][2](p)}}
async function academy(){
 const p=P,o=ovr(p),top=o>=40,mid=o>=33;
 await ask(RV("13 歲，有青訓營想延攬你","13 歲，一位青訓教練到學校找你","13 歲，職業球隊的青訓部打電話到家裡","13 歲，你在選拔賽中被青訓營看上"),[
  [top?"加入頂級豪門青訓（到國外）":"參加頂級豪門青訓的選拔",()=>{if(top||R()<.25){p.stage="青訓";p.academy=5;p.morale-=4;say(`進入${pick(CLUBS.filter(c=>c.tier==5)).name}青訓營，一個人在國外生活。`,1);ATTR.forEach(k=>p.a[k]+=2)}else{say("頂級青訓選拔落選了。");p.morale-=6}},top?"最好的訓練 · 離家很遠":"錄取機會很低"],
  [mid?"加入本國職業隊青訓":"參加本國職業隊青訓選拔",()=>{if(mid||R()<.5){p.stage="青訓";p.academy=Math.max(1,p.ctier);say("進入本國職業隊的青訓營。",1)}else say("沒選上本國青訓，繼續在業餘隊踢。")},"穩定成長"],
  ["留在學校隊，兼顧課業",()=>{p.stage="學校隊";p.morale+=4;p.school=true},"之後成為職業球員比較難，但退休後出路多"]]);
}
// 可能加盟的球隊：台灣、西非這類小聯賽很少簽外國球員（27 歲以後偶爾有）
function poolFor(p){if(p.twAge!==p.age){p.twAge=p.age;p.smallOk=p.age>=29&&R()<.02}// 沒有本國聯賽的國家：先往同一洲、或傳統上會去的聯賽發展（非洲去法國比利時、東南亞去日韓澳）
 if(!CLUBS.some(c=>c.ct==p.c)){const cf=Object.keys(CONF).find(k=>CONF[k].includes(p.c)),alt={非:["法國","比利時","葡萄牙"],中北美:["美國","墨西哥"],南美:["阿根廷","巴西"],亞:["日本","韓國","澳洲"],歐:["英格蘭","比利時","荷蘭","蘇格蘭"]}[cf]||[];
  return CLUBS.filter(c=>(cf&&CONF[cf].includes(c.ct))||alt.includes(c.ct)||c.tier>=4||p.smallOk)}
 // 出國：依各國球員真實常去的聯賽（加拿大去美國、香港去中國日本、非洲去法國比利時……），或頂級聯賽
 const EXPORT={加拿大:["美國"],哥斯大黎加:["美國","墨西哥"],香港:["中國","日本","韓國"],台灣:["日本","中國","韓國"],越南:["日本","韓國","泰國","澳洲"],泰國:["日本","韓國","澳洲"],印尼:["泰國","日本","澳洲"],馬來西亞:["泰國","日本"],菲律賓:["泰國","日本","澳洲"],印度:["澳洲","日本"],
  澳洲:["日本","蘇格蘭","英格蘭","荷蘭"],紐西蘭:["澳洲","英格蘭"],日本:["德國","比利時","荷蘭","葡萄牙","英格蘭","蘇格蘭"],韓國:["德國","英格蘭","比利時","日本","中國"],中國:["日本","韓國","葡萄牙"],伊朗:["卡達","土耳其","葡萄牙","比利時"],卡達:["沙烏地阿拉伯","比利時"],沙烏地阿拉伯:["卡達","西班牙"],
  奈及利亞:["法國","比利時","英格蘭","土耳其","葡萄牙"],塞內加爾:["法國","比利時","英格蘭"],迦納:["比利時","法國","英格蘭","荷蘭"],象牙海岸:["法國","比利時","英格蘭"],喀麥隆:["法國","比利時","葡萄牙","土耳其"],南非:["比利時","荷蘭","英格蘭"],摩洛哥:["法國","比利時","荷蘭","西班牙","沙烏地阿拉伯"],阿爾及利亞:["法國","比利時","卡達"],突尼西亞:["法國","比利時","卡達"],埃及:["沙烏地阿拉伯","比利時","英格蘭"],
  美國:["德國","英格蘭","荷蘭","墨西哥"],墨西哥:["美國","西班牙","荷蘭","葡萄牙"],巴西:["葡萄牙","西班牙","義大利","英格蘭","法國","沙烏地阿拉伯"],阿根廷:["西班牙","義大利","葡萄牙","墨西哥","美國"],烏拉圭:["西班牙","阿根廷","義大利","葡萄牙"],哥倫比亞:["阿根廷","葡萄牙","西班牙","墨西哥","美國"],厄瓜多:["阿根廷","英格蘭","美國","墨西哥"],智利:["阿根廷","西班牙","墨西哥"],秘魯:["阿根廷","墨西哥","美國"],巴拉圭:["阿根廷","巴西","墨西哥"],委內瑞拉:["阿根廷","美國","哥倫比亞"],
  蘇格蘭:["英格蘭"],威爾斯:["英格蘭"],愛爾蘭:["英格蘭","蘇格蘭"],瑞士:["德國","義大利","英格蘭"],奧地利:["德國","瑞士"],丹麥:["德國","荷蘭","英格蘭","義大利"],瑞典:["丹麥","挪威","荷蘭","德國","義大利"],挪威:["丹麥","瑞典","德國","英格蘭"],波蘭:["德國","義大利","荷蘭"],捷克:["德國","義大利","英格蘭"],匈牙利:["德國","奧地利"],塞爾維亞:["義大利","德國","葡萄牙","土耳其"],烏克蘭:["英格蘭","義大利","西班牙"],希臘:["義大利","德國","葡萄牙"],土耳其:["德國","義大利","荷蘭"],克羅埃西亞:["義大利","德國","西班牙"],比利時:["荷蘭","英格蘭","法國","德國"],荷蘭:["英格蘭","德國","義大利","西班牙"],葡萄牙:["西班牙","英格蘭","法國"]};
 const exp=EXPORT[p.c]||[];
 const cf=Object.keys(CONF).find(k=>CONF[k].includes(p.c)),same=c=>cf&&CONF[cf].includes(c.ct);
 const r=CLUBS.filter(c=>c.ct==p.c||(c.tier>=2&&(c.tier>=3||same(c)))||p.smallOk);
 // 選項太少（例如弱小聯賽的國家）就放寬，避免沒有球隊可簽
 // 優先：本國、真實常去的國家、頂級聯賽（4 級以上，能力夠才會被考慮）
 const r2=CLUBS.filter(c=>c.ct==p.c||(exp.includes(c.ct)&&c.tier>=2)||c.tier>=4||p.smallOk);if(exp.length&&r2.filter(c=>c.ct!=p.c).length>=6)return r2;
 return r.filter(c=>c.ct!=p.c).length>=6?r:CLUBS.filter(c=>c.ct==p.c||c.tier>=2||p.smallOk)}
async function firstContract(){
 const p=P,o=ovr(p);
 if(!p.rel?.agent)await ask(RV("有幾位經紀人想代理你","經紀公司排隊想簽你","一位經紀人在訓練場外等你","爸媽接到好幾通經紀人的電話"),[["簽大牌經紀人（抽成 10%）",()=>{meet(p,"agent",null,75);p.agentCut=.1},"談判力強，挖角機會多"],["讓家人幫你處理",()=>{meet(p,"agent",(p.fam.sib?"哥哥":"爸爸"),55);p.agentCut=.02;p.morale+=3},"可信任，但人脈少"],["找朋友介紹的新手經紀人（抽成 5%）",()=>{meet(p,"agent",null,45+R()*25);p.agentCut=.05},"看運氣"]]);const weak=p.cs<65,seen=c=>c.ct==p.c||(c.tier>=Math.max(2,p.ctier)&&(p.academy==5||(p.scouted&&!weak)||o>=c.str-(weak?3:8))); // 國外球隊要先被球探看到；足球弱國的球員更難被注意
 const offers=poolFor(P).filter(c=>c.str-10<=o+(p.academy||0)*1&&c.str-12<=o&&seen(c)&&(c.tier<5||o>=70||(p.academy==5&&o>=64))).sort((a,b)=>b.str-a.str);
 const home=offers.filter(c=>c.ct==p.c),abroad=offers.filter(c=>c.ct!=p.c);
 const list=[...new Set([home[0],abroad[0],abroad[1],home[1]].filter(Boolean))].slice(0,3);
 if(!list.length){say("沒有職業球隊開出合約。");return}
 await ask(`${p.age} 歲，職業俱樂部遞出合約`,list.map(c=>[`${c.name}（${c.lg}）`,()=>sign(c,3),`球隊實力 ${c.str} · ${roleOf(p,c)}起步 · 週薪約 ${eur(wageOf(c,p)/52)}`]).concat([["先不簽，繼續練一年",()=>{p.a.體能+=2},"之後可能有更好的合約，也可能沒有"]]));
}
// 在球隊裡的角色：實力差太多只能待預備隊，不會出賽職業比賽
// 教練戰術：每支球隊有固定風格，看重的能力不同；你的能力適不適合會影響上場時間
const TAC={控球:["傳球","盤帶"],防守反擊:["速度","防守"],高位壓迫:["體能","防守"],長傳衝吊:["體能","射門"],邊路進攻:["速度","傳球"],全攻全守:["傳球","體能"]};
function clubStyle(c){let h=0;for(const ch of c.name)h=(h*31+ch.charCodeAt(0))%997;return Object.keys(TAC)[h%6]}
function styleFit(p,st){const k=TAC[st];if(!k||p.pos=="GK")return 0;const avg=ATTR.reduce((t,a)=>t+p.a[a],0)/6;return clamp(((p.a[k[0]]+p.a[k[1]])/2-avg)/3,-3,3)}
function roleOf(p,c){const st=p.club==c.name&&p.coachStyle?p.coachStyle:clubStyle(c);const g=styleFit(p,st)+ovr(p)-c.str+(rel(p,"coach")-50)/10+T(p,"職業態度")+T(p,"領袖")-T(p,"火爆");return p.age<17||g<-10?"預備隊":g<-5?"替補":g<0?"輪換":"主力"}
function wageOf(c,p){const W=(P&&P.world)||{},wm=(W.crisis&&W.crisis.until>=p.age&&W.crisis.lg==c.lg?.7:1)*(W.boom&&W.boom.until>=p.age&&W.boom.ct==c.ct?2:1);return wm*Math.max(.003,(1+(rel(p,"agent")-50)/250)*c.pay*Math.pow(1.12,ovr(p)-c.str)*(1+Math.min(3,p.fame/150)))} // 百萬歐元／年：頂級聯賽一般球員約 €5M，巨星可到 €30M 以上
function sign(c,yrs){const p=P;if(!c)return;p.coachStyle=clubStyle(c);setTimeout(()=>{if(P===p&&p.club==c.name&&p._styleSaid!=c.name+p.coachStyle&&(p._styleSaid=c.name+p.coachStyle))say(`${c.name}的總教練偏好「${p.coachStyle}」，看重${TAC[p.coachStyle].join("、")}${styleFit(p,p.coachStyle)>=1?"，正好是你的強項":styleFit(p,p.coachStyle)<=-1?"，不是你的強項":""}。`)},0);meet(p,"coach",null,50+3*T(p,"職業態度")-3*T(p,"火爆"));if(!p.rel?.mate||R()<.5)meet(p,"mate",null,45+R()*15);(p.moves=p.moves||[]).push({y:p.y0+p.age,age:p.age,from:p.club||p.stage,to:c.name,lg:c.lg,fee:p._fee||0,type:p._fee?"轉會":p.club?"自由轉會":"首份合約",yrs});p._fee=0;if(p.club&&p.club!==c.name)say(`離開${p.club}。`);p.club=c.name;p.clubObj=c;p.contract=yrs;p.wage=wageOf(c,p);if(!p.clubsPlayed.includes(c.name))p.clubsPlayed.push(c.name);say(`和${c.name}簽下 ${yrs} 年合約，年薪 ${eur(p.wage)}。`,1)}
// ── 現實的淘汰關卡：大多數孩子會在某一關停下來 ──
function proRescue(p){const o=ovr(p),home=poolFor(P).filter(c=>c.ct==p.c).sort((a,b)=>a.str-b.str)[0],any=poolFor(P).filter(x=>x.tier>=Math.min(2,p.ctier)||x.ct==p.c).sort((a,b)=>Math.abs(a.str-o-8)-Math.abs(b.str-o-8))[0],c=home&&home.str<=o+14?home:any;
 say(pick(["一位老球探在業餘比賽注意到你，推薦給一支低級別球隊。","經紀人幫你找到一份職業合約，雖然是小球隊，但終於是職業球員了。"]),1);sign(c,2)}
function endFootball(reason,after){const p=P;if(p.mode=="pro"&&!p.debut&&!p.club&&p.age<30){proRescue(p);return}p.footEnd=reason;p.after=after||pick(["上班族","體育老師","業餘球隊教練","運動用品店店員","健身教練","工程師","餐廳老闆"]);say(`足球生涯在這裡畫下句點：${reason}`,1)}
async function amateur(){
 const p=P,o=ovr(p);if(p.club||p.footEnd)return;
 if(p.age==19||p.age==21)await ask(`${p.age} 歲，還沒有職業隊願意簽你（目前能力 ${Math.round(o)}）`,[
  ["放棄職業夢，好好讀書或找工作",()=>endFootball(`${p.age} 歲時放棄職業夢。`),"結束足球生涯"],
  ["去低級別球隊試訓",()=>{const c=poolFor(P).filter(x=>x.str<=o+10&&x.ct==p.c).sort((a,b)=>b.str-a.str)[0]||poolFor(P).filter(x=>x.str<=o+10&&x.tier>=Math.max(2,p.ctier)).sort((a,b)=>b.str-a.str)[0];if(c&&R()<.15+Math.max(0,(o-c.str+8)/40))sign(c,1);else say("試訓沒有通過。")},"成功率不高"],
  ["邊打工邊在業餘隊踢，再拚一年",()=>{p.money+=.005;p.morale-=3;p.a.體能+=1},"堅持"]]);
 if(p.mode=="pro"&&p.age>=19&&!p.club&&!p.footEnd){proRescue(p);return}
 if(p.age>=23&&!p.club&&!p.footEnd)endFootball("一直沒有職業球隊願意簽約，終究沒能成為職業球員。");
}
// 16 歲青訓評估：大多數青訓球員在這一關被放走
async function academyReview(){
 const p=P,o=ovr(p),need=53+(p.academy||1)*2.5;if(p.stage!="青訓"||p.age!=16)return;
 if(o>=need){say(`通過 16 歲青訓評估（能力 ${Math.round(o)}），繼續留在青訓營。`,1);return}
 await ask(`16 歲青訓評估沒有通過（能力 ${Math.round(o)}，標準約 ${Math.round(need)}），俱樂部不再續留你`,[
  ["回到學校，好好準備升學",()=>endFootball("16 歲被青訓營放走，回到學校讀書。",pick(["大學生，後來當上工程師","大學生，後來當上老師","大學生，後來進了公司上班"])),"結束足球生涯"],
  ["到低一級球隊的青訓再拚",()=>{p.released=1;p.academy=Math.max(1,(p.academy||1)-1);p.morale-=4;say("轉到低一級球隊的青訓營，從頭開始。")},"堅持下去"],
  ["去踢業餘聯賽，看有沒有奇蹟",()=>{p.released=1;p.stage="業餘";p.morale-=2},"機會很小"]]);
}

// ── 職業球季 ──
async function proSeason(){
 const p=P,c=p.clubObj,PH=["季前備戰","上半季","冬季轉會期","下半季"];
 // 上場時間：看你和球隊實力的差距，受傷會少踢
 const role=p.loanTo?"主力":roleOf(p,c);p.role=role;
 let share={預備隊:0,替補:.18,輪換:.5,主力:.88}[role];
 if(p.banned>0){share=0;p.banned--;say("禁賽中，整季不能上場。")}
 if(role=="預備隊"){p.resYears=(p.resYears||0)+1;say(`還在${c.name}預備隊，本季沒有機會踢一線隊比賽。`)}
 else if(!p.debut){p.debut=p.age;say(`${c.name}一線隊初登場！`,1);p.fame+=3}
 if(p.injuryLeft>0){share*=p.injuryLeft>1?.1:.5;p.injuryLeft--;p.missG=0}
 if(p._starBlock&&role!="預備隊"){share*=.8;say(`和 ${p._starBlock} 搶同一個位置，上場時間變少了。`)}p._starBlock=null;
 share=clamp(share*(.85+R()*.3)*(p.morale<35?.8:1)*(p.world&&p.world.short==p.age?.7:1),0,1);
 const reserve=role=="預備隊"?20+Math.round(R()*8):0,apps=Math.round(38*share),rate={FW:.62,MF:.22,DF:.05,GK:0}[p.pos]*Math.max(.05,(ovr(p)-48)/38),st={apps:0,goals:0,assists:0,cleans:0};
 const capsB=p.caps;p.table=makeTable(p,c);if(role!="預備隊")await seasonGoal(p,apps,rate,c);
 for(let ph=0;ph<4&&!toEnd;ph++){
  p.phase=PH[ph];render();renderPlan();
  await phaseEvent(role=="預備隊"?RESERVE_EVENTS.concat(PRO_EVENTS.slice(0,3)):PRO_EVENTS);
  if(ph>0){const IM=intentMods(p);let n=ph==3?apps-st.apps-(st.lost||0):Math.round(apps/3);if(p.missG>0){const k=Math.min(n,p.missG);n-=k;p.missG-=k;st.lost=(st.lost||0)+k;if(k)say(`因傷缺席 ${k} 場。`)}n=Math.max(0,n);for(let i=0;i<n;i++){st.apps++;if(R()<rate*IM.g)st.goals+=R()<.15?2:1;if(R()<{FW:.2,MF:.28,DF:.08,GK:.01}[p.pos]*(ovr(p)/80)*IM.a)st.assists++;if((p.pos=="GK"||p.pos=="DF"||IM.c>1.1)&&R()<(.25+c.str/400)*IM.c*(p.pos=="GK"||p.pos=="DF"?1:.4))st.cleans++}
   // 場上意向：常待的區域多練到對應能力；選了不適合位置的區域，教練不太高興
   for(const k in IM.grow)p.a[k]+=IM.grow[k]*.5;if(p.intent&&p.intent.zone&&!zoneFit(p,p.intent.zone))rel(p,"coach",-1.5);p.fat=clamp((p.fat||0)*(IM.fat),0,100);
   if(n>0&&!p.missG&&role!="預備隊"&&(ph==1||ph==3)&&R()<.5&&!toEnd){const pos=p.midPos||Math.ceil((p.table?.N||18)/2),N=p.table?.N||18,kinds=[{name:"德比戰",fame:4,scope:"league"},...(pos<=3||ph==1&&c.str>=70?[{name:"爭冠關鍵戰",fame:3,title:"league",scope:"league"}]:[]),...(pos>N-4?[{name:"保級生死戰",fame:3,title:"stay",scope:"league"}]:[]),{name:`${cupName(c.ct)}決賽`,fame:5,ko:1,title:"cup",scope:"cup"}].concat(contOk(c)?[{name:`${CONT_CUP[CONT[c.ct]]}淘汰賽`,fame:CONT[c.ct]=="歐"?6:4,ko:1,title:"ucl",scope:"cont"}]:[]);
    const k=pick(kinds),r=await bigMatch(k,c.str+(R()-.5)*8,c.str+(ovr(p)-c.str)*.3);st.goals+=r.goals;st.assists+=r.assists;
    if(k.title)(p.bigRes=p.bigRes||{})[k.title]=r.res}
   else if(n>0&&R()<.5)await keyMoment(st);if(reserve&&ph==2&&R()<.5){say("預備隊比賽表現亮眼，教練開始注意你。");p.a.盤帶+=.8;p.a.傳球+=.8}}
  if(ph==2&&p.table){const mid=tableAt(p.table,.5),me=mid.find(r=>r.me),gap=mid[0].pts-me.pts;p.midPos=me.pos;say(`冬歇期積分榜：${c.name}第 ${me.pos} 名（${me.pts} 分）${me.pos==1?`，領先第二名 ${me.pts-mid[1].pts} 分`:`，落後榜首 ${gap} 分`}${me.pos>p.table.N-3?"，陷入降級區":""}。`,me.pos<=3||me.pos>p.table.N-3)}
  if(ph==2&&!p.loanTo)await midWindow(st,role);if(p.clubObj!==c)break;
  await playPhase(ph,st,apps);{const b4={...p.a};grow(p,reserve?.45:share,.25);const ch=ATTR.map(k=>[k,p.a[k]-b4[k]]).filter(x=>Math.abs(x[1])>=.4).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,3);if(ch.length)toast(`${p.phase}訓練成果：`+ch.map(([k,d])=>`${k} ${d>0?"+":""}${d.toFixed(1)}`).join("、"))}await injuryCheck(.25);
 }
 if(toEnd){for(let i=st.apps;i<apps;i++){st.apps++;if(R()<rate)st.goals++;if(R()<.15)st.assists++}grow(p,share,.75)}
 const {goals,assists,cleans}=st,played=st.apps;
 const rating=clamp(6+(ovr(p)-c.str)/12+goals*.03+R()*.6,5,9.5);
 p.fame+=2*T(p,"媒體寵兒")+T(p,"正直");
 if(R()<.04*(T(p,"夜生活")+T(p,"貪財")+T(p,"火爆"))){p.fame-=10;p.morale-=6;say(pick(["深夜在夜店和人起衝突，被拍下來上了新聞。","被爆出私下賭球的傳聞，聯盟展開調查。","在比賽中和裁判爭執，被追加禁賽三場。"]),1)}
 p.apps+=played;p.goals+=goals;p.assists+=assists;p.cleans+=cleans;p.money+=p.wage*.45;p.fame+=played*.1+goals*.5+c.tier*c.tier*.5;
 const titles=[],br=p.bigRes||{};p.bigRes={};const lgP=clamp((c.str-64)/80+(c.tier==5?0:.05),.02,.6);
 // 期末積分榜：關鍵戰勝負會影響積分
 let finalPos=null;if(p.table){const me=p.table.rows.find(r=>r.me);me.adj=(br.league=="勝"?4:br.league=="敗"?-3:0)+(br.stay=="勝"?4:br.stay=="敗"?-4:0)+(rating-6.5)*4;const fin=tableAt(p.table,1);finalPos=fin.find(r=>r.me).pos;p.lastTable={t:p.table,rows:fin};
  if(finalPos==1)titles.push(c.lg+"冠軍");say(`${c.lg}最終排名：${c.name}第 ${finalPos} 名${finalPos==1?"，奪冠！":finalPos<=4?"，拿到洲際賽事資格":finalPos>p.table.N-3?"，不幸降級":""}。`,finalPos<=1||finalPos>p.table.N-3);if(finalPos>p.table.N-3){p.morale-=6;p.relegated=1}}
 else if(R()<lgP)titles.push(c.lg+"冠軍");if(br.cup?br.cup=="勝":R()<lgP*.8)titles.push(cupName(c.ct)+"冠軍");
 if(contOk(c)){const eu=CONT[c.ct]=="歐",base=eu?76:62;if(br.ucl=="勝"?R()<clamp((c.str-base)/30,.08,.6):br.ucl=="敗"?false:R()<clamp((c.str-base-4)/60,.02,.25))titles.push(CONT_CUP[CONT[c.ct]]+"冠軍")}
 // 沒上場（預備隊）不算拿到冠軍，只是球隊奪冠
 if(!played&&titles.length){say(`${c.name}拿下${titles.join("、")}，但你整季在預備隊，沒有獎牌。`);titles.length=0}
 titles.forEach(t=>{p.trophies.push([p.y0+p.age,t]);say(`🏆 ${c.name}拿下${t}！`,1);p.morale+=5});
 // 球季細項數據
 const starts=Math.round(played*({主力:.9,輪換:.55,替補:.12}[role]||0)),mins=starts*82+(played-starts)*22;
 let motm=0,yel=0,red=0;for(let i=0;i<played;i++){if(R()<clamp((rating-6.4)/9,0,.35))motm++;if(R()<.07+(p.pos=="DF"?.06:0)+.04*T(p,"火爆"))yel++;if(R()<.006+.01*T(p,"火爆"))red++}
 // 個人獎項：看聯賽等級、評分與數據
 const yr=p.y0+p.age,lg=c.lg.replace("聯賽",""),aw=[];
 const award=(n,ok,fame)=>{if(ok){aw.push(n);p.awards.push([yr,n]);p.fame+=fame||3}};
 award(`${lg}金靴獎`,p.pos!="GK"&&goals>=(c.tier>=4?20:14)&&R()<.7,8);
 award(`${lg}助攻王`,assists>=(c.tier>=4?13:11)&&R()<.6,5);
 award(`${lg}金手套獎`,p.pos=="GK"&&cleans>=(c.tier>=4?14:12)&&R()<.6,5);
 award(`${lg}年度最佳球員`,rating>=7.35&&played>=25&&R()<.4,c.tier*4);
 award(`${lg}年度最佳年輕球員`,p.age<=21&&rating>=6.85&&played>=15&&R()<.6,4);
 award(`${lg}年度最佳陣容`,rating>=7.0&&played>=25&&R()<.6,3);
 if(rating>=6.9&&played>=10)for(let m=0;m<3;m++)if(R()<.15)award(`${lg}月最佳球員`,true,1);
 award(`${p.c}年度足球先生`,rating>=6.8&&ovr(p)>=p.cs-6&&played>=20&&R()<.35,6);
 award("金球獎提名",ovr(p)>=84&&rating>=7.1&&c.tier>=4&&R()<.6,10);
 award("世界足球先生",ovr(p)>=88&&rating>=7.8&&c.tier>=4&&(p._sb?ovr(p)+(rating-7.5)*4+R()*3>p._sb.sc:R()<.35),30);
 // 頒獎典禮：世界足球先生前三名候選人
 {const me={n:p.name+"（你）",club:c.name,sc:ovr(p)+(rating-7.5)*4,me:1},cands=[me,...(p.stars||[]).filter(s=>s.active&&s.club&&CLUBS.find(x=>x.name==s.club)?.tier>=4).map(s=>({n:s.n,club:s.club,sc:s.o+R()*3}))].sort((a,b)=>b.sc-a.sc);
  const win=aw.includes("世界足球先生")?me:(p._sb?cands.find(x=>x.n==p._sb.s.n)||{n:p._sb.s.n,club:p._sb.s.club}:null);p._gala={aw:aw.slice(),top:win?[win,...cands.filter(x=>x!==win).slice(0,2)]:[],myRank:cands.indexOf(me)+1,n:cands.length}}
 if(p._sb){if(aw.includes("世界足球先生"))say(`擊敗 ${p._sb.s.n}，拿下世界足球先生！`,1);else{p._sb.s.aw++;say(`🌍 本屆世界足球先生：${p._sb.s.n}（${p._sb.s.club}）`)}}p._sb=null;
 if(aw.length)say(`🥇 本季個人獎項：${aw.join("、")}`,1);
 // 名氣會隨時間淡去：不持續表現就會被遺忘；生活開銷吃掉一部分存款
 p.fame*=.88;p.maxFame=Math.max(p.maxFame||0,p.fame);if(p.money>2)p.money-=p.money*.02;
 await mediaYear(rating);
 await national(rating);goalCheck(p,{goals,assists,cleans,apps:played,rating,titles,caps:p.caps-capsB});
 p.seasons.push({pos:finalPos,fans:Math.round(p.fans),pop:Math.round(p.pop),y:p.y0+p.age,age:p.age,club:c.name,lg:c.lg,role,wage:p.wage,cleans,starts,mins,motm,yel,red,aw,apps:played,goals,assists,rating:+rating.toFixed(2),ovr:ovr(p),titles,val:value(p)});
 await seasonCard(p.seasons[p.seasons.length-1]);
 if(reserve&&!played)say(`本季在預備隊出賽 ${reserve} 場（不列入職業紀錄）。`);else say(`本季（${role}）：出賽 ${played} 場，${p.pos=="GK"?`零封 ${cleans} 場`:`進 ${goals} 球、助攻 ${assists} 次`}，平均評分 ${rating.toFixed(1)}。身價 ${eur(value(p))}。`);
 if(p.loanTo){say(`租借結束，回到${p.loanFrom.name}。`);p.club=p.loanFrom.name;p.clubObj=p.loanFrom;p.loanTo=null;p.loanFrom=null}
 else if(role=="預備隊"&&p.age>=18)await ask(RV(`在${c.name}預備隊待了 ${p.resYears} 年，教練建議你外租`,`${c.name}預備隊第 ${p.resYears} 年，一線隊還是沒有你的位置`,`預備隊教練說，再待下去會浪費你的 ${p.age} 歲`),[
  ["租借到低一級的球隊打主力",()=>{const lo=poolFor(P).filter(x=>x.str<=ovr(p)+3&&x.str>=ovr(p)-6&&x.name!=c.name).sort(()=>R()-.5)[0];if(lo){p.loanFrom=c;p.loanTo=lo;p.club=lo.name;p.clubObj=lo;if(!p.clubsPlayed.includes(lo.name))p.clubsPlayed.push(lo.name);say(`租借到${lo.name}一季。`,1)}},"上場時間↑ 進步↑"],
  ["留下來繼續拚",()=>{p.morale-=3},"可能繼續坐冷板凳"],["要求解約，自己找球隊",()=>{p.contract=0},"風險高"]]);
 p.contract--;if(!p.loanTo)await transferWindow(rating,share);await lifeOff();await retireCheck();
}
// 青少年（還沒簽職業約）：上下兩個學期，各有一個抉擇
async function youthYear(minutes){
 const p=P;for(let h=0;h<2;h++){if(!toEnd&&(h==0||p.age>=15))await phaseEvent(YOUTH_EVENTS);grow(p,minutes,.5);injuryCheck(.5);render();renderPlan()}
}
async function national(rating){
 const p=P,need=Math.max(55,p.cs-4);
 if(!p.intlRetired&&ovr(p)>=need&&rating>=6.3&&p.role!="預備隊"&&p.age>=18){const g=p.pos=="FW"?Math.round(R()*4*Math.max(0,(ovr(p)-60)/30)):p.pos=="MF"?Math.round(R()*1.5):0;const caps=4+Math.round(R()*6);
  if(!p.caps)say(`第一次入選${p.c}國家隊！`,1);(p.stars||[]).filter(s=>s.active&&s.c==p.c&&s.o>=72&&!s.nat).forEach(s=>{s.nat=1;say(`在國家隊和 ${s.n} 成為隊友。`,1)});p.caps+=caps;p.intlGoals+=g;(p.intl=p.intl||[]).push({y:p.y0+p.age,age:p.age,caps,g});p.fame+=caps*.5;
  const y=p.y0+p.age;
  if(y%4==2){const strength=p.cs+(ovr(p)-p.cs)*.15;let stage=strength>=86?pick(["八強","四強","亞軍","冠軍","十六強"]):strength>=80?pick(["小組賽","十六強","八強","四強"]):strength>=72?pick(["小組賽","小組賽","十六強"]):"沒有晉級會內賽";
   if(stage!="沒有晉級會內賽"&&!toEnd){const r=await bigMatch({name:`${y} 世界盃淘汰賽`,team:p.c,opp:pick(COUNTRIES.filter(x=>x[0]!=p.c&&Math.abs(x[2]-p.cs)<8).map(x=>x[0]).concat(["地主國"])),ko:1,fame:8},p.cs,strength);
    const order=["小組賽","十六強","八強","四強","亞軍","冠軍"];let i=order.indexOf(stage);i=r.res=="勝"?Math.min(5,i+1):Math.max(0,i-1);stage=order[i]}
   if(stage=="沒有晉級會內賽")say(`${p.c}在${y}年世界盃資格賽止步。`);else{say(`⚽ 代表${p.c}出戰 ${y} 年世界盃，最後打到${stage}。`,1);p.wc=(p.wc||0)+1;if(stage=="冠軍"){p.trophies.push([y,"世界盃冠軍"]);p.fame+=40}}}
  await natTourney(p,y,rating);
  // 資深國腳可能被選為國家隊隊長
  if(!p.natCap&&p.caps>=40&&p.age>=26&&ovr(p)>=need+4&&R()<.35){p.natCap=1;p.fame+=6;say(`被任命為${p.c}國家隊隊長！`,1)}
 }
}
// ── 國家隊洲際賽事：歐國盃、美洲盃、亞洲盃、非洲國家盃、金盃，照真實週期 ──
const CONF={歐:["英格蘭","法國","西班牙","德國","義大利","葡萄牙","荷蘭","比利時","克羅埃西亞","瑞士","丹麥","奧地利","塞爾維亞","土耳其","瑞典","波蘭","烏克蘭","挪威","捷克","匈牙利","蘇格蘭","希臘","威爾斯","愛爾蘭"],南美:["巴西","阿根廷","烏拉圭","哥倫比亞","厄瓜多","智利","秘魯","巴拉圭","委內瑞拉"],中北美:["美國","墨西哥","加拿大","哥斯大黎加"],亞:["日本","韓國","沙烏地阿拉伯","中國","台灣","澳洲","伊朗","卡達","越南","泰國","印尼","馬來西亞","印度","菲律賓","香港"],非:["奈及利亞","塞內加爾","摩洛哥","迦納","埃及","象牙海岸","喀麥隆","南非","阿爾及利亞","突尼西亞"]};
const NT={歐:["歐洲國家盃",y=>y%4==0],南美:["美洲盃",y=>y%4==0],中北美:["中北美金盃",y=>y%2==1],亞:["亞洲盃",y=>y%4==3],非:["非洲國家盃",y=>y%2==1]};
async function natTourney(p,y,rating){const cf=Object.keys(CONF).find(k=>CONF[k].includes(p.c));if(!cf)return;const [tn,when]=NT[cf];if(!when(y))return;
 const rivals=CONF[cf].filter(x=>x!=p.c),str=p.cs+(ovr(p)-p.cs)*.15,top=Math.max(...rivals.map(x=>(COUNTRIES.find(c=>c[0]==x)||[,,60])[2]));
 if(p.cs<62&&R()<.8){say(`${p.c}在${y}年${tn}資格賽止步。`);return}
 const order=["小組賽","八強","四強","亞軍","冠軍"];let i=clamp(Math.round((str-top+12)/6+R()*1.5),0,3);
 if(!toEnd){const opp=pick(rivals.filter(x=>Math.abs(((COUNTRIES.find(c=>c[0]==x)||[,,60])[2])-p.cs)<10).concat(rivals.slice(0,1))),os=(COUNTRIES.find(c=>c[0]==opp)||[,,p.cs])[2];
  const r=await bigMatch({name:`${y} ${tn}${i>=2?"決賽":"淘汰賽"}`,team:p.c,opp,ko:1,fame:5},os,str);i=r.res=="勝"?(i>=2?4:i+1):Math.max(0,i)}
 const stage=order[i];say(`⚽ 代表${p.c}出戰 ${y} 年${tn}，最後打到${stage}。`,1);
 if(stage=="冠軍"){p.trophies.push([y,tn+"冠軍"]);p.fame+=cf=="歐"||cf=="南美"?25:12;if(rating>=7.1&&R()<.4){p.awards.push([y,`${tn}最佳球員`]);say(`🥇 獲選${tn}最佳球員！`,1)}}}
// ── 轉會談判：比較每個報價（年薪、預估角色、球隊實力），選了之後還可以討價還價 ──
function offerOf(x,p){const w=wageOf(x,p)*(.85+R()*.45);return {c:x,w,role:roleOf(p,x),yrs:2+Math.floor(R()*3)}}
function offerLine(o,cur){const d=cur?o.w/cur-1:0,st=clubStyle(o.c),f=styleFit(P,st);return `${o.c.lg} · 實力 ${o.c.str} · 戰術「${st}」${f>=1?"適合你":f<=-1?"不太適合你":""} · 預估${o.role} · 年薪 ${eur(o.w)}${cur?`（${d>=0?"+":""}${Math.round(d*100)}%）`:""} · ${o.yrs} 年`}
async function negotiate(o,fee){const p=P;let w=o.w,yrs=o.yrs,ok=true;const ag=rel(p,"agent");
 await ask(`和${o.c.name}談合約：年薪 ${eur(w)}、${yrs} 年、預估${o.role}`,[
  ["直接簽",()=>{},"不冒險"],
  ["要求年薪再加 20%",()=>{if(R()<.45+(ag-50)/150+(p.fame>100?.1:0)){w*=1.2;say(`${o.c.name}同意加薪，年薪 ${eur(w)}。`,1)}else if(R()<.35){ok=false;say(`${o.c.name}覺得你要價太高，撤回報價。`,1)}else say(`${o.c.name}不肯加，維持原本的條件。`)},"可能加薪 · 也可能談崩"],
  ["要求主力保證",()=>{if(o.role=="主力"||R()<.4+(ag-50)/200){p.starPromise=1;say(`${o.c.name}承諾讓你打主力。`,1)}else{w*=.95;say("球隊不願保證，你只好讓步。")}},o.role=="主力"?"本來就是主力":"成功的話教練更信任你"],
  ["加一條解約金條款",()=>{p.releaseClause=true;w*=.95;say("合約加上解約金條款，之後比較容易轉走。")},"年薪稍降 · 之後好轉會"],
  ["簽長約（5 年）換穩定",()=>{yrs=5;w*=.95},"年薪稍降 · 比較安穩"],...traitOpt(p,"money").map(x=>[x[0],()=>{const b=p.wage;p.wage=w;x[1]();w=p.wage;p.wage=b},x[2]])]);
 if(!ok)return false;if(fee){p._fee=fee;p.fame+=fee*.2;say(`以 ${eur(fee)} 的轉會費加盟${o.c.name}。`,1)}
 sign(o.c,yrs);p.wage=w;if(p.starPromise){meet(p,"coach",null,72);p.starPromise=0}return true}
async function transferWindow(rating,share){
 const p=P,o=ovr(p),c=p.clubObj;
 const seen=x=>x.ct==p.c||((x.tier>=2||p.age>=26)&&(p.fame>(p.cs<65?60:25)||o>=x.str-(p.cs<65?0:2)));
 const up=poolFor(P).filter(x=>x.name!=c.name&&x.str>c.str&&x.str<=o+4&&seen(x)).sort(()=>R()-.5),side=poolFor(P).filter(x=>x.name!=c.name&&Math.abs(x.str-o)<5).sort(()=>R()-.5),money=poolFor(P).filter(x=>x.ct=="沙烏地阿拉伯"||x.ct=="美國");
 const offers=[];if(rating>=7&&up[0])offers.push(up[0]);if(share<.4&&side[0])offers.push(side[0]);if(p.age>=29&&o>=72&&R()<.4)offers.push(pick(money));
 if(p.contract<=0){if(p.goHome){const h=poolFor(p).filter(x=>x.ct==p.c).sort((a,b)=>b.str-a.str)[0];if(h)offers.unshift(h);p.goHome=0}if(!offers.length&&side[0])offers.push(side[0]);
  const stay=c.str<=o+6;
  // 合約到期：多一兩支球隊來詢問，讓你比較
  side.slice(1,3).forEach(x=>{if(!offers.includes(x)&&offers.length<4)offers.push(x)});
  const OF=offers.filter(Boolean).slice(0,4).map(x=>offerOf(x,p));let pickO=null;
  await ask(RV(`和${c.name}的合約到期了`,`合約走到最後一年，${c.name}找你談未來`,`${c.name}的合約要結束了，經紀人問你的打算`,`合約到期，你成為自由球員`),[...(stay?[[`和${c.name}續約`,()=>{p.contract=3;p.wage=wageOf(c,p);say(`和${c.name}續約 3 年，年薪 ${eur(p.wage)}。`)},`年薪約 ${eur(wageOf(c,p))} · 預估${roleOf(p,c)}`]]:[]),...OF.map(o=>[`和${o.c.name}談`,()=>{pickO=o},offerLine(o,p.wage)])].concat(stay||offers.length?[]:[["降到低級別聯賽",()=>sign(poolFor(P).filter(x=>x.str<=o+6).sort((a,b)=>b.str-a.str)[0]||CLUBS[CLUBS.length-1],2),""]]),stay?"":`${c.name}沒有打算續約。`);if(pickO&&!(await negotiate(pickO,0))){const alt=OF.find(o=>o!==pickO);if(alt){say(`轉而和${alt.c.name}簽約。`);sign(alt.c,alt.yrs);p.wage=alt.w}else if(stay){p.contract=2;p.wage=wageOf(c,p);say(`只好回頭和${c.name}續約。`)}}return}
 if(!offers.length&&p.role!="主力"&&R()<.12){const to=poolFor(p).filter(x=>x.name!=c.name&&Math.abs(x.str-o)<6).sort(()=>R()-.5)[0];if(to){const fee=value(p)*(.7+R()*.3);p._fee=fee;say(`${c.name}為了清理陣容，把你以 ${eur(fee)} 賣給${to.name}。`,1);sign(to,3);return}}
 if(!offers.length)return;
 const fee=value(p)*(1+R()*.4);
 const OF=offers.filter(Boolean).slice(0,3).map(x=>offerOf(x,p));let pickO=null;
 await ask(RV("轉會窗開啟，有球隊報價",`轉會窗開啟，${OF.length} 支球隊對你有興趣`,"經紀人帶來了幾份報價"),[...OF.map(o=>[`和${o.c.name}談`,()=>{pickO=o},offerLine(o,p.wage)+` · 轉會費約 ${eur(fee)}`]),["留下來，忠於球隊",()=>{p.morale+=3;p.fame+=1;plant(p,"loyal",3+Math.floor(R()*2))},`目前年薪 ${eur(p.wage)} · ${p.role||""} · 會影響未來`]]);
 if(pickO&&!(await negotiate(pickO,fee))){p.morale-=2}
}
async function lifeOffPlaceholder(){}
// 合約還沒到期也可能被挖角或被賣掉
async function midWindow(st,role){const p=P,c=p.clubObj,o=ovr(p),hot=st.apps>8&&(st.goals+st.assists)/Math.max(1,st.apps)>.35;
 const interest=(hot?.35:.08)+(p.releaseClause?.12:0)+.08*T(p,"媒體寵兒")+(rel(p,"agent")-50)/400;
 if((role=="替補"||role=="預備隊")&&R()<.18){const to=poolFor(p).filter(x=>x.name!=c.name&&x.str<=o+4&&x.str>=o-8).sort(()=>R()-.5)[0];if(to){const fee=value(p)*(.6+R()*.4);
   await ask(`冬季轉會窗：${c.name}已經接受${to.name}的報價，準備把你賣掉`,[["接受，去新球隊找出路",()=>{p._fee=fee;say(`被${c.name}賣到${to.name}，轉會費 ${eur(fee)}。`,1);sign(to,3)},"上場機會↑"],["拒絕轉會，留下來爭取",()=>{p.morale-=6;if(R()<.5){p.contract=Math.min(p.contract,1);say("拒絕轉會後被教練冷凍。")}},"可能被冷凍"]],"球隊覺得你在這裡沒有未來");return}}
 if(R()<interest){const to=poolFor(p).filter(x=>x.name!=c.name&&x.str>c.str&&x.str<=o+6).sort(()=>R()-.5)[0];if(!to)return;const fee=value(p)*(1.2+R()*.8);
  await ask(`冬季轉會窗：${to.name}對你提出 ${eur(fee)} 的報價`,[["要求球隊放人",()=>{if(R()<(p.releaseClause?.9:.6)){p._fee=fee;say(`${c.name}同意放人，以 ${eur(fee)} 轉會到${to.name}。`,1);p.fame+=fee*.2;sign(to,4)}else{p.morale-=4;say(`${c.name}拒絕放人，說你還有合約在身。`)}},"球隊不一定放"],["留下來完成這個賽季",()=>{p.morale+=2},"球迷好感↑"],["叫經紀人用報價談加薪",()=>{p.wage*=1.15;p.contract+=1;say(`用挖角報價談成加薪，年薪 ${eur(p.wage)}。`)},"年薪↑"]],"合約還沒到期，但其他球隊還是可以出價挖角")}}
async function seasonCard(s){const p=P;if(auto||toEnd){p._gala=null;return}return queueModal(()=>seasonCardNow(s))}
async function seasonCardNow(s){const p=P;
 const cell=(k,v)=>`<div class="stat"><span>${k}</span><b>${v}</b></div>`;
 return new Promise(res=>{$("mtag").textContent=`${s.y} 球季總結 · ${s.age} 歲`;$("modal").classList.remove("hide");
  $("choice").innerHTML=`<h2 style="margin-top:10px">${s.club}（${s.lg}）· ${s.role}</h2><div class="grid">${[["出賽",s.apps],["先發",s.starts],["上場分鐘",s.mins.toLocaleString()],[p.pos=="GK"?"零封":"進球",p.pos=="GK"?s.cleans:s.goals],["助攻",s.assists],["平均評分",s.rating.toFixed(2)],["全場最佳",s.motm+" 次"],["黃牌／紅牌",`${s.yel}／${s.red}`],["能力",s.ovr],["身價",eur(s.val)]].map(([k,v])=>cell(k,v)).join("")}</div>
   ${s.pos?`<p>📊 聯賽排名：第 <b>${s.pos}</b> 名</p>`:""}${p.lastTable&&s.pos?tableHTML(p.lastTable.t,p.lastTable.rows):""}
   ${s.titles.length?`<p>🏆 ${s.titles.join("、")}</p>`:""}
   ${(()=>{const g=p._gala;if(!g)return "";return `<div class="gala"><div class="gala-h">🎖 年度頒獎典禮</div>${g.aw.length?`<div>你獲得：${g.aw.map(a=>`<span class="trait">${a}</span>`).join(" ")}</div>`:`<div class="mut">今年沒有拿到個人獎項。</div>`}${g.top.length?`<div style="margin-top:6px"><b>世界足球先生</b>${g.top.map((x,i)=>`<div class="gala-r${i==0?" w":""}">${["👑","2","3"][i]}　${esc(x.n)}<small>${esc(x.club||"")}</small></div>`).join("")}${g.myRank>3&&g.n>3?`<div class="mut" style="font-size:12px">你在候選名單排第 ${g.myRank} / ${g.n}</div>`:""}</div>`:""}</div>`})()}<button class="opt" id="scOk">繼續下一季 ▶</button>`;
  $("scOk").onclick=()=>{p._gala=null;$("modal").classList.add("hide");res()}})}
async function lifeOff(){
 const p=P;if(p.partner&&rel(p,"partner")<25&&R()<.4){say(`和 ${p.rel.partner.name} 分開了。`,1);p.partner=false;p.morale-=10;delete p.rel.partner}
 if(!p.partner&&p.age>=22&&p.age<=34&&R()<.2&&p.age-(p.lastMeet||0)>=4&&(p.lastMeet=p.age))await ask(RV("在朋友聚會上認識了一個人","在咖啡店遇到一個聊得來的人","隊友介紹了一位朋友給你認識","在慈善活動上認識了一個人"),[["認真交往",()=>{p.partner=true;meet(p,"partner",newName(p),70);p.morale+=6;say("和對方開始交往，後來結了婚。",1)},"心情↑"],["球季忙，先不談感情",()=>{}],["只想玩玩",()=>{p.fame-=2;if(R()<.3){p.fame-=6;say("緋聞上了八卦版面。")}},"可能鬧緋聞"]]);
 if(p.partner&&p.age<40&&R()<.12){p.kids++;p.morale+=5;say(`第 ${p.kids} 個孩子出生了。`,1)}
 if(p.age>=20&&R()<.08&&p.age-(p.lastNight||0)>=5&&(p.lastNight=p.age))await ask(RV("隊友約你去夜店慶祝","奪冠派對續攤到凌晨，大家還不想散","客場比賽後，老隊友約你去酒吧"),[...traitOpt(p,"party"),["一起去，玩到天亮",()=>{tag(p,"夜生活");p.a.體能-=2;p.morale+=3;if(R()<.25){p.fame-=8;say("凌晨被拍到醉醺醺，球隊罰了一週薪水。")}plant(p,"party",2+Math.floor(R()*3))},"可能被拍 · 會影響未來"],["去一下就回家",()=>{p.morale+=1}],["不去，早點睡",()=>{p.a.體能+=1}]]);
 if(p.money>1&&R()<.08&&p.age-(p.lastInv||0)>=6&&(p.lastInv=p.age))await ask(RV("經紀人推薦一個投資機會","朋友找你合夥開店","理財顧問說有一筆好生意"),[["投一大筆到餐廳生意",()=>{const r=R()<.4?2:.3;p.money*=r>1?1.3:.75;say(r>1?"餐廳生意很好，多了一筆收入。":"餐廳經營不善，賠了不少。")},"有賺有賠"],["買房子給爸媽",()=>{p.money*=.85;p.morale+=6;say("買了一間房子送給爸媽。",1)},"心情↑"],["存起來",()=>{}]]);
}
async function retireCheck(){
 const p=P,o=ovr(p);if(p.lastSeason){retire("踢完最後一季，在全場起立鼓掌中退休。");return}
 if(p.age>=40||(p.age>=24&&o<45)){retire("身體已經跟不上，宣布退休。");return}
 if((p.age>=34+T(p,"會保養")+T(p,"自律")+(p.retireBonus||0)&&R()<.3)||(p.age>=30&&o<p.clubObj.str-12))await ask(`${p.age} 歲，要繼續踢下去嗎？`,[["再踢一季",()=>{},"能力會持續下滑"],["退休，留下美好的回憶",()=>retire("宣布退休，向球迷告別。"),""],["到美國或沙烏地踢最後幾年",()=>{const c=pick(poolFor(P).filter(x=>x.ct=="沙烏地阿拉伯"||x.ct=="美國"));sign(c,2)},"收入高 · 競爭低"]]);
}
function retire(t){const p=P;p.retired=true;p.retireAge=p.age;say(t,1);p.club=null;p.clubObj=null}
// 退休第一年：告別賽、球衣退役、俱樂部名人堂
async function ceremony(p){if(!p.debut)return;p.honors=p.honors||[];
 const by={};p.seasons.forEach(s=>{const b=by[s.club]=by[s.club]||{apps:0,goals:0,tro:0,yrs:0};b.apps+=s.apps;b.goals+=s.goals;b.tro+=s.titles.length;b.yrs++});
 const best=Object.entries(by).sort((a,b)=>(b[1].apps+b[1].tro*30)-(a[1].apps+a[1].tro*30))[0];
 if(best&&(best[1].apps>=120||best[1].tro>=2||p.peak>=78)){const [club,b]=best;
  await ask(`${club}想為你辦一場告別賽`,[["邀請所有老隊友回來踢",()=>{p.morale+=8;p.fame+=5;say(`在${club}的告別賽，老隊友全都回來了，最後一分鐘你被換下場，全場起立鼓掌。`,1)},"感動"],["門票收入全部捐給青訓",()=>{tag(p,"正直");p.fame+=6;say(`告別賽的門票收入全部捐給${club}青訓營。`,1)},"形象↑"],["低調離開，不辦了",()=>{say("沒有辦告別賽，安靜地離開了球場。")},""]]);
  if(b.apps>=180||b.tro>=4||(b.apps>=120&&p.peak>=82)){p.honors.push(`${club}退役 ${p.no||pick([7,8,9,10,11,14,17,23])} 號球衣`);say(`🎽 ${club}宣布退役你的球衣號碼。`,1)}
  if(b.apps>=150||b.tro>=3){p.honors.push(`入選${club}名人堂`);say(`🏛 入選${club}名人堂。`,1)}}
 if(p.caps>=60){p.honors.push(`${p.c}國家隊百大傳奇`);say(`${p.c}足協把你列入國家隊傳奇名單。`,1)}
 if(p.peak>=88&&p.trophies.length>=6){p.honors.push("國際足球名人堂");say("🏛 入選國際足球名人堂！",1)}}
async function afterLife(){
 const p=P;p.fame*=.95;p.money=Math.max(0,p.money-Math.max(.02,p.money*.03));if(!p.ceremonyDone){p.ceremonyDone=1;await ceremony(p)}
 if(!p.after){await ask("退休後，你想做什麼？",[["當教練",()=>{p.after="教練";say("考取教練證照，從青訓教練做起。",1)},T(p,"領袖")?"你有領袖特質，執教更順利":"從青訓開始"],["當球評、名嘴",()=>{p.after="球評";p.fame+=3;say("成為電視台的球評。",1)},"需要名氣",()=>p.fame>40||T(p,"媒體寵兒")>0],["當球探",()=>{p.after="球探";say("加入球探部門，到處看比賽找天才。",1)},T(p,"球商")?"你的球商讓你更會看人":"到處跑"],["開足球學校",()=>{p.after="足球學校";p.money*=.8;say("在家鄉開了一間兒童足球學校。",1)},"花一筆錢"],["好好休息，陪家人",()=>{p.after="陪伴家人";p.morale+=10},""]].concat(p.mateDream?[[`和 ${p.rel?.mate?.name||"老隊友"} 一起開足球學校`,()=>{p.after="和老隊友開足球學校";say("實現了當年的約定，和老隊友一起開了足球學校。",1)},"當年的約定"]]:[]));return}
 // 選好退休後的路，再問要不要快轉
 if(p.after&&!p.postMode)await ask("退休後的日子要怎麼過？",[["⏩ 快轉到人生結局",()=>{p.postMode="fast";toEnd=true;say("快轉退休後的人生……")},"直接看最後的生涯證書與報表"],["經歷幾個重要時刻",()=>{p.postMode="live"},"大約 3 個抉擇，其他自動進行"]]);
 if(p.age<71)await postCareer(p);
 if(p.after=="足球學校"&&R()<.06)say("足球學校有一個學生入選了國家青年隊。",1);
 if(p.age>=50&&R()<.05)say(pick(["受邀回老東家參加傳奇賽，球迷全場起立鼓掌。","膝蓋的舊傷讓走路越來越吃力。","和當年的隊友聚餐，聊起那些年的比賽。"]));
 p.health-=p.age>65?2.5:.5;const q=p.age<70?.006:Math.exp((p.age-80)/9)*.05*(1+(100-p.health)/80);
 if(R()<q||p.age>=104){p.alive=false;say(`在 ${p.age} 歲時安詳離世。`,1)}
}

// ── 平行世界的同世代：5 位巨星、10 位一線球星（真實）＋ 15 位同期普通人（虛構），都和你同年出生 ──
// [名字, 國家, 位置, 潛力下限, 潛力上限]；上限 ≥ 93 的是巨星
const STARS=[["梅西","阿根廷","FW",93,97],["C羅","葡萄牙","FW",92,96],["姆巴佩","法國","FW",91,95],["哈蘭德","挪威","FW",90,94],["亞馬爾","西班牙","FW",89,94],["內馬爾","巴西","FW",89,93],
 ["德布勞內","比利時","MF",89,93],["貝林厄姆","英格蘭","MF",88,93],["萊萬多夫斯基","波蘭","FW",88,92],["范戴克","荷蘭","DF",88,91],["莫德里奇","克羅埃西亞","MF",87,91],["諾伊爾","德國","GK",88,92],
 ["本澤馬","法國","FW",87,91],["蘇亞雷斯","烏拉圭","FW",87,91],["薩拉赫","埃及","FW",87,91],["凱恩","英格蘭","FW",87,91],["維尼修斯","巴西","FW",87,91],["羅德里","西班牙","MF",87,91],
 ["庫爾圖瓦","比利時","GK",87,91],["拉莫斯","西班牙","DF",86,90],["克羅斯","德國","MF",86,90],["坎特","法國","MF",86,89],["阿利森","巴西","GK",86,89],["佩德里","西班牙","MF",85,89],
 ["穆夏拉","德國","MF",85,89],["孫興慜","韓國","FW",84,89],["馬內","塞內加爾","FW",84,88],["勞塔羅","阿根廷","FW",84,88],["唐納魯瑪","義大利","GK",85,88],["魯迪格","德國","DF",84,87],
 ["阿諾德","英格蘭","DF",84,88],["奧斯梅恩","奈及利亞","FW",83,87],["哈基米","摩洛哥","DF",83,87],["金玟哉","韓國","DF",83,87],["薩卡","英格蘭","FW",84,88],["福登","英格蘭","MF",84,88],
 ["萊斯","英格蘭","MF",84,87],["維爾茨","德國","MF",85,89],["瓦爾韋德","烏拉圭","MF",85,88],["巴雷拉","義大利","MF",83,87],["巴斯托尼","義大利","DF",83,87],["基耶薩","義大利","FW",82,86],
 ["格列茲曼","法國","FW",85,89],["琴丹尼","法國","MF",84,88],["薩利巴","法國","DF",84,87],["B費爾南德斯","葡萄牙","MF",85,88],["B席爾瓦","葡萄牙","MF",85,88],["迪亞斯","葡萄牙","DF",85,88],
 ["萊奧","葡萄牙","FW",83,87],["德容","荷蘭","MF",84,87],["加克波","荷蘭","FW",82,86],["德利赫特","荷蘭","DF",82,86],["盧卡庫","比利時","FW",83,87],["多庫","比利時","FW",81,85],
 ["格瓦迪奧爾","克羅埃西亞","DF",84,87],["羅德里戈","巴西","FW",84,87],["卡塞米羅","巴西","MF",85,88],["馬奎尼奧斯","巴西","DF",85,87],["埃德森","巴西","GK",85,88],["麥卡利斯特","阿根廷","MF",83,87],
 ["恩佐","阿根廷","MF",82,86],["迪馬利亞","阿根廷","FW",84,87],["E馬丁內斯","阿根廷","GK",83,86],["J阿瓦雷茲","阿根廷","FW",83,87],["哈梅斯","哥倫比亞","MF",83,87],["路易斯迪亞斯","哥倫比亞","FW",82,86],
 ["洛薩諾","墨西哥","FW",79,83],["普利西奇","美國","FW",81,85],["奧喬亞","墨西哥","GK",79,83],["齊耶赫","摩洛哥","MF",81,85],["阿姆拉巴特","摩洛哥","MF",79,83],["庫利巴利","塞內加爾","DF",82,86],
 ["門迪","塞內加爾","GK",80,84],["奧斯曼","奈及利亞","FW",79,83],["帕提","迦納","MF",79,83],["三笘薰","日本","FW",80,85],["久保建英","日本","MF",80,85],["遠藤航","日本","MF",79,83],
 ["李康仁","韓國","MF",79,84],["黃喜燦","韓國","FW",78,82],["武磊","中國","FW",72,77],["艾克森","中國","FW",72,76],["厄德高","挪威","MF",85,89],["艾瑞克森","丹麥","MF",83,87],["恰爾汗奧盧","土耳其","MF",83,86],["弗拉霍維奇","塞爾維亞","FW",83,87],["馬赫雷斯","阿爾及利亞","FW",84,87],["奧納納","喀麥隆","GK",82,86],["凱西","象牙海岸","MF",81,85],["塔雷米","伊朗","FW",80,84],["扎卡","瑞士","MF",82,85],["凱塞多","厄瓜多","MF",83,87],["阿方索戴維斯","加拿大","DF",83,87],["陳柏良","台灣","MF",62,67],["朱恩樂","台灣","MF",60,66]];
const FIC_JOB=["在家鄉開了一間早餐店","當上體育老師","在乙級聯賽踢到 33 歲","轉行當健身教練","成了業餘球隊的隊長","去讀大學，後來當工程師","接手家裡的生意","在青訓營當教練","當上外送員，週末還在踢球","移民到國外，在餐廳工作"];
const STAR_EN={"梅西": "Lionel Messi", "C羅": "Cristiano Ronaldo", "姆巴佩": "Kylian Mbappé", "哈蘭德": "Erling Haaland", "亞馬爾": "Lamine Yamal", "內馬爾": "Neymar", "德布勞內": "Kevin De Bruyne", "貝林厄姆": "Jude Bellingham", "萊萬多夫斯基": "Robert Lewandowski", "范戴克": "Virgil van Dijk", "莫德里奇": "Luka Modrić", "諾伊爾": "Manuel Neuer", "本澤馬": "Karim Benzema", "蘇亞雷斯": "Luis Suárez", "薩拉赫": "Mohamed Salah", "凱恩": "Harry Kane", "維尼修斯": "Vinícius Júnior", "羅德里": "Rodri", "庫爾圖瓦": "Thibaut Courtois", "拉莫斯": "Sergio Ramos", "克羅斯": "Toni Kroos", "坎特": "N'Golo Kanté", "阿利森": "Alisson", "佩德里": "Pedri", "穆夏拉": "Jamal Musiala", "孫興慜": "Son Heung-min", "馬內": "Sadio Mané", "勞塔羅": "Lautaro Martínez", "唐納魯瑪": "Gianluigi Donnarumma", "魯迪格": "Antonio Rüdiger", "阿諾德": "Trent Alexander-Arnold", "奧斯梅恩": "Victor Osimhen", "哈基米": "Achraf Hakimi", "金玟哉": "Kim Min-jae", "薩卡": "Bukayo Saka", "福登": "Phil Foden", "萊斯": "Declan Rice", "維爾茨": "Florian Wirtz", "瓦爾韋德": "Federico Valverde", "巴雷拉": "Nicolò Barella", "巴斯托尼": "Alessandro Bastoni", "基耶薩": "Federico Chiesa", "格列茲曼": "Antoine Griezmann", "琴丹尼": "Aurélien Tchouaméni", "薩利巴": "William Saliba", "B費爾南德斯": "Bruno Fernandes", "B席爾瓦": "Bernardo Silva", "迪亞斯": "Rúben Dias", "萊奧": "Rafael Leão", "德容": "Frenkie de Jong", "加克波": "Cody Gakpo", "德利赫特": "Matthijs de Ligt", "盧卡庫": "Romelu Lukaku", "多庫": "Jérémy Doku", "格瓦迪奧爾": "Joško Gvardiol", "羅德里戈": "Rodrygo", "卡塞米羅": "Casemiro", "馬奎尼奧斯": "Marquinhos", "埃德森": "Ederson", "麥卡利斯特": "Alexis Mac Allister", "恩佐": "Enzo Fernández", "迪馬利亞": "Ángel Di María", "E馬丁內斯": "Emiliano Martínez", "J阿瓦雷茲": "Julián Álvarez", "哈梅斯": "James Rodríguez", "路易斯迪亞斯": "Luis Díaz", "洛薩諾": "Hirving Lozano", "普利西奇": "Christian Pulisic", "奧喬亞": "Guillermo Ochoa", "齊耶赫": "Hakim Ziyech", "阿姆拉巴特": "Sofyan Amrabat", "庫利巴利": "Kalidou Koulibaly", "門迪": "Édouard Mendy", "奧斯曼": "Ademola Lookman", "帕提": "Thomas Partey", "三笘薰": "Kaoru Mitoma", "久保建英": "Takefusa Kubo", "遠藤航": "Wataru Endo", "李康仁": "Lee Kang-in", "黃喜燦": "Hwang Hee-chan", "武磊": "Wu Lei", "艾克森": "Elkeson", "厄德高": "Martin Ødegaard", "艾瑞克森": "Christian Eriksen", "恰爾汗奧盧": "Hakan Çalhanoğlu", "弗拉霍維奇": "Dušan Vlahović", "馬赫雷斯": "Riyad Mahrez", "奧納納": "André Onana", "凱西": "Franck Kessié", "塔雷米": "Mehdi Taremi", "扎卡": "Granit Xhaka", "凱塞多": "Moisés Caicedo", "阿方索戴維斯": "Alphonso Davies", "陳柏良": "Chen Po-liang", "朱恩樂": "Emilio Estevez"};
function starsInit(p,mode){if(mode=="off")return;
 const sh=a=>a.slice().sort(()=>R()-.5),top=sh(STARS.filter(x=>x[4]>=93)).slice(0,5),homeR=sh(STARS.filter(x=>x[1]==p.c&&!top.includes(x))).slice(0,2),
  mid=[...homeR,...sh(STARS.filter(x=>x[4]<93&&!homeR.includes(x)))].slice(0,10);
 const real=[...top.map(x=>[x,"巨星"]),...mid.map(x=>[x,"一線"])].map(([[n,c,pos,lo,hi],tier])=>{const reg=(COUNTRIES.find(x=>x[0]==c)||[,,,,"歐"])[4];let pot=lo+R()*(hi-lo),fate="";
  // 平行世界：有些人會走歪
  if(R()<.25){pot-=6+R()*12;fate=pick(["青訓時期受了重傷","被球探錯過","少年時沉迷夜生活","家裡出事，晚了兩年才開始正式訓練"])}
  return {n:mode=="alias"?newName({region:reg}):(STAR_EN[n]||n),real:n,tier,c,pos,pot,o:0,club:null,active:true,goals:0,apps:0,tro:0,aw:0,caps:0,peak:0,ret:33+Math.floor(R()*7),fate,moves:[]}});
 // 同期普通人：多數和你同國，前 5 位是你的青訓同學
 const fic=Array.from({length:15},(_,i)=>{const cc=i<10?COUNTRIES.find(x=>x[0]==p.c):wpick(COUNTRIES,x=>x[1]),talent=clamp(40+gauss()*9+(cc[2]-75)*.2,30,85);
  return {n:newName({region:cc[4]}),tier:i<5?"青訓同學":"同期",fic:1,c:cc[0],pos:pick(["FW","MF","DF","GK"]),pot:Math.min(cc[2]<60?66:cc[2]<72?76:95,talent+6+Math.abs(gauss())*8),o:0,club:null,active:true,goals:0,apps:0,tro:0,aw:0,caps:0,peak:0,ret:31+Math.floor(R()*6),fate:"",moves:[]}});
 p.stars=[...real,...fic]}
// 舊存檔只有 10 位球星：補到 30 人，並把新加入的人模擬到目前年齡
function starsTopUp(p){if(!p.stars)return;p.stars.forEach(s=>{if(s.n==s.real&&STAR_EN[s.real])s.n=STAR_EN[s.real]});p.stars.forEach(s=>{s.tier=s.tier||((STARS.find(x=>x[0]==s.real)||[])[4]>=93?"巨星":"一線")});if(p.stars.length>=30)return;const tmp={c:p.c};starsInit(tmp,p.stars.some(s=>s.n!=s.real&&!s.fic)?"alias":"real");
 const have=new Set(p.stars.map(s=>s.real||s.n)),add=tmp.stars.filter(s=>s.fic?true:!have.has(s.real)).filter(s=>!s.fic||true);
 const need=30-p.stars.length,realN=Math.max(0,15-p.stars.filter(s=>!s.fic).length),pick2=[...add.filter(s=>!s.fic).slice(0,realN),...add.filter(s=>s.fic)].slice(0,need);
 pick2.forEach(s=>{for(let a=16;a<=p.age;a++)starStep(s,a)});p.stars.push(...pick2)}
function starStep(s,age){if(!s.active||age<16)return;
 if(age==16)s.o=s.pot-22-R()*5;else if(age<=27)s.o+=(s.pot-s.o)*.25+(R()-.4)*2;else if(age>=31)s.o-=1+R()*2.5;
 if(R()<.035){s.pot-=3+R()*5;s.o-=3;s.inj=(s.inj||0)+1}
 s.o=clamp(s.o,30,s.pot+1);s.peak=Math.max(s.peak,Math.round(s.o));
 // 踢不上職業的人在 20～24 歲之間放棄
 if(age>=s.ret||(age>=22&&R()<.007)||(age>=24&&s.o<55)||(s.fic&&age>=20&&s.o<52&&R()<.35)){s.active=false;s.endAge=age;if(s.fic)s.job=pick(FIC_JOB);return}
 if(age<17)return;
 if(s.o<55){s.club=null;return}
 const cur=CLUBS.find(c=>c.name==s.club);
 if(!cur||R()<.15||Math.abs(cur.str-s.o)>7||!(cur.ct==s.c||EU7.includes(cur.ct)||["美國","沙烏地阿拉伯","巴西","阿根廷","墨西哥"].includes(cur.ct))){// 去哪踢要合理：年輕時在本國或歐洲；30 歲後才可能去美國、沙烏地養老；台灣、中國、日韓、西非聯賽只收本國人
 const okCt=c=>c.ct==s.c||EU7.includes(c.ct)||(["巴西","阿根廷","墨西哥"].includes(c.ct)&&age>=31&&["拉"].includes((COUNTRIES.find(x=>x[0]==s.c)||[])[4]))||(["美國","沙烏地阿拉伯"].includes(c.ct)&&age>=30);
 const pool=CLUBS.filter(c=>okCt(c)&&c.str<=s.o+3&&c.str>=s.o-7&&(s.o<78||c.tier>=4));const to=pick(pool.length?pool:CLUBS.filter(okCt).sort((a,b)=>Math.abs(a.str-s.o)-Math.abs(b.str-s.o)).slice(0,3));if(to.name!=s.club){s.club=to.name;s.moves.push([age,to.name])}}
 const cl=CLUBS.find(c=>c.name==s.club),ap=s.o>=60?22+Math.floor(R()*14):Math.floor(R()*15);s.apps+=ap;
 s.goals+=Math.max(0,Math.round(ap/34*({FW:(s.o-50)*.75,MF:(s.o-58)*.25,DF:2,GK:0}[s.pos])*(.7+R()*.6)));
 const lp=clamp((cl.str-64)/80,.02,.6);s.tp=s.tp||0;
 if(R()<lp){s.tro++;s.tp+=TIER_PTS[cl.tier]||1}if(R()<lp*.8){s.tro++;s.tp+=Math.max(1,(TIER_PTS[tierOfCt(cl.ct)]||1)/2)}
 if(contOk(cl)&&R()<clamp((cl.str-(CONT[cl.ct]=="歐"?80:66))/60,0,.2)){s.tro++;s.tp+=CONT[cl.ct]=="歐"?20:8}if(s.o>=Math.max(62,(COUNTRIES.find(x=>x[0]==s.c)||[,,75])[2]-4)&&age>=19)s.caps+=5+Math.floor(R()*5)}
// 冠軍依分量計分：世界盃、歐冠遠高於小聯賽；你和球星用同一把尺
const TIER_PTS={5:10,4:7,3:4,2:2,1:1};
function tierOfCt(ct){return Math.max(1,...LEAGUES.filter(l=>l[1]==ct).map(l=>l[2]))}
function trophyPts(t){if(t=="世界盃冠軍")return 30;if(/歐洲國家盃|美洲盃/.test(t))return 15;if(/亞洲盃|非洲國家盃|金盃/.test(t))return 8;if(t.startsWith("歐洲冠軍聯賽"))return 20;if(/自由盃|冠軍聯賽冠軍|冠軍盃冠軍/.test(t))return 8;
 const lg=LEAGUES.find(l=>t.startsWith(l[0]));if(lg)return TIER_PTS[lg[2]]||1;const ct=Object.keys(CUPS).find(c=>t.startsWith(CUPS[c]));if(ct)return Math.max(1,(TIER_PTS[tierOfCt(ct)]||1)/2);return 2}
function starScore(s){return Math.round(s.peak*1.2+(s.tp??s.tro*5)+s.aw*12+s.caps*.3+s.goals*.15)}
async function starsYear(p){if(!p.stars)return;const was=p.stars.filter(s=>s.active);p.stars.forEach(s=>starStep(s,p.age));
 // 青訓同學的近況
 was.filter(s=>!s.active&&s.tier=="青訓同學"&&p.age<=40).forEach(s=>say(`當年一起踢球的 ${s.n} 放棄了足球，${s.job}。`));
 p.stars.filter(s=>s.tier=="青訓同學"&&s.active&&s.club&&!s.told).forEach(s=>{s.told=1;say(`青訓同學 ${s.n} 和${s.club}簽下職業合約。`,!p.club)});
 if(p.age<17)return;
 const act=p.stars.filter(s=>s.active&&s.club);
 // 世界足球先生候選：踢頂級聯賽的球員
 const cand=act.filter(s=>CLUBS.find(c=>c.name==s.club)?.tier>=4&&s.o>=87).map(s=>({s,sc:s.o+R()*3})).sort((a,b)=>b.sc-a.sc)[0];
 if(p.club&&!p.retired)p._sb=cand||null;else if(cand){cand.s.aw++;if(p.age<=45)say(`🌍 本屆世界足球先生：${cand.s.n}（${cand.s.club}）`)}
 if(!p.club||p.retired)return;
 for(const s of act.filter(s=>s.club==p.club)){s.with=s.with||[];if(!s.with.includes(p.club)){s.with.push(p.club);say(s.fic?`${s.tier=="青訓同學"?"青訓同學":"同年的"} ${s.n} 也加入了${p.club}。`:`🌟 和 ${s.n} 成為${p.club}的隊友。`,!s.fic);if(s.pos==p.pos&&s.o>ovr(p)+2)p._starBlock=s.n}}
 const real=act.filter(s=>!s.fic);
 if(real.length&&R()<.15){const s=pick(real);await ask(pick([`${s.n} 在社群上點名你，說你是同年最被高估的球員`,`${s.n} 私訊你，想約休賽季一起練球`,`媒體拿你和 ${s.n} 做比較，說你永遠活在他的影子下`]),[
  ["用場上表現回應",()=>{p.edge=1;p.morale+=2},"下一個關鍵時刻成功率↑"],
  ["公開回嗆",()=>{p.fame+=4;p.fans=(p.fans||0)*1.05;if(R()<.3){p.pop=clamp((p.pop??50)-6,0,100);say("口水戰延燒，球迷覺得你太幼稚。")}},"名氣↑ 可能翻車"],
  ["約他一起練球",()=>{p.s.控球+=.6;p.s.視野+=.6;say(`和 ${s.n} 一起練了一週，學到不少。`,1)},"能力小幅↑"]])}}
function starRank(p){if(!p.stars)return null;// 排名用同一把尺：獎項只算世界足球先生（球星那邊也只記這個），冠軍不算執教冠軍
 const aw=p.awards.filter(a=>a[1]=="世界足球先生").length,pl=p.trophies.filter(t=>!t[1].startsWith("執教")),tro=pl.length,tp=pl.reduce((a,t)=>a+trophyPts(t[1]),0);
 const me={n:p.name+"（你）",tier:"你",c:p.c,pos:p.pos,peak:Math.round(p.peak),goals:p.goals,tro,aw,sc:starScore({peak:p.peak,tro,tp,aw,caps:p.caps,goals:p.goals}),me:1};
 const all=[me,...p.stars.map(s=>({n:s.n,tier:s.tier,c:s.c,pos:s.pos,peak:s.peak,goals:s.goals,tro:s.tro,aw:s.aw,sc:starScore(s),fate:s.fate,job:s.job,end:s.endAge,club:s.moves.map(m=>m[1])}))].sort((a,b)=>b.sc-a.sc);
 const home=all.filter(x=>x.c==p.c);return {all,rank:all.findIndex(x=>x.me)+1,home,hrank:home.findIndex(x=>x.me)+1}}
function starTable(p){const r=starRank(p);if(!r)return `<p class="mut">這局沒有開啟同世代球星。</p>`;
 const TC={巨星:"#b07cff",一線:"#ffd23f",青訓同學:"#4cd964",同期:"#a9c2ad",你:"#ff4d4d"};
 return `<p>同世代 ${r.all.length} 人中排第 <b>${r.rank}</b> 名；${p.c} ${r.home.length} 人中排第 <b>${r.hrank}</b> 名。</p><div class="tbl"><table><tr><th>#</th><th style="text-align:left">球員</th><th>國家</th><th>位置</th><th>巔峰</th><th>進球</th><th>冠軍</th><th>獎項</th><th>評分</th></tr>${r.all.map((x,i)=>`<tr${x.me?' style="background:#ffd23f33;font-weight:700"':""}><td>${i+1}</td><td style="text-align:left"><span style="color:${TC[x.tier]};font-size:11px;margin-right:4px">${x.tier}</span>${esc(x.n)}${x.fate?`<br><small class="mut">平行世界：${x.fate}</small>`:""}${x.job?`<br><small class="mut">${x.end} 歲放棄足球，${x.job}</small>`:x.club&&x.club.length?`<br><small class="mut">${esc(x.club.slice(-3).join(" → "))}</small>`:""}</td><td>${x.c}</td><td>${POS[x.pos]}</td><td>${x.peak}</td><td>${x.goals}</td><td>${x.tro}</td><td>${x.aw}</td><td>${x.sc}</td></tr>`).join("")}</table></div>`}
// ── 聯賽積分榜：18 隊（已知球隊用真名，其他用「聯賽球隊」），名次決定爭冠戰、保級戰和聯賽冠軍 ──
function makeTable(p,c){const known=CLUBS.filter(x=>x.lg==c.lg),avg=known.reduce((t,x)=>t+x.str,0)/known.length,N=c.tier>=3?18:16;
 const rows=known.map(x=>({n:x.name,str:x.str+(x.name==c.name?(ovr(p)-c.str)*.25:0),me:x.name==c.name}));
 for(let i=rows.length;i<N;i++)rows.push({n:`${c.lg.replace(/職業|甲級|超級|聯賽/g,"")}球隊 ${String.fromCharCode(65+i-known.length)}`,str:avg-6+gauss()*5});
 rows.forEach(r=>{r.form=gauss()*4});return {lg:c.lg,N,rows,games:(N-1)*2}}
function tableAt(t,frac){const g=Math.round(t.games*frac);t.rows.forEach(r=>{const per=clamp(1.35+(r.str-60)/30+r.form/20,.4,2.6);r.pts=Math.round(g*per+(r.adj||0)*frac+gauss()*Math.sqrt(g)*.9);r.gp=g});
 const s=t.rows.slice().sort((a,b)=>b.pts-a.pts);s.forEach((r,i)=>r.pos=i+1);return s}
function tableHTML(t,sorted){const me=sorted.find(r=>r.me),show=sorted.filter(r=>r.pos<=4||Math.abs(r.pos-me.pos)<=1||r.pos>t.N-3);let last=0;
 return `<div class="tbl"><table class="lgt"><tr><th>#</th><th style="text-align:left">${esc(t.lg)}</th><th>場</th><th>積分</th></tr>${show.map(r=>{const gap=r.pos-last>1?`<tr><td colspan="4" class="mut" style="text-align:center">⋯</td></tr>`:"";last=r.pos;return gap+`<tr class="${r.me?"me":""}${r.pos>t.N-3?" rel":""}"><td>${r.pos}</td><td style="text-align:left">${esc(r.n)}</td><td>${r.gp}</td><td>${r.pts}</td></tr>`}).join("")}</table></div>`}
// ── 人生轉折：機率很低、影響很大的事，會在報表的「伏筆」分頁留下紀錄 ──
const TURNS=[
 p=>ask("🌀 你隨手買的彩券中了頭獎！",[["全部存起來",()=>{p.money+=2+R()*3;say("中了大獎，存款一夜暴增。",1)},"存款↑↑"],["幫家人買房子、還清債務",()=>{p.money+=.5;p.morale+=12;say("讓爸媽搬進新房子，這是你最開心的一天。",1)},"心情↑↑"],["成立青少年足球基金",()=>{p.fame+=10;tag(p,"正直");say("用獎金成立了青少年足球基金。",1)},"名氣↑ 形象↑"]]),
 p=>ask(`🌀 ${g("family")}被診斷出重病`,[["請長假回家陪伴",()=>{p.missG=(p.missG||0)+12;p.morale+=4;rel(p,"coach",-5);say("暫停足球，陪家人度過最難的日子。",1)},"缺席 12 場"],["把悲傷化成力量繼續踢",()=>{p.morale-=8;p.edge=1;say("每次進球都指向天空。",1)},"心情↓ 下一個關鍵時刻成功率↑"],["花錢找最好的醫院",()=>{p.money=Math.max(0,p.money-.3);p.morale+=2;say("花了一大筆錢，家人的病情穩定下來。",1)},"存款↓"]]),
 p=>{if(T(p,"自律")>=2)return null;const loss=p.money*.4;p.money-=loss;say(`🌀 被朋友介紹的投資騙了，損失 ${eur(loss)}。`,1);return Promise.resolve()},
 p=>{if(p.cs>=78)return null;return ask(`🌀 ${p.c}政局動盪，國內聯賽宣布停擺`,[["到國外找球隊",()=>{const to=pick(poolFor(p).filter(x=>x.ct!=p.c&&x.str<=ovr(p)+3));if(to){p._fee=0;sign(to,2);say(`被迫離鄉，轉到${to.name}。`,1)}},"換到國外"],["留在家鄉等待",()=>{p.missG=(p.missG||0)+20;p.morale-=6},"整季可能沒比賽"]])},
 p=>{if(p.age>27)return null;const n=newName({region:pick(Object.keys(NM))});say(`🌀 一位退休的傳奇教練 ${n} 看了你的比賽，決定親自指導你。`,1);meet(p,"coach",n,85);potUp(p,3+R()*3,"傳奇教練的指點讓你看見全新的可能");return Promise.resolve()},
 p=>{p.injuries++;p.missG=(p.missG||0)+18;p.health-=20;ATTR.forEach(k=>p.a[k]-=1.5);say("🌀 下雨天發生車禍，雖然撿回一命，但要休養很久。",1);return Promise.resolve()},
 p=>ask("🌀 一場比賽後，你突然對足球失去熱情",[["休息一段時間，找回初心",()=>{p.missG=(p.missG||0)+6;p.morale+=10;say("回到家鄉的空地踢球，想起小時候為什麼愛足球。",1)},"心情↑↑"],["找運動心理師",()=>{p.money-=.02;tag(p,"自律");p.morale+=6},"自律"],["硬撐下去",()=>{p.morale-=10},"心情↓"]]),
];
async function turningPoint(p){for(const f of TURNS.slice().sort(()=>R()-.5)){const r=f(p);if(r){p.turns=(p.turns||0)+1;await r;(p.arcs=p.arcs||[]).push({y:p.y0+p.age,from:p.y0+p.age,txt:"人生轉折："+(p.log[p.log.length-1]||[,""])[1].replace(/^🌀 /,"")});return}}}
// ── 人際故事線：和最好的隊友、恩師、經紀人的關係會延續好幾年，一步步發展 ──
async function storyYear(p){p.arc=p.arc||{};const A=p.arc,yr=p.y0+p.age,note=t=>{say("🤝 "+t,1);(p.arcs=p.arcs||[]).push({y:yr,from:yr,txt:t})};
 // 1. 最好的隊友：搶位置 → 分開 → 各自發展 → 老了再相聚
 const m=p.rel&&p.rel.mate;if(m&&!p.retired&&p.club){const st=A.mate||(A.mate={s:0,name:m.name,since:p.age});if(st.name!=m.name){A.mate={s:0,name:m.name,since:p.age};}
  const M=A.mate;
  if(M.s==0&&p.age-M.since>=2&&R()<.3){M.s=1;await ask(`教練說這季先發只剩一個位置，你和 ${M.name} 都在搶`,[["公平競爭，誰表現好誰上",()=>{rel(p,"mate",4);M.fair=1},"友情不變"],["私下找教練爭取",()=>{rel(p,"coach",5);rel(p,"mate",-15);M.hurt=1},"教練好感↑ 友情↓"],["主動把位置讓給他",()=>{rel(p,"mate",15);p.morale-=3;M.owe=1},"友情↑↑ 上場時間可能變少"]])}
  else if(M.s==1&&R()<.25){M.s=2;M.club=pick(CLUBS.filter(c=>c.name!=p.club&&c.tier>=2)).name;note(`${M.name} 轉會到${M.club}。臨走前他說：「${M.hurt?"我不會忘記你那時候做的事。":M.owe?"那次你讓位，我一輩子記得。":"下次在場上見，別手下留情。"}」`)}
  else if(M.s==2&&R()<.2){M.s=3;if(M.hurt){note(`在一場比賽裡又碰到 ${M.name}，他全場都在針對你。`);p.morale-=3}else await ask(`${M.name} 從${M.club}打電話來，邀你參加他的婚禮`,[["推掉比賽也要去",()=>{rel(p,"mate",10);p.morale+=6;rel(p,"coach",-3);say(`在 ${M.name} 的婚禮上當伴郎，兩個人聊到天亮。`,1)},"友情↑ 教練不太高興"],["寄禮物和影片祝福",()=>{rel(p,"mate",3)},""],["賽季太忙，沒回覆",()=>{rel(p,"mate",-8)},"友情↓"]])}
  else if(M.s==3&&p.age>=33&&R()<.3){M.s=4;if(rel(p,"mate")>=55){note(`${M.name} 退休了，邀你一起踢他的告別賽。你們又穿上同一件球衣，像回到二十歲。`);p.morale+=8}else note(`聽說 ${M.name} 退休了，你們已經很多年沒聯絡。`)}}
 // 2. 恩師：關係很好的總教練離開 → 當上國家隊總教練徵召你 → 多年後離世
 const c=p.rel&&p.rel.coach;if(c&&rel(p,"coach")>=70&&!A.mentor&&!p.retired){A.mentor={s:0,name:c.name}}
 const T2=A.mentor;if(T2){
  if(T2.s==0&&R()<.25&&!p.retired){T2.s=1;note(`恩師 ${T2.name} 離開了球隊。他跟你說：「你會比我想像的走得更遠。」`)}
  else if(T2.s==1&&R()<.2&&!p.retired&&p.age<=33){T2.s=2;p.cs=Math.max(40,p.cs-4);note(`${T2.name} 當上${p.c}國家隊總教練，第一件事就是把你列進名單。`);p.morale+=5}
  else if(T2.s>=1&&T2.s<3&&p.age>=45&&R()<.15){T2.s=3;await ask(`恩師 ${T2.name} 過世了`,[["回去參加告別式，上台致詞",()=>{p.morale-=4;p.fame+=3;say(`在告別式上說：「沒有他，就沒有今天的我。」全場落淚。`,1)},""],["寄花圈表達心意",()=>{p.morale-=2},""]])}}
 // 3. 經紀人：關係差會出事、關係好會幫你圓夢
 const ag=p.rel&&p.rel.agent;if(ag&&!p.retired&&p.club&&!A.agent){
  if(rel(p,"agent")<35&&R()<.15){A.agent=1;await ask(`你發現經紀人 ${ag.name} 背著你跟其他球隊談條件，還多收了一筆佣金`,[["立刻解約，找律師",()=>{p.money=Math.max(0,p.money-.02);delete p.rel.agent;say("和經紀人鬧上法院，最後解約。",1)},"花錢 · 沒有經紀人"],["當面談清楚，再給一次機會",()=>{rel(p,"agent",15)},"關係修復"],["睜一隻眼閉一隻眼",()=>{p.wage*=.92;p.morale-=3},"年薪被抽走一點"]])}
  else if(rel(p,"agent")>=75&&ovr(p)>=p.clubObj.str&&R()<.12){A.agent=1;const to=poolFor(p).filter(x=>x.str>p.clubObj.str&&x.str<=ovr(p)+5).sort((a,b)=>b.str-a.str)[0];if(to)await ask(`經紀人 ${ag.name} 熬夜談了三個月，幫你拿到${to.name}的合約`,[["圓夢，加盟！",()=>{p._fee=value(p);sign(to,4);say(`在經紀人幫助下加盟${to.name}。`,1)},`${to.lg} · 實力 ${to.str}`],["謝謝他，但還想留下",()=>{rel(p,"agent",-5)},""]])}}}
// ── 世界局勢：足壇大事會改變薪水、轉會、賽程 ──
const WORLD=[
 p=>{const lg=pick(["英格蘭冠軍聯賽","義大利甲級聯賽","法國甲級聯賽","巴西甲級聯賽","荷蘭甲級聯賽"]);p.world.crisis={lg,until:p.age+3};return `${lg}爆發財政危機，多支球隊欠薪，接下來幾年薪水縮水。`},
 p=>{const ct=pick(["沙烏地阿拉伯","美國","中國"]);p.world.boom={ct,until:p.age+4};return `${ct}聯賽開始砸大錢簽球星，開出的年薪是歐洲的兩倍。`},
 p=>{p.world.short=p.age;return "全球流行病爆發，本季賽程縮短，比賽大多空場進行。"},
 p=>pick(["國際足總宣布越位改用半自動判定。","歐洲聯賽改成 36 隊大聯賽制，比賽變多了。","國際足總限制每季出賽上限，球員工會表示歡迎。","世界盃擴大成 64 隊，小國也有機會參賽。"]),
];
async function worldYear(p){p.world=p.world||{};if(p.age<14||R()>.07)return;p.world.seen=p.world.seen||[];const left=WORLD.map((_,i)=>i).filter(i=>!p.world.seen.includes(i));if(!left.length)return;const i=pick(left);p.world.seen.push(i);const t=WORLD[i](p);if(t)say("🌍 足壇大事："+t,1)}
// ── 出身兌現：13 歲進青訓時，家庭背景、體型、性格開始影響能力與事件 ──
function applyOrigin(p){const s=p.s,add=(k,v)=>{s[k]=clamp(s[k]+v,1,99)};
 ({足球世家:()=>{add("視野",4);add("跑位",3);p.pot=Math.min(99,p.pot+2);p.fame+=3;say("爸爸當年的隊友來看你踢球：「跟你爸一樣有球感。」",1)},
   移民家庭:()=>{p.dual=1;say("你同時擁有兩個國籍，之後可以選擇代表哪一國。",1)},
   單親家庭:()=>{tag(p,"苦練");p.money-=.001;say("媽媽兼兩份工作供你踢球，你比誰都拚。",1)},
   富裕家庭:()=>{ATTR.forEach(k=>p.a[k]+=1);p.money+=.05;say("家裡幫你請了私人體能教練。",1)},
   街頭長大:()=>{add("盤帶技術",5);add("控球",3);if(p.sm<5)p.sm++;say("街頭練出來的腳下功夫，花式動作特別多。",1)}}[p.bg]||(()=>{}))();
 ({瘦高:()=>{p.hT+=5;add("頭球",4);add("彈跳",4);add("敏捷",-2)},壯碩:()=>{p.hT+=1;add("強壯",6);add("衝刺速度",-2)},矮小靈活:()=>{p.hT-=6;add("敏捷",6);add("盤帶技術",3);add("強壯",-4)}}[p.body]||(()=>{}))();
 ({好勝:()=>tag(p,"拚命"),冷靜:()=>tag(p,"球商"),外向:()=>{p.fame+=2;p.pop=60},內向:()=>tag(p,"自律")}[p.mind]||(()=>{}))();
 capAttrs(p)}
// 移民家庭：國家隊可以選另一國
async function dualChoice(p){if(!p.dual||p.dualDone||p.age<19||p.caps)return;p.dualDone=1;const other=pick(COUNTRIES.filter(c=>c[0]!=p.c&&c[2]>=p.cs-6&&c[2]<=p.cs+12));if(!other)return;
 await ask(`${other[0]}足協打電話來，希望你代表他們出賽`,[[`代表${other[0]}`,()=>{p.c2=p.c;p.c=other[0];p.cs=other[2];say(`決定代表${other[0]}國家隊。`,1)},`國家隊強度 ${other[2]}`],[`留在${p.c}`,()=>{p.morale+=2},`國家隊強度 ${p.cs}`]])}
// ── 伏筆：重要選擇會在幾年後回收，並寫明「因為當年……」──
function plant(p,k,wait,extra){(p.seeds=p.seeds||[]).push({k,at:p.age+wait,y:p.y0+p.age,club:p.club,...extra})}
const SEEDS={
 loyal:async(p,s)=>{if(p.club==s.club&&!p.retired){p.fame+=6;p.pop=clamp((p.pop??50)+12,0,100);return `${s.y} 年你拒絕轉會、留在${s.club}。球迷一直記得，封你為「隊魂」，主場掛起你的巨幅旗幟。`}p.fame+=2;return `${s.y} 年你為${s.club}拒絕過轉會，就算你已經離開，那裡的球迷還是為你鼓掌。`},
 whistle:async(p,s)=>{p.fame+=5;p.money+=.02;tag(p,"正直");return `${s.y} 年你舉報了打假球集團。聯盟邀請你擔任反賭大使，到各地青訓營演講。`},
 bribe:async(p,s)=>{if(R()<.55){p.banned=Math.max(p.banned||0,1);p.fame-=30;p.pop=clamp((p.pop??50)-25,0,100);return `${s.y} 年收下的那筆黑錢被檢調查到，你被禁賽一季，身敗名裂。`}p.morale-=8;return `${s.y} 年收下的那筆錢一直沒被發現，但你每次上場都覺得心虛。`},
 camp:async(p,s)=>{p.morale+=8;p.fame+=4;return `${s.y} 年你回家鄉辦的訓練營裡，有個孩子 ${newName(p)} 簽下了職業合約。他在記者會上說：「我是因為他才開始踢球的。」`},
 earlyBack:async(p,s)=>{if(!p.chronic)return null;p.injuries++;p.missG=(p.missG||0)+4;p.health-=6;return `${s.y} 年打針提早復出留下的舊傷又發作了，缺席了 4 場。`},
 rest:async(p,s)=>{p.health+=10;p.retireBonus=(p.retireBonus||0)+1;return `${s.y} 年受傷時你選擇保守治療，現在身體比同齡球員好，看起來能多踢一兩年。`},
 mate:async(p,s)=>{rel(p,"mate",10);p.morale+=6;return `${s.y} 年你在 ${s.name} 低潮時陪過他。現在他當上隊長，在更衣室裡總是挺你。`},
 lend:async(p,s)=>{p.money+=.05;rel(p,"mate",8);return `${s.y} 年你借錢給 ${s.name}。他不但還了錢，還多包了一份謝禮。`},
 party:async(p,s)=>{if(T(p,"自律")>=2)return null;p.fame-=6;p.pop=clamp((p.pop??50)-6,0,100);return `${s.y} 年那晚在夜店的照片被八卦雜誌翻出來，又被炒了一次。`},
 coach:async(p,s)=>{if(p.retired||!p.club)return null;const to=poolFor(p).filter(x=>x.name!=p.club&&x.str>p.clubObj.str&&x.str<=ovr(p)+6).sort(()=>R()-.5)[0];if(!to)return null;
  let txt=`${s.y} 年你聽了總教練 ${s.name} 的話改踢法。他現在到${to.name}執教，點名要你過去。`;say("🔗 "+txt,1);(p.arcs=p.arcs||[]).push({y:p.y0+p.age,from:s.y,txt});
  await ask(`老教練 ${s.name} 在${to.name}等你`,[["跟著他走",()=>{p._fee=value(p);sign(to,3);meet(p,"coach",s.name,80)},`${to.lg} · 實力 ${to.str}`],["留在現在的球隊",()=>{p.morale+=1},""]]);return ""},
};
async function resolveSeeds(p){if(!p.seeds)return;for(const s of p.seeds.filter(x=>!x.done&&p.age>=x.at)){s.done=1;const t=await SEEDS[s.k](p,s);if(t){say("🔗 "+t,1);(p.arcs=p.arcs||[]).push({y:p.y0+p.age,from:s.y,txt:t})}}}
// ── 每季目標：季初挑一個，季末結算；越難獎勵越多 ──
async function seasonGoal(p,apps,rate,c){
 const eg=apps*rate,ea=apps*{FW:.2,MF:.28,DF:.08,GK:.01}[p.pos]*(ovr(p)/80),ec=apps*(.25+c.str/400),r=v=>Math.max(1,Math.round(v));
 const G=[];
 if(p.pos=="FW"||p.pos=="MF")G.push({t:"goals",n:r(eg*(p.pos=="FW"?1.15:1.3)),l:"進球"});
 if(p.pos!="GK")G.push({t:"assists",n:r(ea*1.2),l:"助攻"});
 if(p.pos=="GK"||p.pos=="DF")G.push({t:"cleans",n:r(ec*1.1),l:"零封"});
 G.push({t:"apps",n:Math.min(38,r(apps*1.15)),l:"出賽"},{t:"rating",n:+(6+(ovr(p)-c.str)/12+.45).toFixed(1),l:"平均評分"});
 if(!p.caps&&ovr(p)>=Math.max(55,p.cs-4)-4&&p.age>=18)G.push({t:"caps",n:1,l:"入選國家隊"});
 if(c.str>=70)G.push({t:"titles",n:1,l:"拿下冠軍"});
 const opts=G.sort(()=>R()-.5).slice(0,3).map(g=>{const hard=g.t=="titles"||g.t=="caps"?3:g.t=="rating"?2:R()<.5?2:1;g.hard=hard;return g});
 const txt=g=>g.t=="caps"?"入選國家隊":g.t=="titles"?"拿下任一座冠軍":g.t=="rating"?`平均評分達到 ${g.n}`:`${g.l} ${g.n} ${g.t=="apps"?"場":g.t=="cleans"?"場":"次"}${g.t=="goals"?"（球）":""}`.replace("次（球）","球");
 await ask(RV("新球季開始，替自己定一個目標","季前會議後，你在筆記本寫下這季的目標","經紀人問你這季想達成什麼"),[...opts.map(g=>[txt(g),()=>{p.goal={...g,txt:txt(g)}},`${["","容易","普通","困難"][g.hard]} · 達成獎勵：${["","心情↑","心情↑ 名氣↑ 獎金","心情↑↑ 名氣↑↑ 獎金 · 可能突破潛力"][g.hard]}`]),["不設目標，順其自然",()=>{p.goal=null},""]]);
}
function goalCheck(p,r){const g=p.goal;if(!g)return;p.goal=null;
 const v=g.t=="titles"?r.titles.length:g.t=="caps"?r.caps:r[g.t],ok=v>=g.n;(p.goalLog=p.goalLog||[]).push({age:p.age,txt:g.txt,ok});
 if(ok){p.goalsDone=(p.goalsDone||0)+1;p.morale+=3*g.hard;p.fame+=2*g.hard;if(g.hard>=2){const m=p.wage*.05*g.hard;p.money+=m;say(`🎯 達成本季目標「${g.txt}」！拿到 ${eur(m)} 獎金。`,1)}else say(`🎯 達成本季目標「${g.txt}」。`,1);if(g.hard==3&&R()<.4)potUp(p,1+R()*1.5,"完成困難的目標讓你相信自己能更強")}
 else{p.morale-=g.hard;say(`本季目標「${g.txt}」沒有達成（${g.t=="rating"?r.rating.toFixed(1):v} / ${g.n}）。`)}}
// ── 第二人生：教練、球評、球探各有自己的升遷與抉擇 ──
const CLV=["青訓教練","低級別球隊總教練","職業隊助理教練","職業隊總教練","豪門總教練","國家隊總教練"];
// 退休後只留少數重要抉擇（最多 3 次、至少隔 5 年），其餘自動決定，避免一直按下一步
function postAsk(p,q,opts,info){if(p.postMode=="live"&&(p.postAsks||0)<3&&p.age>=(p.lastPostAsk||0)+5){p.postAsks=(p.postAsks||0)+1;p.lastPostAsk=p.age;return ask(q,opts,info)}
 const av=opts.filter(o=>!o[3]||o[3]()),o=pick(av.length?av:opts);say(`${q} → ${o[0]}`);o[1]();return Promise.resolve()}
async function postCareer(p){
 if(p.after=="教練"){p.cLv=p.cLv||0;p.cMax=Math.max(p.cMax||0,p.cLv);
  if(R()<.45)await postAsk(p,pick([`${CLV[p.cLv]}的第 ${p.age-p.retireAge} 年，開季三連敗，董事會開始施壓`,`你帶的球隊更衣室裡有大牌球員不服你`,`有一份新的執教工作在等你決定`]),[
   ["堅持自己的戰術",()=>{p.cBoost=R()<.5?.25:-.25},"成敗看運氣"],["大膽起用年輕球員",()=>{p.cBoost=.08;if(R()<.3)say("你提拔的一位 18 歲小將一戰成名。",1)},"穩定加分"],
   ["跳槽到更高一級的球隊",()=>{if(p.cLv<5&&R()<.4+.1*T(p,"領袖")){p.cLv++;say(`升任${CLV[p.cLv]}。`,1)}else say("面試沒有通過，只好留下。")},"可能升遷"],["請辭，休息一年",()=>{p.cLv=Math.max(0,p.cLv-1);p.morale+=5;p.health+=3},"層級↓ 心情↑"]]);
  const perf=R()+.07*T(p,"領袖")+.05*T(p,"球商")+(p.peak-70)/250+(p.cBoost||0);p.cBoost=0;
  if(perf>.9){p.cTitles=(p.cTitles||0)+1;p.trophies.push([p.y0+p.age,`執教${CLV[p.cLv]}奪冠`]);say(`🏆 以${CLV[p.cLv]}身分帶隊奪冠！`,1);if(p.cLv<5&&R()<.5){p.cLv++;say(`被挖角，升任${CLV[p.cLv]}。`,1)}}
  else if(perf<.15&&p.cLv>0){p.cLv--;say(`戰績太差被解雇，只能回去當${CLV[p.cLv]}。`,1)}
  else if(perf>.7&&p.cLv<5&&R()<.3){p.cLv++;say(`表現穩定，升任${CLV[p.cLv]}。`,1)}
  p.money+=[.03,.08,.15,.5,3,1.5][p.cLv];p.cMax=Math.max(p.cMax,p.cLv);p.afterDetail=`教練，最高做到${CLV[p.cMax]}${p.cTitles?`，奪冠 ${p.cTitles} 次`:""}`;
  if(p.age>=66){say(`${p.age} 歲，結束教練生涯。`,1);p.after="退休的教練"}}
 else if(p.after=="球評"){p.money+=.03+p.fame*.0008;
  if(R()<.4)await postAsk(p,pick(["直播中被問到一位當紅球星的表現","世界盃轉播單位想找你當主播搭檔","網路節目邀請你開一個個人頻道"]),[
   ["說真話，不怕得罪人",()=>{p.fame+=3;if(R()<.35){p.pop=clamp((p.pop??50)-6,0,100);say("一句「他根本不會防守」被球迷洗版罵了一週。")}else say("犀利的評論被大量轉發。",1)},"名氣↑ 可能被罵"],
   ["專業分析，不帶情緒",()=>{p.fame+=1;p.money+=.01},"穩定"],["接下來，多賺一點",()=>{p.money+=.05;p.health-=2},"收入↑ 很累"]]);
  p.afterDetail=`球評、名嘴，人氣 ${Math.round(p.fame)}`;if(p.age>=70)p.after="退休的球評"}
 else if(p.after=="球探"){p.found=p.found||[];
  if(R()<.35)await postAsk(p,`在${pick(["一場鄉下的少年賽","街頭五人制","一間小學的校隊","鄰國的青年盃"])}看到一個 14 歲的孩子，球感驚人`,[
   ["強力推薦俱樂部簽下他",()=>{const n=newName({region:pick(Object.keys(NM))});p.found.push({n,y:p.age,ok:R()<.25+.08*T(p,"球商")});say(`推薦簽下 ${n}。`,1)},"可能看走眼"],
   ["再觀察一年",()=>{},""],["覺得他太瘦小，放棄",()=>{if(R()<.15)say("幾年後那個孩子在別的球隊成了明星，你後悔了好久。")},""]]);
  p.found.filter(x=>!x.told&&p.age-x.y>=6).forEach(x=>{x.told=1;if(x.ok){p.scoutHits=(p.scoutHits||0)+1;p.fame+=4;say(`你當年發掘的 ${x.n} 入選國家隊，媒體稱你是「伯樂」。`,1)}else say(`你推薦的 ${x.n} 沒能踢上職業隊。`)});
  p.money+=.04;p.afterDetail=`球探，發掘了 ${p.scoutHits||0} 位國腳`;if(p.age>=68)p.after="退休的球探"}
}
