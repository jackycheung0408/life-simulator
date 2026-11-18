-- 一次性沒收汽車（2026-11-18，只執行一次）。取代 town_confiscate_1118.sql（該檔含扣錢，鎮長已改成「錢不收」，已刪除）。
-- 原因：射龍門舊版由系統憑空產生彩池底池，居民 26 獲利後立即考照並買了汽車；鎮長決定只沒收汽車。
-- 範圍：只動 id 26「俺是寕蝶亞蔑蝶」的汽車（刪除、不退車款），駕照保留；不碰任何人的現金。
-- 防重複與防誤跑：標記 confiscate_car_1118；同時寫入舊標記 confiscate_1118，之後即使誤貼舊腳本也會被略過。
do $$
#variable_conflict use_variable
declare
  n26 text; t26 text;
  it jsonb;
begin
  if exists (select 1 from public.town_migrations where id = 'confiscate_car_1118') then
    raise notice 'confiscate_car_1118 已執行過，略過';
    return;
  end if;
  select r.name, r.town_id into n26, t26 from public.town_residents r where r.id = 26;
  if n26 is distinct from '俺是寕蝶亞蔑蝶' or t26 is distinct from 'H7CE2M' then
    raise exception 'id 26 名字或小鎮不符：% / %', n26, t26;
  end if;

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
  update public.town_residents r set items = it where r.id = 26;

  insert into public.town_migrations (id) values ('confiscate_car_1118') on conflict do nothing;
  insert into public.town_migrations (id) values ('confiscate_1118') on conflict do nothing;
  raise notice 'confiscate_car_1118 完成：已刪除汽車，現金未動';
end $$;
