// 賭場階段 D（三公、十八啦、賽豬、牌九）：前端常數要和 supabase/town_casino3.sql 一致；期望值精確窮舉都要 < 1；由 test.js 呼叫
module.exports=(M,check)=>{const fs=require("fs"),sq=fs.readFileSync(__dirname+"/../supabase/town_casino3.sql","utf8"),code=sq.replace(/--.*$/gm,""),js=fs.readFileSync(__dirname+"/town.js","utf8");
 // 三公：同一副 52 張，同點比最大牌；贏 ×1.95（SQL bet * 39 / 20）
 {const rv=r=>r>=10?0:r,cls=h=>{const [a,b,c]=h.slice().sort((x,y)=>x-y);if(a==b&&b==c)return 3e4;if(a>=11&&b>=11&&c>=11)return 2e4;return 1e4+((rv(a)+rv(b)+rv(c))%10)*100+c};
  const cn=Array(14).fill(4);let w=0,t=0;const go=(cs,pr,left)=>{if(cs.length==6){const p=cls(cs.slice(0,3)),d=cls(cs.slice(3));if(p>d)w+=pr;else if(p==d)t+=pr;return}for(let r=1;r<=13;r++){if(cn[r]<=0)continue;const q=cn[r]/left;cn[r]--;cs.push(r);go(cs,pr*q,left-1);cs.pop();cn[r]++}};go([],1,52);
  const ev=w*1.95+t;check(ev>0.96&&ev<0.99&&code.includes("bet * 39 / 20")&&code.includes("30000")&&code.includes("20000")&&code.includes("limit 6"),"三公期望要 0.96～0.99："+ev)}
 // 十八啦：有效結果（四同 100、一對＋兩不同＝兩顆和、兩對＝較大對的兩顆和），贏 ×1.95
 {const v=[];for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)for(let c=1;c<=6;c++)for(let d=1;d<=6;d++){const h=[a,b,c,d],cn={};h.forEach(x=>cn[x]=(cn[x]||0)+1);const k=Object.values(cn).sort().join("");if(k=="4")v.push(100);else if(k=="112"){const s=h.filter(x=>cn[x]==1);v.push(s[0]+s[1])}else if(k=="22")v.push(2*Math.max(...h))}
  let w=0,t=0;for(const x of v)for(const y of v){if(x>y)w++;else if(x==y)t++}const n=v.length**2,ev=(w*1.95+t)/n;
  check(v.length==816&&ev>0.96&&ev<0.99&&code.includes("bet * 39 / 20")&&code.includes("return d || 100")&&code.includes("2 * mx"),"十八啦期望要 0.96～0.99："+ev)}
 // 賽豬：勝率、單勝賠率、前二賠率和 SQL 一致，每隻期望 ≤ 0.95
 {const W=M.PIGW.map(x=>x/100),q=W.map((p,i)=>p+W.reduce((s,pj,j)=>j==i?s:s+pj*p/(1-pj),0));
  check(JSON.stringify(M.PIGW)=="[30,25,20,13,8,4]"&&code.includes("array[30,25,20,13,8,4]")&&code.includes("array[31,38,47,73,118,237]")&&code.includes("array[17,19,23,34,53,105]"),"賽豬勝率或賠率 SQL 不一致");
  check(JSON.stringify(M.PIGO1)=="[31,38,47,73,118,237]"&&JSON.stringify(M.PIGO2)=="[17,19,23,34,53,105]","賽豬前端賠率和 SQL 不一致");
  W.forEach((p,i)=>{const e1=p*M.PIGO1[i]/10,e2=q[i]*M.PIGO2[i]/10;check(e1<=0.9501&&e1>0.92&&e2<=0.9501&&e2>0.92,"賽豬 "+(i+1)+" 號期望要在 0.92～0.95："+e1+" "+e2);
   check(Math.floor(0.95/p*10+1e-9)==M.PIGO1[i]&&Math.floor(0.95/q[i]*10+1e-9)==M.PIGO2[i],"賽豬賠率要等於 floor(0.95／機率) 取 1 位")})}
 // 牌九：牌表和 SQL 一致；莊家固定分法；玩家最佳策略期望 0.96～0.99
 {const PJ=M.PJPIPS,tp=t=>t<22?t>>1:t-11,pips=M.PJTYPE_PIPS;check(pips.length==21&&PJ.length==32,"牌九牌表大小不對");
  check(code.replace(/\s/g,"").includes("array["+pips.join(",")+"])[public.town_pj_type(t)+1]"),"牌九點數表前端和 SQL 不一致");
  const dun=(a,b)=>{const x=tp(a),y=tp(b);if((x==19&&y==20)||(x==20&&y==19))return 2000;if(x==y&&x<=10)return 1000+10*(21-x);return 100*((pips[x]+pips[y])%10)+Math.max(21-x,21-y)};
  const sp=h=>[[0,1,2,3],[0,2,1,3],[0,3,1,2]].map(s=>{const p=dun(h[s[0]],h[s[1]]),q=dun(h[s[2]],h[s[3]]);return[Math.max(p,q),Math.min(p,q)]});
  const dealer=h=>{const s=sp(h);let b=s[0];for(const c of s)if(c[1]>b[1]||(c[1]==b[1]&&c[0]>b[0]))b=c;return b};
  // 以牌種分組窮舉（11 種文牌各 2 張，10 種武牌各 1 張）
  const cnt0=Array.from({length:21},(_,i)=>i<11?2:1),rep=i=>i<11?2*i:i+11;
  const enumH=cnt=>{const out=[];const r=(i,left,cur,w)=>{if(left==0){out.push([cur.slice(),w]);return}if(i>=21)return;for(let k=0;k<=Math.min(cnt[i],left);k++){const c=(cnt[i]==2&&k==1)?2:1;for(let j=0;j<k;j++)cur.push(i);r(i+1,left-k,cur,w*c);cur.length-=k}};r(0,4,[],1);return out};
  // 每種牌用一個代表 id（文牌第二張同型也用 2i）；dun 只看牌種，所以兩張同種牌要用不同 id 才能算出對子 → 對子時用 2i 與 2i+1 沒差，因為 dun 只用 type
  const toIds=h=>h.map(i=>rep(i)),P=enumH(cnt0);let tot=0,ev=0;
  for(const [ph,pw] of P){const cnt=cnt0.slice();ph.forEach(i=>cnt[i]--);const D=enumH(cnt).map(([h,w])=>[dealer(toIds(h)),w]);let dt=0;D.forEach(x=>dt+=x[1]);let best=-1;
   for(const s of sp(toIds(ph))){let e=0;for(const [d,w] of D){const hw=s[0]>d[0],lw=s[1]>d[1];e+=((hw&&lw)?1.75:(hw||lw)?1:0)*w}e/=dt;if(e>best)best=e}ev+=best*pw;tot+=pw}
  ev/=tot;check(tot==35960&&ev>0.96&&ev<0.99&&code.includes("bet * 7 / 4"),"牌九最佳策略期望要 0.96～0.99："+ev+" 手數 "+tot)}
 // 前端有這四款
 for(const k of ["sangong","shiba","pigrace","pj_start","pj_play"])check(js.includes('"'+k+'"'),"前端少了 "+k)}
