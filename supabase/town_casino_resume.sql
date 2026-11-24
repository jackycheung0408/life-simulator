-- 小豬賭場修復（2026-11-24 全盤體檢）：①21 點／牌九／比大小關畫面可續玩 ②老虎機獎池上限 ③21 點加倍分牌額外注算進 wagered。可重複執行。
-- 需要 town_casino4.sql（town_casino）、town_bj2.sql（21 點加倍分牌）；用 pg_get_functiondef 就地改，找不到錨點整檔失敗、已改過就略過。
-- 重套 town_casino*.sql／town_bj2.sql 之後要再套一次本檔。
-- ① 新動作 bj_state／pj_state／hl_state（只讀，不下注、不動籌碼）：回傳進行中牌局，沒有就回 {"none":true}。
--    21 點回傳 {hs,i,d,done:false,dbl,spl,bet}（暗牌不回傳，bet 為所有手牌已押注合計）；牌九回傳 {p,bet}；比大小回傳 {card,bet}。
--    開新局（bj_start／pj_start／hl_start）時如果已有舊牌局，直接擋並回「有一局還沒打完」，不會蓋掉舊注。伺服器的 items.bj／pj／hlg 欄位不動。
-- ② 老虎機獎池上限 €100,000，超出的部分進鎮基金（fund_log.casino）；含獎池的長期期望約 0.93（基本 0.9231 ＋ 每注 1% 進池、再被中獎領回）。
-- ③ town_casino_log：21 點 bj_double／bj_split 多押的籌碼加進 wagered（rounds 不變）。歷史資料不回填（舊的 21 點 wagered 只含開局注，RTP 會偏高估）。

