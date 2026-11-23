-- 商品目錄第一批：超市 20 項新商品（食物 6 含季節限定、飲料 4、日用 3、耐用品／耗材 3、收藏 2、禮物 2）＋每日特價輪替
-- 順序：town.sql、town_social.sql（town_save_r）、town_infac.sql（town_need_in_pl）之後；可重複執行；實測 town_catalog1_test.sql（回滾）
-- 加商品只改 town_catalog() 這一個地方（前端不放價格表，從 town_goods list 取）；不改 town_act／town_fac／town_shop，
-- 只就地補 town_tick（雨傘擋大雨）一處。背包存 items.inv = {商品id: 數量}，收藏存 items.cl，缺值 = 空，舊角色免遷移。
-- 經濟：全部是純出口（付的錢 100% 銷毀，不進基金）；沒有任何商品給錢、收藏不能換錢；精力類 >= €6/點；
-- 食物 >= €2/飽足點。特價 8 折，每人每天最多 3 份（超過照原價）。
-- fx 鍵：hu 飽足、en 精力、fun 心情、hy 清潔、bl 膀胱（負＝減少）、cure 清除鼻青臉腫、tf 對方心情、bond 好感；sp 特殊用法 umb 雨傘 game 掌機 cap 扭蛋 card 卡牌
create or replace function public.town_catalog() returns jsonb language sql immutable as $$
select $j$[
 {"id":"onigiri","shop":"market","cat":"food","nm":"飯糰","p":40,"ic":"🍙","bag":"eat","fx":{"hu":18}},
 {"id":"bread","shop":"market","cat":"food","nm":"麵包","p":35,"ic":"🍞","bag":"eat","fx":{"hu":14}},
 {"id":"noodle","shop":"market","cat":"food","nm":"泡麵","p":50,"ic":"🍜","bag":"eat","fx":{"hu":26,"fun":-1}},
 {"id":"bento","shop":"market","cat":"food","nm":"便當","p":90,"ic":"🍱","bag":"eat","fx":{"hu":38,"fun":2}},
 {"id":"fruit","shop":"market","cat":"food","nm":"水果盒","p":80,"ic":"🍎","bag":"eat","fx":{"hu":10,"fun":5}},
 {"id":"mooncake","shop":"market","cat":"food","nm":"月餅（限定）","p":100,"ic":"🍪","bag":"eat","season":"0901-1005","fx":{"hu":16,"fun":8}},
 {"id":"zongzi","shop":"market","cat":"food","nm":"粽子（限定）","p":90,"ic":"🍙","bag":"eat","season":"0501-0630","fx":{"hu":20,"fun":6}},
 {"id":"tangyuan","shop":"market","cat":"food","nm":"湯圓（限定）","p":80,"ic":"🍜","bag":"eat","season":"1201-0228","fx":{"hu":15,"fun":8}},
 {"id":"icebar","shop":"market","cat":"food","nm":"冰品（限定）","p":70,"ic":"🧃","bag":"eat","season":"0701-0831","fx":{"hu":8,"fun":10}},
 {"id":"xmascake","shop":"market","cat":"food","nm":"聖誕蛋糕（限定）","p":120,"ic":"🍪","bag":"eat","season":"1215-1225","fx":{"hu":18,"fun":10}},
 {"id":"cola","shop":"market","cat":"drink","nm":"可樂","p":29,"ic":"🥤","bag":"eat","fx":{"en":3,"fun":2}},
 {"id":"tea","shop":"market","cat":"drink","nm":"茶飲","p":40,"ic":"🧃","bag":"eat","fx":{"en":5,"bl":-5}},
 {"id":"sports","shop":"market","cat":"drink","nm":"運動飲料","p":60,"ic":"🧃","bag":"eat","fx":{"en":9}},
 {"id":"boost","shop":"market","cat":"drink","nm":"提神飲","p":90,"ic":"🥫","bag":"eat","fx":{"en":13,"bl":-10}},
 {"id":"soap","shop":"market","cat":"daily","nm":"沐浴用品","p":80,"ic":"🧴","bag":"tool","fx":{"hy":25}},
 {"id":"wipes","shop":"market","cat":"daily","nm":"濕紙巾","p":30,"ic":"🧻","bag":"tool","fx":{"hy":10}},
 {"id":"firstaid","shop":"market","cat":"daily","nm":"急救包","p":120,"ic":"🩹","bag":"tool","fx":{"cure":1,"fun":3}},
 {"id":"umbrella","shop":"market","cat":"gear","nm":"雨傘","p":300,"ic":"☂️","bag":"tool","sp":"umb","fx":{}},
 {"id":"battery","shop":"market","cat":"gear","nm":"電池","p":60,"ic":"🔋","bag":"tool","sp":"bat","fx":{}},
 {"id":"handheld","shop":"market","cat":"gear","nm":"掌上遊戲機","p":400,"ic":"🎮","bag":"tool","sp":"game","fx":{"fun":14,"en":-2}},
 {"id":"capsule","shop":"market","cat":"col","nm":"扭蛋","p":100,"ic":"🪀","bag":"col","sp":"cap","fx":{"fun":3}},
 {"id":"cardpack","shop":"market","cat":"col","nm":"卡牌包","p":80,"ic":"🃏","bag":"col","sp":"card","fx":{"fun":2}},
 {"id":"mini","shop":"market","cat":"gift","nm":"小禮盒","p":150,"ic":"🎁","bag":"gift","gift":true,"fx":{"tf":10,"bond":2}},
 {"id":"bouquet","shop":"market","cat":"gift","nm":"花束","p":250,"ic":"💐","bag":"gift","gift":true,"fx":{"tf":15,"bond":3}}
]$j$::jsonb
$$;
create or replace function public.town_cat_live(s text, md text) returns boolean language sql immutable as $$
  select s is null or (case when substr(s,1,4) <= substr(s,6,4) then md between substr(s,1,4) and substr(s,6,4) else md >= substr(s,1,4) or md <= substr(s,6,4) end)
