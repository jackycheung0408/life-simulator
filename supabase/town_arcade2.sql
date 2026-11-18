-- 街機第二批：百家樂 bacc、射龍門 dg_start／dg_play、妞妞 niu（RPC town_game2）。要在 town.sql 之後套用，可重複執行。
-- 牌編碼同 town_card：花色*100+點數（1 黑桃 2 紅心 3 方塊 4 梅花），點數 = 編碼 % 100，A=1、K=13。
-- 一律不限局數；押注 50～1000；錢不夠不能下注；現金不變負。
--
-- 【百家樂】無限副牌近似（每張牌獨立隨機，等同無限副）；點數 A=1、2～9、10JQK=0，取個位；標準補牌規則，8／9 天生例牌不補。
--   精確窮舉（13^6 種牌）：閒贏 0.446147、莊贏 0.458428、和 0.095426。
--   賠率：閒 1:1（期望 0.98772）、莊 1:0.95（期望 0.98936）、和 8:1 即拿回 ×9（期望 0.85883）；和局時押閒莊退回押注。
--
-- 【射龍門】（2026-11-18 改版：先下注、再發龍門、有彩池）牌獨立隨機（A 最小 K 最大，每個點數 1/13）。
--   流程：選押注 b → 發兩張龍門（相鄰＝差 1 不可能贏：免費、自動重發，不收任何費用）→ 收發牌費 ceil(b*3%) 進彩池 → 玩家「玩」或「放棄」。
--   放棄再付 ceil(b*10%)（進彩池）。贏 = 從彩池拿走 1 倍押注（固定 1:1）；輸 = 押注進彩池；撞 1 柱（第三張同其中一張龍門）輸 2 倍；
--   撞 2 柱（兩張龍門同點、第三張也同點）輸 3 倍。龍門同點只能猜大／小。
--   彩池：每鎮一個（town_pots），種子 3000，永遠 >= 0，上限 100000，超出進鎮基金；下注時要求彩池 >= 3 倍押注（可押上限 = floor(彩池/3)，最高 1000），現金 >= 3 倍押注 + 發牌費。
--   精確窮舉（非相鄰龍門共 145 組有序點數對，同點 13、差 d 的 2*(13-d) 組；W = 贏的點數個數）：玩的期望（淨，單位押注）= (2W-15)/13（兩種龍門公式相同；同點取較大的一邊）。
--   玩家最佳策略 = 玩的期望 < -0.1 就放棄：W <= 6 放棄（含同點龍門只有 a=7 的 W=6）、W >= 7 玩。最佳策略不含發牌費的期望 -0.0190，扣 3% 發牌費後回報率 0.9510（< 0.97）。
--   對照：若放棄費設 b/2，最佳策略不含發牌費就只有 0.732（太狠），所以放棄費定 10%；調整只要改下面三個常數（town_dg_fee_pct／town_dg_pass_pct／彩池上限）與前端 DGFEE／DGPASS。
--
-- 【妞妞】一副 52 張牌，玩家與莊家各 5 張；A=1、2～9、10JQK=10。五張中找 3 張總和為 10 的倍數，其餘 2 張個位數 = 妞點（0 = 妞妞，最大）；找不到 = 沒妞。
--   比大小：妞妞 > 9 > ... > 1 > 沒妞；同級只比最大一張的點數（K>...>A），不比花色；連最大牌點數都一樣 = 平手，退回押注。
--   賠率（純贏倍數，不含本金；輸贏對稱）：贏家牌型決定倍數：沒妞、妞 1～6 = 1 倍；妞 7、8、9 = 2 倍；妞妞 = 3 倍；輸家付同樣倍數（玩家輸時付莊家牌型的倍數）。
--   莊家優勢（刻意）：玩家沒妞且最大牌小於 Q（沒有 Q、K）= 無條件輸，連莊家也沒妞也算玩家輸；莊家沒有這條限制。玩家沒妞但最大牌 Q／K 才正常比較。
--   無條件輸時玩家付「莊家牌型的倍數」（和一般輸一樣：沒妞 1、妞 7～9 為 2、妞妞 3）。精確窮舉（以點數組合統計，C(52,5)*C(47,5) 種）：
--   玩家無條件輸 14.02%、平手 2.37%、正常贏 47.93%；回報率 = 1 − P(雙方都是「沒妞且最大牌 < Q」) = 0.9824，與倍數表無關（每一對手牌與交換後的手牌互相抵銷，只剩雙方都被判輸的那一類）。
--   若無條件輸只付 1 倍（不隨莊家牌型），回報率會變 1.0309（> 1，不可用），所以採莊家牌型倍數。下注時現金要 >= 3 倍押注。

