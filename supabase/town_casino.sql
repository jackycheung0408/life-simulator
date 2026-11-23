-- 小豬賭場（2026-11-22 階段 A，11-23 改成籌碼制、取消預算與上限）：街機的「押錢遊戲」搬進獨立設施 casino。可重複執行。
--   設施：casino「賭場」（地圖 [66,9,5,5]、門 (68,14)），鎮長可用功能開關 casino 關掉。廣場街機只留猜拳與單機。
--   押錢遊戲（9 種）：比大小 hl、輪盤 wheel、21 點 bj、骰寶 dice、老虎機 slots、基諾 keno、百家樂 bacc、射龍門 dg、妞妞 niu（輪盤、21 點、骰寶、老虎機、基諾、射龍門的新規則在 town_casino2.sql）
--   入口：RPC town_casino(rid,pin,game,bet,choice) 包住 town_game／town_game2；town_casino_state(rid,pin,op,val)：view／buy／sell／rest。
--   籌碼制（2026-11-23 使用者決定）：進賭場用現金 1:1 換籌碼（buy），遊戲全部用籌碼押，換回現金（sell）時抽 0.5%（無條件進位）。
--     遊戲本身不再抽 5%：猜拳 ×2、百家樂改免佣（莊贏 ×2，但莊以 6 點贏只賠 ×1.5，期望 0.9857）。其他遊戲的賠率不動。
--     抽成處理：換回現金的 0.5% 手續費一半進鎮基金（fund_log.casino）、一半銷毀。籌碼放在 items.cas.ch，財產稅的基礎 = 現金 + 籌碼。
--     實作：town_casino 在呼叫 town_game／town_game2 前把居民的 money 暫時換成籌碼、呼叫完換回現金（同一個交易內，出錯整個回滾）。
--   不設預算、不設單注上限、不設每日淨輸上限（只受籌碼數量限制；妞妞與射龍門仍要有押注 3 倍的籌碼）。
--   唯一保留的限制：開局間隔至少 3 秒（防腳本連點）。自我排除已於 2026-11-23 取消（使用者決定）。
--     已取消：30 分鐘連輸強制休息（冷靜）；無限玩。離場強制換回現金見檔尾的觸發器 town_casino_leave。
--   輸贏記錄：town_casino_log（每人每天每遊戲：局數、總押注、淨輸贏，單位是籌碼），之後才量得出賭場吸走多少。
--   狀態存在 items.cas：ch 籌碼、t 上次開局、bh 百家樂最近 72 局路單（P／B／T）、fd／fp 盈餘已進基金（舊欄位 d／s0／b 是預算時期留下的，不再使用）。
-- 這個檔會用下面的 do 區塊「就地修改」正式站目前的 town_game／town_game2／town_rent（不複製整個函式，所以不管它們被改成什麼版本都能套用，可重複執行）：
--   錢類遊戲要 town.casino=1 才通過、位置改 casino、功能開關改 casino、押注上限改 town_casino_maxbet（= 籌碼數量）；猜拳留在廣場（上限 10000、×2）；
--   百家樂莊家免佣；財產稅基礎加上籌碼；另外把 casino 加進地點名稱、功能清單、可前往地點（town_place_name、town_features、town_act 的 move）。

