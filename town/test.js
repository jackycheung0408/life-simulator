// 小豬鎮自動測試：node town/test.js
// 檢查：2～4 排房子時每個門都走得到、門不在牆裡、門口位置和資料庫的 town_door 一致、需求扣減算法
const M=require("./town.js"),fails=[];const check=(ok,msg)=>{if(!ok)fails.push(msg)};let routes=0;
for(let rows=2;rows<=4;rows++){M.setRows(rows);
 const doors=[...[...Array(rows*3).keys()].map(s=>["房子"+s,M.door(s)]),...Object.entries(M.PLACES).map(([k,p])=>[k,p.door])];
 for(const [n,d] of doors)check(!M.blocked(...d)&&d[1]<M.mapRows(),`${rows} 排：${n} 的門在牆裡或地圖外`);
 for(let s=0;s<rows*3;s++){const v=M.visitSpot(s);check(!M.blocked(...v),`${rows} 排：房子 ${s} 門口旁邊站不了人`);const [hx,hy]=M.homeXY(s),p=M.placeAt(hx+1,hy+1);check(p&&p.slot==s,`${rows} 排：點房子 ${s} 沒對到`)}
 for(const [a,da] of doors)for(const [b,db] of doors)if(a!=b){routes++;check(M.bfs(da,db),`${rows} 排：${a} 走不到 ${b}`)}}
// 和 supabase/town.sql 的 town_door 一樣：x = [2,9,20][s%3]+2；y = 第 0 排 5、第 1 排 21、之後每排 +7（28、35）
for(let s=0;s<12;s++){const k=Math.floor(s/3),d=M.door(s),y=(k==0?1:k==1?17:24+7*(k-2))+4;check(d[0]==[2,9,20][s%3]+2&&d[1]==y,`房子 ${s} 門口和資料庫不一致`)}
check(M.door(7)[0]==11&&M.door(7)[1]==28,"房子 7 的門應該在 (11,28)，和資料庫測試結果一致");
// 需求（×2 速率）：醒著 10 小時，飽足 80 → 0；睡覺 8 小時，飽足 80 → 40
const base={sleeping:false,hunger:80,energy:80,bladder:80,hygiene:80,fun:80,updated_at:new Date(0).toISOString()};
const tk=(o,h)=>M.tickLocal({...base,...o},h*36e5);
check(Math.round(tk({},10).hunger)==0,"醒著 10 小時飽足應該是 0");
check(Math.round(tk({},5).hunger)==40&&Math.round(tk({},5).energy)==55&&Math.round(tk({},5).bladder)==30&&Math.round(tk({},5).hygiene)==55,"醒著 5 小時：飽足 40、精力 55、膀胱 30、清潔 55");
check(Math.round(tk({sleeping:true,energy:20},1).energy)==100,"睡 1 小時精力應該是 100（封頂）");
check(Math.round(tk({sleeping:true},8).hunger)==40&&Math.round(tk({sleeping:true},8).bladder)==24&&Math.abs(tk({sleeping:true},8).hygiene-(80-19.2))<1e-6,"睡 8 小時：飽足 40、膀胱 24、清潔 60.8");
check(tk({},200).hunger==0,"需求不能低於 0");
// 睡眠與睡眠時數成正比（20／40／60 分鐘），好床也是；快速睡覺 15 分鐘 ×2.5 後自動醒
for(const [m,e] of [[20,26.7],[40,53.3],[60,80]])check(Math.abs(tk({sleeping:true,energy:0},m/60).energy-e)<.1,`睡 ${m} 分鐘精力應該是 ${e}`);
check(Math.abs(M.tickLocal({...base,sleeping:true,energy:0,items:{fu:["bed"]}},.5*36e5).energy-45)<.01,"好床睡 30 分鐘精力 +45");
{const n=Date.UTC(2026,0,1,12,0,0),it={qs:new Date(n).toISOString()};
 const q=M.tickLocal({...base,sleeping:true,energy:0,items:it,updated_at:new Date(n-15*60e3).toISOString(),seen_at:new Date(n-15*60e3).toISOString()},n);
 check(Math.abs(q.energy-50)<.01&&!q.sleeping,"快速睡覺 15 分鐘精力 +50 且自動醒："+q.energy+" "+q.sleeping);
 const q2=M.tickLocal({...base,sleeping:true,energy:0,items:it,updated_at:new Date(n-7.5*60e3).toISOString(),seen_at:new Date(n-7.5*60e3).toISOString()},n-0);
 check(Math.abs(q2.energy-25)<.01,"快速睡覺睡一半回一半："+q2.energy)}
