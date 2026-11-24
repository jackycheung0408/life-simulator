// 商品目錄第一批（超市）：解析 supabase/town_catalog1.sql 的 town_catalog() JSON，檢查平衡與「前端沒有第二份價格表」
module.exports=(M,check)=>{const fs=require("fs"),sq=fs.readFileSync(__dirname+"/../supabase/town_shelf1.sql","utf8"),sq0=fs.readFileSync(__dirname+"/../supabase/town_catalog2.sql","utf8"),sq2=fs.readFileSync(__dirname+"/../supabase/town_shelf2.sql","utf8"),sq1=fs.readFileSync(__dirname+"/../supabase/town_catalog1.sql","utf8"),js=fs.readFileSync(__dirname+"/town.js","utf8"),mf=JSON.parse(fs.readFileSync(__dirname+"/../tools/sql/manifest.json","utf8"));
 const m=sq.match(/\$j\$(\[[\s\S]*?\])\$j\$/);check(!!m,"找不到 town_catalog() JSON");if(!m)return;const C=JSON.parse(m[1]),ids=new Set();
 check(C.length==82&&C.filter(c=>c.shop=="market").length==33&&C.filter(c=>c.season).length==11,"目錄應為 82 列（超市 33、限定 11）："+C.length);
 const R0=C.filter(c=>c.rot);["market","cafe","restaurant"].forEach(sh=>{const all=C.filter(c=>c.shop==sh&&!c.season),rot=all.filter(c=>c.rot);check(rot.length>0&&rot.length/all.length<=0.4,sh+" 輪替商品占比 "+rot.length+"/"+all.length+" 要 ≤ 40%（固定款 ≥ 60%）");check(C.some(c=>c.shop==sh&&c.hr),sh+" 要有時段菜單");check(C.some(c=>c.shop==sh&&c.season),sh+" 要有節慶商品")});check(!C.some(c=>c.rot&&!["market","cafe","restaurant"].includes(c.shop)),"輪替只開在超市、餐廳、咖啡廳");const SH=["market","cafe","restaurant","cinema","gym","park","plaza"];
 // 自己的效果價值錨點：飽足 €2、精力 €6、心情 €5、清潔 €3（只算對自己的效果；禮物的好處在對方身上、掌機另算電池）
 const A={hu:2,en:6,fun:5,hy:3,bl:0,cure:30};
 C.forEach(c=>{check(!ids.has(c.id),"商品 id 重複 "+c.id);ids.add(c.id);check(SH.includes(c.shop)&&c.p>0&&c.nm&&c.ic&&["eat","tool","gift","col","now"].includes(c.bag),"商品欄位不完整 "+c.id);
  const f=c.fx||{};check(!Object.keys(f).some(k=>/money|cash|coin|price/.test(k)),"商品不可給錢 "+c.id);check(!c.season||/^\d{4}-\d{4}$/.test(c.season),"季節格式 "+c.id);
  if(c.gift)return;let v=0;for(const k in A)if(f[k])v+=A[k]*f[k];const cap=c.dur?c.p/c.dur:c.p;check(!c.rot||v<=c.p*0.7,"輪替商品清倉（7 折）後效果價值 "+v+" 超過 "+(c.p*0.7)+" "+c.id);check(!c.dur||c.out!==undefined,"耐久商品要標戶外 "+c.id);check(c.bag!="now"||!c.gift,"現場用不能送禮 "+c.id);check(!c.hr||c.hr.length==2,"時段格式 "+c.id);check(!c.fund||(c.fund>0&&c.fund<=50),"進基金比例 "+c.id);
  if(c.sp=="game"){const bat=C.find(x=>x.id=="battery").p;check(v<=bat+5,"掌機每次效果價值 "+v+" 超過電池成本 "+bat)}else check(v<=cap,c.id+" 效果價值 "+v+" > 價格 "+cap)});
 check(C.filter(c=>c.cat=="food"||c.cat=="drink"||c.cat=="daily").some(c=>!c.season),"特價池不可為空");
 // 收藏／禮物不能換錢：SQL 內不能有把 money 加回去的程式（只有付款扣錢）
 const fn=sq.slice(sq.lastIndexOf("create or replace function public.town_goods"));check(!/r\.money\s*:=\s*r\.money\s*\+/.test(fn)&&!/t\.money\s*:=/.test(fn),"town_goods 不可給錢");
 check(fn.includes("sg < 3")&&fn.includes("town_need_in_pl")&&fn.includes("town_jailed")&&fn.includes("town_px"),"town_goods 缺特價上限／進館／入獄／全鎮事件價");
 check(sq1.includes("umbrella")&&sq1.includes("town_catalog1_patch('town_tick'"),"缺雨傘 town_tick 補丁");check(/hall|town_fund_add/.test(fn)&&fn.includes("town_pl_prog")&&fn.includes("town_cat_hr"),"town_goods 缺基金／教練課／時段");
 // 前端沒有第二份價格表：town.js 不可出現新商品 id 的字串
 C.forEach(c=>{if(new RegExp('["\']'+c.id+'["\']').test(js))check(false,"town.js 不可寫死商品 id "+c.id)});
 ["town_catalog1.sql","town_catalog1_test.sql","town_catalog2.sql","town_catalog2_test.sql","town_shelf1.sql","town_shelf2.sql","town_shelf1_test.sql"].forEach(f=>check(mf.files.some(x=>x.file==f),"manifest 缺 "+f));
 check(sq.includes("town_shelf_live")&&sq.includes("town_shelf_until")&&sq.includes("town_shelf_special")&&fn.includes("town_shelf_live(c, today")&&fn.includes("* 70 + 50"),"town_goods 缺每日輪替／清倉");check(sq2.includes("town_shelf_special(''restaurant''")&&sq2.includes("town_shelf_special(''cafe''"),"shelf2 缺特餐／特調");check(/今日上新/.test(js)&&js.includes("shelfNews")&&js.includes("town-shelfn"),"前端缺今日上新／toast／通知");
 check(js.includes('rpc("town_goods"')&&js.includes("新商品還沒上架"),"前端要有舊伺服器退回");
};
