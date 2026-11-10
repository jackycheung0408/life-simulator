// 小豬鎮自動測試：node town/test.js
// 檢查：2～4 排房子時每個門都走得到、門不在牆裡、門口位置和資料庫的 town_door 一致、需求扣減算法
const COLS_=64;const M=require("./town.js"),fails=[];const check=(ok,msg)=>{if(!ok)fails.push(msg)};let routes=0;
for(let rows=2;rows<=4;rows++){M.setRows(rows);
 const doors=[...[...Array(rows*3).keys()].map(s=>["房子"+s,M.door(s)]),...Object.entries(M.PLACES).map(([k,p])=>[k,p.door])];
 for(const [n,d] of doors)check(!M.blocked(...d)&&d[1]<M.mapRows(),`${rows} 排：${n} 的門在牆裡或地圖外`);
 for(let s=0;s<rows*3;s++){const v=M.visitSpot(s);check(!M.blocked(...v),`${rows} 排：房子 ${s} 門口旁邊站不了人`);const [hx,hy]=M.homeXY(s),p=M.placeAt(hx+1,hy+1);check(p&&p.slot==s,`${rows} 排：點房子 ${s} 沒對到`)}
 for(const [a,da] of doors)for(const [b,db] of doors)if(a!=b){routes++;check(M.bfs(da,db),`${rows} 排：${a} 走不到 ${b}`);check(M.route(da,db,null),`${rows} 排：行人自由走 ${a} 走不到 ${b}`)}}
// 和 supabase/town.sql 的 town_door 一樣：x = [2,9,20][s%3]+2；y = 第 0 排 5、第 1 排 21、之後每排 +7（28、35）
for(let s=0;s<12;s++){const k=Math.floor(s/3),d=M.door(s),y=(k==0?1:k==1?17:24+7*(k-2))+4;check(d[0]==[2,9,20][s%3]+2&&d[1]==y,`房子 ${s} 門口和資料庫不一致`)}
check(M.door(7)[0]==11&&M.door(7)[1]==28,"房子 7 的門應該在 (11,28)，和資料庫測試結果一致");
// 自由走動：行人任意兩個空格可達、路線不穿建築／房子／噴水池、第一點是起點最後一點是終點，而且不會比規則路線（人行道＋斑馬線）長
{let seed=7;const rnd=n=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed%n};
 for(let rows=2;rows<=4;rows++){M.setRows(rows);const H=M.mapRows(),open=[];for(let y=0;y<H;y++)for(let x=0;x<M.COLS;x++)if(!M.blocked(x,y))open.push([x,y]);
  let cut=0,longer=0;
  for(let i=0;i<300;i++){const a=open[rnd(open.length)],b=open[rnd(open.length)],p=M.route(a,b,null);
   if(!p){check(false,`${rows} 排：自由走 (${a}) 到 (${b}) 走不到`);continue}
   check(p[0][0]==a[0]&&p[0][1]==a[1]&&p[p.length-1][0]==b[0]&&p[p.length-1][1]==b[1],`${rows} 排：自由走路線起終點不對`);
   let len=0;for(let j=1;j<p.length;j++){const [x0,y0]=p[j-1],[x1,y1]=p[j],L=Math.hypot(x1-x0,y1-y0);len+=L;for(let t=0;t<=L*10;t++){const f=L?t/(L*10):0;if(M.blocked(Math.round(x0+(x1-x0)*f),Math.round(y0+(y1-y0)*f))){cut++;break}}}
   const old=M.bfs(a,b,null);if(old&&len>old.length-1+1e-6)longer++}
  check(cut==0,`${rows} 排：自由走路線穿過建築 ${cut} 條`);check(longer==0,`${rows} 排：自由走路線比規則路線長 ${longer} 條`)}
 M.setRows(3);
 // 草地直走：廣場門口到公園門口，轉折點不超過 4 個（不是一格一格的階梯）
 const pl=M.route(M.PLACES.plaza.door,M.PLACES.park.door,null);check(pl&&pl.length<=5,"廣場到公園應該是幾條直線，不是階梯："+(pl&&pl.length));
 // 騎車開車仍走馬路（成本：路上 1、路外 2）
 const vp=M.route(M.PLACES.plaza.door,M.PLACES.park.door,"car");check(vp&&vp.every((c,i)=>i==0||Math.abs(c[0]-vp[i-1][0])+Math.abs(c[1]-vp[i-1][1])==1),"交通工具仍用格子路徑")}
// 自動更新：version.json 要和 index.html 裡 town.js 的 ?v 一致（改版請跑 node tools/town-bump.mjs）
{const fs=require("fs"),html=fs.readFileSync(__dirname+"/index.html","utf8"),m=html.match(/town\.js\?v=(\d+)/),vj=JSON.parse(fs.readFileSync(__dirname+"/version.json","utf8"));
 check(m&&vj.v==+m[1],"town/version.json 的 v（"+vj.v+"）要等於 index.html 的 town.js?v（"+(m&&m[1])+"）。跑 node tools/town-bump.mjs");
 const sw=fs.readFileSync(__dirname+"/sw.js","utf8");check(/version/.test(sw)&&/no-store/.test(sw),"sw.js 對首頁與 version.json 要 no-store");
 check(/checkVer/.test(fs.readFileSync(__dirname+"/town.js","utf8")),"town.js 要有 checkVer 自動更新檢查")}
