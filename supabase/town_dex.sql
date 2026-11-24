-- 小豬鎮：長期目標批 2「收藏圖鑑」。要在 town_goal.sql、town_shelf1.sql（或 town_catalog2.sql）、town_home.sql 之後套用，可重複執行。
-- 內容：a) town_dex_set 純函式（只寫 items.dx）；b) 就地補丁 town_goal_hook（act／fac 吃過的、到過的地點）與 town_goods（吃過／喝過的商品）；
--       c) RPC town_dex(rid,pin,op,key)：view／mark（NPC，白名單）／claim（分頁 50%／100%、總圖鑑）；d) 一次性回填 dex_backfill1（地點：fq／works，NPC：vz／np）。
-- 資料：items.dx = {f:{吃過的美食},p:{到過的地點},n:{見過的 NPC},k:[已領獎勵代號]}，缺值＝空，舊角色免遷移。
-- 讀取層（不新增資料）：收藏 items.cl、造型 items.w、家具 items.f、稱號 items.titles。
-- 獎勵只有稱號＋零食（背包滿只給稱號），不給錢、能力、精力；每個獎勵只領一次。百分比以「核心項目」（非季節限定）為分母，限定項目只加分不要求。

create or replace function public.town_dex_set(it jsonb, g text, k text) returns jsonb language plpgsql immutable set search_path = public as $$
declare d jsonb := coalesce(it->'dx', '{}'::jsonb); m jsonb := coalesce(d->g, '{}'::jsonb);
begin
  if g not in ('f','p','n') or k is null or k = '' or length(k) > 40 or m ? k then return it; end if;
  if (select count(*) from jsonb_object_keys(m)) >= 120 then return it; end if;
  m := m || jsonb_build_object(k, 1); d := jsonb_set(d, array[g], m, true);
  return jsonb_set(coalesce(it, '{}'::jsonb), '{dx}', d, true);
end $$;
revoke all on function public.town_dex_set(jsonb,text,text) from public, anon, authenticated;

-- 靜態清單：[鍵, 名稱, 取得提示]
create or replace function public.town_dex_places() returns jsonb language sql immutable as $$
  select '[["restaurant","餐廳","走到餐廳門口"],["market","超市","走到超市門口"],["office","公司","走到公司門口"],["park","公園","走到公園"],["cafe","咖啡廳","走到咖啡廳門口"],["cinema","電影院","走到電影院門口"],["gym","健身房","走到健身房門口"],["rafi","拉菲’s office","走到拉菲門口"],["stock","證券交易所","走到證交所門口"],["carshop","車行","走到車行門口"],["arena","格鬥場","走到格鬥場門口"],["slaughter","屠宰場","走到屠宰場門口"],["jail","監獄","入獄或探監"],["hospital","醫院","看診、探病或昏倒送醫"],["police","警察局","走到警察局門口"],["townhall","市政廳","走到市政廳門口"],["casino","賭場","走到賭場門口"],["realty","不動產公司","走到不動產公司門口"],["harbor","碼頭船行","走到碼頭船行門口"],["furnshop","家具行","走到家具行門口"],["wearshop","服飾店","走到服飾店門口"],["plaza","廣場","走到廣場"]]'::jsonb
$$;
create or replace function public.town_dex_npcs() returns jsonb language sql immutable as $$
  select '[["cafe","小咪","咖啡廳店員"],["restaurant","阿福","餐廳店員"],["gym","阿力","健身房教練"],["hospital","白護理師","醫院護理師"],["police","小林警員","警察局警員"],["cinema","小映","電影院售票員"],["market","阿珍","超市店員"],["casino","荷官小莉","賭場荷官"],["casinobar","酒保阿杰","賭場酒吧"],["tsec","祕書小雅","市政廳鎮長祕書"],["townhall","陳櫃員","市政廳櫃員"],["realty","房仲小陳","不動產公司"],["harbor","船長老王","碼頭船行"],["furnshop","木工阿福","家具行"],["wearshop","裁縫小美","服飾店"],["traveler","旅人","廣場或公園的訪客"],["merchant","流動商人","廣場或公園的商人"]]'::jsonb
$$;
create or replace function public.town_dex_acts() returns jsonb language sql immutable as $$
  select '[["a_eat","在家吃飯","在自己家吃飯"],["a_dine","餐廳套餐","餐廳吃一頓"],["a_coffee","咖啡廳咖啡","咖啡廳喝咖啡"],["a_snack","零食","吃一包零食"],["a_special","今日特餐","餐廳今日特餐"],["a_latte","特調咖啡","咖啡廳特調"],["a_popcorn","爆米花","電影院爆米花"],["a_picnic","野餐","公園野餐"]]'::jsonb
$$;
revoke all on function public.town_dex_places(), public.town_dex_npcs(), public.town_dex_acts() from public, anon, authenticated;

