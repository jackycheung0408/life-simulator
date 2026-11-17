-- 小豬鎮：市政廳公告欄委託（任務發布者 NPC）。要在 town.sql 之後套用，可重複執行，不建表。
-- 每人每天 1 個委託（日期與角色 id 決定題目），要在市政廳交付；獎金依職稱等級（items.works：0/10/30/70/150 次 = Lv1～5）縮放。
--   q0 今天打工達 3 次（items.dc.work）→ 獎金 300×Lv；q1 交 1 包零食（items.snack）→ 200×Lv；q2 交 2 塊生豬肉（items.zp）→ 300×Lv。
-- 額外收入、每天最多一次、現有每日任務不動；角色不會死、不欠款。資料 items.qd={d,a}。
create or replace function public.town_quest(rid bigint, pin text, op text default 'view', item text default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
  qi int; w int; lv int; rew int; ready boolean; need text; qd jsonb; done boolean; dc jsonb; msg text;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  qi := abs(hashtext('q' || today || r.id::text)) % 3;
  w := coalesce((r.items->>'works')::int, 0);
  lv := 1 + (w >= 10)::int + (w >= 30)::int + (w >= 70)::int + (w >= 150)::int;
  rew := case qi when 0 then 300 when 1 then 200 else 300 end * lv;
  qd := coalesce(r.items->'qd', '{}'::jsonb);
  done := qd->>'d' = today and coalesce((qd->>'a')::boolean, false);
  dc := coalesce(r.items->'dc', '{}'::jsonb);
  if qi = 0 then ready := dc->>'d' = today and coalesce((dc->>'work')::int, 0) >= 3; need := '今天打工 3 次';
  elsif qi = 1 then ready := coalesce((r.items->>'snack')::int, 0) >= 1; need := '交出 1 包零食';
  else ready := coalesce((r.items->>'zp')::int, 0) >= 2; need := '交出 2 塊生豬肉'; end if;
  if op = 'view' then
    return json_build_object('q', qi, 'need', need, 'reward', rew, 'lv', lv, 'done', done, 'ready', ready);
  end if;
  if op <> 'claim' then return json_build_object('error','未知動作'); end if;
  if done then return json_build_object('error','今天的委託已經完成了'); end if;
  if public.town_jailed(r) or r.sleeping or r.place <> 'townhall' then return json_build_object('error','要在市政廳（醒著、不在牢裡）'); end if;
  if not ready then return json_build_object('error','還沒達成：' || need); end if;
  if qi = 1 then r.items := jsonb_set(r.items, '{snack}', to_jsonb(coalesce((r.items->>'snack')::int, 0) - 1));
  elsif qi = 2 then r.items := jsonb_set(r.items, '{zp}', to_jsonb(coalesce((r.items->>'zp')::int, 0) - 2)); end if;
  r.money := r.money + rew;
  r.items := jsonb_set(r.items, '{qd}', jsonb_build_object('d', today, 'a', true));
  msg := '完成公告欄委託（' || need || '），領 €' || rew;
  insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'luck', r.name || ' ' || msg);
  perform public.town_save_r(r);
  return json_build_object('msg', msg);
end $$;
revoke all on function public.town_quest(bigint,text,text,text) from public;
grant execute on function public.town_quest(bigint,text,text,text) to anon, authenticated;
