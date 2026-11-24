-- 小豬鎮：鎮長管理權第二批（2026-11-24）：發動全鎮活動 event、任命官員 appoint、全民紅包 payout、搬設施 relocate（只登記）。
-- 套用順序：town_powers.sql → town_world.sql → 這份（town_move.sql 之後也行）。可重複執行；重套 town_powers.sql／town_world.sql 後要再套一次。
-- 做法：用 pg_get_functiondef 就地補丁 town_pw_def／town_pw_name／town_pw_check／town_pw_do／town_pw_undo／town_pw_close／town_power／town_world，
-- 找不到錨點整檔失敗（rollback），已補過就跳過（略過標記是只出現在補丁新內容的字串）；新邏輯放在新函式 town_pw2_*，不整份重貼別人的函式。
-- 全部花鎮基金、寫公開動態 kind mayor、不新增印錢路徑、現金與基金不變負；不碰 town_econ（補差金 pend 不動）。
--
-- A 發動全鎮活動 event（mode 0 鎮長，num 1 市集日／2 慶典／3 煙火夜）：
--   市集日（吃喝價 85%，90 分鐘）、慶典（價 90%、薪 105%，90 分鐘）、煙火夜（無價格影響，30 分鐘，發動當下全鎮 10 分鐘內上線、醒著、不在牢裡的居民心情 +12，只一次）。
--   效果沿用 town_worlds／town_px／town_wd_pct（kind 沒有的都當 100%，所以煙火夜不影響價格）。同時只能有 1 個全鎮事件，進行中不能再發動，也不能選景氣差／停電。
--   費用 = 底價 × 規模係數，底價 市集日 3000／慶典 8000／煙火夜 2000，規模係數 = min(5, max(1, 居民人數 / 5))，四捨五入，花鎮基金（銷毀，不退）。
--   全鎮每天 ≤ 2 次、冷卻 120 分鐘；小鎮成立 30 分鐘內不能用；發動後自然事件在結束後才排下一個。
-- B 任命官員 appoint（mode 0 鎮長，num 1 任命警長／2 任命財務官／3 免警長／4 免財務官，tg = 對象；免職的 tg 要是現任）：
--   各 1 人、任期 3 天（town_powers.officers = {sheriff:{rid,name,until},treasurer:{...}}，缺值 = 沒有官員）、居民 ≥ 3 人、不能任命自己或鎮長、一人只能一個官職、鎮長隨時可免、官員可辭職（town_power op=resign，note = sheriff|treasurer）。
--   警長：每天 1 次替鎮長關人，10～60 分鐘，走 jail 的所有安全閥且計入鎮長的全鎮每日次數（3），動態「警長 X 把 Y 關進監獄」，可申訴。
--   財務官：每天 1 次發補助 100～1500 給 1 人，花鎮基金，不能給自己，只能直接發（不能交投票），動態公開，可申訴（推翻 = 向對方收回，收到他現有的錢為止，還給鎮基金）。
-- C 全民紅包 payout（mode 2：鎮長可選，大額交居民投票）：num = 動用鎮基金的百分比 5～20；活躍居民 = 近 3 天上線（seen_at），要 ≥ 3 人；
--   每人分到 min(2000, floor(基金 × num% ÷ 活躍人數))，鎮長也只拿一份；全鎮每 3 天 ≤ 1 次；num > 10（基金 10% 以上）一定要居民投票（贊成多於反對、至少 2 票）；
--   錢直接進現金，每位領到的人一則 luck 動態＋一則 mayor 動態；不碰 town_econ.pend。
-- D 搬設施 relocate（ext 1）：只在登錄表登記，前端轉到不動產公司的搬遷畫面（town_move.sql 的規則不改）。

alter table public.town_powers add column if not exists officers jsonb not null default '{}'::jsonb;

