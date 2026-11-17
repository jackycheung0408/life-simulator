-- 流動商人回滾實測：結果在錯誤訊息 REPORT。接在 town_npc.sql 之後貼上。
do $$
declare t text := 'ZZNPC'; a bigint; ra public.town_residents; j json; rep text := ''; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
begin
  insert into public.town_towns(id,name) values (t,'測試鎮') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,pin_hash) values (t,'甲',5000,extensions.crypt('x', extensions.gen_salt('bf'))) returning id into a;
  j := public.town_npc(a, 'x', 'view'); rep := rep || ' view=' || j::text;
  update public.town_npcs set place='plaza', start_at=now()-interval '10 minutes', until=now()+interval '50 minutes' where town_id=t;
  update public.town_residents set place='park' where id=a;
  rep := rep || ' 不同地點=' || public.town_npc(a,'x','buy','tonic')::text;
  update public.town_residents set place='plaza' where id=a;
  rep := rep || ' tonic=' || public.town_npc(a,'x','buy','tonic')::text;
  rep := rep || ' 重複=' || public.town_npc(a,'x','buy','tonic')::text;
  rep := rep || ' book=' || public.town_npc(a,'x','buy','book')::text;
  rep := rep || ' toy=' || public.town_npc(a,'x','buy','toy')::text;
  select * into ra from public.town_residents where id=a;
  rep := rep || ' 剩錢=' || ra.money || '(預期 0，不足時擋)';
  update public.town_npcs set until=now()-interval '1 minute' where town_id=t;
  rep := rep || ' 離開後=' || public.town_npc(a,'x','buy','book')::text;
  raise exception 'REPORT %', rep;
end $$;
