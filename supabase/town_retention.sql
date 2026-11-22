-- 小豬鎮留存機制（2026-11-22 已套用到正式站；這個檔把當天的線上變更寫回 repo，可重複執行）
--   1. 連續上線日曆：第 3／7／14／21／30／60／100 天給零食、限定造型、稱號；每週一次保護盾（漏一天不斷線）
--   2. 新人保護：登入未滿 7 天的居民，每天被同一人打架／丟蛋／惡作劇最多 2 次、全部人最多 4 次
--   3. 每日收成：登入時自動領（信箱＝零食、花圃＝€150、小豬雕像＝€500），隔天沒上線補領最多 3 天份
--   4. 午間市集（12～14 點）與夜市（21～23 點）：打工薪水 +10%，開張時小鎮動態公告一次
--   5. 登入隨機事件：每天 30%，好壞各半（壞事只發生在現金 > 10000，窮人只會遇到好事）
-- 取代 town.sql 裡這幾個函式的舊版：town_login、town_al_touch、town_rent、town_wd_pct
-- 需要 town_push.sql 的 Edge Function（連續上線快斷了、市集開張的推播）重新部署，見 supabase/functions/town-push
-- 前端沒有對應畫面：獎勵與公告都走既有的小鎮動態（events）；午間薪水 +10% 前端算薪水的地方沒有顯示

create table if not exists public.town_push_log (rid bigint not null, day text not null, kind text not null, primary key (rid, day, kind));
alter table public.town_push_log enable row level security;
create table if not exists public.town_happy (town_id text not null, win text not null, primary key (town_id, win));
alter table public.town_happy enable row level security;
create index if not exists town_events_target_at_idx on public.town_events (target, at desc);

-- 午間市集／夜市公告：每個小鎮每個時段只公告一次（town_login 呼叫）
create or replace function public.town_happy_touch(tid text) returns void
 language plpgsql security definer set search_path = public
as $$
declare h int := extract(hour from (now() at time zone 'Asia/Taipei'))::int;
  d text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); w text; m text;
begin
  if h in (12,13) then w := d || '-noon'; m := '🌞 午間市集開張！12:00～14:00 打工薪水 +10%';
  elsif h in (21,22) then w := d || '-night'; m := '🌙 夜市開張！21:00～23:00 打工薪水 +10%';
  else return; end if;
  insert into public.town_happy(town_id, win) values (tid, w) on conflict do nothing;
  if found then
    insert into public.town_events(town_id, actor, target, kind, msg) values (tid, null, null, 'world', m);
  end if;
  delete from public.town_happy where win < to_char((now() at time zone 'Asia/Taipei') - interval '3 days','YYYY-MM-DD');
end $$;
revoke all on function public.town_happy_touch(text) from public, anon, authenticated;

-- 打工薪水：世界事件倍率 × 市集時段 +10%
create or replace function public.town_wd_pct(tid text) returns integer
 language sql stable security definer set search_path = public
as $$
  select (coalesce((select case w.k when 'boom' then 115 when 'bust' then 90 when 'blackout' then 95 when 'festival' then 105 else 100 end
    from public.town_worlds w where w.town_id = tid and w.until > now()), 100)
    * case when extract(hour from (now() at time zone 'Asia/Taipei'))::int in (12,13,21,22) then 110 else 100 end / 100)::int
$$;
revoke all on function public.town_wd_pct(text) from public, anon, authenticated;

-- 每日第一次登入或動作：登入小禮、連續上線獎勵、保護盾、每日收成
create or replace function public.town_al_touch(r public.town_residents) returns public.town_residents
 language plpgsql
as $$
declare day text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); al jsonb := coalesce(r.items->'al','{}'::jsonb); prev text := al->>'d';
  n int; s int; o int; v int; g int; ts text[] := array['','熟面孔','老鄰居','鎮上名人','小鎮元老'];
  gap int; wk text := to_char(now() at time zone 'Asia/Taipei','IYYY-IW'); sw text := coalesce(al->>'sw',''); bs int; shielded boolean := false;
  gid text; ttl text; gname text; mult int;
