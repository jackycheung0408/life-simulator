-- 平衡批 2（2026-11-24）：財產稅階梯加高、調節器財產稅係數 kt 上限 1.2 → 2.0。要在 town_econ.sql 之後套用，可重複執行，不含破壞性語句。
-- 稅階：5～10 萬 0.3%、10～100 萬 0.8%、100～500 萬 3%、500 萬以上 5%（原 1.5%／3%）；不動打工薪水、不追溯、錢只扣到 0。
-- 存 100 萬每天 7350、500 萬約 127350、1000 萬約 377350。前端 taxOf 要一致。
-- 調節器：kt 上限 2.0（每天仍最多 ±2%，所以升到 2.0 要約 35 天連續首富占比過高），下限 0.8 不變。就地改 town_econ_tick，找不到錨點整檔失敗、已改過略過。
create or replace function public.town_tax(m numeric) returns int language sql immutable as $$
  select floor(greatest(0, least(m, 100000) - 50000) * 0.003 + greatest(0, least(m, 1000000) - 100000) * 0.008 + greatest(0, least(m, 5000000) - 1000000) * 0.03 + greatest(0, m - 5000000) * 0.05)::int
$$;
revoke all on function public.town_tax(numeric) from public, anon, authenticated;
do $do$
declare def text;
  a1 text := 'nkt := least(1.2, greatest(0.8, e.kt *';
begin
  select pg_get_functiondef('public.town_econ_tick(text)'::regprocedure) into def;
  if position('town_bal2_tax' in def) > 0 or position('nkt := least(2.0,' in def) > 0 then return; end if;
  if (length(def) - length(replace(def, a1, ''))) <> length(a1) then raise exception 'town_econ_tick 錨點找不到或不唯一，沒有修改'; end if;
  def := replace(def, a1, E'-- town_bal2_tax：kt 上限放寬到 2.0\n    nkt := least(2.0, greatest(0.8, e.kt *');
  execute def;
end $do$;
revoke all on function public.town_econ_tick(text) from public, anon, authenticated;
