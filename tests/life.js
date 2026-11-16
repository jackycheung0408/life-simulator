// 人生模擬器自動測試：node tests/life.js [人生數]
// 用假的瀏覽器環境跑完整人生，檢查不會當掉、數值不會壞掉、壽命分布合理
const fs=require("fs"),path=require("path"),dir=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(dir,"index.html"),"utf8");
const files=[...html.matchAll(/<script src="([^"?]+\.js)/g)].map(m=>fs.readFileSync(path.join(dir,m[1]),"utf8"));
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
global.setTimeout=f=>setImmediate(f);global.clearTimeout=()=>{};global.window=global;
const el=()=>new Proxy({style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},children:[],value:""},{get:(t,k)=>k in t?t[k]:(k=="querySelectorAll"?()=>[]:k=="getContext"?()=>new Proxy({},{get:()=>()=>({})}):typeof k=="string"&&/^(textContent|innerHTML|innerText|id|className|src|href)$/.test(k)?"":()=>el())});
const store={};global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
global.document=new Proxy({},{get:(t,k)=>k=="documentElement"?el():k=="body"?el():()=>el()});global.matchMedia=()=>({matches:false,addEventListener(){}});
global.navigator={};global.performance={now:()=>Date.now()};global.location={href:"",search:"",hash:""};global.scrollTo=()=>{};global.fetch=async()=>({ok:true,json:async()=>[]});global.requestAnimationFrame=f=>setImmediate(f);global.Image=function(){};global.addEventListener=()=>{};
// 網頁會直接用元素 id 當變數（例如 go.onclick），先幫每個 id 放一個假元素
for(const m of html.matchAll(/id="([A-Za-z_$][\w$]*)"/g))if(!(m[1] in global))global[m[1]]=el();
let src=files.join("\n;\n")+"\n;\n"+inline.join("\n;\n");
(0,eval)(src+`;auto=true;global.L_run=async(w)=>{P=newLife(w);S=[];let n=0;while(P.alive&&n++<130)await year(P);return P};global.T={setP:p=>{P=p},setS:v=>{S=v},urbanOf,fertOf,u5Rate,mortB,mortQ,mortRef,world,C,newLife,year,survival,get P(){return P}};`);
const DEEP=process.argv.includes("--deep"),N=+process.argv.find(a=>/^\d+$/.test(a))||30,fails=[];
// ── 不變量（解析式）：每個國家、性別、家境，死亡率模型算出的出生時平均壽命要等於資料（< 0.05 歲）；5 歲前死亡合計 ≈ 嬰兒死亡率 × 1.3
{let bad=0,worst=0;for(const raw of T.C)for(const w of ["now","past"])for(const sex of ["男","女"])for(const cls of [0,2,4]){const c=T.world(raw,w),ex=sex=="男"?c.mEx:c.fEx,L={c,cls,edu:0,ex,smoke:false},B=T.mortB(L);let s=1,e=0,u5=0;
  for(let a=0;a<=125;a++){const q=T.mortQ(L,a,B,T.mortRef(L,a),false);e+=s*(1-q/2);if(a<5)u5=1-s*(1-q);s*=1-q}
  worst=Math.max(worst,Math.abs(e-ex));if(Math.abs(e-ex)>.05)bad++;if(c.im>5&&(Math.abs(u5/T.u5Rate(c.im)-1)>.01||u5/(c.im/1000)<1.2||u5/(c.im/1000)>1.4))bad++}
 if(bad)fails.push(`死亡率模型：${bad} 組國家／性別沒對上資料平均壽命或 5 歲前死亡率（最大差 ${worst.toFixed(2)} 歲）`);else console.log(`死亡率校準：全部國家、性別、家境的平均壽命誤差 ≤ ${worst.toFixed(3)} 歲`)}