-- 遷移（可重複執行）：早期版本把賭場狀態放在 items.cs，但 cs 是咖啡集點卡的整數，兩者相撞（整數 || 物件 → 陣列 [2,{"ch":..}]，之後籌碼永遠讀成 0）。
-- 把 cs 裡的物件（可能多個）合併搬到 items.cas（籌碼 ch 加總），整數還回 cs。
do $mig$
declare r record; el jsonb; n int; cas jsonb; chs bigint;
begin
  for r in select id, items from public.town_residents where jsonb_typeof(items->'cs') in ('array','object') loop
    n := null; chs := 0; cas := coalesce(r.items->'cas','{}'::jsonb);
    for el in select e from jsonb_array_elements(case when jsonb_typeof(r.items->'cs') = 'array' then r.items->'cs' else jsonb_build_array(r.items->'cs') end) e loop
      if jsonb_typeof(el) = 'number' then n := (el #>> '{}')::numeric::int;
      elsif jsonb_typeof(el) = 'object' then chs := chs + coalesce((el->>'ch')::bigint, 0); cas := cas || (el - 'ch'); end if;
    end loop;
    cas := cas || jsonb_build_object('ch', coalesce((cas->>'ch')::bigint, 0) + chs);
    update public.town_residents p set items = case when n is null then p.items - 'cs' else jsonb_set(p.items, '{cs}', to_jsonb(n)) end || jsonb_build_object('cas', cas) where p.id = r.id;
  end loop;
end $mig$;

create table if not exists public.town_casino_log (
  rid bigint not null, day text not null, game text not null,
  rounds int not null default 0, wagered bigint not null default 0, net bigint not null default 0,
  primary key (rid, day, game)
);
alter table public.town_casino_log enable row level security;
revoke all on public.town_casino_log from anon, authenticated;

-- 就地修改 town_game／town_game2／town_rent 與地點、功能清單（可重複執行：已改過就略過）
do $do$
declare f record; d text; rec record;
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
      d := replace(d, blk_old, blk_new);
      d := regexp_replace(d, $re$if bet is null or bet < 50 or bet > [0-9]+ then raise exception '押注要在 €50～€[0-9]+ 之間'; end if;$re$, bet_new);
      if position('town.casino' in d) = 0 or position('town_casino_maxbet' in d) = 0 then raise exception '% 的位置檢查或押注上限找不到要改的文字，請人工處理', f.proname; end if;
      execute d;
    end if;
  end loop;
  -- 名稱、清單、規則：[函式名稱（null = 其他函式）, 舊文字, 新文字, 已改過的標記]
  for rec in select * from (values
    (null::text, $o$when p = 'townhall' then '市政廳' else '路上' end$o$, $n$when p = 'townhall' then '市政廳' when p = 'casino' then '賭場' else '路上' end$n$, $c$when p = 'casino'$c$),
    (null::text, $o$'arcade','rafi','stock'$o$, $n$'arcade','casino','rafi','stock'$n$, $c$'arcade','casino'$c$),
    (null::text, $o$dest in ('plaza','restaurant','market','office','park','street','cafe'$o$, $n$dest in ('plaza','casino','restaurant','market','office','park','street','cafe'$n$, $c$dest in ('plaza','casino','restaurant','market','office'$c$),
    (null::text, $o$if dest in ('plaza','restaurant','market','park','cafe'$o$, $n$if dest in ('plaza','casino','restaurant','market','park','cafe'$n$, $c$if dest in ('plaza','casino','restaurant','market','park'$c$),
    ('town_game', $o$(choice,house) in (('r','s'),('s','p'),('p','r')) then win := floor(bet * 1.95)::int; end if;$o$, $n$(choice,house) in (('r','s'),('s','p'),('p','r')) then win := bet * 2; end if;$n$, $c$then win := bet * 2; end if;$c$),
    ('town_game2', $o$elsif bk > pt and choice = 'b' then win := floor(bet * 1.95)::int; end if;$o$, $n$elsif bk > pt and choice = 'b' then win := case when bk = 6 then bet + bet / 2 else bet * 2 end; end if;$n$, $c$case when bk = 6 then bet + bet / 2$c$),
    ('town_rent', $o$tx := public.town_tax(r.money);$o$, $n$tx := public.town_tax(r.money + coalesce((r.items->'cas'->>'ch')::bigint, 0));$n$, $c$'cas'->>'ch'$c$),
    -- 早期版本把籌碼放 items.cs（和咖啡集點卡撞名），已改 items.cas；已套用舊版的 town_rent 改讀新 key
    ('town_rent', $o$r.items->'cs'->>'ch'$o$, $n$r.items->'cas'->>'ch'$n$, $c$'cas'->>'ch'$c$)
  ) as t(fname, o, nw, chk) loop
    for f in select p.oid from pg_proc p where p.pronamespace = 'public'::regnamespace
        and ((rec.fname is null and p.proname not in ('town_game','town_game2','town_score','town_duel')) or p.proname = rec.fname)
        and position(rec.o in p.prosrc) > 0 and position(rec.chk in p.prosrc) = 0 loop
      d := replace(pg_get_functiondef(f.oid), rec.o, rec.nw); execute d;
    end loop;
  end loop;
end $do$;

-- 單注上限：只受籌碼數量限制（wrapper 在呼叫內部函式前把 money 換成籌碼，所以 m 就是籌碼）
create or replace function public.town_casino_maxbet(m bigint) returns int language sql immutable as $$
  select least(2000000000, greatest(0, m))::int
$$;
create or replace function public.town_casino_norm(g text) returns text language sql immutable as $$
  select case when g like 'hl\_%' then 'hl' when g like 'bj\_%' then 'bj' when g like 'dg\_%' then 'dg' else g end
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
  if game not in ('hl_start','hl_guess','wheel','bj_start','bj_hit','bj_stand','dice','slots','keno','bacc','niu','dg_info','dg_start','dg_play') then raise exception '沒有這個遊戲'; end if;
  if public.town_is_off(r.town_id, 'casino') then raise exception '這個小鎮沒有開賭場'; end if;
  if r.place <> 'casino' then raise exception '賭場在小豬賭場，走過去再玩'; end if;
  v_bet := game in ('hl_start','wheel','bj_start','dice','slots','keno','bacc','niu','dg_play');
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
    v_pend := (its ? 'hlg') or (its ? 'bj');
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

-- 櫃台與狀態：view 看狀態、buy 現金換籌碼（1:1）、sell 籌碼換回現金（抽 0.5%，無條件進位）
create or replace function public.town_casino_state(rid bigint, pin text, op text default 'view', val int default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; cs jsonb; v_day text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); v_chips bigint; v_fee bigint; v_rounds bigint; v_net bigint;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  cs := coalesce(r.items->'cas','{}'::jsonb);
  v_chips := coalesce((cs->>'ch')::bigint, 0);
  if op = 'buy' then
    if r.place <> 'casino' then raise exception '要在賭場櫃台才能換籌碼'; end if;
    if val is null or val < 1 then raise exception '要換多少？'; end if;
    if val > r.money then raise exception '現金不夠'; end if;
    v_chips := v_chips + val; cs := cs || jsonb_build_object('ch', v_chips);
    update public.town_residents p set money = p.money - val, items = jsonb_set(p.items, '{cas}', cs) where p.id = rid;
    r.money := r.money - val;
  elsif op = 'sell' then
    if r.place <> 'casino' then raise exception '要在賭場櫃台才能換回現金'; end if;
    if val is null or val < 1 then raise exception '要換回多少？'; end if;
    if val > v_chips then raise exception '籌碼不夠'; end if;
    v_fee := (val::bigint * 5 + 999) / 1000;
    v_chips := v_chips - val; cs := cs || jsonb_build_object('ch', v_chips);
    update public.town_residents p set money = p.money + (val - v_fee), items = jsonb_set(p.items, '{cas}', cs) where p.id = rid;
    r.money := r.money + (val - v_fee);
    perform public.town_fund_add(r.town_id, 'casino', (v_fee / 2)::int);
  elsif op <> 'view' then raise exception '未知動作'; end if;
  select coalesce(sum(l.rounds), 0), coalesce(sum(l.net), 0) into v_rounds, v_net from public.town_casino_log l where l.rid = rid and l.day = v_day;
  return json_build_object('ok', true, 'money', r.money, 'chips', v_chips, 'rounds', v_rounds, 'net', v_net, 'bh', coalesce(cs->>'bh', ''),
    'jp', coalesce((select j.amount from public.town_jackpot j where j.town_id = r.town_id), 0));
end $$;

revoke all on function public.town_casino_maxbet(bigint), public.town_casino_norm(text) from public, anon, authenticated;
revoke all on function public.town_casino(bigint,text,text,int,text), public.town_casino_state(bigint,text,text,int) from public;
grant execute on function public.town_casino(bigint,text,text,int,text), public.town_casino_state(bigint,text,text,int) to anon, authenticated;
-- 離場強制換回現金（使用者 2026-11-23）：居民的 place 從 casino 變成別處（走出去、回家、睡覺、入獄、送醫、離線自動回家、傳送……任何路徑）時，
-- 剩下的籌碼自動換回現金（手續費 0.5% 無條件進位，一半進鎮基金、一半銷毀），寫一行動態；沒有籌碼就什麼都不做；換完籌碼歸零，不會重複結算。
-- 用資料表觸發器做，所以不用一個個去改 town_act／town_tick／入獄等函式。
create or replace function public.town_casino_leave() returns trigger language plpgsql security definer set search_path = public as $$
declare v_chips bigint; v_fee bigint; v_back bigint;
begin
  v_chips := coalesce((NEW.items->'cas'->>'ch')::bigint, 0);
  if v_chips <= 0 then return NEW; end if;
  v_fee := (v_chips * 5 + 999) / 1000; v_back := v_chips - v_fee;
  NEW.money := NEW.money + v_back;
  NEW.items := jsonb_set(NEW.items, '{cas,ch}', '0'::jsonb);
  perform public.town_fund_add(NEW.town_id, 'casino', (v_fee / 2)::int);
  insert into public.town_events(town_id, actor, target, kind, msg) values (NEW.town_id, NEW.id, NEW.id, 'luck', NEW.name || ' 離開賭場，籌碼換回現金 €' || v_back || '（手續費 €' || v_fee || '）');
  return NEW;
end $$;
revoke all on function public.town_casino_leave() from public, anon, authenticated;
drop trigger if exists town_casino_leave on public.town_residents;
create trigger town_casino_leave before update of place on public.town_residents for each row
  when (OLD.place = 'casino' and NEW.place is distinct from 'casino') execute function public.town_casino_leave();
-- 舊版（預算制）的輔助函式不再使用
drop function if exists public.town_casino_calc(public.town_residents);
