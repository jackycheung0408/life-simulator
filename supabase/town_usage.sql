-- 小豬鎮：匿名使用統計（整個網頁的使用習慣；全站一張表，只記「哪個功能被用了幾次」）。可重複執行。
-- 隱私：不記角色 id、小鎮 id、裝置、IP、玩家輸入文字、金額，只有 (日期, 事件代號, 次數)。
-- 1) 表 town_usage(day, k, n)：RLS 全關、不給直接權限。
-- 2) RPC town_usage_hit(keys, counts)：anon 可呼叫，一次最多 20 個事件代號，代號 1～40 字且只允許白名單字元，同一請求去重；每個代號一次最多加 50；全站最多 2000 種不同代號，超過的新代號直接丟棄。
-- 3) town_usage_hit_int：給其他資料庫函式內部累加用（賭場開局人氣 play:<遊戲>），不開放 anon。
-- 4) town_usage_report(days)：管理員唯讀統計，只給 service role／SQL Editor 使用，不開放 anon。
-- 在 Supabase，revoke ... from public 擋不住 anon／authenticated，要連 anon、authenticated 一起收回。

create table if not exists public.town_usage (
  day date not null,
  k text not null check (char_length(k) between 1 and 40),
  n bigint not null default 0,
  primary key (day, k)
);
alter table public.town_usage enable row level security;
revoke all on public.town_usage from public, anon, authenticated;

create or replace function public.town_usage_hit_int(kk text, add_n int default 1) returns void
language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Asia/Taipei')::date;
begin
  if kk is null or add_n < 1 then return; end if;
  insert into public.town_usage(day, k, n) values (d, kk, add_n)
    on conflict (day, k) do update set n = public.town_usage.n + excluded.n;
end $$;
revoke all on function public.town_usage_hit_int(text, int) from public, anon, authenticated;

create or replace function public.town_usage_hit(keys text[], counts int[] default null) returns void
language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Asia/Taipei')::date; i int; kk text; c int; seen text[] := '{}'; total int;
begin
  if keys is null then return; end if;
  for i in 1 .. least(coalesce(array_length(keys, 1), 0), 20) loop
    kk := keys[i];
    if kk is null or kk !~ '^[A-Za-z0-9:_.\-一-鿿]{1,40}$' then continue; end if;
    if kk = any(seen) then continue; end if;
    seen := seen || kk;
    c := 1;
    if counts is not null and i <= coalesce(array_length(counts, 1), 0) and counts[i] is not null then c := least(greatest(counts[i], 1), 50); end if;
    if not exists (select 1 from public.town_usage u where u.day = d and u.k = kk) then
      select count(distinct u.k) into total from public.town_usage u where u.day >= d - 7;
      if total >= 2000 then continue; end if;
    end if;
    perform public.town_usage_hit_int(kk, c);
  end loop;
end $$;
revoke all on function public.town_usage_hit(text[], int[]) from public;
grant execute on function public.town_usage_hit(text[], int[]) to anon, authenticated;

create or replace function public.town_usage_report(days int default 7) returns table(k text, total bigint, today bigint)
language sql stable security definer set search_path = public as $$
  select u.k, sum(u.n)::bigint, coalesce(sum(u.n) filter (where u.day = (now() at time zone 'Asia/Taipei')::date), 0)::bigint
  from public.town_usage u where u.day >= (now() at time zone 'Asia/Taipei')::date - (greatest(days, 1) - 1)
  group by u.k order by 2 desc, u.k
$$;
revoke all on function public.town_usage_report(int) from public, anon, authenticated;
