-- 小豬鎮：店內架上商品每天輪替（超市、餐廳、咖啡廳）＋時段菜單＋節慶角落。要在 town_catalog2.sql 之後套用；可重複執行；實測 town_shelf1_test.sql（回滾）。
-- 重建 town_catalog()（54 → 82 列，加商品只改這裡）與 town_goods；新增 town_shelf_live／town_shelf_until／town_shelf_special／town_cat_sale(3 參數)。
-- 規則：每天輪替用「日期＋小鎮 id＋商品 id」雜湊（台灣日、決定性、同鎮所有人看到一樣、不用排程）。商品加 "rot":1 就進輪替池：每天各約 50% 機率上架；
--   昨天沒上今天上＝「新」；明天不上＝「清倉」（7 折）；固定款沒有 rot 永遠在；季節 season、時段 hr 沿用。
-- 每人每天打折份數（特價＋清倉合計）最多 3（items.sg），超過照原價；每人每天限量沿用 day／items.dl。庫存不共享。
-- 經濟：全部純出口；輪替商品效果價值 ≤ 價格的 70%（清倉價仍不賺）；沒有商品給錢。
create or replace function public.town_catalog() returns jsonb language sql immutable as $$
select $j$[
 {"id":"onigiri","shop":"market","cat":"food","nm":"飯糰","p":40,"ic":"🍙","bag":"eat","fx":{"hu":18}},
 {"id":"bread","shop":"market","cat":"food","nm":"麵包","p":35,"ic":"🍞","bag":"eat","fx":{"hu":14}},
 {"id":"noodle","shop":"market","cat":"food","nm":"泡麵","p":50,"ic":"🍜","bag":"eat","fx":{"hu":26,"fun":-1}},
 {"id":"bento","shop":"market","cat":"food","nm":"便當","p":90,"ic":"🍱","bag":"eat","fx":{"hu":38,"fun":2}},
 {"id":"fruit","shop":"market","cat":"food","nm":"水果盒","p":80,"ic":"🍎","bag":"eat","fx":{"hu":10,"fun":5}},
 {"id":"mooncake","shop":"market","cat":"food","nm":"月餅（限定）","p":100,"ic":"🍪","bag":"eat","season":"0901-1005","fx":{"hu":16,"fun":8}},
 {"id":"zongzi","shop":"market","cat":"food","nm":"粽子（限定）","p":90,"ic":"🍙","bag":"eat","season":"0501-0630","fx":{"hu":20,"fun":6}},
 {"id":"tangyuan","shop":"market","cat":"food","nm":"湯圓（限定）","p":80,"ic":"🍜","bag":"eat","season":"1201-0228","fx":{"hu":15,"fun":8}},
 {"id":"icebar","shop":"market","cat":"food","nm":"冰品（限定）","p":70,"ic":"🧃","bag":"eat","season":"0701-0831","fx":{"hu":8,"fun":10}},
 {"id":"xmascake","shop":"market","cat":"food","nm":"聖誕蛋糕（限定）","p":120,"ic":"🍪","bag":"eat","season":"1215-1225","fx":{"hu":18,"fun":10}},
 {"id":"cola","shop":"market","cat":"drink","nm":"可樂","p":29,"ic":"🥤","bag":"eat","fx":{"en":3,"fun":2}},
 {"id":"tea","shop":"market","cat":"drink","nm":"茶飲","p":40,"ic":"🧃","bag":"eat","fx":{"en":5,"bl":-5}},
 {"id":"sports","shop":"market","cat":"drink","nm":"運動飲料","p":60,"ic":"🧃","bag":"eat","fx":{"en":9}},
 {"id":"boost","shop":"market","cat":"drink","nm":"提神飲","p":90,"ic":"🥫","bag":"eat","fx":{"en":13,"bl":-10}},
 {"id":"soap","shop":"market","cat":"daily","nm":"沐浴用品","p":80,"ic":"🧴","bag":"tool","fx":{"hy":25}},
 {"id":"wipes","shop":"market","cat":"daily","nm":"濕紙巾","p":30,"ic":"🧻","bag":"tool","fx":{"hy":10}},
 {"id":"firstaid","shop":"market","cat":"daily","nm":"急救包","p":120,"ic":"🩹","bag":"tool","fx":{"cure":1,"fun":3}},
 {"id":"umbrella","shop":"market","cat":"gear","nm":"雨傘","p":300,"ic":"☂️","bag":"tool","sp":"umb","fx":{}},
 {"id":"battery","shop":"market","cat":"gear","nm":"電池","p":60,"ic":"🔋","bag":"tool","sp":"bat","fx":{}},
 {"id":"handheld","shop":"market","cat":"gear","nm":"掌上遊戲機","p":400,"ic":"🎮","bag":"tool","sp":"game","fx":{"fun":14,"en":-2}},
 {"id":"capsule","shop":"market","cat":"col","nm":"扭蛋","p":100,"ic":"🪀","bag":"col","sp":"cap","fx":{"fun":3}},
 {"id":"cardpack","shop":"market","cat":"col","nm":"卡牌包","p":80,"ic":"🃏","bag":"col","sp":"card","fx":{"fun":2}},
 {"id":"mini","shop":"market","cat":"gift","nm":"小禮盒","p":150,"ic":"🎁","bag":"gift","gift":true,"fx":{"tf":10,"bond":2}},
 {"id":"bouquet","shop":"market","cat":"gift","nm":"花束","p":250,"ic":"💐","bag":"gift","gift":true,"fx":{"tf":15,"bond":3}},
 {"id":"tealegg","shop":"market","cat":"food","nm":"茶葉蛋","p":30,"ic":"🥚","bag":"eat","rot":1,"fx":{"hu":8}},
 {"id":"sandwich","shop":"market","cat":"food","nm":"三明治","p":55,"ic":"🥪","bag":"eat","rot":1,"fx":{"hu":14,"fun":1}},
 {"id":"yogurt","shop":"market","cat":"food","nm":"優格","p":45,"ic":"🥛","bag":"eat","rot":1,"fx":{"hu":6,"fun":3}},
 {"id":"soymilk","shop":"market","cat":"drink","nm":"豆漿","p":35,"ic":"🥛","bag":"eat","rot":1,"fx":{"hu":8,"en":1}},
 {"id":"sparkling","shop":"market","cat":"drink","nm":"氣泡水","p":35,"ic":"🥤","bag":"eat","rot":1,"fx":{"en":3,"fun":1}},
 {"id":"sunscreen","shop":"market","cat":"daily","nm":"防曬乳","p":90,"ic":"🧴","bag":"tool","rot":1,"fx":{"hy":18}},
 {"id":"shampoo","shop":"market","cat":"daily","nm":"洗髮精","p":70,"ic":"🧴","bag":"tool","rot":1,"fx":{"hy":14}},
 {"id":"breakfastbox","shop":"market","cat":"food","nm":"早餐蛋餅","p":60,"ic":"🥞","bag":"eat","hr":[6,10],"fx":{"hu":20}},
 {"id":"valchoc","shop":"market","cat":"gift","nm":"情人節巧克力","p":200,"ic":"🍫","bag":"gift","gift":true,"season":"0210-0214","fx":{"tf":12,"bond":3}},
 {"id":"dripcoffee","shop":"cafe","cat":"svc","nm":"手沖咖啡","p":130,"ic":"☕","bag":"now","fx":{"en":18,"fun":3}},
 {"id":"croissant","shop":"cafe","cat":"svc","nm":"可頌","p":60,"ic":"🥐","bag":"now","fx":{"hu":10,"fun":4}},
 {"id":"cafecake","shop":"cafe","cat":"svc","nm":"蛋糕","p":120,"ic":"🍰","bag":"now","fx":{"hu":15,"fun":8}},
 {"id":"coldbrew","shop":"cafe","cat":"drink","nm":"外帶冷萃","p":100,"ic":"🧃","bag":"eat","fx":{"en":14}},
 {"id":"beangift","shop":"cafe","cat":"gift","nm":"咖啡豆禮盒","p":350,"ic":"🎁","bag":"gift","gift":true,"fx":{"tf":15,"bond":4}},
 {"id":"cafemug","shop":"cafe","cat":"col","nm":"集點紀念杯","p":150,"ic":"☕","bag":"now","sp":"col1","fx":{"fun":2}},
 {"id":"icedamericano","shop":"cafe","cat":"svc","nm":"冰美式","p":90,"ic":"☕","bag":"now","rot":1,"fx":{"en":8,"fun":2}},
 {"id":"scone","shop":"cafe","cat":"svc","nm":"司康","p":80,"ic":"🥐","bag":"now","rot":1,"fx":{"hu":8,"fun":3}},
 {"id":"tiramisu","shop":"cafe","cat":"svc","nm":"提拉米蘇","p":140,"ic":"🍰","bag":"now","rot":1,"fx":{"hu":8,"fun":7}},
 {"id":"pudding","shop":"cafe","cat":"svc","nm":"焦糖布丁","p":100,"ic":"🍮","bag":"now","rot":1,"fx":{"hu":6,"fun":6}},
 {"id":"cafebreakfast","shop":"cafe","cat":"svc","nm":"早餐三明治","p":90,"ic":"🥪","bag":"now","hr":[6,11],"fx":{"hu":16,"fun":2}},
 {"id":"afternoontea","shop":"cafe","cat":"svc","nm":"下午茶組","p":150,"ic":"🫖","bag":"now","hr":[14,17],"fx":{"hu":10,"en":6,"fun":6}},
 {"id":"nightcocoa","shop":"cafe","cat":"svc","nm":"夜間熱可可","p":80,"ic":"☕","bag":"now","hr":[21,6],"fx":{"hu":4,"fun":8}},
 {"id":"xmascocoa","shop":"cafe","cat":"svc","nm":"聖誕熱可可（限定）","p":120,"ic":"☕","bag":"now","season":"1215-1225","fx":{"fun":10}},
 {"id":"newyearblend","shop":"cafe","cat":"svc","nm":"新年特調（限定）","p":150,"ic":"☕","bag":"now","season":"1229-0102","fx":{"en":10,"fun":8}},
 {"id":"restsoup","shop":"restaurant","cat":"svc","nm":"湯品","p":90,"ic":"🍲","bag":"now","fx":{"hu":22}},
 {"id":"restnoodles","shop":"restaurant","cat":"svc","nm":"麵食","p":180,"ic":"🍜","bag":"now","fx":{"hu":45}},
 {"id":"restdessert","shop":"restaurant","cat":"svc","nm":"甜點","p":110,"ic":"🍰","bag":"now","fx":{"hu":8,"fun":9}},
 {"id":"takeoutbento","shop":"restaurant","cat":"food","nm":"便當外帶","p":150,"ic":"🍱","bag":"eat","fx":{"hu":38}},
 {"id":"birthdaycake","shop":"restaurant","cat":"svc","nm":"生日蛋糕（分享）","p":600,"ic":"🍰","bag":"now","sp":"room","fx":{"fun":8,"tf":8,"bond":1}},
 {"id":"grilledfish","shop":"restaurant","cat":"svc","nm":"烤魚","p":170,"ic":"🐟","bag":"now","rot":1,"fx":{"hu":30,"fun":3}},
 {"id":"friedchicken","shop":"restaurant","cat":"svc","nm":"炸雞拼盤","p":160,"ic":"🍗","bag":"now","rot":1,"fx":{"hu":28,"fun":4}},
 {"id":"saladbowl","shop":"restaurant","cat":"svc","nm":"蔬食沙拉","p":120,"ic":"🥗","bag":"now","rot":1,"fx":{"hu":14,"fun":5}},
 {"id":"restbreakfast","shop":"restaurant","cat":"svc","nm":"早餐蛋餅套餐","p":100,"ic":"🥞","bag":"now","hr":[6,10],"fx":{"hu":24,"fun":2}},
 {"id":"lunchset","shop":"restaurant","cat":"svc","nm":"商業午餐","p":160,"ic":"🍱","bag":"now","hr":[11,14],"fx":{"hu":34,"fun":4}},
 {"id":"dinnerset","shop":"restaurant","cat":"svc","nm":"晚間套餐","p":220,"ic":"🍽️","bag":"now","hr":[17,21],"fx":{"hu":40,"fun":8}},
 {"id":"midnightbbq","shop":"restaurant","cat":"svc","nm":"宵夜燒烤","p":150,"ic":"🍢","bag":"now","hr":[21,6],"fx":{"hu":26,"fun":6}},
 {"id":"xmasdinner","shop":"restaurant","cat":"svc","nm":"聖誕大餐（限定）","p":380,"ic":"🍗","bag":"now","season":"1215-1225","fx":{"hu":40,"fun":20}},
 {"id":"newyeardinner","shop":"restaurant","cat":"svc","nm":"年菜（限定）","p":500,"ic":"🍲","bag":"now","season":"0120-0215","fx":{"hu":46,"fun":18}},
 {"id":"moonbbq","shop":"restaurant","cat":"svc","nm":"中秋烤肉（限定）","p":260,"ic":"🍖","bag":"now","season":"0905-0925","fx":{"hu":34,"fun":12}},
 {"id":"moviecombo","shop":"cinema","cat":"svc","nm":"套票（爆米花＋飲料）","p":140,"ic":"🍿","bag":"now","fx":{"hu":12,"en":8,"fun":5}},
 {"id":"filmfigure","shop":"cinema","cat":"col","nm":"電影周邊公仔","p":350,"ic":"🧸","bag":"now","sp":"col1","fx":{"fun":2}},
 {"id":"cinemahall","shop":"cinema","cat":"svc","nm":"包場","p":1500,"ic":"🎬","bag":"now","sp":"room","day":1,"fund":30,"fx":{"fun":15,"tf":15,"bond":1}},
 {"id":"lateshowfilm","shop":"cinema","cat":"svc","nm":"深夜場","p":220,"ic":"🎬","bag":"now","hr":[21,6],"fx":{"fun":25}},
 {"id":"proteindrink","shop":"gym","cat":"drink","nm":"蛋白飲","p":120,"ic":"🧃","bag":"eat","fx":{"en":12,"hu":10}},
 {"id":"gymtowel","shop":"gym","cat":"svc","nm":"毛巾租借","p":30,"ic":"🧻","bag":"now","fx":{"hy":8}},
 {"id":"yogaclass","shop":"gym","cat":"svc","nm":"瑜珈課","p":300,"ic":"🧘","bag":"now","fx":{"en":10,"fun":12}},
 {"id":"ptlesson","shop":"gym","cat":"svc","nm":"私人教練課","p":500,"ic":"🏋️","bag":"now","sp":"pt","day":1,"fx":{"en":-20}},
 {"id":"parksausage","shop":"park","cat":"food","nm":"烤香腸","p":60,"ic":"🌭","bag":"eat","fx":{"hu":22}},
 {"id":"icecreamcone","shop":"park","cat":"food","nm":"冰淇淋","p":50,"ic":"🍦","bag":"eat","fx":{"hu":6,"fun":6}},
 {"id":"parkballoon","shop":"park","cat":"gift","nm":"氣球","p":40,"ic":"🎈","bag":"gift","gift":true,"fx":{"tf":5,"bond":1}},
 {"id":"frisbeedisc","shop":"park","cat":"gear","nm":"飛盤","p":100,"ic":"🥏","bag":"tool","dur":20,"out":true,"fx":{"fun":4,"en":-3}},
 {"id":"kitefly","shop":"park","cat":"gear","nm":"風箏","p":180,"ic":"🪁","bag":"tool","dur":6,"out":true,"fx":{"fun":9,"en":-3}},
 {"id":"chickencutlet","shop":"plaza","cat":"food","nm":"雞排","p":80,"ic":"🍗","bag":"eat","fx":{"hu":25}},
 {"id":"bobatea","shop":"plaza","cat":"drink","nm":"珍奶","p":60,"ic":"🧋","bag":"eat","fx":{"en":7,"fun":3}},
 {"id":"bubblewand","shop":"plaza","cat":"svc","nm":"泡泡水","p":40,"ic":"🫧","bag":"now","fx":{"fun":5}},
 {"id":"fireworks","shop":"plaza","cat":"svc","nm":"煙火","p":300,"ic":"🎆","bag":"now","sp":"room","day":1,"fx":{"fun":10,"tf":10}},
 {"id":"ringgame","shop":"plaza","cat":"svc","nm":"套圈圈","p":50,"ic":"🧸","bag":"now","sp":"ring","fx":{"fun":2}},
 {"id":"braisedsnack","shop":"plaza","cat":"food","nm":"滷味（夜市限定）","p":70,"ic":"🍢","bag":"eat","hr":[21,23],"fx":{"hu":20,"fun":2}}
]$j$::jsonb
$$;
create or replace function public.town_shelf_live(c jsonb, today text, tid text) returns boolean language sql immutable as $$
  select c->>'rot' is null or ((hashtext(today || '|' || tid || '|' || (c->>'id')) & 2147483647) % 100) < 50
