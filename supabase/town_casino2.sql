-- 小豬賭場階段 B＋C（2026-11-23）：六款遊戲換成新規則。可重複執行。需要 town_casino.sql（籌碼制）與 town.sql 的 town_card／town_bj_total。
--   由 town_casino 路由到本檔的 town_cgame（呼叫前 money 已換成籌碼）；比大小 hl、百家樂 bacc、妞妞 niu 規則不動（仍走 town_game／town_game2）。
--   遊戲 id：wheel（美式輪盤）、bj_start／bj_hit／bj_stand（21 點）、dice（骰寶）、slots（老虎機）、keno（基諾，取代賓果 bingo）、dg_info／dg_start／dg_play（射龍門，莊家制）。
--
-- 期望值（拿回／押注，全部精確窮舉；21 點為無限副牌 DP 最佳策略，見 tools 外的計算）：
--   美式輪盤 0／00／1～36 共 38 格：紅黑、單雙、大小（1～18／19～36）1:1，三分之一區（1～12／13～24／25～36）2:1，單號 35:1，0 和 00 外圍全輸。
--       每一種都是 36/38 = 0.9474（優勢 5.26%）。
--   21 點：無限副牌、莊家軟 17 要牌（H17）、天生 21 點 6:5（拿回 ×2.2）、莊家同為天生 21 點平手；玩家只能要牌／停牌（無加倍、分牌、保險），
--       玩家最佳策略 0.9600（優勢 4.0%）。
--   骰寶：三顆骰。大／小 1:1，三顆一樣通殺 => 105/216×2 = 0.9722；任意三顆一樣 30:1 => 6/216×31 = 0.8611；
--       單點 n：出現 1／2／3 顆賠 1／2／3 倍 => (75×2+15×3+1×4)/216 = 0.9213；
--       總和 s4～s17（賠 60／30／17／12／8／6／6／6／6／6／6／12／17／30 倍的標準表：4＝17 賠 60、5＝16 賠 30、6＝15 賠 17、7＝14 賠 12、8＝13 賠 8、9～12 賠 6）
--       => 0.8472／0.8611／0.8333／0.9028／0.8750／0.8102（9、12）／0.8750（10、11）。
--   老虎機：三輪各 6 種圖案，權重 7=1、鈴=2、星=3、四葉草=4、蛋=5、錢袋=5（共 20）；三個一樣賠 ×100／30／15／10／7／5，剛好兩個一樣 ×1.2 => 0.9231（優勢 7.7%）。
--   基諾：1～80 選 5 個、開 20 個；中 2 ×1（退回押注）、中 3 ×3、中 4 ×16、中 5 ×200 => 0.8447（優勢 15.5%，真實基諾本來就偏高）。
--       中 0／1 個輸掉。命中機率 0.22718／0.40569／0.27046／0.08394／0.01209／0.00064。
--   射龍門（莊家制，取代玩家彩池）：不收入場費、沒有彩池、沒有抽成。發兩張龍門牌（相鄰自動重發，免費），可放棄（免費）或下注；
--       第三張嚴格在兩張之間才贏；撞柱（同點）輸 2 倍，兩張龍門同點又撞中輸 3 倍；其他輸 1 倍。
--       兩張龍門同點時改押更大 hi／更小 lo。贏的賠率只看「贏的點數個數 n」：淨賺 M(n) 倍，M = floor(((15-n)-0.39)/n×20)/20，
--       n=1..12 => 13.6、6.3、3.85、2.65、1.9、1.4、1.05、0.8、0.6、0.45、0.3、0.2；每個 n 的玩家期望 -3.1%～-5.4%，兩張龍門分佈下最佳選擇平均 -3.8%。
--       押注要有 3 倍籌碼（最多賠 3 倍）。
-- 賠率改這裡的任何一個，前端 town.js 的對應表（PAY／KPAY／DGM 等）與 town/test_casino2.js 的護欄要一起改。

-- 21 點莊家是否要牌：點數 < 17，或剛好軟 17（Ａ算 11 的 17）要牌
create or replace function public.town_bj_dealer_hits(cs jsonb) returns boolean language plpgsql immutable as $$
declare t int := public.town_bj_total(cs); hard int := 0; c int; ace boolean := false;
begin
  for c in select (x)::int % 100 from jsonb_array_elements_text(cs) x loop hard := hard + least(c, 10); if c = 1 then ace := true; end if; end loop;
  return t < 17 or (t = 17 and ace and hard + 10 = 17);
