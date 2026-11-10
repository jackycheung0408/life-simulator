-- 小豬鎮：三棟公共建設 —— 醫院、警察局、市政廳（2026-11-10）。
-- 套用順序：town.sql → town_social.sql → town_fi.sql（白名單已含這三個地點）→ town_jail.sql（town_pr_mult 讀報案紀錄）→ 這份。可重複執行。
-- 不改 town_act 的動作：三個獨立 RPC town_hospital／town_police／town_civic，資料全存 items（缺值 = 預設，舊角色不重置）與新表 town_civic（RLS 全關）。
-- 角色都不會死。價格與數值前端 town.js 的 HOSP／POLICE／CIVIC 要一致，node town/test.js 會比對。

-- ── 醫院（place='hospital'，位置 [59,9,5,5] 門 [61,14]）──
-- 昏倒（餓到）、車禍住院、被砍倒地的人由 town_admit（town.sql）送到醫院門口並算「在醫院裡」（items.fi = 'hospital'）；
-- 住院期間（faint 2 小時或 1 小時）照舊，醒來後人留在醫院，可按「出院」回到街上。醫藥費沿用原規則（車禍當下結清、被砍由砍人的人付、餓昏倒醒來扣 €1500，付到 0 為止、不欠款）。
--   consult 掛號看診：醒著、在醫院、不是住院中；€150；一天一次（items.hp.d）；精力 +20、清潔 +40（治發臭）、鼻青臉腫消失、心情 +5。
--   discharge 出院：醒著、住院期間結束後；人移到醫院門口外的路上。
--   visit 探病：在醫院的朋友去看住院中（faint 還沒結束）的人；60 分鐘一次；探病的人心情 +3、精力 −2；病人心情 +10；好感 +2。
create or replace function public.town_hospital(rid bigint, pin text, op text, target bigint default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; t public.town_residents; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
  fee int; msg text := ''; patient boolean;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if public.town_is_off(r.town_id, 'hospital') then raise exception '這個小鎮沒有開醫院'; end if;
  if r.place <> 'hospital' then raise exception '要先走到醫院'; end if;
  if public.town_jailed(r) then raise exception '你被關在監獄裡'; end if;
  r := public.town_tick(r);
  patient := (r.items->>'faint') is not null and (r.items->>'faint')::timestamptz > now();
  if op = 'consult' then
    if r.sleeping and not patient then raise exception '你在睡覺，先起床'; end if;
    if patient then raise exception '你還在住院，先好好躺著'; end if;
    if r.items->'hp'->>'d' = today then raise exception '今天已經看過診了，明天再來'; end if;
    fee := 150;
    if r.money < fee then raise exception '錢不夠，掛號看診 €150'; end if;
    r.money := r.money - fee; r.energy := r.energy + 20; r.hygiene := least(100, r.hygiene + 40); r.bruised_until := null; r.fun := r.fun + 5;
    r.items := jsonb_set(r.items, '{hp}', jsonb_build_object('d', today));
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'hospital', r.name || ' 到醫院掛號看診，醫生說多休息、多洗澡');
    msg := '看診完成：精力 +20、清潔 +40、傷好了（掛號費 €' || fee || '）';
    perform public.town_save_r(r);
    return json_build_object('ok', true, 'msg', msg, 'm', -fee);
  elsif op = 'discharge' then
    if patient then raise exception '還在住院，醒來才能出院'; end if;
    if r.sleeping then raise exception '你在睡覺，先起床'; end if;
    r.items := r.items - 'fi'; r.place := 'street'; r.x := 62; r.y := 15;
    update public.town_residents set place = r.place, x = r.x, y = r.y where id = rid;
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'hospital', r.name || ' 出院了');
    perform public.town_save_r(r);
    return json_build_object('ok', true, 'msg', '出院了，路上小心');
  elsif op = 'visit' then
    if target is null or target = rid then raise exception '要選一位住院的朋友'; end if;
    if r.sleeping then raise exception '你在睡覺，先起床'; end if;
    select * into t from public.town_residents where id = target and town_id = r.town_id for update;
    if not found then raise exception '找不到這位鄰居'; end if;
    t := public.town_tick(t);
    if t.place <> 'hospital' or not ((t.items->>'faint') is not null and (t.items->>'faint')::timestamptz > now()) then raise exception '% 沒有住院', t.name; end if;
    if exists (select 1 from public.town_events e where e.actor = rid and e.target = t.id and e.kind = 'visithosp' and e.at > now() - interval '60 minutes') then raise exception '剛剛才探過病，等一下再來'; end if;
    r.fun := r.fun + 3; r.energy := r.energy - 2; t.fun := t.fun + 10;
    perform public.town_bond(r.town_id, rid, t.id, 2);
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, target, 'visithosp', r.name || ' 到醫院探望住院的 ' || t.name);
    perform public.town_save_r(t);
    perform public.town_save_r(r);
    return json_build_object('ok', true, 'msg', '探望了 ' || t.name || '，他心情 +10、好感 +2');
  else raise exception '不支援的操作';
  end if;
