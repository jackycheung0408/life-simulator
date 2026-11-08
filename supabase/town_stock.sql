-- 小豬鎮股市（證券交易所，大富翁式簡單版）：先執行 town.sql，再執行這個檔案；可以重複執行
-- 8 檔虛構股票，全天開市，買賣沒有手續費也沒有稅，賣了馬上拿錢。
-- 價格：每 10 分鐘走一步（伺服器用 random 抽，全鎮同價，玩家買賣不影響價格），小機率出現利多／利空消息，長期會慢慢回到基準價附近（限制在 0.4～2.5 倍）。
-- 不用排程：有人看盤或買賣時自動補算（最多補 6 小時）。
-- 防洗錢：沒有玩家之間的交易；單筆 ≤ 30000、每人每天成交額 ≤ 60000。
-- 持股存 items.st = {h:{代號:{q:股數, c:總成本}}, dv:{d:日期, v:今日成交額}}（缺值用預設，不重置任何人）。

-- 清掉舊版（真實股價版，從未對外開放過資料）
drop table if exists public.town_stocks;
drop table if exists public.town_stock_meta;
drop function if exists public.town_stock_set(text,numeric,date);
drop function if exists public.town_stock_price(text);
drop function if exists public.town_stock_tick(numeric);
drop function if exists public.town_add_bdays(date,int);
do $c$ begin perform cron.unschedule(jobid) from cron.job where jobname = 'town-stock-close'; exception when others then null; end $c$;

create table if not exists public.town_market (
  code text primary key, name text not null, vol numeric not null, base numeric not null, price numeric not null,
  hist jsonb not null default '[]'::jsonb, stepped timestamptz not null default now()
);
create table if not exists public.town_market_news (
  id bigint generated always as identity primary key, at timestamptz not null default now(), code text not null, msg text not null, pct int not null
);
alter table public.town_market enable row level security;
alter table public.town_market_news enable row level security;
revoke all on public.town_market, public.town_market_news from anon, authenticated;

-- code 對應前端圖示；vol = 波動倍率
insert into public.town_market(code,name,vol,base,price,hist) values
 ('pork','豬肉公司',0.6,50,50,'[50]'),('coffee','咖啡連鎖',0.8,80,80,'[80]'),('bank','小豬銀行',0.5,120,120,'[120]'),('egg','蛋蛋食品',0.7,30,30,'[30]'),
 ('mud','泥巴建設',1.0,20,20,'[20]'),('chip','豬豬電子',1.5,150,150,'[150]'),('air','雲朵航空',1.4,40,40,'[40]'),('moon','月亮科技',1.8,100,100,'[100]')
on conflict (code) do nothing;

create or replace function public.town_px(p numeric) returns int language sql immutable as $$ select greatest(1, round(p))::int $$;

-- 補算價格：每檔每 10 分鐘一步；鎖住列，同時間只會有一個人在算
create or replace function public.town_market_step() returns void language plpgsql security definer set search_path = public as $$
declare s record; k int; n int; p numeric; z numeric; sh numeric; h jsonb; up text[] := array['新產品大賣','拿到大訂單','老闆宣布加薪','上了報紙頭條','挖到寶藏'];
  dn text[] := array['工廠淹水','被爆出醜聞','傳出老闆跑路','進貨出問題','被野狗咬壞機器'];
begin
  for s in select * from public.town_market order by code for update loop
    n := least(36, floor(extract(epoch from now() - s.stepped) / 600)::int);
    if n <= 0 then continue; end if;
    p := s.price; h := s.hist;
    for k in 1..n loop
      z := (random() + random() + random() - 1.5) * 2;
      p := p * exp(0.010 * s.vol * z - 0.003 * ln(p / s.base));
      if random() < 0.02 then
        sh := (0.05 + random() * 0.07) * case when random() < .5 then 1 else -1 end;
        p := p * (1 + sh);
        insert into public.town_market_news(code, msg, pct) values (s.code, s.name || ' ' || case when sh > 0 then up[1 + floor(random()*5)::int] || '，股價大漲' else dn[1 + floor(random()*5)::int] || '，股價大跌' end || '！', round(sh * 100)::int);
      end if;
      p := greatest(s.base * 0.4, least(s.base * 2.5, p));
      h := h || to_jsonb(round(p, 2));
    end loop;
    if jsonb_array_length(h) > 36 then
      select jsonb_agg(x order by o) into h from jsonb_array_elements(h) with ordinality t(x, o) where o > jsonb_array_length(h) - 36;
    end if;
    update public.town_market set price = p, hist = h,
      stepped = case when now() - s.stepped > interval '6 hours' then now() else s.stepped + n * interval '10 minutes' end where code = s.code;
  end loop;
  delete from public.town_market_news where at < now() - interval '2 days';