-- 1) 登錄表與名稱
do $pw$
declare def text; nd text; fn regprocedure := 'public.town_pw_def(text)'::regprocedure;
begin
  def := pg_get_functiondef(fn);
  if position($q$when 'payout'$q$ in def) > 0 then return; end if;
  if position($q$    else null end$q$ in def) = 0 then raise exception '找不到錨點：town_pw_def'; end if;
  nd := replace(def, $q$    else null end$q$, $q$    when 'event'    then array[0, 1, 3, 2, 0, 120, 0, 1, 0, 0, 0]
    when 'appoint'  then array[0, 1, 4, 6, 0, 0, 1, 0, 0, 0, 0]
    when 'payout'   then array[2, 5, 20, 1, 0, 4320, 0, 1, 0, 0, 0]
    when 'relocate' then array[0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
    else null end$q$);
  execute nd;
end $pw$;
do $pw$
declare def text; nd text; fn regprocedure := 'public.town_pw_name(text)'::regprocedure;
begin
  def := pg_get_functiondef(fn);
  if position($q$when 'payout'$q$ in def) > 0 then return; end if;
  if position($q$else pk end$q$ in def) = 0 then raise exception '找不到錨點：town_pw_name'; end if;
  nd := replace(def, $q$else pk end$q$, $q$when 'event' then '全鎮活動' when 'appoint' then '任命官員' when 'payout' then '全民紅包' when 'relocate' then '搬設施' else pk end$q$);
  execute nd;
end $pw$;

-- 2) 新函式
create or replace function public.town_pw2_cost(tid text, num int) returns int
language sql stable security definer set search_path = public as $$
  select round((case num when 1 then 3000 when 2 then 8000 else 2000 end)
    * least(5, greatest(1, (select count(*) from public.town_residents where town_id = tid) / 5.0)))::int
$$;

create or replace function public.town_pw2_check(tid text, actor bigint, pk text, tg bigint, num int) returns void
language plpgsql security definer set search_path = public as $$
declare v_n int; v_fund bigint; v_w public.town_worlds; v_off jsonb; v_c int; v_act int; v_ofc text; v_cur jsonb; v_other jsonb;
begin
  if pk not in ('event','appoint','payout') then return; end if;
  select count(*) into v_n from public.town_residents where town_id = tid;
  select coalesce(fund, 0) into v_fund from public.town_towns where id = tid;
  if pk = 'event' then
    if exists (select 1 from public.town_towns where id = tid and created_at > now() - interval '30 minutes') then
      raise exception '小鎮剛成立不到 30 分鐘，還不能發動全鎮活動'; end if;
    select * into v_w from public.town_worlds where town_id = tid;
    if found and v_w.k is not null and v_w.until > now() then raise exception '現在已經有全鎮事件在進行了，等結束再發動'; end if;
    v_c := public.town_pw2_cost(tid, num);
    if v_fund < v_c then raise exception '鎮基金不夠（要 €%，現在 €%）', v_c, v_fund; end if;
  elsif pk = 'appoint' then
    if v_n < 3 then raise exception '小鎮至少要有 3 位居民才能任命官員'; end if;
    select officers into v_off from public.town_powers where town_id = tid;
    v_off := coalesce(v_off, '{}'::jsonb);
    v_ofc := (case when num in (1, 3) then 'sheriff' else 'treasurer' end);
    v_cur := v_off->v_ofc;
    if num in (1, 2) then
      if coalesce((select mayor from public.town_residents where id = tg), false) then raise exception '不能任命鎮長'; end if;
      if v_cur is not null and (v_cur->>'until')::timestamptz > now() then
        raise exception '已經有%了（%），要先免職或等任期結束', (case when num = 1 then '警長' else '財務官' end), v_cur->>'name'; end if;
      v_other := v_off->(case when num = 1 then 'treasurer' else 'sheriff' end);
      if v_other is not null and (v_other->>'rid')::bigint = tg and (v_other->>'until')::timestamptz > now() then
        raise exception '他已經擔任另一個官職了，一個人只能一個官職'; end if;
    else
      if v_cur is null or (v_cur->>'until')::timestamptz <= now() or (v_cur->>'rid')::bigint <> tg then
        raise exception '這個官職現在不是這個人'; end if;
    end if;
  else
    if v_n < 3 then raise exception '小鎮至少要有 3 位居民才能發紅包'; end if;
    select count(*) into v_act from public.town_residents where town_id = tid and seen_at > now() - interval '3 days';
    if v_act < 3 then raise exception '近 3 天上線的居民要有 3 位以上才能發紅包（現在 % 位）', v_act; end if;
    if floor(v_fund * num / 100.0) / v_act < 1 then raise exception '鎮基金太少，每人分不到 €1'; end if;
  end if;
