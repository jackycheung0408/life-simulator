-- 小豬鎮股市（證券交易所）：先執行 town.sql，再執行這個檔案；可以重複執行
-- 規則（簡化版台股）：週一～週五 9:00～13:30（台灣時間）、漲跌幅 ±10%、可買零股（1 股起，1000 股 = 1 張）、
-- 手續費 0.1425%（最低 1）、賣出證交稅 0.3%（ETF 0.1%）、T+2 交割簡化成「賣股的錢 2 個平日後入帳，買股立即扣款」。
-- 價格：收盤價是證交所真實收盤價（Edge Function town-stock 每天抓 STOCK_DAY_ALL）；盤中價 = 前一個真實收盤價 + 每 5 分鐘一步的偽隨機波動
--      （用只有伺服器知道的鹽值產生，全鎮同價，玩家買賣不影響價格）。
-- 防洗錢：價格與玩家交易完全無關；單筆 ≤ 30000、每人每天買賣合計 ≤ 60000；手續費與稅是純損耗。
-- 持股存在 items.st = {h:{代號:{q:股數, c:總成本}}, pend:[{d:到帳日,a:金額}], dv:{d:日期, v:今日成交額}}（缺值用預設，不重置任何人）。

create table if not exists public.town_stocks (
  code text primary key, name text not null, etf boolean not null default false,
  close numeric not null, prev numeric not null, d date not null, upd timestamptz not null default now()
);
create table if not exists public.town_stock_meta (id int primary key check (id = 1), salt text not null);
alter table public.town_stocks enable row level security;
alter table public.town_stock_meta enable row level security;
revoke all on public.town_stocks, public.town_stock_meta from anon, authenticated;
insert into public.town_stock_meta(id, salt) values (1, md5(random()::text || clock_timestamp()::text)) on conflict do nothing;

-- 種子資料（2026-11-06 真實收盤價）；之後由 town-stock 每天更新
insert into public.town_stocks(code,name,etf,close,prev,d) values
 ('2330','台積電',false,2135,2135,'2026-11-06'),('2317','鴻海',false,224.5,224.5,'2026-11-06'),('0050','元大台灣50',true,92.5,92.5,'2026-11-06'),
 ('2454','聯發科',false,3390,3390,'2026-11-06'),('2412','中華電',false,163.5,163.5,'2026-11-06'),('2603','長榮',false,246.5,246.5,'2026-11-06'),
 ('2881','富邦金',false,148,148,'2026-11-06'),('2882','國泰金',false,106,106,'2026-11-06'),('2891','中信金',false,73.4,73.4,'2026-11-06'),
 ('2308','台達電',false,1055,1055,'2026-11-06'),('1301','台塑',false,62.7,62.7,'2026-11-06'),('2002','中鋼',false,18.55,18.55,'2026-11-06'),
 ('0056','元大高股息',true,49.91,49.91,'2026-11-06'),('00878','國泰永續高股息',true,31.99,31.99,'2026-11-06'),('2884','玉山金',false,47,47,'2026-11-06'),
 ('2303','聯電',false,92,92,'2026-11-06'),('2357','華碩',false,859,859,'2026-11-06'),('2618','長榮航',false,43.6,43.6,'2026-11-06'),
 ('1216','統一',false,76.8,76.8,'2026-11-06'),('2886','兆豐金',false,53.5,53.5,'2026-11-06')
on conflict (code) do nothing;

-- 台股升降單位
create or replace function public.town_stock_tick(p numeric) returns numeric language sql immutable as $$
  select round(p / t) * t from (select case when p < 10 then 0.01 when p < 50 then 0.05 when p < 100 then 0.1 when p < 500 then 0.5 when p < 1000 then 1 else 5 end::numeric t) x
$$;

