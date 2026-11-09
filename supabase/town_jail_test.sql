-- 監獄與砍人實測：接在 town.sql、town_social.sql、town_jail.sql 之後執行，結果在錯誤訊息 REPORT，整段 rollback
do $$
declare cr json; ra bigint; rb bigint; rc bigint; rep text := ''; tid text; j json; r public.town_residents; v public.town_residents; c public.town_residents; i int; caught int := 0; falls int := 0;
  today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); ok int := 0; mins int; bal int; x1 numeric; x2 numeric;
begin
  cr := public.town_create('ZZJL','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  rb := ((public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'))->>'resident_id')::bigint;
  rc := ((public.town_join(tid, (select invite from public.town_towns where id = tid), '丙','1234'))->>'resident_id')::bigint;
  update public.town_residents set money = 5000, energy = 80, hunger = 80, fun = 80, bladder = 80, hygiene = 80, sleeping = false, seen_at = now(), updated_at = now(), place = 'street', x = 10, y = 10, items = items - 'cd' - 'jl' - 'sl' - 'faint' - 'hosp' where id in (ra, rb, rc);

  -- 沒有過節不能砍
  begin perform public.town_jail(ra,'1234','slash',null,rb); rep := rep||'no feud NOT BLOCKED'||E'\n'; exception when others then rep := rep||'no feud: '||sqlerrm||E'\n'; end;
  -- 設成有仇
  insert into public.town_bonds(town_id,a,b,score) values (tid, least(ra,rb), greatest(ra,rb), -10) on conflict (a,b) do update set score = -10, dday = null, dpos = 0, dneg = 0;
  -- 不在同一個地方 / 太遠
  update public.town_residents set x = 30, y = 10 where id = rb;
  begin perform public.town_jail(ra,'1234','slash',null,rb); rep := rep||'far NOT BLOCKED'||E'\n'; exception when others then rep := rep||'far: '||sqlerrm||E'\n'; end;
  update public.town_residents set x = 11, y = 10 where id = rb;
  update public.town_residents set place = 'cafe' where id = ra;
  begin perform public.town_jail(ra,'1234','slash',null,rb); rep := rep||'not on street NOT BLOCKED'||E'\n'; exception when others then rep := rep||'not on street: '||sqlerrm||E'\n'; end;
  update public.town_residents set place = 'street' where id = ra;

  -- 一刀：victim 80 → 45、心情 −20；attacker 80 → 70；好感 −6
  j := public.town_jail(ra,'1234','slash',null,rb);
  select * into r from public.town_residents where id = ra; select * into v from public.town_residents where id = rb;
  rep := rep||'slash: '||j::text||E'\n  attacker energy '||r.energy||' (期望 70) fun '||r.fun||' (期望 72) | victim energy '||v.energy||' (期望 45) fun '||v.fun||' (期望 60) faint '||coalesce(v.items->>'faint','無')||' bond '||public.town_bond_get(ra,rb)||' (期望 -16)'||E'\n';
  rep := rep||'  attacker place '||r.place||' jl '||coalesce(r.items->>'jl','無')||E'\n';
  begin perform public.town_jail(ra,'1234','slash',null,rb); rep := rep||'cooldown NOT BLOCKED'||E'\n'; exception when others then rep := rep||'cooldown: '||sqlerrm||E'\n'; end;

  -- 被抓機率（普通約 45%）與倒地機率（約 80%）。每次重設：不要冷卻、不要刑期、人回街上
  for i in 1..200 loop
    update public.town_residents set place='street', x=10, y=10, energy=80, items = items - 'cd' - 'jl' - 'sl' - 'faint' - 'hosp', sleeping=false, money=5000 where id = ra;
    update public.town_residents set place='street', x=11, y=10, energy=80, items = items - 'cd' - 'jl' - 'sl' - 'faint' - 'hosp', sleeping=false where id = rb;
    update public.town_bonds set score = -10, dday = null, dpos = 0, dneg = 0 where a = least(ra,rb) and b = greatest(ra,rb);
    j := public.town_jail(ra,'1234','slash',null,rb);
    if (j->>'caught')::boolean then caught := caught + 1; end if;
  end loop;
  rep := rep||'普通砍 200 次被抓 '||caught||' 次（半夜 ×0.5，白天期望 ~90）'||E'\n';
  caught := 0;
  for i in 1..200 loop
    update public.town_residents set place='street', x=10, y=10, energy=80, items = items - 'cd' - 'jl' - 'sl' - 'faint' - 'hosp', sleeping=false, money=5000 where id = ra;
    update public.town_residents set place='street', x=11, y=10, energy=30, items = items - 'cd' - 'jl' - 'sl' - 'faint' - 'hosp', sleeping=false where id = rb;
    update public.town_bonds set score = -10, dday = null, dpos = 0, dneg = 0 where a = least(ra,rb) and b = greatest(ra,rb);
    j := public.town_jail(ra,'1234','slash',null,rb);
    if (j->>'fall')::boolean then falls := falls + 1; end if;
    if (j->>'caught')::boolean then caught := caught + 1; end if;
    select * into r from public.town_residents where id = ra; select * into v from public.town_residents where id = rb;
    if i = 1 then rep := rep||'倒地一例: '||j::text||' 付醫藥費後 money '||r.money||' (期望 3500) | 受害者 faint '||coalesce(v.items->>'faint','無')||' hosp '||coalesce(v.items->>'hosp','無')||' sleeping '||v.sleeping||' energy '||v.energy||E'\n'; end if;
    if caught > 0 and i = 200 then null; end if;
  end loop;
  rep := rep||'倒地 200 次：倒地 '||falls||'（期望 200）、被抓 '||caught||'（白天期望 ~160）'||E'\n';
  -- 被抓的人刑期必須 ≥ 2 小時（倒地）
  select * into r from public.town_residents where id = ra;
  if r.items->>'jl' is not null then mins := ceil(extract(epoch from ((r.items->>'jl')::timestamptz - now())) / 60)::int; rep := rep||'最後一次刑期剩 '||mins||' 分鐘（倒地至少 120，最多 180），place '||r.place||' x,y '||r.x||','||r.y||E'\n'; end if;

  -- 錢不夠付醫藥費：付到 0、不欠款
  update public.town_residents set place='street', x=10, y=10, energy=80, items = items - 'cd' - 'jl' - 'sl' - 'faint' - 'hosp' - 'db', sleeping=false, money=700 where id = ra;
  update public.town_residents set place='street', x=11, y=10, energy=30, items = items - 'cd' - 'jl' - 'sl' - 'faint' - 'hosp', sleeping=false where id = rb;
  update public.town_bonds set score = -10, dday = null, dpos = 0, dneg = 0 where a = least(ra,rb) and b = greatest(ra,rb);
  j := public.town_jail(ra,'1234','slash',null,rb); select * into r from public.town_residents where id = ra;
  rep := rep||'錢只有 700：'||j::text||' money '||r.money||' (期望 0) db '||coalesce(r.items->>'db','無')||E'\n';

  -- 一天被砍最多 2 次
  update public.town_residents set place='street', x=10, y=10, energy=80, items = items - 'cd' - 'jl' - 'faint' - 'hosp', sleeping=false, money=5000 where id = ra;
  update public.town_residents set place='street', x=11, y=10, energy=100, items = (items - 'cd' - 'jl' - 'faint' - 'hosp') || jsonb_build_object('sl', jsonb_build_object('d', today, 'n', 2)), sleeping=false where id = rb;
  update public.town_bonds set score = -10, dday = null, dpos = 0, dneg = 0 where a = least(ra,rb) and b = greatest(ra,rb);
  begin perform public.town_jail(ra,'1234','slash',null,rb); rep := rep||'daily cap NOT BLOCKED'||E'\n'; exception when others then rep := rep||'daily cap: '||sqlerrm||E'\n'; end;

  -- 入獄中：不能移動、不能做 town_act；離線也不會被送回家睡
  update public.town_residents set place = 'jail', x = 61, y = 5, money = 5000, energy = 80, sleeping = false, seen_at = now(),
    items = (items - 'cd' - 'sl') || jsonb_build_object('jl', (now() + interval '2 hours')::text) where id = ra;
  begin perform public.town_act(ra,'1234','move',null,10,10,'street'); rep := rep||'jailed move NOT BLOCKED'||E'\n'; exception when others then rep := rep||'jailed move: '||sqlerrm||E'\n'; end;
  begin perform public.town_act(ra,'1234','work'); rep := rep||'jailed work NOT BLOCKED'||E'\n'; exception when others then rep := rep||'jailed work: '||sqlerrm||E'\n'; end;
  -- 勞動：+120、精力 −20、刑期 −10 分鐘、冷卻
  j := public.town_jail(ra,'1234','labor'); select * into r from public.town_residents where id = ra;
  rep := rep||'labor: '||j::text||' money '||r.money||' (期望 5120) energy '||r.energy||' (期望 60) 剩 '||ceil(extract(epoch from ((r.items->>'jl')::timestamptz - now())) / 60)::int||' 分鐘 (期望 110)'||E'\n';
  begin perform public.town_jail(ra,'1234','labor'); rep := rep||'labor cd NOT BLOCKED'||E'\n'; exception when others then rep := rep||'labor cd: '||sqlerrm||E'\n'; end;
  begin perform public.town_jail(rb,'1234','labor'); rep := rep||'free person labor NOT BLOCKED'||E'\n'; exception when others then rep := rep||'free person labor: '||sqlerrm||E'\n'; end;
  -- 探監
  update public.town_residents set place = 'jail', x = 61, y = 5, fun = 40, energy = 80 where id = rc;
  j := public.town_jail(rc,'1234','visit',null,ra); select * into r from public.town_residents where id = ra; select * into c from public.town_residents where id = rc;
  rep := rep||'visit: '||j::text||' 受刑人 fun '||r.fun||' | 探監者 fun '||c.fun||' (期望 43) energy '||c.energy||' (期望 78) bond '||public.town_bond_get(ra,rc)||E'\n';
  begin perform public.town_jail(rc,'1234','visit',null,ra); rep := rep||'visit cd NOT BLOCKED'||E'\n'; exception when others then rep := rep||'visit cd: '||sqlerrm||E'\n'; end;
  begin perform public.town_jail(rc,'1234','visit',null,rb); rep := rep||'visit free NOT BLOCKED'||E'\n'; exception when others then rep := rep||'visit free: '||sqlerrm||E'\n'; end;
  -- 保釋：朋友替他保（錢不夠不行、夠了成功；不欠款）
  select * into r from public.town_residents where id = ra; mins := ceil(extract(epoch from ((r.items->>'jl')::timestamptz - now())) / 60)::int;
  update public.town_residents set money = 100 where id = rc;
  begin perform public.town_jail(rc,'1234','bail',null,ra); rep := rep||'bail poor NOT BLOCKED'||E'\n'; exception when others then rep := rep||'bail poor: '||sqlerrm||E'\n'; end;
  update public.town_residents set money = 5000 where id = rc;
  j := public.town_jail(rc,'1234','bail',null,ra); select * into c from public.town_residents where id = rc; select * into r from public.town_residents where id = ra;
  rep := rep||'bail by friend: '||j::text||' (剩約 '||mins||' 分鐘，期望 max(300,×10)) 保釋者 money '||c.money||' 受刑人 jl '||coalesce(r.items->>'jl','已清除')||E'\n';
  -- 自己保釋、錢不夠不行
  update public.town_residents set place='jail', money = 5000, items = items || jsonb_build_object('jl', (now() + interval '3 hours')::text) where id = ra;
  update public.town_residents set money = 1000 where id = ra;
  begin perform public.town_jail(ra,'1234','bail'); rep := rep||'self bail poor NOT BLOCKED'||E'\n'; exception when others then rep := rep||'self bail poor (需 1800): '||sqlerrm||E'\n'; end;
  update public.town_residents set money = 2500 where id = ra;
  j := public.town_jail(ra,'1234','bail'); select * into r from public.town_residents where id = ra; rep := rep||'self bail: '||j::text||' money '||r.money||' jl '||coalesce(r.items->>'jl','已清除')||E'\n';
  -- 離線很久也不被送回家：關 3 小時，離線 2 小時
  update public.town_residents set place='jail', x=61, y=5, sleeping=false, seen_at = now() - interval '2 hours', updated_at = now() - interval '2 hours',
    items = items || jsonb_build_object('jl', (now() + interval '1 hour')::text) where id = ra;
  perform public.town_state(tid); select * into r from public.town_residents where id = ra;
  rep := rep||'離線 2 小時後 place='||r.place||' (期望 jail) sleeping='||r.sleeping||' jl '||coalesce(r.items->>'jl','無')||E'\n';
  -- 刑滿：town_state 會清掉 jl、寫出獄；人還在監獄門口，之後離線才會被送回家
  update public.town_residents set items = items || jsonb_build_object('jl', (now() - interval '1 minute')::text), seen_at = now(), updated_at = now() - interval '5 minutes' where id = ra;
  perform public.town_state(tid); select * into r from public.town_residents where id = ra;
  rep := rep||'刑滿後 jl='||coalesce(r.items->>'jl','已清除')||' place='||r.place||' | 出獄事件 '||(select count(*) from public.town_events where town_id = tid and kind = 'jail' and msg like '%出獄%')||E'\n';
  begin j := public.town_act(ra,'1234','move',null,10,10,'street'); rep := rep||'刑滿後可以走 ok'||E'\n'; exception when others then rep := rep||'刑滿後 move: '||sqlerrm||E'\n'; end;
  -- 鎮長關掉監獄：不能砍人、被關的人不再被擋
  update public.town_towns set off = array['jail'] where id = tid;
  update public.town_residents set items = items || jsonb_build_object('jl', (now() + interval '1 hour')::text), place = 'street' where id = ra;
  begin perform public.town_jail(ra,'1234','slash',null,rb); rep := rep||'jail off slash NOT BLOCKED'||E'\n'; exception when others then rep := rep||'jail off slash: '||sqlerrm||E'\n'; end;
  begin perform public.town_act(ra,'1234','move',null,10,12,'street'); rep := rep||'jail off: 被關的人可以走 ok'||E'\n'; exception when others then rep := rep||'jail off move: '||sqlerrm||E'\n'; end;
  -- 舊角色（完全沒有 jl/sl 欄位）
  update public.town_towns set off = '{}' where id = tid;
  update public.town_residents set items = items - 'jl' - 'sl' - 'cd', place = 'street', x = 10, y = 10 where id in (ra, rb);
  rep := rep||'old char jailed? '||public.town_jailed((select r2 from public.town_residents r2 where id = ra))||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;
