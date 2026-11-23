-- 一次性補償（2026-11-23，只執行一次）：昏倒重複寫入期間被重複扣的醫藥費，依事件記錄估算每多一筆重複醒來事件補 €1500。
-- 防重複：town_migrations 標記 faint_refund_1123。名字要相符才動資料。Jacky 5 筆、老子 7 筆（俺是寕蝶亞蔑蝶 0）。
do $$
#variable_conflict use_variable
declare rec record; n int;
begin
  if exists (select 1 from public.town_migrations where id = 'faint_refund_1123') then raise notice '已執行過，略過'; return; end if;
  for rec in select * from (values ('Jacky', 5), ('老子', 7)) v(nm, k) loop
    for n in select r.id from public.town_residents r where r.name = rec.nm loop
      update public.town_residents r set money = r.money + rec.k * 1500 where r.id = n;
      insert into public.town_events(town_id, actor, target, kind, msg)
        select r.town_id, r.id, r.id, 'luck', r.name || ' 收到補償 €' || (rec.k * 1500) || '（昏倒重複扣醫藥費的修正）' from public.town_residents r where r.id = n;
    end loop;
  end loop;
  insert into public.town_migrations (id) values ('faint_refund_1123') on conflict do nothing;
end $$;