end $$;

-- 官員行使鎮長的 jail／grant：回傳官職代號（不是官員回 null）；各條額外限制在這裡擋
create or replace function public.town_pw2_officer(tid text, rid bigint, pk text, num int) returns text
language plpgsql security definer set search_path = public as $$
declare v_ofc text := (case pk when 'jail' then 'sheriff' when 'grant' then 'treasurer' else null end); v_cur jsonb; v_used int;
  v_today date := (now() at time zone 'Asia/Taipei')::date;
begin
  if v_ofc is null then return null; end if;
  select officers->v_ofc into v_cur from public.town_powers where town_id = tid;
  if v_cur is null or (v_cur->>'rid')::bigint <> rid or (v_cur->>'until')::timestamptz <= now() then return null; end if;
  if pk = 'jail' and (num is null or num > 60) then raise exception '警長一次最多關 60 分鐘'; end if;
  if pk = 'grant' and (num is null or num > 1500) then raise exception '財務官一次最多發 €1500'; end if;
  select count(*) into v_used from public.town_powers p, jsonb_array_elements(p.log) as z(e)
    where p.town_id = tid and z.e->>'k' = pk and z.e->>'via' = v_ofc and ((z.e->>'at')::timestamptz at time zone 'Asia/Taipei')::date = v_today;
  if v_used >= 1 then raise exception '你今天已經以%的身分行使過了', (case when pk = 'jail' then '警長' else '財務官' end); end if;
  return v_ofc;
end $$;

