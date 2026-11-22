-- 留存機制回滾實測：結果在錯誤訊息 REPORT。接在 town_retention.sql 之後貼上（全部回滾，不留資料）。
do $$
declare t text := 'ZZRET'; a bigint; b bigint; c bigint; d bigint; ra public.town_residents; rep text := ''; i int; good int := 0; bad int := 0; e0 bigint;
  y1 text := to_char((now() at time zone 'Asia/Taipei')::date - 1,'YYYY-MM-DD');
  y2 text := to_char((now() at time zone 'Asia/Taipei')::date - 2,'YYYY-MM-DD');
  wk text := to_char(now() at time zone 'Asia/Taipei','IYYY-IW');
begin
  insert into public.town_towns(id,name,invite) values (t,'測試鎮','ZZRET1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',1000,0,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),
    jsonb_build_object('al', jsonb_build_object('n',20,'d',y1,'s',6,'lv',3), 'd', '["mailbox","flowers"]'::jsonb)) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'乙',1000,1,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),
    jsonb_build_object('al', jsonb_build_object('n',2,'d',y1,'s',1,'lv',1))) returning id into b;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'丙',1000,2,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into c;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'丁',1000,3,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into d;

  -- 連續第 7 天：圍巾＋稱號；信箱給零食、花圃給錢
  select * into ra from public.town_residents where id = a;
  ra := public.town_al_touch(ra);
  rep := rep || ' 第7天 s=' || (ra.items->'al'->>'s') || ' w=' || coalesce((ra.items->'w')::text,'null') || ' 稱號=' || ((ra.items->'titles') ? '一週不缺席')::text || ' snack=' || coalesce(ra.items->>'snack','0') || ' 錢=' || ra.money;
  -- 同一天再呼叫不重複
  ra := public.town_al_touch(ra);
  rep := rep || ' 重複後錢=' || ra.money;
  -- 保護盾：隔 1 天，本週沒用過 => 保住；已用過 => 歸 1
  select * into ra from public.town_residents where id = a;
  ra.items := jsonb_set(ra.items, '{al}', jsonb_build_object('n',20,'d',y2,'s',5,'lv',3,'sw',''));
  ra := public.town_al_touch(ra);
  rep := rep || ' 盾=' || (ra.items->'al'->>'s');
  ra.items := jsonb_set(ra.items, '{al}', jsonb_build_object('n',20,'d',y2,'s',5,'lv',3,'sw',wk));
  ra.items := jsonb_set(ra.items, '{al,d}', to_jsonb(y2));
  ra := public.town_al_touch(ra);
  rep := rep || ' 本週盾用過=' || (ra.items->'al'->>'s');

  -- 新人保護：乙（登入 2 天）同一人第 3 次、全部人第 5 次被擋；打招呼不擋
  for i in 1..3 loop
    begin insert into public.town_events(town_id,actor,target,kind,msg) values (t, c, b, 'fight', 't'); rep := rep || ' 丙打#' || i || '=ok';
    exception when others then rep := rep || ' 丙打#' || i || '=擋'; end;
  end loop;
  for i in 1..3 loop
    begin insert into public.town_events(town_id,actor,target,kind,msg) values (t, d, b, 'egg', 't'); rep := rep || ' 丁蛋#' || i || '=ok';
    exception when others then rep := rep || ' 丁蛋#' || i || '=擋'; end;
  end loop;
  begin insert into public.town_events(town_id,actor,target,kind,msg) values (t, c, b, 'greet', 't'); rep := rep || ' 打招呼=ok';
  exception when others then rep := rep || ' 打招呼=擋'; end;
  begin insert into public.town_events(town_id,actor,target,kind,msg) values (t, c, a, 'fight', 't'); rep := rep || ' 打老居民=ok';
  exception when others then rep := rep || ' 打老居民=擋'; end;

  -- 登入隨機事件：現金 5 萬跑 500 次、現金 3000 跑 500 次
  select coalesce(max(id),0) into e0 from public.town_events;
  for i in 1..500 loop
    select * into ra from public.town_residents where id = c; ra.money := 50000; ra.items := ra.items - 'rent'; ra := public.town_rent(ra);
  end loop;
  select count(*) filter (where msg ~ '(撿到錢|發票|紅包|還錢|舊東西)'), count(*) filter (where msg ~ '(水管|意外的帳單|朋友騙|錢包掉|家電)') into good, bad from public.town_events where id > e0 and kind = 'luck';
  rep := rep || ' 有錢人500次 好=' || good || ' 壞=' || bad;
  select coalesce(max(id),0) into e0 from public.town_events;
  for i in 1..500 loop
    select * into ra from public.town_residents where id = c; ra.money := 3000; ra.items := ra.items - 'rent'; ra := public.town_rent(ra);
  end loop;
  select count(*) filter (where msg ~ '(撿到錢|發票|紅包|還錢|舊東西)'), count(*) filter (where msg ~ '(水管|意外的帳單|朋友騙|錢包掉|家電)') into good, bad from public.town_events where id > e0 and kind = 'luck';
  rep := rep || ' 窮人500次 好=' || good || ' 壞=' || bad || '（壞必須是 0）';

  -- 小鎮人氣禮：甲、丙是活躍居民（登入 5 天），丁今天滿 3 天 → 活躍 3 位，pop=3，丁領 3 的禮（零食 2 包），隔天不重複
  update public.town_residents set items = jsonb_set(items, '{al}', jsonb_build_object('n',5,'d',y1,'s',1,'lv',2)) where id in (a, c);
  update public.town_residents set items = jsonb_set(items, '{al}', jsonb_build_object('n',2,'d',y1,'s',1,'lv',1)) where id = d;
  select * into ra from public.town_residents where id = d; ra := public.town_al_touch(ra);
  rep := rep || ' 人氣 丁滿3天 pop=' || (select pop from public.town_towns where id = t) || ' pm=' || (ra.items->'al'->>'pm') || ' snack=' || coalesce(ra.items->>'snack','0');
  update public.town_residents set items = ra.items, money = ra.money where id = d;
  ra.items := jsonb_set(ra.items, '{al,d}', to_jsonb(y1)); ra := public.town_al_touch(ra);
  rep := rep || ' 隔天不重複 pm=' || (ra.items->'al'->>'pm');
  -- 午間薪水：現在若在 12,13,21,22 點是 +10%，否則 100
  rep := rep || ' 薪水倍率=' || public.town_wd_pct(t);
  raise exception 'REPORT %', rep;
end $$;
