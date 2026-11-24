-- town_fix_rest.sql 回滾實測：結果在錯誤訊息 REPORT。接在 town_fix_rest.sql 之後貼上。
-- 預期：垃圾桶第 4 次被擋且訊息清楚、郵筒同、長椅 5 次共 +100 第 6 次被擋、飲水機在額度用完後被擋、
-- 單機：沒開局 26／71 被擋、25／70 可；開局後時間太短被擋、時間夠可；開局只能用一次；新手引導 1、2、4、5 要有事實。
do $$
declare v_t text := 'ZZFXR'; v_a bigint; v_b bigint; v_r public.town_residents; v_rep text := ''; v_i int; v_ok int; v_msg text; v_j json;
begin
  insert into public.town_towns(id,name,invite) values (v_t,'測試鎮','ZZFXR1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items,energy) values (v_t,'甲',1000,0,8,14,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb,0) returning id into v_a;
  -- 垃圾桶 4 次
  v_ok := 0; v_msg := '';
  for v_i in 1..4 loop
    begin perform public.town_act(v_a,'x','obj',null,8,14,null,'trash'); v_ok := v_ok + 1;
    exception when others then v_msg := sqlerrm; end;
  end loop;
  v_rep := v_rep || ' 垃圾桶成功=' || v_ok || '（應 3）第4次=' || v_msg;
  -- 郵筒 4 次
  update public.town_residents set x = 34, y = 5 where id = v_a;
  v_ok := 0; v_msg := '';
  for v_i in 1..4 loop
    begin perform public.town_act(v_a,'x','obj',null,34,5,null,'mailbox'); v_ok := v_ok + 1;
    exception when others then v_msg := sqlerrm; end;
  end loop;
  v_rep := v_rep || ' 郵筒成功=' || v_ok || '（應 3）第4次=' || v_msg;
  -- 長椅 6 次
  update public.town_residents set x = 14, y = 5, energy = 0 where id = v_a;
  v_ok := 0; v_msg := '';
  for v_i in 1..6 loop
    begin perform public.town_act(v_a,'x','obj',null,14,5,null,'bench'); v_ok := v_ok + 1;
    exception when others then v_msg := sqlerrm; end;
  end loop;
  select * into v_r from public.town_residents where id = v_a;
  v_rep := v_rep || ' 長椅成功=' || v_ok || '（應 5）第6次=' || v_msg || ' dc.bench=' || coalesce(v_r.items->'dc'->>'bench','null') || '（應 100）';
  -- 飲水機：額度用完被擋
  update public.town_residents set x = 10, y = 14 where id = v_a;
  begin perform public.town_act(v_a,'x','obj',null,10,14,null,'cooler'); v_rep := v_rep || ' 飲水機=允許(錯)'; exception when others then v_rep := v_rep || ' 飲水機=' || sqlerrm; end;
  -- 單機分數
  update public.town_residents set place = 'plaza' where id = v_a;
  begin perform public.town_score(v_a,'x','whack',26); v_rep := v_rep || ' 無開局whack26=允許(錯)'; exception when others then v_rep := v_rep || ' 無開局whack26=' || sqlerrm; end;
  begin v_j := public.town_score(v_a,'x','whack',25); v_rep := v_rep || ' whack25=' || v_j::text; exception when others then v_rep := v_rep || ' whack25=' || sqlerrm; end;
  begin perform public.town_score(v_a,'x','memory',71); v_rep := v_rep || ' 無開局memory71=允許(錯)'; exception when others then v_rep := v_rep || ' 無開局memory71=' || sqlerrm; end;
  perform public.town_score_start(v_a,'x','whack');
  begin perform public.town_score(v_a,'x','whack',30); v_rep := v_rep || ' 剛開局whack30=允許(錯)'; exception when others then v_rep := v_rep || ' 剛開局whack30=' || sqlerrm; end;
  perform public.town_score_start(v_a,'x','whack');
  update public.town_residents set items = jsonb_set(items,'{sg,t}', to_jsonb(now() - interval '31 seconds')) where id = v_a;
  begin v_j := public.town_score(v_a,'x','whack',30); v_rep := v_rep || ' 31秒whack30=' || v_j::text; exception when others then v_rep := v_rep || ' 31秒whack30=' || sqlerrm; end;
  begin perform public.town_score(v_a,'x','whack',40); v_rep := v_rep || ' 開局已用whack40=允許(錯)'; exception when others then v_rep := v_rep || ' 開局已用whack40=' || sqlerrm; end;
  perform public.town_score_start(v_a,'x','memory');
  begin perform public.town_score(v_a,'x','memory',100); v_rep := v_rep || ' 剛開局memory100=允許(錯)'; exception when others then v_rep := v_rep || ' 剛開局memory100=' || sqlerrm; end;
  perform public.town_score_start(v_a,'x','memory');
  update public.town_residents set items = jsonb_set(items,'{sg,t}', to_jsonb(now() - interval '10 seconds')) where id = v_a;
  begin v_j := public.town_score(v_a,'x','memory',100); v_rep := v_rep || ' 10秒memory100=' || v_j::text; exception when others then v_rep := v_rep || ' 10秒memory100=' || sqlerrm; end;
  -- 新手引導
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (v_t,'乙',100,1,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into v_b;
  v_rep := v_rep || ' ob1無=' || public.town_onboard(v_b,'x',1)::text || ' ob2無=' || public.town_onboard(v_b,'x',2)::text
        || ' ob4無=' || public.town_onboard(v_b,'x',4)::text || ' ob5無=' || public.town_onboard(v_b,'x',5)::text;
  update public.town_residents set items = items || '{"snack":1}'::jsonb, place = 'cafe', sleeping = true where id = v_b;
  v_rep := v_rep || ' ob1有=' || public.town_onboard(v_b,'x',1)::text || ' ob2有=' || public.town_onboard(v_b,'x',2)::text
        || ' ob5非家睡=' || public.town_onboard(v_b,'x',5)::text;
  update public.town_residents set place = 'home:' || v_b::text where id = v_b;
  v_rep := v_rep || ' ob5家睡=' || public.town_onboard(v_b,'x',5)::text;
  insert into public.town_events(town_id,actor,target,kind,msg) values (v_t,v_b,v_a,'hi','測試');
  v_rep := v_rep || ' ob4互動=' || public.town_onboard(v_b,'x',4)::text;
  select * into v_r from public.town_residents where id = v_b;
  v_rep := v_rep || ' 乙錢=' || v_r.money || '（應 100+100+100+300+300=900）';
  raise exception 'REPORT %', v_rep;
end $$;
