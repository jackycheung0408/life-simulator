// 街機第二批（百家樂／射龍門／妞妞）與 supabase/town_arcade2.sql 的一致性與期望值檢查；由 test.js 呼叫
module.exports=(M,check)=>{const fs=require("fs"),sq=fs.readFileSync(__dirname+"/../supabase/town_arcade2.sql","utf8"),js=fs.readFileSync(__dirname+"/town.js","utf8");
 // 射龍門第六版：彩池從 0 開始（玩家輸的錢累積）、沒有系統加碼；入場費 F=50、抽成 5%、不設單注上限（上限 = min(彩池-自己的入場費, 現金/3)）
 check(M.DGFEE==50&&sq.includes("select 50 $$")&&sq.includes("amt bigint not null default 0")&&sq.includes("values (tid, 0)")&&sq.includes("greatest(0, least(po, m / 3))")&&sq.includes("round(fee * 0.05)")&&sq.includes("'dgpot0'"),"射龍門 F／種子 0／上限／抽成 5%／遷移要和 SQL 一致");
 check(!/a \* 0\.10/.test(sq.replace(/--.*$/gm,""))&&!/town_dg_next\(/.test(sq.replace(/--.*$/gm,"").replace(/drop function if exists public\.town_dg_next\(text\);/,""))&&!/if a < 3000/.test(sq)&&!/last_tick\s+timestamptz/.test(sq)&&!js.includes("dgNext")&&!js.includes("下次加碼"),"不能再有彩池自動加碼、3000 種子、last_tick、倒數");
 check(sq.includes("if bet > po - public.town_dg_entry() then raise exception '彩池太少")&&js.includes("彩池太少，等其他玩家輸了才有得賭"),"池空不能下注（可押池 = 彩池 - 入場費）與提示要在");
 {const P={};const add=(W,c)=>P[W]=(P[W]||0)+c/145;for(let a=1;a<=13;a++)add(Math.max(13-a,a-1),1);for(let d=2;d<=12;d++)add(d-1,2*(13-d));
  let Mq=0,pp=0;for(const [W,p] of Object.entries(P)){const e=(1.95*W-15)/13;if(e>0){Mq+=p*e;pp+=p}}
  const R=B=>({net:-M.DGFEE+B*Mq,rtp:1+(-M.DGFEE+B*Mq)/(M.DGFEE+B*pp)});
  check(Math.abs(Mq-0.050928)<1e-5,"射龍門正期望質量要是 0.050928："+Mq);
  for(let B=50;B<=800;B+=50)check(R(B).net<0,"小注 $"+B+" 最佳策略淨期望要為負："+R(B).net);
  check(R(1000).rtp>1&&R(5000).net>200&&sq.includes("B=5000 +204.6")&&sq.includes("損益平衡單注約 982"),"大注風險要寫在 SQL 註解："+[1000,5000].map(B=>R(B).net.toFixed(1)).join(" "))}
 check(sq.includes("if bet > po - public.town_dg_entry() then")&&sq.includes("if r.money < bet * 3 then raise exception"),"射龍門押注上限檢查（彩池、3 倍現金）要在");
 check(sq.includes("amt >= 0")&&sq.includes("a > 100000")&&sq.includes("exit when (c2 % 100) - (c1 % 100) <> 1"),"彩池（>=0、上限 10 萬、相鄰重發）要在");
 check(2*0.446147+0.095426<1&&1.95*0.458428+0.095426<1&&9*0.095426<1&&sq.includes("閒 1:1（期望 0.98772）"),"百家樂期望值要 < 1 並寫在 SQL");
 check([0,1,6,7,9,10].map(M.NIUM).join()=="1,1,1,2,2,3"&&sq.includes("when ps >= 10000 then 3 when ps >= 7000 then 2 else 1")&&sq.includes("if ps < 1000 and ps % 1000 < 12 then")&&sq.includes("if ps = ds then win := bet;")&&sq.includes("key := cs[i] % 100;")&&sq.includes("r.money < bet * 3")&&sq.includes("回報率 = 1 − P(雙方都是")&&js.includes("莊家直接贏"),"妞妞倍數表／平手／不比花色／莊家優勢／3 倍現金要和 SQL 一致");
 check(!/40 局/.test(js.replace(/\/\/.*$/gm,"")),"town.js 不能再有「40 局」文字");
 check(js.includes('"town_casino"')&&fs.existsSync(__dirname+"/../supabase/town_arcade2_test.sql"),"前端要呼叫 town_casino（賭場入口）、要有 town_arcade2_test.sql")}
