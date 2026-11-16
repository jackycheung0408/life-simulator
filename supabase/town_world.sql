-- 小豬鎮：鎮上隨機事件。要在 town.sql 之後套用（town.sql 含 town_worlds 表與 town_px／town_wd_pct），可重複執行。
-- A 全鎮事件：每鎮同時 1 個，持續 60～120 分，結束後隔 60～180 分才開下一個；惰性結算（有人 poll 才補算）。
--   market 市集日 吃喝價格 85%；boom 景氣好 薪水 115%；bust 景氣差 薪水 90%、價格 110%；blackout 停電 薪水 95%；festival 小鎮慶典 價格 90%、薪水 105%。
--   開始與結束各寫一則公開動態 kind 'world'。
-- B 個人突發事件 op='luck'：每人至少間隔 8 分鐘、每天最多 10 次（items.lk={d,n,at}）、被關或睡覺不觸發、約 35% 機率；
--   8 種，金錢期望值 <= 0、不會死、不欠款（扣錢 least(錢)）；寫 kind 'luck' 動態。
create or replace function public.town_world(rid bigint, pin text, op text default 'poll') returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; tid text; w public.town_worlds; ks text[] := array['market','boom','bust','blackout','festival'];
  nk text; nm text; ds text; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); lk jsonb; n int; pick int; msg text; amt int; ev json := null;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  tid := r.town_id;
  if op = 'luck' then
    if public.town_jailed(r) or r.sleeping or r.place not in ('street','plaza','park') or (r.items->>'faint') is not null then return json_build_object('none', true); end if;
    lk := coalesce(r.items->'lk', '{}'::jsonb);
    n := case when lk->>'d' = today then coalesce((lk->>'n')::int, 0) else 0 end;
    if n >= 10 then return json_build_object('none', true); end if;
    if lk ? 'at' and (lk->>'at')::timestamptz > now() - interval '8 minutes' then return json_build_object('none', true); end if;
    if random() >= 0.35 then return json_build_object('none', true); end if;
    pick := 1 + floor(random() * 8)::int;
    if pick = 1 then amt := 30 + floor(random() * 31)::int; r.money := r.money + amt; msg := '路邊撿到 €' || amt;
    elsif pick = 2 then r.fun := least(100, r.fun + 4); msg := '有人請你喝了一杯飲料，心情變好了';
    elsif pick = 3 then r.energy := greatest(0, r.energy - 4); msg := '走錯路迷路了一下，有點累';
    elsif pick = 4 then amt := least(50, r.money); r.money := r.money - amt; r.fun := greatest(0, r.fun - 2); msg := '被推銷員纏住，花了 €' || amt;
    elsif pick = 5 then amt := least(40, r.money); r.money := r.money - amt; r.fun := greatest(0, r.fun - 3); msg := '買到過期零食，損失 €' || amt;
    elsif pick = 6 then r.hygiene := greatest(0, r.hygiene - 8); msg := '踩到水坑，鞋子濕了';
    elsif pick = 7 then r.fun := least(100, r.fun + 5); msg := '遇到街頭藝人，聽得很開心';
    else r.fun := least(100, r.fun + 3); msg := '天氣真好，心情不錯'; end if;
    r.items := jsonb_set(r.items, '{lk}', jsonb_build_object('d', today, 'n', n + 1, 'at', now()));
    insert into public.town_events(town_id,actor,kind,msg) values (tid, rid, 'luck', r.name || ' ' || msg);
    perform public.town_save_r(r);
    return json_build_object('msg', msg);
  end if;
  insert into public.town_worlds(town_id) values (tid) on conflict (town_id) do nothing;
  select * into w from public.town_worlds where town_id = tid for update;
  if w.k is not null and w.until <= now() then
    insert into public.town_events(town_id,actor,kind,msg) values (tid, null, 'world', '事件結束了，小鎮恢復平常');
    update public.town_worlds set k = null, until = null, next_at = now() + make_interval(mins => 60 + floor(random() * 121)::int) where town_id = tid;
    w.k := null;
  end if;
  if w.k is null and w.next_at <= now() then
    nk := ks[1 + floor(random() * 5)::int];
    nm := case nk when 'market' then '市集日' when 'boom' then '景氣好' when 'bust' then '景氣差' when 'blackout' then '停電' else '小鎮慶典' end;
    update public.town_worlds set k = nk, until = now() + make_interval(mins => 60 + floor(random() * 61)::int) where town_id = tid;
    insert into public.town_events(town_id,actor,kind,msg) values (tid, null, 'world', '小鎮事件：' || nm);
  end if;
  select * into w from public.town_worlds where town_id = tid;
  if w.k is not null and w.until > now() then
    nm := case w.k when 'market' then '市集日' when 'boom' then '景氣好' when 'bust' then '景氣差' when 'blackout' then '停電' else '小鎮慶典' end;
    ev := json_build_object('k', w.k, 'name', nm, 'until', w.until, 'px', public.town_px(tid, 100), 'wd', public.town_wd_pct(tid));
  end if;
  return json_build_object('ev', ev);
end $$;
revoke all on function public.town_world(bigint,text,text) from public;
grant execute on function public.town_world(bigint,text,text) to anon, authenticated;
