-- 商品目錄第二批：咖啡廳、餐廳、電影院、健身房、公園、廣場各 4～6 項（共 30 項）＋超市 24 項（第一批）合成同一份目錄
-- 順序：town_catalog1.sql 之後；可重複執行；實測 town_catalog2_test.sql（回滾）。重新定義 town_catalog()（全部商品，加商品只改這裡）與 town_goods（支援店內現場用 bag=now、room 全場、col1 收藏、ring 套圈圈、pt 教練課、dur 耐久、out 戶外、day 每日次數、fund 進基金 %、hr 時段）。
-- 欄位新增：bag=now 只能現場用（不入背包）；dur 耐久次數；out 只能在戶外（街上／廣場／公園）用；day 每人每天最多買幾次；fund 付款的百分比進鎮基金（其餘銷毀）；hr [起,迄) 台灣時段，起>迄代表跨午夜。
-- 經濟：全部純出口（付的錢銷毀；包場 30% 進鎮基金）；沒有商品給錢、收藏不能換錢；室內 room 類只加心情、不給錢；教練課進度仍受每日 +8 上限。
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
 {"id":"dripcoffee","shop":"cafe","cat":"svc","nm":"手沖咖啡","p":130,"ic":"☕","bag":"now","fx":{"en":18,"fun":3}},
 {"id":"croissant","shop":"cafe","cat":"svc","nm":"可頌","p":60,"ic":"🥐","bag":"now","fx":{"hu":10,"fun":4}},
 {"id":"cafecake","shop":"cafe","cat":"svc","nm":"蛋糕","p":120,"ic":"🍰","bag":"now","fx":{"hu":15,"fun":8}},
 {"id":"coldbrew","shop":"cafe","cat":"drink","nm":"外帶冷萃","p":100,"ic":"🧃","bag":"eat","fx":{"en":14}},
 {"id":"beangift","shop":"cafe","cat":"gift","nm":"咖啡豆禮盒","p":350,"ic":"🎁","bag":"gift","gift":true,"fx":{"tf":15,"bond":4}},
 {"id":"cafemug","shop":"cafe","cat":"col","nm":"集點紀念杯","p":150,"ic":"☕","bag":"now","sp":"col1","fx":{"fun":2}},
 {"id":"restsoup","shop":"restaurant","cat":"svc","nm":"湯品","p":90,"ic":"🍲","bag":"now","fx":{"hu":22}},
 {"id":"restnoodles","shop":"restaurant","cat":"svc","nm":"麵食","p":180,"ic":"🍜","bag":"now","fx":{"hu":45}},
 {"id":"restdessert","shop":"restaurant","cat":"svc","nm":"甜點","p":110,"ic":"🍰","bag":"now","fx":{"hu":8,"fun":9}},
 {"id":"takeoutbento","shop":"restaurant","cat":"food","nm":"便當外帶","p":150,"ic":"🍱","bag":"eat","fx":{"hu":38}},
 {"id":"birthdaycake","shop":"restaurant","cat":"svc","nm":"生日蛋糕（分享）","p":600,"ic":"🍰","bag":"now","sp":"room","fx":{"fun":8,"tf":8,"bond":1}},
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
create or replace function public.town_cat_hr(h jsonb, hr int) returns boolean language sql immutable as $$
  select h is null or case when (h->>0)::int <= (h->>1)::int then hr >= (h->>0)::int and hr < (h->>1)::int else hr >= (h->>0)::int or hr < (h->>1)::int end
$$;
revoke all on function public.town_cat_hr(jsonb,int) from public, anon, authenticated;

create or replace function public.town_goods(rid bigint, pin text, op text default 'list', item text default null, num int default 1, target bigint default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare
  r public.town_residents; t public.town_residents; c jsonb; fx jsonb; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
  md text := to_char(now() at time zone 'Asia/Taipei','MMDD'); hr int := extract(hour from now() at time zone 'Asia/Taipei')::int;
  sale text; sg int; n int; i int; unit int; total int := 0; px int; cnt int; mx int; inv jsonb; have int; e0 real; msg text := '';
  shopid text := coalesce(nullif(item,''), 'market'); cl jsonb; pick text; sp text; k text; nk int; ttl text; bg text; isnow boolean; used int; lf int;
  du jsonb; dl jsonb; rc int := 0;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  inv := coalesce(r.items->'inv', '{}'::jsonb);
  sale := public.town_cat_sale('market', today);
  sg := case when r.items->'sg'->>'d' = today then coalesce((r.items->'sg'->>'n')::int, 0) else 0 end;
  dl := case when r.items->'dl'->>'d' = today then r.items->'dl' else '{}'::jsonb end;
  if op = 'list' then
    return json_build_object('today', today, 'sale', sale, 'saleLeft', greatest(0, 3 - sg), 'cat', public.town_catalog(), 'inv', inv, 'cl', coalesce(r.items->'cl','{}'::jsonb), 'dl', dl,
      'bag', json_build_object('eat', public.town_bag_max(r), 'tool', 10, 'gift', 10, 'col', 30),
      'items', (select coalesce(jsonb_agg(
          cx || jsonb_build_object('p', public.town_px(r.town_id, (cx->>'p')::int), 'p0', (cx->>'p')::int, 'sale', (cx->>'id') = sale,
            'own', coalesce((inv->>(cx->>'id'))::int, 0), 'used', coalesce((dl->>(cx->>'id'))::int, 0)) order by ord), '[]'::jsonb)
        from jsonb_array_elements(public.town_catalog()) with ordinality as e(cx, ord)
        where cx->>'shop' = shopid and public.town_cat_live(cx->>'season', md) and public.town_cat_hr(cx->'hr', hr)));
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
    if c->>'day' is not null and coalesce((dl->>(c->>'id'))::int, 0) >= (c->>'day')::int then raise exception '今天已經買過了，明天再來'; end if;
    if op = 'buyuse' then n := 1; end if;
    px := public.town_px(r.town_id, (c->>'p')::int);
    for i in 1..n loop
      if (c->>'id') = sale and sg < 3 then unit := (px * 80 + 50) / 100; sg := sg + 1; else unit := px; end if;
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
