-- 小豬鎮：體檢修復（其餘區塊）。要在 town.sql、town_fac.sql、town_onboard.sql、town_mischief.sql 之後套用，可重複執行。
-- 1) 長椅、飲水機：每天靠它們補的精力最多 100（items.dc.bench，台灣日）。
-- 2) 垃圾桶、郵筒：每天各最多 3 次（items.dc.trash／mail，每次翻都算），到上限回清楚訊息。
--    上限內期望：垃圾桶 3 次約 $24～32（幸運兒更高）、郵筒 3 次約 $54～72，皆有每日上限。
-- 3) 單機分數：新 RPC town_score_start 記開局 items.sg={g,t}；town_score 驗時間與步數；沒開局紀錄（舊客戶端）用保守上限。
-- 4) town_onboard 每步伺服器驗證事實。
-- 5) 格鬥場 PK 死碼（> now() + 1 day 永遠為假）清掉。
-- town_act、town_pk 用 pg_get_functiondef 就地補丁（找不到錨點整檔失敗，已補過就略過）；
-- 若 fix-casino／fix-numbers 的檔也補 town_act，套用順序見回報（本檔補的是 obj 分支，與它們的段落不重疊）。

create or replace function public.town_dc_add(r public.town_residents, k text, amt int) returns public.town_residents
language plpgsql stable as $$
declare dc jsonb; day text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
begin
  dc := case when r.items->'dc'->>'d' = day then r.items->'dc' else jsonb_build_object('d', day) end;
  dc := jsonb_set(dc, array[k], to_jsonb(coalesce((dc->>k)::int,0) + amt));
  r.items := jsonb_set(r.items, '{dc}', dc);
  return r;
end $$;
revoke all on function public.town_dc_add(public.town_residents,text,int) from public, anon, authenticated;

do $$
declare d text; o text;
begin
  select pg_get_functiondef(p.oid) into d from pg_proc p where p.proname = 'town_act' and p.pronamespace = 'public'::regnamespace;
  if d is null then raise exception 'town_act 不存在'; end if;
  if d not like '%今天這個垃圾桶已經翻過了%' then
    o := 'elsif item = ''trash'' then r.fun := r.fun + 4;';
    if position(o in d) = 0 then raise exception '找不到錨點：trash'; end if;
    d := replace(d, o, 'elsif item = ''trash'' then if public.town_dc_get(r,''trash'') >= 3 then raise exception ''今天這個垃圾桶已經翻過了，明天再來''; end if; r := public.town_dc_inc(r,''trash''); r.fun := r.fun + 4;');
    o := 'elsif pa < .25 and true then r := public.town_dc_inc(r,''trash''); n :=';
    if position(o in d) = 0 then raise exception '找不到錨點：trash loot'; end if;
    d := replace(d, o, 'elsif pa < .25 then n :=');
    o := 'elsif item = ''mailbox'' then r.fun := r.fun + 2;';
    if position(o in d) = 0 then raise exception '找不到錨點：mailbox'; end if;
    d := replace(d, o, 'elsif item = ''mailbox'' then if public.town_dc_get(r,''mail'') >= 3 then raise exception ''今天這個郵筒已經看過了，明天再來''; end if; r := public.town_dc_inc(r,''mail''); r.fun := r.fun + 2;');
    o := 'if pa < .3 and true then r := public.town_dc_inc(r,''mail''); n :=';
    if position(o in d) = 0 then raise exception '找不到錨點：mail loot'; end if;
    d := replace(d, o, 'if pa < .3 then n :=');
  end if;
  if d not like '%今天坐夠長椅了%' then
    o := 'elsif item = ''bench'' then r.energy := r.energy + 20; r.fun := r.fun + 2;';
    if position(o in d) = 0 then raise exception '找不到錨點：bench'; end if;
    d := replace(d, o, 'elsif item = ''bench'' then n := least(20, greatest(0, 100 - public.town_dc_get(r,''bench''))); if n <= 0 then raise exception ''今天坐夠長椅了，精力補不動了，去睡一覺吧''; end if; r := public.town_dc_add(r,''bench'',n); r.energy := r.energy + n; r.fun := r.fun + 2;');
    o := 'elsif item = ''cooler'' then r.energy := r.energy + 3; r.hunger := r.hunger + 3; r.bladder := r.bladder - 3;';
    if position(o in d) = 0 then raise exception '找不到錨點：cooler'; end if;
    d := replace(d, o, 'elsif item = ''cooler'' then if public.town_dc_get(r,''bench'') >= 100 then raise exception ''今天喝太多水了，精力補不動了''; end if; r := public.town_dc_add(r,''bench'',3); r.energy := r.energy + 3; r.hunger := r.hunger + 3; r.bladder := r.bladder - 3;');
  end if;
  execute d;
end $$;

do $$
declare d text; o text;
begin
  select pg_get_functiondef(p.oid) into d from pg_proc p where p.proname = 'town_pk' and p.pronamespace = 'public'::regnamespace;
  if d is null then raise exception 'town_pk 不存在'; end if;
  o := '    if (r.items->''cd''->>(''pks'' || target)) is not null and (r.items->''cd''->>(''pks'' || target))::timestamptz > now() + interval ''1 day'' then raise exception ''剛約過他，等 3 分鐘再約''; end if;';
  if position(o in d) > 0 then
    d := replace(d, o, '');
    execute d;
  elsif d like '%剛約過他%' then
    raise exception '找不到錨點：town_pk 死碼';
  end if;
