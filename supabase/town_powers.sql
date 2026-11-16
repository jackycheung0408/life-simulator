-- 小豬鎮：鎮長管理權（2026-11-16）。資料驅動的權力機制：新增一個權力 = town_pw_def 加一列＋town_pw_do 加一個分支（前端 POWERS 也加一列）。
-- 套用順序：town.sql → town_social.sql → town_fi.sql → town_jail.sql → town_civic.sql → 這份。可重複執行。
-- 不改 town_act／town_mayor／town_civic：獨立 RPC town_power(rid,pin,op,pk,tg,num,note)，資料表 town_powers（RLS 全關），被行使的人的通知存 items.pwn（缺值 = 沒有）。
-- 角色都不會死、錢不會變負、沒有欠款。前端 town.js 的 POWERS 與這裡的 town_pw_def 要一致，node town/test.js 會比對。
--
-- 登錄表 town_pw_def(代號) = int[11]：
--   1 mode      0 鎮長直接下令／1 要居民投票／2 鎮長可選（直接，或 note='vote' 交給居民投票）
--   2 min 3 max 單次數值範圍（刑期分鐘、金額）；0 = 不用數值
--   4 tday      全鎮每天最多幾次（0 = 不限）
--   5 pper      每人每天最多被施行幾次（0 = 不限）
--   6 cdmin     同一權力的冷卻分鐘（全鎮共用）
--   7 needT     需要對象居民（1/0）
--   8 fund      會動用鎮基金（1/0，只是標示；實際檢查在分支裡）
--   9 appeal    可申訴、投票推翻（1/0）
--  10 ext       在別處行使（1 = 走市政廳／設施面板，這裡只是登錄、可看紀錄；town_pw_do 不執行）
--  11 lock      不能被鎮長關掉（1/0）
-- 代號：jail 關進監獄、free 放人、fine 罰款、grant 發補助、announce 公告（市政廳）、build 建設案（市政廳投票）、feat 設施開關（town_features）、impeach 彈劾鎮長。
--
-- 安全閥（數值寫在 town_pw_def，其餘在 town_pw_check／town_pw_do）：
--   關人：10～120 分鐘、全鎮每天 3 人、每人每天 1 次、10 分鐘冷卻；不能關自己、不能關鎮長、對方睡覺／住院／已被關不能關、監獄被關掉不能關；
--         不記前科、被關的人照常保釋／勞動／越獄／假釋；申訴推翻 = 提前放人。
--   罰款：100～2000、全鎮每天 5 次、每人每天 1 次；付到 0 為止、不欠款、進鎮基金；身上沒錢不能罰；推翻 = 從鎮基金退回（基金不夠退多少算多少）。
--   補助：100～3000，花鎮基金、每人每天 1 次、全鎮每天 5 次，不能給自己，基金不夠不行；mode=2（鎮長直接給，或交居民投票）。
--   小鎮不到 3 人，關人／罰款／補助不能用（鎮長自導自演；也沒有人能申訴）；放人要 2 人。
--   申訴：任何居民（鎮長除外）24 小時內可對關人／罰款提出，居民投票 12 小時，贊成多於反對、至少 2 票、而且多於非鎮長居民的一半才推翻。
--   彈劾：任何居民可提名一位鎮民接任，投票 24 小時，贊成多於反對、至少 3 票、而且多於全部居民的一半才換人；4320 分鐘（3 天）才能再發起。
--   一次只有一個投票（申訴或彈劾）。鎮長可以關掉 jail／free／fine／grant（lock = 1 的不能關）。
create table if not exists public.town_powers (
  town_id text primary key references public.town_towns(id) on delete cascade,
  off text[] not null default '{}',
  log jsonb not null default '[]'::jsonb,
  vote jsonb,
  hist jsonb not null default '[]'::jsonb
);
alter table public.town_powers enable row level security;
revoke all on public.town_powers from anon, authenticated;

