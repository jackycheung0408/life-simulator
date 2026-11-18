// 街機第二批（百家樂／射龍門／妞妞）與 supabase/town_arcade2.sql 的一致性與期望值檢查；由 test.js 呼叫
module.exports=(M,check)=>{const fs=require("fs"),sq=fs.readFileSync(__dirname+"/../supabase/town_arcade2.sql","utf8"),js=fs.readFileSync(__dirname+"/town.js","utf8");
 // 射龍門第四版：入場費 F=50、抽成 5%、單注硬上限 800、彩池每 10 分鐘 +10%
 check(M.DGFEE==50&&M.DGMAX==800&&sq.includes("select 50 $$")&&sq.includes("least(800, po, m / 3)")&&sq.includes("round(fee * 0.05)")&&sq.includes("a * 0.10")&&sq.includes("least(144, floor(extract(epoch from (now() - lt)) / 600)::int)")&&sq.includes("if a < 3000 then a := 3000"),"射龍門 F／上限 800／抽成 5%／加碼 10% 要和 SQL 一致");
 {const P={};const add=(W,c)=>P[W]=(P[W]||0)+c/145;for(let a=1;a<=13;a++)add(Math.max(13-a,a-1),1);for(let d=2;d<=12;d++)add(d-1,2*(13-d));
  let Mq=0,pp=0;for(const [W,p] of Object.entries(P)){const e=(1.95*W-15)/13;if(e>0){Mq+=p*e;pp+=p}}
  const B=M.DGMAX,net=-M.DGFEE+B*Mq,rtp=1+net/(M.DGFEE+B*pp);
  check(net<0&&rtp<=0.97&&rtp>0.9&&Math.abs(Mq-0.050928)<1e-5,"射龍門最佳策略回報率要 <= 0.97："+rtp+" 淨 "+net);
  check(-M.DGFEE+(B+100)*Mq>-M.DGFEE+B*Mq&&1+(-M.DGFEE+1000*Mq)/(M.DGFEE+1000*pp)>1,"B=1000 時回報率應 > 1（證明上限必要）")}
 check(sq.includes("if bet > po then raise exception")&&sq.includes("if r.money < bet * 3 then raise exception"),"射龍門押注上限檢查（彩池、3 倍現金）要在");
 check(sq.includes("amt >= 0")&&sq.includes("100000 - a")&&sq.includes("a > 100000")&&sq.includes("exit when (c2 % 100) - (c1 % 100) <> 1"),"彩池（>=0、上限 10 萬、相鄰重發）要在");
 check(2*0.446147+0.095426<1&&1.95*0.458428+0.095426<1&&9*0.095426<1&&sq.includes("閒 1:1（期望 0.98772）"),"百家樂期望值要 < 1 並寫在 SQL");
 check([0,1,6,7,9,10].map(M.NIUM).join()=="1,1,1,2,2,3"&&sq.includes("when ps >= 10000 then 3 when ps >= 7000 then 2 else 1")&&sq.includes("if ps < 1000 and ps % 1000 < 12 then")&&sq.includes("if ps = ds then win := bet;")&&sq.includes("key := cs[i] % 100;")&&sq.includes("r.money < bet * 3")&&sq.includes("回報率 = 1 − P(雙方都是")&&js.includes("莊家直接贏"),"妞妞倍數表／平手／不比花色／莊家優勢／3 倍現金要和 SQL 一致");
 check(!/40 局/.test(js.replace(/\/\/.*$/gm,"")),"town.js 不能再有「40 局」文字");
 check(js.includes('"town_game2"')&&fs.existsSync(__dirname+"/../supabase/town_arcade2_test.sql"),"前端要呼叫 town_game2、要有 town_arcade2_test.sql")}