end $$;
revoke all on function public.town_hospital(bigint,text,text,bigint) from public;
grant execute on function public.town_hospital(bigint,text,text,bigint) to anon, authenticated;

-- ── 警察局（place='police'，位置 [56,17,6,4] 門 [58,21]）──
--   pay 繳罰單：item = 罰單 id 或 all；在警察局繳 9 折（省 10%，罰款加罰 50% 的也一樣），錢不夠繳到哪算到哪；一般面板的「罰單」鈕照舊（原價）。
--   surrender 自首：通緝中（items.wt）的人走到警察局自首：通緝解除、關進監獄 30 分鐘，不算惹事、不加刑（比被抓回去關 90 分鐘划算），前科照記。
--   report 報案：item = 對方 id；對方 24 小時內對你做過扁人／砍人／丟蛋／惡作劇／惡趣味；每人每天最多報 1 次、同一個人 7 天內只能報 1 次；
--     對方記 1 個「報案點」（items.rp = {n,u}，7 天內有效，每點巡警機率 +10%、最多 5 點），不會自動入獄，避免被當成武器；你心情 +3。
--   stats 治安：今天鎮上的罰單、事故、砍人、入獄、越獄件數，加上你的報案點與罰單。
create or replace function public.town_police(rid bigint, pin text, op text, item text default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; t public.town_residents; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
  n int; jf jsonb; fee int; mins int := 30; tid bigint; res json;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if public.town_is_off(r.town_id, 'police') then raise exception '這個小鎮沒有開警察局'; end if;
  if r.place <> 'police' then raise exception '要先走到警察局'; end if;
  r := public.town_tick(r);
  if op = 'stats' then
    return json_build_object('ok', true,
      'tk', (select count(*) from public.town_events e where e.town_id = r.town_id and e.kind = 'ticket' and (e.at at time zone 'Asia/Taipei')::date = today::date),
      'crash', (select count(*) from public.town_events e where e.town_id = r.town_id and e.kind = 'crash' and (e.at at time zone 'Asia/Taipei')::date = today::date),
      'slash', (select count(*) from public.town_events e where e.town_id = r.town_id and e.kind = 'slash' and (e.at at time zone 'Asia/Taipei')::date = today::date),
      'jail', (select count(*) from public.town_events e where e.town_id = r.town_id and e.kind = 'jail' and e.msg not like '%出獄%' and (e.at at time zone 'Asia/Taipei')::date = today::date),
      'esc', (select count(*) from public.town_events e where e.town_id = r.town_id and e.kind = 'jail' and e.msg like '%越獄成功%' and (e.at at time zone 'Asia/Taipei')::date = today::date),
      'rp', case when coalesce(r.items->'rp'->>'u','') <> '' and (r.items->'rp'->>'u')::timestamptz > now() then coalesce((r.items->'rp'->>'n')::int, 0) else 0 end);
  end if;
  if public.town_jailed(r) then raise exception '你被關在監獄裡'; end if;
  if op = 'pay' then
    if r.items->'tk' is null or jsonb_array_length(r.items->'tk') = 0 then raise exception '沒有罰單'; end if;
    with tt as (select e, ord, floor((e->>'a')::int * 0.9)::int as a, (item = 'all' or (e->>'id') = item) as sel from jsonb_array_elements(r.items->'tk') with ordinality as x(e, ord)),
      c as (select e, ord, a, sel, sum(case when sel then a else 0 end) over (order by ord) as cum from tt)
    select coalesce(jsonb_agg(e order by ord) filter (where not (sel and cum <= r.money)), '[]'::jsonb), coalesce(sum(a) filter (where sel and cum <= r.money), 0)::int into jf, n from c;
    if n = 0 then raise exception '錢不夠繳這張罰單'; end if;
    r.money := r.money - n; r.items := jsonb_set(r.items, '{tk}', jf);
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'ticket', r.name || ' 在警察局繳了罰單 €' || n || '（9 折）');
    perform public.town_save_r(r);
    return json_build_object('ok', true, 'msg', '繳了 €' || n || '（比原價省 10%）', 'm', -n);
  elsif op = 'surrender' then
    if not public.town_wanted(r) then raise exception '你沒有被通緝'; end if;
    if public.town_is_off(r.town_id, 'jail') then raise exception '這個小鎮沒有開監獄'; end if;
    r.items := jsonb_set(r.items - 'wt' - 'pl' - 'dr' - 'fi' - 'fv', '{jl}', to_jsonb((now() + make_interval(mins => mins))::text));
    r.items := jsonb_set(r.items, '{jp}', jsonb_build_object('t', now(), 'e', now() + make_interval(mins => mins), 'n', 0, 'bad', 0));
    r := public.town_prior_set(r, now() + make_interval(mins => mins), false);
    if r.items#>>'{veh,k}' is not null then r.items := jsonb_set(r.items, '{veh}', (r.items->'veh') - 'k'); end if;
    r.place := 'jail'; r.x := 61; r.y := 5;
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'jail', r.name || ' 主動到警察局自首，關進監獄 30 分鐘');
    perform public.town_save_r(r);
    update public.town_residents set place = r.place, x = r.x, y = r.y where id = rid;
    return json_build_object('ok', true, 'msg', '自首了，通緝解除，關 30 分鐘（沒有加刑）');
  elsif op = 'report' then
    begin tid := item::bigint; exception when others then raise exception '要選一個對象'; end;
    if tid = rid then raise exception '不能報案自己'; end if;
    if r.items->'rpd'->>'d' = today then raise exception '今天已經報過案了，明天再來'; end if;
    select * into t from public.town_residents where id = tid and town_id = r.town_id for update;
    if not found then raise exception '找不到這個人'; end if;
    if not exists (select 1 from public.town_events e where e.actor = tid and e.target = rid and e.kind in ('fight','slash','egg','prank','mischief','photo') and e.at > now() - interval '24 hours') then raise exception '% 24 小時內沒有對你做過什麼，不能報案', t.name; end if;
    if exists (select 1 from public.town_events e where e.actor = rid and e.target = tid and e.kind = 'report' and e.at > now() - interval '7 days') then raise exception '這個人你這週報過了'; end if;
    n := case when coalesce(t.items->'rp'->>'u','') <> '' and (t.items->'rp'->>'u')::timestamptz > now() then coalesce((t.items->'rp'->>'n')::int, 0) else 0 end;
    t.items := jsonb_set(t.items, '{rp}', jsonb_build_object('n', least(5, n + 1), 'u', (now() + interval '7 days')::text));
    r.items := jsonb_set(r.items, '{rpd}', jsonb_build_object('d', today)); r.fun := r.fun + 3;
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, tid, 'report', r.name || ' 到警察局報案，檢舉 ' || t.name || ' 的惡劣行為（記 1 個報案點，不會入獄）');
    perform public.town_save_r(t);
    perform public.town_save_r(r);
    return json_build_object('ok', true, 'msg', '報案受理，' || t.name || ' 記了 1 個報案點（7 天內巡警盯他比較緊）');
  else raise exception '不支援的操作';
  end if;