create or replace function public.town_pw_def(pk text) returns int[] language sql immutable as $$
  select case pk
    when 'jail'     then array[0, 10, 120, 3, 1, 10, 1, 0, 1, 0, 0]
    when 'free'     then array[0, 0, 0, 5, 1, 0, 1, 0, 0, 0, 0]
    when 'fine'     then array[0, 100, 2000, 5, 1, 10, 1, 0, 1, 0, 0]
    when 'grant'    then array[2, 100, 3000, 5, 1, 5, 1, 1, 0, 0, 0]
    when 'announce' then array[0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
    when 'build'    then array[1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1]
    when 'feat'     then array[0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
    when 'impeach'  then array[1, 0, 0, 1, 1, 4320, 1, 0, 0, 0, 1]
    else null end
$$;
create or replace function public.town_pw_name(pk text) returns text language sql immutable as $$
  select case pk when 'jail' then '關進監獄' when 'free' then '放人' when 'fine' then '罰款' when 'grant' then '發補助' when 'announce' then '公告'
    when 'build' then '建設案' when 'feat' then '設施開關' when 'impeach' then '彈劾鎮長' else pk end
$$;
revoke all on function public.town_pw_def(text), public.town_pw_name(text) from public, anon, authenticated;

-- 通知：被行使的人上線時彈窗（items.pwn，最多 5 則，看過按「知道了」清掉）
create or replace function public.town_pw_pwn(t public.town_residents, lid text, pk text, bn text, m text, ap boolean) returns public.town_residents language plpgsql as $$
declare a jsonb := coalesce(t.items->'pwn', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('id', lid, 'k', pk, 'bn', bn, 'm', m, 'at', now(), 'ap', ap));
begin
  while jsonb_array_length(a) > 5 loop a := a - 0; end loop;
  t.items := jsonb_set(t.items, '{pwn}', a);
  return t;
end $$;
revoke all on function public.town_pw_pwn(public.town_residents,text,text,text,text,boolean) from public, anon, authenticated;

-- 檢查（不改資料）：所有安全閥都在這裡與 town_pw_do，直接下令、投票發起、投票通過時都會跑
create or replace function public.town_pw_check(tid text, actor bigint, pk text, tg bigint, num int) returns void
language plpgsql security definer set search_path = public as $$
declare d int[] := public.town_pw_def(pk); t public.town_residents; pw public.town_powers; nres int; nt int; np int; lastat timestamptz;
  today date := (now() at time zone 'Asia/Taipei')::date; fnd bigint;
begin
  if d is null or d[10] = 1 then raise exception '這個權力不在這裡行使'; end if;
  select * into pw from public.town_powers where town_id = tid;
  if found then
    if d[11] = 0 and array_position(pw.off, pk) is not null then raise exception '鎮長把「%」關掉了', public.town_pw_name(pk); end if;
  end if;
  select count(*) into nres from public.town_residents where town_id = tid;
  if pk in ('jail','fine','grant') and nres < 3 then raise exception '小鎮至少要有 3 位居民才能用這個權力（要有人能申訴、投票）'; end if;
  if d[7] = 1 then
    if tg is null then raise exception '要選一位居民'; end if;
    if pk <> 'impeach' and tg = actor then raise exception '不能對自己行使'; end if;
    select * into t from public.town_residents where id = tg and town_id = tid;
    if not found then raise exception '找不到這位居民'; end if;
  end if;
  if d[3] > 0 and (num is null or num < d[2] or num > d[3]) then raise exception '數字要在 % ～ % 之間', d[2], d[3]; end if;
  select count(*) into nt from jsonb_array_elements(coalesce(pw.log, '[]'::jsonb)) x where x->>'k' = pk and ((x->>'at')::timestamptz at time zone 'Asia/Taipei')::date = today;
  if d[4] > 0 and nt >= d[4] then raise exception '今天「%」已經用完了（全鎮最多 % 次）', public.town_pw_name(pk), d[4]; end if;
  if d[5] > 0 and tg is not null then
    select count(*) into np from jsonb_array_elements(coalesce(pw.log, '[]'::jsonb)) x where x->>'k' = pk and x->>'t' = tg::text and ((x->>'at')::timestamptz at time zone 'Asia/Taipei')::date = today;
    if np >= d[5] then raise exception '% 今天已經被「%」過了', t.name, public.town_pw_name(pk); end if;
  end if;
  if d[6] > 0 then
    select max((x->>'at')::timestamptz) into lastat from jsonb_array_elements(coalesce(pw.log, '[]'::jsonb)) x where x->>'k' = pk;
    if lastat is not null and lastat > now() - make_interval(mins => d[6]) then
      raise exception '剛用過，還要等 % 分鐘', ceil(extract(epoch from (lastat + make_interval(mins => d[6]) - now())) / 60)::int; end if;
  end if;
  if pk = 'jail' then
    if public.town_is_off(tid, 'jail') then raise exception '這個小鎮沒有開監獄'; end if;
    if t.mayor then raise exception '不能關鎮長'; end if;
    if public.town_jailed(t) then raise exception '% 已經被關著了', t.name; end if;
    if t.sleeping or t.place = 'hospital' or ((t.items->>'faint') is not null and (t.items->>'faint')::timestamptz > now()) then raise exception '% 在睡覺或住院中，不能關', t.name; end if;
  elsif pk = 'free' then
    if nres < 2 then raise exception '小鎮只有一個人'; end if;
    if not public.town_jailed(t) then raise exception '% 沒有被關著', t.name; end if;
  elsif pk = 'fine' then
    if t.money <= 0 then raise exception '% 身上沒有錢，罰不了', t.name; end if;
  elsif pk = 'grant' then
    select coalesce(fund, 0) into fnd from public.town_towns where id = tid;
    if fnd < num then raise exception '鎮基金不夠（要 €%，現在 €%）', num, fnd; end if;
  elsif pk = 'impeach' then
    if t.mayor then raise exception '% 已經是鎮長了', t.name; end if;
  end if;
end $$;
revoke all on function public.town_pw_check(text,bigint,text,bigint,int) from public, anon, authenticated;

-- 執行（檢查 + 效果 + 動態 + 紀錄）。actor = 鎮長（彈劾是發起人）。回傳給行使者的訊息
create or replace function public.town_pw_do(tid text, actor bigint, pk text, tg bigint, num int, via text) returns text
language plpgsql security definer set search_path = public as $$
declare d int[] := public.town_pw_def(pk); a public.town_residents; t public.town_residents; lid text := left(md5(random()::text), 8); msg text; pub text;
  paid int; mins int; e jsonb; lg jsonb; vtxt text := case when via = 'vote' then '（居民投票通過）' else '' end;
begin
  perform public.town_pw_check(tid, actor, pk, tg, num);
  select * into a from public.town_residents where id = actor and town_id = tid;
  if not found then raise exception '找不到行使的人'; end if;
  insert into public.town_powers(town_id) values (tid) on conflict (town_id) do nothing;
  if d[7] = 1 then select * into t from public.town_residents where id = tg and town_id = tid for update; end if;
  if pk = 'jail' then
    t := public.town_tick(t);
    if public.town_jailed(t) or t.sleeping or t.place = 'hospital' then raise exception '% 現在不能關（睡覺、住院或已被關）', t.name; end if;
    mins := num;
    t.items := jsonb_set(t.items - 'pl' - 'wt' - 'dr' - 'fi' - 'fv', '{jl}', to_jsonb((now() + make_interval(mins => mins))::text));
    t.items := jsonb_set(t.items, '{jp}', jsonb_build_object('t', now(), 'e', now() + make_interval(mins => mins), 'n', 0, 'bad', 0, 'mj', 1));
    if t.items#>>'{veh,k}' is not null then t.items := jsonb_set(t.items, '{veh}', (t.items->'veh') - 'k'); end if;
    t.place := 'jail'; t.x := 61; t.y := 5;
    pub := a.name || ' 以鎮長權力把 ' || t.name || ' 關進監獄 ' || (case when mins % 60 = 0 then (mins / 60)::text || ' 小時' else mins || ' 分鐘' end) || vtxt;
    msg := '把 ' || t.name || ' 關進監獄 ' || mins || ' 分鐘（居民可以申訴推翻）';
    t := public.town_pw_pwn(t, lid, pk, a.name, '鎮長 ' || a.name || ' 把你關進監獄 ' || mins || ' 分鐘。你可以勞動、請朋友保釋、假釋或越獄；覺得不公平，到市政廳「鎮長管理權」申訴，居民投票推翻就放人', true);
    perform public.town_save_r(t);
    update public.town_residents set place = 'jail', x = 61, y = 5 where id = t.id;
  elsif pk = 'free' then
    t := public.town_tick(t);
    if not public.town_jailed(t) then raise exception '% 沒有被關著', t.name; end if;
    t.items := t.items - 'jl' - 'jp'; t := public.town_prior_set(t, now(), false);
    pub := a.name || ' 以鎮長權力提前放了 ' || t.name || vtxt;
    msg := '放了 ' || t.name;
    t := public.town_pw_pwn(t, lid, pk, a.name, '鎮長 ' || a.name || ' 提前放你出獄', false);
    perform public.town_save_r(t);
  elsif pk = 'fine' then
    paid := least(num, greatest(0, t.money));
    if paid <= 0 then raise exception '% 身上沒有錢，罰不了', t.name; end if;
    t.money := t.money - paid;
    perform public.town_fund_add(tid, 'fine', paid);
    pub := a.name || ' 以鎮長權力罰了 ' || t.name || ' €' || paid || '，進鎮基金' || vtxt;
    msg := '罰了 ' || t.name || ' €' || paid || '（進鎮基金；居民可以申訴推翻）';
    t := public.town_pw_pwn(t, lid, pk, a.name, '鎮長 ' || a.name || ' 罰了你 €' || paid || '，錢進鎮基金。覺得不公平，到市政廳「鎮長管理權」申訴，居民投票推翻就退錢', true);
    perform public.town_save_r(t);
  elsif pk = 'grant' then
    update public.town_towns set fund = fund - num where id = tid and fund >= num;
    if not found then raise exception '鎮基金不夠'; end if;
    t.money := t.money + num; paid := num;
    pub := a.name || ' 以鎮長權力從鎮基金發了補助 €' || num || ' 給 ' || t.name || vtxt;
    msg := '發了補助 €' || num || ' 給 ' || t.name;
    t := public.town_pw_pwn(t, lid, pk, a.name, '鎮長 ' || a.name || ' 從鎮基金發了補助 €' || num || ' 給你', false);
    perform public.town_save_r(t);
  elsif pk = 'impeach' then
    update public.town_residents set mayor = false where town_id = tid and mayor;
    update public.town_residents set mayor = true where id = t.id;
    pub := '居民投票彈劾成功，' || t.name || ' 接任鎮長';
    msg := t.name || ' 接任鎮長';
  else raise exception '這個權力不在這裡行使';
  end if;
  e := jsonb_build_object('id', lid, 'k', pk, 'by', actor, 'bn', a.name, 't', tg, 'tn', case when t.id is null then null else t.name end, 'n', coalesce(paid, num), 'at', now(), 'via', coalesce(via, 'mayor'), 'ap', d[9] = 1, 'undone', false);
  select log into lg from public.town_powers where town_id = tid for update;
  lg := jsonb_build_array(e) || coalesce(lg, '[]'::jsonb);
  while jsonb_array_length(lg) > 60 loop lg := lg - 60; end loop;
  update public.town_powers set log = lg where town_id = tid;
  insert into public.town_events(town_id, actor, target, kind, msg) values (tid, actor, tg, 'mayor', left(pub, 118));
  return msg;
end $$;
revoke all on function public.town_pw_do(text,bigint,text,bigint,int,text) from public, anon, authenticated;

-- 推翻一筆紀錄（申訴投票通過）：關人 → 提前放人（還在服這筆刑才放）；罰款 → 從鎮基金退回（基金不夠退多少算多少）
create or replace function public.town_pw_undo(tid text, lid text) returns text
language plpgsql security definer set search_path = public as $$
declare pw public.town_powers; en jsonb; t public.town_residents; n int; back int; fnd bigint; msg text;
begin
  select * into pw from public.town_powers where town_id = tid for update;
  select z.e into en from jsonb_array_elements(pw.log) as z(e) where z.e->>'id' = lid;
  if en is null then return '找不到那筆紀錄'; end if;
  if (en->>'undone')::boolean then return '那筆已經推翻過了'; end if;
  select * into t from public.town_residents where id = (en->>'t')::bigint and town_id = tid for update;
  if not found then
    msg := '當事人已經搬走，只標記推翻';
  elsif en->>'k' = 'jail' then
    t := public.town_tick(t);
    if public.town_jailed(t) and coalesce((t.items->'jp'->>'mj')::int, 0) = 1 then
      t.items := t.items - 'jl' - 'jp'; t := public.town_prior_set(t, now(), false);
      t := public.town_pw_pwn(t, lid, 'free', '居民投票', '居民投票推翻了這次關押，你被放出來了', false);
      perform public.town_save_r(t);
      msg := '推翻關押，' || t.name || ' 被放出來了';
    else msg := '推翻關押（' || t.name || ' 已經不在這筆刑期裡，不用放人）'; end if;
  elsif en->>'k' = 'fine' then
    n := coalesce((en->>'n')::int, 0);
    select coalesce(fund, 0) into fnd from public.town_towns where id = tid for update;
    back := least(n, greatest(0, fnd)::int);
    update public.town_towns set fund = fund - back where id = tid;
    t.money := t.money + back;
    t := public.town_pw_pwn(t, lid, 'free', '居民投票', '居民投票推翻了那筆罰款，退回 €' || back || '（從鎮基金）', false);
    perform public.town_save_r(t);
    msg := '推翻罰款，從鎮基金退回 ' || t.name || ' €' || back;
  else msg := '推翻'; end if;
  update public.town_powers set log = (select coalesce(jsonb_agg(case when e->>'id' = lid then e || '{"undone":true}'::jsonb else e end order by o), '[]'::jsonb) from jsonb_array_elements(pw.log) with ordinality as z(e, o)) where town_id = tid;
  return msg;
end $$;
revoke all on function public.town_pw_undo(text,text) from public, anon, authenticated;

-- 結算已到期的投票（每次 town_power 被呼叫時順便做；可反覆呼叫）
-- vote = {id, kind 'appeal'|'power', k, ref 紀錄 id, t 對象, tn, n 數字, by 發起人, bn, mn 鎮長名, at, end, y [id], n [id]}
create or replace function public.town_pw_close(tid text) returns void language plpgsql security definer set search_path = public as $$
declare pw public.town_powers; v jsonb; yn int; nn int; nres int; ok boolean; msg text; res text; ttl text;
begin
  select * into pw from public.town_powers where town_id = tid for update;
  if not found or pw.vote is null then return; end if;
  v := pw.vote;
  if (v->>'end')::timestamptz > now() then return; end if;
  yn := jsonb_array_length(coalesce(v->'y', '[]'::jsonb)); nn := jsonb_array_length(coalesce(v->'n', '[]'::jsonb));
  select count(*) into nres from public.town_residents where town_id = tid;
  if v->>'kind' = 'appeal' then
    ok := yn > nn and yn >= 2 and yn * 2 > nres - 1;
    ttl := '對鎮長「' || public.town_pw_name(v->>'k') || '」' || coalesce(v->>'tn', '') || ' 的申訴';
    if ok then res := public.town_pw_undo(tid, v->>'ref'); end if;
  else
    ok := yn > nn and yn >= 3 and yn * 2 > nres;
    ttl := '「' || public.town_pw_name(v->>'k') || '」' || coalesce(v->>'tn', '');
    if ok then
      begin res := public.town_pw_do(tid, (v->>'by')::bigint, v->>'k', nullif(v->>'t', '')::bigint, nullif(v->>'n', '')::int, 'vote');
      exception when others then ok := false; res := sqlerrm; end;
    end if;
  end if;
  msg := ttl || (case when ok then ' 通過' else ' 沒有通過' end) || '（贊成 ' || yn || '、反對 ' || nn || ')' || (case when ok or res is null then '' else '：' || res end);
  insert into public.town_events(town_id, actor, kind, msg) values (tid, (v->>'by')::bigint, 'mayor', left(msg, 118));
  select * into pw from public.town_powers where town_id = tid for update;
  update public.town_powers set vote = null, hist = (jsonb_build_array(jsonb_build_object('m', left(msg, 118), 'at', now())) || hist) where town_id = tid;
  update public.town_powers set hist = hist - 5 where town_id = tid and jsonb_array_length(hist) > 5;
end $$;
revoke all on function public.town_pw_close(text) from public, anon, authenticated;

-- op：view 看（所有居民）／use 行使（鎮長；mode 1 的任何居民可發起投票）／appeal 申訴（note = 紀錄 id）／vote 投票（note = yes|no）／toggle 開關權力（鎮長，note = 要關的代號，逗號分隔）／ack 清掉通知
create or replace function public.town_power(rid bigint, pin text, op text, pk text default null, tg bigint default null, num int default null, note text default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; pw public.town_powers; d int[]; msg text := ''; v jsonb; en jsonb; nres int; ks text[]; kk text; offs text[] := '{}';
  today date := (now() at time zone 'Asia/Taipei')::date; tn text; vk text;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  insert into public.town_powers(town_id) values (r.town_id) on conflict (town_id) do nothing;
  perform public.town_pw_close(r.town_id);
  select * into pw from public.town_powers where town_id = r.town_id;
  select count(*) into nres from public.town_residents where town_id = r.town_id;
  if op = 'view' then null;
  elsif op = 'ack' then
    r.items := r.items - 'pwn'; perform public.town_save_r(r);
  elsif op = 'use' then
    d := public.town_pw_def(pk);
    if d is null or d[10] = 1 then raise exception '這個權力要到市政廳或設施面板行使'; end if;
    if public.town_jailed(r) then raise exception '你被關在監獄裡'; end if;
    if r.sleeping then raise exception '你在睡覺，先起床'; end if;
    if d[1] = 0 or (d[1] = 2 and coalesce(note, '') <> 'vote') then
      if not r.mayor then raise exception '只有鎮長可以行使這個權力'; end if;
      msg := public.town_pw_do(r.town_id, rid, pk, tg, num, 'mayor');
    else
      if d[1] = 2 and not r.mayor then raise exception '只有鎮長可以提出'; end if;
      if pk = 'impeach' and r.mayor then raise exception '鎮長不能彈劾自己'; end if;
      if pw.vote is not null then raise exception '現在已經有一個投票在進行了，等結束再發起'; end if;
      perform public.town_pw_check(r.town_id, rid, pk, tg, num);
      select name into tn from public.town_residents where id = tg;
      v := jsonb_build_object('id', left(md5(random()::text), 8), 'kind', 'power', 'k', pk, 't', tg, 'tn', tn, 'n', num, 'by', rid, 'bn', r.name, 'at', now(), 'end', now() + interval '24 hours', 'y', jsonb_build_array(rid), 'n', '[]'::jsonb);
      update public.town_powers set vote = v where town_id = r.town_id;
      insert into public.town_events(town_id, actor, target, kind, msg) values (r.town_id, rid, tg, 'mayor',
        left(r.name || ' 發起投票：「' || public.town_pw_name(pk) || '」' || coalesce(tn, '') || case when num is not null and d[3] > 0 then ' ' || num else '' end || '（24 小時，居民投票）', 118));
      msg := '投票發起了，24 小時後結算';
    end if;
  elsif op = 'appeal' then
    if r.mayor then raise exception '鎮長不能申訴自己的決定'; end if;
    if pw.vote is not null then raise exception '現在已經有一個投票在進行了，等結束再申訴'; end if;
    select z.e into en from jsonb_array_elements(pw.log) as z(e) where z.e->>'id' = coalesce(note, '');
    if en is null then raise exception '找不到這筆紀錄'; end if;
    if not (en->>'ap')::boolean then raise exception '這種權力不能申訴'; end if;
    if (en->>'undone')::boolean then raise exception '已經推翻了'; end if;
    if coalesce((en->>'appealed')::boolean, false) then raise exception '這一筆已經申訴過了'; end if;
    if (en->>'at')::timestamptz < now() - interval '24 hours' then raise exception '超過 24 小時，不能申訴了'; end if;
    v := jsonb_build_object('id', left(md5(random()::text), 8), 'kind', 'appeal', 'k', en->>'k', 'ref', en->>'id', 't', en->>'t', 'tn', en->>'tn', 'n', en->>'n', 'by', rid, 'bn', r.name, 'mn', en->>'bn',
      'at', now(), 'end', now() + interval '12 hours', 'y', jsonb_build_array(rid), 'n', '[]'::jsonb);
    update public.town_powers set vote = v,
      log = (select coalesce(jsonb_agg(case when z.e->>'id' = en->>'id' then z.e || '{"appealed":true}'::jsonb else z.e end order by z.o), '[]'::jsonb) from jsonb_array_elements(pw.log) with ordinality as z(e, o))
      where town_id = r.town_id;
    insert into public.town_events(town_id, actor, target, kind, msg) values (r.town_id, rid, (en->>'t')::bigint, 'mayor',
      left(r.name || ' 對鎮長「' || public.town_pw_name(en->>'k') || '」' || coalesce(en->>'tn', '') || ' 提出申訴，居民投票決定要不要推翻（12 小時）', 118));
    msg := '申訴送出了，12 小時內居民投票';
  elsif op = 'vote' then
    if pw.vote is null then raise exception '現在沒有投票'; end if;
    vk := pw.vote->>'kind';
    if vk = 'appeal' and r.mayor then raise exception '鎮長不能對申訴投票'; end if;
    if coalesce(note, '') not in ('yes', 'no') then raise exception '要投贊成或反對'; end if;
    if (pw.vote->'y') @> to_jsonb(rid) or (pw.vote->'n') @> to_jsonb(rid) then raise exception '你已經投過了'; end if;
    v := jsonb_set(pw.vote, case when note = 'yes' then '{y}' else '{n}' end::text[], (pw.vote->(case when note = 'yes' then 'y' else 'n' end)) || to_jsonb(rid));
    update public.town_powers set vote = v where town_id = r.town_id;
    msg := '投好了';
  elsif op = 'toggle' then
    if not r.mayor then raise exception '只有鎮長可以開關權力'; end if;
    ks := string_to_array(coalesce(note, ''), ',');
    foreach kk in array ks loop
      if kk = '' then continue; end if;
      d := public.town_pw_def(kk);
      if d is null or d[10] = 1 or d[11] = 1 then raise exception '「%」不能關掉', coalesce(public.town_pw_name(kk), kk); end if;
      offs := offs || kk;
    end loop;
    update public.town_powers set off = offs where town_id = r.town_id;
    msg := '權力開關更新了';
  else raise exception '不支援的操作';
  end if;
  select * into pw from public.town_powers where town_id = r.town_id;
  return json_build_object('ok', true, 'msg', msg, 'mayor', r.mayor, 'nres', nres, 'off', to_json(pw.off),
    'fund', (select coalesce(fund, 0) from public.town_towns where id = r.town_id),
    'log', (select coalesce(json_agg(z.e order by z.o), '[]'::json) from jsonb_array_elements(pw.log) with ordinality as z(e, o) where z.o <= 30),
    'today', (select coalesce(json_agg(json_build_object('k', z.e->>'k', 't', z.e->>'t')), '[]'::json) from jsonb_array_elements(pw.log) as z(e) where ((z.e->>'at')::timestamptz at time zone 'Asia/Taipei')::date = today),
    'last', (select coalesce(json_object_agg(s.kk, s.ep), '{}'::json) from (select z.e->>'k' as kk, extract(epoch from max((z.e->>'at')::timestamptz))::bigint as ep from jsonb_array_elements(pw.log) as z(e) group by 1) s),
    'hist', pw.hist,
    'vote', case when pw.vote is null then null else (pw.vote - 'y' - 'n') || jsonb_build_object('yn', jsonb_array_length(pw.vote->'y'), 'nn', jsonb_array_length(pw.vote->'n'),
      'mine', case when (pw.vote->'y') @> to_jsonb(rid) then 'yes' when (pw.vote->'n') @> to_jsonb(rid) then 'no' else null end) end);
end $$;
revoke all on function public.town_power(bigint,text,text,text,bigint,int,text) from public;
grant execute on function public.town_power(bigint,text,text,text,bigint,int,text) to anon, authenticated;
