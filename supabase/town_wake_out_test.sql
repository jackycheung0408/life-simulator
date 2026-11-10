-- 門外叫醒實測：接在 town.sql、town_wake_out.sql 之後執行，結果在錯誤訊息 REPORT，整段 rollback（測試鎮，不碰真人）
-- 檢查：1) 40 次叫醒成功率約 30%（精力 0）；2) 成功後乙 dr=1、醒著、精力不補、有 wo；3) 失敗只寫 wakefail、3 分鐘內被擋、4 分鐘後可再試；
--       4) 成功後 1 小時內不能再叫；5) 乙醒著、乙已在門口、甲不在他家門口、甲在他家裡（vin）、乙昏倒，各自被擋；6) 成功後門口兩人可以擊掌
do $$
declare cr json; jn json; ra bigint; rb bigint; tid text; rep text := ''; i int; ok_n int := 0; fail_n int := 0; r1 public.town_residents; j json; en0 real;
begin
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  cr := public.town_create('ZZWO','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  jn := public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'); rb := (jn->>'resident_id')::bigint;
  update public.town_residents set place='home:'||rb, sleeping=false, energy=90, hunger=90, fun=90, hygiene=90, bladder=90, items='{}'::jsonb, seen_at=now(), updated_at=now() where id=ra;
  update public.town_residents set place='home:'||rb, sleeping=true, energy=0, hunger=90, fun=90, hygiene=90, bladder=90, items='{}'::jsonb, seen_at=now(), updated_at=now() where id=rb;
  -- 1) 40 次
  for i in 1..40 loop
    delete from public.town_events where actor=ra and target=rb and kind in ('wakeup','wakefail');
    update public.town_residents set sleeping=true, energy=0, items='{}'::jsonb, fun=90, seen_at=now(), updated_at=now() where id=rb;
    j := public.town_wake_out(ra,'1234',rb);
    if (j->>'ok')::boolean then ok_n := ok_n + 1; else fail_n := fail_n + 1; end if;
  end loop;
  rep := rep||'40 次門外叫醒（精力 0）：成功 '||ok_n||'、失敗 '||fail_n||'（期望約 12／28，成功率 30%）'||E'\n';
  -- 2) 成功後狀態
  loop
    delete from public.town_events where actor=ra and target=rb and kind in ('wakeup','wakefail');
    update public.town_residents set sleeping=true, energy=20, items='{}'::jsonb, fun=90, seen_at=now(), updated_at=now() where id=rb;
    j := public.town_wake_out(ra,'1234',rb);
    exit when (j->>'ok')::boolean;
  end loop;
  select * into r1 from public.town_residents where id=rb;
  rep := rep||'成功後：sleeping='||r1.sleeping||' dr='||coalesce(r1.items->>'dr','無')||' wo.f='||coalesce(r1.items#>>'{wo,f}','無')||' 精力='||round(r1.energy::numeric)||'（期望 false／1／甲／約 20 沒補）心情='||round(r1.fun::numeric)||'（期望約 87）'||E'\n';
  -- 他離線很久（seen_at 兩小時前）：叫醒前先把 seen_at 設舊，叫醒後要被重設成現在，過一次 tick 還是醒著、站在門口
  update public.town_residents set sleeping=true, energy=60, items='{}'::jsonb, fun=90, seen_at=now()-interval '2 hours', updated_at=now()-interval '2 hours' where id=rb;
  loop
    delete from public.town_events where actor=ra and target=rb and kind in ('wakeup','wakefail');
    update public.town_residents set sleeping=true, items='{}'::jsonb, seen_at=now()-interval '2 hours', updated_at=now()-interval '2 hours' where id=rb;
    j := public.town_wake_out(ra,'1234',rb);
    exit when (j->>'ok')::boolean;
  end loop;
  select * into r1 from public.town_residents where id = rb;
  update public.town_residents set updated_at = now() - interval '5 minutes' where id=rb;
  r1 := public.town_tick((select t from public.town_residents t where id = rb));
  rep := rep||'離線很久的人叫醒後再結算一次：sleeping='||r1.sleeping||' place='||r1.place||' dr='||coalesce(r1.items->>'dr','無')||'（期望 false home:乙 1，不會被送回屋裡睡）'||E'\n';
  rep := rep||'事件：wakeup='||(select count(*) from public.town_events where actor=ra and target=rb and kind='wakeup')||'（期望 1）'||E'\n';
  -- 3) 失敗只寫 wakefail
  loop
    delete from public.town_events where actor=ra and target=rb and kind in ('wakeup','wakefail');
    update public.town_residents set sleeping=true, energy=0, items='{}'::jsonb, seen_at=now(), updated_at=now() where id=rb;
    j := public.town_wake_out(ra,'1234',rb);
    exit when not (j->>'ok')::boolean;
  end loop;
  rep := rep||'失敗後：wakefail='||(select count(*) from public.town_events where actor=ra and target=rb and kind='wakefail')||' wakeup='||(select count(*) from public.town_events where actor=ra and target=rb and kind='wakeup')||'（期望 1／0）'||E'\n';
  begin perform public.town_wake_out(ra,'1234',rb); rep := rep||'3 分鐘內再叫：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'3 分鐘內再叫：'||sqlerrm||E'\n'; end;
  update public.town_events set at = now() - interval '4 minutes' where actor=ra and target=rb and kind='wakefail';
  begin perform public.town_wake_out(ra,'1234',rb); rep := rep||'4 分鐘後再叫：可以（對）'||E'\n'; exception when others then rep := rep||'4 分鐘後再叫：被擋 '||sqlerrm||'（錯）'||E'\n'; end;
  -- 4) 成功後 1 小時內不能再叫
  delete from public.town_events where actor=ra and target=rb and kind in ('wakeup','wakefail');
  loop
    update public.town_residents set sleeping=true, energy=100, items='{}'::jsonb, seen_at=now(), updated_at=now() where id=rb;
    delete from public.town_events where actor=ra and target=rb and kind='wakefail';
    j := public.town_wake_out(ra,'1234',rb);
    exit when (j->>'ok')::boolean;
  end loop;
  update public.town_residents set sleeping=true, items='{}'::jsonb where id=rb;
  begin perform public.town_wake_out(ra,'1234',rb); rep := rep||'成功後 1 小時內再叫：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'成功後 1 小時內再叫：'||sqlerrm||E'\n'; end;
  -- 5) 各種擋
  delete from public.town_events where actor=ra and target=rb and kind in ('wakeup','wakefail');
  update public.town_residents set sleeping=false, items='{}'::jsonb where id=rb;
  begin perform public.town_wake_out(ra,'1234',rb); rep := rep||'乙醒著：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'乙醒著：'||sqlerrm||E'\n'; end;
  update public.town_residents set sleeping=true, items=jsonb_build_object('dr',1) where id=rb;
  begin perform public.town_wake_out(ra,'1234',rb); rep := rep||'乙已在門口：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'乙已在門口：'||sqlerrm||E'\n'; end;
  update public.town_residents set sleeping=true, items=jsonb_build_object('faint', (now()+interval '1 hour')::text, 'hosp', 1) where id=rb;
  begin perform public.town_wake_out(ra,'1234',rb); rep := rep||'乙昏倒／住院：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'乙昏倒／住院：'||sqlerrm||E'\n'; end;
  update public.town_residents set sleeping=true, items='{}'::jsonb where id=rb;
  update public.town_residents set items=jsonb_build_object('fv', rb) where id=ra;
  begin perform public.town_wake_out(ra,'1234',rb); rep := rep||'甲已在他家裡：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'甲已在他家裡：'||sqlerrm||E'\n'; end;
  update public.town_residents set items='{}'::jsonb, place='plaza' where id=ra;
  begin perform public.town_wake_out(ra,'1234',rb); rep := rep||'甲不在他家：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'甲不在他家：'||sqlerrm||E'\n'; end;
  -- 6) 成功後門口擊掌
  update public.town_residents set place='home:'||rb, sleeping=false, items='{}'::jsonb, energy=90 where id=ra;
  update public.town_residents set place='home:'||rb, sleeping=false, items=jsonb_build_object('dr',1), energy=90 where id=rb;
  begin perform public.town_act(ra,'1234','greet',target:=rb); rep := rep||'門口擊掌：可以（對）'||E'\n'; exception when others then rep := rep||'門口擊掌：被擋 '||sqlerrm||'（錯）'||E'\n'; end;
  -- 7) 醒著待在屋裡的人（離線）：喊他出來。好感 0 → 九成肯出來
  ok_n := 0; fail_n := 0;
  for i in 1..40 loop
    delete from public.town_events where actor=ra and target=rb and kind in ('callout','calloutfail');
    update public.town_residents set place='home:'||rb, sleeping=false, items='{}'::jsonb, seen_at=now()-interval '2 hours', updated_at=now() where id=rb;
    update public.town_residents set place='home:'||rb, items='{}'::jsonb, sleeping=false where id=ra;
    j := public.town_wake_out(ra,'1234',rb);
    if (j->>'ok')::boolean then ok_n := ok_n + 1; else fail_n := fail_n + 1; end if;
  end loop;
  rep := rep||'喊他出來 40 次（好感 0）：肯 '||ok_n||'、不肯 '||fail_n||'（期望約 36／4）'||E'\n';
  loop
    delete from public.town_events where actor=ra and target=rb and kind in ('callout','calloutfail');
    update public.town_residents set place='home:'||rb, sleeping=false, items='{}'::jsonb, seen_at=now()-interval '2 hours', updated_at=now() where id=rb;
    j := public.town_wake_out(ra,'1234',rb);
    exit when (j->>'ok')::boolean;
  end loop;
  select * into r1 from public.town_residents where id = rb;
  rep := rep||'喊出來後：dr='||coalesce(r1.items->>'dr','無')||' wo.f='||coalesce(r1.items#>>'{wo,f}','無')||' 最後動作 '||round(extract(epoch from (now()-r1.seen_at)))||' 秒前 心情 '||round(r1.fun::numeric)||'（期望 1 甲 約 0 秒前 心情不變 90）'||E'\n';
  begin perform public.town_wake_out(ra,'1234',rb); rep := rep||'已經在門口再喊：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'已經在門口再喊：'||sqlerrm||E'\n'; end;
  update public.town_residents set items='{}'::jsonb where id=rb;
  begin perform public.town_wake_out(ra,'1234',rb); rep := rep||'10 分鐘內再喊：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'10 分鐘內再喊：'||sqlerrm||E'\n'; end;
  -- 不肯出來：寫 calloutfail、只擋 3 分鐘
  delete from public.town_events where actor=ra and target=rb and kind in ('callout','calloutfail');
  insert into public.town_events(town_id,actor,target,kind,msg) values (tid, ra, rb, 'calloutfail', '測試');
  begin perform public.town_wake_out(ra,'1234',rb); rep := rep||'不肯出來後 3 分鐘內再喊：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'不肯出來後 3 分鐘內再喊：'||sqlerrm||E'\n'; end;
  update public.town_events set at = now() - interval '4 minutes' where actor=ra and target=rb and kind='calloutfail';
  begin perform public.town_wake_out(ra,'1234',rb); rep := rep||'4 分鐘後再喊：可以（對）'||E'\n'; exception when others then rep := rep||'4 分鐘後再喊：被擋 '||sqlerrm||'（錯）'||E'\n'; end;
  raise exception E'REPORT\n%', rep;
end $$;
