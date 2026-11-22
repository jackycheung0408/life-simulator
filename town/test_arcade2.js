// 街機第二批（百家樂／妞妞）與 supabase/town_arcade2.sql 的一致性與期望值檢查；由 test.js 呼叫。射龍門 2026-11-23 起改莊家制（supabase/town_casino2.sql），護欄在 test_casino2.js，舊的彩池制護欄已移除。
module.exports=(M,check)=>{const fs=require("fs"),sq=fs.readFileSync(__dirname+"/../supabase/town_arcade2.sql","utf8"),js=fs.readFileSync(__dirname+"/town.js","utf8");
 check(2*0.446147+0.095426<1&&1.95*0.458428+0.095426<1&&9*0.095426<1&&sq.includes("閒 1:1（期望 0.98772）"),"百家樂期望值要 < 1 並寫在 SQL");
 check([0,1,6,7,9,10].map(M.NIUM).join()=="1,1,1,2,2,3"&&sq.includes("when ps >= 10000 then 3 when ps >= 7000 then 2 else 1")&&sq.includes("if ps < 1000 and ps % 1000 < 12 then")&&sq.includes("if ps = ds then win := bet;")&&sq.includes("key := cs[i] % 100;")&&sq.includes("r.money < bet * 3")&&sq.includes("回報率 = 1 − P(雙方都是")&&js.includes("莊家直接贏"),"妞妞倍數表／平手／不比花色／莊家優勢／3 倍現金要和 SQL 一致");
 check(!/40 局/.test(js.replace(/\/\/.*$/gm,"")),"town.js 不能再有「40 局」文字");
 check(js.includes('"town_casino"')&&fs.existsSync(__dirname+"/../supabase/town_arcade2_test.sql"),"前端要呼叫 town_casino（賭場入口）、要有 town_arcade2_test.sql")}
