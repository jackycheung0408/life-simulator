-- 排行榜賭場榜實測（接在 town_casino_rank.sql 之後貼上；最後 rollback，結果在錯誤訊息 REPORT）
do $$
declare cr json; a bigint; b bigint; c bigint; rep text := ''; j json; bad int := 0; nm text;
  today text := to_char((now() at time zone 'Asia/Taipei')::date, 'YYYY-MM-DD');
  old text := to_char((now() at time zone 'Asia/Taipei')::date - 30, 'YYYY-MM-DD');
begin
  cr := public.town_create('ZZCRANK','甲','1234'); a := (cr->>'resident_id')::bigint;
  select name into nm from public.town_residents where id = a;
  -- 甲：30 天前贏 5000、今天贏 1000（7 天榜 1000、累計 6000）
  insert into public.town_casino_log(rid, day, game, net) values (a, old, 'wheel', 5000), (a, today, 'wheel', 1000);
  j := public.town_rank(a, '1234', 'casino');
  rep := rep || '7天榜 ' || coalesce((j->'boards'->'casino'->0->>'v'), '-') || E'（應 1000）\n';
  if coalesce((j->'boards'->'casino'->0->>'v'),'') <> '1000' then bad := bad + 1; end if;
  j := public.town_rank(a, '1234', 'casino_all');
  rep := rep || '累計榜 ' || coalesce((j->'boards'->'casino_all'->0->>'v'), '-') || E'（應 6000）\n';
  if coalesce((j->'boards'->'casino_all'->0->>'v'),'') <> '6000' then bad := bad + 1; end if;
  -- 累計淨輸的人不上榜
  update public.town_casino_log set net = -300 where rid = a;
  j := public.town_rank(a, '1234', 'casino_all');
  rep := rep || '累計為負列數 ' || json_array_length(j->'boards'->'casino_all') || E'（應 0）\n';
  if json_array_length(j->'boards'->'casino_all') <> 0 then bad := bad + 1; end if;
  -- 全部榜都要在，且互相分開
  j := public.town_rank(a, '1234', null);
  rep := rep || '榜數 ' || (select count(*) from json_object_keys(j->'boards')) || E'（應 6）\n';
  if (select count(*) from json_object_keys(j->'boards')) <> 6 then bad := bad + 1; end if;
  -- 打工榜：works + jw 加總
  update public.town_residents set items = jsonb_build_object('works', 7, 'jw', '{"cafe":3,"gym":2}'::jsonb) where id = a;
  j := public.town_rank(a, '1234', 'works');
  rep := rep || '打工榜 ' || coalesce((j->'boards'->'works'->0->>'v'), '-') || E'（應 12）\n';
  if coalesce((j->'boards'->'works'->0->>'v'),'') <> '12' then bad := bad + 1; end if;
  rep := rep || 'bad=' || bad || E'\n';
  raise exception 'REPORT%', E'\n' || rep;
end $$;