do $patch$
declare src text; fix text;
begin
  select pg_get_functiondef('public.town_casino(bigint,text,text,int,text)'::regprocedure) into src;
  if src like '%bj_state%' then
    raise notice 'town_casino 已改過，略過';
  else
    if position($a$v_fp bigint; v_pend boolean;$a$ in src) = 0
       or position($b$  v_cash := r.money; v_chips := coalesce((cs->>'ch')::bigint, 0);$b$ in src) = 0
       or position($c$,'ch_final','ch_state') then raise exception$c$ in src) = 0
       or position($d$(case when v_round then bet else 0 end), v_delta)$d$ in src) = 0
       or position($e$  select p.money, p.items into m1, its from public.town_residents p where p.id = rid;$e$ in src) = 0 then
      raise exception 'town_casino 找不到錨點，整檔失敗';
    end if;
    fix := replace(src, $a$v_fp bigint; v_pend boolean;$a$, $a$v_fp bigint; v_pend boolean; v_pre bigint; v_ex bigint; v_st jsonb;$a$);
    fix := replace(fix, $c$,'ch_final','ch_state') then raise exception$c$, $c$,'ch_final','ch_state','bj_double','bj_split','bj_state','pj_state','hl_state') then raise exception$c$);
    fix := replace(fix, $b$  v_cash := r.money; v_chips := coalesce((cs->>'ch')::bigint, 0);$b$, $b$  v_cash := r.money; v_chips := coalesce((cs->>'ch')::bigint, 0);
  -- 還原進行中牌局（只讀）
  if game = 'bj_state' then
    v_st := r.items->'bj';
    if v_st is null then return json_build_object('game', jsonb_build_object('none', true), 'money', v_cash, 'casino', jsonb_build_object('chips', v_chips, 'bh', coalesce(cs->>'bh', ''))); end if;
    if not (v_st ? 'hs') then v_st := v_st || jsonb_build_object('hs', jsonb_build_array(jsonb_build_object('c', v_st->'p', 'b', (v_st->>'bet')::int)), 'i', 0); end if;
    v_pre := coalesce((select sum((e->>'b')::bigint) from jsonb_array_elements(v_st->'hs') e), 0);
    return json_build_object('game', jsonb_build_object('hs', v_st->'hs', 'i', (v_st->>'i')::int, 'd', v_st->'d', 'done', false, 'bet', v_pre,
      'dbl', (jsonb_array_length(v_st->'hs'->((v_st->>'i')::int)->'c') = 2 and v_chips >= ((v_st->'hs'->((v_st->>'i')::int)->>'b')::bigint) and (v_st ? 'p') = false),
      'spl', ((v_st ? 'p') = false and jsonb_array_length(v_st->'hs') < 4 and jsonb_array_length(v_st->'hs'->((v_st->>'i')::int)->'c') = 2 and v_chips >= ((v_st->'hs'->((v_st->>'i')::int)->>'b')::bigint)
        and least(((v_st->'hs'->((v_st->>'i')::int)->'c'->>0)::int) % 100, 10) = least(((v_st->'hs'->((v_st->>'i')::int)->'c'->>1)::int) % 100, 10))),
      'money', v_cash, 'casino', jsonb_build_object('chips', v_chips, 'bh', coalesce(cs->>'bh', '')));
  elsif game = 'pj_state' then
    v_st := r.items->'pj';
    return json_build_object('game', case when v_st is null then jsonb_build_object('none', true) else jsonb_build_object('p', v_st->'p', 'bet', (v_st->>'b')::int) end,
      'money', v_cash, 'casino', jsonb_build_object('chips', v_chips, 'bh', coalesce(cs->>'bh', '')));
  elsif game = 'hl_state' then
    v_st := r.items->'hlg';
    return json_build_object('game', case when v_st is null then jsonb_build_object('none', true) else jsonb_build_object('card', (v_st->>'card')::int, 'bet', (v_st->>'bet')::int) end,
      'money', v_cash, 'casino', jsonb_build_object('chips', v_chips, 'bh', coalesce(cs->>'bh', '')));
  end if;
  if (game = 'bj_start' and r.items ? 'bj') or (game = 'pj_start' and r.items ? 'pj') or (game = 'hl_start' and r.items ? 'hlg') then
    raise exception '有一局還沒打完，先回牌桌完成（已為你還原）';
  end if;
  v_pre := coalesce((select sum((e->>'b')::bigint) from jsonb_array_elements(case when jsonb_typeof(r.items->'bj'->'hs') = 'array' then r.items->'bj'->'hs' else '[]'::jsonb end) e), 0);$b$);
    fix := replace(fix, $e$  select p.money, p.items into m1, its from public.town_residents p where p.id = rid;$e$, $e$  select p.money, p.items into m1, its from public.town_residents p where p.id = rid;
  v_ex := 0;
  if game in ('bj_double','bj_split') then v_ex := greatest(0, coalesce((res::jsonb->'game'->>'bet')::bigint, 0) - v_pre); end if;$e$);
    fix := replace(fix, $d$(case when v_round then bet else 0 end), v_delta)$d$, $d$(case when v_round then bet else 0 end) + v_ex, v_delta)$d$);
    execute fix;
  end if;

  -- ② 老虎機獎池上限
  select pg_get_functiondef('public.town_cgame(bigint,text,text,int,text)'::regprocedure) into src;
  if src like '%jp cap%' then
    raise notice 'town_cgame 獎池上限已改過，略過';
  else
    if position($a$    if sy[1] = 0 and sy[2] = 0 and sy[3] = 0 then$a$ in src) = 0 then raise exception 'town_cgame 找不到老虎機錨點，整檔失敗'; end if;
    fix := replace(src, $a$    if sy[1] = 0 and sy[2] = 0 and sy[3] = 0 then$a$, $b$    -- jp cap：獎池上限 100000，超出進鎮基金
    if jpool > 100000 then
      perform public.town_fund_add(r.town_id, 'casino', least(jpool - 100000, 2000000000)::int);
      update public.town_jackpot set amount = 100000 where town_id = r.town_id returning amount into jpool;
    end if;
    if sy[1] = 0 and sy[2] = 0 and sy[3] = 0 then$b$);
    execute fix;
  end if;
end $patch$;
