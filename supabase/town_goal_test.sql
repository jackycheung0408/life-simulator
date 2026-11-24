-- 成就系統回滾實測：結果在錯誤訊息 REPORT。接在 town_goal.sql 之後貼上（整段最後 rollback）。
do $$
declare t text := 'ZZGLD'; a bigint; b bigint; ra public.town_residents; rep text := ''; j json; l jsonb;
begin
  insert into public.town_towns(id,name,invite) values (t,'測試鎮','ZZGLD1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',5000,0,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{"works":60,"snack":0}'::jsonb) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'乙',100,1,12,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into b;
  rep := rep || '成就數=' || jsonb_array_length(public.town_ach_def()) || '（應 80）；階數=' || (select sum(jsonb_array_length(ae->'th')) from jsonb_array_elements(public.town_ach_def()) ae) || E'\n';
  rep := rep || '補丁：town_act=' || (position('town_goal_hook' in pg_get_functiondef('public.town_act(bigint,text,text,bigint,real,real,text,text,text)'::regprocedure)) > 0)
    || ' town_fac=' || coalesce((select position('town_goal_hook' in p.prosrc) > 0 from pg_proc p where p.proname='town_fac' and p.pronamespace='public'::regnamespace limit 1), false)
    || ' town_casino=' || coalesce((select position('town_goal_casino' in p.prosrc) > 0 from pg_proc p where p.proname='town_casino' and p.pronamespace='public'::regnamespace limit 1), false) || E'\n';
  -- 1) 讀取層：works=60 → 打工達人 2 階
  j := public.town_ach(a,'x','view');
  select ae into l from jsonb_array_elements((j::jsonb)->'list') ae where (ae->>'id')::int = 1;
  rep := rep || '打工達人(works=60) u=' || (l->>'u') || '（應 2）、new 筆數=' || jsonb_array_length((j::jsonb)->'new') || E'\n';
  -- 2) 領取：銅=零食、銀=稱號、再領擋住
  j := public.town_ach(a,'x','claim',1); rep := rep || '領1=' || j::text || E'\n';
  j := public.town_ach(a,'x','claim',1); rep := rep || '領2=' || j::text || E'\n';
  begin perform public.town_ach(a,'x','claim',1); rep := rep || '第三次領：沒擋（錯）' || E'\n'; exception when others then rep := rep || '第三次領被擋：' || sqlerrm || E'\n'; end;
  select * into ra from public.town_residents where id = a;
  rep := rep || '零食=' || coalesce(ra.items->>'snack','nil') || '（應 1）稱號=' || coalesce(ra.items->>'titles','nil') || ' 錢=' || ra.money || '（應 5000 不變）' || E'\n';
  -- 3) 背包滿擋銅階
  update public.town_residents set items = items || jsonb_build_object('snack', 99, 'works', 10) where id = a;
  -- 4) 事件觸發器：送禮 5 次 → 送禮王；pk 雙方都算
  for i in 1..5 loop insert into public.town_events(town_id,actor,target,kind,msg) values (t,a,b,'gift','甲送禮給乙'); end loop;
  insert into public.town_events(town_id,actor,target,kind,msg) values (t,a,b,'pk','甲和乙打了一場');
  rep := rep || '計數 gft=' || coalesce((select n from public.town_ach_c where rid=a and k='gft'),0) || '（應 5）pk 甲=' || coalesce((select n from public.town_ach_c where rid=a and k='pk'),0) || ' 乙=' || coalesce((select n from public.town_ach_c where rid=b and k='pk'),0) || '（都應 1）' || E'\n';
  j := public.town_ach(a,'x','view');
  select ae into l from jsonb_array_elements((j::jsonb)->'list') ae where (ae->>'id')::int = 20;
  rep := rep || '送禮王 u=' || (l->>'u') || '（應 1）' || E'\n';
  -- 5) 掛鉤：睡覺 10 次、夜間每日一次、賭場
  ra := public.town_goal_hook(ra, 'act', 'sleep'); for i in 1..9 loop ra := public.town_goal_hook(ra, 'act', 'qsleep'); end loop;
  rep := rep || '睡覺計數=' || coalesce((select n from public.town_ach_c where rid=a and k='slp'),0) || '（應 10）' || E'\n';
  perform public.town_goal_bump_day(a, 'zz'); perform public.town_goal_bump_day(a, 'zz');
  rep := rep || '每日一次 zz=' || coalesce((select n from public.town_ach_c where rid=a and k='zz'),0) || '（應 1）' || E'\n';
  perform public.town_goal_casino(a, 'slots', true, -100); perform public.town_goal_casino(a, 'bacc', true, 6000); perform public.town_goal_casino(a, 'bj_hit', false, 200000);
  rep := rep || '賭場 cp=' || coalesce((select n from public.town_ach_c where rid=a and k='cp'),0) || '（應 2）cw5k=' || coalesce((select n from public.town_ach_c where rid=a and k='cw5k'),0) || '（應 2）cw100k=' || coalesce((select n from public.town_ach_c where rid=a and k='cw100k'),0) || '（應 1）closs=' || coalesce((select n from public.town_ach_c where rid=a and k='closs'),0) || '（應 100）款式=' || (select count(*) from public.town_ach_c where rid=a and k like 'cg\_%') || '（應 2）' || E'\n';
  -- 6) 上限
  perform public.town_goal_bump(a, 'cap', 20000); rep := rep || '上限 cap=' || (select n from public.town_ach_c where rid=a and k='cap') || '（應 9999）' || E'\n';
  -- 7) 單階成就：生死之交（好感 ≥60）→ 稱號
  insert into public.town_bonds(town_id,a,b,score) values (t, least(a,b), greatest(a,b), 65);
  j := public.town_ach(a,'x','view'); select ae into l from jsonb_array_elements((j::jsonb)->'list') ae where (ae->>'id')::int = 19;
  rep := rep || '生死之交 u=' || (l->>'u') || '（應 1）';
  j := public.town_ach(a,'x','claim',19); rep := rep || ' 領=' || j::text || '（背包滿只給稱號）' || E'\n';
  -- 8) seen 清單
  j := public.town_ach(a,'x','seen'); rep := rep || 'seen 後 new=' || jsonb_array_length((j::jsonb)->'new') || '（應 0）' || E'\n';
  -- 9) 乙新手：不丟錯、全部 0
  j := public.town_ach(b,'x','view'); rep := rep || '乙 got=' || ((j::json)->>'got') || E'\n';
  select * into ra from public.town_residents where id = a; rep := rep || '甲最終錢=' || ra.money || '（應 5000）' || E'\n';
  raise exception 'REPORT %', E'\n' || rep;
end $$;