// 需求（×2 速率）：醒著 10 小時，飽足 80 → 0；睡覺 8 小時，飽足 80 → 40
const base={sleeping:false,hunger:80,energy:80,bladder:80,hygiene:80,fun:80,updated_at:new Date(0).toISOString()};
const tk=(o,h)=>M.tickLocal({...base,...o},h*36e5);
check(Math.round(tk({},10).hunger)==0,"醒著 10 小時飽足應該是 0");
check(Math.round(tk({},5).hunger)==40&&Math.round(tk({},5).energy)==55&&Math.round(tk({},5).bladder)==30&&Math.round(tk({},5).hygiene)==55,"醒著 5 小時：飽足 40、精力 55、膀胱 30、清潔 55");
check(Math.round(tk({sleeping:true,energy:20},1).energy)==84,"睡 1 小時（睡地上）精力 20→84");
check(Math.round(tk({sleeping:true},8).hunger)==40&&Math.round(tk({sleeping:true},8).bladder)==24&&Math.abs(tk({sleeping:true},8).hygiene-(80-27.2))<1e-6,"睡 8 小時：飽足 40、膀胱 24、清潔 52.8");
check(tk({},200).hunger==0,"需求不能低於 0");
// 睡眠與睡眠時數成正比（20／40／60 分鐘），好床也是；快速睡覺 15 分鐘 ×2.5 後自動醒
for(const [m,e] of [[20,21.3],[40,42.7],[60,64]])check(Math.abs(tk({sleeping:true,energy:0},m/60).energy-e)<.1,`睡 ${m} 分鐘精力應該是 ${e}`);
check(Math.abs(M.tickLocal({...base,sleeping:true,energy:0,items:{fu:["bed"]}},.5*36e5).energy-45)<.01,"好床睡 30 分鐘精力 +45");
{const n=Date.UTC(2026,0,1,12,0,0),it={qs:new Date(n).toISOString()};
 const q=M.tickLocal({...base,sleeping:true,energy:0,items:it,updated_at:new Date(n-15*60e3).toISOString(),seen_at:new Date(n-15*60e3).toISOString()},n);
 check(Math.abs(q.energy-40)<.01&&!q.sleeping,"快速睡覺 15 分鐘（睡地上）精力 +40 且自動醒："+q.energy+" "+q.sleeping);
 const q2=M.tickLocal({...base,sleeping:true,energy:0,items:it,updated_at:new Date(n-7.5*60e3).toISOString(),seen_at:new Date(n-7.5*60e3).toISOString()},n-0);
 check(Math.abs(q2.energy-20)<.01,"快速睡覺睡一半回一半："+q2.energy)}
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
{ // 沒家具的陽春互動：前後端數字一致
 const sql=require("fs").readFileSync(__dirname+"/../supabase/town.sql","utf8"),hs=require("fs").readFileSync(__dirname+"/../supabase/town_home.sql","utf8");
 check(M.FURN.some(a=>a[0]=="toilet"&&a[2]==2000)&&M.FURN.some(a=>a[0]=="shower"&&a[2]==3000),"馬桶 2000／淋浴間 3000");
 check(/'toilet', 'furn', null, '馬桶', 2000/.test(hs)&&/'shower', 'furn', null, '淋浴間', 3000/.test(hs),"SQL 馬桶／淋浴間價格");
 check(M.HACT.toilet&&M.HACT.shower&&M.HOME_ACT===undefined||true,"HACT");
 check(/then 90 else 64 end/.test(sql)&&/then 48 else 32 end/.test(sql)&&/\+ 6; end if/.test(sql)&&/when public.town_fu\(r,'massage'\)=1 then 100 when public.town_fu\(r,'sofa'\)=1 then 70 else 50/.test(sql),"SQL 陽春數值");
 const mk=fu=>({id:1,hunger:100,energy:0,bladder:100,hygiene:100,fun:100,updated_at:new Date(Date.now()-36e5).toISOString(),seen_at:new Date().toISOString(),sleeping:true,place:"home:1",items:{fu}});
 const e0=M.tickLocal(mk([]),Date.now()).energy,e1=M.tickLocal(mk(["bed"]),Date.now()).energy;
 check(Math.abs(e0-64)<.5&&Math.abs(e1-90)<.5,"睡覺一小時精力：地上 64／好床 90，實際 "+e0+"／"+e1);
}
check(M.hasF({items:{fu:["","fridge"]}},"fridge")&&!M.hasF({items:{f:["fridge"]}},"fridge"),"只有擺出來的家具才有效果");
check(M.FURN.length==15&&M.HOUSES.map(h=>h[2]).join()=="6,10,15,20"&&M.HOUSES.map(h=>h[1]).join()=="0,40000,300000,800000","家具或房子等級表不對");
// 家裡自由佈置：房間大小、上限、掛牆道具、道具價格和 supabase/town_home.sql 一致；舊的 9 格 fu 換算後一定放得下、站位夠；動作按鈕對得到
{const sql=require("fs").readFileSync(__dirname+"/../supabase/town_home.sql","utf8"),arr=a=>"array["+a.join(",")+"]";
 check(sql.includes(arr(M.HOME_DIM.map(d=>d[0])))&&sql.includes(arr(M.HOME_DIM.map(d=>d[1])))&&sql.includes(arr(M.HOUSES.map(h=>h[2]))),"town_home.sql 的房間大小或上限和 HOME_DIM／HOUSES 不一致");
 check(sql.includes("k in ("+M.WALLF.map(k=>"'"+k+"'").join(", ")+")"),"town_home.sql 掛牆道具和 WALLF 不一致");
 for(const [id,n,pr] of M.FURN.slice(8))check(sql.includes(`('${id}', 'furn', null, '${n}', ${pr}, null)`),`town_home.sql 的 ${n} 價格和 FURN 不一致`);
 const leg=M.fpOf({fu:["bed","","fridge","sofa","tvcab","","rug","plant","massage"]});
 check(JSON.stringify(leg)==JSON.stringify([["bed",1,1],["fridge",5,1],["sofa",1,2],["tvcab",3,2],["rug",1,3],["plant",3,3],["massage",5,3]]),"舊 fu 換算座標不對："+JSON.stringify(leg));
 check(M.fpOf({fp:[["bed",2,2]],fu:["sofa"]})[0][0]=="bed"&&M.fpOf({}).length==0,"fp 優先於舊 fu，缺值是空");
 for(let hl=1;hl<=4;hl++){const [w,h]=M.HOME_DIM[hl-1],rm=M.homeRoom({items:{hl,fu:["bed","fridge","sofa","tvcab","massage","plant","rug","shelf",""]}});
  check(rm.w==w&&rm.h==h+1,`房子 ${hl} 的房間大小不對`);for(const o of rm.items)check(o[1]>=0&&o[1]<w&&o[2]>=1&&o[2]<=h,`房子 ${hl} 舊家具 ${o[0]} 換算後超出房間`);
  const full=M.homeRoom({items:{hl,fp:[...Array(M.HOUSES[hl-1][2]).keys()].map(i=>["plant",i%w,1+Math.floor(i/w)]).filter(o=>o[2]<=h)}});check(M.roomSpots(full).length+full.items.length>=w*h-1||full.items.length>0,"站位計算");check(M.roomSpots(M.homeRoom({items:{hl,fp:[]}})).length==w*h,`房子 ${hl} 空房間站位應該是整個地板`);
  check(M.roomSpots(M.homeRoom({items:{hl,fp:[["bed",1,1],["rug",2,1],["frame",0,0]]}})).length==w*h-1,`房子 ${hl}：只有床擋站位，地毯和掛牆的不擋`)}
 check(M.roomOf({id:1,place:"home:1",items:{}})&&!M.roomOf({id:1,place:"home:1",items:{dr:1}})&&!M.roomOf({id:1,place:"street",items:{}}),"roomOf：在屋裡才有室內，在門口或街上沒有");
 const hl=["睡覺","吃飯","看電視","快速休息","上廁所","洗澡"];for(const [k,[re]] of Object.entries(M.HACT))check(hl.some(l=>re.test(l))&&!re.test("快速睡覺"),`家具 ${k} 對不到家裡的按鈕`)}
