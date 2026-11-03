-- 遊玩人數統計：每天每個遊戲記「開局」「完成」各幾次，不記任何個人資料
-- 前端只能呼叫 play_hit（每次 +1）與 play_stats（讀總數），不能直接改資料表

create table if not exists public.plays (
  day date not null default (now() at time zone 'Asia/Taipei')::date,
  game text not null check (game in ('life','football')),
  kind text not null check (kind in ('start','finish')),
  n bigint not null default 0,
  primary key (day, game, kind)
);
alter table public.plays enable row level security;
revoke all on public.plays from anon, authenticated;

create or replace function public.play_hit(g text, k text) returns void
language sql security definer set search_path = public as $$
  insert into public.plays(game, kind, n) values (g, k, 1)
  on conflict (day, game, kind) do update set n = public.plays.n + 1;
$$;

create or replace function public.play_stats(g text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'today_start',  coalesce(sum(n) filter (where kind='start'  and day=(now() at time zone 'Asia/Taipei')::date),0),
    'today_finish', coalesce(sum(n) filter (where kind='finish' and day=(now() at time zone 'Asia/Taipei')::date),0),
    'total_start',  coalesce(sum(n) filter (where kind='start'),0),
    'total_finish', coalesce(sum(n) filter (where kind='finish'),0))
  from public.plays where game = g;
$$;

revoke all on function public.play_hit(text,text) from public;
revoke all on function public.play_stats(text) from public;
grant execute on function public.play_hit(text,text) to anon, authenticated;
grant execute on function public.play_stats(text) to anon, authenticated;
