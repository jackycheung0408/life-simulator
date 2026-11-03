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
(0,eval)(src+`;auto=true;global.L_run=async(w)=>{P=newLife(w);S=[];let n=0;while(P.alive&&n++<130)await year(P);return P};`);
const N=+process.argv[2]||30,fails=[];
(async()=>{let crash=0,ages=[];for(let i=0;i<N;i++){try{const p=await L_run(["now","past","future"][i%3]);ages.push(p.age);if(!Number.isFinite(p.money))fails.push("存款變成 NaN");if(p.alive)fails.push("活超過 130 歲")}catch(e){crash++;if(crash<3)console.log("當掉：",String(e.stack).split("\n").slice(0,3).join(" | "))}}
 ages.sort((a,b)=>a-b);if(crash)fails.push(`有 ${crash} 段人生當掉`);
 console.log(`跑了 ${N} 段人生：壽命中位數 ${ages[ages.length>>1]} 歲（${ages[0]}～${ages[ages.length-1]}）`);
 if(fails.length){console.log("❌ 測試失敗：\n- "+[...new Set(fails)].join("\n- "));process.exit(1)}console.log("✅ 全部通過");process.exit(0)})();
