-- 小豬賭場階段 E（2026-11-23）：第二批六款籌碼制遊戲 地雷 mines、彈珠台 plinko、飛行器 crash、猜杯子 cups、刮刮樂 scratch、開寶箱 chest。可重複執行。
--   需要 town_casino3.sql、town_casino_fi.sql（town_need_in_pl）。本檔重建 town_casino（多這批的路由、白名單、進行中牌局旗標，其餘同 casino3＋進館檢查），新遊戲全在 town_cgame4。
--   呼叫前 town_casino 已把 money 換成籌碼。押注最少 50，籌碼不夠擋、入獄擋、睡覺擋、casino 功能開關擋、要在賭場且進館。
--   期望值（拿回／押注，精確窮舉；town/test_casino4.js 會重算）：
--   地雷：5×5 共 25 格，開局選地雷數 m（1～6），逐格翻；翻開 k 個安全格的倍率 = 0.97 × C(25,k)／C(25−m,k)，隨時可收手（至少翻 1 格）。
--     翻 k 格全安全的機率剛好是 C(25−m,k)／C(25,k)，所以任何收手策略期望 = 0.97（floor 取整只會更低，單筆賠付封頂 21 億）。狀態存 items.mn（伺服端，地雷位置到結算才給）。
--   彈珠台：12 層，每層左右各 1／2，落點 k（0～12）機率 C(12,k)／4096。倍率表（百分之一）
--     低風險 560,200,140,110,100,100,70,…（對稱）期望 0.9641；中風險 2200,600,290,160,110,75,40,… 期望 0.9574；高風險 20000,3000,600,200,60,30,10,… 期望 0.9652。
--   飛行器：墜毀點 X = 0.97／u（u 在 (0,1) 均勻），取到 0.01 位；X < 1.00 開局就墜毀（機率 3%）；P(X ≥ m) = 0.97／m（m ≥ 1），所以任何時間點收手期望 0.97。
--     倍率隨伺服器時間走 floor(100·exp(0.1·秒))，上限 1000 倍。收手時玩家送自己要的倍率 m'：m' 必須 ≤ 伺服器現在的倍率（還沒到的倍率不能領，延遲不會多拿也不會少拿）；
--     m' ≤ X 才贏。查詢（cr_poll）發現已墜毀就當場結束（輸），所以不能「看到墜毀再補領之前的倍率」。開局後沒收手就關頁面算輸。
--   猜杯子：3 杯 1 球，猜中 ×2.88，期望 0.96。
--   刮刮樂：9 格，三個一樣得獎。獎表（倍率／機率萬分之）2／1400、3／600、5／330、10／120、50／31、500／1，期望 0.9500；開獎先決定獎項，再排出不會多出第二組三連的盤面。
--   開寶箱：5 個寶箱（空 0、×0.5、×0.9、×1.2、×2.2 隨機放），先選一個，莊家再隨機打開另一個（不看內容，不是最小的那個），最後可保留或換成任一個沒開的。
--     被打開的是隨機一箱，所以剩下 4 個（含你選的）對你完全對稱，任何換不換策略期望都 = (0+0.5+0.9+1.2+2.2)／5 = 0.96。

create or replace function public.town_casino_norm(g text) returns text language sql immutable as $$
  select case when g like 'hl\_%' then 'hl' when g like 'bj\_%' then 'bj' when g like 'dg\_%' then 'dg' when g like 'pj\_%' then 'pj'
    when g like 'mn\_%' then 'mn' when g like 'cr\_%' then 'cr' when g like 'ch\_%' then 'ch' else g end
$$;

