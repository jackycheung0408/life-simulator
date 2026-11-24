-- 賭場修復回滾實測：結果在錯誤訊息 REPORT。接在 town_casino_resume.sql 之後貼上（整段最後 raise exception 回滾）。
-- 走真正入口 town_casino（居民 items.fi='casino'、籌碼在 items.cas.ch）。
do $$
declare v_t text := 'ZZRSM'; v_a bigint; v_rep text := ''; v_g jsonb; v_i int; v_ch bigint; v_w0 bigint; v_w1 bigint; v_pool bigint; v_fund0 bigint; v_fund1 bigint;
begin
  insert into public.town_towns(id,name,invite) values (v_t,'測試鎮','ZZRSM1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items)
    values (v_t,'甲',500,0,10,10,'casino',extensions.crypt('x', extensions.gen_salt('bf', 4)),'{"fi":"casino","cas":{"ch":100000}}'::jsonb) returning id into v_a;
  -- 1) 沒牌局：三個 state 都回 none
  v_rep := v_rep || ' bj無=' || ((public.town_casino(v_a,'x','bj_state',0,null))::jsonb->'game'->>'none') || ' pj無=' || ((public.town_casino(v_a,'x','pj_state',0,null))::jsonb->'game'->>'none') || ' hl無=' || ((public.town_casino(v_a,'x','hl_state',0,null))::jsonb->'game'->>'none') || '（true×3）';
  -- 2) 21 點：開局（天生 21 點會直接結束，重試）→ state 還原 → 再開局被擋、注不變
  for v_i in 1..20 loop
    update public.town_residents set items = items - 'bj' where id = v_a;
    update public.town_residents set items = items #- '{cas,t}' where id = v_a; v_g := (public.town_casino(v_a,'x','bj_start',100,null))::jsonb->'game';
    exit when (v_g->>'done')::boolean is not true;
  end loop;
  v_ch := (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a);
  v_g := (public.town_casino(v_a,'x','bj_state',0,null))::jsonb->'game';
  v_rep := v_rep || ' bj還原手數=' || jsonb_array_length(v_g->'hs') || ' bet=' || (v_g->>'bet') || '（1、100）暗牌洩漏=' || (v_g ? 'h');
  update public.town_residents set items = items #- '{cas,t}' where id = v_a; begin perform public.town_casino(v_a,'x','bj_start',100,null); v_rep := v_rep || ' 再開局=沒擋'; exception when others then v_rep := v_rep || ' 再開局=擋(' || sqlerrm || ')'; end;
  v_rep := v_rep || ' 籌碼不變=' || (v_ch = (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a)) || ' 舊牌局還在=' || ((select items ? 'bj' from public.town_residents where id = v_a));
  -- 3) 分牌後 state 還原兩手、押注 200；wagered 含額外注
  update public.town_residents set items = items || jsonb_build_object('bj', jsonb_build_object('bet',100,'d',jsonb_build_array(106),'h',110,'i',0,'hs',jsonb_build_array(jsonb_build_object('c',jsonb_build_array(108,308),'b',100)))) where id = v_a;
  delete from public.town_casino_log where rid = v_a;
  perform public.town_casino(v_a,'x','bj_split',100,null);
  v_g := (public.town_casino(v_a,'x','bj_state',0,null))::jsonb->'game';
  v_rep := v_rep || ' 分牌後手數=' || jsonb_array_length(v_g->'hs') || ' bet=' || (v_g->>'bet') || '（2、200）';
  v_rep := v_rep || ' log wagered=' || coalesce((select sum(wagered) from public.town_casino_log where rid = v_a and game = 'bj'), 0) || ' rounds=' || coalesce((select sum(rounds) from public.town_casino_log where rid = v_a and game = 'bj'), 0) || '（分牌額外 100、局數 0）';
  -- 4) 牌九：開局 → state → 再開局被擋
  update public.town_residents set items = items - 'bj' - 'pj' where id = v_a;
  update public.town_residents set items = items #- '{cas,t}' where id = v_a; perform public.town_casino(v_a,'x','pj_start',100,null);
  v_g := (public.town_casino(v_a,'x','pj_state',0,null))::jsonb->'game';
  v_rep := v_rep || ' pj還原牌數=' || jsonb_array_length(v_g->'p') || ' bet=' || (v_g->>'bet') || '（4、100）';
  update public.town_residents set items = items #- '{cas,t}' where id = v_a; begin perform public.town_casino(v_a,'x','pj_start',100,null); v_rep := v_rep || ' pj再開局=沒擋'; exception when others then v_rep := v_rep || ' pj再開局=擋'; end;
  -- 5) 比大小
  update public.town_residents set items = items - 'pj' where id = v_a;
  update public.town_residents set items = items #- '{cas,t}' where id = v_a; perform public.town_casino(v_a,'x','hl_start',100,null);
  v_g := (public.town_casino(v_a,'x','hl_state',0,null))::jsonb->'game';
  v_rep := v_rep || ' hl還原card=' || (v_g->>'card') || ' bet=' || (v_g->>'bet') || '（有值、100）';
  update public.town_residents set items = items #- '{cas,t}' where id = v_a; begin perform public.town_casino(v_a,'x','hl_start',100,null); v_rep := v_rep || ' hl再開局=沒擋'; exception when others then v_rep := v_rep || ' hl再開局=擋'; end;
  -- 6) 獎池上限：預設池 150000，拉一次老虎機後池 ≤ 100000、基金增加
  update public.town_residents set items = items - 'hlg' where id = v_a;
  insert into public.town_jackpot(town_id, amount) values (v_t, 150000) on conflict (town_id) do update set amount = 150000;
  select fund into v_fund0 from public.town_towns where id = v_t;
  update public.town_residents set items = jsonb_set(items, '{cas,t}', '"2000-01-01T00:00:00Z"'::jsonb) where id = v_a;
  update public.town_residents set items = items #- '{cas,t}' where id = v_a; perform public.town_casino(v_a,'x','slots',50,null);
  select amount into v_pool from public.town_jackpot where town_id = v_t; select fund into v_fund1 from public.town_towns where id = v_t;
  v_rep := v_rep || ' 獎池=' || v_pool || '（≤100000，若中獎會更少） 基金+=' || (v_fund1 - v_fund0) || '（約 50000）';
  select money into v_w1 from public.town_residents where id = v_a; v_rep := v_rep || ' 現金=' || v_w1 || '（500 不變）';
  raise exception 'REPORT:%', v_rep;
end $$;
