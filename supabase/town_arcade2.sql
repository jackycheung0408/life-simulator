-- 街機第二批：百家樂 bacc、射龍門 dg_start／dg_play、妞妞 niu（RPC town_game2）。要在 town.sql 之後套用，可重複執行。
-- 牌編碼同 town_card：花色*100+點數（1 黑桃 2 紅心 3 方塊 4 梅花），點數 = 編碼 % 100，A=1、K=13。
-- 一律不限局數；押注 50～1000；錢不夠不能下注；現金不變負。
--
-- 【百家樂】無限副牌近似（每張牌獨立隨機，等同無限副）；點數 A=1、2～9、10JQK=0，取個位；標準補牌規則，8／9 天生例牌不補。
--   精確窮舉（13^6 種牌）：閒贏 0.446147、莊贏 0.458428、和 0.095426。
--   賠率：閒 1:1（期望 0.98772）、莊 1:0.95（期望 0.98936）、和 8:1 即拿回 ×9（期望 0.85883）；和局時押閒莊退回押注。
--
-- 【射龍門】牌同樣獨立隨機（A 最小 K 最大）。先發兩張龍門（免費、可放棄重發），再決定押注或放棄。
--   龍門 a<b：中間 g=b-a-1 個點數贏；點數等於 a 或 b 為撞柱（柱 P=2），輸 2 倍押注；其他輸 1 倍。
--   龍門同點：只能猜大／小；贏的點數 W 個，撞柱 P=1（同點），其他輸 1 倍。兩張相鄰（差 1）自動放棄，不扣錢。
--   賠率 o（贏時另得 押注×o）取 o100 = floor((100*P + 1248 - 100*W)/W)（W = 贏的點數個數），使每種龍門的期望都 <= 0.96：
--   期望（淨） = (o*W - 2*P' - L)/13，其中 P'=撞柱的點數個數、L = 13-W-P'；賠率表見 CLAUDE.md。
--   撞柱要多扣一倍押注，所以押注時現金要 >= 2 倍押注（否則錢不夠付，會變成對玩家有利）。
--
-- 【妞妞】一副 52 張牌，玩家與莊家各 5 張；A=1、2～9、10JQK=10。五張中找 3 張總和為 10 的倍數，其餘 2 張個位數 = 妞點（0 = 妞妞，最大）；找不到 = 沒妞。
--   比大小：妞妞 > 9 > ... > 1 > 沒妞；同級比最大一張（K>...>A），再比花色（黑桃>紅心>方塊>梅花）。同一副牌所以不會完全平手，對雙方完全對稱。
--   賠率：贏 ×2（含本金）；妞妞贏 ×3；輸給莊家妞妞賠 2 倍押注；其他輸 1 倍。
--   精確窮舉（以點數組合統計，C(52,5)*C(47,5) 種）：玩家贏 0.5、輸 0.5，期望（淨）= 0（贏妞妞 +2 與輸妞妞 -2 對稱），回報率剛好 1.000。
--   押注時現金同樣要 >= 2 倍押注。

create or replace function public.town_bacc_val(c int) returns int language sql immutable as $$ select case when c % 100 >= 10 then 0 else c % 100 end $$;

create or replace function public.town_dg_odds(w int, p int) returns int language sql immutable as $$
  select ((100 * p + 1248 - 100 * w) / w)
$$;

-- 妞妞：回傳 class*1000 + 最大牌鍵（點數*10 + (5 - 花色)）；class 0 = 沒妞、1～9 = 妞點、10 = 妞妞
create or replace function public.town_niu_score(cs int[]) returns int language plpgsql immutable as $$
declare i int; j int; k int; m int; s int; v int[] := array[]::int[]; cl int := 0; mx int := 0; key int;
begin
  for i in 1..5 loop v := v || least(cs[i] % 100, 10); key := (cs[i] % 100) * 10 + (5 - cs[i] / 100); if key > mx then mx := key; end if; end loop;
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
declare r public.town_residents; res jsonb; win int := 0; pen int := 0; c1 int; c2 int; c3 int; a int; b int; ra int; rb int; rr int; w int; pc int; o int; st jsonb;
  pt int; bk int; pcs int[]; bcs int[]; p3 int := 0; b3 int := 0; t1 int; t2 int; deck int[]; ps int; ds int; hit boolean; netw int;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if public.town_is_off(r.town_id, 'arcade') then raise exception '這個小鎮沒有開街機'; end if;
  if r.place <> 'plaza' then raise exception '街機在小豬廣場，走過去再玩'; end if;
  if game = 'dg_start' then
    c1 := public.town_card(); c2 := public.town_card();
    if (c1 % 100) > (c2 % 100) then c3 := c1; c1 := c2; c2 := c3; end if;
    if (c2 % 100) - (c1 % 100) = 1 then
      r.items := r.items - 'dg'; res := jsonb_build_object('gates', jsonb_build_array(c1, c2), 'abandon', true);
    else
      r.items := jsonb_set(r.items, '{dg}', jsonb_build_object('g', jsonb_build_array(c1, c2)));
      pc := case when (c1 % 100) = (c2 % 100) then 1 else 2 end;
      w := case when pc = 1 then 12 - (c1 % 100) + 1 else (c2 % 100) - (c1 % 100) - 1 end;
      res := jsonb_build_object('gates', jsonb_build_array(c1, c2), 'abandon', false, 'same', (c1 % 100) = (c2 % 100),
        'odds', case when pc = 2 then public.town_dg_odds(w, 2) else null end,
        'oddsHi', case when pc = 1 and (c1 % 100) < 13 then public.town_dg_odds(13 - (c1 % 100), 1) end,
        'oddsLo', case when pc = 1 and (c1 % 100) > 1 then public.town_dg_odds((c1 % 100) - 1, 1) end);
    end if;
    update public.town_residents set items = r.items, seen_at = now() where id = rid;
    return json_build_object('game', res, 'money', r.money);
  end if;
  if game = 'dg_play' and choice = 'pass' then
    r.items := r.items - 'dg';
    update public.town_residents set items = r.items, seen_at = now() where id = rid;
    return json_build_object('game', jsonb_build_object('pass', true, 'bet', 0, 'win', 0), 'money', r.money);
  end if;
  if game not in ('bacc','dg_play','niu') then raise exception '沒有這個遊戲'; end if;
  if bet is null or bet < 50 or bet > 1000 then raise exception '押注要在 €50～€1000 之間'; end if;
  if r.money < bet then raise exception '錢不夠'; end if;
  if game in ('dg_play','niu') and r.money < bet * 2 then raise exception '這款輸了要賠 2 倍，現金要有押注的 2 倍'; end if;
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
  elsif game = 'dg_play' then
    st := r.items->'dg'; if st is null then raise exception '先發龍門牌'; end if;
    c1 := (st->'g'->>0)::int; c2 := (st->'g'->>1)::int; ra := c1 % 100; rb := c2 % 100;
    c3 := public.town_card(); rr := c3 % 100;
    if ra = rb then
      if coalesce(choice,'') not in ('hi','lo') then raise exception '龍門同點，猜更大或更小'; end if;
      w := case when choice = 'hi' then 13 - ra else ra - 1 end; pc := 1;
      if w <= 0 then raise exception '這邊不可能贏'; end if;
      hit := rr = ra;
      netw := case when choice = 'hi' then (rr > ra)::int else (rr < ra)::int end;
    else
      w := rb - ra - 1; pc := 2; hit := rr = ra or rr = rb; netw := (rr > ra and rr < rb)::int;
    end if;
    o := public.town_dg_odds(w, pc);
    if netw = 1 then win := bet + floor(bet * o / 100.0)::int;
    elsif hit then pen := bet; end if;
    r.items := r.items - 'dg';
    res := jsonb_build_object('gates', jsonb_build_array(c1, c2), 'card', c3, 'win', win, 'hit', hit, 'odds', o);
  elsif game = 'niu' then
    select array_agg(c) into deck from (select (s * 100 + n) as c from generate_series(1,4) s, generate_series(1,13) n order by random() limit 10) q;
    pcs := deck[1:5]; bcs := deck[6:10]; ps := public.town_niu_score(pcs); ds := public.town_niu_score(bcs);
    if ps > ds then win := bet * case when ps >= 10000 then 3 else 2 end;
    else pen := case when ds >= 10000 then bet else 0 end; end if;
    res := jsonb_build_object('p', to_jsonb(pcs), 'b', to_jsonb(bcs), 'pcl', ps / 1000, 'bcl', ds / 1000, 'win', win);
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