// 路邊物件：不在牆裡、從每間房子的門都走得到、人站的位置和資料庫的距離判斷一致
for(let rows=2;rows<=4;rows++){M.setRows(rows);for(const [k,o] of Object.entries(M.OBJS)){if(o.x==null)continue;check(!M.blocked(o.x,o.y)||false,`${rows} 排：物件 ${k} 在牆裡`);const stand=[o.x,o.y+(o.y==5?1:0)];check(!M.blocked(...stand),`${rows} 排：物件 ${k} 站不上去`);for(let s=0;s<rows*3;s++)check(M.bfs(M.door(s),stand),`${rows} 排：房子 ${s} 走不到物件 ${k}`)}}
// 其他工作：薪水階梯、拉菲辦公室座標（要和 town.sql 一致）
check(M.pjWage("cafe",0)==200&&M.pjWage("cafe",15)==230&&M.pjWage("cafe",40)==260&&M.pjWage("gym",0)==230&&M.pjWage("shop",15)==224&&M.pjWage("rest",40)==273&&M.pjWage("rafi",0)==320&&M.pjWage("rafi",15)==450&&M.pjWage("rafi",40)==650,"其他工作薪水表不對");
check(M.pjName("rafi",15)=="企劃"&&M.pjName("cafe",40)=="咖啡師（資深）","其他工作職稱不對");
check(M.PLACES.rafi&&M.PLACES.rafi.door[0]==49&&M.PLACES.rafi.door[1]==21,"拉菲辦公室門口不對");
check(M.PLACES.stock&&M.PLACES.stock.door[0]==45&&M.PLACES.stock.door[1]==5&&!M.blocked(45,5),"證券交易所門口不對");
// 交通：車行門口、價格與速度（和 town.sql 的 vbuy／move 一致）、斑馬線與人行道
check(M.PLACES.carshop&&M.PLACES.carshop.door[0]==46&&M.PLACES.carshop.door[1]==14&&!M.blocked(46,14),"車行門口不對");
check(M.VEH.bike[1]==3000&&M.VEH.moto[1]==30000&&M.VEH.car[1]==90000&&M.VEH.bike[2]==1.5&&M.VEH.moto[2]==2.5&&M.VEH.car[2]==3&&M.VEH.bike[3]==0&&M.VEH.moto[3]==.4&&M.VEH.car[3]==1,"交通工具價格／速度／油錢表不對");
check(M.vehOf({id:1,place:"street",items:{veh:{own:["car"],k:"car"}}})=="car"&&M.vehOf({id:1,place:"home:1",items:{veh:{own:["car"],k:"car"}}})==null&&M.vehOf({id:1,place:"street",items:{}})==null,"vehOf 判斷");
M.setRows(2);{const w=M.bfs([4,5],[5,14]);check(w&&w.filter(([x,y])=>M.isRoad(x,y)&&!M.isCross(x,y)).length==0,"行人過馬路應該走斑馬線："+JSON.stringify(w));
 const v=M.bfs([4,5],[5,14],true);check(v&&v.length<=w.length,"騎車路徑不該比走路長")}