create or replace function public.town_casino(rid bigint, pin text, game text, bet int default 0, choice text default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; v_day text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); cs jsonb; its jsonb; res json;
  v_bet boolean; v_round boolean; v_gate boolean; v_cash bigint; v_chips bigint; m1 bigint; v_delta bigint;
  v_house bigint; v_tgt bigint; v_fp bigint; v_pend boolean;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  perform public.town_need_in_pl(r, 'casino');
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if game not in ('hl_start','hl_guess','wheel','bj_start','bj_hit','bj_stand','dice','slots','keno','bacc','niu','dg_info','dg_start','dg_play','sangong','shiba','pigrace','pj_start','pj_play','mn_start','mn_pick','mn_cash','mn_state','plinko','cr_start','cr_poll','cr_cash','cups','scratch','ch_start','ch_pick','ch_final','ch_state') then raise exception '沒有這個遊戲'; end if;
  if public.town_is_off(r.town_id, 'casino') then raise exception '這個小鎮沒有開賭場'; end if;
  if r.place <> 'casino' then raise exception '賭場在小豬賭場，走過去再玩'; end if;
  v_bet := game in ('hl_start','wheel','bj_start','dice','slots','keno','bacc','niu','dg_play','sangong','shiba','pigrace','pj_start','mn_start','plinko','cr_start','cups','scratch','ch_start');
  v_gate := v_bet or game = 'dg_start';
  v_round := v_bet and not (game = 'dg_play' and coalesce(choice, '') = 'pass');
  cs := coalesce(r.items->'cas','{}'::jsonb);
  v_cash := r.money; v_chips := coalesce((cs->>'ch')::bigint, 0);
  if v_gate then
    if (cs->>'t') is not null and now() - (cs->>'t')::timestamptz < interval '3 seconds' then raise exception '慢一點，每局至少間隔 3 秒'; end if;
    if v_bet and coalesce(bet, 0) > v_chips then raise exception '籌碼不夠（你有 €% 籌碼），到櫃台用現金換籌碼', v_chips; end if;
  end if;
  -- 暫時把 money 換成籌碼，讓 town_game／town_game2 用籌碼下注；結束後換回現金（同一個交易，出錯整個回滾）
  perform set_config('town.casino', '1', true);
  update public.town_residents p set money = v_chips where p.id = rid;
  -- 路由：比大小、百家樂、妞妞沿用舊函式；輪盤、21 點、骰寶、老虎機、基諾、射龍門是 town_casino2.sql 的新規則 town_cgame
  if game in ('hl_start','hl_guess') then res := public.town_game(rid, pin, game, bet, choice);
  elsif game in ('bacc','niu') then res := public.town_game2(rid, pin, game, bet, choice);
  elsif game in ('sangong','shiba','pigrace','pj_start','pj_play') then res := public.town_cgame3(rid, pin, game, bet, choice);
  elsif game in ('mn_start','mn_pick','mn_cash','mn_state','plinko','cr_start','cr_poll','cr_cash','cups','scratch','ch_start','ch_pick','ch_final','ch_state') then res := public.town_cgame4(rid, pin, game, bet, choice);
  else res := public.town_cgame(rid, pin, game, bet, choice); end if;
  select p.money, p.items into m1, its from public.town_residents p where p.id = rid;
  cs := coalesce(its->'cas','{}'::jsonb) || jsonb_build_object('ch', m1);
  if game not in ('dg_info','mn_state','cr_poll','ch_state') then
    v_delta := m1 - v_chips;
    insert into public.town_casino_log(rid, day, game, rounds, wagered, net)
      values (rid, v_day, public.town_casino_norm(game), (case when v_round then 1 else 0 end), (case when v_round then bet else 0 end), v_delta)
      on conflict on constraint town_casino_log_pkey do update set rounds = public.town_casino_log.rounds + excluded.rounds,
        wagered = public.town_casino_log.wagered + excluded.wagered, net = public.town_casino_log.net + excluded.net;
    if v_gate then cs := cs || jsonb_build_object('t', now()); end if;
    -- 百家樂路單：最近 72 局的結果字串（P 閒、B 莊、T 和），前端畫大路與珠盤路
    if game = 'bacc' then
      cs := cs || jsonb_build_object('bh', right(coalesce(cs->>'bh', '') || (case when (res::jsonb->'game'->>'pt')::int > (res::jsonb->'game'->>'bt')::int then 'P'
        when (res::jsonb->'game'->>'pt')::int < (res::jsonb->'game'->>'bt')::int then 'B' else 'T' end), 72));
    end if;
    -- 30 分鐘視窗：籌碼淨輸 ≥ 視窗起始籌碼的 10%（至少 1000）就強制休息 30 分鐘
    cs := cs - 'cd' - 'w0' - 'mw' - 'x';  -- 已取消連輸強制休息與自我排除（舊資料清掉）
    -- 莊家盈餘：沒有進行中的牌局時，非射龍門遊戲今天淨輸的 50% 進鎮基金（另 50% 銷毀）
    v_pend := (its ? 'hlg') or (its ? 'bj') or (its ? 'pj') or (its ? 'mn') or (its ? 'cr') or (its ? 'cx');
    if not v_pend then
      v_house := coalesce((select -sum(l.net) from public.town_casino_log l where l.rid = rid and l.day = v_day and l.game <> 'dg'), 0);
      v_tgt := floor(0.5 * greatest(0, v_house));
      v_fp := case when cs->>'fd' = v_day then coalesce((cs->>'fp')::bigint, 0) else 0 end;
      if v_tgt > v_fp then perform public.town_fund_add(r.town_id, 'casino', (v_tgt - v_fp)::int); v_fp := v_tgt; end if;
      cs := cs || jsonb_build_object('fd', v_day, 'fp', v_fp);
    end if;
  end if;
  update public.town_residents p set money = v_cash, items = jsonb_set(p.items, '{cas}', cs) where p.id = rid;
  return (res::jsonb || jsonb_build_object('money', v_cash, 'casino', jsonb_build_object('chips', m1, 'bh', coalesce(cs->>'bh', ''))))::json;
