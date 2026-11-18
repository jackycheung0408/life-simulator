-- 一次性補發（2026-11-18，只執行一次）：鎮長決定補 id 26「俺是寕蝶亞蔑蝶」現金 $3150。
-- 防重複：用 town_migrations 標記 grant_3150_1118；名字或小鎮不符就不動資料。
do $$
#variable_conflict use_variable
declare
  n26 text; t26 text;
begin
  if exists (select 1 from public.town_migrations where id = 'grant_3150_1118') then
    raise notice 'grant_3150_1118 已執行過，略過';
    return;
  end if;
  select r.name, r.town_id into n26, t26 from public.town_residents r where r.id = 26;
  if n26 is distinct from '俺是寕蝶亞蔑蝶' or t26 is distinct from 'H7CE2M' then
    raise exception 'id 26 名字或小鎮不符：% / %', n26, t26;
  end if;
  update public.town_residents r set money = r.money + 3150 where r.id = 26;
  insert into public.town_migrations (id) values ('grant_3150_1118') on conflict do nothing;
  raise notice 'grant_3150_1118 完成：已補 $3150';
end $$;
