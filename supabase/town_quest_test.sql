-- 公告欄委託回滾實測：結果在錯誤訊息 REPORT。接在 town_quest.sql 之後貼上。
do $$
declare t text := 'ZZQST'; a bigint; ra public.town_residents; rep text := ''; q int;
begin
  insert into public.town_towns(id,name,invite) values (t,'測試鎮','ZZQST1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',100,0,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{"works":12}'::jsonb) returning id into a;
  rep := rep || ' view=' || public.town_quest(a,'x','view')::text;
  q := ((public.town_quest(a,'x','view')::jsonb)->>'q')::int;
  rep := rep || ' 不在市政廳=' || public.town_quest(a,'x','claim')::text;
  update public.town_residents set place='townhall' where id=a;
  rep := rep || ' 未達成=' || public.town_quest(a,'x','claim')::text;
  update public.town_residents set items = items || jsonb_build_object('snack',1,'zp',2,'dc',jsonb_build_object('d',to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'),'work',3)) where id=a;
  rep := rep || ' 達成(q=' || q || ')=' || public.town_quest(a,'x','claim')::text;
  rep := rep || ' 重複=' || public.town_quest(a,'x','claim')::text;
  select * into ra from public.town_residents where id=a;
  rep := rep || ' 錢=' || ra.money || ' items=' || ra.items::text;
  raise exception 'REPORT %', rep;
end $$;
