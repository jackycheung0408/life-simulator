-- 平衡批 1（2026-11-24）：自動吃零食預設開、昏倒醒來後 30 分鐘不再餓昏倒。要在 town_faint_meal.sql 之後套用，可重複執行，不含破壞性語句。
-- A：items.ae 缺值視為開（只有明確設成 false 才關）；快餓昏（飽足 <= 2）且有零食就自動吃一包。
-- B：醒來（出院）時記 items.fg = 30 分鐘後；保護期間飽足歸零不昏倒，只停在 1（仍會餓、心情照扣），期滿恢復原規則。
-- 就地改 town_tick（pg_get_functiondef），找不到錨點整檔失敗、已改過略過。
do $do$
declare def text;
  a1 text := E'coalesce(r.items->>\'ae\', \'\') = \'true\'';
  a2 text := E'  if r.hunger <= 0 and not r.sleeping then\n    r.sleeping := true; r.hunger := 10;';
  a3 text := E'    r.hunger := greatest(r.hunger, 50);  -- town_faint_meal';
begin
  select pg_get_functiondef('public.town_tick(public.town_residents)'::regprocedure) into def;
  if position('town_bal1_faint' in def) > 0 then return; end if;
  if (length(def) - length(replace(def, a1, ''))) <> length(a1) or (length(def) - length(replace(def, a2, ''))) <> length(a2) or (length(def) - length(replace(def, a3, ''))) <> length(a3) then raise exception 'town_tick 錨點找不到或不唯一（要先套 town_faint_meal.sql），沒有修改'; end if;
  def := replace(def, a1, E'coalesce(r.items->>\'ae\', \'\') <> \'false\'');
  def := replace(def, a2,
    E'  -- town_bal1_faint：醒來後 30 分鐘保護，餓到 0 不昏倒（停在 1）\n'
    || E'  if r.hunger <= 0 and not r.sleeping and (r.items->>\'fg\') is not null and (r.items->>\'fg\')::timestamptz > now() then r.hunger := 1; end if;\n' || a2);
  def := replace(def, a3, E'    r.items := jsonb_set(r.items, \'{fg}\', to_jsonb((now() + interval \'30 minutes\')::text));\n' || a3);
  execute def;
end $do$;
revoke all on function public.town_tick(public.town_residents) from public, anon, authenticated;
