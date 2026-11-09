-- 叫醒實測：接在 town.sql 之後執行，結果在錯誤訊息 REPORT，整段 rollback（測試鎮，不碰真人）
-- 檢查：1) 朋友睡著在屋裡，叫醒成功／叫不醒；2) 叫不醒只寫 wakefail（不鎖 1 小時），3 分鐘內再叫被擋、3 分鐘後可再試；
--       3) 成功叫醒寫 wakeup，之後 1 小時內不能再叫；4) 朋友醒著、朋友在門口、自己不在他家，各自被擋
do $$
declare cr json; jn json; ra bigint; rb bigint; tid text; rep text := ''; i int; ok_n int := 0; fail_n int := 0; r1 public.town_residents;
begin
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  cr := public.town_create('ZZWK','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  jn := public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'); rb := (jn->>'resident_id')::bigint;
  -- 乙睡在自己家（屋裡），精力 0 → 叫醒失敗機率 70%；甲站在乙家
  update public.town_residents set place='home:'||ra, sleeping=false, energy=90, hunger=90, fun=90, hygiene=90, bladder=90, items='{}'::jsonb, seen_at=now(), updated_at=now() where id=ra;
  update public.town_residents set place='home:'||ra, items='{}'::jsonb where id=ra;
  update public.town_residents set place='home:'||rb, sleeping=true, energy=0, hunger=90, fun=90, hygiene=90, bladder=90, items='{}'::jsonb, seen_at=now(), updated_at=now() where id=rb;
  update public.town_residents set place='home:'||rb, items='{}'::jsonb, energy=90, sleeping=false where id=ra;
  -- 1) 連續叫：每次叫完把乙設回睡著、把事件時間往前推，模擬 40 次，看成功與失敗都寫對事件
  for i in 1..40 loop
    delete from public.town_events where actor=ra and target=rb and kind in ('wakeup','wakefail');
    update public.town_residents set sleeping=true, energy=0, seen_at=now(), updated_at=now() where id=rb;
    perform public.town_act(ra,'1234','wakeup',target:=rb);
    select * into r1 from public.town_residents where id=rb;
    if r1.sleeping then fail_n := fail_n + 1; else ok_n := ok_n + 1; end if;
  end loop;
  rep := rep||'40 次叫醒（精力 0）：成功 '||ok_n||'、失敗 '||fail_n||'（期望約 30%／70%）'||E'\n';
  -- 2) 叫不醒的那次只寫 wakefail
  loop
    delete from public.town_events where actor=ra and target=rb and kind in ('wakeup','wakefail');
    update public.town_residents set sleeping=true, energy=0, seen_at=now(), updated_at=now() where id=rb;
    perform public.town_act(ra,'1234','wakeup',target:=rb);
    select * into r1 from public.town_residents where id=rb;
    exit when r1.sleeping;
  end loop;
  rep := rep||'失敗後：wakefail='||(select count(*) from public.town_events where actor=ra and target=rb and kind='wakefail')||' wakeup='||(select count(*) from public.town_events where actor=ra and target=rb and kind='wakeup')||'（期望 1／0）'||E'\n';
  -- 3 分鐘內再叫：被擋
  begin perform public.town_act(ra,'1234','wakeup',target:=rb); rep := rep||'3 分鐘內再叫：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'3 分鐘內再叫：'||sqlerrm||E'\n'; end;
  -- 4 分鐘前的失敗：可以再試（不鎖 1 小時）
  update public.town_events set at = now() - interval '4 minutes' where actor=ra and target=rb and kind='wakefail';
  begin perform public.town_act(ra,'1234','wakeup',target:=rb); rep := rep||'4 分鐘後再叫：可以（對）'||E'\n'; exception when others then rep := rep||'4 分鐘後再叫：被擋 '||sqlerrm||'（錯）'||E'\n'; end;
  -- 成功叫醒後 1 小時內不能再叫：把精力設 100 讓成功機率 75%，叫到成功為止
  delete from public.town_events where actor=ra and target=rb and kind in ('wakeup','wakefail');
  for i in 1..30 loop
    update public.town_residents set sleeping=true, energy=100, seen_at=now(), updated_at=now() where id=rb;
    delete from public.town_events where actor=ra and target=rb and kind='wakefail';
    perform public.town_act(ra,'1234','wakeup',target:=rb);
    select * into r1 from public.town_residents where id=rb;
    exit when not r1.sleeping;
  end loop;
  rep := rep||'成功後：wakeup='||(select count(*) from public.town_events where actor=ra and target=rb and kind='wakeup')||'（期望 1）'||E'\n';
  update public.town_residents set sleeping=true where id=rb;
  begin perform public.town_act(ra,'1234','wakeup',target:=rb); rep := rep||'成功後 1 小時內再叫：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'成功後 1 小時內再叫：'||sqlerrm||E'\n'; end;
  -- 朋友醒著
  delete from public.town_events where actor=ra and target=rb and kind in ('wakeup','wakefail');
  update public.town_residents set sleeping=false where id=rb;
  begin perform public.town_act(ra,'1234','wakeup',target:=rb); rep := rep||'朋友醒著：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'朋友醒著：'||sqlerrm||E'\n'; end;
  -- 朋友在門口（dr=1）睡著：不在屋裡，叫不到
  update public.town_residents set sleeping=true, items=jsonb_build_object('dr',1) where id=rb;
  begin perform public.town_act(ra,'1234','wakeup',target:=rb); rep := rep||'朋友在門口睡著：沒被擋（要看實際規則）'||E'\n'; exception when others then rep := rep||'朋友在門口睡著：'||sqlerrm||E'\n'; end;
  -- 自己不在他家
  update public.town_residents set sleeping=true, items='{}'::jsonb where id=rb;
  update public.town_residents set place='plaza' where id=ra;
  begin perform public.town_act(ra,'1234','wakeup',target:=rb); rep := rep||'自己不在他家：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'自己不在他家：'||sqlerrm||E'\n'; end;
  raise exception E'REPORT\n%', rep;
end $$;