end $$;
revoke all on function public.town_police(bigint,text,text,text) from public;
grant execute on function public.town_police(bigint,text,text,text) to anon, authenticated;

-- ── 市政廳（place='townhall'，位置 [66,0,5,5] 門 [68,5]）──
-- 新表 town_civic（每個小鎮一列）：ann = 公告 [{t,at}]（鎮長發，最多 3 則）、proj = 已建好的建設案 [代號]、vote = 進行中的投票（同時只有一個）、hist = 最近結果。
-- 投票 vote = {k 'build'|'poll', p 建設案代號, q 題目, cost, by 發起人, bn 名字, at, end, y [id], n [id]}：24 小時結束；每人一票；通過 = 贊成多於反對、而且總票數 ≥ 3（居民不到 5 人的小鎮 ≥ 2）。
--   build 建設案（只有鎮長能發起）：花鎮基金蓋路邊設施（長椅、路燈、涼亭、小豬雕像）；通過時基金夠才扣（不夠就否決），**基金只能花在建設案、不能轉給任何人**。
--   poll 投票（任何居民都能發起）：1～20 字的是非題，只是民意調查，結果寫進動態，沒有自動效果。
-- 建好的設施 proj 在 town_civic_use 使用（和路邊物件一樣 ≤ 2 格、10 分鐘冷卻、只給心情／精力，不給錢）。座標與價格前端 CIVIC 表一致。
create table if not exists public.town_civic (
  town_id text primary key references public.town_towns(id) on delete cascade,
  ann jsonb not null default '[]'::jsonb, proj jsonb not null default '[]'::jsonb, vote jsonb, hist jsonb not null default '[]'::jsonb
);
alter table public.town_civic enable row level security;
revoke all on public.town_civic from anon, authenticated;