-- 現在的價格：今天已有真實收盤價、週末、開盤前 → 真實收盤價；否則 = 前一個真實收盤價 × (1 + 每 5 分鐘一步的偽隨機波動)，限制在 ±10%
create or replace function public.town_stock_price(c text) returns numeric language plpgsql stable security definer set search_path = public as $$
declare s public.town_stocks; tp timestamp := now() at time zone 'Asia/Taipei'; today date := (now() at time zone 'Asia/Taipei')::date;
  mins int; n int; vsalt text; w numeric; p numeric;
begin
  select * into s from public.town_stocks where code = c;
  if not found then return null; end if;
  if s.d >= today or extract(isodow from tp) > 5 then return s.close; end if;
  mins := least(13*60 + 30, (extract(hour from tp)*60 + extract(minute from tp))::int) - 9*60;
  if mins <= 0 then return s.close; end if;
  n := mins / 5;
  select salt into vsalt from public.town_stock_meta where id = 1;
  select coalesce(sum(((('x' || substr(md5(vsalt || c || today::text || k::text), 1, 6))::bit(24)::int % 2001) - 1000) / 1000.0), 0) * 0.004 into w from generate_series(1, n) k;
  p := s.close * (1 + greatest(-0.1, least(0.1, w)));
  p := greatest(0.01, public.town_stock_tick(p));
  return greatest(round(s.close * 0.9, 2), least(round(s.close * 1.1, 2), p));
end $$;
revoke all on function public.town_stock_price(text) from public, anon, authenticated;

-- 加 n 個平日（略過週末，不考慮國定假日）
create or replace function public.town_add_bdays(d date, n int) returns date language plpgsql immutable as $$
declare i int := 0;
begin
  while i < n loop d := d + 1; if extract(isodow from d) <= 5 then i := i + 1; end if; end loop;
  return d;
end $$;

-- 行情（不用密碼）
create or replace function public.town_stock_list() returns json language plpgsql stable security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Taipei')::date;
begin
  return json_build_object('open', public.town_closed('stock') is null, 'stocks', (
    select coalesce(json_agg(json_build_object('code', code, 'name', name, 'etf', etf, 'price', public.town_stock_price(code), 'ref', case when d >= today then prev else close end, 'd', d) order by code), '[]'::json) from public.town_stocks));
end $$;

