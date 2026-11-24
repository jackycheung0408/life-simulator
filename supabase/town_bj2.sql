-- 小豬賭場 21 點擬真規則（2026-11-24）：加倍、分牌、天生 21 點 3:2。可重複執行。
-- 需要 town_casino2.sql（town_cgame）、town_casino4.sql（town_casino），用 pg_get_functiondef 就地改，找不到錨點整檔失敗、已改過就略過。
--
-- 規則（無限副牌，每張牌獨立）：
--   · 莊家軟 17 要牌（H17）；開局莊家明牌是 A 或 10 點牌時先偷看暗牌：莊家天生 21 點 => 玩家只輸原注（加倍、分牌的錢都還沒下），玩家也天生 21 點則平手退回。
--   · 玩家天生 21 點 3:2（拿回 ×2.5，取代舊的 6:5 ×2.2）。
--   · 加倍：任何兩張首牌（含分牌後，DAS）都能加倍，再補一張牌就停，要多押同額籌碼（籌碼不夠就擋）。
--   · 分牌：點數相同的兩張牌（10、J、Q、K 算同點）可以分牌，要多押同額籌碼，最多 4 手；分 A 每手只再拿一張牌、不能再分、不能再要牌；
--     分牌後的 A＋10 點牌不算天生 21 點，只算一般 21 點（1:1）。沒有保險、沒有投降。
--   · 舊的進行中牌局（單手，沒有 hs 欄）照舊用要牌／停牌結算（走原本的 town_cgame 分支），不丟注。
--
-- 期望值：玩家最佳基本策略的拿回率（以起始押注為底）= 0.9927（優勢 0.73%）
--   精確動態規劃 0.99270，C 語言 1 億局蒙地卡羅（同規則、同策略表）0.99265 ± 0.00012。仍 < 1。
--   基本策略表在前端 town.js 的 BJS（牌桌「規則」浮層與「提示」按鈕顯示）；提示只顯示建議，不自動操作，也不改任何機率。
--   （分牌價值用「最多再分一次」近似，所以實際最佳策略只會比 0.9927 略高一點點，仍遠低於 1。）
-- 動作：bj_start 開局（town_casino 先扣原注）、bj_hit 要牌、bj_stand 停牌、bj_double 加倍、bj_split 分牌。
-- 狀態 items.bj = {bet, d:[莊家明牌], h:暗牌, hs:[{c:[牌], b:這手押注, f:1 已結束, a:1 分A, x:1 加倍}], i:目前手牌索引}；暗牌 h 不回傳給前端。

create or replace function public.town_bj2(r public.town_residents, game text, bet int) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare st jsonb; hs jsonb; h jsonb; h2 jsonb; cs jsonb; i int; n int; k int; up int; hole int; dc jsonb; p int; d int; w int; win int := 0; wag int := 0;
  pbj boolean; dbj boolean; hb int; live boolean := false; a1 int; a2 int; outh jsonb := '[]'::jsonb; dbl boolean; spl boolean;
