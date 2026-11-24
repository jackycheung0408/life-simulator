-- 小豬鎮：自建錯誤紀錄（前端 window.onerror／unhandledrejection／rpc 失敗批次回報）。可重複執行，不動其他函式。
-- 1) 表 town_errlog：同一錯誤（訊息＋來源＋行號＋版本）每天合成一列並累計次數 n；RLS 全關、不給直接權限。
-- 2) 表 town_errlog_rl：限速計數（每個 ua 雜湊每分鐘 3 筆、全站每分鐘 120 筆）。
-- 3) RPC town_errlog(msg,src,line,ua,ver)：anon 可呼叫、失敗靜默不報錯；字串截 300 字（ua 120、src 200）；
--    不收個資：不存角色／小鎮 id、IP；訊息裡的 Email、網址參數、8 位以上連續數字會被遮掉；約 2% 機率順手清掉超過 7 天的資料。
-- 4) RPC town_errlog_view(rid,pin)：只有鎮長可看近 7 天分組統計（前 20 組）。
-- 在 Supabase，revoke ... from public 擋不住 anon／authenticated，要連 anon、authenticated 一起收回。

create table if not exists public.town_errlog (
  id bigint generated always as identity primary key,
  day date not null,
  h text not null,
  msg text not null,
  src text,
  line int,
  ua text,
  ver text,
  n int not null default 1,
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  unique (day, h)
);
alter table public.town_errlog enable row level security;
revoke all on public.town_errlog from public, anon, authenticated;
create index if not exists town_errlog_day on public.town_errlog(day desc);

create table if not exists public.town_errlog_rl (
  k text primary key,
  m bigint not null,
  n int not null default 0
);
alter table public.town_errlog_rl enable row level security;
revoke all on public.town_errlog_rl from public, anon, authenticated;

create or replace function public.town_errlog_clean(s text, mx int) returns text
language sql immutable set search_path = public as $$
  select left(regexp_replace(regexp_replace(regexp_replace(coalesce(s, ''),
    '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+', '<email>', 'g'),
    '\?[^\s)"'']*', '', 'g'),
    '[0-9]{8,}', '<num>', 'g'), mx)
$$;
revoke all on function public.town_errlog_clean(text, int) from public, anon, authenticated;

create or replace function public.town_errlog(msg text, src text default null, line int default null, ua text default null, ver text default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  d date := (now() at time zone 'Asia/Taipei')::date;
  mm bigint := floor(extract(epoch from now()) / 60)::bigint;
  m2 text := public.town_errlog_clean(msg, 300);
  s2 text := nullif(public.town_errlog_clean(src, 200), '');
  u2 text := nullif(public.town_errlog_clean(ua, 120), '');
  v2 text := nullif(left(coalesce(ver, ''), 12), '');
  l2 int := case when line between 0 and 9999999 then line else null end;
  hk text; c int;
begin
  begin
    if m2 = '' then return; end if;
    -- 限速：ua 雜湊每分鐘 3 筆、全站每分鐘 120 筆
    hk := md5(coalesce(u2, '') || '|' || coalesce(v2, ''));
    insert into public.town_errlog_rl(k, m, n) values (hk, mm, 1)
      on conflict (k) do update set m = excluded.m,
        n = case when public.town_errlog_rl.m = excluded.m then public.town_errlog_rl.n + 1 else 1 end
      returning n into c;
    if c > 3 then return; end if;
    insert into public.town_errlog_rl(k, m, n) values ('g', mm, 1)
      on conflict (k) do update set m = excluded.m,
        n = case when public.town_errlog_rl.m = excluded.m then public.town_errlog_rl.n + 1 else 1 end
      returning n into c;
    if c > 120 then return; end if;
    insert into public.town_errlog(day, h, msg, src, line, ua, ver)
      values (d, md5(m2 || '|' || coalesce(s2, '') || '|' || coalesce(l2::text, '') || '|' || coalesce(v2, '')), m2, s2, l2, u2, v2)
      on conflict (day, h) do update set n = public.town_errlog.n + 1, last_at = now();
    if random() < 0.02 then
      delete from public.town_errlog where day < d - 7;
      delete from public.town_errlog_rl where m < mm - 60 and k <> 'g';
    end if;
  exception when others then
    null; -- 失敗靜默，不影響遊戲
  end;
end $$;
revoke all on function public.town_errlog(text, text, int, text, text) from public;
grant execute on function public.town_errlog(text, text, int, text, text) to anon, authenticated;

create or replace function public.town_errlog_view(rid bigint, pin text) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if not r.mayor then raise exception '只有鎮長可以做這件事'; end if;
  return json_build_object('ok', true,
    'total', (select coalesce(sum(n), 0) from public.town_errlog where day >= (now() at time zone 'Asia/Taipei')::date - 6),
    'rows', (select coalesce(json_agg(x), '[]'::json) from (
      select e.msg, e.src, e.line, e.ver, sum(e.n)::int as n, max(e.last_at) as last_at
      from public.town_errlog e where e.day >= (now() at time zone 'Asia/Taipei')::date - 6
      group by e.msg, e.src, e.line, e.ver order by sum(e.n) desc, max(e.last_at) desc limit 20) x));
end $$;
revoke all on function public.town_errlog_view(bigint, text) from public, anon, authenticated;
grant execute on function public.town_errlog_view(bigint, text) to anon, authenticated;
