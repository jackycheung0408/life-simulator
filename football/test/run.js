// 足球員模擬器自動測試：推上網站前跑一次
// 用法：node football/test/run.js [生涯數]
// 會用假的瀏覽器環境跑完整生涯，檢查：不會當掉、機率在合理範圍、對手與球隊合理、存檔不會太大
const fs=require("fs"),path=require("path");
const dir=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(dir,"index.html"),"utf8");
// 依序載入 index.html 引用的 js 檔（拆檔後）或內嵌的 script（拆檔前）
const files=[...html.matchAll(/<script src="(js\/[^"?]+)/g)].map(m=>fs.readFileSync(path.join(dir,m[1]),"utf8"));
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const src=(files.length?files.join("\n;\n"):inline.join("\n;\n")).split("// ── 首頁 ──")[0];

// home.js 在「// ── 首頁 ──」之後整段不載入，但 migrate 要測：把它單獨取出，和其他程式一起 eval（才看得到 ATTR、DPW 這些 const）
const hsrc=fs.readFileSync(path.join(dir,"js/home.js"),"utf8"),mA=hsrc.indexOf("function migrate(p){"),mB=hsrc.indexOf("\nfunction loadSlot"),migSrc=mA>0&&mB>mA?hsrc.slice(mA,mB):"";
global.setTimeout=f=>setImmediate(f);global.window=global;
const el=()=>({textContent:"",innerHTML:"",style:{},dataset:{},children:[],classList:{add(){},remove(){},toggle(){},contains(){return true}},querySelectorAll:()=>[],querySelector:()=>null,prepend(){},getContext:()=>new Proxy({},{get:()=>()=>{}}),appendChild(){},insertAdjacentHTML(){},after(){},remove(){}});
const store={};global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
global.document={getElementById:el,querySelectorAll:()=>[],querySelector:()=>null,createElement:el,body:{appendChild(){},insertAdjacentHTML(){}},addEventListener(){}};
global.performance={now:()=>Date.now()};global.location={href:"",host:"",pathname:""};global.scrollTo=()=>{};
(0,eval)(src+"\n;"+migSrc+`;auto=true;secPerSeason=0;mult=1e6;
animMatch=async()=>{};quietYear=async()=>{};
global.T_run=async(w,mode)=>{P=newPlayer(w,"?");P.mode=mode;starsInit(P,"real");while(P.alive&&!P.footEnd){await season();save()}return P};
global.T_CL=CLUBS;global.T_TOP5=TOP5;global.T_CONT=CONT;global.T_contOk=contOk;global.T_EU7=EU7;global.T_SAVE_VER=SAVE_VER;global.T_ATTR=ATTR;global.T_migrate=typeof migrate=="function"?migrate:null;`);

