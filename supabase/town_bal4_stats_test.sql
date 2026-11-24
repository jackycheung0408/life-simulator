-- 平衡批 4 實測：上限 8、洗點、各屬性效果。最後 rollback，結果在 REPORT。
do $$
declare t text := 'ZZB4'; a bigint; b bigint; ra public.town_residents; rep text := ''; v int; j json; m0 int; f0 bigint; i int; hits int := 0;
begin
  insert into public.town_towns(id,name,invite,fund) values (t,'測試鎮','ZZB4X1',0) on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,mayor,pin_hash,items) values (t,'甲',20000,0,10,10,'cafe',true,extensions.crypt('x', extensions.gen_salt('bf')),'{"at":{"st":8,"ag":8,"ch":8,"iq":8,"lk":8,"init":1,"sp":3,"p":{"st":4}},"fi":"cafe","al":{"lv":5}}'::jsonb) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'乙',20000,1,10,10,'cafe',extensions.crypt('x', extensions.gen_salt('bf')),'{"fi":"cafe"}'::jsonb) returning id into b;
  select * into ra from public.town_residents where id = a;
  rep := rep||'town_at 8 點：st='||public.town_at(ra,'st')||' iq='||public.town_at(ra,'iq')||case when public.town_at(ra,'st')=8 then ' OK' else ' BAD' end||E'\n';
  -- 練到 9 被擋：st 已 8
  begin perform public.town_train(a,'x','lift'); rep := rep||'8 點再舉重 NOT BLOCKED BAD'||E'\n'; exception when others then rep := rep||'8 點再舉重：'||sqlerrm||' OK'||E'\n'; end;
  -- 升級加點到 8 被擋
  begin perform public.town_stats(a,'x','spend','st'); rep := rep||'spend 超過 8 NOT BLOCKED BAD'||E'\n'; exception when others then rep := rep||'spend 超過 8：'||sqlerrm||' OK'||E'\n'; end;
  -- 魅力 8：咖啡精力 +66（起始 20）
  update public.town_residents set energy=20, fun=60, hunger=90, hygiene=90, bladder=90, seen_at=now(), updated_at=now() where id=a;
  perform public.town_act(a,'x','coffee');
  select energy into v from public.town_residents where id=a;
  rep := rep||'魅力8 咖啡後精力='||v||' (20+50+16=86)'||case when v>=84 and v<=88 then ' OK' else ' BAD' end||E'\n';
  -- 洗點
  select fund into f0 from public.town_towns where id=t;
  j := public.town_stats_reset(a,'x');
  select money into m0 from public.town_residents where id=a;
  rep := rep||'洗點後錢='||m0||case when m0<20000-5000+1 then ' OK' else ' BAD' end||'、基金 +'||((select fund from public.town_towns where id=t)-f0)||' (2500)'||E'\n';
  j := public.town_stats(a,'x','view'); rep := rep||'洗點後能力：'||(j->'at')::text||' init='||(j->>'init')||E'\n';
  update public.town_residents set money=100 where id=a;
  begin perform public.town_stats_reset(a,'x'); rep := rep||'錢不夠 NOT BLOCKED BAD'||E'\n'; exception when others then rep := rep||'錢不夠：'||sqlerrm||' OK'||E'\n'; end;
  delete from public.town_towns where id = t;
  raise exception E'REPORT\n%', rep;
end $$;