create table if not exists public.town_pots (town_id text primary key references public.town_towns(id) on delete cascade, amt bigint not null default 3000 check (amt >= 0));
alter table public.town_pots enable row level security;
revoke all on public.town_pots from public, anon, authenticated;
create or replace function public.town_dg_fee(b int) returns int language sql immutable as $$ select ((b * 3 + 99) / 100) $$;
create or replace function public.town_dg_pass(b int) returns int language sql immutable as $$ select ((b * 10 + 99) / 100) $$;
create or replace function public.town_pot_get(tid text) returns bigint language plpgsql security definer set search_path = public as $$
declare a bigint;
begin
  insert into public.town_pots(town_id, amt) values (tid, 3000) on conflict (town_id) do nothing;
  select amt into a from public.town_pots where town_id = tid; return a;
end $$;
-- 彩池加減：不會 < 0，超過 100000 的部分進鎮基金
create or replace function public.town_pot_add(tid text, d bigint) returns bigint language plpgsql security definer set search_path = public as $$
declare a bigint; ex bigint := 0;
begin
  a := public.town_pot_get(tid) + d; if a < 0 then a := 0; end if;
  if a > 100000 then ex := a - 100000; a := 100000; end if;
  update public.town_pots set amt = a where town_id = tid;
  if ex > 0 then perform public.town_fund_add(tid, 'pot', least(ex, 2000000000)::int); end if;
  return a;
end $$;
revoke all on function public.town_dg_fee(int), public.town_dg_pass(int), public.town_pot_get(text), public.town_pot_add(text,bigint) from public, anon, authenticated;

create or replace function public.town_bacc_val(c int) returns int language sql immutable as $$ select case when c % 100 >= 10 then 0 else c % 100 end $$;

create or replace function public.town_dg_odds(w int, p int) returns int language sql immutable as $$
  select ((100 * p + 1248 - 100 * w) / w)
$$;

-- 妞妞：回傳 class*1000 + 最大牌點數（不比花色）；class 0 = 沒妞、1～9 = 妞點、10 = 妞妞
create or replace function public.town_niu_score(cs int[]) returns int language plpgsql immutable as $$
declare i int; j int; k int; m int; s int; v int[] := array[]::int[]; cl int := 0; mx int := 0; key int;
begin
  for i in 1..5 loop v := v || least(cs[i] % 100, 10); key := cs[i] % 100; if key > mx then mx := key; end if; end loop;
  <<found>>
  for i in 1..3 loop for j in i+1..4 loop for k in j+1..5 loop
    if (v[i] + v[j] + v[k]) % 10 = 0 then
      s := 0; for m in 1..5 loop if m <> i and m <> j and m <> k then s := s + v[m]; end if; end loop;
      s := s % 10; cl := case when s = 0 then 10 else s end; exit found;
    end if;
  end loop; end loop; end loop;
  return cl * 1000 + mx;
end $$;