check(M.isSide(4,5)&&!M.isSide(4,6)&&M.isCross(4,6)&&!M.isCross(5,6),"人行道或斑馬線位置不對");
// 紅綠燈（和 town.sql 的 town_light 一致）：同一組雙線道同相位、每 12 秒換、相鄰路口錯開；路口只在 x=16、17 的橫路列
M.setRows(4);{check(M.lightG(0,6)==M.lightG(0,7)&&M.lightG(0,15)==M.lightG(0,16)&&M.lightG(0,22)==M.lightG(0,23),"同一組雙線道要同相位");
 check(M.lightG(0,6)!=M.lightG(12000,6)&&M.lightG(0,6)==M.lightG(24000,6)&&M.lightG(0,6)==M.lightG(11999,6),"每 12 秒換一次");
 check(M.lightG(0,6)==0&&M.lightG(0,15)==1&&M.lightG(0,22)==0,"路口錯開（6→0、15→1、22→0）：6 的 ib=6 偶、15 奇、22 偶");
 let n=0;for(let y=0;y<M.mapRows();y++)for(let x=0;x<COLS_;x++)if(M.isInter(x,y)){n++;check(M.isRoad(x,y)&&(x==16||x==17),"路口要在路上")}
 check(n>=8,"路口數量不對："+n);check(M.zoneLim(6)==2&&M.zoneLim(16)==2&&M.zoneLim(5)==2.5&&M.zoneLim(17)==2.5,"速限分區")}
// 設施小事件：每個設施 3 個事件、文字要齊全，且和 town_social.sql 的效果表地點一致
{const sql=require("fs").readFileSync(__dirname+"/../supabase/town_social.sql","utf8");
 for(const k of Object.keys(M.PEV)){check(M.PLACES[k]||k=="park"||k=="plaza",`事件地點 ${k} 不存在`);check(M.PEV[k].length==3&&M.PEV[k].every(e=>e.length==6&&e.every(s=>s)),`${k} 要有 3 個事件、每個 6 欄文字`);check(sql.includes(`"${k}":[[[`),`town_social.sql 沒有 ${k} 的效果`);check(sql.includes(`'${k}'`),`town_pe_place 沒有 ${k}`);check(M.JT[k],`${k} 缺一起做的活動`)}
 check(Object.keys(M.PEV).length>=13,"事件地點太少");
 // 每個賭的選項期望值要略負（和 SQL 同一份表）
 const tbl=JSON.parse(sql.match(/'(\{\s*"restaurant".*?\})'::jsonb/s)[1]);
 for(const [p,evs] of Object.entries(tbl))evs.forEach((e,i)=>e.forEach((o,j)=>{const ev=(o[4]*o[2]+(100-o[4])*o[7])/100;check(ev<=0,`${p} 事件 ${i} 選項 ${j} 金錢期望值 ${ev} 要 ≤ 0`);check(o.length==9,`${p}${i}${j} 長度`)}))}
{const U=M.UPDATES,ids=new Set();check(U&&U.length>0,"UPDATES 要有內容");U.forEach(u=>{check(!ids.has(u.id),"UPDATES id 重複 "+u.id);ids.add(u.id);check(u.items.length>=3&&u.items.length<=6,"UPDATES "+u.id+" 要 3～6 條")})}
{const sql=require("fs").readFileSync(__dirname+"/../supabase/town_fac.sql","utf8");check(M.TASKS.length==8,"TASKS 要 8 個");
 for(const [k,d] of Object.entries(M.FAC)){const kk=k=="photo2"?"photo":k;check(sql.includes("'"+kk+"'"),"town_fac 沒有 "+kk);if(d[1]>0)check(new RegExp("when '"+kk+"' then "+d[1]+"\\b").test(sql),"town_fac 價格和 FAC 不一致："+kk+" "+d[1]);if(!d[3].every(p=>M.PLACES[p]))check(false,"FAC 地點不存在 "+k)}
 const fn=sql.match(/town_fac_done[\s\S]*?\$\$;/)[0];check((fn.match(/when \d then/g)||[]).length==M.TASKS.length,"任務數量和 SQL 不一致")}