$$;
-- 今日特價：從目前有賣的食物／飲料／日用裡，依日期挑 1 項（季節限定、耐用品、收藏、禮物不打折）
create or replace function public.town_cat_sale(shopid text, today text) returns text language sql immutable as $$
  select id from (select c->>'id' as id, row_number() over (order by c->>'id') as rn, count(*) over () as cn
    from jsonb_array_elements(public.town_catalog()) c
    where c->>'shop' = shopid and c->>'cat' in ('food','drink','daily') and c->>'season' is null) q
  where rn = 1 + abs(hashtext(today || shopid)) % cn
$$;
revoke all on function public.town_catalog(), public.town_cat_live(text,text), public.town_cat_sale(text,text) from public, anon, authenticated;

create or replace function public.town_goods(rid bigint, pin text, op text default 'list', item text default null, num int default 1, target bigint default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare
  r public.town_residents; t public.town_residents; c jsonb; fx jsonb; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
  md text := to_char(now() at time zone 'Asia/Taipei','MMDD'); sale text; sg int; n int; i int; unit int; total int := 0; px int; cnt int; mx int;
  inv jsonb; have int; e0 real; msg text := ''; shopid text := coalesce(nullif(item,''), 'market'); cl jsonb; pick text; sp text; k text; nk int; ttl text; bg text;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  inv := coalesce(r.items->'inv', '{}'::jsonb);
  sale := public.town_cat_sale('market', today);
  sg := case when r.items->'sg'->>'d' = today then coalesce((r.items->'sg'->>'n')::int, 0) else 0 end;
  if op = 'list' then
    return json_build_object('today', today, 'sale', sale, 'saleLeft', greatest(0, 3 - sg), 'cat', public.town_catalog(), 'inv', inv, 'cl', coalesce(r.items->'cl','{}'::jsonb),
      'bag', json_build_object('eat', public.town_bag_max(r), 'tool', 10, 'gift', 10, 'col', 30),
      'items', (select coalesce(jsonb_agg(
          cx || jsonb_build_object('p', public.town_px(r.town_id, (cx->>'p')::int), 'p0', (cx->>'p')::int, 'sale', (cx->>'id') = sale,
            'own', coalesce((inv->>(cx->>'id'))::int, 0)) order by ord), '[]'::jsonb)
        from jsonb_array_elements(public.town_catalog()) with ordinality as e(cx, ord)
        where cx->>'shop' = shopid and public.town_cat_live(cx->>'season', md)));
  end if;
  if op not in ('buy','buyuse','use','gift') then return json_build_object('error','未知動作'); end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if public.town_jailed(r) then raise exception '你在牢裡'; end if;
  select cx into c from jsonb_array_elements(public.town_catalog()) cx where cx->>'id' = item limit 1;
  if c is null then
    -- 收藏開箱（use）時 item 就是商品 id；list 才把 item 當店名，其他 op 找不到商品就是錯
    raise exception '沒有這個商品';
  end if;
  fx := c->'fx'; sp := c->>'sp'; bg := c->>'bag'; e0 := r.energy;
  n := greatest(1, least(5, coalesce(num, 1)));

  if op in ('buy','buyuse') then
    if r.place <> coalesce(c->>'shop','market') then raise exception '要在超市才能買'; end if;
    perform public.town_need_in_pl(r, r.place);
    if public.town_is_off(r.town_id, public.town_feature(r.place)) then raise exception '這個小鎮沒有開這個設施'; end if;
    if not public.town_cat_live(c->>'season', md) then raise exception '現在沒有賣這個（季節限定）'; end if;
    if op = 'buyuse' then n := 1; end if;
    px := public.town_px(r.town_id, (c->>'p')::int);
    for i in 1..n loop
      if (c->>'id') = sale and sg < 3 then unit := (px * 80 + 50) / 100; sg := sg + 1; else unit := px; end if;
      total := total + unit;
    end loop;
    if total > r.money then raise exception '錢不夠，要 €%', total; end if;
    select coalesce(sum(vv::int), 0) into cnt from jsonb_each_text(inv) as ee(kk, vv)
      join jsonb_array_elements(public.town_catalog()) cc on cc->>'id' = ee.kk where cc->>'bag' = bg;
    mx := case bg when 'eat' then public.town_bag_max(r) when 'col' then 30 else 10 end;
    if op = 'buy' and cnt + n > mx then raise exception '背包放不下了（這一類最多 %）', mx; end if;
    r.money := r.money - total;
    r.items := jsonb_set(r.items, '{sg}', jsonb_build_object('d', today, 'n', sg));
    if op = 'buy' then
      inv := inv || jsonb_build_object(item, coalesce((inv->>item)::int, 0) + n);
      r.items := jsonb_set(r.items, '{inv}', inv);
      perform public.town_save_r(r);
      return json_build_object('m', -total, 'msg', '買了 ' || n || ' 個' || (c->>'nm') || '，放進背包');
    end if;
    -- buyuse：先放進背包再走下面的使用流程（背包滿也能現場用掉）
    inv := inv || jsonb_build_object(item, coalesce((inv->>item)::int, 0) + 1);
    r.items := jsonb_set(r.items, '{inv}', inv);
    op := 'use';
  end if;

  have := coalesce((inv->>item)::int, 0);
  if have < 1 then raise exception '背包裡沒有%', c->>'nm'; end if;
  if sp = 'umb' then raise exception '雨傘不用手動用，下大雨會自動撐開'; end if;

  if op = 'gift' then
    if not coalesce((c->>'gift')::boolean, false) then raise exception '這個不能送人'; end if;
    if target is null or target = rid then raise exception '要選一位鄰居'; end if;
    select * into t from public.town_residents where id = target and town_id = r.town_id for update;
    if not found then raise exception '找不到這位鄰居'; end if;
    t := public.town_tick(t);
    if t.sleeping or public.town_jailed(t) then raise exception '% 在睡覺或不方便', t.name; end if;
    if t.place is distinct from r.place then raise exception '% 不在這裡', t.name; end if;
    t.fun := t.fun + coalesce((fx->>'tf')::int, 0);
    if coalesce((fx->>'bond')::int, 0) <> 0 then perform public.town_bond(r.town_id, rid, t.id, (fx->>'bond')::int); end if;
    perform public.town_save_r(t);
    r.fun := r.fun + 3;
    msg := '把' || (c->>'nm') || '送給 ' || t.name;
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, t.id, 'joint', r.name || ' ' || msg);
  else
    if sp = 'game' then
      if coalesce((inv->>'battery')::int, 0) < 1 then raise exception '掌上遊戲機要電池，超市有賣'; end if;
      inv := inv || jsonb_build_object('battery', (inv->>'battery')::int - 1);
    end if;
    r.hunger := r.hunger + coalesce((fx->>'hu')::int, 0); r.energy := r.energy + coalesce((fx->>'en')::int, 0);
    r.fun := r.fun + coalesce((fx->>'fun')::int, 0); r.hygiene := r.hygiene + coalesce((fx->>'hy')::int, 0);
    r.bladder := r.bladder + coalesce((fx->>'bl')::int, 0);
    if coalesce((fx->>'cure')::int, 0) = 1 then r.bruised_until := null; end if;
    msg := case when sp = 'game' then '玩了一會掌上遊戲機' when sp in ('cap','card') then '拆開' || (c->>'nm') else '使用了' || (c->>'nm') end;
    if sp in ('cap','card') then
      cl := coalesce(r.items->'cl', '{}'::jsonb);
      nk := case sp when 'cap' then 24 else 20 end;
      pick := case sp when 'cap' then 'c' else 'k' end || lpad((1 + floor(random() * nk))::int::text, 2, '0');
      cl := cl || jsonb_build_object(pick, coalesce((cl->>pick)::int, 0) + 1);
      r.items := jsonb_set(r.items, '{cl}', cl);
      msg := msg || '，得到「' || pick || '」' || case when (cl->>pick)::int > 1 then '（重複）' else '（新）' end;
      select count(*) into k from jsonb_object_keys(cl) as ks(kk) where left(kk, 1) = left(pick, 1);
      ttl := case when sp = 'cap' then '扭蛋大師' else '卡牌大師' end;
      if k::int >= nk and not (coalesce(r.items->'titles', '[]'::jsonb) ? ttl) then
        r.items := jsonb_set(r.items, '{titles}', coalesce(r.items->'titles', '[]'::jsonb) || to_jsonb(ttl));
        msg := msg || '，集滿了！得到稱號「' || ttl || '」';
      end if;
    end if;
  end if;
  inv := inv || jsonb_build_object(item, have - 1);
  r.items := jsonb_set(r.items, '{inv}', inv);
  r := public.town_ecap(r, e0, op);
  perform public.town_save_r(r);
  return json_build_object('m', -total, 'msg', msg);
