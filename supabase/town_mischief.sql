-- 小豬鎮：格鬥場邀約 PK ＋ 8 種惡趣味 ＋ 免整牌（獨立 RPC，不改 town_act 的動作）
-- 要在 town.sql、town_social.sql 之後套用（用到 town_auth／town_tick／town_bond／town_save_r／town_fund_add／town_jailed／town_bag_max）。可重複執行。
-- 全部不會死；角色資料只放 items（缺值 = 預設，舊角色不用遷移）：
--   items.pk  = 收到的 PK 邀約 {f:誰, n:名字, at:時間, b:下注}（3 分鐘內有效）
--   items.pkr = PK 結果（給前端放動畫，讀一次就清）{w:贏的人id, a:邀約的人id, b:被邀的人id, rounds:"WWL", bet, at, no:拒絕才有}
--   items.sh  = 免整牌：今天（台灣日）掛著就不能被惡搞／丟蛋／惡作劇／扁
--   items.sk  = 背上的紙條 {u:到期時間, from:誰貼的}，名牌掛「踢我」一小時
--   items.ms  = {d:台灣日, n:今天被惡搞幾次}，每人每天最多被惡搞 6 次（不是霸凌工具）
--   items.cd['ms'||act||對方id] = 冷卻

-- 惡趣味冷卻（分鐘）：潑水 30、貼紙條 60、按門鈴 30、假便便 60、換座位 30、假告白 60、偷零食 60、醜照 60
create or replace function public.town_ms_cd(act text) returns int language sql immutable as $$
  select case act when 'splash' then 30 when 'sticker' then 60 when 'doorbell' then 30 when 'fakepoop' then 60
    when 'swapseat' then 30 when 'fakelove' then 60 when 'snack' then 60 when 'photo' then 60 else 60 end
$$;