end $$;

-- 單機分數：開局
create or replace function public.town_score_start(rid bigint, pin text, game text) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if game not in ('whack','memory') then raise exception '沒有這個遊戲'; end if;
  update public.town_residents set items = jsonb_set(items, '{sg}', jsonb_build_object('g', game, 't', now())) where id = rid;
  return json_build_object('ok', true);
end $$;
revoke all on function public.town_score_start(bigint,text,text) from public, anon, authenticated;
grant execute on function public.town_score_start(bigint,text,text) to anon, authenticated;

create or replace function public.town_score(rid bigint, pin text, game text, score int) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; v_cap int; v_best int; v_gain int := 0; v_el numeric; v_mv int; v_ok boolean := false;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if public.town_is_off(r.town_id, 'arcade') then raise exception '這個小鎮沒有開街機'; end if;
  if r.place <> 'plaza' then raise exception '街機在小豬廣場，走過去再玩'; end if;
  v_cap := case game when 'whack' then 40 when 'memory' then 100 else null end;
  if v_cap is null then raise exception '沒有這個遊戲'; end if;
  if score is null or score < 0 or score > v_cap then raise exception '分數不合理'; end if;
  -- 有開局紀錄（且是同一款）：用經過時間驗證；沒有（舊客戶端、或已用過）：保守上限
  if (r.items->'sg'->>'g') = game and (r.items->'sg'->>'t') is not null then
    v_el := extract(epoch from (now() - (r.items->'sg'->>'t')::timestamptz));
    v_ok := true;
    if game = 'whack' then
      -- 30 秒、每 0.75 秒最多出現一隻；沒玩滿 25 秒不可能有分數
      if score > 0 and (v_el < 25 or score > floor(v_el / 0.7)) then raise exception '分數不合理（時間不對）'; end if;
    else
      -- 每步至少約 0.9 秒（翻兩張＋等待）；100 分 = 8 步
      v_mv := 8 + ceil((100 - score) / 5.0)::int;
      if score > 0 and v_el < v_mv * 0.9 then raise exception '分數不合理（時間不對）'; end if;
    end if;
    r.items := r.items - 'sg';
  else
    if score > (case game when 'whack' then 25 else 70 end) then raise exception '分數不合理（請更新遊戲後再玩）'; end if;
  end if;
  v_best := coalesce((r.items->'sp'->>game)::int, 0);
  if score > v_best then v_best := score; r.items := jsonb_set(r.items, '{sp}', coalesce(r.items->'sp','{}'::jsonb) || jsonb_build_object(game, v_best)); end if;
  v_gain := 2; r.fun := least(100, r.fun + 2);
  update public.town_residents set fun = r.fun, items = r.items, seen_at = now() where id = rid;
  return json_build_object('best', v_best, 'gain', v_gain);
end $$;
revoke all on function public.town_score(bigint,text,text,int) from public, anon, authenticated;
grant execute on function public.town_score(bigint,text,text,int) to anon, authenticated;

-- 新手引導：每步驗事實（步驟 3 沿用打工次數）
create or replace function public.town_onboard(rid bigint, pin text, step int default 0) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; got jsonb; rew int; v_ok boolean; v_msg text;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  got := coalesce(r.items->'ob'->'s', '[]'::jsonb);
  if step = 0 then return json_build_object('got', got); end if;
  if step < 1 or step > 5 then return json_build_object('error','未知步驟'); end if;
  if got @> to_jsonb(step) then return json_build_object('got', got, 'msg', '已經領過了'); end if;
  v_ok := case step
    when 1 then coalesce((r.items->>'snack')::int,0) > 0 or coalesce((r.items->>'gift')::int,0) > 0
                or coalesce((select count(*) from jsonb_object_keys(case when jsonb_typeof(r.items->'inv') = 'object' then r.items->'inv' else '{}'::jsonb end)),0) > 0
                or coalesce((r.items->>'mp')::int,0) > 0
    when 2 then r.place = 'cafe' or coalesce((r.items->'fq'->>'cafe')::int,0) > 0
    when 3 then coalesce((r.items->>'works')::int, 0) >= 1
    when 4 then (select count(*) from public.town_residents tr where tr.town_id = r.town_id) < 2
                or exists (select 1 from public.town_events e where e.actor = rid and e.target is not null and e.target <> rid)
                or exists (select 1 from public.town_bonds b where b.a = rid or b.b = rid)
    else r.sleeping and r.place = 'home:' || rid::text end;
  v_msg := case step when 1 then '還沒買過東西' when 2 then '還沒去過咖啡廳' when 3 then '還沒打過工' when 4 then '還沒和鄰居互動過' else '還沒在家睡覺' end;
  if not v_ok then return json_build_object('error', v_msg); end if;
  rew := case step when 1 then 100 when 2 then 100 when 3 then 500 when 4 then 300 else 300 end;
  r.money := r.money + rew;
  got := got || to_jsonb(step);
  r.items := jsonb_set(r.items, '{ob}', jsonb_build_object('s', got));
  perform public.town_save_r(r);
  return json_build_object('got', got, 'reward', rew, 'money', r.money);
end $$;
revoke all on function public.town_onboard(bigint,text,int) from public, anon, authenticated;
grant execute on function public.town_onboard(bigint,text,int) to anon, authenticated;
