-- 鎮上隨機事件實測：接在 town.sql、town_world.sql 之後執行，最後 rollback，結果在錯誤訊息 REPORT。
-- 檢查：1) 新鎮前 30 分鐘沒事件；2) 事件開始並寫 world 動態；3) 倍率 px／wd；4) 結束後恢復 100 並排下一個；5) luck 每日 10 次與 8 分鐘間隔、錢不為負、不在戶外不觸發。
do $$
declare cr json; ra bigint; tid text; rep text := ''; j json; i int; ek text; pxv int; wdv int; r1 public.town_residents; cnt int := 0; neg boolean := false;
begin
  cr := public.town_create('ZZWD','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  update public.town_residents set place='street', x=20, y=7, sleeping=false, energy=90, hunger=90, fun=50, hygiene=90, bladder=90, money=10, items='{}'::jsonb, seen_at=now(), updated_at=now() where id = ra;
  j := public.town_world(ra,'1234','poll'); rep := rep||'1) 新鎮 poll：ev='||coalesce((j->>'ev'),'null')||'（期望 null）'||E'\n';
  update public.town_worlds set next_at = now() - interval '1 minute' where town_id = tid;
  j := public.town_world(ra,'1234','poll'); rep := rep||'2) 開始：'||(j->'ev')::text||' world 動態 '||(select count(*) from public.town_events where town_id = tid and kind='world')||'（期望 1）'||E'\n';
  foreach ek in array array['market','boom','bust','blackout','festival'] loop
    update public.town_worlds set k = ek, until = now() + interval '1 hour' where town_id = tid;
    pxv := public.town_px(tid, 250); wdv := public.town_wd_pct(tid);
    rep := rep||'3) '||ek||' 餐廳 250 → '||pxv||' 薪水 '||wdv||'%'||E'\n';
  end loop;
  update public.town_worlds set until = now() - interval '1 minute' where town_id = tid;
  rep := rep||'4) 過期後 px '||public.town_px(tid,250)||' wd '||public.town_wd_pct(tid)||'（期望 250／100）';
  j := public.town_world(ra,'1234','poll'); rep := rep||' 結束後 ev='||coalesce(j->>'ev','null')||' next_at 在未來 '||((select next_at from public.town_worlds where town_id = tid) > now() + interval '59 minutes')||E'\n';
  for i in 1..200 loop
    update public.town_residents set items = jsonb_set(items,'{lk,at}', to_jsonb(now() - interval '9 minutes'), true) where id = ra and items ? 'lk';
    j := public.town_world(ra,'1234','luck'); if j->>'msg' is not null then cnt := cnt + 1; end if;
    select * into r1 from public.town_residents where id = ra; if r1.money < 0 then neg := true; end if;
  end loop;
  rep := rep||'5) 200 次呼叫（間隔已放行）觸發 '||cnt||' 次（期望 10，每日上限）；錢曾為負 '||neg||'（期望 false）'||E'\n';
  j := public.town_world(ra,'1234','luck'); rep := rep||'   同一刻再呼叫：'||j::text||'（期望 none）'||E'\n';
  update public.town_residents set place='cafe', items='{}'::jsonb where id = ra;
  j := public.town_world(ra,'1234','luck'); rep := rep||'   在咖啡廳：'||j::text||'（期望 none）'||E'\n';
  delete from public.town_towns where id = tid;
  raise exception E'REPORT\n%', rep;
end $$;