create or replace function public.town_mischief(rid bigint, pin text, act text, target bigint default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; t public.town_residents; tn text;
  today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
  ck text; cdm int; ms jsonb; rev boolean := false; near boolean; b int := 0; f int := 0; tf int := 0; msg text := ''; evk text := 'mischief'; evm text := '';
  bag int; ok boolean; paid int := 0;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if public.town_jailed(r) then raise exception '你被關著，哪都不能去'; end if;

  -- 免整牌：今天不想被整，按一下就掛到今天結束
  if act = 'shield' then
    r.items := jsonb_set(r.items, '{sh}', to_jsonb(today));
    perform public.town_save_r(r);
    return json_build_object('msg','今天掛上免整牌了，別人不能整你、丟蛋、惡作劇、扁你');
  end if;
  if act = 'unshield' then
    r.items := r.items - 'sh';
    perform public.town_save_r(r);
    return json_build_object('msg','收起免整牌了');
  end if;

  if target is null or target = rid then raise exception '要選一位朋友'; end if;
  select * into t from public.town_residents where id = target and town_id = r.town_id for update;
  if not found then raise exception '找不到這位鄰居'; end if;
  tn := t.name;
  t := public.town_tick(t);

  -- 原諒：他三天內整過你（還沒原諒過），原諒他：好感 +2，兩人心情 +3
  if act = 'forgive' then
    if not exists (select 1 from public.town_events e where e.actor = target and e.target = rid and e.kind = 'mischief' and e.at > now() - interval '3 days'
        and not exists (select 1 from public.town_events g where g.actor = rid and g.target = target and g.kind = 'forgive' and g.at > e.at)) then
      raise exception '% 最近沒有整你，或你已經原諒過了', tn;
    end if;
    perform public.town_bond(r.town_id, rid, t.id, 2);
    r.fun := r.fun + 3; t.fun := t.fun + 3;
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, target, 'forgive', r.name || ' 原諒了 ' || tn || '，一笑泯恩仇 🤝');
    perform public.town_save_r(r); perform public.town_save_r(t);
    return json_build_object('msg','你原諒了 ' || tn, 'f', 3, 'b', 2);
  end if;

  if act not in ('splash','sticker','doorbell','fakepoop','swapseat','fakelove','snack','photo') then raise exception '沒有這個惡作劇'; end if;
  if public.town_jailed(t) then raise exception '% 被關著，整不到', tn; end if;
  if (t.items->>'sh') = today then raise exception '% 今天掛了免整牌，改天再整他', tn; end if;
  ms := case when t.items->'ms'->>'d' = today then t.items->'ms' else jsonb_build_object('d', today, 'n', 0) end;
  if coalesce((ms->>'n')::int, 0) >= 6 then raise exception '% 今天已經被整太多次了，放過他吧', tn; end if;
  ck := 'ms' || act || target; cdm := public.town_ms_cd(act);
  if (r.items->'cd'->>ck) is not null and (r.items->'cd'->>ck)::timestamptz > now() - make_interval(mins => cdm) then raise exception '剛整過他，等一下再來'; end if;
  -- 報復：他三天內整過你（或丟蛋、惡作劇、扁過你），你整回去不傷感情
  rev := exists (select 1 from public.town_events e where e.actor = target and e.target = rid and e.kind in ('mischief','egg','prank','fight','photo') and e.at > now() - interval '3 days');
  near := (r.place = t.place and r.place <> 'street') or (abs(r.x - t.x) + abs(r.y - t.y) <= 2.5);

  if act = 'splash' then
    if not near or t.sleeping then raise exception '要和 % 面對面，而且他醒著', tn; end if;
    t.hygiene := t.hygiene - 15; tf := -3; f := 4; b := -1;
    msg := '朝 ' || tn || ' 潑了一杯水'; evm := r.name || ' 朝 ' || tn || ' 潑了一杯水 💦';
  elsif act = 'sticker' then
    if not near or t.sleeping then raise exception '要和 % 面對面，而且他醒著', tn; end if;
    t.items := jsonb_set(t.items, '{sk}', jsonb_build_object('u', now() + interval '1 hour', 'from', r.name));
    tf := -4; f := 5; b := -1;
    msg := '偷偷在 ' || tn || ' 背上貼了「踢我」'; evm := r.name || ' 偷偷在 ' || tn || ' 背上貼了「踢我」🦶';
  elsif act = 'doorbell' then
    if r.place <> 'home:' || target or (r.items->>'fv') = target::text then raise exception '要站在 % 家門口（不要進去）', tn; end if;
    if t.place <> 'home:' || t.id then raise exception '% 不在家', tn; end if;
    if t.sleeping and random() < 0.4 then t.sleeping := false; t.energy := t.energy - 5; msg := '按了 ' || tn || ' 家的門鈴就跑，他被吵醒了'; else msg := '按了 ' || tn || ' 家的門鈴就跑'; end if;
    tf := -5; f := 4; b := -1; evm := r.name || ' 按了 ' || tn || ' 家的門鈴就跑 🔔';
  elsif act = 'fakepoop' then
    if r.place <> 'home:' || target or (r.items->>'fv') = target::text then raise exception '要站在 % 家門口（不要進去）', tn; end if;
    t.hygiene := t.hygiene - 5; tf := -6; f := 4; b := -1;
    msg := '在 ' || tn || ' 家門口擺了一坨假便便'; evm := r.name || ' 在 ' || tn || ' 家門口擺了一坨假便便 💩（其實是巧克力）';
  elsif act = 'swapseat' then
    if r.place not in ('cafe','restaurant') or r.place <> t.place or coalesce(r.items->>'fi','') <> r.place or coalesce(t.items->>'fi','') <> t.place or t.sleeping then raise exception '要和 % 同在咖啡廳或餐廳裡面', tn; end if;
    t.energy := t.energy - 3; tf := -4; f := 5; b := -1;
    msg := '把 ' || tn || ' 的座位換成了壞掉的椅子'; evm := r.name || ' 偷偷把 ' || tn || ' 的座位換成了會嘎吱響的椅子 🪑';
  elsif act = 'fakelove' then
    if not near or t.sleeping then raise exception '要和 % 面對面，而且他醒著', tn; end if;
    if random() < 0.5 then tf := 5; f := 3; b := 1; msg := '假裝向 ' || tn || ' 告白，他害羞了'; evm := r.name || ' 假裝向 ' || tn || ' 告白，' || tn || ' 臉紅了 💘';
    else tf := -10; f := -2; b := -2; msg := '假裝向 ' || tn || ' 告白，他氣炸了'; evm := r.name || ' 假裝向 ' || tn || ' 告白，結果被罵了一頓 😅'; end if;
  elsif act = 'snack' then
    if not near or t.sleeping then raise exception '要和 % 面對面，而且他醒著', tn; end if;
    if coalesce((t.items->>'snack')::int, 0) <= 0 then raise exception '% 身上沒有零食', tn; end if;
    bag := public.town_bag_max(r);
    if coalesce((r.items->>'snack')::int, 0) >= bag then raise exception '你的背包放不下了'; end if;
    -- 被抓到的機率 55%：賠他一包零食的錢（€60，付到 0 為止）；沒被抓到才拿到一包。期望值 −€6。
    if random() < 0.55 then
      paid := least(60, r.money); r.money := r.money - paid; t.money := t.money + paid; f := -5; tf := -2; b := -3;
      msg := '偷 ' || tn || ' 的零食被當場抓到，賠了 €' || paid; evm := r.name || ' 想偷 ' || tn || ' 的零食，被當場抓到，賠了 €' || paid || ' 🍪';
    else
      t.items := jsonb_set(t.items, '{snack}', to_jsonb(coalesce((t.items->>'snack')::int, 0) - 1));
      r.items := jsonb_set(r.items, '{snack}', to_jsonb(coalesce((r.items->>'snack')::int, 0) + 1));
      f := 6; tf := -3; b := -1; msg := '偷拿了 ' || tn || ' 的一包零食'; evm := r.name || ' 偷拿了 ' || tn || ' 的一包零食 🍪';
    end if;
  elsif act = 'photo' then
    if not near or t.sleeping then raise exception '要和 % 面對面，而且他醒著', tn; end if;
    tf := -5; f := 4; b := -2; evk := 'photo';
    msg := '拍了 ' || tn || ' 的醜照'; evm := r.name || ' 拍了 ' || tn || ' 的醜照貼到動態 📸（' || (array['張大嘴','翻白眼','吃到一半','打哈欠','睡到流口水'])[1 + floor(random()*5)::int] || '）';
  end if;

  -- 報復不傷感情（好感不扣，其他效果照給）
  if rev and b < 0 then b := 0; end if;
  r.fun := r.fun + f; t.fun := t.fun + tf;
  if b <> 0 then perform public.town_bond(r.town_id, rid, target, b); end if;
  ms := jsonb_set(ms, '{n}', to_jsonb(coalesce((ms->>'n')::int, 0) + 1));
  t.items := jsonb_set(t.items, '{ms}', ms);
  r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object(ck, now()));
  insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, target, evk, evm);
  perform public.town_save_r(r); perform public.town_save_r(t);
  return json_build_object('msg', msg, 'f', f, 'tf', tf, 'b', b, 'rev', rev, 'act', act);
