-- 小豬賭場（階段 A，2026-11-22 設計、使用者核准）：街機的「押錢遊戲」搬進獨立設施 casino，加上押注上限與風險控管。可重複執行。
--   設施：casino「賭場」（地圖 [66,8,5,5]、門 (68,13)），鎮長可用功能開關 casino 關掉。廣場街機只留猜拳與單機。
--   押錢遊戲（10 種，規則不動）：比大小 hl、輪盤 wheel、21 點 bj、骰子 dice、老虎機 slots、賓果 bingo、百家樂 bacc、射龍門 dg、妞妞 niu
--   入口：RPC town_casino(rid,pin,game,bet,choice) 包住 town_game／town_game2（內部用交易設定 town.casino=1 通過它們的位置與功能檢查；
--         直接呼叫 town_game／town_game2 玩押錢遊戲會被擋）。town_casino_state(rid,pin,op,val)：view／budget／rest。
--   押注上限隨財富：max(10000, min(50000, 現金 1% 取到 50 的倍數))，最少 50（正式站原本的單注上限就是 10000，不降低）。
--   風險控管（全部在伺服器）：
--     每日預算：預設 max(2000, 當天第一次進賭場時現金的 5%)，可調 500～當天起始現金的 20%；已經開始玩之後只能調低不能加碼。
--     每日淨輸上限：就是預算與起始現金 20% 的較小者，超過整天不能再押；每一注（含最多賠 3 倍的妞妞、射龍門）都不能讓淨輸超過上限。
--     冷靜：30 分鐘內淨輸 ≥ 該窗口起始現金的 10%（至少 €1000），強制休息 30 分鐘。
--     自我排除：24 小時或 7 天，不能取消。
--     回合間隔：開局至少間隔 3 秒。
--   輸贏記錄：town_casino_log（每人每天每遊戲：局數、總押注、淨輸贏），之後才量得出賭場吸走多少錢。
--   莊家盈餘：非射龍門遊戲當天淨輸的 50% 進鎮基金（fund_log.casino），另外 50% 銷毀（不還給任何人）。射龍門是玩家對玩家彩池，不算在內（階段 C 改莊家制）。
--   狀態存在 items.cs：d 日期、s0 當天起始現金、b 預算、t 上次開局、x 自我排除到、cd 冷靜到、w0／mw 30 分鐘視窗、fd／fp 盈餘已進基金。
-- 這個檔會用下面的 do 區塊「就地修改」正式站目前的 town_game／town_game2（不複製整個函式，所以不管它們被改成什麼版本都能套用，可重複執行）：
--   錢類遊戲要 town.casino=1 才通過、位置改 casino、功能開關改 casino、單注上限改 town_casino_maxbet；猜拳留在廣場（上限不變 10000）。
--   另外把 casino 加進地點名稱、功能清單、可前往地點（town_place_name、town_features、town_act 的 move）。

create table if not exists public.town_casino_log (
  rid bigint not null, day text not null, game text not null,
  rounds int not null default 0, wagered bigint not null default 0, net bigint not null default 0,
  primary key (rid, day, game)
);
alter table public.town_casino_log enable row level security;
revoke all on public.town_casino_log from anon, authenticated;

-- 就地修改 town_game／town_game2 與地點、功能清單（可重複執行：已改過就略過）
do $do$
declare f record; d text; d0 text; n int; rec record;
  blk_old text := $o$  if public.town_is_off(r.town_id, 'arcade') then raise exception '這個小鎮沒有開街機'; end if;
  if r.place <> 'plaza' then raise exception '街機在小豬廣場，走過去再玩'; end if;$o$;
  blk_new text := $n$  -- 押錢遊戲在賭場（由 town_casino 設交易設定 town.casino=1 才通過）；猜拳留在廣場街機
  if game <> 'rps' and coalesce(current_setting('town.casino', true), '') <> '1' then raise exception '押錢遊戲搬到小豬賭場了，走到賭場再玩'; end if;
  if game = 'rps' and public.town_is_off(r.town_id, 'arcade') then raise exception '這個小鎮沒有開街機'; end if;
  if game <> 'rps' and public.town_is_off(r.town_id, 'casino') then raise exception '這個小鎮沒有開賭場'; end if;
  if game = 'rps' and r.place <> 'plaza' then raise exception '街機在小豬廣場，走過去再玩'; end if;
  if game <> 'rps' and r.place <> 'casino' then raise exception '賭場在小豬賭場，走過去再玩'; end if;$n$;
  bet_new text := $n$if bet is null or bet < 50 or bet > (case when game = 'rps' then 10000 else public.town_casino_maxbet(r.money) end) then raise exception '押注要在 €50～€% 之間', (case when game = 'rps' then 10000 else public.town_casino_maxbet(r.money) end); end if;$n$;
