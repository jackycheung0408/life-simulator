-- 小豬賭場階段 D（2026-11-23）：新增四款籌碼制遊戲 三公 sangong、十八啦 shiba、賽豬 pigrace、牌九 pj_start／pj_play。可重複執行。
--   需要 town_casino.sql（籌碼制）、town_casino2.sql。本檔重建 town_casino（只多四款的路由與白名單，其餘與 town_casino.sql 現行版本相同）與 town_casino_norm，
--   新遊戲全在 town_cgame3；呼叫前 town_casino 已把 money 換成籌碼。押注最少 50，籌碼不夠擋、入獄擋、睡覺擋、casino 功能開關擋（在 town_casino）。
--   期望值（拿回／押注，精確窮舉，寫在 town/test_casino3.js 也會重算）：
--   三公：6 張牌取自同一副 52 張。牌型 大三公（三張同點）> 小三公（三張都是 J／Q／K 但不同點）> 點數 9～0（A=1、2～9 原點、10／J／Q／K=0、三張加總取個位）。
--     同點比最大牌（K 最大，A 最小），仍同則平手退注；贏拿回 ×1.95（floor）。贏 45.11%（同點比最大牌之後 49.46%）、平手 1.07%，期望 0.9753（floor 取整只會更低）。
--   十八啦：4 顆骰。一對＋兩顆不同點→點數＝另兩顆相加（3～11）；兩對→點數＝較大那一對的兩顆相加；四顆同點＝「通殺」最大；三顆同點或四顆都不同→重擲。
--     比點數，同點平手退注；贏拿回 ×1.95。有效結果 816 種（四同 6、一對 720、兩對 90）：贏 44.18%、平手 11.63%，期望 0.9779。
--   賽豬：6 隻小豬勝率 30／25／20／13／8／4%（Plackett–Luce 依序抽名次）。單勝賠率 ×3.1／3.8／4.7／7.3／11.8／23.7（floor(0.95／勝率) 取 1 位）期望 0.930～0.950；
--     前二名賠率 ×1.7／1.9／2.3／3.4／5.3／10.5 期望 0.929～0.949。全部 ≤ 0.95。
--   牌九（簡化版，32 張：11 種文牌各 2 張＋10 種武牌各 1 張）：玩家和莊家各 4 張，分成兩墩（每墩 2 張），後墩（較大者）比後墩、前墩比前墩。
--     墩大小：至尊（丁三 1-2＋二四 2-4）> 文牌對子（天、地、人、鵝、梅、長三、板凳、斧頭、紅頭十、高腳七、零霖六）> 點數（兩張點數相加取個位 9～0，同點比較大的那張牌）；墩平手算莊家贏。
--     兩墩皆贏拿回 ×1.75（floor）、一勝一負平手退注、兩墩皆輸輸掉押注。莊家固定分法：三種分法中前墩（小墩）最大者，同則後墩最大者。
--     玩家看到自己 4 張後選分法（3 種），C(32,4)=35960 手對莊家 C(28,4)=20475 手窮舉，玩家最佳策略期望 0.9795（隨便分更低）。

create or replace function public.town_casino_norm(g text) returns text language sql immutable as $$
  select case when g like 'hl\_%' then 'hl' when g like 'bj\_%' then 'bj' when g like 'dg\_%' then 'dg' when g like 'pj\_%' then 'pj' else g end
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
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if game not in ('hl_start','hl_guess','wheel','bj_start','bj_hit','bj_stand','dice','slots','keno','bacc','niu','dg_info','dg_start','dg_play','sangong','shiba','pigrace','pj_start','pj_play') then raise exception '沒有這個遊戲'; end if;
  if public.town_is_off(r.town_id, 'casino') then raise exception '這個小鎮沒有開賭場'; end if;
  if r.place <> 'casino' then raise exception '賭場在小豬賭場，走過去再玩'; end if;
  v_bet := game in ('hl_start','wheel','bj_start','dice','slots','keno','bacc','niu','dg_play','sangong','shiba','pigrace','pj_start');
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
  else res := public.town_cgame(rid, pin, game, bet, choice); end if;
  select p.money, p.items into m1, its from public.town_residents p where p.id = rid;
  cs := coalesce(its->'cas','{}'::jsonb) || jsonb_build_object('ch', m1);
  if game <> 'dg_info' then
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
    v_pend := (its ? 'hlg') or (its ? 'bj') or (its ? 'pj');
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


-- 三公：牌 = 花色*100+點數；回傳 牌型*10000+點數*100+最大牌（大三公、小三公只比牌型）
create or replace function public.town_sg_cls(c1 int, c2 int, c3 int) returns int language sql immutable as $$
  select case
    when (c1 % 100) = (c2 % 100) and (c2 % 100) = (c3 % 100) then 30000
    when (c1 % 100) >= 11 and (c2 % 100) >= 11 and (c3 % 100) >= 11 then 20000
    else 10000 + (((case when c1 % 100 >= 10 then 0 else c1 % 100 end) + (case when c2 % 100 >= 10 then 0 else c2 % 100 end) + (case when c3 % 100 >= 10 then 0 else c3 % 100 end)) % 10) * 100 + greatest(c1 % 100, c2 % 100, c3 % 100) end
