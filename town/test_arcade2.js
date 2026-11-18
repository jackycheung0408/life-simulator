// 街機第二批（百家樂／射龍門／妞妞）與 supabase/town_arcade2.sql 的一致性與期望值檢查；由 test.js 呼叫
module.exports=(M,check)=>{const fs=require("fs"),sq=fs.readFileSync(__dirname+"/../supabase/town_arcade2.sql","utf8"),js=fs.readFileSync(__dirname+"/town.js","utf8");
 // 射龍門第五版：入場費 F=50、抽成 5%、不設單注上限（上限 = min(彩池, 現金/3)）、彩池每 10 分鐘 +10%
 check(M.DGFEE==50&&sq.includes("select 50 $$")&&sq.includes("select least(po, m / 3)::int")&&!sq.includes("單注上限 €800")&&sq.includes("round(fee * 0.05)")&&sq.includes("a * 0.10")&&sq.includes("least(144, floor(extract(epoch from (now() - lt)) / 600)::int)")&&sq.includes("if a < 3000 then a := 3000"),"射龍門 F／無硬上限／抽成 5%／加碼 10% 要和 SQL 一致");
 {const P={};const add=(W,c)=>P[W]=(P[W]||0)+c/145;for(let a=1;a<=13;a++)add(Math.max(13-a,a-1),1);for(let d=2;d<=12;d++)add(d-1,2*(13-d));
  let Mq=0,pp=0;for(const [W,p] of Object.entries(P)){const e=(1.95*W-15)/13;if(e>0){Mq+=p*e;pp+=p}}
  const R=B=>({net:-M.DGFEE+B*Mq,rtp:1+(-M.DGFEE+B*Mq)/(M.DGFEE+B*pp)});
  check(Math.abs(Mq-0.050928)<1e-5,"射龍門正期望質量要是 0.050928："+Mq);
  for(let B=50;B<=800;B+=50)check(R(B).net<0,"小注 $"+B+" 最佳策略淨期望要為負："+R(B).net);
  // 不設上限的風險（已知）：損益平衡約 982，大注回報率 > 1；SQL 註解要照實寫出
  check(R(1000).rtp>1&&R(5000).rtp>1.18&&R(20000).rtp>1.22&&sq.includes("B=20000 +968.6／1.231")&&sq.includes("損益平衡單注約 982"),"大注回報率風險要寫在 SQL 註解："+[1000,5000,20000].map(B=>R(B).net.toFixed(1)+"/"+R(B).rtp.toFixed(4)).join(" "))}
 check(sq.includes("if bet > po then raise exception")&&sq.includes("if r.money < bet * 3 then raise exception"),"射龍門押注上限檢查（彩池、3 倍現金）要在");
 check(sq.includes("amt >= 0")&&sq.includes("100000 - a")&&sq.includes("a > 100000")&&sq.includes("exit when (c2 % 100) - (c1 % 100) <> 1"),"彩池（>=0、上限 10 萬、相鄰重發）要在");
 check(2*0.446147+0.095426<1&&1.95*0.458428+0.095426<1&&9*0.095426<1&&sq.includes("閒 1:1（期望 0.98772）"),"百家樂期望值要 < 1 並寫在 SQL");
 check([0,1,6,7,9,10].map(M.NIUM).join()=="1,1,1,2,2,3"&&sq.includes("when ps >= 10000 then 3 when ps >= 7000 then 2 else 1")&&sq.includes("if ps < 1000 and ps % 1000 < 12 then")&&sq.includes("if ps = ds then win := bet;")&&sq.includes("key := cs[i] % 100;")&&sq.includes("r.money < bet * 3")&&sq.includes("回報率 = 1 − P(雙方都是")&&js.includes("莊家直接贏"),"妞妞倍數表／平手／不比花色／莊家優勢／3 倍現金要和 SQL 一致");
 check(!/40 局/.test(js.replace(/\/\/.*$/gm,"")),"town.js 不能再有「40 局」文字");
 check(js.includes('"town_game2"')&&fs.existsSync(__dirname+"/../supabase/town_arcade2_test.sql"),"前端要呼叫 town_game2、要有 town_arcade2_test.sql")}