-- 分頁定義：[鍵, 標題, 50% 稱號, 100% 稱號]
create or replace function public.town_dex_tabs() returns jsonb language sql immutable as $$
  select '[["col","收藏品","小小收藏家","收藏大師"],["wear","造型","愛美豬","時尚達人"],["furn","家具","居家小能手","家具大亨"],["food","美食","愛吃鬼","美食老饕"],["place","地點","跑腿達人","鎮上通"],["npc","鎮民","熱心鄰居","鎮民之友"]]'::jsonb
$$;
revoke all on function public.town_dex_tabs() from public, anon, authenticated;

-- 核心項目清單（回傳 [{k,nm,got,hint,seas}]）；g = 分頁鍵
create or replace function public.town_dex_list(r public.town_residents, g text) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare it jsonb := coalesce(r.items, '{}'::jsonb); dx jsonb := coalesce(it->'dx', '{}'::jsonb); out jsonb := '[]'::jsonb; e jsonb; i int; k text; cl jsonb := coalesce(it->'cl', '{}'::jsonb); s record; w jsonb;
begin
  if g = 'col' then
    for i in 1..24 loop k := 'c' || lpad(i::text, 2, '0'); out := out || jsonb_build_array(jsonb_build_object('k', k, 'nm', '扭蛋 ' || lpad(i::text, 2, '0'), 'got', cl ? k, 'hint', '超市買扭蛋抽到', 'seas', false)); end loop;
    for i in 1..20 loop k := 'k' || lpad(i::text, 2, '0'); out := out || jsonb_build_array(jsonb_build_object('k', k, 'nm', '卡牌 ' || lpad(i::text, 2, '0'), 'got', cl ? k, 'hint', '超市買卡牌包抽到', 'seas', false)); end loop;
    for i in 1..6 loop k := 'p' || lpad(i::text, 2, '0'); out := out || jsonb_build_array(jsonb_build_object('k', k, 'nm', '小玩偶 ' || lpad(i::text, 2, '0'), 'got', cl ? k, 'hint', '廣場套圈圈（約 25% 套中）', 'seas', false)); end loop;
    out := out || jsonb_build_array(jsonb_build_object('k', 'cafemug', 'nm', '集點紀念杯', 'got', cl ? 'cafemug', 'hint', '咖啡廳櫃台買', 'seas', false), jsonb_build_object('k', 'filmfigure', 'nm', '電影周邊公仔', 'got', cl ? 'filmfigure', 'hint', '電影院福利社買', 'seas', false));
  elsif g = 'wear' then
    w := case when jsonb_typeof(it->'w') = 'array' then it->'w' else '[]'::jsonb end;
    for s in select * from public.town_shop where kind = 'wear' order by price, id loop
      out := out || jsonb_build_array(jsonb_build_object('k', s.id, 'nm', s.name, 'got', w ? s.id, 'seas', false,
        'hint', case when s.unlock = 'couple' then '有好麻吉就解鎖' when s.unlock = 'bandage' then '被扁 10 次解鎖' when s.unlock is not null then '達成條件解鎖' else '服飾店 $' || s.price end));
    end loop;
  elsif g = 'furn' then
    w := case when jsonb_typeof(it->'f') = 'array' then it->'f' else '[]'::jsonb end;
    for s in select * from public.town_shop where kind = 'furn' order by price, id loop
      out := out || jsonb_build_array(jsonb_build_object('k', s.id, 'nm', s.name, 'got', w ? s.id, 'hint', '家具行 $' || s.price, 'seas', false));
    end loop;
  elsif g = 'food' then
    for e in select x from jsonb_array_elements(public.town_catalog()) x
      where (x->>'cat') in ('food', 'drink') or ((x->>'cat') = 'svc' and (x->>'shop') in ('cafe', 'restaurant')) or (x->>'id') = 'moviecombo' loop
      out := out || jsonb_build_array(jsonb_build_object('k', e->>'id', 'nm', e->>'nm', 'got', coalesce(dx->'f', '{}') ? (e->>'id'), 'seas', (e ? 'season'),
        'hint', case e->>'shop' when 'market' then '超市' when 'cafe' then '咖啡廳' when 'restaurant' then '餐廳' when 'cinema' then '電影院' when 'gym' then '健身房' when 'park' then '公園' when 'plaza' then '廣場' else '' end
          || '買來吃' || case when e ? 'season' then '（季節限定）' else '' end));
    end loop;
    for e in select x from jsonb_array_elements(public.town_dex_acts()) x loop
      out := out || jsonb_build_array(jsonb_build_object('k', e->>0, 'nm', e->>1, 'got', coalesce(dx->'f', '{}') ? (e->>0), 'hint', e->>2, 'seas', false));
    end loop;
  elsif g = 'place' then
    for e in select x from jsonb_array_elements(public.town_dex_places()) x loop
      out := out || jsonb_build_array(jsonb_build_object('k', e->>0, 'nm', e->>1, 'got', coalesce(dx->'p', '{}') ? (e->>0), 'hint', e->>2, 'seas', false));
    end loop;
  elsif g = 'npc' then
    for e in select x from jsonb_array_elements(public.town_dex_npcs()) x loop
      out := out || jsonb_build_array(jsonb_build_object('k', e->>0, 'nm', e->>1, 'got', coalesce(dx->'n', '{}') ? (e->>0), 'hint', '和' || (e->>2) || '說話', 'seas', false));
    end loop;
  end if;
  return out;