end $$;
revoke all on function public.town_goods(bigint,text,text,text,int,bigint) from public;
grant execute on function public.town_goods(bigint,text,text,text,int,bigint) to anon, authenticated;

-- 就地補 town_tick：有雨傘時大雨不淋濕、耐久 −1（用 8 次壞掉）
create or replace function public.town_catalog1_patch(fn text, nargs int, old text, new text, chk text) returns void language plpgsql as $$
declare def text;
begin
  select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = fn and p.pronargs = nargs limit 1;
  if def is null then raise exception '找不到函式 %', fn; end if;
  if position(chk in def) > 0 then return; end if;
  if position(old in def) = 0 then raise exception '% 找不到要改的文字：%，請人工處理', fn, old; end if;
  execute replace(def, old, new);
end $$;
select public.town_catalog1_patch('town_tick', 1,
  'elsif bk = 3 then r.hygiene := r.hygiene - 10;',
  E'elsif bk = 3 and coalesce((r.items->''inv''->>''umbrella'')::int, 0) > 0 then\n      r.items := jsonb_set(r.items, ''{um}'', to_jsonb(coalesce((r.items->>''um'')::int, 8) - 1));\n      if (r.items->>''um'')::int <= 0 then r.items := jsonb_set(r.items, ''{inv}'', (r.items->''inv'') || jsonb_build_object(''umbrella'', (r.items->''inv''->>''umbrella'')::int - 1)); r.items := r.items - ''um''; end if;\n      bn := '' 下大雨，撐開雨傘沒淋濕 ☂️'';\n    elsif bk = 3 then r.hygiene := r.hygiene - 10;',
  'umbrella');