$$;
-- 還能上架幾天：輪替商品＝從今天起連續上架天數（最多 7）；季節商品＝到季節結束還有幾天（含今天）；其他 null
create or replace function public.town_shelf_until(c jsonb, today text, tid text) returns int language plpgsql stable as $$
declare n int := 0; d date := today::date; s text := c->>'season'; ed date;
begin
  if c->>'rot' is not null then
    while n < 7 and public.town_shelf_live(c, to_char(d, 'YYYY-MM-DD'), tid) loop n := n + 1; d := d + 1; end loop;
    return n;
  end if;
  if s is not null then
    ed := make_date(extract(year from d)::int, substr(s,6,2)::int, substr(s,8,2)::int);
    if ed < d then ed := make_date(extract(year from d)::int + 1, substr(s,6,2)::int, substr(s,8,2)::int); end if;
    return (ed - d) + 1;
  end if;
  return null;
end $$;
-- 今日主廚推薦／咖啡特調的名字（餐廳「今日特餐」、咖啡廳「特調」讀這個；其他店回 null）
create or replace function public.town_shelf_special(shopid text, today text, tid text) returns text language sql immutable as $$
  select case shopid
    when 'restaurant' then (array['滷肉飯套餐','牛肉麵套餐','豬排飯套餐','咖哩飯套餐','雞腿便當套餐','薑燒豬肉定食','三杯雞飯','蔥油拌麵套餐','鹹酥雞套餐','香煎鮭魚套餐','客家小炒套餐','海鮮燉飯'])[1 + ((hashtext('sp|' || today || '|' || tid || '|r') & 2147483647) % 12)]
    when 'cafe' then (array['焦糖瑪奇朵','桂花拿鐵','黑糖鮮奶特調','柚香氣泡咖啡','榛果可可特調','抹茶歐蕾特調','海鹽焦糖拿鐵','玫瑰荔枝特調'])[1 + ((hashtext('sp|' || today || '|' || tid || '|c') & 2147483647) % 8)]
    else null end