create or replace function public.town_game2(rid bigint, pin text, game text, bet int default 0, choice text default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; res jsonb; po bigint; fee int; forced boolean := false; re int := 0; mlt int; net int; win int := 0; pen int := 0; c1 int; c2 int; c3 int; a int; b int; ra int; rb int; rr int; w int; pc int; o int; st jsonb;
  pt int; bk int; pcs int[]; bcs int[]; p3 int := 0; b3 int := 0; t1 int; t2 int; deck int[]; ps int; ds int; hit boolean; netw int;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if public.town_is_off(r.town_id, 'arcade') then raise exception '這個小鎮沒有開街機'; end if;
  if r.place <> 'plaza' then raise exception '街機在小豬廣場，走過去再玩'; end if;
  if game = 'dg_info' then
    return json_build_object('game', jsonb_build_object('pot', public.town_pot_get(r.town_id), 'maxBet', least(1000, public.town_pot_get(r.town_id) / 3)), 'money', r.money);
  end if;
  if game = 'dg_start' then
    if bet is null or bet < 50 or bet > 1000 then raise exception '押注要在 €50～€1000 之間'; end if;
    po := public.town_pot_get(r.town_id);
    if po < bet * 3 then raise exception '彩池不夠，押小一點（最多可押 €%）', least(1000, po / 3); end if;
    if r.money < bet * 3 + public.town_dg_fee(bet) then raise exception '現金要有押注的 3 倍再加發牌費'; end if;
    loop
      c1 := public.town_card(); c2 := public.town_card();
      if (c1 % 100) > (c2 % 100) then c3 := c1; c1 := c2; c2 := c3; end if;
      exit when (c2 % 100) - (c1 % 100) <> 1;
      re := re + 1;
    end loop;
    fee := public.town_dg_fee(bet); r.money := r.money - fee; po := public.town_pot_add(r.town_id, fee);
    r.items := jsonb_set(r.items, '{dg}', jsonb_build_object('g', jsonb_build_array(c1, c2), 'bet', bet));
    ra := c1 % 100; rb := c2 % 100;
    res := jsonb_build_object('gates', jsonb_build_array(c1, c2), 'same', ra = rb, 'fee', fee, 'pass', public.town_dg_pass(bet), 'bet', bet, 'pot', po, 'redeal', re,
      'canHi', ra = rb and ra < 13, 'canLo', ra = rb and ra > 1);
    update public.town_residents set money = r.money, items = r.items, seen_at = now() where id = rid;
    return json_build_object('game', res, 'money', r.money);
  end if;
  if game = 'dg_play' then
    st := r.items->'dg'; if st is null then raise exception '先下注發龍門牌'; end if;
    bet := (st->>'bet')::int; c1 := (st->'g'->>0)::int; c2 := (st->'g'->>1)::int; ra := c1 % 100; rb := c2 % 100;
    r.items := r.items - 'dg';
    if choice = 'pass' then
      fee := public.town_dg_pass(bet); fee := least(fee, r.money); r.money := r.money - fee; po := public.town_pot_add(r.town_id, fee);
      update public.town_residents set money = r.money, items = r.items, seen_at = now() where id = rid;
      return json_build_object('game', jsonb_build_object('pass', true, 'cost', fee, 'pot', po), 'money', r.money);
    end if;
    c3 := public.town_card(); rr := c3 % 100;
    if ra = rb then
      if coalesce(choice,'') not in ('hi','lo') then raise exception '龍門同點，猜更大或更小'; end if;
      w := case when choice = 'hi' then 13 - ra else ra - 1 end;
      if w <= 0 then raise exception '這邊不可能贏'; end if;
      netw := case when choice = 'hi' then (rr > ra)::int else (rr < ra)::int end;
      mlt := case when rr = ra then 3 else 1 end;
    else
      netw := (rr > ra and rr < rb)::int; mlt := case when rr = ra or rr = rb then 2 else 1 end;
    end if;
    if netw = 1 then
      po := public.town_pot_get(r.town_id); fee := least(bet, po::int); r.money := r.money + fee; po := public.town_pot_add(r.town_id, -fee); net := fee;
    else
      fee := least(bet * mlt, r.money); r.money := r.money - fee; po := public.town_pot_add(r.town_id, fee); net := -fee;
    end if;
    if net >= 1000 then insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, rid, 'luck', r.name || ' 在射龍門贏了 €' || net || ' 🕹️'); end if;
    update public.town_residents set money = r.money, fun = least(100, r.fun + 3), items = r.items, seen_at = now() where id = rid;
    return json_build_object('game', jsonb_build_object('gates', jsonb_build_array(c1, c2), 'card', c3, 'net', net, 'mult', mlt, 'win', netw = 1, 'bet', bet, 'pot', po), 'money', r.money);
  end if;
  if game not in ('bacc','niu') then raise exception '沒有這個遊戲'; end if;
  if bet is null or bet < 50 or bet > 1000 then raise exception '押注要在 €50～€1000 之間'; end if;
  if r.money < bet then raise exception '錢不夠'; end if;
  if game = 'niu' and r.money < bet * 3 then raise exception '這款最多賠 3 倍，現金要有押注的 3 倍'; end if;
  if game = 'bacc' then
    if coalesce(choice,'') not in ('p','b','t') then raise exception '押閒、莊或和'; end if;
    pcs := array[public.town_card(), public.town_card()]; bcs := array[public.town_card(), public.town_card()];
    pt := (public.town_bacc_val(pcs[1]) + public.town_bacc_val(pcs[2])) % 10; bk := (public.town_bacc_val(bcs[1]) + public.town_bacc_val(bcs[2])) % 10;
    if pt < 8 and bk < 8 then
      if pt <= 5 then pcs := pcs || public.town_card(); p3 := public.town_bacc_val(pcs[3]); pt := (pt + p3) % 10; end if;
      if array_length(pcs,1) = 2 then hit := bk <= 5;
      else hit := (bk <= 2) or (bk = 3 and p3 <> 8) or (bk = 4 and p3 between 2 and 7) or (bk = 5 and p3 between 4 and 7) or (bk = 6 and p3 between 6 and 7);
      end if;
      if hit then bcs := bcs || public.town_card(); bk := (bk + public.town_bacc_val(bcs[3])) % 10; end if;
    end if;
    if pt = bk then win := case when choice = 't' then bet * 9 else bet end;
    elsif pt > bk and choice = 'p' then win := bet * 2;
    elsif bk > pt and choice = 'b' then win := floor(bet * 1.95)::int; end if;
    res := jsonb_build_object('p', to_jsonb(pcs), 'b', to_jsonb(bcs), 'pt', pt, 'bt', bk, 'win', win, 'pick', choice);
  elsif game = 'niu' then
    select array_agg(c) into deck from (select (s * 100 + n) as c from generate_series(1,4) s, generate_series(1,13) n order by random() limit 10) q;
    pcs := deck[1:5]; bcs := deck[6:10]; ps := public.town_niu_score(pcs); ds := public.town_niu_score(bcs);
    if ps < 1000 and ps % 1000 < 12 then pen := bet * (case when ds >= 10000 then 3 when ds >= 7000 then 2 else 1 end) - bet; forced := true;
    elsif ps = ds then win := bet;
    elsif ps > ds then win := bet + bet * (case when ps >= 10000 then 3 when ps >= 7000 then 2 else 1 end);
    else pen := bet * (case when ds >= 10000 then 3 when ds >= 7000 then 2 else 1 end) - bet; end if;
    res := jsonb_build_object('p', to_jsonb(pcs), 'b', to_jsonb(bcs), 'pcl', ps / 1000, 'bcl', ds / 1000, 'win', win, 'forced', forced);
  end if;
  r.money := greatest(0, r.money - bet - pen) + win;
  r.items := jsonb_set(r.items, '{games}', jsonb_build_object('day', to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'), 'n', coalesce((r.items->'games'->>'n')::int,0) + 1));
  res := res || jsonb_build_object('bet', bet, 'pen', pen);
  r.fun := least(100, r.fun + 3);
  if win - bet - pen >= 1000 then insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, rid, 'luck', r.name || ' 在街機淨賺了 €' || (win - bet - pen) || ' 🕹️'); end if;
  update public.town_residents set money = r.money, fun = r.fun, items = r.items, seen_at = now() where id = rid;
  return json_build_object('game', res, 'money', r.money);
end $$;

revoke all on function public.town_bacc_val(int), public.town_dg_odds(int,int), public.town_niu_score(int[]) from public, anon, authenticated;
revoke all on function public.town_game2(bigint,text,text,int,text) from public;
grant execute on function public.town_game2(bigint,text,text,int,text) to anon, authenticated;
