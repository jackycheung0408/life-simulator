-- 小豬鎮：長期目標批 4「主線劇情」。要在 town_goal.sql、town_dex.sql、town_season.sql、town_catalog2.sql 之後套用，可重複執行，不建表。
-- 資料：items.mq = {on:1 已開始, p:1 暫停, ch:目前章(9=全部完成), t:{任務id:1}, c:{選擇鍵:選項}, dn:[已領章], n:已領章數, tn:完成任務數, cn:選擇數, kn:對話任務數, an:地點任務數, en:結局數}，缺值＝還沒開始，舊角色免遷移。
-- 8 章、每章 4 個任務依序解鎖（town_story_def，新增章節只改這個函式與前端 STORY 表）。任務類型只用既有可驗證的事：talk 和 NPC 對話（要在 NPC 所在地點）、at 走到某地點（可限時段）、
--   do 做一次既有動作（由 town_goal_hook／town_goods 的補丁呼叫 town_story_hook 完成，要在對應地點）、n 累計數字（讀 town_ach_val）、ch 選擇題（選項只影響劇情文字，ch8 的三個結局各給一個稱號，彼此不排斥）。
-- 獎勵只有稱號、限定造型（只能靠通關領取）、零食 1 包（背包滿就略過）；不給錢、能力、精力。每章只能領一次。
-- RPC town_story(rid,pin,op,id,choice)：view／start／pause／talk（id=NPC 代號）／advance／choose（id=選擇鍵、choice=選項）／claim（id=章號）。
-- 就地補丁：town_goal_hook（act／fac）、town_goods（買／用）加一行 town_story_hook；town_ach_def 加 6 個主線成就（81～86）。找不到錨點整檔失敗；已補過略過。重套 town_goal.sql／town_dex.sql／town_catalog*.sql／town_fix_numbers.sql 後要再套一次。
-- 在 Supabase，revoke ... from public 擋不住 anon／authenticated，要連 anon、authenticated 一起收回。

-- 限定造型（只能通關領取，unlock = 'story'）
insert into public.town_shop(id, kind, slot, name, price, unlock) values
  ('mq3', 'wear', 'acc', '咖啡豆髮夾', 0, 'story'),
  ('mq6', 'wear', 'acc', '老鎮長禮帽', 0, 'story'),
  ('mq8', 'wear', 'acc', '小豬鎮徽章冠', 0, 'story')
on conflict (id) do update set kind = excluded.kind, slot = excluded.slot, name = excluded.name, price = excluded.price, unlock = excluded.unlock;

-- 章節與任務定義（前端 STORY 的 id、任務數、獎勵要一致）
create or replace function public.town_story_def() returns jsonb language sql immutable as $$
  select '[
   {"id":1,"nm":"新鎮民報到","tk":[
     {"id":"1.1","k":"talk","a":"townhall"},
     {"id":"1.2","k":"do","a":["coffee","latte","art","dripcoffee"],"pl":"cafe"},
     {"id":"1.3","k":"do","a":["dine","special","combo","restsoup","restnoodles","restdessert"],"pl":"restaurant"},
     {"id":"1.4","k":"ch","a":"c1","o":["a","b"],"pl":"home"}],
    "rw":{"ti":"新鎮民"}},
   {"id":2,"nm":"失蹤的小豬雕像","tk":[
     {"id":"2.1","k":"at","a":"plaza"},
     {"id":"2.2","k":"at","a":"park"},
     {"id":"2.3","k":"at","a":"market"},
     {"id":"2.4","k":"ch","a":"c2","o":["a","b"]}],
    "rw":{"ti":"雕像偵探"}},
   {"id":3,"nm":"咖啡廳的祕密配方","tk":[
     {"id":"3.1","k":"talk","a":"cafe"},
     {"id":"3.2","k":"do","a":["coffee","latte","art","dripcoffee","cafecake"],"pl":"cafe"},
     {"id":"3.3","k":"talk","a":"cinema"},
     {"id":"3.4","k":"ch","a":"c3","o":["a","b"]}],
    "rw":{"ti":"配方守護者","w":"mq3"}},
   {"id":4,"nm":"夜市的神祕商人","tk":[
     {"id":"4.1","k":"at","a":"plaza","hr":[21,23]},
     {"id":"4.2","k":"talk","a":"merchant"},
     {"id":"4.3","k":"talk","a":"casinobar"},
     {"id":"4.4","k":"ch","a":"c4","o":["a","b"]}],
    "rw":{"ti":"夜市常客"}},
   {"id":5,"nm":"巡警的煩惱","tk":[
     {"id":"5.1","k":"talk","a":"police"},
     {"id":"5.2","k":"n","src":"c:zk","n":1},
     {"id":"5.3","k":"n","src":"c:zk","n":3},
     {"id":"5.4","k":"ch","a":"c5","o":["a","b"]}],
    "rw":{"ti":"巡警好夥伴"}},
   {"id":6,"nm":"老鎮長的日記","tk":[
     {"id":"6.1","k":"at","a":"townhall"},
     {"id":"6.2","k":"at","a":"hospital"},
     {"id":"6.3","k":"at","a":"jail"},
     {"id":"6.4","k":"ch","a":"c6","o":["a","b"]}],
    "rw":{"ti":"小鎮史學家","w":"mq6"}},
   {"id":7,"nm":"碼頭的信號","tk":[
     {"id":"7.1","k":"talk","a":"harbor"},
     {"id":"7.2","k":"at","a":"realty"},
     {"id":"7.3","k":"talk","a":"tsec"},
     {"id":"7.4","k":"ch","a":"c7","o":["a","b"]}],
    "rw":{"ti":"碼頭守望者"}},
   {"id":8,"nm":"小豬鎮的未來","tk":[
     {"id":"8.1","k":"talk","a":"tsec"},
     {"id":"8.2","k":"n","src":"i:works","n":10},
     {"id":"8.3","k":"at","a":"townhall"},
     {"id":"8.4","k":"ch","a":"c8","o":["a","b","c"]}],
    "et":{"a":"繁榮派","b":"溫馨派","c":"冒險派"},
    "rw":{"ti":"小豬鎮代表","w":"mq8"}}
  ]'::jsonb
