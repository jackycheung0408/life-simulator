-- 小豬鎮：朋友分身人設（外號、口頭禪、朋友互取外號）。要在 town.sql 之後套用，可重複執行，不建表、不改 town_state／town_act。
-- 資料 items.pf = {nick 自己的外號(≤6字), mt 口頭禪[≤3句,各≤16字], pp 待回應提議[{f,n,at}]最多3, by {提議人id:外號}已接受, bo 接受順序[id], pd {d,n}今天收到幾個, lp {提議人id:時間}}。缺值＝沒有，舊角色免遷移。
-- town_state 本來就回傳每位居民完整 items，所以外號不用改 town_state，前端直接讀 items.pf（取捨：不用就地改 town_state，風險最小；代價是 items.pf 內的 pp／lp 也會被同鎮人看到，都不含機密）。
-- 驗證：去前後空白、禁網址／@／控制字元、長度限制、不可全空白。
-- 限制：每人每天最多收 3 個提議、同一提議人對同一人 1 小時一次、待回應最多 3 個。鎮長可清除任何人的人設（op=clear＋target，寫公開動態 kind mayor）。
create or replace function public.town_pf_clean(s text, mx int) returns text
language plpgsql immutable set search_path = public as $$
declare v text := btrim(coalesce(s, ''));
begin
  if v = '' then return ''; end if;
  if char_length(v) > mx then raise exception '最多 % 個字', mx; end if;
  if v ~ '[[:cntrl:]]' or v ~* '(https?:|www\.|\.com|\.tw|\.net|\.io|://)' or position('@' in v) > 0 or position('＠' in v) > 0 then
    raise exception '不能放網址、@ 或特殊字元';
  end if;
  return v;
end $$;
revoke all on function public.town_pf_clean(text,int) from public, anon, authenticated;

