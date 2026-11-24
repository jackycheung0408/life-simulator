-- 賽季回滾實測：結果在錯誤訊息 REPORT。接在 town_season.sql 之後貼上（整段最後 rollback）。
do $$
declare v_t text := 'ZZSEA'; v_a bigint; v_b bigint; v_c bigint; v_d bigint; v_ra public.town_residents; v_rep text := ''; v_j json; v_k int; v_money int;
begin
  perform set_config('town.date', '2026-11-10 12:00:00', true);
  insert into public.town_towns(id, name, invite) values (v_t, '測試鎮', 'ZZSEA1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (v_t,'甲',5000,0,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{"snack":0,"w":[]}'::jsonb) returning id into v_a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (v_t,'乙',5000,1,12,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{"snack":0}'::jsonb) returning id into v_b;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (v_t,'丙',5000,2,14,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{"snack":0}'::jsonb) returning id into v_c;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (v_t,'丁',5000,3,16,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{"snack":0}'::jsonb) returning id into v_d;
  select money into v_money from public.town_residents where id = v_a;
  -- 1) 每日上限：甲打工 60 次只計 40；乙 10 次
  for v_k in 1..60 loop perform public.town_season_add(v_a, 'work', 1, 40); end loop;
  for v_k in 1..10 loop perform public.town_season_add(v_b, 'work', 1, 40); end loop;
  v_rep := v_rep || '甲打工計=' || (select v from public.town_season_score where rid=v_a and k='work') || '（應 40）乙=' || (select v from public.town_season_score where rid=v_b and k='work') || E'\n';
  perform set_config('town.date', '2026-11-11 12:00:00', true);
  for v_k in 1..60 loop perform public.town_season_add(v_a, 'work', 1, 40); end loop;
  v_rep := v_rep || '隔天甲=' || (select v from public.town_season_score where rid=v_a and k='work') || '（應 80）' || E'\n';
  perform set_config('town.date', '2026-11-10 12:00:00', true);
  -- 2) 甲打工封頂：再加 400 次（多天）仍最多 80 分；其他項
  update public.town_season_score set v = 400 where rid = v_a and k = 'work';
  perform public.town_season_add(v_b, 'meet', 5, 3); perform public.town_season_add(v_b, 'meet', 5, 3);
  perform public.town_season_add(v_b, 'ar_whack', 30, null, true); perform public.town_season_add(v_b, 'ar_whack', 20, null, true); perform public.town_season_add(v_b, 'ar_memory', 80, null, true);
  perform public.town_season_add(v_b, 'ach', 10);
  perform public.town_season_add(v_c, 'meet', 2); perform public.town_season_add(v_c, 'ar_whack', 40, null, true); perform public.town_season_add(v_c, 'ar_memory', 100, null, true); perform public.town_season_add(v_c, 'ach', 10);
  perform public.town_season_add(v_d, 'work', 40); perform public.town_season_add(v_d, 'meet', 1);
  -- 3) 賭場：丙 25 局、當日淨贏 200000（日上限 50000 → 50 分）；甲只有 5 局淨贏 90000 不到局數門檻
  insert into public.town_casino_log(rid, day, game, rounds, wagered, net) values (v_c, '2026-11-05', 'wheel', 25, 100000, 200000), (v_a, '2026-11-05', 'wheel', 5, 1000, 90000), (v_b, '2026-11-06', 'wheel', 30, 5000, -80000);
  v_j := public.town_season(v_a, 'x', 'view');
  v_rep := v_rep || '本季=' || ((v_j::jsonb)->>'nm') || ' 排行=' || ((v_j::jsonb)->'top')::text || E'\n';
  v_rep := v_rep || '應：甲 w=80 c=0（局數不足）=80；乙 meet 3 次計 3（每日 3）=45、街機 30+40... 見 top' || E'\n';
  -- 4) 公告冪等
  perform public.town_season(v_a, 'x', 'view'); perform public.town_season(v_b, 'x', 'view');
  v_rep := v_rep || '開季公告筆數=' || (select count(*) from public.town_events where town_id=v_t and kind='season' and msg like '新賽季%') || '（應 1）' || E'\n';
  perform set_config('town.date', '2026-11-25 12:00:00', true);
  perform public.town_season(v_a, 'x', 'view');
  v_rep := v_rep || '剩 7 天公告=' || (select count(*) from public.town_events where town_id=v_t and kind='season' and msg like '%剩%') || '（應 1，再呼叫不重複）' || E'\n';
  perform public.town_season(v_a, 'x', 'view');
  v_rep := v_rep || '再呼叫後=' || (select count(*) from public.town_events where town_id=v_t and kind='season' and msg like '%剩%') || E'\n';
  -- 5) 季末結算（跨月）：冪等、領獎、重領擋、錢不變
  perform set_config('town.date', '2026-12-01 09:00:00', true);
  v_j := public.town_season(v_a, 'x', 'view');
  v_rep := v_rep || '結算後待領 甲=' || ((v_j::jsonb)->'pend')::text || E'\n';
  perform public.town_season(v_b, 'x', 'view');
  v_rep := v_rep || '結算動態筆數=' || (select count(*) from public.town_events where town_id=v_t and kind='season' and msg like '楓葉季結算%') || '（應 1）' || E'\n';
  v_rep := v_rep || '結算 result=' || (select result::text from public.town_seasons where tid=v_t and ym='202611') || E'\n';
  v_j := public.town_season(v_c, 'x', 'view'); v_rep := v_rep || '丙待領=' || ((v_j::jsonb)->'pend')::text || E'\n';
  v_j := public.town_season(v_c, 'x', 'claim', '202611'); v_rep := v_rep || '丙領獎=' || v_j::text || E'\n';
  begin perform public.town_season(v_c, 'x', 'claim', '202611'); v_rep := v_rep || '重領沒擋（錯）' || E'\n'; exception when others then v_rep := v_rep || '重領被擋：' || sqlerrm || E'\n'; end;
  begin perform public.town_season(v_a, 'x', 'claim', '202610'); v_rep := v_rep || '沒結算的季沒擋（錯）' || E'\n'; exception when others then v_rep := v_rep || '沒有的季被擋：' || sqlerrm || E'\n'; end;
  begin perform public.town_season(v_a, 'x', 'claim', 'abc'); v_rep := v_rep || '亂代號沒擋（錯）' || E'\n'; exception when others then v_rep := v_rep || '亂代號被擋' || E'\n'; end;
  select * into v_ra from public.town_residents where id = v_c;
  v_rep := v_rep || '丙稱號=' || (v_ra.items->'titles')::text || ' 造型=' || (v_ra.items->'w')::text || ' 零食=' || (v_ra.items->>'snack') || ' 錢=' || v_ra.money || '（應 5000）' || E'\n';
  -- 6) 造型驗證：town_login 允許已領的賽季造型、擋沒領的
  begin perform public.town_login(v_c, 'x', null); exception when others then null; end;
  v_rep := v_rep || '賽季造型在 town_shop=' || (select count(*) from public.town_shop where unlock='season') || '（應 3）' || E'\n';
  -- 7) 圖鑑：賽季造型不計核心、標已絕版
  v_j := public.town_dex(v_a, 'x', 'view');
  v_rep := v_rep || '圖鑑造型頁賽季格=' || (select string_agg(z->>'k' || ':' || (z->>'seas') || ':' || (z->>'hint'), '、') from jsonb_array_elements(((v_j::jsonb)->'tabs')->1->'list') z where z->>'k' like 's2%') || E'\n';
  -- 8) 歷史
  v_j := public.town_season(v_a, 'x', 'hist'); v_rep := v_rep || 'hist=' || ((v_j::jsonb)->'hist')::text || E'\n';
  -- 9) 活躍不到 3 人只發參與獎：另一個鎮
  insert into public.town_towns(id, name, invite) values ('ZZSEB', '測試鎮B', 'ZZSEB1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values ('ZZSEB','戊',5000,0,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{"snack":0}'::jsonb) returning id into v_k;
  insert into public.town_season_score(ym, rid, k, v) values ('202611', v_k, 'work', 100);
  v_j := public.town_season(v_k, 'x', 'view');
  v_rep := v_rep || '小鎮只有 1 人活躍：' || (select result->'aw'::text from public.town_seasons where tid='ZZSEB' and ym='202611')::text || '（應只有 p，沒有 1）' || E'\n';
  -- 10) 補丁在
  v_rep := v_rep || '補丁 hook=' || (position('town_season_add' in (select prosrc from pg_proc where proname='town_goal_hook' and pronamespace='public'::regnamespace limit 1)) > 0)
    || ' meet=' || (position('town_season_add' in (select prosrc from pg_proc where proname='town_meet_settle' and pronamespace='public'::regnamespace limit 1)) > 0)
    || ' score=' || (position('town_season_add' in (select prosrc from pg_proc where proname='town_score' and pronamespace='public'::regnamespace limit 1)) > 0)
    || ' ach=' || (position('town_season_add' in (select prosrc from pg_proc where proname='town_ach_check' and pronamespace='public'::regnamespace limit 1)) > 0) || E'\n';
  v_rep := v_rep || '甲的錢=' || (select money from public.town_residents where id=v_a) || '（應 ' || v_money || '）' || E'\n';
  raise exception 'REPORT %', E'\n' || v_rep;
end $$;
