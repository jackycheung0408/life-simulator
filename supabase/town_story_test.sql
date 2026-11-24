-- 主線回滾實測：結果在錯誤訊息 REPORT。接在 town_story.sql 之後貼上（整段最後 rollback）。
do $$
declare v_t text := 'ZZSTORY'; v_a bigint; v_b bigint; v_ra public.town_residents; v_rep text := ''; v_j json; v_i int; v_tid text; v_c jsonb; v_k jsonb; v_money int;
begin
  insert into public.town_towns(id,name,invite) values (v_t,'測試鎮','ZZST01') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (v_t,'甲',5000,0,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{"snack":0}'::jsonb) returning id into v_a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (v_t,'乙',100,1,12,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{"works":20,"w":[],"snack":0}'::jsonb) returning id into v_b;
  -- 1) 舊角色缺值：view 不丟錯、沒開始；沒開始不能 talk
  v_j := public.town_story(v_a,'x','view'); v_rep := v_rep || '缺值 view=' || v_j::text || E'\n';
  begin perform public.town_story(v_a,'x','talk','townhall'); v_rep := v_rep || '未開始 talk 沒擋（錯）' || E'\n'; exception when others then v_rep := v_rep || '未開始被擋：' || sqlerrm || E'\n'; end;
  -- 2) 開始
  v_j := public.town_story(v_a,'x','start'); v_rep := v_rep || 'start cur=' || (v_j::jsonb->>'cur') || '（應 1.1）' || E'\n';
  -- 3) 依序：不在市政廳 talk 不算；在市政廳 talk 算；跳關任務（do 在錯誤地點、不是目前任務）不算
  v_j := public.town_story(v_a,'x','talk','townhall'); v_rep := v_rep || '街上 talk hit=' || (v_j::jsonb->>'hit') || '（應 false）' || E'\n';
  update public.town_residents set place='townhall' where id = v_a;
  v_j := public.town_story(v_a,'x','talk','cafe'); v_rep := v_rep || '錯的 NPC hit=' || (v_j::jsonb->>'hit') || '（應 false）' || E'\n';
  v_j := public.town_story(v_a,'x','talk','townhall'); v_rep := v_rep || '市政廳 talk hit=' || (v_j::jsonb->>'hit') || '（應 true）' || E'\n';
  begin perform public.town_story(v_a,'x','talk','hacker'); v_rep := v_rep || '假 NPC 沒擋（錯）' || E'\n'; exception when others then v_rep := v_rep || '假 NPC 被擋' || E'\n'; end;
  -- 4) 1.2 do：hook 在別處不算、在咖啡廳算（用 hook 本人）
  select * into v_ra from public.town_residents where id = v_a; v_ra.place := 'restaurant';
  v_ra := public.town_goal_hook(v_ra, 'act', 'coffee');
  v_rep := v_rep || '餐廳喝咖啡後 t=' || (v_ra.items->'mq'->'t')::text || '（不應有 1.2）' || E'\n';
  v_ra.place := 'cafe'; v_ra := public.town_goal_hook(v_ra, 'fac', 'latte');
  v_rep := v_rep || '咖啡廳 latte 後 t=' || (v_ra.items->'mq'->'t')::text || '（應有 1.2）' || E'\n';
  update public.town_residents set items = v_ra.items where id = v_a;
  -- 1.3 不能略過到 1.4：選擇題現在還不能選
  begin perform public.town_story(v_a,'x','choose','c1','a'); v_rep := v_rep || '跳關 choose 沒擋（錯）' || E'\n'; exception when others then v_rep := v_rep || '跳關 choose 被擋：' || sqlerrm || E'\n'; end;
  begin perform public.town_story(v_a,'x','claim','1'); v_rep := v_rep || '未完成 claim 沒擋（錯）' || E'\n'; exception when others then v_rep := v_rep || '未完成 claim 被擋：' || sqlerrm || E'\n'; end;
  select * into v_ra from public.town_residents where id = v_a; v_ra.place := 'restaurant';
  v_ra := public.town_goal_hook(v_ra, 'act', 'dine'); update public.town_residents set items = v_ra.items where id = v_a;
  -- 1.4 要在家才能選；選項要合法
  begin perform public.town_story(v_a,'x','choose','c1','a'); v_rep := v_rep || '不在家 choose 沒擋（錯）' || E'\n'; exception when others then v_rep := v_rep || '不在家被擋：' || sqlerrm || E'\n'; end;
  update public.town_residents set place = 'home:' || v_a where id = v_a;
  begin perform public.town_story(v_a,'x','choose','c1','z'); v_rep := v_rep || '非法選項沒擋（錯）' || E'\n'; exception when others then v_rep := v_rep || '非法選項被擋' || E'\n'; end;
  v_j := public.town_story(v_a,'x','choose','c1','b'); v_rep := v_rep || 'choose c1=b ' || v_j::text || E'\n';
  -- 5) claim：稱號、零食、錢不變、重領擋
  v_j := public.town_story(v_a,'x','claim','1'); v_rep := v_rep || 'claim 1=' || v_j::text || E'\n';
  begin perform public.town_story(v_a,'x','claim','1'); v_rep := v_rep || '重領沒擋（錯）' || E'\n'; exception when others then v_rep := v_rep || '重領被擋：' || sqlerrm || E'\n'; end;
  select * into v_ra from public.town_residents where id = v_a;
  v_rep := v_rep || '稱號=' || (v_ra.items->'titles')::text || ' 零食=' || (v_ra.items->>'snack') || '（應 1）錢=' || v_ra.money || '（應 5000）ch=' || (v_ra.items->'mq'->>'ch') || '（應 2）' || E'\n';
  -- 6) 暫停：暫停中 advance 被擋、hook 不推進；繼續
  v_j := public.town_story(v_a,'x','pause');
  begin perform public.town_story(v_a,'x','advance'); v_rep := v_rep || '暫停 advance 沒擋（錯）' || E'\n'; exception when others then v_rep := v_rep || '暫停被擋：' || sqlerrm || E'\n'; end;
  v_j := public.town_story(v_a,'x','start'); v_rep := v_rep || '繼續 p=' || ((v_j::jsonb)->'mq'->>'p') || '（應 0）' || E'\n';
  -- 7) 第 2 章 at 任務與時段：2.1 plaza
  v_j := public.town_story(v_a,'x','advance'); v_rep := v_rep || '在家 advance hit=' || (v_j::jsonb->>'hit') || '（應 false）' || E'\n';
  update public.town_residents set place = 'plaza' where id = v_a;
  v_j := public.town_story(v_a,'x','advance'); v_rep := v_rep || '廣場 advance hit=' || (v_j::jsonb->>'hit') || ' tid=' || (v_j::jsonb->>'tid') || '（應 true 2.1）' || E'\n';
  -- 8) 乙（works=20）逐章走完：直接把每章的任務標完，驗每章 claim、造型 3/6/8、第 8 章三結局
  v_j := public.town_story(v_b,'x','start');
  for v_c in select e from jsonb_array_elements(public.town_story_def()) e order by (e->>'id')::int loop
    select * into v_ra from public.town_residents where id = v_b;
    for v_k in select e from jsonb_array_elements(v_c->'tk') e loop
      v_ra.items := public.town_story_mark(v_ra.items, v_k->>'id', v_k->>'k');
    end loop;
    update public.town_residents set items = v_ra.items where id = v_b;
    v_j := public.town_story(v_b,'x','claim', v_c->>'id');
    v_rep := v_rep || '章' || (v_c->>'id') || ' ' || (v_j::jsonb->>'got') || E'\n';
  end loop;
  select * into v_ra from public.town_residents where id = v_b;
  v_rep := v_rep || '乙 全通：ch=' || (v_ra.items->'mq'->>'ch') || '（應 9）n=' || (v_ra.items->'mq'->>'n') || ' 造型=' || (v_ra.items->'w')::text || '（應 mq3 mq6 mq8）零食=' || (v_ra.items->>'snack') || '（應 8）錢=' || v_ra.money || '（應 100）' || E'\n';
  -- 第 8 章結局：先選 a（透過 choose；這裡 c8 還沒選，任務已標完所以走額外分支前先寫 c）
  update public.town_residents set items = jsonb_set(items, '{mq,c}', '{"c8":"a"}'::jsonb) where id = v_b;
  v_j := public.town_story(v_b,'x','choose','c8','b'); v_rep := v_rep || '結局 b=' || v_j::text || E'\n';
  begin perform public.town_story(v_b,'x','choose','c8','b'); v_rep := v_rep || '重複結局沒擋（錯）' || E'\n'; exception when others then v_rep := v_rep || '重複結局被擋' || E'\n'; end;
  v_j := public.town_story(v_b,'x','choose','c8','c');
  select * into v_ra from public.town_residents where id = v_b;
  v_rep := v_rep || '乙 en=' || (v_ra.items->'mq'->>'en') || ' 稱號=' || (v_ra.items->'titles')::text || E'\n';
  -- 9) 成就 81～86 在清單、值讀得到
  v_j := public.town_ach(v_b,'x','view');
  v_rep := v_rep || '成就 81=' || (select e::text from jsonb_array_elements((v_j::jsonb)->'list') e where (e->>'id')::int = 81) || E'\n';
  v_rep := v_rep || '成就總數=' || jsonb_array_length((v_j::jsonb)->'list') || '（應 86）' || E'\n';
  -- 10) 章節資料：8 章、每章 3～5 任務、最後一個是選擇題
  v_rep := v_rep || '章數=' || jsonb_array_length(public.town_story_def()) || ' 任務數=' || (select sum(jsonb_array_length(e->'tk')) from jsonb_array_elements(public.town_story_def()) e) || E'\n';
  -- 11) 補丁在
  v_rep := v_rep || '補丁 hook=' || (position('town_story_hook' in (select prosrc from pg_proc where proname='town_goal_hook' and pronamespace='public'::regnamespace limit 1)) > 0)
    || ' goods=' || (select bool_and(position('town_story_hook' in prosrc) > 0) from pg_proc where proname='town_goods' and pronamespace='public'::regnamespace) || E'\n';
  raise exception 'REPORT %', E'\n' || v_rep;
end $$;