end $$;
revoke all on function public.town_dex_list(public.town_residents,text) from public, anon, authenticated;

-- RPC
create or replace function public.town_dex(rid bigint, pin text, op text default 'view', key text default null) returns json language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; t jsonb; tabs jsonb := '[]'::jsonb; l jsonb; need int; got int; tot int; kl jsonb; tk text; lv text; ttl jsonb; sn int; gv text; ti text; allfull boolean := true; ptotal int := 0; pgot int := 0;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error', '密碼不對'); end if;
  if op = 'mark' then
    if key is null or key !~ '^n:[a-z]+$' or not exists (select 1 from jsonb_array_elements(public.town_dex_npcs()) z where z->>0 = substr(key, 3)) then raise exception '不能記錄這個'; end if;
    select * into r from public.town_residents p where p.id = r.id for update;
    r.items := public.town_dex_set(r.items, 'n', substr(key, 3));
    update public.town_residents p set items = r.items where p.id = r.id;
    return json_build_object('ok', true);
  end if;
  if op = 'claim' then
    select * into r from public.town_residents p where p.id = r.id for update;
    if key is null or key !~ '^[a-z]+:(50|100)$' then raise exception '領取代號不對'; end if;
    tk := split_part(key, ':', 1); lv := split_part(key, ':', 2);
    kl := coalesce(r.items->'dx'->'k', '[]'::jsonb);
    if kl ? (tk || lv) then raise exception '這個獎勵已經領過了'; end if;
    if tk = 'all' then
      if lv <> '100' then raise exception '領取代號不對'; end if;
      for t in select e from jsonb_array_elements(public.town_dex_tabs()) e loop
        l := public.town_dex_list(r, t->>0);
        select count(*) filter (where (z->>'got')::boolean and not (z->>'seas')::boolean), count(*) filter (where not (z->>'seas')::boolean) into got, tot from jsonb_array_elements(l) z;
        if got < tot then allfull := false; end if;
      end loop;
      if not allfull then raise exception '六個分頁都要集滿才能領'; end if;
      ti := '小鎮博物館長';
    else
      select e into t from jsonb_array_elements(public.town_dex_tabs()) e where e->>0 = tk;
      if t is null then raise exception '沒有這個分頁'; end if;
      l := public.town_dex_list(r, tk);
      select count(*) filter (where (z->>'got')::boolean and not (z->>'seas')::boolean), count(*) filter (where not (z->>'seas')::boolean) into got, tot from jsonb_array_elements(l) z;
      need := case when lv = '50' then (tot + 1) / 2 else tot end;
      if got < need then raise exception '還沒達標：% ／ %', got, need; end if;
      ti := case when lv = '50' then t->>2 else t->>3 end;
    end if;
    ttl := coalesce(r.items->'titles', '[]'::jsonb); sn := coalesce((r.items->>'snack')::int, 0);
    gv := '稱號「' || ti || '」';
    if tk <> 'all' and sn < public.town_bag_max(r) then r.items := jsonb_set(r.items, '{snack}', to_jsonb(sn + 1)); gv := gv || '、零食 1 包'; end if;
    if not (ttl ? ti) then r.items := jsonb_set(r.items, '{titles}', ttl || to_jsonb(ti)); end if;
    r.items := jsonb_set(r.items, '{dx}', coalesce(r.items->'dx', '{}'::jsonb) || jsonb_build_object('k', kl || to_jsonb(tk || lv)), true);
    update public.town_residents p set items = r.items where p.id = r.id;
    insert into public.town_events(town_id, actor, target, kind, msg) values (r.town_id, r.id, r.id, 'dex', left(r.name || ' 圖鑑達成：' || ti, 120));
    return json_build_object('ok', true, 'got', gv);
  end if;
  kl := coalesce(r.items->'dx'->'k', '[]'::jsonb);
  for t in select e from jsonb_array_elements(public.town_dex_tabs()) e loop
    l := public.town_dex_list(r, t->>0);
    select count(*) filter (where (z->>'got')::boolean and not (z->>'seas')::boolean), count(*) filter (where not (z->>'seas')::boolean) into got, tot from jsonb_array_elements(l) z;
    ptotal := ptotal + tot; pgot := pgot + got;
    tabs := tabs || jsonb_build_array(jsonb_build_object('k', t->>0, 'nm', t->>1, 'list', l, 'got', got, 'tot', tot, 't50', t->>2, 't100', t->>3,
      'd50', kl ? ((t->>0) || '50'), 'd100', kl ? ((t->>0) || '100')));
  end loop;
  ttl := coalesce(r.items->'titles', '[]'::jsonb);
  return json_build_object('ok', true, 'tabs', tabs, 'got', pgot, 'tot', ptotal, 'all_done', kl ? 'all100', 'all_ttl', '小鎮博物館長',
    'titles', case when jsonb_typeof(ttl) = 'array' then ttl else '[]'::jsonb end);
