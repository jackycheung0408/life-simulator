-- 取消賭場 3 秒間隔後的回滾實測：結果在錯誤訊息 REPORT。接在 town_casino_nogap.sql 之後貼上（整段最後 raise exception 回滾）。
-- 注意：同一交易內 now() 不前進，所以「同一秒連續呼叫」是真的同一秒；測試不倒回 items.cas.t。
do $$
declare v_t text := 'ZZNGP'; v_a bigint; v_rep text := ''; v_i int; v_g text; v_c text; v_ch0 bigint; v_ch1 bigint; v_ch2 bigint; v_def text;
  v_games text[] := array['wheel','dice','slots','keno','sangong','shiba','pigrace','bacc','niu','cups','scratch','plinko'];
  v_chs text[] := array['red','big',null,'1,2,3,4,5',null,null,'w:1','p',null,'0',null,'mid'];
  v_j int; v_r int; v_w bigint; v_n bigint; v_cp0 bigint; v_cp1 bigint; v_cg1 bigint; v_wag0 bigint; v_wag1 bigint; v_ok int; v_err int; v_mx bigint; v_fund0 bigint; v_fund1 bigint;
  v_x1 jsonb; v_x2 jsonb; v_res jsonb; v_neg boolean := false; v_pend boolean;
begin
  insert into public.town_towns(id,name,invite) values (v_t,'測試鎮','ZZNGP1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items)
    values (v_t,'甲',500,0,10,10,'casino',extensions.crypt('x', extensions.gen_salt('bf', 4)),'{"fi":"casino","cas":{"ch":1000000}}'::jsonb) returning id into v_a;
  -- 0) 靜態：函式已無 3 seconds、town_auth 有 for update 鎖
  select pg_get_functiondef('public.town_casino(bigint,text,text,int,text)'::regprocedure) into v_def;
  v_rep := v_rep || E'\n[0] town_casino 無3秒=' || (position('3 seconds' in v_def) = 0) || ' 標記在=' || (position('nogap_1124' in v_def) > 0) || ' 籌碼檢查還在=' || (position('籌碼不夠' in v_def) > 0);
  select pg_get_functiondef('public.town_auth(bigint,text)'::regprocedure) into v_def;
  v_rep := v_rep || ' town_auth for update=' || (position('for update' in lower(v_def)) > 0);
  -- b) 無狀態遊戲：同一秒連續呼叫 20 次，log 與籌碼守恆
  for v_j in 1..array_length(v_games,1) loop
    v_g := v_games[v_j]; v_c := v_chs[v_j];
    v_ch0 := (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a);
    v_cp0 := coalesce((select n from public.town_ach_c where rid = v_a and k = 'cp'), 0);
    v_wag0 := coalesce((select n from public.town_ach_c where rid = v_a and k = 'cwag'), 0);
    delete from public.town_casino_log where rid = v_a;
    v_ok := 0; v_err := 0;
    for v_i in 1..20 loop
      begin perform public.town_casino(v_a,'x',v_g,50,v_c); v_ok := v_ok + 1;
      exception when others then v_err := v_err + 1; v_rep := v_rep || ' (' || v_g || '錯:' || sqlerrm || ')'; end;
    end loop;
    v_ch1 := (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a);
    v_cp1 := coalesce((select n from public.town_ach_c where rid = v_a and k = 'cp'), 0);
    v_wag1 := coalesce((select n from public.town_ach_c where rid = v_a and k = 'cwag'), 0);
    v_cg1 := coalesce((select n from public.town_ach_c where rid = v_a and k = 'cp_' || v_g), 0);
    v_n := coalesce((select sum(net) from public.town_casino_log where rid = v_a), 0);
    v_rep := v_rep || E'\n[b] ' || v_g || ' 成功' || v_ok || '/20 log局=' || coalesce((select sum(rounds) from public.town_casino_log where rid = v_a), 0)
      || ' 押=' || coalesce((select sum(wagered) from public.town_casino_log where rid = v_a), 0) || '（1000） 淨=' || v_n || ' 籌碼變化=' || (v_ch1 - v_ch0)
      || ' 守恆=' || (v_n = v_ch1 - v_ch0) || ' cp+' || (v_cp1 - v_cp0) || '（20） cwag+' || (v_wag1 - v_wag0) || '（1000） cp_款=' || v_cg1 || ' 籌碼>=0=' || (v_ch1 >= 0);
  end loop;
  -- a) 有狀態遊戲：連續開局兩次
  update public.town_residents set items = (items - 'bj' - 'pj' - 'hlg' - 'mn' - 'cr' - 'cx' - 'dg') || '{"cas":{"ch":1000000}}'::jsonb where id = v_a;
  -- 21 點（天生 21 點直接結束，重試到有進行中的）
  for v_i in 1..30 loop
    update public.town_residents set items = items - 'bj' where id = v_a;
    perform public.town_casino(v_a,'x','bj_start',100,null);
    exit when (select items ? 'bj' from public.town_residents where id = v_a);
  end loop;
  v_x1 := (select items->'bj' from public.town_residents where id = v_a); v_ch0 := (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a);
  begin perform public.town_casino(v_a,'x','bj_start',100,null); v_rep := v_rep || E'\n[a] bj再開局=沒擋'; exception when others then v_rep := v_rep || E'\n[a] bj再開局=擋（' || sqlerrm || '）'; end;
  v_x2 := (select items->'bj' from public.town_residents where id = v_a); v_ch1 := (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a);
  v_rep := v_rep || ' 舊注未變=' || (v_x1 = v_x2) || ' 籌碼不變=' || (v_ch0 = v_ch1);
  update public.town_residents set items = items - 'bj' where id = v_a;
  -- 牌九
  perform public.town_casino(v_a,'x','pj_start',100,null);
  v_x1 := (select items->'pj' from public.town_residents where id = v_a); v_ch0 := (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a);
  begin perform public.town_casino(v_a,'x','pj_start',100,null); v_rep := v_rep || ' pj再開局=沒擋'; exception when others then v_rep := v_rep || ' pj再開局=擋'; end;
  v_rep := v_rep || ' 舊注未變=' || (v_x1 = (select items->'pj' from public.town_residents where id = v_a)) || ' 籌碼不變=' || (v_ch0 = (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a));
  update public.town_residents set items = items - 'pj' where id = v_a;
  -- 比大小
  perform public.town_casino(v_a,'x','hl_start',100,null);
  v_x1 := (select items->'hlg' from public.town_residents where id = v_a); v_ch0 := (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a);
  begin perform public.town_casino(v_a,'x','hl_start',100,null); v_rep := v_rep || ' hl再開局=沒擋'; exception when others then v_rep := v_rep || ' hl再開局=擋'; end;
  v_rep := v_rep || ' 舊注未變=' || (v_x1 = (select items->'hlg' from public.town_residents where id = v_a)) || ' 籌碼不變=' || (v_ch0 = (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a));
  update public.town_residents set items = items - 'hlg' where id = v_a;
  -- 地雷
  perform public.town_casino(v_a,'x','mn_start',100,'3');
  v_x1 := (select items->'mn' from public.town_residents where id = v_a); v_ch0 := (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a);
  begin perform public.town_casino(v_a,'x','mn_start',100,'3'); v_rep := v_rep || E'\n[a] mn再開局=沒擋'; exception when others then v_rep := v_rep || E'\n[a] mn再開局=擋'; end;
  v_rep := v_rep || ' 地雷位置未變=' || (v_x1 = (select items->'mn' from public.town_residents where id = v_a)) || ' 籌碼不變=' || (v_ch0 = (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a));
  update public.town_residents set items = items - 'mn' where id = v_a;
  -- 開寶箱
  perform public.town_casino(v_a,'x','ch_start',100,null);
  v_x1 := (select items->'cx' from public.town_residents where id = v_a); v_ch0 := (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a);
  begin perform public.town_casino(v_a,'x','ch_start',100,null); v_rep := v_rep || ' cx再開局=沒擋'; exception when others then v_rep := v_rep || ' cx再開局=擋'; end;
  v_rep := v_rep || ' 箱子未變=' || (v_x1 = (select items->'cx' from public.town_residents where id = v_a)) || ' 籌碼不變=' || (v_ch0 = (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a));
  update public.town_residents set items = items - 'cx' where id = v_a;
  -- 飛行器：設計是重開覆蓋（舊注已付、新注另扣），確認只留一局、籌碼只會少不會多
  perform public.town_casino(v_a,'x','cr_start',100,null);
  v_ch0 := (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a);
  perform public.town_casino(v_a,'x','cr_start',100,null);
  v_ch1 := (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a);
  v_rep := v_rep || E'\n[a] cr連開兩次 籌碼差=' || (v_ch0 - v_ch1) || '（100，舊注沒退） 只剩一局=' || ((select items->'cr'->>'b' from public.town_residents where id = v_a) = '100');
  update public.town_residents set items = items - 'cr' where id = v_a;
  -- 射龍門：dg_start 不收費，連發兩次籌碼不變；pass 後清掉
  v_ch0 := (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a);
  perform public.town_casino(v_a,'x','dg_start',0,null); perform public.town_casino(v_a,'x','dg_start',0,null);
  v_ch1 := (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a);
  perform public.town_casino(v_a,'x','dg_play',50,'pass');
  v_rep := v_rep || ' dg連發兩次籌碼不變=' || (v_ch0 = v_ch1) || ' pass後清空=' || (not (select items ? 'dg' from public.town_residents where id = v_a));
  -- c) 籌碼不足：連續呼叫不會變負
  update public.town_residents set items = jsonb_set(items - 'bj' - 'pj' - 'hlg' - 'mn' - 'cr' - 'cx' - 'dg', '{cas,ch}', '100') where id = v_a;
  v_ok := 0; v_err := 0; v_neg := false;
  begin perform public.town_casino(v_a,'x','wheel',200,'red'); v_rep := v_rep || E'\n[c] 押200籌碼只有100=沒擋'; exception when others then v_rep := v_rep || E'\n[c] 押200籌碼只有100=擋（' || sqlerrm || '）'; end;
  for v_i in 1..40 loop
    begin perform public.town_casino(v_a,'x','dice',100,'big'); v_ok := v_ok + 1; exception when others then v_err := v_err + 1; end;
    if (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a) < 0 then v_neg := true; end if;
  end loop;
  v_rep := v_rep || ' 連押100 成功' || v_ok || ' 被擋' || v_err || ' 籌碼曾為負=' || v_neg || ' 現有=' || (select (items->'cas'->>'ch')::bigint from public.town_residents where id = v_a) || ' 現金=' || (select money from public.town_residents where id = v_a) || '（500）';
  -- e) 老虎機獎池：預設 99500、每次押 1000 連續 20 次，池子不超過 100000，基金不為負
  update public.town_residents set items = jsonb_set(items, '{cas,ch}', '1000000') where id = v_a;
  insert into public.town_jackpot(town_id, amount) values (v_t, 99500) on conflict (town_id) do update set amount = 99500;
  v_fund0 := (select fund from public.town_towns where id = v_t); v_mx := 0;
  for v_i in 1..20 loop
    perform public.town_casino(v_a,'x','slots',1000,null);
    v_mx := greatest(v_mx, (select amount from public.town_jackpot where town_id = v_t));
  end loop;
  v_fund1 := (select fund from public.town_towns where id = v_t);
  v_rep := v_rep || E'\n[e] 獎池最高=' || v_mx || '（<=100000） 基金 ' || v_fund0 || '→' || v_fund1 || ' 基金不減=' || (v_fund1 >= v_fund0);
  v_rep := v_rep || E'\n[d] 併發：town_auth 的 for update 把同一居民的 town_casino 序列化（見 [0]），多連線同時呼叫不可能讀到同一籌碼量；此檔單連線，無法真的開兩條連線，併發靠程式碼審查。';
  raise exception E'REPORT%', v_rep;
end $$;