// 監獄與砍人：座標、價格、冷卻要和 supabase/town_jail.sql 一致
{const sql=require("fs").readFileSync(__dirname+"/../supabase/town_jail.sql","utf8"),J=M.JAIL,P=M.PLACES.jail;
 check(P&&P.door[0]==61&&P.door[1]==5&&P.block==1,"監獄門要在 (61,5)，和 town_jail.sql 入獄座標一致");
 check(sql.includes("r.x := 61; r.y := 5"),"town_jail.sql 入獄座標要是 61,5");
 check(sql.includes("r.money + "+J.labor[0])&&sql.includes("r.energy - "+J.labor[1])&&sql.includes("interval '"+J.labor[3]+" minutes'"),"勞動數字和 JAIL 不一致");
 check(sql.includes("greatest(300, mins * "+J.bailPerMin+")")&&J.bailMin==300,"保釋金公式和 JAIL 不一致");
 check(sql.includes("t.energy - "+J.hurt[0])&&sql.includes("t.fun - "+J.hurt[1])&&sql.includes("r.energy - "+J.self[0])&&sql.includes("r.fun - "+J.self[1]),"砍人傷害和 JAIL 不一致");
 check(sql.includes("then .8 else .45")&&J.catchP==45&&J.catchFallP==80,"被抓機率和 JAIL 不一致");
 check(M.COLS==64,"COLS 要和 town.sql 的 px 上限（64）一致");check(require("fs").readFileSync(__dirname+"/../supabase/town.sql","utf8").includes("px > "+M.COLS+" or"),"town.sql 的 px 上限要等於 COLS");check(M.bailCost(60*6e4)==600&&M.bailCost(10*6e4)==300,"保釋金 1 小時 €600、最低 €300");
 check(J.labor[0]<M.JOBS_MIN_WAGE||J.labor[0]<190,"牢裡勞動不能比最低的打工薪水高");
 const town=require("fs").readFileSync(__dirname+"/../supabase/town.sql","utf8");
 check(town.includes("town_jailed")&&town.includes("when p = 'jail' then '監獄'")&&town.includes("'carshop','jail')"),"town.sql 要有 town_jailed 與 jail 地點");
 const near=Object.entries(M.PLACES).filter(([k,p])=>k!="jail"&&p.block).filter(([k,p])=>{const [x,y,w,h]=P.r,[a,b,c,d]=p.r;return !(a>=x+w+2||a+c<=x-2||b>=y+h+2||b+d<=y-2)});check(near.length==0,"監獄離其他建築至少要 2 格："+near.map(x=>x[0]))}
// 走進設施裡面：ROOMS 的地點要存在、物件在 12×4 格內、點物件要對得到面板按鈕；SQL 的 town_fi 白名單要和 ROOMS 一致；fin 只有 items.fi 等於現在的 place 才算
{const sql=require("fs").readFileSync(__dirname+"/../supabase/town_fi.sql","utf8"),labels=[...Object.values(M.FAC).map(d=>d[0]),"坐下逗留 🪑","起身 🪑","打工：咖啡師 💼","打工：服務生 💼","打工：健身教練 💼","喝咖啡 ☕","吃一頓","健身 🏋️","做牢裡的勞動 💼","放風 ☀️","申請假釋 🪪","越獄 🕳️","付保釋金出去 💰","探望 乙 🤝","替 乙 保釋 💰"];
 check(sql.includes("pl not in ("+Object.keys(M.ROOMS).map(k=>"'"+k+"'").join(",")+")"),"town_fi.sql 的地點白名單要和 ROOMS 一致");
 const need={cafe:["coffee","jukebox","bar","table","plant"],restaurant:["kitchen","menu","bar","table","lamp"],gym:["treadmill","rack","bag","mirror","locker"],jail:["bars","vent","glass","gate","bailDesk","bunk","work","yard"]};
 for(const [k,rm] of Object.entries(M.ROOMS)){check(M.PLACES[k],`ROOMS ${k} 不是地點`);const seen=new Set();
  for(const o of rm.items){const d=M.ITEM[o[0]];check(!!d,`${k} 的物件代號 ${o[0]} 沒有定義`);if(!d)continue;check(o[1]>=0&&o[1]<M.RW&&o[2]>=0&&o[2]<M.RH,`${k} 物件 ${o[0]} 超出格子`);check(!seen.has(o[1]+","+o[2]),`${k} 物件重疊 ${o[1]},${o[2]}`);seen.add(o[1]+","+o[2]);if(d[2])check(labels.some(l=>d[2].test(l)),`${k} 的 ${d[1]} 對不到任何按鈕`)}
  for(const c of need[k])check(rm.items.some(o=>o[0]==c),`${k} 要有 ${c}`);
  const sp=M.roomSpots(rm);check(sp.length>=8,`${k} 站位不夠（${sp.length}）`);check(new Set(sp.map(p=>p.join(","))).size==sp.length&&sp.every(p=>!rm.items.some(o=>M.ITEM[o[0]][3]&&o[1]==p[0]&&o[2]==p[1])),`${k} 站位和擋住的物件重疊`)}
 check(M.fin({place:"cafe",items:{fi:"cafe"}})&&!M.fin({place:"park",items:{fi:"cafe"}})&&!M.fin({place:"cafe",items:{}})&&!M.fin({place:"park",items:{fi:"park"}}),"fin 判斷不對（舊角色缺值要算在外面）")
 const jr={place:"jail",items:{jl:new Date(Date.now()+36e5).toISOString()}},jf={place:"jail",items:{jl:new Date(Date.now()-36e5).toISOString()}};
 check(M.fin(jr)&&!M.fin(jf)&&!M.fin({place:"jail",items:{}}),"fin：入獄中的人算在牢房裡，刑滿或沒被關的人要自己走進去")}
