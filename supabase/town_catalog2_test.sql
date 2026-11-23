-- 商品目錄第二批回滾實測：結果在 REPORT（最後 raise exception → 全部回滾）。接在 town_catalog2.sql 之後貼上。
do $$
declare t text := 'ZZCAT2'; a bigint; b bigint; rep text := ''; j json; r public.town_residents; m0 int; i int; ok int; err text; c jsonb; f0 bigint; pl text;
  hr int := extract(hour from now() at time zone 'Asia/Taipei')::int;
begin
  insert into public.town_towns(id,name,invite) values (t,'目錄測試鎮二','ZZCAT2');
  insert into public.town_residents(town_id,name,slot,pin_hash,money,hunger,energy,bladder,hygiene,fun,place,x,y,items)
    values (t,'甲',0,extensions.crypt('x',extensions.gen_salt('bf')),500000,30,80,50,50,30,'cafe',38,5,'{"fi":"cafe"}'::jsonb) returning id into a;
  insert into public.town_residents(town_id,name,slot,pin_hash,money,hunger,energy,bladder,hygiene,fun,place,x,y,items)
    values (t,'乙',1,extensions.crypt('x',extensions.gen_salt('bf')),100,50,50,50,50,30,'cafe',38,5,'{"fi":"cafe"}'::jsonb) returning id into b;
  rep := rep || '目錄 = ' || jsonb_array_length(public.town_catalog()) || ' 列（期望 54），目前台灣 ' || hr || ' 點' || E'\n';
  begin
    -- 每個目前能買的新商品：到對應地點買（現場用或進背包），回報花費；超出時段的記下來
    for c in select x from jsonb_array_elements(public.town_catalog()) x where x->>'shop' <> 'market' loop
      pl := c->>'shop';
      update public.town_residents set place = pl, items = jsonb_set(items, '{fi}', to_jsonb(pl)), money = 500000, energy = 80, fun = 30, hunger = 30 where id = a;
      update public.town_residents set place = pl, items = jsonb_set(items, '{fi}', to_jsonb(pl)), seen_at = now(), sleeping = false where id = b;
      select money into m0 from public.town_residents where id = a;
      begin
        if c->>'gift' = 'true' then j := public.town_goods(a, 'x', 'buy', c->>'id', 1, null); j := public.town_goods(a, 'x', 'gift', c->>'id', 1, b);
        else j := public.town_goods(a, 'x', 'buyuse', c->>'id', 1, null); end if;
        rep := rep || pl || ' ' || (c->>'id') || ' 花 ' || (m0 - (select money from public.town_residents where id = a)) || '（目錄 ' || (c->>'p') || '）：' || coalesce(j->>'msg','') || E'\n';
      exception when others then rep := rep || pl || ' ' || (c->>'id') || ' 例外：' || sqlerrm || E'\n'; end;
    end loop;
    -- 錯地點、錢不夠
    update public.town_residents set place = 'park', items = jsonb_set(items, '{fi}', '"park"') where id = a;
    begin perform public.town_goods(a, 'x', 'buyuse', 'dripcoffee', 1, null); err := '沒擋'; exception when others then err := '擋住：' || sqlerrm; end;
    rep := rep || '公園買咖啡 = ' || err || E'\n';
    update public.town_residents set place = 'cafe', items = jsonb_set(items, '{fi}', '"cafe"'), money = 50 where id = a;
    begin perform public.town_goods(a, 'x', 'buyuse', 'dripcoffee', 1, null); err := '沒擋'; exception when others then err := '擋住：' || sqlerrm; end;
    rep := rep || '錢不夠 = ' || err || '，錢 = ' || (select money from public.town_residents where id = a) || E'\n';
    -- 包場：每天 1 次、30% 進基金、乙心情 +15
    update public.town_residents set place = 'cinema', items = jsonb_set(jsonb_set(items, '{fi}', '"cinema"'), '{dl}', '{}'), money = 500000 where id = a;
    update public.town_residents set place = 'cinema', items = jsonb_set(items, '{fi}', '"cinema"'), seen_at = now(), fun = 30 where id = b;
    select fund into f0 from public.town_towns where id = t;
    perform public.town_goods(a, 'x', 'buyuse', 'cinemahall', 1, null);
    rep := rep || '包場：乙心情 ' || (select fun from public.town_residents where id = b) || '（期望 45），基金 +' || ((select fund from public.town_towns where id = t) - f0) || '（期望 450）' || E'\n';
    begin perform public.town_goods(a, 'x', 'buyuse', 'cinemahall', 1, null); err := '沒擋'; exception when others then err := '擋住：' || sqlerrm; end;
    rep := rep || '包場第二次 = ' || err || E'\n';
    -- 教練課：精力 < 20 擋；一般 +2 進度
    update public.town_residents set place = 'gym', items = jsonb_set(jsonb_set(items, '{fi}', '"gym"'), '{dl}', '{}'), energy = 10 where id = a;
    begin perform public.town_goods(a, 'x', 'buyuse', 'ptlesson', 1, null); err := '沒擋'; exception when others then err := '擋住：' || sqlerrm; end;
    rep := rep || '精力 10 上教練課 = ' || err || E'\n';
    update public.town_residents set energy = 80, items = items - 'at' where id = a;
    perform public.town_goods(a, 'x', 'buyuse', 'ptlesson', 1, null);
    select * into r from public.town_residents where id = a;
    rep := rep || '教練課後 st 進度 = ' || coalesce(r.items->'at'->'p'->>'st', 'nil') || '（期望 2），精力 ' || r.energy || '（期望 60）' || E'\n';
    -- 風箏：耐久 6 次；戶外限定
    update public.town_residents set place = 'park', items = (items - 'inv' - 'du') || '{"fi":"park"}', energy = 100 where id = a;
    perform public.town_goods(a, 'x', 'buy', 'kitefly', 1, null);
    ok := 0; for i in 1..8 loop begin perform public.town_goods(a, 'x', 'use', 'kitefly', 1, null); ok := ok + 1; exception when others then exit; end; end loop;
    rep := rep || '風箏可用 ' || ok || ' 次（期望 6），背包剩 ' || coalesce((select items->'inv'->>'kitefly' from public.town_residents where id = a), 'nil') || '（期望 0）' || E'\n';
    update public.town_residents set place = 'cafe', items = jsonb_set(items, '{fi}', '"cafe"') where id = a;
    update public.town_residents set items = jsonb_set(items, '{inv}', '{"frisbeedisc":1}') where id = a;
    begin perform public.town_goods(a, 'x', 'use', 'frisbeedisc', 1, null); err := '沒擋'; exception when others then err := '擋住：' || sqlerrm; end;
    rep := rep || '在咖啡廳玩飛盤 = ' || err || E'\n';
    -- 套圈圈 200 次：錢只會減少，玩偶約 25%
    update public.town_residents set place = 'plaza', items = (items - 'cl') || '{"fi":"plaza"}', money = 100000 where id = a;
    for i in 1..200 loop perform public.town_goods(a, 'x', 'buyuse', 'ringgame', 1, null); end loop;
    select * into r from public.town_residents where id = a;
    rep := rep || '套圈圈 200 次：花 ' || (100000 - r.money) || '（期望 10000），小玩偶 ' || (select coalesce(sum(v::int),0) from jsonb_each_text(coalesce(r.items->'cl','{}')) e(k,v)) || '（期望約 50）' || E'\n';
    -- 紀念品收藏
    update public.town_residents set place = 'cafe', items = jsonb_set(items, '{fi}', '"cafe"') where id = a;
    perform public.town_goods(a, 'x', 'buyuse', 'cafemug', 1, null);
    rep := rep || '紀念杯收藏 = ' || coalesce((select items->'cl'->>'cafemug' from public.town_residents where id = a), 'nil') || E'\n';
    -- 沒有任何人錢變負
    rep := rep || '錢為負的居民 = ' || (select count(*) from public.town_residents where town_id = t and money < 0) || E'\n';
    -- 第一批相容：超市商品仍可買
    update public.town_residents set place = 'market', items = jsonb_set(items, '{fi}', '"market"'), money = 1000 where id = a;
    perform public.town_goods(a, 'x', 'buy', 'cola', 1, null);
    rep := rep || '超市買可樂 OK，list 超市 = ' || jsonb_array_length((public.town_goods(a, 'x', 'list', 'market')::jsonb)->'items') || ' 項，list 咖啡廳 = ' || jsonb_array_length((public.town_goods(a, 'x', 'list', 'cafe')::jsonb)->'items') || ' 項' || E'\n';
  exception when others then rep := rep || '例外：' || sqlerrm || E'\n';
  end;
  raise exception E'REPORT\n%', rep;
end $$;