$$;
-- 每日特價（3 參數）：市集、咖啡廳、餐廳各依日期＋小鎮挑 1 項（今天上架、不限時段、非限定、非全場／教練類）
create or replace function public.town_cat_sale(shopid text, today text, tid text) returns text language sql immutable as $$
  select id from (select c->>'id' as id, row_number() over (order by c->>'id') as rn, count(*) over () as cn
    from jsonb_array_elements(public.town_catalog()) c
    where c->>'shop' = shopid and shopid in ('market','cafe','restaurant') and c->>'cat' in ('food','drink','daily','svc') and c->>'season' is null
      and c->'hr' is null and c->>'sp' is null and c->>'day' is null and public.town_shelf_live(c, today, tid)) q
  where rn = 1 + (hashtext('sale|' || today || '|' || tid || '|' || shopid) & 2147483647) % cn
$$;
revoke all on function public.town_catalog(), public.town_shelf_live(jsonb,text,text), public.town_shelf_until(jsonb,text,text), public.town_shelf_special(text,text,text), public.town_cat_sale(text,text,text) from public, anon, authenticated;
create or replace function public.town_goods(rid bigint, pin text, op text default 'list', item text default null, num int default 1, target bigint default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare
  r public.town_residents; t public.town_residents; c jsonb; fx jsonb; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
  md text := to_char(now() at time zone 'Asia/Taipei','MMDD'); hr int := extract(hour from now() at time zone 'Asia/Taipei')::int;
  sale text; sg int; n int; i int; unit int; total int := 0; px int; cnt int; mx int; inv jsonb; have int; e0 real; msg text := '';
  shopid text := coalesce(nullif(item,''), 'market'); cl jsonb; pick text; sp text; k text; nk int; ttl text; bg text; isnow boolean; used int; lf int;
  du jsonb; dl jsonb; rc int := 0;
  tmr text := to_char((now() at time zone 'Asia/Taipei')::date + 1, 'YYYY-MM-DD'); ytd text := to_char((now() at time zone 'Asia/Taipei')::date - 1, 'YYYY-MM-DD'); clr boolean := false;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  inv := coalesce(r.items->'inv', '{}'::jsonb);
  sale := public.town_cat_sale(shopid, today, r.town_id);
  sg := case when r.items->'sg'->>'d' = today then coalesce((r.items->'sg'->>'n')::int, 0) else 0 end;
  dl := case when r.items->'dl'->>'d' = today then r.items->'dl' else '{}'::jsonb end;
  if op = 'list' then
    return json_build_object('today', today, 'sale', sale, 'special', public.town_shelf_special(shopid, today, r.town_id), 'saleLeft', greatest(0, 3 - sg), 'cat', public.town_catalog(), 'inv', inv, 'cl', coalesce(r.items->'cl','{}'::jsonb), 'dl', dl,
      'bag', json_build_object('eat', public.town_bag_max(r), 'tool', 10, 'gift', 10, 'col', 30),
      'items', (select coalesce(jsonb_agg(
          cx || jsonb_build_object('p', public.town_px(r.town_id, (cx->>'p')::int), 'p0', (cx->>'p')::int, 'sale', (cx->>'id') = sale,
            'clr', (cx->>'rot' is not null and not public.town_shelf_live(cx, tmr, r.town_id)),
            'tag', case when cx->>'rot' is not null and not public.town_shelf_live(cx, tmr, r.town_id) then 'clear' when cx->>'rot' is not null and not public.town_shelf_live(cx, ytd, r.town_id) then 'new' when cx->>'season' is not null then 'fest' else null end,
            'until', public.town_shelf_until(cx, today, r.town_id),
            'pd', case when cx->>'rot' is not null and not public.town_shelf_live(cx, tmr, r.town_id) then (public.town_px(r.town_id, (cx->>'p')::int) * 70 + 50) / 100
                       when (cx->>'id') = sale then (public.town_px(r.town_id, (cx->>'p')::int) * 80 + 50) / 100 else public.town_px(r.town_id, (cx->>'p')::int) end,
            'own', coalesce((inv->>(cx->>'id'))::int, 0), 'used', coalesce((dl->>(cx->>'id'))::int, 0)) order by ord), '[]'::jsonb)
        from jsonb_array_elements(public.town_catalog()) with ordinality as e(cx, ord)
        where cx->>'shop' = shopid and public.town_cat_live(cx->>'season', md) and public.town_cat_hr(cx->'hr', hr) and public.town_shelf_live(cx, today, r.town_id)));
  end if;
  if op not in ('buy','buyuse','use','gift') then return json_build_object('error','未知動作'); end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if public.town_jailed(r) then raise exception '你在牢裡'; end if;
  select cx into c from jsonb_array_elements(public.town_catalog()) cx where cx->>'id' = item limit 1;
  if c is null then raise exception '沒有這個商品'; end if;
  fx := c->'fx'; sp := c->>'sp'; bg := c->>'bag'; e0 := r.energy; isnow := bg = 'now';
  n := greatest(1, least(5, coalesce(num, 1)));
  if isnow and op in ('buy','buyuse') then op := 'buyuse'; end if;
  if isnow and op in ('use','gift') then raise exception '這個只能在店裡現場用'; end if;

  if op in ('buy','buyuse') then
    if r.place <> coalesce(c->>'shop','market') then raise exception '要在%才能買', public.town_place_name(c->>'shop'); end if;
    perform public.town_need_in_pl(r, r.place);
    if public.town_is_off(r.town_id, public.town_feature(r.place)) then raise exception '這個小鎮沒有開這個設施'; end if;
    if not public.town_cat_live(c->>'season', md) then raise exception '現在沒有賣這個（季節限定）'; end if;
    if not public.town_cat_hr(c->'hr', hr) then raise exception '現在不是營業時段'; end if;
    if not public.town_shelf_live(c, today, r.town_id) then raise exception '今天這個沒有上架，明天再來看看'; end if;
    sale := public.town_cat_sale(c->>'shop', today, r.town_id);
    clr := c->>'rot' is not null and not public.town_shelf_live(c, tmr, r.town_id);
    if c->>'day' is not null and coalesce((dl->>(c->>'id'))::int, 0) >= (c->>'day')::int then raise exception '今天已經買過了，明天再來'; end if;
    if op = 'buyuse' then n := 1; end if;
    px := public.town_px(r.town_id, (c->>'p')::int);
    for i in 1..n loop
      if clr and sg < 3 then unit := (px * 70 + 50) / 100; sg := sg + 1;
      elsif (c->>'id') = sale and sg < 3 then unit := (px * 80 + 50) / 100; sg := sg + 1; else unit := px; end if;
      total := total + unit;
    end loop;
    if total > r.money then raise exception '錢不夠，要 €%', total; end if;
    if not isnow then
      select coalesce(sum(vv::int), 0) into cnt from jsonb_each_text(inv) as ee(kk, vv)
        join jsonb_array_elements(public.town_catalog()) cc on cc->>'id' = ee.kk where cc->>'bag' = bg;
      mx := case bg when 'eat' then public.town_bag_max(r) when 'col' then 30 else 10 end;
      if op = 'buy' and cnt + n > mx then raise exception '背包放不下了（這一類最多 %）', mx; end if;
    end if;
    r.money := r.money - total;
    if coalesce((c->>'fund')::int, 0) > 0 then perform public.town_fund_add(r.town_id, 'goods', floor(total * (c->>'fund')::int / 100.0)::int); end if;
    r.items := jsonb_set(r.items, '{sg}', jsonb_build_object('d', today, 'n', sg));
    if c->>'day' is not null then dl := dl || jsonb_build_object('d', today, (c->>'id'), coalesce((dl->>(c->>'id'))::int, 0) + 1); r.items := jsonb_set(r.items, '{dl}', dl); end if;
    if op = 'buy' then
      inv := inv || jsonb_build_object(item, coalesce((inv->>item)::int, 0) + n);
      r.items := jsonb_set(r.items, '{inv}', inv);
      perform public.town_save_r(r);
      return json_build_object('m', -total, 'msg', '買了 ' || n || ' 個' || (c->>'nm') || '，放進背包');
    end if;
    if not isnow then
      inv := inv || jsonb_build_object(item, coalesce((inv->>item)::int, 0) + 1);
      r.items := jsonb_set(r.items, '{inv}', inv);
    end if;
    op := 'use';
  end if;

  have := case when isnow then 1 else coalesce((inv->>item)::int, 0) end;
  if have < 1 then raise exception '背包裡沒有%', c->>'nm'; end if;
  if sp = 'bat' then raise exception '電池要放進掌上遊戲機，不能單獨用'; end if;
  if sp = 'umb' then raise exception '雨傘不用手動用，下大雨會自動撐開'; end if;
  if op = 'use' and coalesce((c->>'gift')::boolean, false) then raise exception '禮物要送給朋友'; end if;
  if coalesce((c->>'out')::boolean, false) and r.place not in ('street','plaza','park') then raise exception '要在戶外（街上、廣場、公園）才能玩'; end if;

  if op = 'gift' then
    if not coalesce((c->>'gift')::boolean, false) then raise exception '這個不能送人'; end if;
    if target is null or target = rid then raise exception '要選一位鄰居'; end if;
    select * into t from public.town_residents where id = target and town_id = r.town_id for update;
    if not found then raise exception '找不到這位鄰居'; end if;
    t := public.town_tick(t);
    if t.sleeping or public.town_jailed(t) then raise exception '% 在睡覺或不方便', t.name; end if;
    if t.place is distinct from r.place then raise exception '% 不在這裡', t.name; end if;
    t.fun := t.fun + coalesce((fx->>'tf')::int, 0);
    if coalesce((fx->>'bond')::int, 0) <> 0 then perform public.town_bond(r.town_id, rid, t.id, (fx->>'bond')::int); end if;
    perform public.town_save_r(t);
    r.fun := r.fun + 3;
    msg := '把' || (c->>'nm') || '送給 ' || t.name;
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, t.id, 'joint', r.name || ' ' || msg);
  else
    if sp = 'game' then
      if coalesce((inv->>'battery')::int, 0) < 1 then raise exception '掌上遊戲機要電池，超市有賣'; end if;
      inv := inv || jsonb_build_object('battery', (inv->>'battery')::int - 1);
    end if;
    r.hunger := r.hunger + coalesce((fx->>'hu')::int, 0); r.energy := r.energy + coalesce((fx->>'en')::int, 0);
    r.fun := r.fun + coalesce((fx->>'fun')::int, 0); r.hygiene := r.hygiene + coalesce((fx->>'hy')::int, 0);
    r.bladder := r.bladder + coalesce((fx->>'bl')::int, 0);
    if coalesce((fx->>'cure')::int, 0) = 1 then r.bruised_until := null; end if;
    msg := case when sp = 'game' then '玩了一會掌上遊戲機' when sp in ('cap','card') then '拆開' || (c->>'nm') when isnow then '享用了' || (c->>'nm') else '使用了' || (c->>'nm') end;
    if sp = 'pt' then
      if e0 < 20 then raise exception '精力不夠上課（要 20 以上）'; end if;
      r := public.town_pl_prog(r, 'st'); r := public.town_pl_prog(r, 'st'); msg := '上了私人教練課，力量進度 +2（每天進度上限 8）';
    elsif sp = 'room' then
      for t in select * from public.town_residents w where w.town_id = r.town_id and w.id <> rid and w.place = r.place and not w.sleeping
          and w.seen_at > now() - interval '10 minutes' and not public.town_jailed(w) order by w.id limit 10 for update loop
        t.fun := t.fun + coalesce((fx->>'tf')::int, 0);
        perform public.town_save_r(t);
        if coalesce((fx->>'bond')::int, 0) <> 0 then perform public.town_bond(r.town_id, rid, t.id, (fx->>'bond')::int); end if;
        rc := rc + 1;
      end loop;
      msg := (c->>'nm') || '，在場 ' || rc || ' 位鄰居心情 +' || coalesce((fx->>'tf')::int, 0);
      insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'joint', r.name || ' 請大家' || (c->>'nm') || '，' || rc || ' 位鄰居一起開心');
    elsif sp = 'col1' then
      cl := coalesce(r.items->'cl', '{}'::jsonb);
      cl := cl || jsonb_build_object(item, coalesce((cl->>item)::int, 0) + 1);
      r.items := jsonb_set(r.items, '{cl}', cl);
      msg := '收下了' || (c->>'nm') || '（收藏，不能換錢）';
    elsif sp = 'ring' then
      if random() < 0.25 then
        cl := coalesce(r.items->'cl', '{}'::jsonb);
        pick := 'p' || lpad((1 + floor(random() * 6))::int::text, 2, '0');
        cl := cl || jsonb_build_object(pick, coalesce((cl->>pick)::int, 0) + 1);
        r.items := jsonb_set(r.items, '{cl}', cl);
        msg := '套中了！得到小玩偶「' || pick || '」';
      else msg := '套圈圈沒套中，玩得還是很開心'; end if;
    elsif sp in ('cap','card') then
      cl := coalesce(r.items->'cl', '{}'::jsonb);
      nk := case sp when 'cap' then 24 else 20 end;
      pick := case sp when 'cap' then 'c' else 'k' end || lpad((1 + floor(random() * nk))::int::text, 2, '0');
      cl := cl || jsonb_build_object(pick, coalesce((cl->>pick)::int, 0) + 1);
      r.items := jsonb_set(r.items, '{cl}', cl);
      msg := msg || '，得到「' || pick || '」' || case when (cl->>pick)::int > 1 then '（重複）' else '（新）' end;
      select count(*) into k from jsonb_object_keys(cl) as ks(kk) where left(kk, 1) = left(pick, 1);
      ttl := case when sp = 'cap' then '扭蛋大師' else '卡牌大師' end;
      if k::int >= nk and not (coalesce(r.items->'titles', '[]'::jsonb) ? ttl) then
        r.items := jsonb_set(r.items, '{titles}', coalesce(r.items->'titles', '[]'::jsonb) || to_jsonb(ttl));
        msg := msg || '，集滿了！得到稱號「' || ttl || '」';
      end if;
    end if;
  end if;
  -- 耐久商品（飛盤、風箏）：用一次耐久 −1，用完一個就壞掉；一般商品用掉一個；現場用的不入背包
  if not isnow then
    if c->>'dur' is not null then
      du := coalesce(r.items->'du', '{}'::jsonb);
      lf := coalesce((du->>item)::int, (c->>'dur')::int) - 1;
      if lf <= 0 then
        inv := inv || jsonb_build_object(item, have - 1); du := du - item; msg := msg || '（用到壞掉了）';
      else du := du || jsonb_build_object(item, lf); msg := msg || '（還能用 ' || lf || ' 次）'; end if;
      r.items := jsonb_set(r.items, '{du}', du);
    else
      inv := inv || jsonb_build_object(item, have - 1);
    end if;
    r.items := jsonb_set(r.items, '{inv}', inv);
  end if;
  r := public.town_ecap(r, e0, op);
  perform public.town_save_r(r);
  return json_build_object('m', -total, 'msg', msg);
end $$;
revoke all on function public.town_goods(bigint,text,text,text,int,bigint) from public;
grant execute on function public.town_goods(bigint,text,text,text,int,bigint) to anon, authenticated;