end $$;
revoke all on function public.town_mischief(bigint,text,text,bigint) from public;
grant execute on function public.town_mischief(bigint,text,text,bigint) to anon, authenticated;
revoke all on function public.town_ms_cd(text) from public, anon, authenticated;

-- ── 格鬥場邀約 PK ──
-- send：邀請對方去格鬥場 PK（可下注 0～2000，雙方都要付得起）；對方 3 分鐘內 accept／decline
-- accept：被邀的人接受，兩人被帶到格鬥場，三回合分勝負，結果存進兩人的 items.pkr 讓前端放動畫
-- poll：邀約的人問結果（只讀一次）
-- 下注：輸的人付押注，贏的人拿 95%，5% 進鎮基金（期望值 −2.5%）；沒下注時贏的人 €100（每人 30 分鐘領一次，防互刷）
-- 每一對每小時最多 3 場；不會死，輸的人只是精力 −12、鼻青臉腫 1 小時
create or replace function public.town_pk(rid bigint, pin text, op text, target bigint default null, bet int default 0) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; t public.town_residents; inv jsonb; n int; a public.town_residents; bb public.town_residents;
  sa numeric; sb numeric; aw boolean; pat text; rounds text; fee int := 0; prize int := 0; ra jsonb; wid bigint; msg text; bond int;
  pats text[] := array['WWL','WLW','LWW','WWW'];
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;

  if op = 'poll' then
    if r.items->'pkr' is not null then
      ra := r.items->'pkr';
      r.items := r.items - 'pkr';
      update public.town_residents set items = r.items where id = rid;
      return json_build_object('pkr', ra);
    end if;
    return json_build_object('pkr', null);
  end if;

  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if public.town_jailed(r) then raise exception '你被關著，哪都不能去'; end if;
  if target is null or target = rid then raise exception '要選一位朋友'; end if;
  select * into t from public.town_residents where id = target and town_id = r.town_id for update;
  if not found then raise exception '找不到這位鄰居'; end if;
  t := public.town_tick(t);

  if op = 'send' then
    if bet < 0 or bet > 2000 then raise exception '下注要在 0～€2000'; end if;
    if t.sleeping then raise exception '% 在睡覺', t.name; end if;
    if public.town_jailed(t) then raise exception '% 被關著', t.name; end if;
    if r.energy < 15 then raise exception '你太累了，休息一下再約'; end if;
    if r.money < bet or t.money < bet then raise exception '雙方都要付得起 €%（你 €%、%  €%）', bet, r.money, t.name, t.money; end if;
    select count(*) into n from public.town_events e where e.kind = 'pk' and e.at > now() - interval '1 hour' and ((e.actor = rid and e.target = target) or (e.actor = target and e.target = rid));
    if n >= 3 then raise exception '你們這一小時已經打了 3 場，休息一下'; end if;
    if (r.items->'cd'->>('pks' || target)) is not null and (r.items->'cd'->>('pks' || target))::timestamptz > now() - interval '3 minutes' then raise exception '剛約過他，等 3 分鐘再約'; end if;
    t.items := jsonb_set(t.items, '{pk}', jsonb_build_object('f', rid, 'n', r.name, 'at', now(), 'b', bet));
    r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('pks' || target, now()));
    perform public.town_save_r(t); perform public.town_save_r(r);
    return json_build_object('msg', '已向 ' || t.name || ' 下戰帖，3 分鐘內他要回應', 'bet', bet);
  end if;

  -- 以下 op 的 target 都是「發邀約的人」；r 是被邀的人
  if op = 'decline' then
    inv := r.items->'pk';
    if inv is null or (inv->>'f')::bigint <> target then raise exception '沒有這個邀約'; end if;
    r.items := r.items - 'pk';
    t.items := jsonb_set(t.items, '{pkr}', jsonb_build_object('no', true, 'n', r.name, 'at', now()));
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, target, 'pkno', r.name || ' 婉拒了 ' || t.name || ' 的格鬥場邀約 🙅');
    perform public.town_save_r(r); perform public.town_save_r(t);
    return json_build_object('msg', '婉拒了邀約');
  end if;

  if op = 'accept' then
    inv := r.items->'pk';
    if inv is null or (inv->>'f')::bigint <> target then raise exception '沒有這個邀約'; end if;
    if (inv->>'at')::timestamptz < now() - interval '3 minutes' then
      r.items := r.items - 'pk'; perform public.town_save_r(r); raise exception '邀約已經過期了';
    end if;
    bet := coalesce((inv->>'b')::int, 0);
    if t.sleeping then raise exception '% 睡著了，這場打不成', t.name; end if;
    if public.town_jailed(t) then raise exception '% 被關著', t.name; end if;
    if r.energy < 15 or t.energy < 15 then raise exception '有人太累了（精力至少要 15）'; end if;
    if r.money < bet or t.money < bet then raise exception '有人付不起押注 €%', bet; end if;
    select count(*) into n from public.town_events e where e.kind = 'pk' and e.at > now() - interval '1 hour' and ((e.actor = rid and e.target = target) or (e.actor = target and e.target = rid));
    if n >= 3 then raise exception '你們這一小時已經打了 3 場，休息一下'; end if;
    -- a = 邀約的人，bb = 被邀的人（r）；兩人都被帶到格鬥場門口
    a := t; bb := r;
    sa := 30 + a.energy*.4 + a.fun*.2 + random()*45 + coalesce((a.items->>'fit')::int,0)*2 - case when a.bruised_until > now() then 15 else 0 end + public.town_mood_pow(public.town_mood(a)) + case when public.town_has(a,'athlete') then 5 else 0 end;
    sb := 30 + bb.energy*.4 + bb.fun*.2 + random()*45 + coalesce((bb.items->>'fit')::int,0)*2 - case when bb.bruised_until > now() then 15 else 0 end + public.town_mood_pow(public.town_mood(bb)) + case when public.town_has(bb,'athlete') then 5 else 0 end;
    aw := sa >= sb;
    pat := pats[1 + floor(random()*4)::int];
    -- 回合結果以「邀約的人」的角度寫：W = 邀約的人贏這回合；邀約的人輸時把 W／L 對調
    rounds := case when aw then pat else translate(pat, 'WL', 'LW') end;
    wid := case when aw then a.id else bb.id end;
    -- 錢：輸的付押注，贏的拿 95%，5% 進鎮基金（沒下注時贏的人 €100，每人 30 分鐘領一次）
    if bet > 0 then
      fee := floor(bet * 0.05);
      if aw then a.money := a.money + bet - fee; bb.money := bb.money - bet; else bb.money := bb.money + bet - fee; a.money := a.money - bet; end if;
      perform public.town_fund_add(r.town_id, 'pk', fee);
    else
      if aw and not ((a.items->'cd'->>'afp') is not null and (a.items->'cd'->>'afp')::timestamptz > now() - interval '30 minutes') then
        a.money := a.money + 100; prize := 100; a.items := jsonb_set(a.items, '{cd}', coalesce(a.items->'cd','{}'::jsonb) || jsonb_build_object('afp', now()));
      elsif not aw and not ((bb.items->'cd'->>'afp') is not null and (bb.items->'cd'->>'afp')::timestamptz > now() - interval '30 minutes') then
        bb.money := bb.money + 100; prize := 100; bb.items := jsonb_set(bb.items, '{cd}', coalesce(bb.items->'cd','{}'::jsonb) || jsonb_build_object('afp', now()));
      end if;
    end if;
    -- 體力：輸的人 −12、贏的人 −8，輸的人鼻青臉腫 1 小時；心情贏 +10 輸 −8；都被帶到格鬥場，下車、離開室內
    a.energy := a.energy - case when aw then 8 else 12 end; bb.energy := bb.energy - case when aw then 12 else 8 end;
    a.fun := a.fun + case when aw then 10 else -8 end; bb.fun := bb.fun + case when aw then -8 else 10 end;
    if aw then bb.bruised_until := now() + interval '1 hour'; else a.bruised_until := now() + interval '1 hour'; end if;
    a.place := 'arena'; a.x := 53; a.y := 6; bb.place := 'arena'; bb.x := 54; bb.y := 6;
    a.items := a.items - 'dr' - 'fv' - 'fi' - 'pk'; bb.items := bb.items - 'dr' - 'fv' - 'fi' - 'pk';
    if a.items#>>'{veh,k}' is not null then a.items := jsonb_set(a.items, '{veh}', (a.items->'veh') - 'k'); end if;
    if bb.items#>>'{veh,k}' is not null then bb.items := jsonb_set(bb.items, '{veh}', (bb.items->'veh') - 'k'); end if;
    ra := jsonb_build_object('w', wid, 'a', a.id, 'b', bb.id, 'an', a.name, 'bn', bb.name, 'rounds', rounds, 'bet', bet, 'fee', fee, 'prize', prize, 'at', now());
    a.items := jsonb_set(a.items, '{pkr}', ra); bb.items := jsonb_set(bb.items, '{pkr}', ra);
    -- 友誼賽：切磋增進感情，兩人好感 +1（吃每日上限）
    perform public.town_bond(r.town_id, a.id, bb.id, 1);
    msg := a.name || ' 和 ' || bb.name || ' 在格鬥場 PK，' || case when aw then a.name else bb.name end || ' 贏了 🥊' || case when bet > 0 then '（賭注 €' || bet || '）' else '' end;
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, a.id, bb.id, 'pk', msg);
    if bet >= 1000 then insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, wid, case when aw then bb.id else a.id end, 'luck', (case when aw then a.name else bb.name end) || ' 在格鬥場 PK 贏了 €' || (bet - fee)); end if;
    perform public.town_save_r(a); perform public.town_save_r(bb);
    update public.town_residents set place = 'arena', x = 53, y = 6 where id in (a.id, bb.id);
    return json_build_object('pkr', ra, 'msg', msg);
  end if;

  raise exception '不明的操作';
end $$;
revoke all on function public.town_pk(bigint,text,text,bigint,int) from public;
grant execute on function public.town_pk(bigint,text,text,bigint,int) to anon, authenticated;