create or replace function public.town_persona(rid bigint, pin text, op text default 'get', target bigint default null, note text default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; t public.town_residents; pf jsonb; tp jsonb; nick text; mts jsonb := '[]'::jsonb; j jsonb; s text; n int;
  today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); pp jsonb; el jsonb; keep jsonb;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  pf := coalesce(r.items->'pf', '{}'::jsonb);
  if op = 'get' then return json_build_object('pf', pf); end if;

  if op = 'set' then
    begin j := note::jsonb; exception when others then return json_build_object('error','格式不對'); end;
    if j ? 'nick' then nick := public.town_pf_clean(j->>'nick', 6); end if;
    if j ? 'mt' then
      if jsonb_typeof(j->'mt') <> 'array' or jsonb_array_length(j->'mt') > 3 then return json_build_object('error','口頭禪最多 3 句'); end if;
      for s in select jsonb_array_elements_text(j->'mt') loop
        s := public.town_pf_clean(s, 16);
        if s <> '' then mts := mts || to_jsonb(s); end if;
      end loop;
      pf := jsonb_set(pf, '{mt}', mts);
    end if;
    if nick is not null then
      if nick = '' then pf := pf - 'nick'; else pf := jsonb_set(pf, '{nick}', to_jsonb(nick)); end if;
    end if;
    r.items := jsonb_set(r.items, '{pf}', pf);
    perform public.town_save_r(r);
    return json_build_object('ok', true, 'pf', pf);
  end if;

  if op = 'propose' then
    select * into t from public.town_residents where id = target and town_id = r.town_id;
    if t.id is null then return json_build_object('error','找不到這位鄰居'); end if;
    if t.id = r.id then return json_build_object('error','不能幫自己提議，到「我的人設」直接改'); end if;
    nick := public.town_pf_clean(note, 6);
    if nick = '' then return json_build_object('error','外號不能空白'); end if;
    tp := coalesce(t.items->'pf', '{}'::jsonb);
    if (tp->'lp'->>(r.id::text)) is not null and (tp->'lp'->>(r.id::text))::timestamptz > now() - interval '1 hour' then
      return json_build_object('error','你剛替他提議過，1 小時後再來');
    end if;
    if tp->'pd'->>'d' = today and coalesce((tp->'pd'->>'n')::int, 0) >= 3 then
      return json_build_object('error','他今天已經收到 3 個提議了，明天再試');
    end if;
    pp := coalesce(tp->'pp', '[]'::jsonb);
    keep := '[]'::jsonb;
    for el in select * from jsonb_array_elements(pp) loop
      if (el->>'f')::bigint <> r.id then keep := keep || el; end if;
    end loop;
    if jsonb_array_length(keep) >= 3 then return json_build_object('error','他還有 3 個提議沒回應，晚點再試'); end if;
    keep := keep || jsonb_build_array(jsonb_build_object('f', r.id, 'n', nick, 'at', now()));
    tp := jsonb_set(tp, '{pp}', keep);
    tp := jsonb_set(tp, '{lp}', coalesce(tp->'lp', '{}'::jsonb) || jsonb_build_object(r.id::text, now()));
    n := case when tp->'pd'->>'d' = today then coalesce((tp->'pd'->>'n')::int, 0) else 0 end + 1;
    tp := jsonb_set(tp, '{pd}', jsonb_build_object('d', today, 'n', n));
    t.items := jsonb_set(t.items, '{pf}', tp);
    perform public.town_save_r(t);
    return json_build_object('ok', true, 'msg', '已幫 ' || t.name || ' 提議外號「' || nick || '」，等他回應');
  end if;

  if op in ('accept','decline') then
    pp := coalesce(pf->'pp', '[]'::jsonb); keep := '[]'::jsonb; nick := null;
    for el in select * from jsonb_array_elements(pp) loop
      if (el->>'f')::bigint = target then nick := el->>'n'; else keep := keep || el; end if;
    end loop;
    if nick is null then return json_build_object('error','這個提議已經過期了'); end if;
    pf := jsonb_set(pf, '{pp}', keep);
    if op = 'accept' then
      pf := jsonb_set(pf, '{by}', coalesce(pf->'by', '{}'::jsonb) || jsonb_build_object(target::text, nick));
      keep := '[]'::jsonb;
      for el in select * from jsonb_array_elements(coalesce(pf->'bo', '[]'::jsonb)) loop
        if (el #>> '{}')::bigint <> target then keep := keep || el; end if;
      end loop;
      keep := keep || to_jsonb(target);
      while jsonb_array_length(keep) > 5 loop
        pf := jsonb_set(pf, '{by}', (pf->'by') - ((keep->>0)));
        keep := keep - 0;
      end loop;
      pf := jsonb_set(pf, '{bo}', keep);
      select * into t from public.town_residents where id = target and town_id = r.town_id;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, case when t.id is null then null else t.id end, 'persona',
        coalesce(t.name, '朋友') || ' 幫 ' || r.name || ' 取了外號「' || nick || '」');
    end if;
    r.items := jsonb_set(r.items, '{pf}', pf);
    perform public.town_save_r(r);
    return json_build_object('ok', true, 'pf', pf);
  end if;

  if op = 'clear' then
    -- 鎮長清除任何人的人設
    if target is not null and target <> r.id then
      if not r.mayor then return json_build_object('error','只有鎮長可以清除別人的人設'); end if;
      select * into t from public.town_residents where id = target and town_id = r.town_id;
      if t.id is null then return json_build_object('error','找不到這位鄰居'); end if;
      t.items := t.items - 'pf';
      perform public.town_save_r(t);
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, t.id, 'mayor', r.name || ' 清除了 ' || t.name || ' 的外號與口頭禪');
      return json_build_object('ok', true);
    end if;
    if note = 'by' then pf := pf - 'by' - 'bo';
    elsif note ~ '^[0-9]+$' then
      pf := jsonb_set(pf, '{by}', coalesce(pf->'by','{}'::jsonb) - note);
      keep := '[]'::jsonb;
      for el in select * from jsonb_array_elements(coalesce(pf->'bo','[]'::jsonb)) loop
        if (el #>> '{}') <> note then keep := keep || el; end if;
      end loop;
      pf := jsonb_set(pf, '{bo}', keep);
    else pf := pf - 'nick' - 'mt'; end if;
    r.items := jsonb_set(r.items, '{pf}', pf);
    perform public.town_save_r(r);
    return json_build_object('ok', true, 'pf', pf);
  end if;
  return json_build_object('error','未知動作');
end $$;
revoke all on function public.town_persona(bigint,text,text,bigint,text) from public;
grant execute on function public.town_persona(bigint,text,text,bigint,text) to anon, authenticated;
