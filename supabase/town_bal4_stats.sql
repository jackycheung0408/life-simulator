-- 平衡批 4（2026-11-24）：能力屬性。要在 town.sql、town_jail.sql、town_tweaks.sql、town_stats.sql、town_stats2.sql 之後套用，可重複執行，不含破壞性語句。
-- B 上限 5 → 8：town_at 夾 0～8（暫時減益不變）、town_train 練到 8、town_stats 升級點可加到 8。開局 10 點仍每項 0～5；訓練進度公式 6+3×點數 不變，每天合計仍 <= 8 進度。
-- A 其他屬性實質效果（所有效果都對「自己」的有利，沒有給錢）：
--   力量：被砍倒地時精力損失 35 → 35−1.5×力量（8 點 23）；被扁心情 −12 → −max(4, 12−力量)。
--   敏捷：喪屍豬碰到你的機率 −4%／點（上限 32%；每分鐘一次判定，同一分鐘結果固定，不會連按重試）。
--   魅力：送禮對方心情 +20 → +20+2×魅力（好感本來就乘魅力）；喝咖啡精力 +50 → +50+2×魅力（仍受每日補精力上限）。
-- C 洗點 $5000：RPC town_stats_reset，付 $5000（一半進鎮基金、一半銷毀），能力全部歸零，開局 10 點與升級點數重新分配（訓練得到的點數一併重來）；不可為負、錢不夠擋。
-- 就地改函式（pg_get_functiondef），找不到錨點整檔失敗、已改過略過。
create or replace function public.town_at(r public.town_residents, k text) returns int language sql stable as $$
  select greatest(0, least(8, greatest(0, coalesce((r.items->'at'->>k)::int, 0))) - case k
    when 'st' then case when r.bruised_until > now() then 1 else 0 end
    when 'ag' then case when r.bruised_until > now() then 1 else 0 end
    when 'ch' then case when coalesce(r.items->>'sad','') = 'true' then 2 else 0 end + case when r.hygiene < 1 then 1 else 0 end
    when 'iq' then case when r.energy < 10 then 2 else 0 end
    when 'lk' then case when coalesce((r.items->'db'->>'a')::int, 0) > 0 then 1 else 0 end
    else 0 end)
$$;
revoke all on function public.town_at(public.town_residents,text) from public, anon, authenticated;
do $do$
declare
  ps jsonb := jsonb_build_array(
    jsonb_build_array('town_train', 'least(5,', 'least(8,', 0),
    jsonb_build_array('town_train', 'cur >= 5', 'cur >= 8', 0),
    jsonb_build_array('town_stats', E'>= 5 then raise exception ''這項已經是最高了''', E'>= 8 then raise exception ''這項已經是最高了''', 1),
    jsonb_build_array('town_act', 't.fun := t.fun + 20*gm;', E't.fun := t.fun + (20 + 2 * public.town_at(r, ''ch'')) * gm;', 0),
    jsonb_build_array('town_act', 'r.energy := r.energy + 50; r.fun := r.fun + 3; r.bladder := r.bladder - 10;', E'r.energy := r.energy + 50 + 2 * public.town_at(r, ''ch''); r.fun := r.fun + 3; r.bladder := r.bladder - 10;', 1),
    jsonb_build_array('town_act', 'if pa >= pb then t.fun := t.fun - 12; t.hygiene := t.hygiene - 15;', E'if pa >= pb then t.fun := t.fun - greatest(4, 12 - public.town_at(t, ''st'')); t.hygiene := t.hygiene - 15;', 1),
    jsonb_build_array('town_jail', 't.energy := t.energy - 35;', E't.energy := t.energy - (35 - floor(1.5 * public.town_at(t, ''st'')));', 1),
    jsonb_build_array('town_zombie', E'if (p.items->''zb''->>''at'') is null or (p.items->''zb''->>''at'')::timestamptz < now() - interval ''60 seconds'' then',
      E'if ((p.items->''zb''->>''at'') is null or (p.items->''zb''->>''at'')::timestamptz < now() - interval ''60 seconds'') and mod(abs(hashtext(p.id::text || floor(extract(epoch from now()) / 60)::text)), 100) >= least(32, 4 * public.town_at(p, ''ag'')) then', 1));
  fnames text[] := array['town_train','town_stats','town_act','town_jail','town_zombie'];
  fn text; def text; po oid; e jsonb; c int; skip boolean;
begin
  foreach fn in array fnames loop
    select p.oid into po from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = fn order by length(p.prosrc) desc limit 1;
    if po is null then raise exception '找不到函式 %', fn; end if;
    def := pg_get_functiondef(po); skip := false;
    for e in select * from jsonb_array_elements(ps) loop
      if e->>0 <> fn then continue; end if;
      if position(e->>2 in def) > 0 and position(e->>1 in def) = 0 then skip := true; continue; end if;
      c := (length(def) - length(replace(def, e->>1, ''))) / greatest(1, length(e->>1));
      if c = 0 or (c > 1 and (e->>3)::int = 1) then raise exception '% 錨點找不到或不唯一：%', fn, e->>1; end if;
      def := replace(def, e->>1, e->>2);
    end loop;
    if not skip then execute def; end if;
  end loop;
end $do$;

-- 洗點 $5000
create or replace function public.town_stats_reset(rid bigint, pin text) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; a jsonb; cost int := 5000;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if public.town_jailed(r) then raise exception '入獄中不能洗點'; end if;
  if r.sleeping then raise exception '睡著了，先醒來'; end if;
  if r.money < cost then raise exception '錢不夠，洗點要 €%', cost; end if;
  a := coalesce(r.items->'at', '{}'::jsonb);
  a := jsonb_build_object('td', coalesce(a->'td', '{}'::jsonb));
  r.money := r.money - cost;
  r.items := jsonb_set(r.items, '{at}', a);
  perform public.town_fund_add(r.town_id, 'respec', cost / 2);
  insert into public.town_events(town_id, actor, kind, msg) values (r.town_id, r.id, 'luck', r.name || ' 花 €5000 重新分配了能力點數');
  perform public.town_save_r(r);
  return json_build_object('ok', true, 'money', r.money);
end $$;
revoke all on function public.town_stats_reset(bigint,text) from public;
grant execute on function public.town_stats_reset(bigint,text) to anon, authenticated;