begin
  if coalesce(prev,'') = day then return r; end if;
  n := coalesce((al->>'n')::int,0); o := public.town_lv_of(n); n := n + 1; v := public.town_lv_of(n);
  gap := case when prev is null then 1 else greatest(1, day::date - prev::date) end;
  if prev is not null and gap = 1 then s := coalesce((al->>'s')::int,0) + 1;
  elsif prev is not null and gap = 2 and sw <> wk and coalesce((al->>'s')::int,0) >= 2 then s := coalesce((al->>'s')::int,0) + 1; sw := wk; shielded := true;
  else s := 1; end if;
  bs := greatest(coalesce((al->>'bs')::int,0), s);
  r.items := jsonb_set(r.items, '{al}', jsonb_build_object('n', n, 'd', day, 's', s, 'lv', v, 'sw', sw, 'bs', bs));
  g := (array[0,30,60,100,150])[v];
  if g > 0 then
    r.money := r.money + g;
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'luck', r.name || ' 今天上線，領到每日登入小禮 €' || g);
  end if;
  if v > o then
    r.items := jsonb_set(r.items, '{titles}', coalesce(r.items->'titles','[]'::jsonb) || to_jsonb(ts[v]));
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'level', r.name || ' 升到 Lv' || v || '「' || ts[v] || '」');
  end if;
  if shielded then
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'luck', r.name || ' 昨天沒上線，保護盾替他保住了連續 ' || s || ' 天 🛡️（每週一次）');
  end if;
  gid := case s when 7 then 'scarf' when 14 then 'headphones' when 21 then 'mohawk' when 30 then 'crown' when 60 then 'suit' else null end;
  ttl := case s when 3 then '三日常客' when 7 then '一週不缺席' when 14 then '兩週老朋友' when 30 then '滿月居民' when 60 then '兩個月不缺席' when 100 then '百日小豬' else null end;
  if s = 3 then
    r.items := jsonb_set(r.items, '{snack}', to_jsonb(coalesce((r.items->>'snack')::int,0) + 1));
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'luck', r.name || ' 連續上線 3 天，領到零食一包 🍪');
  end if;
  if gid is not null then
    select name into gname from public.town_shop where id = gid;
    if coalesce(r.items->'w','[]'::jsonb) ? gid then
      r.items := jsonb_set(r.items, '{snack}', to_jsonb(coalesce((r.items->>'snack')::int,0) + 3));
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'luck', r.name || ' 連續上線 ' || s || ' 天，造型「' || coalesce(gname,gid) || '」已經有了，改領零食 3 包 🍪');
    else
      r.items := jsonb_set(r.items, '{w}', coalesce(r.items->'w','[]'::jsonb) || to_jsonb(gid));
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'luck', r.name || ' 連續上線 ' || s || ' 天，獲得限定造型「' || coalesce(gname,gid) || '」🎁');
    end if;
  end if;
  if s = 100 then
    if coalesce(r.items->'d','[]'::jsonb) ? 'pigstatue' then
      r.items := jsonb_set(r.items, '{snack}', to_jsonb(coalesce((r.items->>'snack')::int,0) + 3));
    else
      r.items := jsonb_set(r.items, '{d}', coalesce(r.items->'d','[]'::jsonb) || to_jsonb('pigstatue'::text));
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'luck', r.name || ' 連續上線 100 天，獲得小豬雕像 🐷');
    end if;
  end if;
  if ttl is not null and not (coalesce(r.items->'titles','[]'::jsonb) ? ttl) then
    r.items := jsonb_set(r.items, '{titles}', coalesce(r.items->'titles','[]'::jsonb) || to_jsonb(ttl));
  end if;
  mult := least(3, gap);
  if coalesce(r.items->'d','[]'::jsonb) ? 'mailbox' then
    r.items := jsonb_set(r.items, '{snack}', to_jsonb(coalesce((r.items->>'snack')::int,0) + mult));
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'luck', r.name || (array['的信箱裡有鄰居塞的點心','的信箱收到郵差送來的小包裹','的信箱裡躺著一張明信片和點心'])[1 + floor(random()*3)::int] || '，收到零食 ' || mult || ' 包 📮');
  end if;
  if coalesce(r.items->'d','[]'::jsonb) ? 'flowers' then
    r.money := r.money + 150 * mult;
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'luck', r.name || ' 的花圃開花了，賣花賺了 €' || (150 * mult) || ' 🌸');
  end if;
  if coalesce(r.items->'d','[]'::jsonb) ? 'pigstatue' then
    r.money := r.money + 500 * mult;
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'luck', r.name || ' 的小豬雕像顯靈，撿到 €' || (500 * mult) || ' 🐷');
  end if;
  return r;
end $$;

-- 每日生活費、補助、登入隨機事件（好壞各半）、房租、財產稅
create or replace function public.town_rent(r public.town_residents) returns public.town_residents
 language plpgsql