$$;

-- 十八啦：擲到有效為止；回傳 {d1,d2,d3,d4,值}，值 100 = 四顆同點
create or replace function public.town_sb_roll() returns int[] language plpgsql volatile as $$
declare d int[]; n int; sums int; mx int;
begin
  loop
    d := array[1 + floor(random() * 6)::int, 1 + floor(random() * 6)::int, 1 + floor(random() * 6)::int, 1 + floor(random() * 6)::int];
    select count(distinct e) into n from unnest(d) e;
    if n = 1 then return d || 100; end if;
    if n = 3 then  -- 一對 + 兩顆不同點
      select sum(e) into sums from unnest(d) e where (select count(*) from unnest(d) f where f = e) = 1;
      return d || sums;
    end if;
    if n = 2 and (select max(c) from (select count(*) c from unnest(d) e group by e) q) = 2 then  -- 兩對
      select max(e) into mx from unnest(d) e;
      return d || (2 * mx);
    end if;
  end loop;
end $$;

-- 賽豬：依勝率依序抽出完整名次（Plackett–Luce），回傳 1～6 的名次排列（第一個 = 冠軍）
create or replace function public.town_pr_order() returns int[] language plpgsql volatile as $$
declare w int[] := array[30,25,20,13,8,4]; used boolean[] := array[false,false,false,false,false,false]; ord int[] := '{}'; tot int; rr numeric; acc int; i int; s int; pick int;
begin
  for s in 1..6 loop
    select sum(w[g]) into tot from generate_series(1,6) g where not used[g];
    rr := random() * tot; acc := 0; pick := null;
    for i in 1..6 loop
      if not used[i] then acc := acc + w[i]; if pick is null and rr < acc then pick := i; end if; end if;
    end loop;
    if pick is null then pick := (select min(g) from generate_series(1,6) g where not used[g]); end if;
    used[pick] := true; ord := ord || pick;
  end loop;
  return ord;
end $$;

-- 牌九：牌 id 0～31；id 0～21 是 11 種文牌各 2 張（2i、2i+1），id 22～31 是 10 種武牌。type 0～20，數字越小越大
create or replace function public.town_pj_type(t int) returns int language sql immutable as $$ select case when t < 22 then t / 2 else t - 11 end $$;
create or replace function public.town_pj_pips(t int) returns int language sql immutable as $$
  select (array[12,2,8,4,10,6,4,11,10,7,6, 9,9,8,8,7,7,5,5,3,6])[public.town_pj_type(t) + 1]
$$;
create or replace function public.town_pj_dun(t1 int, t2 int) returns int language sql immutable as $$
  select case
    when (public.town_pj_type(t1) = 19 and public.town_pj_type(t2) = 20) or (public.town_pj_type(t1) = 20 and public.town_pj_type(t2) = 19) then 2000
    when public.town_pj_type(t1) = public.town_pj_type(t2) and public.town_pj_type(t1) <= 10 then 1000 + 10 * (21 - public.town_pj_type(t1))
    else 100 * ((public.town_pj_pips(t1) + public.town_pj_pips(t2)) % 10) + greatest(21 - public.town_pj_type(t1), 21 - public.town_pj_type(t2)) end
$$;
-- 三種分法 (01|23)(02|13)(03|12) 的 [大墩,小墩]
create or replace function public.town_pj_split(h int[], s int) returns int[] language plpgsql immutable as $$
declare ua int; ub int;
begin
  if s = 0 then ua := public.town_pj_dun(h[1], h[2]); ub := public.town_pj_dun(h[3], h[4]);
  elsif s = 1 then ua := public.town_pj_dun(h[1], h[3]); ub := public.town_pj_dun(h[2], h[4]);
  else ua := public.town_pj_dun(h[1], h[4]); ub := public.town_pj_dun(h[2], h[3]); end if;
  return array[greatest(ua, ub), least(ua, ub)];
end $$;
-- 莊家分法：小墩最大者，同則大墩最大者（嚴格大於才換，所以同分取先出現的）
create or replace function public.town_pj_dealer(h int[]) returns int language plpgsql immutable as $$
declare b int := 0; s int; a int[]; c int[];
begin
  a := public.town_pj_split(h, 0);
  for s in 1..2 loop
    c := public.town_pj_split(h, s);
    if c[2] > a[2] or (c[2] = a[2] and c[1] > a[1]) then a := c; b := s; end if;
  end loop;
  return b;
end $$;