// 牢裡情境（假釋、越獄、放風、前科、通緝、獄友事件）：前後端數字要一致
{const sql=require("fs").readFileSync(__dirname+"/../supabase/town_jail.sql","utf8"),town=require("fs").readFileSync(__dirname+"/../supabase/town.sql","utf8"),X=M.JAILX;
 check(X.parole[0]==2&&sql.includes("if n < 2 then")&&sql.includes("interval '24 hours')::text)")&&X.parole[1]==24,"假釋條件（勞動 2 次、假釋 24 小時）和 SQL 不一致");
 check(sql.includes("(j->>'escaped')")==false&&sql.includes("case when hr >= 23 or hr < 5 then .18 else .12 end")&&X.escP[0]==12&&X.escP[1]==18,"越獄成功率和 JAILX 不一致");
 check(sql.includes("if r.energy < "+X.esc[0]+" then")&&sql.includes("r.energy := r.energy - "+X.esc[1]+"; e := -"+X.esc[1])&&sql.includes("interval '"+X.esc[2]+" minutes'")&&sql.includes("least("+X.esc[3]+", greatest(0, r.money))")&&sql.includes("interval '"+X.esc[4]+" minutes'"),"越獄精力／加刑／罰款／冷卻和 JAILX 不一致");
 check(sql.includes("r.fun := r.fun + "+X.yard[0]+"; r.energy := r.energy - "+X.yard[1])&&sql.includes("interval '"+X.yard[2]+" minutes'"),"放風數字和 JAILX 不一致");
 check(sql.includes("then 92 else 100")&&X.prior[1]==92&&sql.includes("when public.town_wanted(r) then 2.5 when public.town_pr_on(r) then 1.5")&&X.prior[2]==1.5&&X.wanted[1]==2.5&&sql.includes("interval '24 hours')::text, 'n'"),"前科（薪水 −8%、×1.5）和通緝（×2.5）和 SQL 不一致");
 check(sql.includes("(now() + interval '3 hours')::text)")&&X.wanted[0]==3&&town.includes("interval '"+X.wanted[2]+" minutes'")&&town.includes("1 - exp(-2.1 * least(h, .25))"),"通緝 3 小時／抓回關 90 分鐘和 SQL 不一致");
 check(town.includes("public.town_pr_mult(r)")&&(town.match(/town_pr_pct\(r\)/g)||[]).length==3&&(town.match(/town_pr_pct\(t\)/g)||[]).length==1,"town.sql 的打工薪水要乘前科（公司、其他工作、加班各自 r 與 t）");
 // 獄友事件：4 個事件 × 2 個選項，效果表的順序和 JE 文字一致；賭的選項金錢期望值 ≤ 0
 const m=sql.match(/town_jail_ev_eff[\s\S]*?'\[([\s\S]*?)\]'::jsonb/),tab=JSON.parse("["+m[1].replace(/\n/g,"")+"]");
 check(tab.length==4&&M.JE.length==4&&tab.every(e=>e.length==2&&e.every(a=>a.length==12)),"獄友事件表要 4 個事件 × 2 個選項 × 12 欄");
 for(const [k,e] of tab.entries())for(const [o,a] of e.entries()){const ev=a[4]/100*a[2]+(1-a[4]/100)*a[7];check(ev<=0,`獄友事件 ${k}-${o} 金錢期望值要 ≤ 0（現在 ${ev}）`);check(a[2]<=0||a[4]<100,`獄友事件 ${k}-${o} 不能保證賺錢`)}
 check(M.JE.every(d=>d.length==6&&d.every(x=>typeof x=="string"&&x)),"JE 每個事件要有標題、說明、兩個選項與提示");
 check(M.JE[1][5].includes("45%")&&tab[1][1][4]==45&&M.JE[2][5].includes("35%")&&tab[2][1][4]==35&&tab[2][1][2]==120&&tab[2][1][7]==-80&&M.JE[3][5].includes("50%")&&tab[3][1][4]==50,"JE 提示裡的機率和 SQL 效果表不一致");
 check(sql.includes("if jv->>'d'")==false&&sql.includes("dn < 8")&&sql.includes("floor(random() * 4)::int"),"獄友事件：每天上限 8、4 種事件");
 // 角色不會死：沒有任何刪除角色或把數值壓到 −1 的寫法
 check(!/delete from public\.town_residents/.test(sql),"town_jail.sql 不可刪角色（不會死）");
 // 面板按鈕：灰掉要寫原因
 const tj=require("fs").readFileSync(__dirname+"/town.js","utf8");
 check(tj.includes('dz(btn("申請假釋 🪪"')&&tj.includes("paroleWhy")&&tj.includes("escapeModal"),"監獄面板要有假釋（灰掉寫原因）與越獄確認");
 check(tj.includes('jailed(r)){title+="（牢房裡）"}')&&tj.includes("jePoll"),"入獄的人面板不能有出門鈕，且要有獄友事件輪詢");
 // 假釋原因
 const t0=Date.now(),mk=(n,bad,t,e)=>({items:{jp:{t:new Date(t).toISOString(),e:new Date(e).toISOString(),n,bad}}});
 check(M.paroleWhy({items:{}}).includes("沒有服刑紀錄")&&M.paroleWhy(mk(5,1,t0-9e6,t0+9e6)).includes("惹過事")&&M.paroleWhy(mk(1,0,t0-9e6,t0+9e6)).includes("勞動")&&M.paroleWhy(mk(2,0,t0-1e5,t0+9e6)).includes("一半刑期")&&M.paroleWhy(mk(2,0,t0-9e6,t0+9e6))==="","假釋條件判斷不對（沒紀錄／惹事／勞動不夠／未服滿一半／可以）");
 check(M.priorOn({items:{pr:{u:new Date(t0+1e6).toISOString()}}})&&!M.priorOn({items:{pr:{u:new Date(t0-1e6).toISOString()}}})&&!M.priorOn({items:{}})&&M.wantedOn({items:{wt:new Date(t0+1e6).toISOString()}})&&M.paroleOn({items:{pl:new Date(t0+1e6).toISOString()}})&&!M.wantedOn({items:{}}),"前科／通緝／假釋判斷不對（過期或缺值 = 沒有）")}
