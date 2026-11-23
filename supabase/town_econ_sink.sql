-- 小豬鎮：大額出口（2026-11-23）：遊艇／莊園、每週拍賣會、慈善捐款。要在 town_econ.sql 之後套用，可重複執行。
-- 全部自願、只對新消費生效、錢不夠就擋（不欠款、不變負）、玩家不會死；開關跟小鎮經濟調節同一組（town_flags.econ／town_econ.enabled）。
-- 遊艇 €200,000（稱號「遊艇船長」）、莊園 €600,000（稱號「莊園主人」），每人各買一次；價格乘奢侈品係數 kp；70% 銷毀、30% 進鎮基金（fund_log.econ_lux）。
-- 慈善捐款 €1,000 起，全額進鎮基金（fund_log.donate），累計 1 萬／10 萬／100 萬給稱號「熱心居民」「小鎮慈善家」「小鎮恩人」；不減稅。
-- 拍賣會：每個台灣週（週一 00:00 起）一件限量稱號，底價 = max(5000, 活躍居民人均現金 5%)；出價要比目前最高多 5%（至少 +500）；
--   出價時錢先扣（托管），被超過的人當場退回；週結算（惰性，任何人呼叫 view／bid 時補算）得標者拿稱號，得標金全額進鎮基金（fund_log.auction）；沒人出價就流標。
create table if not exists public.town_auction (
  town_id text primary key references public.town_towns(id) on delete cascade,
  wk text, lot text, base int not null default 5000, bid int not null default 0, bidder bigint, bname text,
  hist jsonb not null default '[]'::jsonb
);
alter table public.town_auction enable row level security;
revoke all on public.town_auction from public, anon, authenticated;

create or replace function public.town_econ_lots() returns text[] language sql immutable as $$
  select array['拍賣會常客','星光豬豬','夜市大亨','鎮上收藏家','金豬傳說','小鎮之光']
$$;
create or replace function public.town_econ_item(k text) returns int[] language sql immutable as $$
  select case k when 'yacht' then array[200000] when 'estate' then array[600000] else null end
$$;
create or replace function public.town_econ_title(k text) returns text language sql immutable as $$
  select case k when 'yacht' then '遊艇船長' when 'estate' then '莊園主人' else null end
$$;
revoke all on function public.town_econ_lots(), public.town_econ_item(text), public.town_econ_title(text) from public, anon, authenticated;

-- 結算上週、開這週的拍賣（可反覆呼叫）
create or replace function public.town_auction_sync(tid text) returns void language plpgsql security definer set search_path = public as $$
declare a public.town_auction; cur text := (date_trunc('week', now() at time zone 'Asia/Taipei'))::date::text; lots text[] := public.town_econ_lots(); mm numeric; msg text;
begin
  insert into public.town_auction(town_id) values (tid) on conflict (town_id) do nothing;
  select * into a from public.town_auction where town_id = tid for update;
  if a.wk = cur then return; end if;
  if a.wk is not null then
    if a.bidder is not null and a.bid > 0 then
      update public.town_residents p set items = jsonb_set(p.items, '{titles}', coalesce(p.items->'titles', '[]'::jsonb) || case when coalesce(p.items->'titles', '[]'::jsonb) ? a.lot then '[]'::jsonb else to_jsonb(a.lot) end) where p.id = a.bidder;
      perform public.town_fund_add(tid, 'auction', a.bid);
      msg := '拍賣會結束：' || coalesce(a.bname, '某位居民') || ' 以 €' || a.bid || ' 標得限量稱號「' || a.lot || '」，款項進鎮基金';
    else
      msg := '拍賣會結束：「' || coalesce(a.lot, '') || '」沒有人出價，流標';
    end if;
    insert into public.town_events(town_id, actor, kind, msg) values (tid, a.bidder, 'fund', msg);
    a.hist := jsonb_build_array(jsonb_build_object('wk', a.wk, 'lot', a.lot, 'bid', a.bid, 'bn', a.bname)) || a.hist;
    while jsonb_array_length(a.hist) > 8 loop a.hist := a.hist - 8; end loop;
  end if;
  select coalesce(avg(p.money + coalesce((p.items->'cas'->>'ch')::numeric, 0)), 0) into mm from public.town_residents p where p.town_id = tid and p.seen_at > now() - interval '14 days';
  update public.town_auction set wk = cur, lot = lots[1 + (extract(week from (now() at time zone 'Asia/Taipei'))::int % array_length(lots, 1))],
    base = greatest(5000, floor(mm * 0.05 / 100)::int * 100), bid = 0, bidder = null, bname = null, hist = a.hist where town_id = tid;
  insert into public.town_events(town_id, actor, kind, msg) select tid, null, 'fund', '本週拍賣會開始：限量稱號「' || z.lot || '」，底價 €' || z.base from public.town_auction z where z.town_id = tid;
end $$;
revoke all on function public.town_auction_sync(text) from public, anon, authenticated;