begin
  for f in select p.oid, p.proname from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('town_game','town_game2') loop
    d := pg_get_functiondef(f.oid);
    if position('town.casino' in d) = 0 then
      d0 := d;
      d := replace(d, blk_old, blk_new);
      d := regexp_replace(d, $re$if bet is null or bet < 50 or bet > [0-9]+ then raise exception '押注要在 €50～€[0-9]+ 之間'; end if;$re$, bet_new);
      if position('town.casino' in d) = 0 or position('town_casino_maxbet' in d) = 0 then raise exception '% 的位置檢查或押注上限找不到要改的文字，請人工處理', f.proname; end if;
      execute d;
    end if;
  end loop;
  for rec in select * from (values
    ($o$when p = 'townhall' then '市政廳' else '路上' end$o$, $n$when p = 'townhall' then '市政廳' when p = 'casino' then '賭場' else '路上' end$n$, $c$when p = 'casino'$c$),
    ($o$'arcade','rafi','stock'$o$, $n$'arcade','casino','rafi','stock'$n$, $c$'arcade','casino'$c$),
    ($o$dest in ('plaza','restaurant','market','office','park','street','cafe'$o$, $n$dest in ('plaza','casino','restaurant','market','office','park','street','cafe'$n$, $c$dest in ('plaza','casino','restaurant','market','office'$c$),
    ($o$if dest in ('plaza','restaurant','market','park','cafe'$o$, $n$if dest in ('plaza','casino','restaurant','market','park','cafe'$n$, $c$if dest in ('plaza','casino','restaurant','market','park'$c$)
  ) as t(o, nw, chk) loop
    for f in select p.oid from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname not in ('town_game','town_game2') and position(rec.o in p.prosrc) > 0 and position(rec.chk in p.prosrc) = 0 loop
      d := replace(pg_get_functiondef(f.oid), rec.o, rec.nw); execute d;
    end loop;
  end loop;
end $do$;

create or replace function public.town_casino_maxbet(m bigint) returns int language sql immutable as $$
  select greatest(10000, least(50000, (floor(m * 0.01 / 50) * 50)::bigint))::int
$$;
create or replace function public.town_casino_norm(g text) returns text language sql immutable as $$
  select case when g like 'hl\_%' then 'hl' when g like 'bj\_%' then 'bj' when g like 'dg\_%' then 'dg' else g end
$$;

-- 今天的額度：s0 當天起始現金、b 預算、cap 起始現金的 20%、limit = min(預算, cap)、loss 今天淨輸、room 還能輸多少、maxBet 單注上限
create or replace function public.town_casino_calc(r public.town_residents) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_day text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); cs jsonb := coalesce(r.items->'cs','{}'::jsonb);
  v_s0 bigint; v_b int; v_cap int; v_limit int; v_loss bigint;
begin
  if cs->>'d' = v_day then v_s0 := coalesce((cs->>'s0')::bigint, r.money); v_b := (cs->>'b')::int; else v_s0 := r.money; v_b := null; end if;
  v_b := coalesce(v_b, greatest(2000, floor(v_s0 * 0.05))::int);
  v_cap := greatest(500, floor(v_s0 * 0.2))::int;
  v_limit := least(v_b, v_cap);
  v_loss := greatest(0, -coalesce((select sum(l.net) from public.town_casino_log l where l.rid = r.id and l.day = v_day), 0));
  return jsonb_build_object('s0', v_s0, 'b', v_b, 'cap', v_cap, 'limit', v_limit, 'loss', v_loss, 'room', v_limit - v_loss, 'maxBet', public.town_casino_maxbet(r.money));
end $$;

create or replace function public.town_casino(rid bigint, pin text, game text, bet int default 0, choice text default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; v_day text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); cs jsonb; c jsonb; its jsonb; res json;
  v_bet boolean; v_round boolean; v_gate boolean; v_mult int := 1; v_need bigint; v_room bigint; m0 bigint; m1 bigint; v_delta bigint;
  w0 timestamptz; mw bigint; v_house bigint; v_tgt bigint; v_fp bigint; v_pend boolean;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if game not in ('hl_start','hl_guess','wheel','bj_start','bj_hit','bj_stand','dice','slots','bingo','bacc','niu','dg_info','dg_start','dg_play') then raise exception '沒有這個遊戲'; end if;
  if public.town_is_off(r.town_id, 'casino') then raise exception '這個小鎮沒有開賭場'; end if;
  if r.place <> 'casino' then raise exception '賭場在小豬賭場，走過去再玩'; end if;
  v_bet := game in ('hl_start','wheel','bj_start','dice','slots','bingo','bacc','niu','dg_play');
  v_gate := v_bet or game = 'dg_start';
  v_round := v_bet and not (game = 'dg_play' and coalesce(choice, '') = 'pass');
  cs := coalesce(r.items->'cs','{}'::jsonb);
  c := public.town_casino_calc(r);
  if v_gate then
    if (cs->>'x') is not null and (cs->>'x')::timestamptz > now() then
      raise exception '你設了自我排除，賭場到 % 才開放', to_char((cs->>'x')::timestamptz at time zone 'Asia/Taipei','MM/DD HH24:MI');
    end if;
    if (cs->>'cd') is not null and (cs->>'cd')::timestamptz > now() then
      raise exception '賭場請你休息一下，還要約 % 分鐘', ceil(extract(epoch from ((cs->>'cd')::timestamptz - now())) / 60)::int;
    end if;
    if (cs->>'t') is not null and now() - (cs->>'t')::timestamptz < interval '3 seconds' then raise exception '慢一點，每局至少間隔 3 秒'; end if;
    v_mult := case when game in ('niu','dg_play') then 3 else 1 end;
    v_need := case when game = 'dg_start' then public.town_dg_entry() else coalesce(bet, 0) * v_mult end;
    v_room := (c->>'room')::bigint;
    if v_room < 50 * (case when v_bet then v_mult else 1 end) then
      raise exception '今天的賭場預算用完了（今天已輸 €%），明天再來', c->>'loss';
    end if;
    if v_need > v_room then raise exception '今天預算只剩 €%，這款最多押 €%', v_room, floor(v_room / v_mult); end if;
    if v_bet and bet > (c->>'maxBet')::int then raise exception '押注最多 €%（現金的 1%%，最少 €10000）', c->>'maxBet'; end if;
  end if;
  perform set_config('town.casino', '1', true);
  m0 := r.money;
  if game in ('bacc','niu','dg_info','dg_start','dg_play') then res := public.town_game2(rid, pin, game, bet, choice);
  else res := public.town_game(rid, pin, game, bet, choice); end if;
  if game = 'dg_info' then return res; end if;
  select p.money, p.items into m1, its from public.town_residents p where p.id = rid;
  v_delta := m1 - m0;
  insert into public.town_casino_log(rid, day, game, rounds, wagered, net)
    values (rid, v_day, public.town_casino_norm(game), (case when v_round then 1 else 0 end), (case when v_round then bet else 0 end), v_delta)
    on conflict on constraint town_casino_log_pkey do update set rounds = public.town_casino_log.rounds + excluded.rounds,
      wagered = public.town_casino_log.wagered + excluded.wagered, net = public.town_casino_log.net + excluded.net;
  cs := coalesce(its->'cs','{}'::jsonb);
  if v_gate then cs := cs || jsonb_build_object('d', v_day, 's0', (c->>'s0')::bigint, 'b', (c->>'b')::int, 't', now()); end if;
  -- 30 分鐘視窗：淨輸 ≥ 視窗起始現金的 10%（至少 1000）就強制休息 30 分鐘
  w0 := (cs->>'w0')::timestamptz; mw := (cs->>'mw')::bigint;
  if w0 is null or now() - w0 > interval '30 minutes' then w0 := now(); mw := m0; end if;
  if mw - m1 >= greatest(1000, floor(mw * 0.10)) then
    cs := cs || jsonb_build_object('cd', now() + interval '30 minutes'); w0 := null; mw := null;
  end if;
  cs := cs - 'w0' - 'mw';
  if w0 is not null then cs := cs || jsonb_build_object('w0', w0, 'mw', mw); end if;
  -- 莊家盈餘：沒有進行中的牌局時，非射龍門遊戲今天淨輸的 50% 進鎮基金（另 50% 銷毀）
  v_pend := (its ? 'hlg') or (its ? 'bj');
  if not v_pend then
    v_house := coalesce((select -sum(l.net) from public.town_casino_log l where l.rid = rid and l.day = v_day and l.game <> 'dg'), 0);
    v_tgt := floor(0.5 * greatest(0, v_house));
    v_fp := case when cs->>'fd' = v_day then coalesce((cs->>'fp')::bigint, 0) else 0 end;
    if v_tgt > v_fp then perform public.town_fund_add(r.town_id, 'casino', (v_tgt - v_fp)::int); v_fp := v_tgt; end if;
    cs := cs || jsonb_build_object('fd', v_day, 'fp', v_fp);
  end if;
  update public.town_residents p set items = jsonb_set(p.items, '{cs}', cs) where p.id = rid;
  r.items := jsonb_set(r.items, '{cs}', cs); r.money := m1;
  c := public.town_casino_calc(r);
  return (res::jsonb || jsonb_build_object('casino', jsonb_build_object('room', c->'room', 'limit', c->'limit', 'loss', c->'loss', 'maxBet', c->'maxBet',
    'cd', case when (cs->>'cd')::timestamptz > now() then cs->>'cd' else null end)))::json;
end $$;

create or replace function public.town_casino_state(rid bigint, pin text, op text default 'view', val int default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; c jsonb; cs jsonb; v_day text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); v_rounds int;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  cs := coalesce(r.items->'cs','{}'::jsonb);
  c := public.town_casino_calc(r);
  if op = 'budget' then
    if val is null or val < 500 then raise exception '預算最少 €500'; end if;
    if val > (c->>'cap')::int then raise exception '預算最多 €%（今天起始現金的 20%%）', c->>'cap'; end if;
    select coalesce(sum(l.rounds), 0) into v_rounds from public.town_casino_log l where l.rid = rid and l.day = v_day;
    if v_rounds > 0 and val > (c->>'b')::int then raise exception '今天已經開始玩了，預算只能調低不能加碼'; end if;
    cs := cs || jsonb_build_object('d', v_day, 's0', (c->>'s0')::bigint, 'b', val);
    update public.town_residents p set items = jsonb_set(p.items, '{cs}', cs) where p.id = rid;
    r.items := jsonb_set(r.items, '{cs}', cs); c := public.town_casino_calc(r);
  elsif op = 'rest' then
    if val is null or val not in (24, 168) then raise exception '自我排除只有 24 小時或 7 天'; end if;
    if (cs->>'x') is not null and (cs->>'x')::timestamptz > now() + make_interval(hours => val) then raise exception '你已經排除得比這更久了'; end if;
    cs := cs || jsonb_build_object('x', now() + make_interval(hours => val));
    update public.town_residents p set items = jsonb_set(p.items, '{cs}', cs) where p.id = rid;
    r.items := jsonb_set(r.items, '{cs}', cs);
  elsif op <> 'view' then raise exception '未知動作'; end if;
  return json_build_object('ok', true, 'money', r.money, 'budget', c->'b', 'limit', c->'limit', 'cap', c->'cap', 'loss', c->'loss', 'room', c->'room', 'maxBet', c->'maxBet',
    'cd', case when (cs->>'cd')::timestamptz > now() then cs->>'cd' else null end, 'x', case when (cs->>'x')::timestamptz > now() then cs->>'x' else null end);
end $$;

revoke all on function public.town_casino_maxbet(bigint), public.town_casino_norm(text), public.town_casino_calc(public.town_residents) from public, anon, authenticated;
revoke all on function public.town_casino(bigint,text,text,int,text), public.town_casino_state(bigint,text,text,int) from public;
grant execute on function public.town_casino(bigint,text,text,int,text), public.town_casino_state(bigint,text,text,int) to anon, authenticated;