-- 建設案：[代號, 名稱, 費用, x, y, 心情, 精力]（座標 ≤ 2 格才能用；在 buildMap 與 OBJS 之外另畫）
create or replace function public.town_civic_proj(p text) returns int[] language sql immutable as $$
  select case p when 'bench2' then array[15000, 48, 8, 3, 15] when 'lamp' then array[20000, 24, 21, 4, 0]
    when 'gazebo' then array[30000, 35, 21, 8, 25] when 'statue' then array[50000, 21, 13, 12, 0] else null end
$$;
create or replace function public.town_civic_pname(p text) returns text language sql immutable as $$
  select case p when 'bench2' then '新長椅' when 'lamp' then '路燈' when 'gazebo' then '涼亭' when 'statue' then '小豬雕像' else p end
$$;
revoke all on function public.town_civic_proj(text), public.town_civic_pname(text) from public, anon, authenticated;

-- 結算已到期的投票（每次 town_civic 被呼叫時順便做；也可以反覆呼叫）
create or replace function public.town_civic_close(tid text) returns void language plpgsql as $$
declare c public.town_civic; v jsonb; yn int; nn int; tot int; quorum int; ok boolean; cost int; msg text; fnd bigint; res text;
begin
  select * into c from public.town_civic where town_id = tid for update;
  if not found or c.vote is null then return; end if;
  v := c.vote;
  if (v->>'end')::timestamptz > now() then return; end if;
  yn := jsonb_array_length(coalesce(v->'y','[]'::jsonb)); nn := jsonb_array_length(coalesce(v->'n','[]'::jsonb)); tot := yn + nn;
  quorum := case when (select count(*) from public.town_residents where town_id = tid) >= 5 then 3 else 2 end;
  ok := yn > nn and tot >= quorum;
  if v->>'k' = 'build' then
    cost := (v->>'cost')::int; select coalesce(t.fund, 0) into fnd from public.town_towns t where t.id = tid;
    if ok and fnd < cost then ok := false; res := '基金不足'; end if;
    if ok then
      update public.town_towns t set fund = coalesce(t.fund,0) - cost where t.id = tid;
      c.proj := c.proj || to_jsonb(v->>'p');
      msg := '建設案「' || public.town_civic_pname(v->>'p') || '」通過（贊成 ' || yn || '、反對 ' || nn || '），花了鎮基金 €' || cost || '，已經蓋好了';
    else
      msg := '建設案「' || public.town_civic_pname(v->>'p') || '」沒有通過（贊成 ' || yn || '、反對 ' || nn || case when tot < quorum then '，票數不夠 ' || quorum || ' 票' else '' end || coalesce('，' || res, '') || '）';
    end if;
  else
    msg := '投票「' || (v->>'q') || '」' || case when ok then '通過' else '沒有通過' end || '（贊成 ' || yn || '、反對 ' || nn || case when tot < quorum then '，票數不夠 ' || quorum || ' 票' else '' end || '）';
  end if;
  insert into public.town_events(town_id,actor,kind,msg) values (tid, (v->>'by')::bigint, 'civic', msg);
  c.hist := (jsonb_build_array(jsonb_build_object('m', msg, 'at', now())) || c.hist);
  if jsonb_array_length(c.hist) > 5 then c.hist := c.hist - 5; end if;
  update public.town_civic set proj = c.proj, vote = null, hist = c.hist where town_id = tid;
