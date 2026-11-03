-- 小豬鎮手機通知：訂閱存在 town_push；有新動態就呼叫推播程式（supabase/functions/town-push），每 30 分鐘檢查一次需求
-- 先執行 town.sql，再執行這個檔案；可以重複執行

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- 推播金鑰由推播程式第一次執行時自動產生，只有伺服器（service role）讀得到
create table if not exists public.town_vapid (id int primary key check (id = 1), public_key text not null, private_key text not null);
create table if not exists public.town_push (
  endpoint text primary key check (endpoint like 'https://%' and char_length(endpoint) < 800),
  resident_id bigint not null references public.town_residents(id) on delete cascade,
  p256dh text not null check (char_length(p256dh) < 200),
  auth text not null check (char_length(auth) < 100),
  created_at timestamptz not null default now()
);
alter table public.town_residents add column if not exists push_need_at timestamptz;
alter table public.town_vapid enable row level security;
alter table public.town_push enable row level security;
revoke all on public.town_vapid, public.town_push from anon, authenticated;

-- 開關通知（要密碼）；一個人最多 5 支裝置
create or replace function public.town_push_sub(rid bigint, pin text, endpoint text, p256dh text default null, auth text default null, turn_on boolean default true) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if turn_on then
    if p256dh is null or auth is null then raise exception '訂閱資料不完整'; end if;
    insert into public.town_push(endpoint,resident_id,p256dh,auth) values (town_push_sub.endpoint, rid, town_push_sub.p256dh, town_push_sub.auth)
      on conflict (endpoint) do update set resident_id = rid, p256dh = excluded.p256dh, auth = excluded.auth;
    delete from public.town_push where resident_id = rid and town_push.endpoint not in
      (select p.endpoint from public.town_push p where p.resident_id = rid order by p.created_at desc limit 5);
  else
    delete from public.town_push where town_push.endpoint = town_push_sub.endpoint and resident_id = rid;
  end if;
  return json_build_object('ok', true, 'devices', (select count(*) from public.town_push where resident_id = rid));
end $$;
revoke all on function public.town_push_sub(bigint,text,text,text,text,boolean) from public;
grant execute on function public.town_push_sub(bigint,text,text,text,text,boolean) to anon, authenticated;

-- 有人對你做了什麼：有訂閱才呼叫推播程式（非同步，不會拖慢遊戲）
create or replace function public.town_push_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.target is not null and exists (select 1 from public.town_push where resident_id = new.target) then
    perform net.http_post(url := 'https://gerqdagicybtyilihvvm.supabase.co/functions/v1/town-push',
      body := jsonb_build_object('event_id', new.id), headers := '{"Content-Type":"application/json"}'::jsonb);
  end if;
  return new;
end $$;
drop trigger if exists town_push_after on public.town_events;
create trigger town_push_after after insert on public.town_events for each row execute function public.town_push_notify();

-- 每 30 分鐘檢查一次需求
select cron.unschedule(jobid) from cron.job where jobname = 'town-push-needs';
select cron.schedule('town-push-needs', '*/30 * * * *',
  $c$ select net.http_post(url := 'https://gerqdagicybtyilihvvm.supabase.co/functions/v1/town-push', body := '{"check":true}'::jsonb, headers := '{"Content-Type":"application/json"}'::jsonb) $c$);