const N=Math.max(40,+process.argv[2]||40);/* 很快，所以至少跑 40 段 */const fails=[];const check=(ok,msg)=>{if(!ok)fails.push(msg)};
(async()=>{const t0=Date.now();let pro=0,crash=0,maxSave=0,badOpp=0,badStar=0,titles=0,seasons=0;
 for(let i=0;i<N;i++){const mode=i%2?"pro":"real";let p;
  try{p=await T_run("world",mode)}catch(e){crash++;console.log("當掉：",e.stack.split("\n").slice(0,3).join(" | "));continue}
  if(p.debut)pro++;seasons+=p.seasons.length;titles+=p.trophies.filter(t=>/聯賽冠軍/.test(t[1])).length;
  maxSave=Math.max(maxSave,(store["fb-saves"]||"").length);
  // 大比賽對手要在同一個賽事範圍
  for(const [,t] of p.log){const m=t.match(/大比賽｜(.+?)：(.+?) vs (.+)$/);if(!m||/世界盃|國家盃|美洲盃|亞洲盃|金盃/.test(m[1]))continue;
   const a=T_CL.find(c=>c.name==m[2]),b=T_CL.find(c=>c.name==m[3]);if(!a||!b)continue;
   const ok=/冠軍聯賽|自由盃|冠軍盃/.test(m[1])?T_CONT[a.ct]==T_CONT[b.ct]:/盃決賽/.test(m[1])?a.ct==b.ct:a.lg==b.lg;if(!ok)badOpp++}
  // 同世代球星不該去不合理的聯賽
  for(const s of p.stars||[])for(const [age,cn] of s.moves){const c=T_CL.find(x=>x.name==cn);if(c&&c.ct!=s.c&&(["台灣","中國","日本","韓國","奈及利亞"].includes(c.ct)||(["美國","沙烏地阿拉伯"].includes(c.ct)&&age<30)))badStar++}
  // 數值不能壞掉
  check(Number.isFinite(p.fame)&&Number.isFinite(p.money)&&Number.isFinite(p.peak),`第 ${i} 局有 NaN`);
  check(p.peak<=99,`第 ${i} 局巔峰超過 99`)}
 check(crash==0,`有 ${crash} 局當掉`);
 check(badOpp==0,`有 ${badOpp} 場大比賽對手不合理`);
 check(badStar==0,`有 ${badStar} 次球星轉到不合理的聯賽`);
 // 樣本太少時比例會亂跳，至少 30 段才檢查
 if(N>=30)check(pro/N>.25&&pro/N<.9,`踢上職業的比例異常：${(pro/N*100).toFixed(0)}%`);
 check(maxSave<1.5e6,`存檔太大：${Math.round(maxSave/1024)} KB`);
 // 存檔版本：新角色直接是最新版，載入時 migrate 不能動它；舊存檔每條規則只補一次（home.js 不在上面的 eval 範圍，這裡單獨取出 migrate）
 {check(!!T_migrate,"找不到 home.js 的 migrate");
  const msgs=[],realSay=global.say;global.say=t=>msgs.push(t);const mine=()=>msgs.filter(t=>/^📋 遊戲更新/.test(t)); // 遊戲本身的 setTimeout 也會呼叫 say，只看 migrate 的訊息
  const mig=T_migrate;
  const tick=()=>new Promise(r=>setImmediate(()=>setImmediate(r)));
  const skew=q=>{Object.keys(q.s).forEach(k=>q.s[k]=85);T_ATTR.slice(0,3).forEach(k=>Object.keys(faceMap(q,k)).forEach(x=>q.s[x]=8));q.pot=95;return q};
  const np=newPlayer("world","FW");check(np.ver===T_SAVE_VER,`新角色 ver=${np.ver}，應該是 SAVE_VER(${T_SAVE_VER})`);
  const before=JSON.stringify(np.s);mig(np);await tick();check(JSON.stringify(np.s)===before&&mine().length==0,"新角色載入時被 migrate 改了能力或跳出舊存檔訊息");
  const q1=skew(newPlayer("world","FW"));q1.ver=1;const b1=JSON.stringify(q1.s);mig(q1);await tick();
  check(q1.ver===T_SAVE_VER&&JSON.stringify(q1.s)!==b1,"ver1 偏科存檔沒有被補");
  check(mine().length==1&&!(/沒練到/.test(mine()[0])&&/天賦能力平均化/.test(mine()[0])),"ver1 存檔同一次載入被補了兩次（差距收斂＋天賦平均化）");
  msgs.length=0;const q2=skew(newPlayer("world","FW"));q2.ver=2;mig(q2);await tick();
  check(mine().length==1&&!/沒練到/.test(mine()[0])&&/天賦能力平均化/.test(mine()[0]),"ver2 存檔只應該補天賦平均化，不再補差距收斂");
  const s2=JSON.stringify(q2.s);msgs.length=0;mig(q2);await tick();check(JSON.stringify(q2.s)===s2&&mine().length==0,"migrate 跑第二次又改了存檔 "+msgs.length+" "+(JSON.stringify(q2.s)===s2)+" ver="+q2.ver);
  global.say=realSay}
 // 排行榜上傳列：數字壞掉（NaN／缺值）也要送得出去，且每個欄位都在 SQL 限制內（supabase/leaderboard.sql）
 {const rows=[upRow({name:"X",c:"台灣",pos:"FW",peak:NaN,apps:5000,goals:undefined,trophies:[],awards:[],_sc:NaN,y0:1940,age:40,_title:""}),upRow({name:"Y".repeat(40),c:"某個很長很長的國家名稱",pos:"GK",peak:99.6,apps:1100,goals:9999,trophies:new Array(99).fill(1),awards:new Array(200).fill(1),_sc:99999.5,y0:1999,age:30,_title:"傳".repeat(50)})];
  rows.forEach((r,i)=>{const ok=[["peak",0,99],["apps",0,1200],["goals",0,1500],["trophies",0,60],["awards",0,80],["score",0,2500],["born",1900,2100],["died",1900,2250]].every(([k,lo,hi])=>Number.isInteger(r[k])&&r[k]>=lo&&r[k]<=hi);
   check(ok,`排行榜上傳列 ${i} 有欄位不是整數或超出 SQL 範圍：`+JSON.stringify(r));check(r.goals<=r.apps*2+5&&r.trophies<=Math.floor(r.apps/8)+6&&r.died>=r.born&&r.name.length<=24&&r.country.length<=12&&r.title.length<=30,`排行榜上傳列 ${i} 違反合理性檢查`)})}
 console.log(`跑了 ${N} 段生涯（${((Date.now()-t0)/1000).toFixed(0)} 秒）：職業 ${(pro/N*100).toFixed(0)}%、聯賽冠軍 ${titles}/${seasons} 季、最大存檔 ${Math.round(maxSave/1024)} KB`);
 if(fails.length){console.log("❌ 測試失敗：\n- "+fails.join("\n- "));process.exit(1)}console.log("✅ 全部通過")})();
