-- 平衡批 3（2026-11-24）：好感。要在 town.sql、town_jail.sql、town_bond_recover.sql 之後套用，可重複執行。
-- A 負值回復加倍：每天 04:10 好感 < 0 且昨天沒有負向互動的一對，+2（≤ −50 +3）（原 +1／+2）。cron 同名覆蓋。
-- A2 和好 +8 → +10（就地改 town_act，找不到錨點整檔失敗、已改過略過）。
-- C 好朋友加成：自己有任何一位好感 >= 30（好麻吉以上）的朋友，打工薪水 +3%（重建 town_pr_pct：前科 92% 變 95%、沒前科 100% 變 103%；公司、其他工作、加班、一起加班都乘它）。
create extension if not exists pg_cron;
select cron.schedule('town-bond-recover', '10 20 * * *',
  $c$ update public.town_bonds set score = least(0, score + case when score <= -50 then 3 else 2 end)
      where score < 0 and not (dday >= to_char((now() at time zone 'Asia/Taipei') - interval '1 day','YYYY-MM-DD') and dneg > 0) $c$);
do $do$
declare def text;
  a1 text := 'perform public.town_bond(r.town_id, rid, t.id, 8);';
begin
  select pg_get_functiondef(p.oid) into def from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'town_act' and p.prosrc like '%town_bal3_bond%';
  if def is not null then return; end if;
  select pg_get_functiondef(p.oid) into def from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'town_act' order by length(p.prosrc) desc limit 1;
  if (length(def) - length(replace(def, a1, ''))) <> length(a1) then raise exception 'town_act 錨點找不到或不唯一，沒有修改'; end if;
  def := replace(def, a1, E'perform public.town_bond(r.town_id, rid, t.id, 10);  -- town_bal3_bond：和好 +10');
  execute def;
end $do$;
create or replace function public.town_pr_pct(r public.town_residents) returns int language sql stable as $$
  select (case when public.town_pr_on(r) then 92 else 100 end)
       + (case when exists (select 1 from public.town_bonds b where (b.a = r.id or b.b = r.id) and b.score >= 30) then 3 else 0 end)
$$;