$$;

-- 完成一項任務（純函式，回傳新的 items；同一任務只算一次）
create or replace function public.town_story_mark(p_it jsonb, p_tid text, p_k text) returns jsonb language plpgsql immutable set search_path = public as $$
declare v_mq jsonb := coalesce(p_it->'mq', '{}'::jsonb); v_t jsonb := coalesce(v_mq->'t', '{}'::jsonb);
begin
  if v_t ? p_tid then return p_it; end if;
  v_mq := jsonb_set(v_mq, '{t}', v_t || jsonb_build_object(p_tid, 1), true);
  v_mq := jsonb_set(v_mq, '{tn}', to_jsonb(coalesce((v_mq->>'tn')::int, 0) + 1), true);
  if p_k = 'talk' then v_mq := jsonb_set(v_mq, '{kn}', to_jsonb(coalesce((v_mq->>'kn')::int, 0) + 1), true);
  elsif p_k = 'at' then v_mq := jsonb_set(v_mq, '{an}', to_jsonb(coalesce((v_mq->>'an')::int, 0) + 1), true);
  end if;
  return jsonb_set(coalesce(p_it, '{}'::jsonb), '{mq}', v_mq, true);
end $$;

-- 目前進行中的任務（還沒開始、暫停或全部完成回 null；暫停不在這裡判斷）
create or replace function public.town_story_task(p_it jsonb) returns jsonb language plpgsql stable set search_path = public as $$
declare v_mq jsonb := p_it->'mq'; v_ch int; v_c jsonb; v_k jsonb;
begin
  if v_mq is null or coalesce((v_mq->>'on')::int, 0) <> 1 then return null; end if;
  v_ch := coalesce((v_mq->>'ch')::int, 1);
  select e into v_c from jsonb_array_elements(public.town_story_def()) e where (e->>'id')::int = v_ch;
  if v_c is null then return null; end if;
  for v_k in select e from jsonb_array_elements(v_c->'tk') e loop
    if not (coalesce(v_mq->'t', '{}'::jsonb) ? (v_k->>'id')) then return v_k; end if;
  end loop;
  return null;
end $$;

-- 動作掛鉤：做了某個動作，如果正是目前的 do 任務就完成它。絕不丟錯；回傳 r
create or replace function public.town_story_hook(r public.town_residents, p_src text, p_act text) returns public.town_residents language plpgsql set search_path = public as $$
declare v_k jsonb;
begin
  begin
    if r.items->'mq' is null or coalesce((r.items->'mq'->>'p')::int, 0) = 1 then return r; end if;
    v_k := public.town_story_task(r.items);
    if v_k is not null and v_k->>'k' = 'do' and r.place = v_k->>'pl' and (v_k->'a') ? p_act then
      r.items := public.town_story_mark(r.items, v_k->>'id', 'do');
    end if;
  exception when others then null;
  end;
  return r;