create or replace function public.town_pw2_do(tid text, a public.town_residents, pk text, tg bigint, num int, via text, lid text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_t public.town_residents; v_c int; v_k text; v_nm text; v_mins int; v_ofc text; v_on text; v_fund bigint; v_act int; v_per int; v_tot bigint; v_cnt int;
begin
  if pk = 'event' then
    v_c := public.town_pw2_cost(tid, num);
    update public.town_towns set fund = fund - v_c where id = tid and fund >= v_c;
    if not found then raise exception '鎮基金不夠'; end if;
    v_k := (case num when 1 then 'market' when 2 then 'festival' else 'fireworks' end);
    v_nm := (case num when 1 then '市集日' when 2 then '小鎮慶典' else '煙火夜' end);
    v_mins := (case when num = 3 then 30 else 90 end);
    insert into public.town_worlds(town_id, k, until, next_at)
      values (tid, v_k, now() + make_interval(mins => v_mins), now() + make_interval(mins => v_mins + 60 + floor(random() * 121)::int))
      on conflict (town_id) do update set k = excluded.k, until = excluded.until, next_at = excluded.next_at;
    if num = 3 then
      update public.town_residents set fun = least(100, fun + 12)
        where town_id = tid and seen_at > now() - interval '10 minutes' and not sleeping and place <> 'jail';
    end if;
    insert into public.town_events(town_id, actor, kind, msg) values (tid, null, 'world', left('小鎮事件：' || v_nm || '（鎮長 ' || a.name || ' 發動）', 118));
    return jsonb_build_object('msg', '發動了「' || v_nm || '」，花鎮基金 €' || v_c,
      'pub', a.name || ' 以鎮長權力發動全鎮活動「' || v_nm || '」，花鎮基金 €' || v_c || (case when num = 3 then '，在線居民心情 +12' else '' end));
  elsif pk = 'appoint' then
    v_ofc := (case when num in (1, 3) then 'sheriff' else 'treasurer' end);
    v_on := (case when num in (1, 3) then '警長' else '財務官' end);
    select * into v_t from public.town_residents where id = tg and town_id = tid for update;
    if not found then raise exception '找不到這位居民'; end if;
    if num in (1, 2) then
      update public.town_powers set officers = jsonb_set(coalesce(officers, '{}'::jsonb), array[v_ofc],
        jsonb_build_object('rid', v_t.id, 'name', v_t.name, 'until', now() + interval '3 days')) where town_id = tid;
      v_t := public.town_pw_pwn(v_t, lid, pk, a.name, '鎮長 ' || a.name || ' 任命你為' || v_on || '，任期 3 天。' ||
        (case when num = 1 then '你每天可以替鎮長關 1 次人（10～60 分鐘），居民可以申訴。' else '你每天可以發 1 筆補助（€100～1500，花鎮基金），居民可以申訴。' end) ||
        '不想當可以到「鎮長管理權」辭職', false);
      perform public.town_save_r(v_t);
      return jsonb_build_object('msg', '任命 ' || v_t.name || ' 為' || v_on || '，任期 3 天', 'pub', a.name || ' 任命 ' || v_t.name || ' 為' || v_on || '，任期 3 天');
    else
      update public.town_powers set officers = coalesce(officers, '{}'::jsonb) - v_ofc where town_id = tid;
      v_t := public.town_pw_pwn(v_t, lid, pk, a.name, '鎮長 ' || a.name || ' 免去了你的' || v_on || '職務', false);
      perform public.town_save_r(v_t);
      return jsonb_build_object('msg', '免去了 ' || v_t.name || ' 的' || v_on, 'pub', a.name || ' 免去了 ' || v_t.name || ' 的' || v_on);
    end if;
  elsif pk = 'payout' then
    select coalesce(fund, 0) into v_fund from public.town_towns where id = tid for update;
    if num > 10 and via <> 'vote' then raise exception '動用基金超過 10%% 要交居民投票'; end if;
    select count(*) into v_act from public.town_residents where town_id = tid and seen_at > now() - interval '3 days';
    if v_act < 3 then raise exception '近 3 天上線的居民要有 3 位以上才能發紅包'; end if;
    v_per := least(2000, floor(v_fund * num / 100.0 / v_act))::int;
    if v_per < 1 then raise exception '鎮基金太少，每人分不到 €1'; end if;
    v_tot := v_per::bigint * v_act;
    update public.town_towns set fund = fund - v_tot where id = tid and fund >= v_tot;
    if not found then raise exception '鎮基金不夠'; end if;
    update public.town_residents set money = money + v_per where town_id = tid and seen_at > now() - interval '3 days';
    get diagnostics v_cnt = row_count;
    if v_cnt <> v_act then raise exception '居民名單剛好變了，請再試一次'; end if;
    insert into public.town_events(town_id, actor, kind, msg)
      select tid, id, 'luck', left(name || ' 領到鎮長的全民紅包 €' || v_per, 118) from public.town_residents where town_id = tid and seen_at > now() - interval '3 days';
    return jsonb_build_object('paid', v_per, 'msg', '全民紅包發出去了：' || v_act || ' 位活躍居民每人 €' || v_per || '（共 €' || v_tot || '，來自鎮基金）',
      'pub', a.name || ' 以鎮長權力發了全民紅包，' || v_act || ' 位活躍居民每人 €' || v_per || '（鎮基金 −€' || v_tot || ')' || (case when via = 'vote' then '（居民投票通過）' else '' end));
  else raise exception '這個權力不在這裡行使';
  end if;
end $$;

create or replace function public.town_pw2_resign(tid text, r public.town_residents, note text) returns text
language plpgsql security definer set search_path = public as $$
declare v_cur jsonb;
begin
  if coalesce(note, '') not in ('sheriff', 'treasurer') then raise exception '要辭哪個官職'; end if;
  select officers->note into v_cur from public.town_powers where town_id = tid;
  if v_cur is null or (v_cur->>'rid')::bigint <> r.id or (v_cur->>'until')::timestamptz <= now() then raise exception '你現在不是這個官職'; end if;
  update public.town_powers set officers = officers - note where town_id = tid;
  insert into public.town_events(town_id, actor, kind, msg) values (tid, r.id, 'mayor', left(r.name || ' 辭去了' || (case when note = 'sheriff' then '警長' else '財務官' end) || '職務', 118));
  return '你辭去了' || (case when note = 'sheriff' then '警長' else '財務官' end);
end $$;

create or replace function public.town_pw2_view(tid text, rid bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_off jsonb; v_w public.town_worlds; v_res jsonb := '{}'::jsonb; v_used jsonb := '{}'::jsonb; v_o text; v_cur jsonb; v_me text; v_world jsonb := null;
  v_today date := (now() at time zone 'Asia/Taipei')::date; v_pk text; v_cnt int;
begin
  select officers into v_off from public.town_powers where town_id = tid;
  v_off := coalesce(v_off, '{}'::jsonb);
  foreach v_o in array array['sheriff', 'treasurer'] loop
    v_cur := v_off->v_o;
    if v_cur is not null and (v_cur->>'until')::timestamptz > now() and exists (select 1 from public.town_residents where id = (v_cur->>'rid')::bigint and town_id = tid) then
      v_res := v_res || jsonb_build_object(v_o, jsonb_build_object('id', (v_cur->>'rid')::bigint,
        'name', (select name from public.town_residents where id = (v_cur->>'rid')::bigint), 'until', v_cur->>'until'));
      if (v_cur->>'rid')::bigint = rid then v_me := v_o; end if;
      v_pk := (case when v_o = 'sheriff' then 'jail' else 'grant' end);
      select count(*) into v_cnt from public.town_powers p, jsonb_array_elements(p.log) as z(e)
        where p.town_id = tid and z.e->>'k' = v_pk and z.e->>'via' = v_o and ((z.e->>'at')::timestamptz at time zone 'Asia/Taipei')::date = v_today;
      v_used := v_used || jsonb_build_object(v_o, v_cnt >= 1);
    end if;
  end loop;
  select * into v_w from public.town_worlds where town_id = tid;
  if found and v_w.k is not null and v_w.until > now() then v_world := jsonb_build_object('k', v_w.k, 'until', v_w.until); end if;
  return jsonb_build_object('officers', v_res, 'me', v_me, 'used', v_used, 'world', v_world,
    'newtown', exists (select 1 from public.town_towns where id = tid and created_at > now() - interval '30 minutes'),
    'cost', jsonb_build_object('1', public.town_pw2_cost(tid, 1), '2', public.town_pw2_cost(tid, 2), '3', public.town_pw2_cost(tid, 3)),
    'active', (select count(*) from public.town_residents where town_id = tid and seen_at > now() - interval '3 days'));
end $$;

revoke all on function public.town_pw2_cost(text,int), public.town_pw2_check(text,bigint,text,bigint,int), public.town_pw2_officer(text,bigint,text,int),
  public.town_pw2_do(text,public.town_residents,text,bigint,int,text,text), public.town_pw2_resign(text,public.town_residents,text), public.town_pw2_view(text,bigint)
  from public, anon, authenticated;

-- 3) 補丁既有函式
do $pw$
declare def text; nd text; fn regprocedure := 'public.town_pw_check(text,bigint,text,bigint,int)'::regprocedure;
begin
  def := pg_get_functiondef(fn);
  if position('town_pw2_check' in def) > 0 then return; end if;
  if position($q$
  if pk = 'jail' then
$q$ in def) = 0 then raise exception '找不到錨點：town_pw_check'; end if;
  nd := replace(def, $q$
  if pk = 'jail' then
$q$, $q$
  perform public.town_pw2_check(tid, actor, pk, tg, num);
  if pk = 'jail' then
$q$);
  execute nd;
end $pw$;

do $pw$
declare def text; nd text; fn regprocedure := 'public.town_pw_do(text,bigint,text,bigint,int,text)'::regprocedure;
begin
  def := pg_get_functiondef(fn);
  if position('town_pw2_do' in def) > 0 then return; end if;
  nd := def;
  if position($q$  elsif pk = 'impeach' then
    update public.town_residents set mayor = false$q$ in nd) = 0 then raise exception '找不到錨點：town_pw_do impeach'; end if;
  nd := replace(nd, $q$  elsif pk = 'impeach' then
    update public.town_residents set mayor = false$q$, $q$  elsif pk in ('event', 'appoint', 'payout') then
    e := public.town_pw2_do(tid, a, pk, tg, num, via, lid);
    msg := e->>'msg'; pub := e->>'pub'; paid := nullif(e->>'paid', '')::int;
  elsif pk = 'impeach' then
    update public.town_residents set mayor = false$q$);
  if position($q$a.name || ' 以鎮長權力把 '$q$ in nd) = 0 then raise exception '找不到錨點：town_pw_do jail pub'; end if;
  nd := replace(nd, $q$a.name || ' 以鎮長權力把 '$q$, $q$(case when via = 'sheriff' then '警長 ' || a.name || ' 把 ' else a.name || ' 以鎮長權力把 ' end)$q$);
  if position($q$'鎮長 ' || a.name || ' 把你關進監獄 '$q$ in nd) = 0 then raise exception '找不到錨點：town_pw_do jail pwn'; end if;
  nd := replace(nd, $q$'鎮長 ' || a.name || ' 把你關進監獄 '$q$, $q$(case when via = 'sheriff' then '警長 ' else '鎮長 ' end) || a.name || ' 把你關進監獄 '$q$);
  if position($q$a.name || ' 以鎮長權力從鎮基金發了補助 €'$q$ in nd) = 0 then raise exception '找不到錨點：town_pw_do grant pub'; end if;
  nd := replace(nd, $q$a.name || ' 以鎮長權力從鎮基金發了補助 €'$q$, $q$(case when via = 'treasurer' then '財務官 ' || a.name || ' 從鎮基金發了補助 €' else a.name || ' 以鎮長權力從鎮基金發了補助 €' end)$q$);
  if position($q$'鎮長 ' || a.name || ' 從鎮基金發了補助 €'$q$ in nd) = 0 then raise exception '找不到錨點：town_pw_do grant pwn'; end if;
  nd := replace(nd, $q$'鎮長 ' || a.name || ' 從鎮基金發了補助 €'$q$, $q$(case when via = 'treasurer' then '財務官 ' else '鎮長 ' end) || a.name || ' 從鎮基金發了補助 €'$q$);
  if position($q$'ap', d[9] = 1$q$ in nd) = 0 then raise exception '找不到錨點：town_pw_do ap'; end if;
  nd := replace(nd, $q$'ap', d[9] = 1$q$, $q$'ap', (d[9] = 1 or via = 'treasurer')$q$);
  execute nd;
end $pw$;

do $pw$
declare def text; nd text; fn regprocedure := 'public.town_pw_undo(text,text)'::regprocedure;
begin
  def := pg_get_functiondef(fn);
  if position('收回 €' in def) > 0 then return; end if;
  if position($q$  else msg := '推翻'; end if;$q$ in def) = 0 then raise exception '找不到錨點：town_pw_undo'; end if;
  nd := replace(def, $q$  else msg := '推翻'; end if;$q$, $q$  elsif en->>'k' = 'grant' then
    n := coalesce((en->>'n')::int, 0);
    back := least(n, greatest(0, t.money));
    t.money := t.money - back;
    update public.town_towns set fund = fund + back where id = tid;
    t := public.town_pw_pwn(t, lid, 'free', '居民投票', '居民投票推翻了那筆補助，收回 €' || back || '（還給鎮基金）', false);
    perform public.town_save_r(t);
    msg := '推翻補助，向 ' || t.name || ' 收回 €' || back || '（還給鎮基金）';
  else msg := '推翻'; end if;$q$);
  execute nd;
end $pw$;

do $pw$
declare def text; nd text; fn regprocedure := 'public.town_pw_close(text)'::regprocedure;
begin
  def := pg_get_functiondef(fn);
  if position($q$v->>'k' = 'payout'$q$ in def) > 0 then return; end if;
  if position($q$    ok := yn > nn and yn >= 3 and yn * 2 > nres;$q$ in def) = 0 then raise exception '找不到錨點：town_pw_close'; end if;
  nd := replace(def, $q$    ok := yn > nn and yn >= 3 and yn * 2 > nres;$q$, $q$    ok := yn > nn and (case when v->>'k' = 'payout' then yn >= 2 else yn >= 3 and yn * 2 > nres end);$q$);
  execute nd;
end $pw$;

do $pw$
declare def text; nd text; fn regprocedure := 'public.town_power(bigint,text,text,text,bigint,int,text)'::regprocedure;
begin
  def := pg_get_functiondef(fn);
  if position('town_pw2_officer' in def) > 0 then return; end if;
  if position($q$      if not r.mayor then raise exception '只有鎮長可以行使這個權力'; end if;
      msg := public.town_pw_do(r.town_id, rid, pk, tg, num, 'mayor');$q$ in def) = 0 then raise exception '找不到錨點：town_power use'; end if;
  nd := replace(def, $q$      if not r.mayor then raise exception '只有鎮長可以行使這個權力'; end if;
      msg := public.town_pw_do(r.town_id, rid, pk, tg, num, 'mayor');$q$, $q$      if r.mayor then
        msg := public.town_pw_do(r.town_id, rid, pk, tg, num, 'mayor');
      else
        vk := public.town_pw2_officer(r.town_id, rid, pk, num);
        if vk is null then raise exception '只有鎮長可以行使這個權力'; end if;
        msg := public.town_pw_do(r.town_id, rid, pk, tg, num, vk);
      end if;$q$);
  if position($q$  elsif op = 'toggle' then$q$ in nd) = 0 then raise exception '找不到錨點：town_power toggle'; end if;
  nd := replace(nd, $q$  elsif op = 'toggle' then$q$, $q$  elsif op = 'resign' then
    msg := public.town_pw2_resign(r.town_id, r, note);
  elsif op = 'toggle' then$q$);
  if position($q$'mayor', r.mayor, 'nres', nres, 'off', to_json(pw.off),$q$ in nd) = 0 then raise exception '找不到錨點：town_power return'; end if;
  nd := replace(nd, $q$'mayor', r.mayor, 'nres', nres, 'off', to_json(pw.off),$q$, $q$'mayor', r.mayor, 'nres', nres, 'off', to_json(pw.off), 'p2', public.town_pw2_view(r.town_id, rid),$q$);
  execute nd;
end $pw$;

do $pw$
declare def text; nd text; fn regprocedure := 'public.town_world(bigint,text,text)'::regprocedure;
begin
  def := pg_get_functiondef(fn);
  if position($q$'fireworks'$q$ in def) > 0 then return; end if;
  if position($q$case w.k when 'market' then '市集日'$q$ in def) = 0 then raise exception '找不到錨點：town_world'; end if;
  nd := replace(def, $q$case w.k when 'market' then '市集日'$q$, $q$case w.k when 'fireworks' then '煙火夜' when 'market' then '市集日'$q$);
  execute nd;
end $pw$;