end $$;
revoke all on function public.town_civic_close(text) from public, anon, authenticated;

create or replace function public.town_civic(rid bigint, pin text, op text, item text default null, note text default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; c public.town_civic; tw public.town_towns; pc int[]; v jsonb; a jsonb; q text; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); n int;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if public.town_is_off(r.town_id, 'townhall') and op <> 'view' then raise exception '這個小鎮沒有開市政廳'; end if;
  insert into public.town_civic(town_id) values (r.town_id) on conflict (town_id) do nothing;
  perform public.town_civic_close(r.town_id);
  select * into c from public.town_civic where town_id = r.town_id;
  select * into tw from public.town_towns where id = r.town_id;
  if op = 'view' then
    null;
  elsif op in ('announce','unannounce','propose','vote') then
    if public.town_is_off(r.town_id, 'townhall') then raise exception '這個小鎮沒有開市政廳'; end if;
    if r.place <> 'townhall' then raise exception '要先走到市政廳'; end if;
    if r.sleeping then raise exception '你在睡覺，先起床'; end if;
    if public.town_jailed(r) then raise exception '你被關在監獄裡'; end if;
    if op = 'announce' then
      if not r.mayor then raise exception '只有鎮長可以發公告'; end if;
      q := trim(coalesce(item,''));
      if char_length(q) not between 1 and 40 or q ~ '[<>]' or public.has_bad_words(q) then raise exception '公告要 1～40 個字'; end if;
      a := jsonb_build_array(jsonb_build_object('t', q, 'at', now())) || c.ann;
      while jsonb_array_length(a) > 3 loop a := a - 3; end loop;
      update public.town_civic set ann = a where town_id = r.town_id;
      insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'civic', r.name || ' 在市政廳貼了新公告：「' || q || '」');
    elsif op = 'unannounce' then
      if not r.mayor then raise exception '只有鎮長可以撤公告'; end if;
      n := coalesce(item,'0')::int; if n < 0 or n >= jsonb_array_length(c.ann) then raise exception '沒有這則公告'; end if;
      update public.town_civic set ann = c.ann - n where town_id = r.town_id;
    elsif op = 'propose' then
      if c.vote is not null then raise exception '現在已經有一個投票在進行了，等結束再發起'; end if;
      if item = 'poll' then
        q := trim(coalesce(note,''));
        if char_length(q) not between 1 and 20 or q ~ '[<>]' or public.has_bad_words(q) then raise exception '題目要 1～20 個字（是非題）'; end if;
        v := jsonb_build_object('k','poll','q',q,'by',rid,'bn',r.name,'at',now(),'end',now() + interval '24 hours','y','[]'::jsonb,'n','[]'::jsonb);
        insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'civic', r.name || ' 在市政廳發起投票：「' || q || '」（24 小時）');
      else
        if not r.mayor then raise exception '只有鎮長可以提建設案'; end if;
        pc := public.town_civic_proj(item);
        if pc is null then raise exception '沒有這個建設案'; end if;
        if c.proj ? item then raise exception '這個已經蓋好了'; end if;
        if coalesce(tw.fund, 0) < pc[1] then raise exception '鎮基金不夠（要 €%，現在 €%）', pc[1], coalesce(tw.fund, 0); end if;
        v := jsonb_build_object('k','build','p',item,'cost',pc[1],'by',rid,'bn',r.name,'at',now(),'end',now() + interval '24 hours','y','[]'::jsonb,'n','[]'::jsonb);
        insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'civic', r.name || ' 提出建設案「' || public.town_civic_pname(item) || '」，要花鎮基金 €' || pc[1] || '，請居民到市政廳投票（24 小時）');
      end if;
      update public.town_civic set vote = v where town_id = r.town_id;
    else
      if c.vote is null then raise exception '現在沒有投票'; end if;
      if item not in ('yes','no') then raise exception '要投贊成或反對'; end if;
      if (c.vote->'y') @> to_jsonb(rid) or (c.vote->'n') @> to_jsonb(rid) then raise exception '你已經投過了'; end if;
      v := jsonb_set(c.vote, case when item = 'yes' then '{y}' else '{n}' end::text[], (c.vote->(case when item = 'yes' then 'y' else 'n' end)) || to_jsonb(rid));
      update public.town_civic set vote = v where town_id = r.town_id;
    end if;
    select * into c from public.town_civic where town_id = r.town_id;
  else raise exception '不支援的操作';
  end if;
  return json_build_object('ok', true, 'fund', coalesce(tw.fund, 0), 'flog', coalesce(tw.fund_log, '{}'::jsonb), 'ann', c.ann, 'proj', c.proj, 'hist', c.hist, 'mayor', r.mayor,
    'vote', case when c.vote is null then null else (c.vote - 'y' - 'n') || jsonb_build_object('yn', jsonb_array_length(c.vote->'y'), 'nn', jsonb_array_length(c.vote->'n'), 'mine', case when (c.vote->'y') @> to_jsonb(rid) then 'yes' when (c.vote->'n') @> to_jsonb(rid) then 'no' else null end) end,
    'quorum', case when (select count(*) from public.town_residents where town_id = r.town_id) >= 5 then 3 else 2 end);
