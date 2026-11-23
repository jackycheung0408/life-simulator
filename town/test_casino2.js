// 賭場階段 B＋C（美式輪盤、21 點 6:5、骰寶、老虎機、基諾、射龍門莊家制）：前端賠率表要和 supabase/town_casino2.sql 一致，期望值精確窮舉都要 < 1；由 test.js 呼叫
module.exports=(M,check)=>{const fs=require("fs"),sq=fs.readFileSync(__dirname+"/../supabase/town_casino2.sql","utf8"),js=fs.readFileSync(__dirname+"/town.js","utf8"),code=sq.replace(/--.*$/gm,"");
 const arr=re=>{const m=code.match(re);return m?m[1].split(",").map(Number):null};
 // 射龍門：賠率表一致；每個 n 的玩家期望在 -7%～0%，兩張龍門分佈下最佳選擇平均 -5%～-2.5%；押注要 3 倍籌碼、不收入場費
 check(JSON.stringify(arr(/town_dg_m\(n int\)[\s\S]*?array\[([\d.,]+)\]/))==JSON.stringify(M.DGM),"射龍門賠率表前端和 SQL 不一致");
 {const ev=n=>(n*M.DGM[n-1]-(15-n))/13;for(let n=1;n<=12;n++)check(ev(n)<0&&ev(n)>-0.07,"射龍門 n="+n+" 的玩家期望要在 -7%～0%："+ev(n));
  let tot=0,cnt=0;for(let a=1;a<=13;a++)for(let b=1;b<=13;b++){if(Math.abs(a-b)==1)continue;cnt++;if(a==b){const ns=[13-a,a-1].filter(x=>x>0);tot+=Math.max(...ns.map(ev))}else tot+=ev(Math.abs(a-b)-1)}
  check(tot/cnt<-0.025&&tot/cnt>-0.05,"射龍門兩張龍門分佈下最佳選擇平均要在 -5%～-2.5%："+tot/cnt);
  check(code.includes("if r.money < bet * 3 then raise exception")&&!/town_pot|town_dg_entry\(\)|fee/.test(code.replace(/town_dg_m/g,"")),"射龍門莊家制：要有 3 倍籌碼檢查、不能再有彩池或入場費");}
 // 老虎機：權重與賠率和 SQL 一致，期望 0.90～0.95
 {const w=arr(/w int\[\] := array\[([\d,]+)\]/),pay=arr(/array\[([\d,]+)\]\)\[sy\[1\] \+ 1\]/);check(JSON.stringify(w)==JSON.stringify(M.SLW)&&JSON.stringify(pay)==JSON.stringify(M.SLPAY),"老虎機權重或賠率前端和 SQL 不一致");
  const W=w.reduce((a,x)=>a+x,0);let r=0;for(let a=0;a<6;a++)for(let b=0;b<6;b++)for(let c=0;c<6;c++){const p=w[a]*w[b]*w[c]/W**3;if(a==b&&b==c)r+=p*pay[a];else if(a==b||b==c||a==c)r+=p*1.2}
  check(r>0.9&&r<0.95&&code.includes("floor(bet * 1.2)")&&code.includes("floor(random() * 20)"),"老虎機期望要 0.90～0.95："+r)}
 // 老虎機累積大獎：每注 1% 進獎池、三個 7 拿獎池 × min(1, 押注/1000)、獎池表存在、前端有顯示
 check(code.includes("floor(bet * 0.01)")&&code.includes("least(1, bet / 1000.0)")&&code.includes("town_jackpot")&&js.includes("累積大獎"),"老虎機累積大獎：SQL 或前端不見了");
 // 基諾：80 選 5 開 20，賠率表一致，期望 0.82～0.87
 {const C=(n,k)=>{let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r},tot=C(80,20);let r=0;for(const [k,v] of Object.entries(M.KPAY))r+=C(5,+k)*C(75,20-k)/tot*v;
  check(code.includes("case k when 5 then 200 when 4 then 16 when 3 then 3 when 2 then 1")&&JSON.stringify(M.KPAY)==JSON.stringify({2:1,3:3,4:16,5:200})&&code.includes("v > 80")&&code.includes("limit 20"),"基諾賠率前端和 SQL 不一致");
  check(r>0.82&&r<0.87,"基諾期望要 0.82～0.87："+r)}
 // 骰寶：大小（三顆一樣通殺）、單點 1／2／3 顆賠 1／2／3 倍、任意三顆一樣 30:1、總和表一致，每種期望都 < 1
 {let big=0,single=0,any3=0;const ps={};for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)for(let c=1;c<=6;c++){const s=a+b+c;ps[s]=(ps[s]||0)+1/216;if(!(a==b&&b==c)&&s>=11)big+=2/216;if(a==b&&b==c)any3+=31/216}
  for(let n=1;n<=6;n++)for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)for(let c=1;c<=6;c++){const k=(a==n)+(b==n)+(c==n);if(k>0)single+=(1+k)/216/6}
  check(Math.abs(big-0.9722)<1e-3&&Math.abs(any3-0.8611)<1e-3&&Math.abs(single-0.9213)<1e-3,"骰寶大小／三顆一樣／單點期望不對："+[big,any3,single].join(" "));
  for(const [s,v] of Object.entries(M.DSUM))check(ps[s]*v<0.95&&ps[s]*v>0.78,"骰寶總和 "+s+" 期望要在 0.78～0.95："+ps[s]*v);
  check(code.includes("when s in (4, 17) then 61 when s in (5, 16) then 31 when s in (6, 15) then 18 when s in (7, 14) then 13 when s in (8, 13) then 9 else 7")&&M.DSUM[4]==61&&M.DSUM[17]==61&&M.DSUM[5]==31&&M.DSUM[6]==18&&M.DSUM[7]==13&&M.DSUM[8]==9&&M.DSUM[10]==7,"骰寶總和賠率前端和 SQL 不一致");}
 // 輪盤：美式 38 格（0、00 = 37），輪盤順序每個號碼一次；外圍 1:1、一打 2:1、單號 35:1，期望都是 36/38
 {check(M.RWHEEL.length==38&&new Set(M.RWHEEL).size==38&&M.RWHEEL.every(n=>n>=0&&n<=37)&&M.RRED.length==18,"輪盤順序要有 38 個不同的格子、18 個紅號");
  check(code.includes("floor(random() * 38)")&&code.includes("bet * 36")&&code.includes("then bet * 3 else 0 end")&&36/38<1&&Math.abs(36/38-0.9474)<1e-4,"輪盤 SQL 要是 38 格、單號 ×36、一打 ×3");
  const red=[...code.matchAll(/red int\[\] := array\[([\d,]+)\]/g)][0][1].split(",").map(Number);check(JSON.stringify(red)==JSON.stringify(M.RRED),"輪盤紅號前端和 SQL 不一致")}
 // 21 點：6:5、莊家軟 17 要牌、無加倍分牌；玩家最佳策略 0.9600（無限副牌 DP 算出，見 town_casino2.sql 檔頭）
 check(code.includes("floor(bet * 2.2)")&&code.includes("town_bj_dealer_hits")&&code.includes("hard + 10 = 17")&&js.includes("6:5")&&js.includes("軟 17"),"21 點要 6:5 與莊家軟 17 要牌（SQL 與前端說明）");
 // 籌碼面額與百家樂路單：堆疊加總等於押注、面額由小到大；路單大路連贏往下疊、滿 6 往右拐、換邊換欄、和局畫在前一顆；SQL 保留最近 72 局
 {const D=M.CHIPD.map(x=>x[0]);check(D.every((v,i)=>i==0||v>D[i-1])&&D[0]==50,"籌碼面額要由小到大且最小 50");
  for(const v of [50,150,1750,99950,1000000])check(M.chipStack(v).reduce((a,i)=>a+D[i],0)==v,"籌碼堆疊加總要等於押注："+v);
  const b=M.baccBig("BBBBBBBPTPPBBTB"),w=c=>c.map(x=>x.w||".").join("");
  check(w(b[0])=="BBBBBB"&&w(b[1])==".....B"&&w(b[2])=="PPP..."&&b[2][0].t==1&&w(b[3])=="BBB..."&&b[3][1].t==1,"百家樂大路排列不對："+b.map(w).join("|"));
  check(M.baccBead("BPTBPTB")[0].join("")=="BPTBPT"&&M.baccBead("BPTBPTB")[1][0]=="B","百家樂珠盤路排列不對");
  const q=code2=>code2.includes("right(coalesce(cs->>'bh', '')")&&code2.includes("), 72)");
  check(q(fs.readFileSync(__dirname+"/../supabase/town_casino.sql","utf8"))&&js.includes("data-chip")&&js.includes("roadsHtml"),"路單 SQL（72 局）或前端籌碼／路單不見了")}
 // 賭場規則：離場觸發器在、連輸強制休息（冷靜）已取消、自我排除已取消、開局間隔 3 秒保留
 {const c1=fs.readFileSync(__dirname+"/../supabase/town_casino.sql","utf8").replace(/--.*$/gm,"");
  check(c1.includes("town_casino_leave")&&c1.includes("before update of place")&&!c1.includes("賭場請你休息一下")&&c1.includes("每局至少間隔 3 秒")&&!c1.includes("你設了自我排除"),"賭場 SQL：要有離場觸發器、不能有冷靜休息、不能有自我排除、要保留 3 秒間隔");
  check(js.includes("squeezeDeal")&&js.includes("foldRules")&&js.includes("自動換回現金"),"前端要有咪牌、規則折疊與離場自動換回現金的說明")}
 // 莊家盈餘與籌碼制的前端文字
 check(js.includes('"town_casino_state"')&&js.includes("換回現金")&&js.includes("5%"),"前端要有換籌碼與換回現金（抽 5%）的說明")}