end $$;



-- 地雷倍率（numeric，未取整）：k 個安全格
create or replace function public.town_mn_mult(m int, k int) returns numeric language plpgsql immutable as $$
declare acc numeric := 0.97; i int;
begin
  for i in 0..k - 1 loop acc := acc * (25 - i) / (25 - m - i); end loop;
  return acc;
end $$;

-- 飛行器倍率（百分之一）：t 秒
create or replace function public.town_cr_m(t numeric) returns int language sql immutable as $$
  select least(100000, floor(100 * exp(0.1 * greatest(t, 0)))::int)
$$;

create or replace function public.town_cgame4(rid bigint, pin text, game text, bet int default 0, choice text default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; res jsonb; win bigint := 0; st jsonb; mines int[]; opened int[]; m int; k int; idx int; mult numeric; i int; cell int;
  tbl int[]; slot int; path int[]; u numeric; xx int; el numeric; cur int; tier int; sym int[]; pool int[]; lay int[]; vals int[]; pk int; rv int; fin int; cum int; roll int; mp int;
  mn_t numeric[]; settled boolean := false;
  PL_LOW int[] := array[560,200,140,110,100,100,70,100,100,110,140,200,560];
  PL_MID int[] := array[2200,600,290,160,110,75,40,75,110,160,290,600,2200];
  PL_HIGH int[] := array[20000,3000,600,200,60,30,10,30,60,200,600,3000,20000];
  SC_M int[] := array[2,3,5,10,50,500]; SC_P int[] := array[1400,600,330,120,31,1];
  CH_V int[] := array[0,50,90,120,220];
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if public.town_jailed(r) then raise exception '你在牢裡，不能賭博'; end if;
  if coalesce(current_setting('town.casino', true), '') <> '1' then raise exception '押錢遊戲要在賭場玩'; end if;
  if r.place <> 'casino' then raise exception '賭場在小豬賭場，走過去再玩'; end if;
  if game not in ('mn_start','mn_pick','mn_cash','mn_state','plinko','cr_start','cr_poll','cr_cash','cups','scratch','ch_start','ch_pick','ch_final','ch_state') then raise exception '沒有這個遊戲'; end if;
  if game in ('mn_start','plinko','cr_start','cups','scratch','ch_start') then
    if bet is null or bet < 50 then raise exception '押注最少 €50'; end if;
    if r.money < bet then raise exception '籌碼不夠'; end if;
    r.money := r.money - bet;
  end if;

  -- ───── 地雷 ─────
  if game = 'mn_start' then
    if r.items ? 'mn' then raise exception '上一局地雷還沒結束，先繼續玩或收手'; end if;
    m := coalesce(nullif(choice, '')::int, 0);
    if m < 1 or m > 6 then raise exception '地雷數 1～6'; end if;
    select array_agg(v) into mines from (select v from generate_series(0,24) v order by random() limit m) q;
    r.items := jsonb_set(r.items, '{mn}', jsonb_build_object('b', bet, 'm', m, 'x', to_jsonb(mines), 'o', '[]'::jsonb));
    update public.town_residents set money = r.money, items = r.items, seen_at = now() where id = rid;
    return json_build_object('game', jsonb_build_object('bet', bet, 'm', m, 'k', 0, 'next', floor(bet * public.town_mn_mult(m, 1))::bigint, 'mult', 0), 'money', r.money);

  elsif game in ('mn_pick','mn_cash','mn_state') then
    st := r.items->'mn'; if st is null then raise exception '沒有進行中的地雷局'; end if;
    bet := (st->>'b')::int; m := (st->>'m')::int;
    select coalesce(array_agg(e::int), '{}') into opened from jsonb_array_elements_text(st->'o') e;
    k := coalesce(array_length(opened, 1), 0);
    if game = 'mn_state' then
      return json_build_object('game', jsonb_build_object('bet', bet, 'm', m, 'k', k, 'o', st->'o', 'mult', case when k = 0 then 0 else round(public.town_mn_mult(m, k), 4) end, 'cash', case when k = 0 then 0 else floor(bet * public.town_mn_mult(m, k))::bigint end,
        'next', case when k >= 25 - m then 0 else floor(bet * public.town_mn_mult(m, k + 1))::bigint end), 'money', r.money);
    end if;
    select coalesce(array_agg(e::int), '{}') into mines from jsonb_array_elements_text(st->'x') e;
    if game = 'mn_pick' then
      if coalesce(choice, '') !~ '^[0-9]+$' then raise exception '選一格'; end if;
      idx := choice::int; if idx < 0 or idx > 24 then raise exception '選一格'; end if;
      if idx = any(opened) then raise exception '這格翻過了'; end if;
      if idx = any(mines) then
        r.items := r.items - 'mn'; settled := true;
        res := jsonb_build_object('hit', true, 'idx', idx, 'mines', to_jsonb(mines), 'o', st->'o', 'bet', bet, 'win', 0, 'k', k, 'm', m);
      else
        opened := opened || idx; k := k + 1;
        st := jsonb_set(st, '{o}', to_jsonb(opened));
        if k >= 25 - m then  -- 全部安全格翻完，自動收手
          win := least(floor(bet * public.town_mn_mult(m, k))::bigint, 2000000000);
          r.items := r.items - 'mn'; settled := true;
          res := jsonb_build_object('hit', false, 'done', true, 'idx', idx, 'mines', to_jsonb(mines), 'o', to_jsonb(opened), 'bet', bet, 'win', win, 'k', k, 'm', m, 'mult', round(public.town_mn_mult(m, k), 4));
        else
          r.items := jsonb_set(r.items, '{mn}', st);
          update public.town_residents set items = r.items, seen_at = now() where id = rid;
          return json_build_object('game', jsonb_build_object('hit', false, 'idx', idx, 'k', k, 'm', m, 'bet', bet, 'mult', round(public.town_mn_mult(m, k), 4), 'cash', floor(bet * public.town_mn_mult(m, k))::bigint, 'next', floor(bet * public.town_mn_mult(m, k + 1))::bigint), 'money', r.money);
        end if;
      end if;
    else  -- mn_cash
      if k < 1 then raise exception '至少翻開 1 格才能收手'; end if;
      win := least(floor(bet * public.town_mn_mult(m, k))::bigint, 2000000000);
      r.items := r.items - 'mn'; settled := true;
      res := jsonb_build_object('hit', false, 'cashed', true, 'mines', to_jsonb(mines), 'o', to_jsonb(opened), 'bet', bet, 'win', win, 'k', k, 'm', m, 'mult', round(public.town_mn_mult(m, k), 4));
    end if;

  -- ───── 彈珠台 ─────
  elsif game = 'plinko' then
    if coalesce(choice, '') not in ('low','mid','high') then raise exception '選風險：低、中、高'; end if;
    tbl := case choice when 'low' then PL_LOW when 'mid' then PL_MID else PL_HIGH end;
    path := '{}'; slot := 0;
    for i in 1..12 loop cell := (random() < 0.5)::int; path := path || cell; slot := slot + cell; end loop;
    win := floor(bet * tbl[slot + 1] / 100.0)::bigint;
    res := jsonb_build_object('path', to_jsonb(path), 'slot', slot, 'mult', tbl[slot + 1], 'risk', choice, 'win', win, 'bet', bet);

  -- ───── 飛行器 ─────
  elsif game = 'cr_start' then
    u := 1 - random();  -- (0,1]
    xx := least(100000, floor(97.0 / u)::int);  -- 墜毀倍率（百分之一）；< 100 = 開局就墜毀
    r.items := jsonb_set(r.items, '{cr}', jsonb_build_object('b', bet, 'x', xx, 't', extract(epoch from clock_timestamp())));
    update public.town_residents set money = r.money, items = r.items, seen_at = now() where id = rid;
    return json_build_object('game', jsonb_build_object('bet', bet), 'money', r.money);

  elsif game in ('cr_poll','cr_cash') then
    st := r.items->'cr'; if st is null then raise exception '沒有進行中的飛行器'; end if;
    bet := (st->>'b')::int; xx := (st->>'x')::int;
    el := extract(epoch from clock_timestamp()) - (st->>'t')::numeric;
    cur := public.town_cr_m(el);
    if game = 'cr_poll' then
      if xx < cur then  -- 已墜毀：當場結束（輸）
        r.items := r.items - 'cr'; settled := true;
        res := jsonb_build_object('crashed', true, 'x', greatest(xx, 100), 'win', 0, 'bet', bet);
      else
        return json_build_object('game', jsonb_build_object('alive', true, 'm', cur, 'bet', bet), 'money', r.money);
      end if;
    else
      if coalesce(choice, '') !~ '^[0-9]+$' then raise exception '要收手的倍率不對'; end if;
      mp := choice::int;
      if mp < 100 or mp > 100000 then raise exception '倍率不對'; end if;
      if mp > cur then raise exception '還沒飛到這個倍率'; end if;
      r.items := r.items - 'cr'; settled := true;
      if mp <= xx then
        win := floor(bet * mp / 100.0)::bigint;
        res := jsonb_build_object('crashed', false, 'm', mp, 'x', xx, 'win', win, 'bet', bet);
      else
        res := jsonb_build_object('crashed', true, 'm', mp, 'x', greatest(xx, 100), 'win', 0, 'bet', bet);
      end if;
    end if;

  -- ───── 猜杯子 ─────
  elsif game = 'cups' then
    if coalesce(choice, '') !~ '^[0-2]$' then raise exception '選一個杯子'; end if;
    cell := floor(random() * 3)::int;
    if cell = choice::int then win := floor(bet * 288 / 100.0)::bigint; end if;
    res := jsonb_build_object('ball', cell, 'pick', choice::int, 'win', win, 'bet', bet);

  -- ───── 刮刮樂 ─────
  elsif game = 'scratch' then
    roll := 1 + floor(random() * 10000)::int; cum := 0; tier := -1;
    for i in 1..6 loop cum := cum + SC_P[i]; if tier < 0 and roll <= cum then tier := i - 1; end if; end loop;
    if tier >= 0 then
      -- 獎項符號 tier 放 3 個，其餘 6 格從別的符號（各最多 2 個）隨機取
      select array_agg(v order by random()) into pool from (select s as v from generate_series(0,5) s, generate_series(1,2) c where s <> tier) q;
      lay := array[tier, tier, tier] || pool[1:6];
      win := floor(bet * SC_M[tier + 1])::bigint;
    else
      select array_agg(v order by random()) into pool from (select s as v from generate_series(0,5) s, generate_series(1,2) c) q;
      lay := pool[1:9];
    end if;
    select array_agg(v order by random()) into lay from unnest(lay) v;
    res := jsonb_build_object('cells', to_jsonb(lay), 'tier', tier, 'mult', case when tier >= 0 then SC_M[tier + 1] else 0 end, 'win', win, 'bet', bet);

  -- ───── 開寶箱 ─────
  elsif game = 'ch_start' then
    if r.items ? 'cx' then raise exception '上一局寶箱還沒結束，先繼續開'; end if;
    select array_agg(v order by random()) into vals from unnest(CH_V) v;
    r.items := jsonb_set(r.items, '{cx}', jsonb_build_object('b', bet, 'v', to_jsonb(vals), 's', 1));
    update public.town_residents set money = r.money, items = r.items, seen_at = now() where id = rid;
    return json_build_object('game', jsonb_build_object('bet', bet, 's', 1), 'money', r.money);

  elsif game in ('ch_pick','ch_final','ch_state') then
    st := r.items->'cx'; if st is null then raise exception '沒有進行中的寶箱局'; end if;
    bet := (st->>'b')::int;
    select array_agg(e::int order by o) into vals from jsonb_array_elements_text(st->'v') with ordinality t(e, o);
    if game = 'ch_state' then
      return json_build_object('game', jsonb_build_object('bet', bet, 's', (st->>'s')::int, 'pick', st->'p', 'rev', st->'r', 'revv', case when st ? 'r' then vals[(st->>'r')::int + 1] end), 'money', r.money);
    end if;
    if game = 'ch_pick' then
      if (st->>'s')::int <> 1 then raise exception '已經選過了，換箱或維持'; end if;
      if coalesce(choice, '') !~ '^[0-4]$' then raise exception '選一個寶箱'; end if;
      pk := choice::int;
      select e into rv from (select e from generate_series(0,4) e where e <> pk order by random() limit 1) q;
      st := st || jsonb_build_object('s', 2, 'p', pk, 'r', rv);
      r.items := jsonb_set(r.items, '{cx}', st);
      update public.town_residents set items = r.items, seen_at = now() where id = rid;
      return json_build_object('game', jsonb_build_object('bet', bet, 's', 2, 'pick', pk, 'rev', rv, 'revv', vals[rv + 1]), 'money', r.money);
    else
      if (st->>'s')::int <> 2 then raise exception '先選一個寶箱'; end if;
      if coalesce(choice, '') !~ '^[0-4]$' then raise exception '選一個寶箱'; end if;
      fin := choice::int; rv := (st->>'r')::int;
      if fin = rv then raise exception '那個寶箱已經打開了'; end if;
      win := floor(bet * vals[fin + 1] / 100.0)::bigint;
      r.items := r.items - 'cx'; settled := true;
      res := jsonb_build_object('v', to_jsonb(vals), 'pick', (st->>'p')::int, 'rev', rv, 'fin', fin, 'switched', fin <> (st->>'p')::int, 'mult', vals[fin + 1], 'win', win, 'bet', bet);
    end if;
  end if;

  r.money := least(r.money::bigint + win, 2147483647)::int; r.fun := least(100, r.fun + 3);
  if win - bet >= 10000 then insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, rid, 'luck', r.name || ' 在賭場淨賺了 €' || (win - bet) || ' 🎰'); end if;
  update public.town_residents set money = r.money, fun = r.fun, items = r.items, seen_at = now() where id = rid;
  return json_build_object('game', res, 'money', r.money);
end $$;

revoke all on function public.town_casino_norm(text), public.town_mn_mult(int,int), public.town_cr_m(numeric) from public, anon, authenticated;
revoke all on function public.town_cgame4(bigint,text,text,int,text) from public, anon, authenticated;
revoke all on function public.town_casino(bigint,text,text,int,text) from public;
grant execute on function public.town_casino(bigint,text,text,int,text) to anon, authenticated;