begin
  if game = 'bj_start' then
    up := public.town_card(); hole := public.town_card();
    cs := jsonb_build_array(public.town_card(), public.town_card());
    pbj := public.town_bj_total(cs) = 21;
    dbj := (up % 100 = 1 and least(hole % 100, 10) = 10) or (least(up % 100, 10) = 10 and hole % 100 = 1);
    if pbj or dbj then
      dc := jsonb_build_array(up, hole);
      w := case when pbj and dbj then bet when pbj then floor(bet * 5 / 2.0)::int else 0 end;
      r.items := r.items - 'bj';
      return jsonb_build_object('items', r.items, 'money', r.money, 'win', w, 'bet', bet,
        'res', jsonb_build_object('hs', jsonb_build_array(jsonb_build_object('c', cs, 'b', bet, 'w', w)), 'i', 0, 'd', dc, 'done', true, 'win', w, 'bet', bet, 'bj', pbj, 'dbj', dbj));
    end if;
    st := jsonb_build_object('bet', bet, 'd', jsonb_build_array(up), 'h', hole, 'hs', jsonb_build_array(jsonb_build_object('c', cs, 'b', bet)), 'i', 0);
    hs := st->'hs'; i := 0;
  else
    st := r.items->'bj';
    if st is null then raise exception '先開一局'; end if;
    if not (st ? 'hs') then raise exception '舊牌局只能要牌或停牌'; end if;
    hs := st->'hs'; i := (st->>'i')::int; h := hs->i; cs := h->'c'; hb := (h->>'b')::int;
    if game = 'bj_hit' then
      cs := cs || to_jsonb(public.town_card()); h := jsonb_set(h, '{c}', cs);
      if public.town_bj_total(cs) >= 21 then h := h || '{"f":1}'::jsonb; end if;
      hs := jsonb_set(hs, array[i::text], h);
    elsif game = 'bj_stand' then
      h := h || '{"f":1}'::jsonb; hs := jsonb_set(hs, array[i::text], h);
    elsif game = 'bj_double' then
      if jsonb_array_length(cs) <> 2 then raise exception '只有前兩張牌可以加倍'; end if;
      if r.money < hb then raise exception '籌碼不夠加倍（要再押 €%）', hb; end if;
      r.money := r.money - hb; cs := cs || to_jsonb(public.town_card());
      h := jsonb_build_object('c', cs, 'b', hb * 2, 'f', 1, 'x', 1); hs := jsonb_set(hs, array[i::text], h);
    elsif game = 'bj_split' then
      if jsonb_array_length(cs) <> 2 or least((cs->>0)::int % 100, 10) <> least((cs->>1)::int % 100, 10) then raise exception '要兩張點數相同的牌才能分牌'; end if;
      if jsonb_array_length(hs) >= 4 then raise exception '最多分成 4 手'; end if;
      if r.money < hb then raise exception '籌碼不夠分牌（要再押 €%）', hb; end if;
      r.money := r.money - hb; a1 := (cs->>0)::int; a2 := (cs->>1)::int;
      h := jsonb_build_object('c', jsonb_build_array(a1, public.town_card()), 'b', hb);
      h2 := jsonb_build_object('c', jsonb_build_array(a2, public.town_card()), 'b', hb);
      if a1 % 100 = 1 then h := h || '{"f":1,"a":1}'::jsonb; h2 := h2 || '{"f":1,"a":1}'::jsonb;
      else
        if public.town_bj_total(h->'c') = 21 then h := h || '{"f":1}'::jsonb; end if;
        if public.town_bj_total(h2->'c') = 21 then h2 := h2 || '{"f":1}'::jsonb; end if;
      end if;
      select jsonb_agg(q.v order by q.o) into hs from (
        select t.o::numeric as o, t.v from jsonb_array_elements(hs) with ordinality as t(v, o) where t.o <= i
        union all select i + 0.5, h
        union all select i + 0.6, h2
        union all select t.o::numeric, t.v from jsonb_array_elements(hs) with ordinality as t(v, o) where t.o > i + 1) q;
    else raise exception '沒有這個動作'; end if;
  end if;

  -- 換到下一個還沒結束的手牌
  n := jsonb_array_length(hs);
  while i < n and ((hs->i) ? 'f') loop i := i + 1; end loop;

  if i >= n then
    -- 全部結束：莊家補牌（所有手都爆牌就不補），逐手結算
    dc := (st->'d') || to_jsonb((st->>'h')::int);
    for k in 0..n-1 loop if public.town_bj_total(hs->k->'c') <= 21 then live := true; end if; end loop;
    if live then while public.town_bj_dealer_hits(dc) loop dc := dc || to_jsonb(public.town_card()); end loop; end if;
    d := public.town_bj_total(dc);
    for k in 0..n-1 loop
      h := hs->k; p := public.town_bj_total(h->'c'); hb := (h->>'b')::int;
      w := case when p > 21 then 0 when d > 21 or p > d then hb * 2 when p = d then hb else 0 end;
      win := win + w; wag := wag + hb; outh := outh || jsonb_build_array(h || jsonb_build_object('w', w));
    end loop;
    r.items := r.items - 'bj';
    return jsonb_build_object('items', r.items, 'money', r.money, 'win', win, 'bet', wag,
      'res', jsonb_build_object('hs', outh, 'i', n - 1, 'd', dc, 'done', true, 'win', win, 'bet', wag));
  end if;

  for k in 0..n-1 loop wag := wag + ((hs->k->>'b')::int); end loop;
  st := st || jsonb_build_object('hs', hs, 'i', i);
  r.items := jsonb_set(r.items, '{bj}', st);
  h := hs->i; cs := h->'c'; hb := (h->>'b')::int;
  dbl := jsonb_array_length(cs) = 2 and r.money >= hb;
  spl := dbl and n < 4 and least((cs->>0)::int % 100, 10) = least((cs->>1)::int % 100, 10);
  return jsonb_build_object('items', r.items, 'money', r.money, 'win', 0, 'bet', wag,
    'res', jsonb_build_object('hs', hs, 'i', i, 'd', st->'d', 'done', false, 'dbl', dbl, 'spl', spl, 'bet', wag));
end $$;
revoke all on function public.town_bj2(public.town_residents, text, int) from public, anon, authenticated;

-- 就地改 town_cgame（21 點分支改走 town_bj2）與 town_casino（白名單加 bj_double／bj_split）
do $patch$
declare src text; fix text;
begin
  select pg_get_functiondef('public.town_cgame(bigint,text,text,int,text)'::regprocedure) into src;
  if src like '%town_bj2%' then
    raise notice 'town_cgame 已改過，略過';
  else
    if position($a$'bj_stand','dice','slots'$a$ in src) = 0 or position($b$  elsif game = 'bj_start' then$b$ in src) = 0 then raise exception 'town_cgame 找不到 21 點錨點，整檔失敗'; end if;
    fix := replace(src, $a$'bj_stand','dice','slots'$a$, $a$'bj_stand','bj_double','bj_split','dice','slots'$a$);
    fix := replace(fix, $b$  elsif game = 'bj_start' then$b$, $c$  elsif game in ('bj_start','bj_double','bj_split') or (game in ('bj_hit','bj_stand') and (coalesce(r.items->'bj', '{}'::jsonb) ? 'hs')) then
    st := public.town_bj2(r, game, bet);
    r.items := st->'items'; r.money := (st->>'money')::bigint; win := (st->>'win')::int; bet := (st->>'bet')::int; res := st->'res';
  elsif game = 'bj_start' then$c$);
    execute fix;
  end if;

  select pg_get_functiondef('public.town_casino(bigint,text,text,int,text)'::regprocedure) into src;
  if src like '%bj_double%' then
    raise notice 'town_casino 已改過，略過';
  else
    if position($a$'bj_stand','dice'$a$ in src) = 0 then raise exception 'town_casino 找不到白名單錨點，整檔失敗'; end if;
    execute replace(src, $a$'bj_stand','dice'$a$, $a$'bj_stand','bj_double','bj_split','dice'$a$);
  end if;
end $patch$;
