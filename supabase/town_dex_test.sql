-- 圖鑑回滾實測：結果在錯誤訊息 REPORT。接在 town_dex.sql 之後貼上（整段最後 rollback）。
do $$
declare t text := 'ZZDEX'; a bigint; b bigint; ra public.town_residents; rep text := ''; j json; v_tabs jsonb; v_i int; v_e jsonb;
begin
  insert into public.town_towns(id,name,invite) values (t,'測試鎮','ZZDEX1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',5000,0,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{"snack":0,"w":["crown","suit"],"f":["bed","sofa"],"cl":{"c01":1,"c02":2,"k01":1,"p01":1,"cafemug":1},"fq":{"cafe":3,"park":1},"works":5,"vz":{"d":"x"}}'::jsonb) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'乙',100,1,12,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into b;
  -- 1) 總數對真實清單
  j := public.town_dex(a,'x','view'); v_tabs := (j::jsonb)->'tabs';
  for v_i in 0..jsonb_array_length(v_tabs)-1 loop v_e := v_tabs->v_i;
    rep := rep || (v_e->>'k') || ' 清單=' || jsonb_array_length(v_e->'list') || ' 核心=' || (v_e->>'tot') || ' 已得=' || (v_e->>'got') || E'\n'; end loop;
  rep := rep || '應：col 52／wear ' || (select count(*) from public.town_shop where kind='wear') || '／furn ' || (select count(*) from public.town_shop where kind='furn') || '／place 22／npc 18；總=' || ((j::jsonb)->>'tot') || E'\n';
  -- 2) 讀取層 col 已得 5（c01 c02 k01 p01 cafemug）；回填：place 已得 cafe、park、office（3）；npc traveler（1）
  -- 3) hook：eat、特餐、地點
  ra := public.town_goal_hook((select p from public.town_residents p where p.id=a), 'act', 'eat');
  ra.place := 'casino'; ra := public.town_goal_hook(ra, 'fac', 'special');
  rep := rep || 'hook 後 dx=' || (ra.items->'dx')::text || E'\n';
  update public.town_residents set items = ra.items where id = a;
  -- 4) mark：合法、非法、冪等
  j := public.town_dex(a,'x','mark','n:cafe'); rep := rep || 'mark 合法=' || j::text || E'\n';
  j := public.town_dex(a,'x','mark','n:cafe');
  begin perform public.town_dex(a,'x','mark','n:hacker'); rep := rep || 'mark 非法：沒擋（錯）' || E'\n'; exception when others then rep := rep || 'mark 非法被擋：' || sqlerrm || E'\n'; end;
  begin perform public.town_dex(a,'x','mark','p:casino'); rep := rep || 'mark p：沒擋（錯）' || E'\n'; exception when others then rep := rep || 'mark p 被擋' || E'\n'; end;
  -- 5) claim 未達標擋住
  begin perform public.town_dex(a,'x','claim','col:50'); rep := rep || 'col:50 未達標沒擋（錯）' || E'\n'; exception when others then rep := rep || 'col:50 未達標被擋：' || sqlerrm || E'\n'; end;
  -- 6) 補滿收藏到 50% 以上再領：領稱號＋零食、重領擋、錢不變、背包滿只給稱號
  update public.town_residents set items = jsonb_set(items, '{cl}', (select jsonb_object_agg(k, 1) from (select 'c' || lpad(g::text,2,'0') k from generate_series(1,24) g union all select 'k' || lpad(g::text,2,'0') from generate_series(1,20) g union all select 'p' || lpad(g::text,2,'0') from generate_series(1,6) g union all select 'cafemug' union all select 'filmfigure') q)) where id = a;
  j := public.town_dex(a,'x','claim','col:50'); rep := rep || 'col:50=' || j::text || E'\n';
  begin perform public.town_dex(a,'x','claim','col:50'); rep := rep || '重領沒擋（錯）' || E'\n'; exception when others then rep := rep || '重領被擋：' || sqlerrm || E'\n'; end;
  update public.town_residents set items = items || '{"snack":99}'::jsonb where id = a;
  j := public.town_dex(a,'x','claim','col:100'); rep := rep || 'col:100（背包滿）=' || j::text || E'\n';
  begin perform public.town_dex(a,'x','claim','all:100'); rep := rep || 'all:100 沒擋（錯）' || E'\n'; exception when others then rep := rep || 'all:100 被擋：' || sqlerrm || E'\n'; end;
  begin perform public.town_dex(a,'x','claim','bogus:50'); rep := rep || 'bogus 沒擋（錯）' || E'\n'; exception when others then rep := rep || 'bogus 被擋：' || sqlerrm || E'\n'; end;
  select * into ra from public.town_residents where id = a;
  rep := rep || '稱號=' || (ra.items->'titles')::text || ' 零食=' || (ra.items->>'snack') || '（應 99）錢=' || ra.money || '（應 5000）' || E'\n';
  -- 7) 乙新手不丟錯
  j := public.town_dex(b,'x','view'); rep := rep || '乙 got=' || ((j::jsonb)->>'got') || E'\n';
  -- 8) 補丁在
  rep := rep || '補丁 hook=' || (position('town_dex_set' in (select prosrc from pg_proc where proname='town_goal_hook' and pronamespace='public'::regnamespace limit 1)) > 0)
    || ' goods=' || (select bool_and(position('town_dex_set' in prosrc) > 0) from pg_proc where proname='town_goods' and pronamespace='public'::regnamespace) || E'\n';
  raise exception 'REPORT %', E'\n' || rep;
end $$;