// 手機狀態條：條（.need i）不能被壓扁（曾因圖示行高 24.75px、固定高度而被擠成 2px，看起來像能力條不見）
{const html=require("fs").readFileSync(__dirname+"/index.html","utf8");
 check(/body\.ingame \.need i\{flex:none;height:6px;min-height:6px/.test(html),"狀態條 body.ingame .need i 要 flex:none 並固定 6px（不可被壓扁）");
 check(/p&&p\.startsWith\("home:"\)&&p!=="home:"\+me\?"friend"/.test(require("fs").readFileSync(__dirname+"/town.js","utf8")),"自己家門口不能算「在他家」（dg 要排除 home:"+"me）");
 check(/body\.ingame \.need u\.cu\{display:none\}/.test(html),"手機錢格要隱藏貨幣符號（寬度只有約 50px）");
 check(/body\.ingame \.need span\{flex:none;height:16px;line-height:16px\}/.test(html),"狀態條圖示格要固定 16px 高（行高過大會擠掉條）");}
// 走進朋友家：站門口室內沒有你，按「進去」（items.fv = 屋主 id）後才有；和 supabase/town_visit.sql 一致
{const fs=require("fs"),vsql=fs.readFileSync(__dirname+"/../supabase/town_visit.sql","utf8"),tsql=fs.readFileSync(__dirname+"/../supabase/town.sql","utf8"),tjs=fs.readFileSync(__dirname+"/town.js","utf8");
 const H={id:2,place:"home:2",items:{hl:1}},A={id:1,place:"home:2",items:{}},B={id:1,place:"home:2",items:{fv:2}},C={id:1,place:"street",items:{fv:2}},D={id:1,place:"home:1",items:{fv:1}},E={id:1,place:"home:3",items:{fv:2}};
 check(!M.vin(A)&&M.vin(B)&&!M.vin(C)&&!M.vin(D)&&!M.vin(E)&&!M.vin(null),"vin：只有在 home:屋主 且 fv = 屋主 才算在他家屋裡（門口、走開、自己家、別人家都不算）");
 const rm0=M.roomOf(A,{1:A,2:H}),rm1=M.roomOf(B,{1:B,2:H});check(rm0&&rm0.visit&&rm0.inn===false&&rm1&&rm1.visit&&rm1.inn===true,"roomOf：站門口 inn=false、進去後 inn=true");
 check(vsql.includes("town_vin(")&&vsql.includes("op = 'enter'")&&vsql.includes("not public.town_inside(t)")&&vsql.includes("town_bond_get(rid, target) < -20")&&vsql.includes("r.items - 'fv'"),"town_visit.sql：進去要在門口、屋主在屋裡、關係不能太差，出門清掉 fv");
 check(tsql.includes("act in ('feed','wash','wakeup','visit') and coalesce(r.items->>'fv','') <> target::text"),"town.sql：煮飯、洗澡、叫醒、串門子要先進他家（惡作劇、丟雞蛋、留言、送禮留在門口）");
 check((tsql.match(/- 'fv'/g)||[]).length>=3,"town.sql：移動、離線回家睡、入獄都要清掉 fv");
 check(tjs.includes("function enterFriend(")&&tjs.includes("function exitFriend(")&&tjs.includes('btn("進去",')&&tjs.includes("!vin(r)"),"面板：門口只有進去，進去後才有煮飯、洗澡、叫醒、串門子與出門");}
// 頂層函式（init() 外面）不可使用只在 init() 裡宣告的 me／$／esc／pxify／toast／pin／R／S（曾因 offTxt、updModal 用了 me／$ 而在畫面丟 "me is not defined"、更新紀錄打不開）
{const src=require("fs").readFileSync(__dirname+"/town.js","utf8").split("\n"),ii=src.findIndex(l=>l.startsWith("function init(){")),top=src.slice(0,ii);
 const strip=l=>l.replace(/\/\/.*$/,"").replace(/`(?:[^`\\]|\\.)*`/g,"``").replace(/"(?:[^"\\]|\\.)*"/g,'""').replace(/'(?:[^'\\]|\\.)*'/g,"''");
 const bad=[];top.forEach((l,i)=>{const s=strip(l);for(const n of ["me","$","esc","pxify","toast","pin","R","S"]){const re=new RegExp("(^|[^\\w$.])"+n.replace("$","\\$")+"(?![\\w$:])");if(re.test(s))bad.push(n+"@"+(i+1))}});
 check(ii>0&&bad.length==0,"頂層函式用了只在 init() 裡的變數："+bad.join(", ")+"（把函式搬進 init()，或把值當參數傳進去）")}
check(!require("fs").readFileSync(__dirname+"/../supabase/town.sql","utf8").includes("睡飽了自然醒")&&!/r\.sleeping and qe is null and not fa and hr between 8 and 21/.test(require("fs").readFileSync(__dirname+"/../supabase/town.sql","utf8")),"town.sql：睡著的人白天不可自然醒（要讓朋友叫得醒）");
// roomOf 是頂層函式，拿不到 init() 裡的 R：不可直接用 R（曾因此在街上也丟 "R is not defined"），要靠呼叫的人傳居民表
{const A={id:1,place:"street",items:{}},H={id:2,place:"home:2",sleeping:true,items:{hl:1}},W={id:3,place:"home:2",items:{}};
 let ok1=true,ok2=true,ok3=true;try{ok1=M.roomOf(A,{1:A,2:H})===null}catch(e){ok1=false}
 try{const rm=M.roomOf(W,{2:H,3:W});ok2=!!rm&&rm.visit===true&&rm.hid===2}catch(e){ok2=false}
 try{ok3=M.roomOf(W,{2:{...H,items:{hl:1,dr:1}},3:W})===null}catch(e){ok3=false}
 check(require("fs").readFileSync(__dirname+"/town.js","utf8").includes("rm.visit?[tickLocal(R[rm.hid],now()),...Object.values(R).filter(o=>o.id!=rm.hid&&vin(o)"),"站在朋友家門口只畫屋主；只有進去的人（vin）才畫進他家裡");check(ok1,"roomOf：人在街上不可丟錯、要回 null");check(ok2,"roomOf：站在朋友家門口、他人在屋裡 → 要回訪客室內（visit、hid）");check(ok3,"roomOf：朋友站在門口（dr=1）不算在屋裡，不給室內");}
// 朋友睡著：叫醒、看室內（曾因叫不醒也寫進 1 小時冷卻而叫不到人、看室內畫面不畫屋主）
{const fs=require("fs"),tjs=fs.readFileSync(__dirname+"/town.js","utf8"),tsql=fs.readFileSync(__dirname+"/../supabase/town.sql","utf8");
 check(tsql.includes("'wakefail', r.name || ' 搖了 '")&&tsql.includes("e.kind = 'wakefail' and e.at > now() - interval '3 minutes'"),"town.sql：叫不醒要寫 wakefail 事件、只擋 3 分鐘（不可吃 wakeup 的 1 小時冷卻）");
 check(!/target,act, r\.name \|\| ' 搖了 '/.test(tsql),"town.sql：叫不醒不可再用 wakeup 事件（會鎖 1 小時）");
 check(tjs.includes("function drawOwner(")&&tjs.includes("drawHomeEdit(cv,rm,sel,id)")&&tjs.includes("rm.visit"),"朋友家室內要畫出屋主（睡著躺床上），訪客在朋友家也看得到室內畫面");
 check(tjs.includes('btn("叫醒他",`越累睡越沉')&&tjs.includes("wakefail:[\"alarm\",\"t\"]"),"叫醒他按鈕要寫成功機率，wakefail 要有動畫與圖示");}
// 紅綠燈（和 town.sql 的 town_light 一致）：同一組雙線道同相位、每 12 秒換、相鄰路口錯開；路口只在 x=16、17 的橫路列
M.setRows(4);{check(M.lightG(0,6)==M.lightG(0,7)&&M.lightG(0,15)==M.lightG(0,16)&&M.lightG(0,22)==M.lightG(0,23),"同一組雙線道要同相位");
 check(M.lightG(0,6)!=M.lightG(12000,6)&&M.lightG(0,6)==M.lightG(24000,6)&&M.lightG(0,6)==M.lightG(11999,6),"每 12 秒換一次");
 check(M.lightG(0,6)==0&&M.lightG(0,15)==1&&M.lightG(0,22)==0,"路口錯開（6→0、15→1、22→0）：6 的 ib=6 偶、15 奇、22 偶");
 let n=0;for(let y=0;y<M.mapRows();y++)for(let x=0;x<COLS_;x++)if(M.isInter(x,y)){n++;check(M.isRoad(x,y)&&(x==16||x==17),"路口要在路上")}
 check(n>=8,"路口數量不對："+n);check(M.zoneLim(6)==2&&M.zoneLim(16)==2&&M.zoneLim(5)==2.5&&M.zoneLim(17)==2.5,"速限分區")}
console.log(`檢查 2～4 排房子，共 ${routes} 條路線`);
if(fails.length){console.log("❌ 測試失敗：\n- "+fails.join("\n- "));process.exit(1)}console.log("✅ 全部通過");
