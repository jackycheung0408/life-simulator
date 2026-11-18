-- 一次性沒收（2026-11-18，只執行一次）
-- 原因：射龍門舊版由系統憑空產生彩池底池 $3000（另有加碼），兩位玩家從中獲利，鎮長決定沒收。
-- 金額：id 26「俺是寕蝶亞蔑蝶」現金 -795 並刪除汽車（保留駕照、不退車款）；id 35「老子」現金 -2205。
-- 現金只扣到 0 為止、不得變負。用 town_migrations 標記 confiscate_1118 防重複執行。
do $$
#variable_conflict use_variable
declare
  n26 text; t26 text; n35 text; t35 text;
  it jsonb;
begin
  if exists (select 1 from public.town_migrations where id = 'confiscate_1118') then
    raise notice 'confiscate_1118 已執行過，略過';
    return;
  end if;
  select r.name, r.town_id into n26, t26 from public.town_residents r where r.id = 26;
  select r.name, r.town_id into n35, t35 from public.town_residents r where r.id = 35;
  if n26 is distinct from '俺是寕蝶亞蔑蝶' or t26 is distinct from 'H7CE2M' then
    raise exception 'id 26 名字或小鎮不符：% / %', n26, t26;
  end if;
  if n35 is distinct from '老子' or t35 is distinct from 'H7CE2M' then
    raise exception 'id 35 名字或小鎮不符：% / %', n35, t35;
  end if;

  update public.town_residents r set money = greatest(0, r.money - 2205) where r.id = 35;

  select r.items into it from public.town_residents r where r.id = 26;
  if it is null then it := '{}'::jsonb; end if;
  if jsonb_typeof(it->'veh'->'own') = 'array' then
    it := jsonb_set(it, '{veh,own}', coalesce(
      (select jsonb_agg(e) from jsonb_array_elements(it->'veh'->'own') e where e <> '"car"'::jsonb),
      '[]'::jsonb));
  end if;
  if it->'veh'->>'k' = 'car' then
    it := jsonb_set(it, '{veh,k}', 'null'::jsonb);
  end if;
  if it->'veh' ? 'w' then
    it := it #- '{veh,w,car}';
  end if;
  if it ? 'ins' then
    it := it #- '{ins,car}';
  end if;
  update public.town_residents r set money = greatest(0, r.money - 795), items = it where r.id = 26;

  insert into public.town_migrations (id) values ('confiscate_1118');
  raise notice 'confiscate_1118 完成';
end $$;