(async()=>{let crash=0,ages=[],seeds=0,paid=0;for(let i=0;i<N;i++){try{const p=await L_run(["now","past","future"][i%3]);ages.push(p.age);seeds+=Object.keys(p.seedAt||{}).length;paid+=Object.keys(p.seedDone||{}).filter(k=>p.seed[k]!=null).length;if(!Number.isFinite(p.money))fails.push("存款變成 NaN");if(p.alive)fails.push("活超過 130 歲")}catch(e){crash++;if(crash<3)console.log("當掉：",String(e.stack).split("\n").slice(0,3).join(" | "))}}
 // ── 不變量（家庭）：手足不能讓母親在 16 歲前生第一胎；富裕家庭的父親不是農民／攤販／日薪工人／漁夫；城市國家 100% 都市；生育率與資料一致
{let badSib=0,badJob=0;for(let i=0;i<1500;i++){const L=T.newLife("now"),f=L.fam;const oldest=f.sibs.length?f.sibs[f.sibs.length-1].age:0;if(f.mother.age-oldest<16)badSib++;if(L.cls>=3&&["農民","攤販","日薪工人","漁夫"].includes(f.father.job))badJob++}
 if(badSib)fails.push(`家人：${badSib}／1500 個家庭最大的手足出生時母親不到 16 歲`);if(badJob)fails.push(`家人：${badJob}／1500 個富裕家庭的父親是農民、攤販、日薪工人或漁夫`);
 const get=n=>T.world(T.C.find(x=>x[0]==n),"now");
 for(const n of ["新加坡","香港","澳門"])if(T.urbanOf(get(n))<.99)fails.push(`${n}都市人口應為 100%`);
 if(T.urbanOf(get("日本"))<.9)fails.push("日本都市人口應約 92%");
 if(T.fertOf(get("奈及利亞"))<4.5)fails.push(`奈及利亞總生育率應約 5（算出 ${T.fertOf(get("奈及利亞"))}）`);
 if(T.fertOf(get("日本"))>1.5)fails.push(`日本總生育率應 < 1.5（算出 ${T.fertOf(get("日本"))}）`)}
// ── 不變量（逐年）：每一年之後檢查狀態有沒有不可能的組合；之後新增的規則也往 yearChecks 加
const yearChecks=[
 L=>L.edu>=3&&L.age<18?`${L.age} 歲就有大學學歷`:null,
 L=>L.masters&&L.edu<3?"沒有大學學歷卻有碩士":null,
 L=>L.twNoKid&&L.kids>0?"選了「決定不生」之後仍然有孩子":null,
 L=>L.partner&&L.kids>0&&L.age<18?"未成年就有孩子":null,
 L=>L.partner&&L.divorced?"有伴侶卻同時是離婚狀態":null,
 L=>L.partner&&L.partnerYears>L.age-12?`相伴 ${L.partnerYears} 年但只有 ${L.age} 歲（再婚沒重設年數）`:null,
 L=>L.c.tw&&L.childMarriage&&L.age-L.partnerYears<16?"台灣女生 16 歲前結婚（民法最低 16 歲）":null,
 L=>L.partner&&!L.partnerName&&L.age>25?"有伴侶卻沒有名字":null,
];
{const bad=new Set();for(let i=0;i<240;i++){const L=T.newLife(["now","past","future"][i%3]);if(i%4==0)L.twNoKid=true;T.setP(L);T.setS([]);let n=0;while(L.alive&&n++<130){await T.year(L);for(const c of yearChecks){const m=c(L);if(m)bad.add(m)}}}
 for(const m of bad)fails.push("逐年檢查："+m)}
// ── 深度檢查（node tests/life.js --deep，約 3000 段、幾分鐘）：各所得層、性別的平均死亡年齡 vs 資料平均壽命差距 < 3 年
 if(DEEP){const tiers={};for(let i=0;i<3000;i++){const p=await L_run("now"),t=(p.c.gdp<8000?"低":p.c.gdp<30000?"中":"高")+p.sex;(tiers[t]=tiers[t]||[]).push([p.age,p.ex])}
  for(const t in tiers){const a=tiers[t],m=a.reduce((x,y)=>x+y[0],0)/a.length,e=a.reduce((x,y)=>x+y[1],0)/a.length;console.log(`  ${t} ${a.length} 人：平均死亡年齡 ${m.toFixed(1)}、資料平均壽命 ${e.toFixed(1)}`);if(a.length>40&&Math.abs(m-e)>3)fails.push(`${t}：平均死亡年齡 ${m.toFixed(1)} 與資料平均壽命 ${e.toFixed(1)} 差超過 3 年`)}}
 ages.sort((a,b)=>a-b);if(crash)fails.push(`有 ${crash} 段人生當掉`);
 console.log(`跑了 ${N} 段人生：壽命中位數 ${ages[ages.length>>1]} 歲（${ages[0]}～${ages[ages.length-1]}）、伏筆埋下 ${seeds} 條、回收 ${paid} 條`);
 if(fails.length){console.log("❌ 測試失敗：\n- "+[...new Set(fails)].join("\n- "));process.exit(1)}console.log("✅ 全部通過");process.exit(0)})();
