-- 牢裡情境實測（獄友事件、前科、越獄、假釋、放風、通緝）：接在 town.sql、town_social.sql、town_fi.sql、town_jail.sql 之後執行，
-- 結果在錯誤訊息 REPORT，整段 rollback（不留測試資料）。每個段落都會先重設狀態，期望值寫在括號裡。
do $$
declare cr json; ra bigint; rb bigint; rc bigint; rep text := ''; tid text; j json; r public.town_residents; v public.town_residents; i int; n1 int; n2 int; n3 int; k int; o int; mins int; m0 int; tot int; ev json;
  jl0 timestamptz;
begin
  cr := public.town_create('ZZJ2','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  rb := ((public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'))->>'resident_id')::bigint;
  rc := ((public.town_join(tid, (select invite from public.town_towns where id = tid), '丙','1234'))->>'resident_id')::bigint;
  update public.town_residents set money = 5000, energy = 80, hunger = 80, fun = 80, bladder = 80, hygiene = 80, sleeping = false, seen_at = now(), updated_at = now(), place = 'street', x = 10, y = 10 where town_id = tid;

  -- ① 小幫手：前科 −8%／機率 ×1.5、通緝 ×2.5、假釋
  select * into r from public.town_residents where id = ra;
  rep := rep||'① 沒有前科 pct '||public.town_pr_pct(r)||' (100) mult '||public.town_pr_mult(r)||' (1)'||E'\n';
  r.items := jsonb_set(r.items, '{pr}', jsonb_build_object('u', (now() + interval '1 hour')::text, 'n', 1));
  rep := rep||'  有前科 pct '||public.town_pr_pct(r)||' (92) mult '||public.town_pr_mult(r)||' (1.5)'||E'\n';
  r.items := jsonb_set(r.items, '{pr}', jsonb_build_object('u', (now() - interval '1 hour')::text, 'n', 1));
  rep := rep||'  前科過期 pct '||public.town_pr_pct(r)||' (100) mult '||public.town_pr_mult(r)||' (1)'||E'\n';
  r.items := jsonb_set(r.items, '{wt}', to_jsonb((now() + interval '1 hour')::text));
  rep := rep||'  通緝中 mult '||public.town_pr_mult(r)||' (2.5) wanted '||public.town_wanted(r)||' (true)'||E'\n';
  r.items := jsonb_set(r.items, '{pl}', to_jsonb((now() + interval '1 hour')::text));
  rep := rep||'  假釋中 paroled '||public.town_paroled(r)||' (true)'||E'\n';
  r := public.town_prior_set(r, now(), true);
  rep := rep||'  prior_set inc → n '||(r.items->'pr'->>'n')||' (2) u 約 24 小時後 '||round(extract(epoch from ((r.items->'pr'->>'u')::timestamptz - now())) / 3600)||' (24)'||E'\n';

  -- ② 砍人被抓：有前科機率 ×1.5（白天 45% → 67.5%）、記前科與服刑紀錄 jp
  insert into public.town_bonds(town_id,a,b,score) values (tid, least(ra,rb), greatest(ra,rb), -10) on conflict (a,b) do update set score = -10, dday = null, dpos = 0, dneg = 0;
  n1 := 0; n2 := 0;
  for i in 1..200 loop
    update public.town_residents set place='street', x=10, y=10, energy=80, sleeping=false, money=5000, items = (items - 'cd' - 'jl' - 'jp' - 'pr' - 'pl' - 'wt') where id = ra;
    update public.town_residents set place='street', x=11, y=10, energy=100, sleeping=false, items = items - 'cd' - 'jl' - 'sl' - 'faint' - 'hosp' where id = rb;
    update public.town_bonds set score = -10, dday = null, dpos = 0, dneg = 0 where a = least(ra,rb) and b = greatest(ra,rb);
    j := public.town_jail(ra,'1234','slash',null,rb); if (j->>'caught')::boolean then n1 := n1 + 1; end if;
  end loop;
  for i in 1..200 loop
    update public.town_residents set place='street', x=10, y=10, energy=80, sleeping=false, money=5000, items = (items - 'cd' - 'jl' - 'jp' - 'pl' - 'wt') || jsonb_build_object('pr', jsonb_build_object('u', (now() + interval '2 hours')::text, 'n', 1)) where id = ra;
    update public.town_residents set place='street', x=11, y=10, energy=100, sleeping=false, items = items - 'cd' - 'jl' - 'sl' - 'faint' - 'hosp' where id = rb;
    update public.town_bonds set score = -10, dday = null, dpos = 0, dneg = 0 where a = least(ra,rb) and b = greatest(ra,rb);
    j := public.town_jail(ra,'1234','slash',null,rb); if (j->>'caught')::boolean then n2 := n2 + 1; end if;
  end loop;
  rep := rep||'② 砍 200 次被抓：沒前科 '||n1||'（白天約 90）、有前科 '||n2||'（白天約 135；半夜都減半）'||E'\n';
  -- 抓一次，看 jp／pr
  loop
    update public.town_residents set place='street', x=10, y=10, energy=80, sleeping=false, money=5000, items = (items - 'cd' - 'jl' - 'jp' - 'pr' - 'pl' - 'wt') where id = ra;
    update public.town_residents set place='street', x=11, y=10, energy=100, sleeping=false, items = items - 'cd' - 'jl' - 'sl' - 'faint' - 'hosp' where id = rb;
    update public.town_bonds set score = -10, dday = null, dpos = 0, dneg = 0 where a = least(ra,rb) and b = greatest(ra,rb);
    j := public.town_jail(ra,'1234','slash',null,rb); exit when (j->>'caught')::boolean;
  end loop;
  select * into r from public.town_residents where id = ra;
  rep := rep||'  被抓：place '||r.place||' (jail) jl 剩 '||ceil(extract(epoch from ((r.items->>'jl')::timestamptz - now())) / 60)||' 分鐘 jp '||(r.items->'jp')::text||' (n 0 bad 0) pr n '||(r.items->'pr'->>'n')||' (1) pr 到期距出獄 '||round(extract(epoch from ((r.items->'pr'->>'u')::timestamptz - (r.items->>'jl')::timestamptz)) / 3600)||' 小時 (24)'||E'\n';

  -- ③ 放風：心情 +6 精力 −3、30 分鐘冷卻、沒被關不能放風
  update public.town_residents set place='jail', x=61, y=5, energy=80, fun=50, items = (items - 'cd') where id = ra;
  j := public.town_jail(ra,'1234','yard'); select * into r from public.town_residents where id = ra;
  rep := rep||'③ 放風 '||j::text||' fun '||r.fun||' (56) energy '||r.energy||' (77)'||E'\n';
  begin perform public.town_jail(ra,'1234','yard'); rep := rep||'  yard cd NOT BLOCKED'||E'\n'; exception when others then rep := rep||'  yard cd: '||sqlerrm||E'\n'; end;
  begin perform public.town_jail(rb,'1234','yard'); rep := rep||'  free yard NOT BLOCKED'||E'\n'; exception when others then rep := rep||'  free yard: '||sqlerrm||E'\n'; end;

  -- ④ 假釋：要勞動 2 次、沒惹事、服滿一半刑期；成功後 pl、前科、不再受刑；假釋中犯事刑期加倍
  update public.town_residents set place='jail', x=61, y=5, money=5000, energy=90, sleeping=false, seen_at=now(), updated_at=now(),
    items = (items - 'cd' - 'jl' - 'jp' - 'pr' - 'pl' - 'wt') || jsonb_build_object('jl', (now() + interval '110 minutes')::text, 'jp', jsonb_build_object('t', now() - interval '10 minutes', 'e', now() + interval '110 minutes', 'n', 0, 'bad', 0)) where id = ra;
  begin perform public.town_jail(ra,'1234','parole'); rep := rep||'④ 0 次勞動 parole NOT BLOCKED'||E'\n'; exception when others then rep := rep||'④ 0 次勞動：'||sqlerrm||E'\n'; end;
  j := public.town_jail(ra,'1234','labor'); update public.town_residents set items = items - 'cd' where id = ra;
  j := public.town_jail(ra,'1234','labor'); select * into r from public.town_residents where id = ra;
  rep := rep||'  勞動 2 次後 jp.n='||(r.items->'jp'->>'n')||' (2)'||E'\n';
  begin perform public.town_jail(ra,'1234','parole'); rep := rep||'  未服滿一半 parole NOT BLOCKED'||E'\n'; exception when others then rep := rep||'  未服滿一半：'||sqlerrm||E'\n'; end;
  update public.town_residents set items = jsonb_set(items, '{jp,t}', to_jsonb((now() - interval '130 minutes')::text)) where id = ra;
  update public.town_residents set items = jsonb_set(items, '{jp,bad}', '1'::jsonb) where id = ra;
  begin perform public.town_jail(ra,'1234','parole'); rep := rep||'  惹過事 parole NOT BLOCKED'||E'\n'; exception when others then rep := rep||'  惹過事：'||sqlerrm||E'\n'; end;
  update public.town_residents set items = jsonb_set(items, '{jp,bad}', '0'::jsonb) where id = ra;
  j := public.town_jail(ra,'1234','parole'); select * into r from public.town_residents where id = ra;
  rep := rep||'  假釋成功 '||j::text||' jl '||coalesce(r.items->>'jl','已清除')||' jp '||coalesce(r.items->>'jp','已清除')||' pl 剩 '||round(extract(epoch from ((r.items->>'pl')::timestamptz - now())) / 3600)||' 小時 (24) pr n '||(r.items->'pr'->>'n')||' (1)'||E'\n';
  -- 假釋中再被抓：刑期加倍（2～6 小時，倒地至少 2 小時再加倍）；pl 清掉、jp.bad = 1
  n1 := 0;
  loop
    update public.town_residents set place='street', x=10, y=10, energy=80, sleeping=false, money=5000, items = (items - 'cd' - 'jl' - 'jp' - 'wt') || jsonb_build_object('pl', (now() + interval '10 hours')::text) where id = ra;
    update public.town_residents set place='street', x=11, y=10, energy=100, sleeping=false, items = items - 'cd' - 'jl' - 'sl' - 'faint' - 'hosp' where id = rb;
    update public.town_bonds set score = -10, dday = null, dpos = 0, dneg = 0 where a = least(ra,rb) and b = greatest(ra,rb);
    j := public.town_jail(ra,'1234','slash',null,rb); n1 := n1 + 1; exit when (j->>'caught')::boolean or n1 > 300;
  end loop;
  select * into r from public.town_residents where id = ra; mins := ceil(extract(epoch from ((r.items->>'jl')::timestamptz - now())) / 60)::int;
  rep := rep||'  假釋中犯事：刑期 '||mins||' 分鐘（期望 120～360，且是 120 的倍數附近）pl '||coalesce(r.items->>'pl','已清除')||' jp.bad '||coalesce(r.items->'jp'->>'bad','無')||' (1)'||E'\n';

  -- ⑤ 越獄：精力不夠擋下、1 小時冷卻、成功率白天約 12%、成功後 wt／place／前科、失敗加刑 60 分鐘罰 €500 且惹事
  update public.town_residents set place='jail', x=61, y=5, energy=20, sleeping=false, items = (items - 'cd' - 'jp' - 'pl' - 'wt') || jsonb_build_object('jl', (now() + interval '2 hours')::text) where id = ra;
  begin perform public.town_jail(ra,'1234','escape'); rep := rep||'⑤ 精力不夠 escape NOT BLOCKED'||E'\n'; exception when others then rep := rep||'⑤ 精力不夠：'||sqlerrm||E'\n'; end;
  n1 := 0; n2 := 0;
  for i in 1..400 loop
    update public.town_residents set place='jail', x=61, y=5, energy=80, sleeping=false, money=5000, items = (items - 'cd' - 'jp' - 'pl' - 'wt' - 'pr') || jsonb_build_object('jl', (now() + interval '2 hours')::text) where id = ra;
    j := public.town_jail(ra,'1234','escape'); if (j->>'escaped')::boolean then n1 := n1 + 1; end if;
  end loop;
  rep := rep||'  越獄 400 次成功 '||n1||'（白天約 48、半夜約 72）'||E'\n';
  loop
    update public.town_residents set place='jail', x=61, y=5, energy=80, sleeping=false, money=5000, items = (items - 'cd' - 'jp' - 'pl' - 'wt' - 'pr') || jsonb_build_object('jl', (now() + interval '2 hours')::text) where id = ra;
    j := public.town_jail(ra,'1234','escape'); exit when (j->>'escaped')::boolean;
  end loop;
  select * into r from public.town_residents where id = ra;
  rep := rep||'  成功：place '||r.place||' (street) jl '||coalesce(r.items->>'jl','已清除')||' wt 剩 '||round(extract(epoch from ((r.items->>'wt')::timestamptz - now())) / 3600)||' 小時 (3) wanted '||public.town_wanted(r)||' pr n '||coalesce(r.items->'pr'->>'n','無')||' (1) energy '||r.energy||' (60)'||E'\n';
  loop
    update public.town_residents set place='jail', x=61, y=5, energy=80, sleeping=false, money=5000, fun=80, items = (items - 'cd' - 'jp' - 'pl' - 'wt' - 'pr') || jsonb_build_object('jl', (now() + interval '2 hours')::text) where id = ra;
    j := public.town_jail(ra,'1234','escape'); exit when not (j->>'escaped')::boolean;
  end loop;
  select * into r from public.town_residents where id = ra; mins := ceil(extract(epoch from ((r.items->>'jl')::timestamptz - now())) / 60)::int;
  rep := rep||'  失敗：'||j::text||' 刑期 '||mins||' 分鐘 (180) money '||r.money||' (4500) energy '||r.energy||' (65) fun '||r.fun||' (70) jp.bad '||coalesce(r.items->'jp'->>'bad','無')||' (1)'||E'\n';
  begin perform public.town_jail(ra,'1234','escape'); rep := rep||'  escape cd NOT BLOCKED'||E'\n'; exception when others then rep := rep||'  escape cd: '||sqlerrm||E'\n'; end;
  update public.town_residents set money = 100, items = items - 'cd' where id = ra;
  loop j := public.town_jail(ra,'1234','escape'); select * into r from public.town_residents where id = ra; exit when not (j->>'escaped')::boolean; update public.town_residents set place='jail', energy=80, items = (items - 'cd' - 'wt') || jsonb_build_object('jl', (now() + interval '2 hours')::text) where id = ra; end loop;
  rep := rep||'  錢只有 100 失敗：money '||r.money||' (0，不欠款) db '||coalesce(r.items->>'db','無')||E'\n';

  -- ⑥ 通緝：town_state 每次約 3.5%/分鐘（這裡 10 分鐘 ≈ 30%）把街上的通緝犯抓回牢；在家不會被抓；離線太久不會
  n1 := 0; n2 := 0; n3 := 0;
  for i in 1..60 loop
    update public.town_residents set place='street', x=10, y=10, sleeping=false, energy=80, seen_at=now(), updated_at=now() - interval '10 minutes', items = (items - 'cd' - 'jl' - 'jp') || jsonb_build_object('wt', (now() + interval '2 hours')::text) where id = ra;
    perform public.town_state(tid); select * into r from public.town_residents where id = ra; if r.place = 'jail' then n1 := n1 + 1; end if;
  end loop;
  rep := rep||'⑥ 通緝在街上 60 次（各 10 分鐘）被抓回 '||n1||'（期望約 18）'||E'\n';
  select * into r from public.town_residents where id = ra;
  rep := rep||'  最後一例 place '||r.place||' jl 剩 '||coalesce(ceil(extract(epoch from ((r.items->>'jl')::timestamptz - now())) / 60)::text,'無')||' 分鐘（期望 90 左右）wt '||coalesce(r.items->>'wt','已清除')||' jp.bad '||coalesce(r.items->'jp'->>'bad','無')||E'\n';
  for i in 1..30 loop
    update public.town_residents set place='home:'||ra, sleeping=false, energy=80, seen_at=now(), updated_at=now() - interval '10 minutes', items = (items - 'cd' - 'jl' - 'jp') || jsonb_build_object('wt', (now() + interval '2 hours')::text) where id = ra;
    perform public.town_state(tid); select * into r from public.town_residents where id = ra; if r.place = 'jail' then n2 := n2 + 1; end if;
  end loop;
  rep := rep||'  通緝躲在家 30 次被抓 '||n2||'（期望 0）'||E'\n';
  update public.town_residents set place='street', x=10, y=10, sleeping=false, energy=80, seen_at=now() - interval '3 hours', updated_at=now() - interval '10 minutes', items = (items - 'cd' - 'jl' - 'jp') || jsonb_build_object('wt', (now() + interval '2 hours')::text) where id = ra;
  perform public.town_state(tid); select * into r from public.town_residents where id = ra;
  rep := rep||'  通緝但離線超過 30 分鐘：place '||r.place||' (不會被抓回牢，可能被送回家)'||E'\n';
  update public.town_residents set place='street', x=10, y=10, sleeping=false, energy=80, seen_at=now(), updated_at=now(), items = (items - 'cd' - 'jl' - 'jp') || jsonb_build_object('wt', (now() - interval '1 minute')::text) where id = ra;
  perform public.town_state(tid); select * into r from public.town_residents where id = ra;
  rep := rep||'  通緝過期：wt '||coalesce(r.items->>'wt','已清除')||' (已清除)'||E'\n';

  -- ⑦ 前科薪水 −8%：同樣狀態下，有前科比沒前科少約 8%
  update public.town_residents set place='office', x=30, y=6, energy=90, hunger=90, fun=90, bladder=90, hygiene=90, sleeping=false, money=1000, seen_at=now(), updated_at=now(), items = (items - 'cd' - 'jl' - 'jp' - 'pr' - 'wt' - 'dc') where id = ra;
  m0 := 1000; perform public.town_act(ra,'1234','work'); select * into r from public.town_residents where id = ra; n1 := r.money - m0;
  update public.town_residents set place='office', energy=90, hunger=90, fun=90, bladder=90, hygiene=90, money=1000, seen_at=now(), updated_at=now(), items = (items - 'cd' - 'dc') || jsonb_build_object('pr', jsonb_build_object('u', (now() + interval '2 hours')::text, 'n', 1)) where id = ra;
  perform public.town_act(ra,'1234','work'); select * into r from public.town_residents where id = ra; n2 := r.money - 1000;
  rep := rep||'⑦ 打工一次：沒前科 +'||n1||'、有前科 +'||n2||'（期望 比例 0.92：'||round(n1 * 0.92)||'）'||E'\n';

  -- ⑧ 獄友事件：poll／pick、每個選項的效果、減刑到出獄、惹事標記、每天上限、不在牢裡不能選
  update public.town_residents set place='street', items = items - 'je' where id = ra;
  ev := public.town_jail_ev(ra,'1234','poll'); rep := rep||'⑧ 不在牢裡 poll '||ev::text||' (ev null)'||E'\n';
  update public.town_residents set place='jail', x=61, y=5, sleeping=false, energy=80, fun=50, money=1000, seen_at=now(), items = (items - 'cd' - 'je' - 'pr' - 'pl' - 'wt') || jsonb_build_object('jl', (now() + interval '2 hours')::text, 'jp', jsonb_build_object('t', now(), 'e', now() + interval '2 hours', 'n', 0, 'bad', 0)) where id in (ra, rb);
  ev := public.town_jail_ev(ra,'1234','poll'); rep := rep||'  第一次 poll（開始計時）'||ev::text||' (ev null)'||E'\n';
  update public.town_residents set items = jsonb_set(items, '{je,nx}', to_jsonb((now() - interval '1 minute')::text)) where id = ra;
  ev := public.town_jail_ev(ra,'1234','poll'); rep := rep||'  nx 到了 poll '||ev::text||' (有 ev，k 0～3)'||E'\n';
  begin perform public.town_jail_ev(ra,'1234','pick','5'); rep := rep||'  bad item NOT BLOCKED'||E'\n'; exception when others then rep := rep||'  bad item：'||sqlerrm||E'\n'; end;
  for k in 0..3 loop for o in 0..1 loop
    update public.town_residents set place='jail', energy=80, fun=50, money=1000, items = (items - 'cd' - 'je' - 'pr' - 'pl' - 'wt') || jsonb_build_object('jl', (now() + interval '2 hours')::text, 'jp', jsonb_build_object('t', now(), 'e', now() + interval '2 hours', 'n', 0, 'bad', 0), 'je', jsonb_build_object('lp', now(), 'd', to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'), 'n', 1, 'nx', (now() + interval '1 hour')::text, 'q', jsonb_build_object('k', k, 'at', now()))) where id = ra;
    j := public.town_jail_ev(ra,'1234','pick', o::text); select * into r from public.town_residents where id = ra; mins := ceil(extract(epoch from ((r.items->>'jl')::timestamptz - now())) / 60)::int;
    rep := rep||'  事件 '||k||' 選項 '||o||'：'||j::text||' → fun '||r.fun||' energy '||r.energy||' money '||r.money||' 刑期剩 '||mins||' 分鐘 jp.bad '||coalesce(r.items->'jp'->>'bad','0')||E'\n';
  end loop; end loop;
  -- 賭牌（事件 2 選項 1）期望值：0.35×120 − 0.65×80 = −10
  tot := 0;
  for i in 1..400 loop
    update public.town_residents set money = 1000, items = items || jsonb_build_object('je', jsonb_build_object('lp', now(), 'd', to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'), 'n', 1, 'nx', (now() + interval '1 hour')::text, 'q', jsonb_build_object('k', 2, 'at', now()))) where id = ra;
    perform public.town_jail_ev(ra,'1234','pick','1'); select * into r from public.town_residents where id = ra; tot := tot + (r.money - 1000);
  end loop;
  rep := rep||'  賭牌 400 次平均 '||round(tot / 400.0, 1)||'（期望 −10，±10 內都正常）'||E'\n';
  update public.town_residents set money = 30, items = items || jsonb_build_object('je', jsonb_build_object('lp', now(), 'd', to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'), 'n', 1, 'nx', (now() + interval '1 hour')::text, 'q', jsonb_build_object('k', 2, 'at', now()))) where id = ra;
  begin perform public.town_jail_ev(ra,'1234','pick','0'); rep := rep||'  錢不夠（交換 €50）NOT BLOCKED'||E'\n'; exception when others then rep := rep||'  錢不夠：'||sqlerrm||E'\n'; end;
  -- 減刑到出獄（幫忙整理牢房 −5 分鐘，剩 3 分鐘就出獄）
  update public.town_residents set money = 1000, items = (items || jsonb_build_object('jl', (now() + interval '3 minutes')::text, 'je', jsonb_build_object('lp', now(), 'd', to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'), 'n', 1, 'nx', (now() + interval '1 hour')::text, 'q', jsonb_build_object('k', 3, 'at', now())))) where id = ra;
  j := public.town_jail_ev(ra,'1234','pick','0'); select * into r from public.town_residents where id = ra;
  rep := rep||'  減刑出獄：'||j::text||' jl '||coalesce(r.items->>'jl','已清除')||' (已清除) pr n '||coalesce(r.items->'pr'->>'n','無')||' (有前科記錄)'||E'\n';
  -- 每天上限 8、事件過期
  update public.town_residents set items = (items || jsonb_build_object('jl', (now() + interval '2 hours')::text)) - 'je' where id = ra;
  update public.town_residents set items = items || jsonb_build_object('je', jsonb_build_object('lp', now(), 'd', to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'), 'n', 8, 'nx', (now() - interval '1 minute')::text)) where id = ra;
  ev := public.town_jail_ev(ra,'1234','poll'); rep := rep||'  今天已 8 個：'||ev::text||' (ev null)'||E'\n';
  update public.town_residents set items = items || jsonb_build_object('je', jsonb_build_object('lp', now(), 'd', to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'), 'n', 1, 'nx', (now() + interval '1 hour')::text, 'q', jsonb_build_object('k', 0, 'at', now() - interval '10 minutes'))) where id = ra;
  begin perform public.town_jail_ev(ra,'1234','pick','0'); rep := rep||'  過期事件 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'  過期事件：'||sqlerrm||E'\n'; end;

  -- ⑨ 探監的人可以「進去」監獄（town_fi）；入獄的人不用進；睡著不能進
  update public.town_residents set place='jail', x=61, y=5, sleeping=false, items = (items - 'jl' - 'jp' - 'fi') where id = rc;
  j := public.town_fi(rc,'1234','enter','jail'); select * into r from public.town_residents where id = rc;
  rep := rep||'⑨ 探監者進監獄 '||j::text||' fi '||coalesce(r.items->>'fi','無')||' (jail)'||E'\n';
  update public.town_residents set items = (items - 'fi') || jsonb_build_object('jl', (now() + interval '1 hour')::text) where id = rc;
  begin perform public.town_fi(rc,'1234','enter','jail'); rep := rep||'  入獄者 enter NOT BLOCKED'||E'\n'; exception when others then rep := rep||'  入獄者 enter：'||sqlerrm||E'\n'; end;

  -- ⑩ 舊角色（沒有 pr／jp／pl／wt／je）：一切照舊
  update public.town_residents set items = items - 'pr' - 'jp' - 'pl' - 'wt' - 'je' - 'jl' - 'cd', place = 'street' where id = ra;
  select * into r from public.town_residents where id = ra;
  rep := rep||'⑩ 舊角色 pct '||public.town_pr_pct(r)||' (100) mult '||public.town_pr_mult(r)||' (1) wanted '||public.town_wanted(r)||' (false) jailed '||public.town_jailed(r)||' (false)'||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;