// 在屋裡／門口（和 town_inside 一致）：沒有旗標的舊角色視為在屋裡
check(M.inside({id:5,place:"home:5",items:{}})&&M.inside({id:5,place:"home:5"})&&!M.inside({id:5,place:"home:5",items:{dr:1}})&&!M.inside({id:5,place:"street",items:{}})&&!M.inside({id:5,place:"home:6",items:{}}),"inside 判斷");
// 離線保護：最後動作 30 分鐘之後 ×0.4、最低停在 15
{const n=Date.UTC(2026,0,1,12,0,0),u=new Date(n-10*36e5).toISOString(),sa=new Date(n-10*36e5).toISOString();
 const a=M.tickLocal({...base,updated_at:u,seen_at:sa},n); // 前 0.5 小時上線（飽足 −4）、0.5～1 小時離線醒著 ×0.4（−1.6）、1 小時後待機太久回家睡覺（睡 9 小時、離線 ×0.4：−18）
 check(Math.abs(a.hunger-(80-4-1.6-18))<1e-6,"離線 ×0.4＋待機 60 分鐘後睡覺："+a.hunger);
 const a1=M.tickLocal({...base,updated_at:new Date(n-36e5).toISOString(),seen_at:new Date(n-36e5).toISOString()},n);
 check(Math.abs(a1.hunger-74.4)<1e-6&&Math.abs(a1.energy-76.5)<1e-6,"待機正好 1 小時還沒睡："+a1.hunger+" "+a1.energy);
 check(Math.round(a.energy)==100,"待機睡覺會回精力");
 const b=M.tickLocal({...base,updated_at:new Date(n-72*36e5).toISOString(),seen_at:new Date(n-72*36e5).toISOString()},n);
 check(["hunger","bladder","hygiene","fun"].every(k=>b[k]>=15)&&b.energy>=15,"離線很久，需求最低停在 15："+JSON.stringify(b));
 const c=M.tickLocal({...base,hunger:10,updated_at:u,seen_at:sa},n);check(c.hunger==10||Math.abs(c.hunger-10)<1e-6||c.hunger<10,"本來低於 15 的不會被拉高到 15")}
// 個性特質與心情（規則要和 town.sql 一致）
const mk=(o,tr)=>({...base,...o,items:{tr}});
check(M.moodOf(mk({},[]))=="happy","80 全滿應該開心");
check(M.moodOf(mk({fun:30},[]))=="annoyed","心情 30 應該煩躁");
check(M.moodOf(mk({fun:70,hunger:15},[]))=="annoyed","有一項低於 20 應該煩躁");
check(M.moodOf(mk({fun:10},[]))=="low","心情 10 應該低落");
check(M.moodOf(mk({hunger:20,energy:20,bladder:20,hygiene:20,fun:60},[]))=="low","平均 < 35 應該低落");
check(M.moodOf(mk({fun:60},[]))=="normal","心情 60、其他 80 應該普通");
check(M.payOf(100,mk({},[]))==110&&M.payOf(130,mk({fun:30},[]))==124&&M.payOf(100,mk({fun:10},[]))==90&&M.payOf(100,mk({fun:60},["workaholic"]))==110&&M.payOf(100,mk({},["workaholic"]))==121,"薪水算法不對");
check(Math.abs(M.tickLocal(mk({},["clean"]),10*36e5).hygiene-(80-35))<1e-6,"愛乾淨醒著 10 小時清潔應該掉 35");
{const n=Date.UTC(2026,0,1,15,0,0),u=new Date(n-4*36e5).toISOString(); // 台灣 23:00，前 4 小時從 19:00 起，22～23 點 1 小時算夜間
 const e=M.tickLocal({...base,updated_at:u,items:{tr:["nightowl"]}},n).energy,e0=M.tickLocal({...base,updated_at:u},n).energy;check(Math.abs((e-e0)-1)<1e-6,"夜貓子夜間精力每小時少掉 1："+(e-e0))}
// 家具：好床睡覺精力 +90/小時；家具表和房子等級
check(Math.round(M.tickLocal({...base,sleeping:true,energy:0,items:{fu:["bed"]}},1*36e5).energy)==90,"好床睡 1 小時精力應該是 90");
check(M.hasF({items:{fu:["","fridge"]}},"fridge")&&!M.hasF({items:{f:["fridge"]}},"fridge"),"只有擺出來的家具才有效果");
check(M.FURN.length==8&&M.HOUSES.map(h=>h[2]).join()=="4,6,8,9"&&M.HOUSES.map(h=>h[1]).join()=="0,13000,100000,200000","家具或房子等級表不對");
// 路邊物件：不在牆裡、從每間房子的門都走得到、人站的位置和資料庫的距離判斷一致
for(let rows=2;rows<=4;rows++){M.setRows(rows);for(const [k,o] of Object.entries(M.OBJS)){if(o.x==null)continue;check(!M.blocked(o.x,o.y)||false,`${rows} 排：物件 ${k} 在牆裡`);const stand=[o.x,o.y+(o.y==5?1:0)];check(!M.blocked(...stand),`${rows} 排：物件 ${k} 站不上去`);for(let s=0;s<rows*3;s++)check(M.bfs(M.door(s),stand),`${rows} 排：房子 ${s} 走不到物件 ${k}`)}}
// 其他工作：薪水階梯、拉菲辦公室座標（要和 town.sql 一致）
check(M.pjWage("cafe",0)==200&&M.pjWage("cafe",15)==230&&M.pjWage("cafe",40)==260&&M.pjWage("gym",0)==230&&M.pjWage("shop",15)==224&&M.pjWage("rest",40)==273&&M.pjWage("rafi",0)==320&&M.pjWage("rafi",15)==450&&M.pjWage("rafi",40)==650,"其他工作薪水表不對");
check(M.pjName("rafi",15)=="企劃"&&M.pjName("cafe",40)=="咖啡師（資深）","其他工作職稱不對");
check(M.PLACES.rafi&&M.PLACES.rafi.door[0]==46&&M.PLACES.rafi.door[1]==21,"拉菲辦公室門口不對");
check(M.PLACES.stock&&M.PLACES.stock.door[0]==42&&M.PLACES.stock.door[1]==5&&!M.blocked(42,5),"證券交易所門口不對");
console.log(`檢查 2～4 排房子，共 ${routes} 條路線`);
if(fails.length){console.log("❌ 測試失敗：\n- "+fails.join("\n- "));process.exit(1)}console.log("✅ 全部通過");
