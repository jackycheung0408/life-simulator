-- 足球員模擬器：全球排行榜 + 追思館加固
-- 原則：只能新增與讀取；數值有上下限與合理性檢查；限制送出頻率；擋髒話；檢舉 3 次自動隱藏

-- ── 共用：髒話過濾 ──
create or replace function public.has_bad_words(t text) returns boolean language sql immutable as $$
  select coalesce(lower(t),'') ~ '(fuck|shit|bitch|cunt|nigg|幹你|操你|靠北|雞掰|機掰|三小|王八蛋|去死|婊子|垃圾人|智障)'
$$;

-- ── 排行榜資料表 ──
create table if not exists public.fb_careers (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  device text not null check (char_length(device) between 8 and 40),
  name text not null check (char_length(name) between 1 and 24),
  country text not null check (char_length(country) between 1 and 12),
  pos text not null check (pos in ('FW','MF','DF','GK')),
  title text not null default '' check (char_length(title) <= 30),
  peak int not null check (peak between 0 and 99),
  apps int not null check (apps between 0 and 1200),
  goals int not null check (goals between 0 and 1500),
  trophies int not null check (trophies between 0 and 60),
  awards int not null check (awards between 0 and 80),
  score int not null check (score between 0 and 2500),
  born int not null check (born between 2000 and 2100),
  died int not null check (died between 2000 and 2250),
  reports int not null default 0,
  hidden boolean not null default false,
  -- 合理性：進球不可能遠超過出賽、冠軍不可能比出賽還多
  constraint fb_sane check (goals <= apps * 2 + 5 and trophies <= apps / 8 + 6 and died >= born)
);
create index if not exists fb_careers_score on public.fb_careers (score desc) where not hidden;
create index if not exists fb_careers_country on public.fb_careers (country, score desc) where not hidden;

alter table public.fb_careers enable row level security;
drop policy if exists "read visible" on public.fb_careers;
create policy "read visible" on public.fb_careers for select using (not hidden);
drop policy if exists "insert new" on public.fb_careers;
create policy "insert new" on public.fb_careers for insert with check (reports = 0 and hidden = false);
-- 沒有 update / delete 政策：任何人都不能改或刪

-- 送出前檢查：髒話、同一裝置 60 秒內只能送 1 筆、全站每分鐘最多 30 筆
create or replace function public.fb_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if has_bad_words(new.name) or has_bad_words(new.title) then raise exception 'bad words'; end if;
  if exists (select 1 from fb_careers where device = new.device and created_at > now() - interval '60 seconds') then raise exception 'too fast'; end if;
  if (select count(*) from fb_careers where created_at > now() - interval '1 minute') >= 30 then raise exception 'busy'; end if;
  new.created_at := now(); new.reports := 0; new.hidden := false;
  return new;
end $$;
drop trigger if exists fb_guard on public.fb_careers;
create trigger fb_guard before insert on public.fb_careers for each row execute function public.fb_guard();

-- 檢舉：每次 +1，滿 3 次自動隱藏
create or replace function public.fb_report(cid bigint) returns void language sql security definer set search_path = public as $$
  update fb_careers set reports = reports + 1, hidden = (reports + 1 >= 3) where id = cid;
$$;
revoke all on function public.fb_report(bigint) from public;
grant execute on function public.fb_report(bigint) to anon, authenticated;

-- ── 追思館（lives）加固：長度上限、髒話、全站頻率 ──
alter table public.lives drop constraint if exists lives_len;
alter table public.lives add constraint lives_len check (char_length(name) <= 30 and char_length(coalesce(words,'')) <= 300 and char_length(coalesce(country,'')) <= 20) not valid;
create or replace function public.lives_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if has_bad_words(new.name) or has_bad_words(new.words) then raise exception 'bad words'; end if;
  if (select count(*) from lives where created_at > now() - interval '1 minute') >= 20 then raise exception 'busy'; end if;
  new.created_at := now(); new.candles := 0;
  return new;
end $$;
drop trigger if exists lives_guard on public.lives;
create trigger lives_guard before insert on public.lives for each row execute function public.lives_guard();
