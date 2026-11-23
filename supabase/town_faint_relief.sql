-- 餓昏倒減頻（2026-11-23）：B 快餓昏時自動吃零食（設定開關，預設關）、C 醫藥費階梯。要在 town_faint_fix.sql 之後套用，可重複執行，不含破壞性語句。
-- B：items.ae = true 且有零食（items.snack）時，飽足 <= 2（約昏倒前 15 分鐘）自動吃一包（飽足 +20、心情 +3），寫動態；沒開或沒零食就照舊。
-- C：昏倒醒來的醫藥費改階梯：每個台灣日第 1 次 €500、第 2 次 €1000、之後 €1500（items.fh={d,n}），付到 0 為止、不欠款；車禍／被砍住院照舊，不追溯。
-- 就地改 town_tick（pg_get_functiondef），找不到錨點整檔失敗、已改過略過。
do $do$
declare def text;
  a1 text := E'  if r.hunger <= 0 and not r.sleeping then\n    r.sleeping := true; r.hunger := 10;';
  a2 text := E'      insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, r.id, \'faint\', r.name || \' 在醫院醒來，付了醫藥費 €\' || least(1500, greatest(0, r.money)));\n      r.money := greatest(0, r.money - 1500);';
begin
  select pg_get_functiondef('public.town_tick(public.town_residents)'::regprocedure) into def;
  if position('town_faint_relief' in def) > 0 then return; end if;
  if (length(def) - length(replace(def, a1, ''))) <> length(a1) or (length(def) - length(replace(def, a2, ''))) <> length(a2) then raise exception 'town_tick 錨點找不到或不唯一，沒有修改'; end if;
  def := replace(def, a1,
    E'  -- town_faint_relief B：快餓昏時自動吃零食（要開設定）\n'
    || E'  if r.hunger <= 2 and not r.sleeping and coalesce(r.items->>\'ae\', \'\') = \'true\' and coalesce((r.items->>\'snack\')::int, 0) > 0 then\n'
    || E'    r.hunger := greatest(r.hunger, 0) + 20; r.fun := r.fun + 3;\n'
    || E'    r.items := jsonb_set(r.items, \'{snack}\', to_jsonb((r.items->>\'snack\')::int - 1));\n'
    || E'    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, r.id, \'luck\', r.name || \' 快餓昏了，自動吃了一包零食\');\n'
    || E'  end if;\n' || a1);
  def := replace(def, a2,
    E'      declare fh_d text := to_char(now() at time zone \'Asia/Taipei\', \'YYYY-MM-DD\'); fh_n int; fee int;\n'
    || E'      begin\n'
    || E'        fh_n := (case when r.items#>>\'{fh,d}\' = fh_d then coalesce((r.items#>>\'{fh,n}\')::int, 0) else 0 end) + 1;\n'
    || E'        fee := case fh_n when 1 then 500 when 2 then 1000 else 1500 end;\n'
    || E'        r.items := jsonb_set(r.items, \'{fh}\', jsonb_build_object(\'d\', fh_d, \'n\', fh_n));\n'
    || E'        insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, r.id, \'faint\', r.name || \' 在醫院醒來，付了醫藥費 €\' || least(fee, greatest(0, r.money)));\n'
    || E'        r.money := greatest(0, r.money - fee);\n'
    || E'      end;');
  execute def;
end $do$;
revoke all on function public.town_tick(public.town_residents) from public, anon, authenticated;

-- 設定開關：自動吃零食
create or replace function public.town_autoeat(rid bigint, pin text, op boolean) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  update public.town_residents set items = jsonb_set(items, '{ae}', to_jsonb(coalesce(op, false))) where id = rid;
  return json_build_object('ae', coalesce(op, false));
end $$;
revoke all on function public.town_autoeat(bigint,text,boolean) from public;
grant execute on function public.town_autoeat(bigint,text,boolean) to anon, authenticated;