end $$;
revoke all on function public.town_dex(bigint,text,text,text) from public;
grant execute on function public.town_dex(bigint,text,text,text) to anon, authenticated;

-- 就地補丁：town_goal_hook（act／fac 的吃過、到過的地點）、town_goods（吃過／喝過的商品）。找不到錨點整檔失敗，已補過略過
do $do$
declare rec record; f record; d text; cnt int;
begin
  for rec in select * from (values
    ('town_goal_hook', $o$if hr < 5 then perform public.town_goal_bump_day(r.id, 'nite'); end if;$o$, $n$if hr < 5 then perform public.town_goal_bump_day(r.id, 'nite'); end if;
    -- 圖鑑：吃過的、到過的地點（town_dex_set 只寫 items.dx，r 在記憶體裡更新）
    if (src = 'act' and act in ('eat','dine','coffee','snack')) or (src = 'fac' and act in ('special','latte','popcorn','picnic')) then
      r.items := public.town_dex_set(r.items, 'f', 'a_' || act);
    end if;
    if r.place is not null and r.place in ('restaurant','market','office','park','cafe','cinema','gym','rafi','stock','carshop','arena','slaughter','jail','hospital','police','townhall','casino','realty','harbor','furnshop','wearshop','plaza') then
      r.items := public.town_dex_set(r.items, 'p', r.place);
    end if;$n$),
    ('town_goods', $o$r := public.town_ecap(r, e0, op);
  perform public.town_save_r(r);
  return json_build_object('m', -total, 'msg', msg);$o$, $n$if op = 'use' then r.items := public.town_dex_set(r.items, 'f', item); end if;
  r := public.town_ecap(r, e0, op);
  perform public.town_save_r(r);
  return json_build_object('m', -total, 'msg', msg);$n$)
  ) as t(fname, o, nw) loop
    cnt := 0;
    for f in select p.oid, p.prosrc from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = rec.fname loop
      if position('town_dex_set' in f.prosrc) > 0 then cnt := cnt + 1;
      elsif position(rec.o in f.prosrc) > 0 then
        d := replace(pg_get_functiondef(f.oid), rec.o, rec.nw); execute d; cnt := cnt + 1;
      end if;
    end loop;
    if cnt = 0 then raise exception '% 找不到要補的文字，請人工處理', rec.fname; end if;
  end loop;
end $do$;

-- 一次性回填（不給獎）：地點（fq 有互動過、works>0 算公司）、NPC（vz 遇過旅人、np 買過商人）
do $mig$ begin
  if not exists (select 1 from public.town_migrations where id = 'dex_backfill1') then
    update public.town_residents p set items = jsonb_set(p.items, '{dx}', coalesce(p.items->'dx', '{}'::jsonb) || jsonb_build_object(
        'p', coalesce(p.items->'dx'->'p', '{}'::jsonb) || coalesce((select jsonb_object_agg(k, 1) from jsonb_object_keys(case when jsonb_typeof(p.items->'fq') = 'object' then p.items->'fq' else '{}'::jsonb end) k
          where k in ('restaurant','market','office','park','cafe','cinema','gym','rafi','stock','carshop','arena','slaughter','jail','hospital','police','townhall','casino','realty','harbor','furnshop','wearshop','plaza')), '{}'::jsonb)
          || case when coalesce((p.items->>'works')::int, 0) > 0 then '{"office":1}'::jsonb else '{}'::jsonb end,
        'n', coalesce(p.items->'dx'->'n', '{}'::jsonb) || case when p.items ? 'vz' then '{"traveler":1}'::jsonb else '{}'::jsonb end || case when p.items ? 'np' then '{"merchant":1}'::jsonb else '{}'::jsonb end), true)
      where p.items ? 'fq' or p.items ? 'works' or p.items ? 'vz' or p.items ? 'np';
    insert into public.town_migrations(id) values ('dex_backfill1');
  end if;
end $mig$;