end $$;

-- 射龍門賠率：贏的點數個數 n（1～12）的淨賺倍數
create or replace function public.town_dg_m(n int) returns numeric language sql immutable as $$
  select (array[13.6,6.3,3.85,2.65,1.9,1.4,1.05,0.8,0.6,0.45,0.3,0.2])[n]::numeric
$$;

create or replace function public.town_cgame(rid bigint, pin text, game text, bet int default 0, choice text default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; res jsonb; win int := 0; net int := 0;
  c int; c1 int; c2 int; c3 int; a int; b int; n int; k int; m numeric; mlt int; netw boolean; re int := 0;
  st jsonb; dc jsonb; p int; d int; d1 int; d2 int; d3 int; s int; trip boolean;
  red int[] := array[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]; lbl text; col text; pk int[]; dr int[]; w int[] := array[1,2,3,4,5,5]; cum int; sy int[]; x int;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if coalesce(current_setting('town.casino', true), '') <> '1' then raise exception '押錢遊戲要在賭場玩'; end if;
  if r.place <> 'casino' then raise exception '賭場在小豬賭場，走過去再玩'; end if;
  if game not in ('wheel','bj_start','bj_hit','bj_stand','dice','slots','keno','dg_info','dg_start','dg_play') then raise exception '沒有這個遊戲'; end if;
  -- 開新一局：檢查押注、扣籌碼（射龍門在 dg_play 才下注、輸贏直接加減）
  if game in ('wheel','bj_start','dice','slots','keno') then
    if bet is null or bet < 50 then raise exception '押注最少 €50'; end if;
    if r.money < bet then raise exception '籌碼不夠'; end if;
    r.items := jsonb_set(r.items, '{games}', jsonb_build_object('day', to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'), 'n', coalesce((r.items->'games'->>'n')::int,0) + 1));
    r.money := r.money - bet;
  end if;

  if game = 'wheel' then
    -- 美式輪盤：0～36 與 00（編號 37），每格機率相同
    if coalesce(choice,'') not in ('red','black','odd','even','low','high','d1','d2','d3') and coalesce(choice,'') !~ '^n:(0|00|[1-9]|[12][0-9]|3[0-6])$' then raise exception '選要押的格子'; end if;
    c := floor(random() * 38)::int;
    lbl := case when c = 37 then '00' else c::text end;
    col := case when c in (0, 37) then 'green' when c = any(red) then 'red' else 'black' end;
    if c between 1 and 36 then
      win := case choice
        when 'red' then case when col = 'red' then bet * 2 else 0 end
        when 'black' then case when col = 'black' then bet * 2 else 0 end
        when 'odd' then case when c % 2 = 1 then bet * 2 else 0 end
        when 'even' then case when c % 2 = 0 then bet * 2 else 0 end
        when 'low' then case when c <= 18 then bet * 2 else 0 end
        when 'high' then case when c >= 19 then bet * 2 else 0 end
        when 'd1' then case when c <= 12 then bet * 3 else 0 end
        when 'd2' then case when c between 13 and 24 then bet * 3 else 0 end
        when 'd3' then case when c >= 25 then bet * 3 else 0 end
        else 0 end;
    end if;
    if choice like 'n:%' and substr(choice, 3) = lbl then win := bet * 36; end if;
    res := jsonb_build_object('slot', c, 'label', lbl, 'color', col, 'win', win, 'pick', choice);

  elsif game = 'bj_start' then
    st := jsonb_build_object('bet', bet, 'p', jsonb_build_array(public.town_card(), public.town_card()), 'd', jsonb_build_array(public.town_card()));
    if public.town_bj_total(st->'p') = 21 then
      dc := st->'d'; while public.town_bj_dealer_hits(dc) loop dc := dc || to_jsonb(public.town_card()); end loop;
      -- 天生 21 點 6:5（拿回 ×2.2）；莊家也是天生 21 點平手
      win := case when public.town_bj_total(dc) = 21 and jsonb_array_length(dc) = 2 then bet else floor(bet * 2.2)::int end;
      res := jsonb_build_object('p', st->'p', 'd', dc, 'done', true, 'win', win, 'bj', true);
    else r.items := jsonb_set(r.items, '{bj}', st); res := jsonb_build_object('p', st->'p', 'd', st->'d', 'done', false); end if;
  elsif game in ('bj_hit','bj_stand') then
    st := r.items->'bj'; if st is null then raise exception '先開一局'; end if; bet := (st->>'bet')::int;
    if game = 'bj_hit' then
      st := jsonb_set(st, '{p}', (st->'p') || to_jsonb(public.town_card())); p := public.town_bj_total(st->'p');
      if p > 21 then r.items := r.items - 'bj'; res := jsonb_build_object('p', st->'p', 'd', st->'d', 'done', true, 'win', 0, 'bust', true);
      elsif p < 21 then r.items := jsonb_set(r.items, '{bj}', st); res := jsonb_build_object('p', st->'p', 'd', st->'d', 'done', false);
      end if;
    end if;
    if res is null then
      -- 停牌，或要牌剛好 21 點自動停牌：莊家軟 17 要牌
      dc := st->'d'; while public.town_bj_dealer_hits(dc) loop dc := dc || to_jsonb(public.town_card()); end loop;
      p := public.town_bj_total(st->'p'); d := public.town_bj_total(dc);
      win := case when d > 21 or p > d then bet * 2 when p = d then bet else 0 end;
      r.items := r.items - 'bj'; res := jsonb_build_object('p', st->'p', 'd', dc, 'done', true, 'win', win);
    end if;

  elsif game = 'dice' then
    if coalesce(choice,'') !~ '^(big|small|any3|[1-6]|s([4-9]|1[0-7]))$' then raise exception '押大小、三顆一樣、單點或總和'; end if;
    d1 := 1 + floor(random()*6)::int; d2 := 1 + floor(random()*6)::int; d3 := 1 + floor(random()*6)::int; s := d1 + d2 + d3; trip := d1 = d2 and d2 = d3;
    if choice = 'big' then win := case when not trip and s >= 11 then bet * 2 else 0 end;
    elsif choice = 'small' then win := case when not trip and s <= 10 then bet * 2 else 0 end;
    elsif choice = 'any3' then win := case when trip then bet * 31 else 0 end;
    elsif choice ~ '^[1-6]$' then
      k := (d1 = choice::int)::int + (d2 = choice::int)::int + (d3 = choice::int)::int;
      win := case when k > 0 then bet * (1 + k) else 0 end;
    elsif substr(choice, 2)::int = s then
      win := bet * (case when s in (4, 17) then 61 when s in (5, 16) then 31 when s in (6, 15) then 18 when s in (7, 14) then 13 when s in (8, 13) then 9 else 7 end);
    end if;
    res := jsonb_build_object('dice', jsonb_build_array(d1, d2, d3), 'win', win, 'pick', choice);

  elsif game = 'slots' then
    -- 三輪各 6 種圖案（0=7 1=鈴 2=星 3=四葉草 4=蛋 5=錢袋），權重 1／2／3／4／5／5（共 20）
    sy := array[]::int[];
    for k in 1..3 loop
      x := floor(random() * 20)::int; cum := 0;
      for n in 1..6 loop cum := cum + w[n]; if x < cum then sy := sy || (n - 1); exit; end if; end loop;
    end loop;
    if sy[1] = sy[2] and sy[2] = sy[3] then win := bet * (array[100,30,15,10,7,5])[sy[1] + 1];
    elsif sy[1] = sy[2] or sy[2] = sy[3] or sy[1] = sy[3] then win := floor(bet * 1.2)::int; end if;
    res := jsonb_build_object('reels', to_jsonb(sy), 'win', win);

  elsif game = 'keno' then
    -- 基諾：1～80 選 5 個、開 20 個；中 2 ×1、中 3 ×3、中 4 ×16、中 5 ×200
    begin pk := string_to_array(choice, ',')::int[]; exception when others then raise exception '選 5 個號碼'; end;
    if coalesce(array_length(pk,1),0) <> 5 or (select count(distinct v) from unnest(pk) v) <> 5 or exists (select 1 from unnest(pk) v where v < 1 or v > 80) then raise exception '選 5 個不同的號碼（1～80）'; end if;
    select array_agg(v) into dr from (select v from generate_series(1,80) v order by random() limit 20) q;
    select count(*) into k from unnest(pk) v where v = any(dr);
    win := bet * (case k when 5 then 200 when 4 then 16 when 3 then 3 when 2 then 1 else 0 end);
    res := jsonb_build_object('pick', to_jsonb(pk), 'draw', to_jsonb(dr), 'hit', k, 'win', win);

  elsif game = 'dg_info' then
    return json_build_object('game', jsonb_build_object('table', (select jsonb_agg(public.town_dg_m(i)) from generate_series(1,12) i)), 'money', r.money);
  elsif game = 'dg_start' then
    loop
      c1 := public.town_card(); c2 := public.town_card();
      if (c1 % 100) > (c2 % 100) then c3 := c1; c1 := c2; c2 := c3; end if;
      exit when (c2 % 100) - (c1 % 100) <> 1;
      re := re + 1;
    end loop;
    r.items := jsonb_set(r.items, '{dg}', jsonb_build_object('g', jsonb_build_array(c1, c2)));
    a := c1 % 100; b := c2 % 100;
    res := jsonb_build_object('gates', jsonb_build_array(c1, c2), 'same', a = b, 'redeal', re,
      'pay', case when a = b then null else public.town_dg_m(b - a - 1) end,
      'payHi', case when a = b and a < 13 then public.town_dg_m(13 - a) else null end, 'payLo', case when a = b and a > 1 then public.town_dg_m(a - 1) else null end,
      'canHi', a = b and a < 13, 'canLo', a = b and a > 1);
    update public.town_residents set items = r.items, seen_at = now() where id = rid;
    return json_build_object('game', res, 'money', r.money);
  elsif game = 'dg_play' then
    st := r.items->'dg'; if st is null then raise exception '先發龍門牌'; end if;
    c1 := (st->'g'->>0)::int; c2 := (st->'g'->>1)::int; a := c1 % 100; b := c2 % 100;
    if choice = 'pass' then
      r.items := r.items - 'dg';
      update public.town_residents set items = r.items, seen_at = now() where id = rid;
      return json_build_object('game', jsonb_build_object('pass', true), 'money', r.money);
    end if;
    if bet is null or bet < 50 then raise exception '押注最少 €50'; end if;
    if r.money < bet * 3 then raise exception '籌碼要有押注的 3 倍（撞柱要賠），最多可押 €%', r.money / 3; end if;
    r.items := r.items - 'dg';
    c3 := public.town_card(); p := c3 % 100;
    if a = b then
      if coalesce(choice,'') not in ('hi','lo') then raise exception '龍門同點，猜更大或更小'; end if;
      n := case when choice = 'hi' then 13 - a else a - 1 end;
      if n <= 0 then raise exception '這邊不可能贏'; end if;
      netw := case when choice = 'hi' then p > a else p < a end; mlt := case when p = a then 3 else 1 end;
    else
      n := b - a - 1; netw := p > a and p < b; mlt := case when p = a or p = b then 2 else 1 end;
    end if;
    if netw then net := floor(bet * public.town_dg_m(n))::int; else net := - least(bet * mlt, r.money); end if;
    r.money := r.money + net;
    if net >= 10000 then insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, rid, 'luck', r.name || ' 在賭場的射龍門贏了 €' || net || ' 🎰'); end if;
    r.fun := least(100, r.fun + 3);
    update public.town_residents set money = r.money, fun = r.fun, items = r.items, seen_at = now() where id = rid;
    return json_build_object('game', jsonb_build_object('gates', jsonb_build_array(c1, c2), 'card', c3, 'net', net, 'mult', mlt, 'win', netw, 'bet', bet, 'pay', public.town_dg_m(n)), 'money', r.money);
  end if;

  res := (res || jsonb_build_object('bet', bet))::jsonb;
  r.money := r.money + win; r.fun := least(100, r.fun + 3);
  if win - bet >= 10000 then insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, rid, 'luck', r.name || ' 在賭場淨賺了 €' || (win - bet) || ' 🎰'); end if;
  update public.town_residents set money = r.money, fun = r.fun, items = r.items, seen_at = now() where id = rid;
  return json_build_object('game', res, 'money', r.money);
end $$;

revoke all on function public.town_bj_dealer_hits(jsonb), public.town_dg_m(int) from public, anon, authenticated;
revoke all on function public.town_cgame(bigint,text,text,int,text) from public, anon, authenticated;