-- 買賣（要在證券交易所、營業時間內）；op = buy / sell
create or replace function public.town_stock_trade(rid bigint, pin text, op text, code text, qty int) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; s public.town_stocks; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); p numeric; amt int; fee int; tax int; net int;
  h jsonb; q int; c int; dv int; st jsonb; msg text;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if op not in ('buy','sell') then raise exception '沒有這個操作'; end if;
  if public.town_is_off(r.town_id, 'stock') then raise exception '這個小鎮沒有開證券交易所'; end if;
  if r.place <> 'stock' then raise exception '要在證券交易所才能買賣'; end if;
  if public.town_closed('stock') is not null then raise exception '%', public.town_closed('stock'); end if;
  if qty is null or qty < 1 or qty > 100000 then raise exception '股數不對'; end if;
  select * into s from public.town_stocks ts where ts.code = town_stock_trade.code;
  if not found then raise exception '沒有這檔股票'; end if;
  r := public.town_rent(r); r := public.town_stock_settle(r);
  p := public.town_stock_price(s.code);
  amt := round(p * qty)::int;
  if amt > 30000 then raise exception '單筆最多 NT$30,000（金額 NT$%）', amt; end if;
  dv := case when r.items->'st'->'dv'->>'d' = today then coalesce((r.items->'st'->'dv'->>'v')::int,0) else 0 end;
  if dv + amt > 60000 then raise exception '今天成交額到上限了（一天最多 NT$60,000），明天再來'; end if;
  fee := greatest(1, round(amt * 0.001425)::int);
  st := coalesce(r.items->'st', '{}'::jsonb);
  h := coalesce(st->'h', '{}'::jsonb);
  q := coalesce((h->s.code->>'q')::int, 0); c := coalesce((h->s.code->>'c')::int, 0);
  if op = 'buy' then
    if r.money < amt + fee then raise exception '錢不夠（要 NT$%，含手續費 %）', amt + fee, fee; end if;
    r.money := r.money - amt - fee;
    h := jsonb_set(h, array[s.code], jsonb_build_object('q', q + qty, 'c', c + amt + fee));
    msg := '買進 ' || s.name || ' ' || qty || ' 股，成交 NT$' || amt || '、手續費 ' || fee;
  else
    if q < qty then raise exception '你只有 % 股', q; end if;
    tax := round(amt * case when s.etf then 0.001 else 0.003 end)::int;
    net := greatest(0, amt - fee - tax);
    if q - qty = 0 then h := h - s.code; else h := jsonb_set(h, array[s.code], jsonb_build_object('q', q - qty, 'c', round(c::numeric * (q - qty) / q)::int)); end if;
    st := jsonb_set(st, '{pend}', coalesce(st->'pend', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('d', public.town_add_bdays((now() at time zone 'Asia/Taipei')::date, 2), 'a', net)));
    msg := '賣出 ' || s.name || ' ' || qty || ' 股，成交 NT$' || amt || '、手續費 ' || fee || '、證交稅 ' || tax || '，NT$' || net || ' 兩個平日後入帳';
  end if;
  st := jsonb_set(jsonb_set(st, '{h}', h), '{dv}', jsonb_build_object('d', today, 'v', dv + amt));
  r.items := jsonb_set(r.items, '{st}', st);
  update public.town_residents set money = r.money, items = r.items, seen_at = now() where id = rid;
  return json_build_object('ok', true, 'msg', msg, 'price', p, 'money', r.money);
end $$;

-- 寫入真實收盤價：只給 Edge Function（service role）呼叫；同一天重複寫入沒關係，不收未來日期與舊日期
create or replace function public.town_stock_set(code text, close numeric, d date) returns text
language plpgsql security definer set search_path = public as $$
declare s public.town_stocks;
begin
  select * into s from public.town_stocks ts where ts.code = town_stock_set.code;
  if not found then return 'skip'; end if;
  if d > (now() at time zone 'Asia/Taipei')::date or close <= 0 then return 'bad'; end if;
  if d < s.d then return 'old'; end if;
  if d = s.d then update public.town_stocks ts set close = town_stock_set.close, upd = now() where ts.code = s.code; return 'same';
  else update public.town_stocks ts set prev = s.close, close = town_stock_set.close, d = town_stock_set.d, upd = now() where ts.code = s.code; return 'new'; end if;
end $$;
revoke all on function public.town_stock_set(text,numeric,date) from public, anon, authenticated;
grant execute on function public.town_stock_set(text,numeric,date) to service_role;
revoke all on function public.town_stock_trade(bigint,text,text,text,int) from public;
grant execute on function public.town_stock_trade(bigint,text,text,text,int) to anon, authenticated;
revoke all on function public.town_stock_list() from public;
grant execute on function public.town_stock_list() to anon, authenticated;

-- 每個平日台灣時間 15:00、17:00、20:00 呼叫 town-stock 抓收盤價（重複抓沒關係）；沒有 pg_cron／pg_net 就略過
do $c$
begin
  create extension if not exists pg_net; create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'town-stock-close';
  perform cron.schedule('town-stock-close', '0 7,9,12 * * 1-5',
    $j$ select net.http_post(url := 'https://gerqdagicybtyilihvvm.supabase.co/functions/v1/town-stock', body := '{}'::jsonb, headers := '{"Content-Type":"application/json","apikey":"sb_publishable_bPvbJFXUM_Ax2iPLeTS5zw_foV60x5y"}'::jsonb) $j$);
exception when others then raise notice '排程沒設成功（%），請手動設定', sqlerrm;
end $c$;
