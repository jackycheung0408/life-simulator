-- 成就數字修復回滾實測：結果在錯誤訊息 REPORT。接在 town_fix_numbers.sql 之後貼上（整段最後 rollback）。
do $$
declare v_t text := 'ZZFIX'; v_a bigint; v_b bigint; v_ra public.town_residents; v_rep text := ''; v_j json; v_l jsonb; v_cnt jsonb;
begin
  insert into public.town_towns(id,name,invite) values (v_t,'測試鎮','ZZFIX1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (v_t,'甲',5000,0,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{"works":40,"jw":{"rafi":100,"cafe":20},"at":{"st":5,"ag":5,"ch":0,"iq":0,"lk":0}}'::jsonb) returning id into v_a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (v_t,'乙',100,1,12,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{"at":{"st":2,"ag":2,"ch":2,"iq":2,"lk":2}}'::jsonb) returning id into v_b;
  -- 1) 門檻與數量
  v_rep := v_rep || '成就數=' || jsonb_array_length(public.town_ach_def()) || '（應 80）' || E'\n';
  select ae into v_l from jsonb_array_elements(public.town_ach_def()) ae where (ae->>'id')::int = 53; v_rep := v_rep || '能力者 th=' || (v_l->>'th') || '（應 [20,28,36]）' || E'\n';
  -- 2) 讀取：worksall＝40+100+20=160；rank＝max(公司2, 拉菲 100→階4, 咖啡 20→階1)=4
  v_j := public.town_ach(v_a,'x','view');
  select ae into v_l from jsonb_array_elements((v_j::jsonb)->'list') ae where (ae->>'id')::int = 1; v_rep := v_rep || '打工達人 v=' || (v_l->>'v') || '（應 160）u=' || (v_l->>'u') || '（應 2）' || E'\n';
  select ae into v_l from jsonb_array_elements((v_j::jsonb)->'list') ae where (ae->>'id')::int = 16; v_rep := v_rep || '升官 v=' || (v_l->>'v') || '（應 4）' || E'\n';
  select ae into v_l from jsonb_array_elements((v_j::jsonb)->'list') ae where (ae->>'id')::int = 53; v_rep := v_rep || '甲能力者(10 點) u=' || (v_l->>'u') || '（應 0）' || E'\n';
  select ae into v_l from jsonb_array_elements((v_j::jsonb)->'list') ae where (ae->>'id')::int = 54; v_rep := v_rep || '甲單項專精(max 5) u=' || (v_l->>'u') || '（應 0）' || E'\n';
  v_j := public.town_ach(v_b,'x','view');
  select ae into v_l from jsonb_array_elements((v_j::jsonb)->'list') ae where (ae->>'id')::int = 77; v_rep := v_rep || '乙全能(min 2) u=' || (v_l->>'u') || '（應 0）' || E'\n';
  -- 3) 事件對應
  v_rep := v_rep || 'ev_k：倒下=' || coalesce(public.town_goal_ev_k('faint','甲 餓到昏倒，在街上倒下了'),'nil') || ' 醒來=' || coalesce(public.town_goal_ev_k('faint','甲 在醫院醒來，付了醫藥費 €1500'),'nil')
    || ' 看診=' || coalesce(public.town_goal_ev_k('hospital','甲 到醫院掛號看診'),'nil') || ' 出院=' || coalesce(public.town_goal_ev_k('hospital','甲 出院了'),'nil')
    || ' 補助=' || coalesce(public.town_goal_ev_k('luck','甲 領到政府今天的生活補助 €600'),'nil') || ' 登入禮=' || coalesce(public.town_goal_ev_k('luck','甲 今天上線，領到每日登入小禮 €100'),'nil')
    || ' 奇遇=' || coalesce(public.town_goal_ev_k('luck','甲 撿到 €50'),'nil') || ' 抓回=' || coalesce(public.town_goal_ev_k('jail','甲 被通緝，在街上被巡警抓回監獄，關 90 分鐘'),'nil')
    || ' 刑滿=' || coalesce(public.town_goal_ev_k('jail','甲 刑期滿了，出獄了'),'nil') || E'\n（應 flt／nil／hsp／nil／nil／nil／luck／jail／nil）' || E'\n';
  -- 4) 觸發器：一次昏倒三則只計 1
  insert into public.town_events(town_id,actor,kind,msg) values (v_t,v_a,'faint','甲 餓到昏倒，在街上倒下了，被送進醫院'),(v_t,v_a,'faint','甲 在醫院醒來，付了醫藥費 €1500'),(v_t,v_a,'faint','甲 出院了（醫藥費車禍當下已結清）');
  v_rep := v_rep || '昏倒三則 flt=' || coalesce((select n from public.town_ach_c where rid=v_a and k='flt'),0) || '（應 1）' || E'\n';
  -- 5) 賭場淨贏：21 點押 1000 → 結算 +500（淨 −500 不算贏）、再押 1000 → 結算 +2500（淨 +1500 算贏）
  perform public.town_goal_casino(v_a, 'bj_start', true, -1000, 1000); perform public.town_goal_casino(v_a, 'bj_stand', false, 500, null);
  v_rep := v_rep || '押1000拿回500：cwin=' || coalesce((select n from public.town_ach_c where rid=v_a and k='cwin'),0) || '（應 0）' || E'\n';
  perform public.town_goal_casino(v_a, 'bj_start', true, -1000, 1000); perform public.town_goal_casino(v_a, 'bj_hit', false, -1000, null); perform public.town_goal_casino(v_a, 'bj_stand', false, 4500, null);
  v_rep := v_rep || '押1000加倍1000拿回4500（淨+2500）：cwin=' || coalesce((select n from public.town_ach_c where rid=v_a and k='cwin'),0) || '（應 1）cw5k=' || coalesce((select n from public.town_ach_c where rid=v_a and k='cw5k'),0) || '（應 0）' || E'\n';
  perform public.town_goal_casino(v_a, 'mn_start', true, -10000, 10000); perform public.town_goal_casino(v_a, 'mn_cash', false, 15000, null);
  perform public.town_goal_casino(v_a, 'slots', true, -100, 100); perform public.town_goal_casino(v_a, 'bacc', true, 120000, 50000);
  select coalesce(jsonb_object_agg(c.k,c.n),'{}') into v_cnt from public.town_ach_c c where c.rid = v_a;
  v_rep := v_rep || 'cwin=' || coalesce(v_cnt->>'cwin','0') || '（應 3）cw5k=' || coalesce(v_cnt->>'cw5k','0') || '（應 2）cw100k=' || coalesce(v_cnt->>'cw100k','0') || '（應 1）cwag=' || coalesce(v_cnt->>'cwag','0') || '（應 62100）cp=' || coalesce(v_cnt->>'cp','0') || '（應 5）' || E'\n';
  -- 6) 回填：重算事件與賭場紀錄、可重複執行、不給錢不給獎
  insert into public.town_casino_log(rid, day, game, rounds, wagered, net) values (v_a, '2026-11-20', 'bj', 3, 3000, -500), (v_a, '2026-11-20', 'slots', 2, 200, -200);
  insert into public.town_events(town_id,actor,kind,msg) values (v_t,v_a,'luck','甲 領到政府今天的生活補助 €600'),(v_t,v_a,'luck','甲 撿到 €50'),(v_t,v_a,'jail','甲 被巡警抓走，關進監獄 1 小時');
  perform public.town_goal_backfill(true);
  select coalesce(jsonb_object_agg(c.k,c.n),'{}') into v_cnt from public.town_ach_c c where c.rid = v_a;
  v_rep := v_rep || '回填後 flt=' || coalesce(v_cnt->>'flt','0') || '（應 1）luck=' || coalesce(v_cnt->>'luck','0') || '（應 1）jail=' || coalesce(v_cnt->>'jail','0') || '（應 1）cp=' || coalesce(v_cnt->>'cp','0') || '（應 5）cwag=' || coalesce(v_cnt->>'cwag','0') || '（應 3200）cp_bj_start=' || coalesce(v_cnt->>'cp_bj_start','0') || '（應 3）cg_slots=' || coalesce(v_cnt->>'cg_slots','0') || '（應 1）cwin=' || coalesce(v_cnt->>'cwin','0') || '（應 0）' || E'\n';
  perform public.town_goal_backfill(true);
  select coalesce(jsonb_object_agg(c.k,c.n),'{}') into v_cnt from public.town_ach_c c where c.rid = v_a;
  v_rep := v_rep || '再跑一次 luck=' || coalesce(v_cnt->>'luck','0') || ' cp=' || coalesce(v_cnt->>'cp','0') || '（冪等：應同上）' || E'\n';
  v_rep := v_rep || '標記已記=' || exists (select 1 from public.town_migrations where id='ach_backfill1') || ' 不 force 再跑回傳=' || public.town_goal_backfill() || '（應 0）' || E'\n';
  select * into v_ra from public.town_residents where id = v_a;
  v_rep := v_rep || '錢=' || v_ra.money || '（應 5000 不變）零食=' || coalesce(v_ra.items->>'snack','nil') || '（應 nil）' || E'\n';
  raise exception E'REPORT\n%', v_rep;
end $$;
