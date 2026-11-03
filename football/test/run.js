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

global.setTimeout=f=>setImmediate(f);global.window=global;
const el=()=>({textContent:"",innerHTML:"",style:{},dataset:{},children:[],classList:{add(){},remove(){},toggle(){},contains(){return true}},querySelectorAll:()=>[],querySelector:()=>null,prepend(){},getContext:()=>new Proxy({},{get:()=>()=>{}}),appendChild(){},insertAdjacentHTML(){},after(){},remove(){}});
const store={};global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
global.document={getElementById:el,querySelectorAll:()=>[],querySelector:()=>null,createElement:el,body:{appendChild(){},insertAdjacentHTML(){}},addEventListener(){}};
global.performance={now:()=>Date.now()};global.location={href:"",host:"",pathname:""};global.scrollTo=()=>{};
(0,eval)(src+`;auto=true;secPerSeason=0;mult=1e6;
global.T_run=async(w,mode)=>{P=newPlayer(w,"?");P.mode=mode;starsInit(P,"real");while(P.alive&&!P.footEnd){await season();save()}return P};
global.T_CL=CLUBS;global.T_TOP5=TOP5;global.T_CONT=CONT;global.T_contOk=contOk;global.T_EU7=EU7;`);

const N=+process.argv[2]||40;const fails=[];const check=(ok,msg)=>{if(!ok)fails.push(msg)};
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
 console.log(`跑了 ${N} 段生涯（${((Date.now()-t0)/1000).toFixed(0)} 秒）：職業 ${(pro/N*100).toFixed(0)}%、聯賽冠軍 ${titles}/${seasons} 季、最大存檔 ${Math.round(maxSave/1024)} KB`);
 if(fails.length){console.log("❌ 測試失敗：\n- "+fails.join("\n- "));process.exit(1)}console.log("✅ 全部通過")})();