end $$;
revoke all on function public.town_story_def(), public.town_story_mark(jsonb,text,text), public.town_story_task(jsonb), public.town_story_hook(public.town_residents,text,text) from public, anon, authenticated;

create or replace function public.town_story(rid bigint, pin text, op text default 'view', id text default null, choice text default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; v_mq jsonb; v_c jsonb; v_k jsonb; v_np text; v_ok boolean; v_hr int := extract(hour from now() at time zone 'Asia/Taipei')::int;
  v_cnt jsonb; v_ch int; v_ti text; v_w text; v_sn int; v_ttl jsonb; v_got text := ''; v_cur text; v_et text; v_all boolean; v_tid text;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if op not in ('view','start','pause','talk','advance','choose','claim') then raise exception '未知動作'; end if;
  if op <> 'view' then select * into r from public.town_residents p where p.id = r.id for update; end if;
  v_mq := coalesce(r.items->'mq', '{}'::jsonb);
  if op = 'view' then
    return json_build_object('ok', true, 'mq', v_mq, 'cur', (public.town_story_task(r.items))->>'id');
  end if;
  if op = 'start' then
    if coalesce((v_mq->>'on')::int, 0) <> 1 then
      v_mq := jsonb_build_object('on', 1, 'p', 0, 'ch', 1, 't', '{}'::jsonb, 'c', '{}'::jsonb, 'dn', '[]'::jsonb, 'n', 0, 'tn', 0, 'cn', 0, 'kn', 0, 'an', 0, 'en', 0);
    else v_mq := jsonb_set(v_mq, '{p}', '0'::jsonb, true); end if;
    r.items := jsonb_set(coalesce(r.items, '{}'::jsonb), '{mq}', v_mq, true);
    update public.town_residents p set items = r.items where p.id = r.id;
    return json_build_object('ok', true, 'mq', v_mq, 'cur', (public.town_story_task(r.items))->>'id');
  end if;
  if coalesce((v_mq->>'on')::int, 0) <> 1 then raise exception '還沒開始主線'; end if;
  if op = 'pause' then
    v_mq := jsonb_set(v_mq, '{p}', '1'::jsonb, true);
    r.items := jsonb_set(r.items, '{mq}', v_mq, true);
    update public.town_residents p set items = r.items where p.id = r.id;
    return json_build_object('ok', true, 'mq', v_mq);
  end if;
  if coalesce((v_mq->>'p')::int, 0) = 1 then raise exception '主線暫停中，先按「繼續」'; end if;
  v_k := public.town_story_task(r.items);

  if op = 'talk' then
    v_np := case id when 'townhall' then 'townhall' when 'tsec' then 'townhall' when 'cafe' then 'cafe' when 'restaurant' then 'restaurant' when 'police' then 'police'
      when 'hospital' then 'hospital' when 'harbor' then 'harbor' when 'market' then 'market' when 'cinema' then 'cinema' when 'gym' then 'gym'
      when 'casinobar' then 'casino' when 'traveler' then 'plaza' when 'merchant' then 'plaza' else null end;
    if v_np is null then raise exception '沒有這位 NPC'; end if;
    v_ok := case when id in ('traveler','merchant') then r.place in ('plaza','park') else r.place = v_np end;
    if v_ok and v_k is not null and v_k->>'k' = 'talk' and v_k->>'a' = id then
      r.items := public.town_story_mark(r.items, v_k->>'id', 'talk');
      update public.town_residents p set items = r.items where p.id = r.id;
      return json_build_object('ok', true, 'hit', true, 'tid', v_k->>'id');
    end if;
    return json_build_object('ok', true, 'hit', false);
  end if;

  if op = 'advance' then
    if v_k is null then return json_build_object('ok', true, 'hit', false); end if;
    v_ok := false;
    if v_k->>'k' = 'at' then
      v_ok := case when v_k->>'a' = 'home' then r.place = 'home:' || r.id::text else r.place = v_k->>'a' end;
      if v_ok and v_k ? 'hr' then v_ok := v_hr >= (v_k->'hr'->>0)::int and v_hr < (v_k->'hr'->>1)::int; end if;
    elsif v_k->>'k' = 'n' then
      select coalesce(jsonb_object_agg(c.k, c.n), '{}'::jsonb) into v_cnt from public.town_ach_c c where c.rid = r.id;
      v_ok := public.town_ach_val(r, v_k->>'src', v_cnt, '{}'::jsonb) >= (v_k->>'n')::bigint;
    end if;
    if v_ok then
      r.items := public.town_story_mark(r.items, v_k->>'id', v_k->>'k');
      update public.town_residents p set items = r.items where p.id = r.id;
      return json_build_object('ok', true, 'hit', true, 'tid', v_k->>'id');
    end if;
    return json_build_object('ok', true, 'hit', false);
  end if;

  if op = 'choose' then
    if id is null or choice is null or id !~ '^c[1-8]$' or choice !~ '^[abc]$' then raise exception '選擇不對'; end if;
    select e into v_c from jsonb_array_elements(public.town_story_def()) e where (e->>'id')::int = substr(id, 2)::int;
    if not (v_c->'tk'->3->'o' ? choice) then raise exception '沒有這個選項'; end if;
    -- 第 8 章結局可以再選其他的（各給一個稱號，不排斥）
    if id = 'c8' and coalesce(v_mq->'c', '{}'::jsonb) ? 'c8' then
      if position(choice in (v_mq->'c'->>'c8')) > 0 then raise exception '這個結局已經選過了'; end if;
      v_mq := jsonb_set(v_mq, '{c,c8}', to_jsonb((v_mq->'c'->>'c8') || choice), true);
      v_mq := jsonb_set(v_mq, '{en}', to_jsonb(coalesce((v_mq->>'en')::int, 0) + 1), true);
      v_et := v_c->'et'->>choice; v_ttl := coalesce(r.items->'titles', '[]'::jsonb);
      if v_et is not null and not (v_ttl ? v_et) then r.items := jsonb_set(r.items, '{titles}', v_ttl || to_jsonb(v_et), true); end if;
      r.items := jsonb_set(r.items, '{mq}', v_mq, true);
      update public.town_residents p set items = r.items where p.id = r.id;
      return json_build_object('ok', true, 'hit', true, 'tid', '8.4', 'title', v_et);
    end if;
    if v_k is null or v_k->>'k' <> 'ch' or v_k->>'a' <> id then raise exception '現在還不能做這個選擇'; end if;
    if v_k->>'pl' = 'home' and r.place <> 'home:' || r.id::text then raise exception '要回到自己家才能選'; end if;
    r.items := public.town_story_mark(r.items, v_k->>'id', 'ch');
    v_mq := r.items->'mq';
    v_mq := jsonb_set(v_mq, '{c}', coalesce(v_mq->'c', '{}'::jsonb) || jsonb_build_object(id, choice), true);
    v_mq := jsonb_set(v_mq, '{cn}', to_jsonb(coalesce((v_mq->>'cn')::int, 0) + 1), true);
    if id = 'c8' then
      v_mq := jsonb_set(v_mq, '{en}', to_jsonb(coalesce((v_mq->>'en')::int, 0) + 1), true);
      v_et := v_c->'et'->>choice; v_ttl := coalesce(r.items->'titles', '[]'::jsonb);
      if v_et is not null and not (v_ttl ? v_et) then r.items := jsonb_set(r.items, '{titles}', v_ttl || to_jsonb(v_et), true); end if;
    end if;
    r.items := jsonb_set(r.items, '{mq}', v_mq, true);
    update public.town_residents p set items = r.items where p.id = r.id;
    return json_build_object('ok', true, 'hit', true, 'tid', v_k->>'id', 'title', v_et);
  end if;

  if op = 'claim' then
    if id is null or id !~ '^[1-8]$' then raise exception '沒有這一章'; end if;
    v_ch := id::int;
    select e into v_c from jsonb_array_elements(public.town_story_def()) e where (e->>'id')::int = v_ch;
    if coalesce(v_mq->'dn', '[]'::jsonb) @> to_jsonb(v_ch) then raise exception '這一章的獎勵已經領過了'; end if;
    if v_ch <> coalesce((v_mq->>'ch')::int, 1) then raise exception '要依序完成章節'; end if;
    select bool_and(coalesce(v_mq->'t', '{}'::jsonb) ? (e->>'id')) into v_all from jsonb_array_elements(v_c->'tk') e;
    if not coalesce(v_all, false) then raise exception '這一章還沒完成'; end if;
    v_ti := v_c->'rw'->>'ti'; v_w := v_c->'rw'->>'w'; v_ttl := coalesce(r.items->'titles', '[]'::jsonb);
    if v_ti is not null then
      v_got := '稱號「' || v_ti || '」';
      if not (v_ttl ? v_ti) then r.items := jsonb_set(r.items, '{titles}', v_ttl || to_jsonb(v_ti), true); end if;
    end if;
    if v_w is not null then
      if jsonb_typeof(coalesce(r.items->'w', '[]'::jsonb)) = 'array' and not (coalesce(r.items->'w', '[]'::jsonb) ? v_w) then
        r.items := jsonb_set(r.items, '{w}', coalesce(r.items->'w', '[]'::jsonb) || to_jsonb(v_w), true);
      end if;
      v_got := v_got || '、限定造型「' || (select s.name from public.town_shop s where s.id = v_w) || '」';
    end if;
    v_sn := coalesce((r.items->>'snack')::int, 0);
    if v_sn < public.town_bag_max(r) then r.items := jsonb_set(r.items, '{snack}', to_jsonb(v_sn + 1), true); v_got := v_got || '、零食 1 包'; end if;
    v_mq := jsonb_set(v_mq, '{dn}', coalesce(v_mq->'dn', '[]'::jsonb) || to_jsonb(v_ch), true);
    v_mq := jsonb_set(v_mq, '{n}', to_jsonb(coalesce((v_mq->>'n')::int, 0) + 1), true);
    v_mq := jsonb_set(v_mq, '{ch}', to_jsonb(least(9, v_ch + 1)), true);
    r.items := jsonb_set(r.items, '{mq}', v_mq, true);
    update public.town_residents p set items = r.items where p.id = r.id;
    insert into public.town_events(town_id, actor, target, kind, msg) values (r.town_id, r.id, r.id, 'story', left(r.name || ' 完成了主線第' || v_ch || '章「' || (v_c->>'nm') || '」', 120));
    return json_build_object('ok', true, 'got', v_got, 'ch', v_ch, 'next', least(9, v_ch + 1));
  end if;
  return json_build_object('ok', true);
end $$;
revoke all on function public.town_story(bigint,text,text,text,text) from public;
grant execute on function public.town_story(bigint,text,text,text,text) to anon, authenticated;

-- 就地補丁：找不到錨點整檔失敗，已補過（marker 只出現在新內容）略過
do $do$
declare rec record; f record; d text; cnt int;
begin
  for rec in select * from (values
    ('town_goal_hook', 'town_story_hook', $o$if hr < 5 then perform public.town_goal_bump_day(r.id, 'nite'); end if;$o$, $n$if hr < 5 then perform public.town_goal_bump_day(r.id, 'nite'); end if;
    r := public.town_story_hook(r, src, act);$n$),
    ('town_goods', 'town_story_hook', $o$if op = 'use' then r.items := public.town_dex_set(r.items, 'f', item); end if;$o$, $n$if op = 'use' then r.items := public.town_dex_set(r.items, 'f', item); end if;
  if op = 'use' then r := public.town_story_hook(r, 'goods', item); end if;$n$),
    ('town_ach_def', '劇情新手', $o$(80,'col','成就大師','@achsum',array[150])$o$, $n$(80,'col','成就大師','@achsum',array[150]),
  (81,'adv','劇情新手','i:mq.n',array[1,4,8]),
  (82,'adv','任務跑腿','i:mq.tn',array[4,16,30]),
  (83,'adv','抉擇者','i:mq.cn',array[1,4,8]),
  (84,'adv','結局收集','i:mq.en',array[1,2,3]),
  (85,'adv','對話達人','i:mq.kn',array[3,6,9]),
  (86,'adv','小鎮探索','i:mq.an',array[3,6,9])$n$)
  ) as t(fname, mk, o, nw) loop
    cnt := 0;
    for f in select p.oid, p.prosrc from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = rec.fname loop
      if position(rec.mk in f.prosrc) > 0 then cnt := cnt + 1;
      elsif position(rec.o in f.prosrc) > 0 then
        d := replace(pg_get_functiondef(f.oid), rec.o, rec.nw); execute d; cnt := cnt + 1;
      end if;
    end loop;
    if cnt = 0 then raise exception '% 找不到要補的文字，請人工處理', rec.fname; end if;
  end loop;
end $do$;