create or replace function public.town_cgame3(rid bigint, pin text, game text, bet int default 0, choice text default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; res jsonb; win int := 0; cd int[]; pc int; bc int; pr int[]; br int[]; ps int; ds int; st jsonb; ph int[]; dh int[]; sp int; pd int[]; dd int[]; hw boolean; lw boolean; ordr int[]; wi int; k int; m10 int; pw int[]; mw int[];
  win10 int[] := array[31,38,47,73,118,237]; two10 int[] := array[17,19,23,34,53,105];
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if public.town_jailed(r) then raise exception '你在牢裡，不能賭博'; end if;
  if coalesce(current_setting('town.casino', true), '') <> '1' then raise exception '押錢遊戲要在賭場玩'; end if;
  if r.place <> 'casino' then raise exception '賭場在小豬賭場，走過去再玩'; end if;
  if game not in ('sangong','shiba','pigrace','pj_start','pj_play') then raise exception '沒有這個遊戲'; end if;
  if game <> 'pj_play' then
    if bet is null or bet < 50 then raise exception '押注最少 €50'; end if;
    if r.money < bet then raise exception '籌碼不夠'; end if;
    r.money := r.money - bet;
  end if;

  if game = 'sangong' then
    select array_agg(c) into cd from (select s * 100 + n as c from generate_series(1,4) s, generate_series(1,13) n order by random() limit 6) q;
    pc := public.town_sg_cls(cd[1], cd[2], cd[3]); bc := public.town_sg_cls(cd[4], cd[5], cd[6]);
    if pc > bc then win := floor(bet * 39 / 20)::int; elsif pc = bc then win := bet; end if;
    res := jsonb_build_object('p', to_jsonb(cd[1:3]), 'b', to_jsonb(cd[4:6]), 'pc', pc, 'bc', bc, 'win', win, 'bet', bet);

  elsif game = 'shiba' then
    pr := public.town_sb_roll(); br := public.town_sb_roll();
    if pr[5] > br[5] then win := floor(bet * 39 / 20)::int; elsif pr[5] = br[5] then win := bet; end if;
    res := jsonb_build_object('p', to_jsonb(pr[1:4]), 'b', to_jsonb(br[1:4]), 'pv', pr[5], 'bv', br[5], 'win', win, 'bet', bet);

  elsif game = 'pigrace' then
    if coalesce(choice, '') !~ '^[wt]:[1-6]$' then raise exception '選一隻小豬'; end if;
    k := substr(choice, 3)::int;
    ordr := public.town_pr_order();
    if substr(choice, 1, 1) = 'w' then
      if ordr[1] = k then win := floor(bet * win10[k] / 10)::int; end if;
    else
      if k = ordr[1] or k = ordr[2] then win := floor(bet * two10[k] / 10)::int; end if;
    end if;
    res := jsonb_build_object('order', to_jsonb(ordr), 'pick', choice, 'win', win, 'bet', bet);

  elsif game = 'pj_start' then
    select array_agg(v) into cd from (select v from generate_series(0,31) v order by random() limit 8) q;
    r.items := jsonb_set(r.items, '{pj}', jsonb_build_object('p', to_jsonb(cd[1:4]), 'd', to_jsonb(cd[5:8]), 'b', bet));
    update public.town_residents set money = r.money, items = r.items, seen_at = now() where id = rid;
    return json_build_object('game', jsonb_build_object('p', to_jsonb(cd[1:4]), 'bet', bet), 'money', r.money);

  elsif game = 'pj_play' then
    st := r.items->'pj'; if st is null then raise exception '先發牌'; end if;
    if coalesce(choice, '') not in ('0','1','2') then raise exception '選一種分法'; end if;
    select array_agg(e::int order by o) into ph from jsonb_array_elements_text(st->'p') with ordinality t(e, o);
    select array_agg(e::int order by o) into dh from jsonb_array_elements_text(st->'d') with ordinality t(e, o);
    bet := (st->>'b')::int; sp := choice::int;
    pd := public.town_pj_split(ph, sp);
    k := public.town_pj_dealer(dh); dd := public.town_pj_split(dh, k);
    hw := pd[1] > dd[1]; lw := pd[2] > dd[2];
    win := case when hw and lw then floor(bet * 7 / 4)::int when hw or lw then bet else 0 end;
    r.items := r.items - 'pj';
    res := jsonb_build_object('p', to_jsonb(ph), 'd', to_jsonb(dh), 'split', sp, 'dsplit', k, 'ph', pd[1], 'pl', pd[2], 'dhs', dd[1], 'dl', dd[2], 'hw', hw, 'lw', lw, 'win', win, 'bet', bet);
  end if;

  r.money := r.money + win; r.fun := least(100, r.fun + 3);
  if win - bet >= 10000 then insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, rid, 'luck', r.name || ' 在賭場淨賺了 €' || (win - bet) || ' 🎰'); end if;
  update public.town_residents set money = r.money, fun = r.fun, items = r.items, seen_at = now() where id = rid;
  return json_build_object('game', res, 'money', r.money);
end $$;

revoke all on function public.town_casino_norm(text), public.town_sg_cls(int,int,int), public.town_sb_roll(), public.town_pr_order(), public.town_pj_type(int), public.town_pj_pips(int), public.town_pj_dun(int,int), public.town_pj_split(int[],int), public.town_pj_dealer(int[]) from public, anon, authenticated;
revoke all on function public.town_cgame3(bigint,text,text,int,text) from public, anon, authenticated;
revoke all on function public.town_casino(bigint,text,text,int,text) from public;
grant execute on function public.town_casino(bigint,text,text,int,text) to anon, authenticated;