end $$;
revoke all on function public.town_civic(bigint,text,text,text,text) from public;
grant execute on function public.town_civic(bigint,text,text,text,text) to anon, authenticated;

-- 使用建好的設施（路邊）：item = 代號；要在 ≤ 2 格內、10 分鐘一次、只給心情／精力（不給錢）
create or replace function public.town_civic_use(rid bigint, pin text, item text) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; c public.town_civic; pc int[];
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if public.town_jailed(r) then raise exception '你被關在監獄裡'; end if;
  select * into c from public.town_civic where town_id = r.town_id;
  if not found or not (c.proj ? coalesce(item,'')) then raise exception '這個設施還沒蓋好'; end if;
  pc := public.town_civic_proj(item);
  if r.place <> 'street' or abs(r.x - pc[2]) + abs(r.y - pc[3]) > 2 then raise exception '要走到旁邊才能用'; end if;
  if (r.items->'cd'->>('c_' || item)) is not null and (r.items->'cd'->>('c_' || item))::timestamptz > now() - interval '10 minutes' then raise exception '剛剛才用過，等一下再來'; end if;
  r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('c_' || item, now()));
  r.fun := r.fun + pc[4]; r.energy := r.energy + pc[5];
  perform public.town_save_r(r);
  return json_build_object('ok', true, 'msg', '在' || public.town_civic_pname(item) || '旁休息：心情 +' || pc[4] || case when pc[5] > 0 then '、精力 +' || pc[5] else '' end);
end $$;
revoke all on function public.town_civic_use(bigint,text,text) from public;
grant execute on function public.town_civic_use(bigint,text,text) to anon, authenticated;

-- 小鎮已建好的建設案（所有人都要看得到，地圖才畫得出來）：不用密碼，只回代號清單
create or replace function public.town_civic_proj_list(tid text) returns json
language sql stable security definer set search_path = public as $$
  select coalesce((select to_json(proj) from public.town_civic where town_id = tid), '[]'::json)
$$;
revoke all on function public.town_civic_proj_list(text) from public;
grant execute on function public.town_civic_proj_list(text) to anon, authenticated;
