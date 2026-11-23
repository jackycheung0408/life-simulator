-- 商品目錄第一批回滾實測：結果在 REPORT（最後 raise exception → 全部回滾）。接在 town_catalog1.sql 之後貼上。
do $$
declare t text := 'ZZCAT1'; a bigint; b bigint; rep text := ''; j json; r public.town_residents; m0 int; i int; ok int; err text; pk text;
  pin text := 'x'; c jsonb; sale text;
begin
  insert into public.town_towns(id, name, invite) values (t, '目錄測試鎮', 'ZZCAT1');
  insert into public.town_residents(town_id, name, slot, pin_hash, money, hunger, energy, bladder, hygiene, fun, place, x, y, items)
    values (t, '甲', 0, extensions.crypt('x', extensions.gen_salt('bf')), 5000, 50, 50, 50, 50, 50, 'market', 28, 14, '{}'::jsonb) returning id into a;
  insert into public.town_residents(town_id, name, slot, pin_hash, money, hunger, energy, bladder, hygiene, fun, place, x, y, items)
    values (t, '乙', 1, extensions.crypt('x', extensions.gen_salt('bf')), 100, 50, 50, 50, 50, 50, 'market', 28, 14, '{}'::jsonb) returning id into b;
  rep := rep || '目錄項數 = ' || jsonb_array_length(public.town_catalog()) || '（期望 24 列：19 項常駐＋5 項季節限定）' || E'\n';
  sale := public.town_cat_sale('market', to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'));
  rep := rep || '今日特價 = ' || sale || E'\n';
  rep := rep || '季節 0901-1005 在 0915 = ' || public.town_cat_live('0901-1005','0915') || '、在 1123 = ' || public.town_cat_live('0901-1005','1123') || '、跨年 1201-0228 在 0110 = ' || public.town_cat_live('1201-0228','0110') || E'\n';
  begin
    -- 不在店內買被擋（把甲移到街上）
    update public.town_residents set place = 'street' where id = a;
    begin perform public.town_goods(a, pin, 'buy', 'cola', 1, null); err := '沒擋'; exception when others then err := '擋住：' || sqlerrm; end;
    rep := rep || '街上買 = ' || err || E'\n';
    update public.town_residents set place = 'market' where id = a;
    -- 每一個目前有賣的商品：買進背包
    for c in select x from jsonb_array_elements(public.town_catalog()) x where public.town_cat_live(x->>'season', to_char(now() at time zone 'Asia/Taipei','MMDD')) loop
      select money into m0 from public.town_residents where id = a;
      j := public.town_goods(a, pin, 'buy', c->>'id', 1, null);
      rep := rep || '買 ' || (c->>'id') || ' 花 ' || (m0 - (select money from public.town_residents where id = a)) || '（原價 ' || (c->>'p') || '）' || E'\n';
    end loop;
    -- 用：每個非雨傘、非禮物的商品用一次
    for c in select x from jsonb_array_elements(public.town_catalog()) x where public.town_cat_live(x->>'season', to_char(now() at time zone 'Asia/Taipei','MMDD')) and coalesce(x->>'gift','false') = 'false' and x->>'sp' is distinct from 'umb' loop
      begin j := public.town_goods(a, pin, 'use', c->>'id', 1, null); rep := rep || '用 ' || (c->>'id') || '：' || (j->>'msg') || E'\n';
      exception when others then rep := rep || '用 ' || (c->>'id') || ' 失敗：' || sqlerrm || E'\n'; end;
    end loop;
    -- 送禮
    j := public.town_goods(a, pin, 'gift', 'bouquet', 1, b);
    rep := rep || '送花束：' || (j->>'msg') || '，乙心情 ' || (select fun from public.town_residents where id = b) || E'\n';
    begin perform public.town_goods(a, pin, 'gift', 'cola', 1, b); err := '沒擋'; exception when others then err := '擋住：' || sqlerrm; end;
    rep := rep || '送可樂 = ' || err || E'\n';
    -- 沒電池玩掌機被擋
    update public.town_residents set items = jsonb_set(items, '{inv}', (items->'inv') || '{"battery":0}') where id = a;
    begin perform public.town_goods(a, pin, 'use', 'handheld', 1, null); err := '沒擋'; exception when others then err := '擋住：' || sqlerrm; end;
    rep := rep || '沒電池 = ' || err || E'\n';
    -- 錢不夠
    update public.town_residents set money = 10 where id = a;
    begin perform public.town_goods(a, pin, 'buy', 'bento', 1, null); err := '沒擋'; exception when others then err := '擋住：' || sqlerrm; end;
    rep := rep || '錢不夠 = ' || err || '，錢 = ' || (select money from public.town_residents where id = a) || E'\n';
    -- 特價上限：買 5 份特價品只有前 3 份 8 折
    update public.town_residents set money = 5000, items = jsonb_set(items, '{sg}', '{}') - 'inv' where id = a;
    select money into m0 from public.town_residents where id = a;
    j := public.town_goods(a, pin, 'buy', sale, 5, null);
    rep := rep || '特價品 5 份總價 = ' || (m0 - (select money from public.town_residents where id = a)) || '（單價 ' || ((select x->>'p' from jsonb_array_elements(public.town_catalog()) x where x->>'id' = sale)) || '，前 3 份 8 折）' || E'\n';
    -- 背包上限（食物飲料 20）
    update public.town_residents set money = 100000, items = items - 'inv' where id = a;
    ok := 0;
    for i in 1..30 loop begin perform public.town_goods(a, pin, 'buy', 'bread', 1, null); ok := ok + 1; exception when others then exit; end; end loop;
    rep := rep || '食物背包最多買到 ' || ok || '（期望 20，等級 1）' || E'\n';
    -- 入獄擋
    update public.town_residents set items = jsonb_set(items, '{jl}', to_jsonb(now() + interval '1 hour')) where id = a;
    begin perform public.town_goods(a, pin, 'buy', 'cola', 1, null); err := '沒擋'; exception when others then err := '擋住：' || sqlerrm; end;
    rep := rep || '入獄買 = ' || err || E'\n';
    update public.town_residents set items = items - 'jl' where id = a;
    -- 急救包清鼻青臉腫
    update public.town_residents set bruised_until = now() + interval '1 hour' where id = a;
    perform public.town_goods(a, pin, 'buy', 'firstaid', 1, null); perform public.town_goods(a, pin, 'use', 'firstaid', 1, null);
    rep := rep || '急救包後鼻青臉腫 = ' || coalesce((select bruised_until > now() from public.town_residents where id = a), false) || '（期望 false）' || E'\n';
    -- 扭蛋 200 顆：收藏種類、錢沒增加
    update public.town_residents set money = 100000 where id = a;
    for i in 1..60 loop perform public.town_goods(a, pin, 'buyuse', 'capsule', 1, null); end loop;
    select * into r from public.town_residents where id = a;
    rep := rep || '扭蛋 60 顆花 ' || (100000 - r.money) || '（期望 6000），收藏種類 ' || (select count(*) from jsonb_object_keys(r.items->'cl')) || '，錢 ' || r.money || E'\n';
    -- 雨傘：放進背包，跑 tick 的雨事件很難造，這裡只確認補丁已套用
    rep := rep || 'town_tick 含雨傘補丁 = ' || (select position('umbrella' in pg_get_functiondef(p.oid)) > 0 from pg_proc p where p.proname = 'town_tick' and p.pronargs = 1) || E'\n';
  exception when others then rep := rep || '例外：' || sqlerrm || E'\n';
  end;
  raise exception E'REPORT\n%', rep;
end $$;