as $$
declare day text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); a int; p int; tx int := 0;
begin
  if coalesce(r.items->>'rent','') = day then return r; end if;
  -- 政府生活補助：每個台灣日第一次登入或動作，現金 < 10000 才發 €600（先發再扣房租；有錢人不領）
  if r.money < 10000 then
    r.money := r.money + 600;
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'luck', r.name || ' 領到政府今天的生活補助 €600');
  end if;
  -- 登入隨機事件：每天 30% 機率，好壞各半（壞事只發生在現金 > 10000 時，窮人不扣）
  if random() < .3 then
    if random() < .5 then
      tx := case when r.money > 10000 then least(6000, floor(r.money * (.03 + random() * .05))::int) else 100 + floor(random() * 301)::int end;
      r.money := r.money + tx;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'luck', r.name || (array['路上撿到錢，賺了','發票中獎了，領了','阿嬤偷偷塞了紅包，收到','朋友終於還錢了，收到','賣掉用不到的舊東西，賺了'])[1 + floor(random() * 5)::int] || ' €' || tx);
    elsif r.money > 10000 then
      tx := least(6000, floor(r.money * (.03 + random() * .05))::int);
      r.money := r.money - tx;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'luck', r.name || (array['家裡水管漏水，修理花了','收到一張意外的帳單','被朋友騙去買東西，花了','錢包掉了，不見了','家電壞了，換新花了'])[1 + floor(random() * 5)::int] || ' €' || tx);
    end if;
    tx := 0;
  end if;
  a := public.town_rent_amt(coalesce((r.items->>'hl')::int,1)); a := a - a * public.town_rent_pct(r) / 100; p := least(a, greatest(0, r.money));
  r.money := r.money - p; r.items := jsonb_set(r.items, '{rent}', to_jsonb(day));
  perform public.town_fund_add(r.town_id, 'rent', p * 5 / 100);
  -- 財產稅：階梯制（town_tax）
  tx := public.town_tax(r.money);
  if tx > 0 then
    r.money := r.money - tx; r.items := jsonb_set(r.items, '{tx}', jsonb_build_object('d', day, 'a', tx));
    perform public.town_fund_add(r.town_id, 'tax', tx);
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'rent', r.name || ' 繳了財產稅 €' || tx || '（存款超過 100000 的部分 0.5%）');
  end if;
  insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'rent', r.name || ' 繳了今天的房租水電 €' || p || case when p < a then '（錢不夠，只扣到 0）' else '' end);
  return r;
end $$;

-- 登入：每日生活費只動錢和 items.rent／al／titles，另外保存連續上線獎勵（w 造型、d 裝飾、snack 零食）
create or replace function public.town_login(rid bigint, pin text, new_look jsonb default null) returns json
 language plpgsql security definer set search_path = public
as $$
declare r public.town_residents;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if new_look is not null and pg_column_size(new_look) < 800 then
    -- 特別款要買過或達成條件
    if exists (select 1 from public.town_shop w where w.kind = 'wear' and w.id in (new_look->>'style', new_look->>'top', new_look->>'acc')
       and not (coalesce(r.items->'w','[]'::jsonb) ? w.id)
       and not (w.unlock = 'bandage' and (select count(*) from public.town_events e where e.target = rid and e.kind = 'fight') >= 10)
       and not (w.unlock = 'couple' and exists (select 1 from public.town_bonds b where (b.a = rid or b.b = rid) and b.score >= 30))) then
      raise exception '這個造型還沒買或還沒解鎖';
    end if;
    if r.look is distinct from new_look and r.look <> '{}'::jsonb and not exists (select 1 from public.town_events e where e.actor = rid and e.kind = 'look' and e.at > now() - interval '1 hour') then
      insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'look', r.name || ' 換了新造型 ✨');
    end if;
    update public.town_residents set look = new_look where id = rid;
  end if;
  update public.town_residents set seen_at = now() where id = rid;
  -- 午間市集／夜市公告（每個小鎮每個時段只公告一次）
  perform public.town_happy_touch(r.town_id);
  if coalesce(r.items->>'rent','') <> to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD') or coalesce(r.items->'al'->>'d','') <> to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD') then
    r := public.town_al_touch(r); r := public.town_rent(r);
    update public.town_residents set money = greatest(0, r.money),
      items = (jsonb_set(jsonb_set(jsonb_set(items, '{rent}', r.items->'rent'), '{al}', r.items->'al'), '{titles}', coalesce(r.items->'titles','[]'::jsonb)))
              || jsonb_strip_nulls(jsonb_build_object('w', r.items->'w', 'd', r.items->'d', 'snack', r.items->'snack'))
    where id = rid;
  end if;
  return json_build_object('ok',true,'town_id',r.town_id,'last_seen',r.seen_at);
end $$;
grant execute on function public.town_login(bigint, text, jsonb) to anon, authenticated;

-- 新人保護：登入未滿 7 天的居民，每天同一人最多 2 次、全部人最多 4 次的打架／丟蛋／惡作劇；超過就整個動作回滾
create or replace function public.town_newcomer_guard() returns trigger
 language plpgsql security definer set search_path = public
as $$
declare nn int; c_all int; c_by int;
begin
  if new.kind not in ('fight','egg','prank','mischief') or new.target is null or new.actor is null or new.actor = new.target then return new; end if;
  select coalesce((items->'al'->>'n')::int, 0) into nn from public.town_residents where id = new.target;
  if not found or nn >= 7 then return new; end if;
  select count(*), count(*) filter (where actor = new.actor) into c_all, c_by
    from public.town_events
    where target = new.target and kind in ('fight','egg','prank','mischief')
      and at >= (date_trunc('day', now() at time zone 'Asia/Taipei') at time zone 'Asia/Taipei');
  if c_by >= 2 then raise exception '對方是剛來的新居民，今天你已經找過他 2 次了，讓他喘口氣吧'; end if;
  if c_all >= 4 then raise exception '對方是剛來的新居民，今天已經被很多人找過了，明天再來吧'; end if;
  return new;
end $$;
revoke all on function public.town_newcomer_guard() from public, anon, authenticated;
create or replace trigger town_newcomer_guard before insert on public.town_events for each row execute function public.town_newcomer_guard();
