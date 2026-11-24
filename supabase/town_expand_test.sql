-- 地圖東側加寬（階段 1）回滾實測：結果在 REPORT（最後 raise exception → 全部回滾）。接在 town_expand.sql 之後貼上。
do $$
declare t text := 'ZZEXP'; a bigint; rep text := ''; m0 bigint; m1 bigint;
begin
  insert into public.town_towns(id,name,invite,fund) values (t,'測試鎮','ZZEXP1',0) on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',5000,0,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into a;
  select money into m0 from public.town_residents where id = a;
  begin perform public.town_act(a,'x','move',null,99,10,'street'); rep := rep || ' x=99=可'; exception when others then rep := rep || ' x=99=擋(錯)「' || sqlerrm || '」'; end;
  begin perform public.town_act(a,'x','move',null,100,10,'street'); rep := rep || ' x=100=成功(錯)'; exception when others then rep := rep || ' x=100=擋'; end;
  begin perform public.town_act(a,'x','move',null,90,20,'street'); rep := rep || ' x=90,y=20=可'; exception when others then rep := rep || ' x=90=擋(錯)「' || sqlerrm || '」'; end;
  rep := rep || ' 標記=' || exists (select 1 from public.town_migrations where id = 'layout6');
  rep := rep || ' 仍含舊上限的函式數=' || (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind = 'f' and pg_get_functiondef(p.oid) like '%px > 85%') || '(應0)';
  select money into m1 from public.town_residents where id = a;
  rep := rep || ' 錢差=' || (m0 - m1) || '(只有油錢，非負) 居民現況x=' || (select x from public.town_residents where id = a);
  raise exception 'REPORT %', rep;
end $$;
