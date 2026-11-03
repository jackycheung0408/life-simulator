// 小豬鎮自動測試：node town/test.js
// 檢查：每個門都走得到、門不在牆裡、資料庫的初始位置在門口、需求扣減算法
const M=require("./town.js"),fails=[];const check=(ok,msg)=>{if(!ok)fails.push(msg)};
const doors=[...M.IDS.map(id=>["home:"+id,M.door(id)]),...Object.entries(M.PLACES).map(([k,p])=>[k,p.door])];
for(const [n,d] of doors)check(!M.blocked(...d),`${n} 的門在牆裡`);
for(const [a,da] of doors)for(const [b,db] of doors)if(a!=b)check(M.bfs(da,db),`${a} 走不到 ${b}`);
// 點房子要對到自己的家
for(const id of M.IDS){const [hx,hy]=M.HOMES[id],p=M.placeAt(hx+1,hy+1);check(p&&p.dest=="home:"+id,`點 ${id} 的房子沒有對到他家`)}
// supabase/town.sql 裡的初始位置要和門口一致
const sql=require("fs").readFileSync(require("path").join(__dirname,"../supabase/town.sql"),"utf8");
for(const id of M.IDS){const m=sql.match(new RegExp(`\\('${id}','\\w+',(\\d+),(\\d+),'home:${id}'\\)`)),d=M.door(id);check(m&&+m[1]==d[0]&&+m[2]==d[1],`${id} 的初始位置不在門口`)}
// 需求：醒著 10 小時，飽足 80 → 40；睡覺 5 小時，精力 20 → 90
const base={joined:true,sleeping:false,hunger:80,energy:80,bladder:80,hygiene:80,fun:80,updated_at:new Date(0).toISOString()};
check(Math.round(M.tickLocal(base,10*36e5).hunger)==40,"醒著 10 小時飽足應該是 40");
check(Math.round(M.tickLocal({...base,sleeping:true,energy:20},5*36e5).energy)==90,"睡 5 小時精力應該是 90");
check(M.tickLocal(base,200*36e5).hunger==0,"需求不能低於 0");
console.log(`檢查 ${doors.length} 個門、${doors.length*(doors.length-1)} 條路線`);
if(fails.length){console.log("❌ 測試失敗：\n- "+fails.join("\n- "));process.exit(1)}console.log("✅ 全部通過");
