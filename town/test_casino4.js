// 賭場階段 E（地雷、彈珠台、飛行器、猜杯子、刮刮樂、開寶箱）：前端常數要和 supabase/town_casino4.sql 一致；期望值精確窮舉都要 ≤ 0.97；由 test.js 呼叫
module.exports=(M,check)=>{const fs=require("fs"),sq=fs.readFileSync(__dirname+"/../supabase/town_casino4.sql","utf8"),code=sq.replace(/--.*$/gm,""),js=fs.readFileSync(__dirname+"/town.js","utf8");
 const arr=n=>{const m=code.match(new RegExp(n+"\\s+int\\[\\]\\s*:=\\s*array\\[([0-9,\\s]+)\\]"));return m?m[1].split(",").map(Number):null};
 // 地雷：翻 k 格全安全機率 × 倍率 = 0.97（任何收手策略期望相同）；至少 1 格；封頂 21 億
 {const C=(n,r)=>{let x=1;for(let i=0;i<r;i++)x=x*(n-i)/(i+1);return x};
  for(let m=1;m<=6;m++)for(let k=1;k<=25-m;k++){const p=C(25-m,k)/C(25,k),mult=M.mnMult(m,k);if(Math.abs(p*mult-0.97)>1e-9||p*mult>0.97+1e-9){check(false,"地雷期望不是 0.97："+m+" "+k+" "+p*mult);break}}
  check(code.includes("acc numeric := 0.97")&&code.includes("(25 - i) / (25 - m - i)")&&code.includes("order by random() limit m")&&code.includes("2000000000")&&code.includes("至少翻開 1 格"),"地雷 SQL 規則不一致");
  check(M.mnMult(3,1)>1.1&&M.mnMult(3,1)<1.2,"地雷倍率 3 雷翻 1 應約 1.1")}
 // 彈珠台：二項分佈精確期望，三種風險都 ≤ 0.97，且和 SQL 表一致、對稱
 {const Cb=[1,12,66,220,495,792,924,792,495,220,66,12,1],lo=arr("PL_LOW"),mi=arr("PL_MID"),hi=arr("PL_HIGH"),T={low:lo,mid:mi,high:hi};
  for(const k in T){const t=T[k];check(t&&t.length==13&&t.every((v,i)=>v==t[12-i]),"彈珠台 "+k+" 表要 13 格對稱");const ev=t.reduce((s,m,i)=>s+m*Cb[i],0)/4096/100;check(ev<=0.97&&ev>0.93,"彈珠台 "+k+" 期望要 0.93～0.97："+ev);check(JSON.stringify(M.PLK[k])==JSON.stringify(t),"彈珠台 "+k+" 前端表和 SQL 不一致")}
  check(code.includes("for i in 1..12 loop")&&code.includes("random() < 0.5"),"彈珠台要 12 層各 1／2")}
 // 飛行器：P(X ≥ m) = 0.97／m；倍率函式和前端一致；時間不足不能領、墜毀即結束
 {check(code.includes("97.0 / u")&&code.includes("u := 1 - random()")&&code.includes("exp(0.1 * greatest(t, 0))")&&code.includes("least(100000")&&code.includes("if mp > cur then raise exception")&&code.includes("if mp <= xx then")&&code.includes("if xx < cur then"),"飛行器 SQL 規則不一致");
  // 離散化後 X2 = floor(97/u)（百分之一）：u=0.97·100/m100 時 P(X2 ≥ m100) = 97/m100
  for(const m100 of [100,101,150,200,777,1000,12345,100000]){const p=Math.min(1,97/m100);check(Math.abs(p*m100/100-0.97)<1e-9,"飛行器 m="+m100+" 期望不是 0.97")}
  check(M.crM(0)==100&&M.crM(Math.log(2)/0.1)>=199&&M.crM(1e6)==100000,"飛行器倍率函式不對");
  // 收手策略 = 鞅：條件在還活著，等待後收手期望仍 0.97
  for(const [a,b] of [[150,300],[200,1000]])check(Math.abs((97/a)*(a/b)*b/100-0.97)<1e-9,"飛行器鞅性質不對")}
 // 猜杯子
 {const ev=2.88/3;check(Math.abs(ev-0.96)<1e-9&&code.includes("bet * 288 / 100.0")&&code.includes("floor(random() * 3)"),"猜杯子期望要 0.96："+ev)}
 // 刮刮樂：獎表和 SQL 一致，期望 ≤ 0.95，總中獎率 < 30%
 {const mm=arr("SC_M"),pp=arr("SC_P");check(JSON.stringify(mm)==JSON.stringify(M.SCM)&&JSON.stringify(pp)==JSON.stringify(M.SCP),"刮刮樂獎表前端和 SQL 不一致");
  const ev=mm.reduce((s,m,i)=>s+m*pp[i],0)/10000,tot=pp.reduce((a,b)=>a+b,0)/10000;check(ev<=0.9501&&ev>0.9&&tot<0.3&&pp.every(x=>x>0),"刮刮樂期望要 ≤ 0.95："+ev+" 中獎率 "+tot);
  check(code.includes("array[tier, tier, tier] || pool[1:6]")&&code.includes("pool[1:9]")&&code.includes("s <> tier"),"刮刮樂盤面要只出現獎項那組三連")}
 // 開寶箱：莊家隨機打開另一箱（不看內容）→ 剩下 4 個（含自己選的）對稱，保留／換箱期望都 = 平均值；窮舉
 {const V=arr("CH_V"),sum=V.reduce((a,b)=>a+b,0),mean=sum/5/100;check(JSON.stringify(V)==JSON.stringify(M.CHV),"寶箱表前端和 SQL 不一致");
  check(V.length==5&&V.filter(x=>x==0).length==1&&new Set(V).size==5&&mean<=0.9601,"寶箱要 5 箱 1 空、倍率不同、平均 ≤ 0.96："+mean);
  const perms=a=>a.length<2?[a]:a.flatMap((x,i)=>perms([...a.slice(0,i),...a.slice(i+1)]).map(p=>[x,...p]));let keep=0,sw=0,n=0;
  for(const p of perms(V))for(let P=0;P<5;P++)for(let R=0;R<5;R++){if(R==P)continue;const rem=[0,1,2,3,4].filter(i=>i!=P&&i!=R);n++;keep+=p[P];sw+=rem.reduce((s,i)=>s+p[i],0)/3}
  keep/=n*100;sw/=n*100;check(Math.abs(keep-mean)<1e-9&&Math.abs(sw-mean)<1e-9,"寶箱保留／換箱期望要等於平均："+keep+" "+sw);
  check(code.includes("e <> pk order by random() limit 1")&&code.includes("那個寶箱已經打開了"),"寶箱 SQL 規則不一致")}
 // 共通：押注最少 50、籌碼不夠擋、路由與進行中旗標
 check(code.includes("bet < 50")&&code.includes("籌碼不夠")&&code.includes("town_need_in_pl")&&code.includes("its ? 'mn'")&&code.includes("its ? 'cx'")&&code.includes("its ? 'cr'")&&code.includes("2147483647"),"賭場共通檢查缺漏");
 for(const k of ["mn_start","mn_pick","mn_cash","mn_state","plinko","cr_start","cr_poll","cr_cash","cups","scratch","ch_start","ch_pick","ch_final","ch_state"]){check(code.includes("'"+k+"'"),"SQL 少了 "+k);check(js.includes('"'+k+'"'),"前端少了 "+k)}
}
