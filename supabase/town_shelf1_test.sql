-- 每日輪替貨架回滾實測：結果在 REPORT（最後 raise exception → 全部回滾）。接在 town_shelf1.sql、town_shelf2.sql 之後貼上。
do $$
declare t text := 'ZZSHF1'; a bigint; rep text := ''; j json; c jsonb; i int; n int; nlive int; ntot int; nrot int; d text; m0 int; err text; sp text; ck text; pid text;
  today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); shop text; it jsonb; paid int;
begin
  insert into public.town_towns(id,name,invite) values (t,'貨架測試鎮','ZZSHF1');
  insert into public.town_residents(town_id,name,slot,pin_hash,money,hunger,energy,bladder,hygiene,fun,place,x,y,items)
    values (t,'甲',0,extensions.crypt('x',extensions.gen_salt('bf')),500000,30,80,50,50,30,'market',24,14,'{"fi":"market"}'::jsonb) returning id into a;
  rep := rep || '目錄 ' || jsonb_array_length(public.town_catalog()) || ' 列（期望 82）' || E'\n';
  begin
    -- 1. 三家店 10 天每天的上架數／輪替池大小，並確認同一天兩次算出來一樣
    foreach shop in array array['market','cafe','restaurant'] loop
      select count(*) into nrot from jsonb_array_elements(public.town_catalog()) x where x->>'shop' = shop and x->>'rot' is not null;
      select count(*) into ntot from jsonb_array_elements(public.town_catalog()) x where x->>'shop' = shop and x->>'season' is null;
      rep := rep || shop || '：非季節 ' || ntot || '、輪替池 ' || nrot || '（占 ' || (100 * nrot / ntot) || '%，期望 ≤ 40%）；每天上架輪替數：';
      for i in 0..9 loop
        d := to_char((now() at time zone 'Asia/Taipei')::date + i, 'YYYY-MM-DD');
        select count(*) into nlive from jsonb_array_elements(public.town_catalog()) x where x->>'shop' = shop and x->>'rot' is not null and public.town_shelf_live(x, d, t);
        rep := rep || nlive || ' ';
        if nlive <> (select count(*) from jsonb_array_elements(public.town_catalog()) x where x->>'shop' = shop and x->>'rot' is not null and public.town_shelf_live(x, d, t)) then rep := rep || '【兩次不一致】'; end if;
      end loop;
      rep := rep || E'\n';
      -- 特價與推薦
      rep := rep || '  今日特價 ' || coalesce(public.town_cat_sale(shop, today, t), '（無）') || '，推薦 ' || coalesce(public.town_shelf_special(shop, today, t), '（無）') || E'\n';
    end loop;
    -- 2. 另一個小鎮 id 的組合不同
    select count(*) into n from jsonb_array_elements(public.town_catalog()) x where x->>'rot' is not null and public.town_shelf_live(x, today, t) <> public.town_shelf_live(x, today, 'OTHER');
    rep := rep || '不同小鎮今天上架不同的輪替商品數 = ' || n || '（期望 > 0）' || E'\n';
    -- 3. 貨架清單：標籤、剩幾天、折後價
    foreach shop in array array['market','cafe','restaurant'] loop
      update public.town_residents set place = shop, items = jsonb_set(items, '{fi}', to_jsonb(shop)) where id = a;
      j := public.town_goods(a, 'x', 'list', shop, 1, null);
      rep := rep || shop || ' 貨架 ' || json_array_length(j->'items') || ' 項，新 ' || (select count(*) from json_array_elements(j->'items') x where x->>'tag' = 'new') ||
        '、清倉 ' || (select count(*) from json_array_elements(j->'items') x where x->>'tag' = 'clear') || '、節慶 ' || (select count(*) from json_array_elements(j->'items') x where x->>'tag' = 'fest') || E'\n';
    end loop;
    -- 4. 買清倉品：價格 = 7 折；買今天沒上架的輪替品：擋住
    update public.town_residents set items = '{"fi":"market"}'::jsonb, place = 'market', money = 500000 where id = a;
    j := public.town_goods(a, 'x', 'list', 'market', 1, null);
    select x into it from json_array_elements(j->'items') x where x->>'tag' = 'clear' limit 1;
    if it is not null then
      m0 := (select money from public.town_residents where id = a);
      perform public.town_goods(a, 'x', 'buy', it->>'id', 1, null);
      paid := m0 - (select money from public.town_residents where id = a);
      rep := rep || '清倉品 ' || (it->>'id') || ' 定價 ' || (it->>'p') || ' 實付 ' || paid || '（期望 ' || ((it->>'p')::int * 70 + 50) / 100 || '）' || E'\n';
    else rep := rep || '今天市集沒有清倉品，跳過清倉價實測' || E'\n'; end if;
    select x->>'id' into pid from jsonb_array_elements(public.town_catalog()) x where x->>'shop' = 'market' and x->>'rot' is not null and not public.town_shelf_live(x, today, t) limit 1;
    if pid is not null then
      begin perform public.town_goods(a, 'x', 'buy', pid, 1, null); err := '沒擋'; exception when others then err := '擋住：' || sqlerrm; end;
      rep := rep || '買未上架 ' || pid || ' = ' || err || E'\n';
    end if;
    -- 5. 打折份數：同一人今天最多 3 份打折
    update public.town_residents set items = '{"fi":"market"}'::jsonb, money = 500000 where id = a;
    j := public.town_goods(a, 'x', 'list', 'market', 1, null);
    select x into it from json_array_elements(j->'items') x where (x->>'sale')::boolean limit 1;
    if it is not null then
      m0 := (select money from public.town_residents where id = a);
      for i in 1..5 loop perform public.town_goods(a, 'x', 'buy', it->>'id', 1, null); end loop;
      paid := m0 - (select money from public.town_residents where id = a);
      rep := rep || '特價品 ' || (it->>'id') || ' 買 5 份共付 ' || paid || '（期望 ' || (3 * ((it->>'p')::int * 80 + 50) / 100 + 2 * (it->>'p')::int) || '，前提：不是清倉品）' || E'\n';
    end if;
    -- 6. 餐廳特餐／咖啡特調的名字
    update public.town_residents set place = 'restaurant', items = '{"fi":"restaurant"}'::jsonb, money = 500000 where id = a;
    j := public.town_fac(a, 'x', 'special', null, null);
    sp := public.town_shelf_special('restaurant', today, t);
    rep := rep || '特餐訊息：' || coalesce(j->>'msg','') || ' 含推薦名 ' || (position(sp in coalesce(j->>'msg','')) > 0) || '（期望 true）' || E'\n';
    update public.town_residents set place = 'cafe', items = '{"fi":"cafe"}'::jsonb, money = 500000 where id = a;
    j := public.town_fac(a, 'x', 'latte', null, null);
    rep := rep || '特調訊息：' || coalesce(j->>'msg','') || E'\n';
    -- 7. 季節／時段：限定商品數
    rep := rep || '限定商品 ' || (select count(*) from jsonb_array_elements(public.town_catalog()) x where x->>'season' is not null) || ' 項（期望 11），時段商品 ' ||
      (select count(*) from jsonb_array_elements(public.town_catalog()) x where x->'hr' is not null) || ' 項' || E'\n';
    rep := rep || '錢不為負：' || (select (money >= 0)::text from public.town_residents where id = a) || E'\n';
  exception when others then rep := rep || '例外：' || sqlerrm || E'\n'; end;
  raise exception 'REPORT%', E'\n' || rep;
end $$;
