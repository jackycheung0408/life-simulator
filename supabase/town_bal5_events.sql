-- 平衡批 5（2026-11-24）：稀有好事件、景氣差隨首富占比加強。要在 town_pool.sql、town_retention.sql、town_econ.sql 之後套用，可重複執行，不含破壞性語句。
-- B 稀有好事件：town_pool 的個人突發（op='luck'）通過原本 50% 判定後，再有 1.5% 變成稀有好事（每人每台灣日最多 1 次，items.rg 記日期）：
--   撿到錢包 +€300／遇到貴人 精力補滿／鄰居請客 飽足 +40 心情 +15（三選一）。仍算在每天 15 個、5 分鐘一次的個人事件額度內。
--   通膨估算：每人每天最多約 +€300 一次、機率低（期望每人每天不到 €10），遠低於每日任務 €2500。就地改 town_pool，找不到錨點整檔失敗、已改過略過。
-- C 景氣差：薪水 90% → 90% − 首富占比超過 50% 的部分 ×25（占比 70% 以上封頂 −5%），所以最低 85%（最多 −15%）；其他事件不變。
--   首富占比用 town_econ 每天結算存的 hist 最後一筆 top，沒有資料就當 0。重建 town_wd_pct（保留午間市集／夜市 +10%）。
do $do$
declare def text; po oid;
  a1 text := E'    if random() >= 0.5 then return json_build_object(''none'', true); end if;\n    eid := public.town_pl_pickA';
begin
  select p.oid into po from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'town_pool' order by length(p.prosrc) desc limit 1;
  def := pg_get_functiondef(po);
  if position('town_bal5_events' in def) > 0 then return; end if;
  if (length(def) - length(replace(def, a1, ''))) <> length(a1) then raise exception 'town_pool 錨點找不到或不唯一，沒有修改'; end if;
  def := replace(def, a1,
    E'    if random() >= 0.5 then return json_build_object(''none'', true); end if;\n'
    || E'    -- town_bal5_events：稀有好事件（1.5%，每人每天最多 1 次）\n'
    || E'    if random() < 0.015 and coalesce(r.items->>''rg'', '''') <> today then\n'
    || E'      declare rk int := 1 + floor(random() * 3)::int; rt text; rm text; rf text;\n'
    || E'      begin\n'
    || E'        if rk = 1 then r.money := r.money + 300; rt := ''撿到錢包''; rm := ''路邊有個沒人認領的錢包，裡面有一點現金。''; rf := ''+€300'';\n'
    || E'        elsif rk = 2 then r.energy := 100; rt := ''遇到貴人''; rm := ''一位路過的長者請你喝了一杯熱茶，整個人精神飽滿。''; rf := ''精力補滿'';\n'
    || E'        else r.hunger := r.hunger + 40; r.fun := r.fun + 15; rt := ''鄰居請客''; rm := ''鄰居硬塞給你一份熱騰騰的點心。''; rf := ''飽足 +40 · 心情 +15''; end if;\n'
    || E'        r.items := jsonb_set(jsonb_set(r.items, ''{rg}'', to_jsonb(today)), ''{pl}'', jsonb_build_object(''d'', today, ''n'', n + 1, ''at'', now()));\n'
    || E'        insert into public.town_events(town_id, actor, kind, msg) values (r.town_id, rid, ''luck'', r.name || '' 難得的好運：'' || rt || ''（'' || rf || ''）'');\n'
    || E'        perform public.town_save_r(r);\n'
    || E'        return json_build_object(''id'', 9000 + rk, ''title'', rt, ''msg'', rm, ''fx'', rf);\n'
    || E'      end;\n'
    || E'    end if;\n'
    || E'    eid := public.town_pl_pickA');
  execute def;
end $do$;

create or replace function public.town_wd_pct(tid text) returns integer
 language sql stable security definer set search_path = public
as $$
  select (coalesce((select case w.k when 'boom' then 115
        when 'bust' then 90 - least(5, greatest(0, round((coalesce((select (e.hist->-1->>'top')::numeric from public.town_econ e where e.town_id = tid), 0) - 0.5) * 25)::int))
        when 'blackout' then 95 when 'festival' then 105 else 100 end
    from public.town_worlds w where w.town_id = tid and w.until > now()), 100)
    * case when extract(hour from (now() at time zone 'Asia/Taipei'))::int in (12,13,21,22) then 110 else 100 end / 100)::int
$$;
revoke all on function public.town_wd_pct(text) from public, anon, authenticated;
