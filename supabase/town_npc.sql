-- 小豬鎮：流動商人 NPC。要在 town.sql、town_stats.sql 之後套用，可重複執行。
-- 每鎮每個台灣日一次：隨機 9～19 點開始，在廣場或公園待 60～120 分鐘（惰性結算，有人 view 才補算）。
-- 商品（每人每天每種最多買 1 次，items.np={d,b:[代號]}）：tonic 補品 1500（心情 +30、清潔 +30）、
--   toy 小豬玩偶 2500（收藏 items.col +1，純裝飾）、book 訓練手冊 2000（隨機一項能力進度 +2，每項上限 5 點仍由 town_train 控制）。
-- 全是金錢出口（只花錢、不賺錢）；現金不夠就擋、不欠款；角色不會死。
create table if not exists public.town_npcs (
  town_id text primary key,
  day text,
  place text,
  start_at timestamptz,
  until timestamptz
);
alter table public.town_npcs enable row level security;
create or replace function public.town_npc(rid bigint, pin text, op text default 'view', item text default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; tid text; w public.town_npcs; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
  here boolean := false; pr jsonb; bought jsonb; price int; msg text; sk text; ks text[] := array['st','ag','ch','iq','lk']; at jsonb; pp jsonb;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  tid := r.town_id;
  insert into public.town_npcs(town_id) values (tid) on conflict (town_id) do nothing;
  select * into w from public.town_npcs where town_id = tid for update;
  if w.day is distinct from today then
    update public.town_npcs set day = today,
      place = case when random() < 0.5 then 'plaza' else 'park' end,
      start_at = (today::date)::timestamp at time zone 'Asia/Taipei' + make_interval(mins => 540 + floor(random() * 601)::int),
      until = null
      where town_id = tid;
    update public.town_npcs set until = start_at + make_interval(mins => 60 + floor(random() * 61)::int) where town_id = tid;
    select * into w from public.town_npcs where town_id = tid;
  end if;
  here := w.start_at <= now() and w.until > now();
  pr := coalesce(r.items->'np', '{}'::jsonb);
  bought := case when pr->>'d' = today then coalesce(pr->'b', '[]'::jsonb) else '[]'::jsonb end;
  if op = 'view' then
    return json_build_object('here', here, 'place', w.place, 'until', w.until, 'bought', bought);
  end if;
  if op <> 'buy' then return json_build_object('error','未知動作'); end if;
  if not here then return json_build_object('error','商人現在不在'); end if;
  if public.town_jailed(r) or r.sleeping or r.place <> w.place then return json_build_object('error','要在商人那裡（醒著、不在牢裡）'); end if;
  if item not in ('tonic','toy','book') then return json_build_object('error','沒有這個商品'); end if;
  if bought ? item then return json_build_object('error','今天買過了'); end if;
  price := case item when 'tonic' then 1500 when 'toy' then 2500 else 2000 end;
  if r.money < price then return json_build_object('error','錢不夠（要 €' || price || '）'); end if;
  r.money := r.money - price;
  if item = 'tonic' then
    r.fun := least(100, r.fun + 30); r.hygiene := least(100, r.hygiene + 30); msg := '喝下商人的特調補品，心情變好、整個人清爽';
  elsif item = 'toy' then
    r.items := jsonb_set(r.items, '{col}', to_jsonb(coalesce((r.items->>'col')::int, 0) + 1)); msg := '買了一隻小豬玩偶放進收藏';
  else
    sk := ks[1 + floor(random() * 5)::int];
    at := coalesce(r.items->'at', '{}'::jsonb); pp := coalesce(at->'p', '{}'::jsonb);
    pp := jsonb_set(pp, array[sk], to_jsonb(coalesce((pp->>sk)::int, 0) + 2));
    r.items := jsonb_set(r.items, '{at}', at || jsonb_build_object('p', pp));
    msg := '讀了訓練手冊，' || case sk when 'st' then '力量' when 'ag' then '敏捷' when 'ch' then '魅力' when 'iq' then '智力' else '運氣' end || '進度 +2';
  end if;
  r.items := jsonb_set(r.items, '{np}', jsonb_build_object('d', today, 'b', bought || to_jsonb(item)));
  insert into public.town_events(town_id,actor,kind,msg) values (tid, rid, 'luck', r.name || ' ' || msg);
  perform public.town_save_r(r);
  return json_build_object('msg', msg, 'bought', bought || to_jsonb(item));
end $$;
revoke all on function public.town_npc(bigint,text,text,text) from public;
grant execute on function public.town_npc(bigint,text,text,text) to anon, authenticated;