-- op：view／buy（item = yacht／estate）／donate（num = 金額）／bid（num = 出價）
create or replace function public.town_econ_use(rid bigint, pin text, op text, item text default null, num int default 0) returns json language plpgsql security definer set search_path = public as $$
declare r public.town_residents; tid text; pr int; cost int; fundp int; tt text; a public.town_auction; need int; prev bigint; prevbid int; tot bigint; ttl jsonb; cnt int;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  tid := r.town_id;
  perform public.town_auction_sync(tid);
  if op <> 'view' then
    if not public.town_econ_on(tid) then raise exception '小鎮經濟功能暫時關閉'; end if;
    if r.sleeping then raise exception '你在睡覺，先起床'; end if;
    if public.town_jailed(r) then raise exception '你在監獄裡，花錢也出不去'; end if;
  end if;
  select * into a from public.town_auction where town_id = tid;
  ttl := coalesce(r.items->'titles', '[]'::jsonb);
  if op = 'buy' then
    if public.town_econ_item(item) is null then raise exception '沒有這個商品'; end if;
    if coalesce((r.items->'lx'->>item), '') <> '' then raise exception '你已經有了'; end if;
    pr := public.town_econ_px(tid, (public.town_econ_item(item))[1]);
    if r.money < pr then raise exception '錢不夠，要 €%', pr; end if;
    fundp := floor(pr * 0.3)::int; tt := public.town_econ_title(item);
    update public.town_residents p set money = p.money - pr,
      items = jsonb_set(jsonb_set(p.items, '{lx}', coalesce(p.items->'lx', '{}'::jsonb) || jsonb_build_object(item, to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'))), '{titles}', ttl || case when ttl ? tt then '[]'::jsonb else to_jsonb(tt) end)
      where p.id = rid and p.money >= pr;
    if not found then raise exception '錢不夠，要 €%', pr; end if;
    perform public.town_fund_add(tid, 'econ_lux', fundp);
    insert into public.town_events(town_id, actor, kind, msg) values (tid, rid, 'fund', r.name || ' 買下了' || case item when 'yacht' then '遊艇' else '莊園' end || '（€' || pr || '），拿到稱號「' || tt || '」');
    return json_build_object('ok', true, 'msg', '買下了，稱號「' || tt || '」');
  elsif op = 'donate' then
    if num is null or num < 1000 then raise exception '捐款至少 €1000'; end if;
    update public.town_residents p set money = p.money - num where p.id = rid and p.money >= num;
    if not found then raise exception '錢不夠'; end if;
    perform public.town_fund_add(tid, 'donate', num);
    tot := coalesce((r.items->>'chr')::bigint, 0) + num;
    update public.town_residents p set items = jsonb_set(p.items, '{chr}', to_jsonb(tot)) where p.id = rid;
    for cnt in 1..3 loop
      tt := (array['熱心居民','小鎮慈善家','小鎮恩人'])[cnt];
      if tot >= (array[10000, 100000, 1000000])[cnt] and not (ttl ? tt) then
        update public.town_residents p set items = jsonb_set(p.items, '{titles}', coalesce(p.items->'titles', '[]'::jsonb) || to_jsonb(tt)) where p.id = rid;
        ttl := ttl || to_jsonb(tt);
      end if;
    end loop;
    insert into public.town_events(town_id, actor, kind, msg) values (tid, rid, 'fund', r.name || ' 捐了 €' || num || ' 給鎮基金（累計 €' || tot || '）');
    return json_build_object('ok', true, 'msg', '謝謝你的捐款，累計 €' || tot);
  elsif op = 'bid' then
    need := case when a.bidder is null then a.base else a.bid + greatest(500, ceil(a.bid * 0.05)::int) end;
    if num is null or num < need then raise exception '出價至少要 €%', need; end if;
    if a.bidder = rid then raise exception '你已經是最高價了'; end if;
    update public.town_residents p set money = p.money - num where p.id = rid and p.money >= num;
    if not found then raise exception '錢不夠，要 €%', num; end if;
    prev := a.bidder; prevbid := a.bid;
    if prev is not null then update public.town_residents p set money = least(2000000000, p.money + prevbid) where p.id = prev; end if;
    update public.town_auction set bid = num, bidder = rid, bname = r.name where town_id = tid;
    insert into public.town_events(town_id, actor, target, kind, msg) values (tid, rid, prev, 'fund', r.name || ' 出價 €' || num || ' 競標「' || a.lot || '」');
    return json_build_object('ok', true, 'msg', '出價 €' || num || '（錢先托管，被超過會退回）');
  elsif op <> 'view' then raise exception '不知道要做什麼';
  end if;
  return json_build_object('ok', true,
    'items', (select json_agg(json_build_object('k', k, 'name', case k when 'yacht' then '遊艇' else '莊園' end, 'price', public.town_econ_px(tid, (public.town_econ_item(k))[1]), 'title', public.town_econ_title(k), 'owned', coalesce((r.items->'lx'->>k), '') <> ''))
      from unnest(array['yacht','estate']) k),
    'donated', coalesce((r.items->>'chr')::bigint, 0),
    'auction', json_build_object('lot', a.lot, 'base', a.base, 'bid', a.bid, 'bidder', a.bidder, 'bname', a.bname,
      'min', case when a.bidder is null then a.base else a.bid + greatest(500, ceil(a.bid * 0.05)::int) end, 'wk', a.wk, 'hist', a.hist),
    'money', r.money);
end $$;
revoke all on function public.town_econ_use(bigint,text,text,text,int) from public;
grant execute on function public.town_econ_use(bigint,text,text,text,int) to anon, authenticated;