end $$;
revoke all on function public.town_market_step() from public, anon, authenticated;

-- 行情（不用密碼）：價格、6 小時前的價格、走勢、最近消息
create or replace function public.town_stock_list() returns json language plpgsql security definer set search_path = public as $$
begin
  perform public.town_market_step();
  return json_build_object(
    'stocks', (select coalesce(json_agg(json_build_object('code', code, 'name', name, 'price', public.town_px(price), 'ref', public.town_px((hist->>0)::numeric), 'hist', hist) order by base), '[]'::json) from public.town_market),
    'news', (select coalesce(json_agg(json_build_object('msg', msg, 'pct', pct, 'at', at) order by at desc), '[]'::json) from (select * from public.town_market_news order by at desc limit 6) q));
end $$;

-- 買賣（要在證券交易所）；op = buy / sell
create or replace function public.town_stock_trade(rid bigint, pin text, op text, code text, qty int) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; s public.town_market; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); p int; amt int; h jsonb; q int; c int; dv int; st jsonb; msg text; part int;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if op not in ('buy','sell') then raise exception '沒有這個操作'; end if;
  if public.town_is_off(r.town_id, 'stock') then raise exception '這個小鎮沒有開證券交易所'; end if;
  if r.place <> 'stock' then raise exception '要在證券交易所才能買賣'; end if;
  if qty is null or qty < 1 or qty > 1000 then raise exception '股數不對'; end if;
  perform public.town_market_step();
  select * into s from public.town_market m where m.code = town_stock_trade.code;
  if not found then raise exception '沒有這檔股票'; end if;
  r := public.town_rent(r); r := public.town_stock_settle(r);
  p := public.town_px(s.price); amt := p * qty;
  if amt > 30000 then raise exception '單筆最多 NT$30,000'; end if;
  dv := case when r.items->'st'->'dv'->>'d' = today then coalesce((r.items->'st'->'dv'->>'v')::int,0) else 0 end;
  if dv + amt > 60000 then raise exception '今天買賣夠多了（一天最多 NT$60,000），明天再來'; end if;
  st := coalesce(r.items->'st', '{}'::jsonb); h := coalesce(st->'h', '{}'::jsonb);
  q := coalesce((h->s.code->>'q')::int, 0); c := coalesce((h->s.code->>'c')::int, 0);
  if op = 'buy' then
    if r.money < amt then raise exception '錢不夠（要 NT$%）', amt; end if;
    r.money := r.money - amt;
    h := jsonb_set(h, array[s.code], jsonb_build_object('q', q + qty, 'c', c + amt));
    msg := '買進 ' || s.name || ' ' || qty || ' 股，花 NT$' || amt;
  else
    if q < qty then raise exception '你只有 % 股', q; end if;
    part := round(c::numeric * qty / q)::int;
    r.money := r.money + amt;
    if q - qty = 0 then h := h - s.code; else h := jsonb_set(h, array[s.code], jsonb_build_object('q', q - qty, 'c', c - part)); end if;
    msg := '賣出 ' || s.name || ' ' || qty || ' 股，拿到 NT$' || amt || case when amt - part >= 0 then '（賺 ' else '（賠 ' end || abs(amt - part) || '）';
    if amt - part >= 2000 then insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, rid, 'luck', r.name || ' 賣 ' || s.name || ' 賺了 NT$' || (amt - part)); end if;
  end if;
  st := jsonb_set(jsonb_set(st, '{h}', h), '{dv}', jsonb_build_object('d', today, 'v', dv + amt));
  r.items := jsonb_set(r.items, '{st}', st);
  update public.town_residents set money = r.money, items = r.items, seen_at = now() where id = rid;
  return json_build_object('ok', true, 'msg', msg, 'price', p, 'money', r.money);
end $$;
revoke all on function public.town_stock_trade(bigint,text,text,text,int) from public;
grant execute on function public.town_stock_trade(bigint,text,text,text,int) to anon, authenticated;
revoke all on function public.town_stock_list() from public;
grant execute on function public.town_stock_list() to anon, authenticated;
