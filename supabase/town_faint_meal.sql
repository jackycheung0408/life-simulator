-- 昏倒醒來又馬上餓昏的連環修正（2026-11-23）：昏倒時飽足設 10，睡 1 小時又掉到接近 0，醒來幾秒內再度餓昏、再扣醫藥費。
-- 修法：醒來（出院）時醫院供餐，飽足至少回到 50。就地改 town_tick，找不到錨點整檔失敗、已改過略過。要在 town_faint_relief.sql 之後。
do $do$
declare def text;
  a1 text := E'    r.sleeping := false; r.items := r.items - \'faint\' - \'hosp\';';
begin
  select pg_get_functiondef('public.town_tick(public.town_residents)'::regprocedure) into def;
  if position('town_faint_meal' in def) > 0 then return; end if;
  if (length(def) - length(replace(def, a1, ''))) <> length(a1) then raise exception 'town_tick 錨點找不到或不唯一，沒有修改'; end if;
  def := replace(def, a1, E'    r.hunger := greatest(r.hunger, 50);  -- town_faint_meal：醫院供餐，醒來不會馬上又餓昏\n' || a1);
  execute def;
end $do$;
revoke all on function public.town_tick(public.town_residents) from public, anon, authenticated;
