-- 小豬鎮：town_errlog 回滾實測。整段最後 rollback，結果在錯誤訊息 REPORT。要在 town_errlog.sql 之後。
-- 驗：同錯誤合併累計、字串截 300、Email／網址參數／長數字被遮、每 ua 每分鐘 3 筆限速、非法輸入靜默、非鎮長看不到、鎮長看得到、7 天前資料可清。
do $$
declare rep text := ''; n1 int; n2 int; m text; tid text; rm public.town_residents; rn public.town_residents; j json; i int;
begin
  delete from public.town_errlog; delete from public.town_errlog_rl;
  -- 合併
  perform public.town_errlog('boom x', 'town.js', 10, 'UA-A', '300');
  perform public.town_errlog('boom x', 'town.js', 10, 'UA-B', '300');
  select n into n1 from public.town_errlog where msg = 'boom x';
  rep := rep || 'merge n=' || coalesce(n1::text, 'null') || ' (expect 2)' || E'\n';
  -- 截長與遮蔽
  perform public.town_errlog(repeat('a', 500) || ' mail me@x.com id 12345678901 http://x.y/z?token=abc', null, null, 'UA-C', '1');
  select length(msg) into n1 from public.town_errlog where msg like 'aaaa%';
  rep := rep || 'len<=300: ' || (n1 <= 300) || E'\n';
  perform public.town_errlog('mail me@x.com id 12345678901 http://x.y/z?token=abc', null, null, 'UA-D', '1');
  select msg into m from public.town_errlog where msg like 'mail%';
  rep := rep || 'masked: ' || m || ' (no @, no token, no 11 digits: ' || (m !~ '@' and m !~ 'token' and m !~ '[0-9]{8}') || ')' || E'\n';
  -- 限速
  for i in 1..6 loop perform public.town_errlog('rl ' || i, null, null, 'UA-RL', '1'); end loop;
  select count(*) into n1 from public.town_errlog where msg like 'rl %';
  rep := rep || 'ratelimit rows=' || n1 || ' (expect 3)' || E'\n';
  -- 非法輸入靜默
  perform public.town_errlog(null); perform public.town_errlog(''); perform public.town_errlog('x', null, -5, null, null);
  rep := rep || 'null/empty silent ok' || E'\n';
  -- 權限
  tid := 'ZZERR1'; insert into public.town_towns(id, name, invite) values (tid, 'errlog test', 'ZZERR1X');
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items,mayor) values (tid,'M',1000,0,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb,true) returning * into rm;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items,mayor) values (tid,'N',1000,1,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb,false) returning * into rn;
  begin
    j := public.town_errlog_view(rn.id, 'x');
    rep := rep || 'non-mayor view -> ' || coalesce(j::text, 'null') || E'\n';
  exception when others then rep := rep || 'non-mayor raised (expected): ' || sqlerrm || E'\n'; end;
  j := public.town_errlog_view(rm.id, 'x');
  rep := rep || 'mayor view total=' || (j->>'total') || ' rows=' || json_array_length(j->'rows') || E'\n';
  -- 清理：舊資料
  insert into public.town_errlog(day, h, msg) values ((now() at time zone 'Asia/Taipei')::date - 9, 'old', 'old row');
  for i in 1..400 loop perform public.town_errlog('clean ' || (i % 3), null, null, 'UA-X' || i, '1'); end loop;
  select count(*) into n2 from public.town_errlog where msg = 'old row';
  rep := rep || 'old rows after 400 calls=' || n2 || ' (expect 0, 2% chance each)' || E'\n';
  raise exception 'REPORT%', E'\n' || rep;
end $$;
