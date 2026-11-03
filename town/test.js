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
// 需求：醒著 10 小時，飽足 80 → 40；睡覺 5 小時，精力 20 → 90
const base={sleeping:false,hunger:80,energy:80,bladder:80,hygiene:80,fun:80,updated_at:new Date(0).toISOString()};
check(Math.round(M.tickLocal(base,10*36e5).hunger)==40,"醒著 10 小時飽足應該是 40");
check(Math.round(M.tickLocal({...base,sleeping:true,energy:20},5*36e5).energy)==90,"睡 5 小時精力應該是 90");
check(M.tickLocal(base,200*36e5).hunger==0,"需求不能低於 0");
console.log(`檢查 2～4 排房子，共 ${routes} 條路線`);
if(fails.length){console.log("❌ 測試失敗：\n- "+fails.join("\n- "));process.exit(1)}console.log("✅ 全部通過");
