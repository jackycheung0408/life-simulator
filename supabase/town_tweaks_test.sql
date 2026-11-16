-- 小調整實測（喪屍豬、取消冷卻的防印鈔機）：接在 town.sql、town_social.sql、town_fi.sql、town_fac.sql、town_tweaks.sql 之後執行，結果在錯誤訊息 REPORT，整段 rollback（測試鎮，不碰真人）
-- 檢查：1) 白天沒有喪屍豬、夜間刷出；2) 碰到的人精力 −8 心情 −8 清潔 −10、60 秒內不重複、錢不變；3) 睡覺、在店裡、被關著的人不會被打；
--       4) 打 3 下倒下、獎勵 €20～60、每天上限 600、35% 掉生豬肉；5) 超市賣生豬肉 €30；6) 打工沒有冷卻（連做 3 次）；7) 精力補充每日上限 200（咖啡）；
--       8) 屠宰場一天最多 3 次；9) 任務獎金 €500／全勤 +€1000
do $$
declare cr json; jn json; ra bigint; rb bigint; tid text; rep text := ''; i int; j json; r1 public.town_residents; r2 public.town_residents; m0 int; k int := 0; kills int := 0; pork int := 0; zid bigint; n int;
begin
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  cr := public.town_create('ZZTW','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  jn := public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'); rb := (jn->>'resident_id')::bigint;
  update public.town_residents set place='street', x=20, y=7, sleeping=false, energy=90, hunger=90, fun=90, hygiene=90, bladder=90, money=1000, items='{}'::jsonb, seen_at=now(), updated_at=now() where id in (ra, rb);
  -- 1) 白天
  perform set_config('town.hour', '12', true);
  j := public.town_zombie(ra,'1234','poll'); rep := rep||'白天 12 點：night='||(j->>'night')||' 隻數='||json_array_length(j->'z')||'（期望 false／0）'||E'\n';
  -- 夜間刷出
  perform set_config('town.hour', '22', true);
  j := public.town_zombie(ra,'1234','poll'); rep := rep||'夜間 22 點第一次：night='||(j->>'night')||' 隻數='||json_array_length(j->'z')||'（期望 true／1）'||E'\n';
  -- 2) 把牠放在甲旁邊
  select id into zid from public.town_zombies where town_id = tid limit 1;
  update public.town_zombies set x=20.5, y=7, moved=now() where id = zid;
  update public.town_residents set place='cafe', items=jsonb_set(items,'{fi}','"cafe"') where id = rb;  -- 乙在店裡：不會被打
  j := public.town_zombie(ra,'1234','poll'); select * into r1 from public.town_residents where id = ra; select * into r2 from public.town_residents where id = rb;
  rep := rep||'被碰到：hit='||(j->>'hit')||' 甲精力 '||round(r1.energy::numeric)||' 心情 '||round(r1.fun::numeric)||' 清潔 '||round(r1.hygiene::numeric)||' 錢 '||r1.money||'（期望 true／82／82／80／1000）；乙在店裡精力 '||round(r2.energy::numeric)||'（期望 90）'||E'\n';
  j := public.town_zombie(ra,'1234','poll'); select * into r1 from public.town_residents where id = ra;
  rep := rep||'60 秒內再碰：精力 '||round(r1.energy::numeric)||'（期望還是 82）hit='||(j->>'hit')||E'\n';
  -- 3) 睡覺與被關著
  update public.town_residents set energy=90, sleeping=true, items='{}'::jsonb where id = ra;
  update public.town_zombies set x=20, y=7, moved=now() where id = zid;
  perform public.town_zombie(rb,'1234','poll'); select * into r1 from public.town_residents where id = ra;
  rep := rep||'睡著的甲：精力 '||round(r1.energy::numeric)||'（期望 90 沒被打）'||E'\n';
  update public.town_residents set sleeping=false, energy=90, items=jsonb_build_object('jl',(now()+interval '1 hour')::text) where id = ra;
  update public.town_zombies set x=20, y=7, moved=now() where id = zid;
  perform public.town_zombie(rb,'1234','poll'); select * into r1 from public.town_residents where id = ra;
  rep := rep||'被關著的甲：精力 '||round(r1.energy::numeric)||'（期望 90 沒被打）'||E'\n';
  -- 4) 打倒：每隻 3 下，統計 30 隻的獎勵與掉落；甲站在 20,7 乙在店裡
  update public.town_residents set energy=100, items='{}'::jsonb, money=1000 where id = ra;
  for i in 1..30 loop
    delete from public.town_zombies where town_id = tid; insert into public.town_zombies(town_id,x,y,hp) values (tid, 20, 7, 3) returning id into zid;
    update public.town_residents set energy=100 where id = ra;
    for k in 1..3 loop begin j := public.town_zombie(ra,'1234','hit',zid); if (j->>'killed')::boolean then kills := kills + 1; end if; exception when others then rep := rep||'打時出錯：'||sqlerrm||E'\n'; exit; end; end loop;
  end loop;
  select * into r1 from public.town_residents where id = ra; pork := coalesce((r1.items->>'zp')::int,0);
  rep := rep||'打倒 30 隻：倒下 '||kills||' 隻，拿到 €'||(r1.money-1000)||'（每隻 20～60 平均 40，期望約 1200 但每天上限 600 → 期望 600），生豬肉 '||pork||' 塊（期望約 10 塊）'||E'\n';
  rep := rep||'今天獎勵 zk.m='||coalesce(r1.items#>>'{zk,m}','無')||'（期望 ≤ 600）'||E'\n';
  -- 5) 賣生豬肉
  update public.town_residents set place='market', items=jsonb_set(items,'{zp}','2'::jsonb), money=100 where id = ra;
  j := public.town_zombie(ra,'1234','sell'); select * into r1 from public.town_residents where id = ra;
  rep := rep||'賣 2 塊豬肉：錢 '||r1.money||'（期望 160）zp='||coalesce(r1.items->>'zp','無')||E'\n';
  begin perform public.town_zombie(ra,'1234','sell'); rep := rep||'沒有豬肉再賣：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'沒有豬肉再賣：'||sqlerrm||E'\n'; end;
  -- 6) 打工沒有冷卻
  update public.town_residents set place='office', x=30, y=6, energy=100, hunger=90, money=1000, items='{}'::jsonb, sleeping=false where id = ra;
  n := 0; for i in 1..3 loop begin perform public.town_act(ra,'1234','work'); n := n + 1; exception when others then rep := rep||'打工第 '||i||' 次被擋：'||sqlerrm||E'\n'; end; end loop;
  select * into r1 from public.town_residents where id = ra; rep := rep||'連打 3 次工：成功 '||n||'（期望 3），錢 '||r1.money||E'\n';
  -- 7) 精力補充上限（咖啡廳，每杯 +50）
  update public.town_residents set place='cafe', x=38, y=5, energy=0, money=100000, items='{}'::jsonb where id = ra; n := 0;
  for i in 1..8 loop begin perform public.town_act(ra,'1234','coffee'); n := n + 1; update public.town_residents set energy=0 where id = ra; exception when others then rep := rep||'第 '||i||' 杯：'||sqlerrm||E'\n'; exit; end; end loop;
  select * into r1 from public.town_residents where id = ra; rep := rep||'咖啡連喝（每次把精力歸零）：喝了 '||n||' 杯，ec.n='||coalesce(r1.items#>>'{ec,n}','無')||'（期望第 5 杯被擋，4 杯 = 200）'||E'\n';
  -- 8) 屠宰場一天 3 次
  update public.town_residents set place='slaughter', x=53, y=14, energy=100, money=2000, items='{}'::jsonb where id = ra; n := 0;
  for i in 1..5 loop begin perform public.town_act(ra,'1234','sneak'); n := n + 1; update public.town_residents set energy=100, place='slaughter', x=53, y=14 where id = ra; exception when others then rep := rep||'屠宰場第 '||i||' 次：'||sqlerrm||E'\n'; update public.town_residents set place='slaughter', x=53, y=14, energy=100 where id = ra; end; end loop;
  rep := rep||'屠宰場 5 次嘗試：成功進行 '||n||' 次（期望 3；被打昏或抓到不影響次數）'||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;
