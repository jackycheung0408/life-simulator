-- 設施小事件／一起加成／邀請實測：接在 town.sql 與 town_social.sql 之後執行，結果在錯誤訊息 REPORT，整段 rollback
do $$
declare cr json; ra bigint; rb bigint; rep text := ''; i int; tid text; j json; p text; k int; o int; ef int[]; ev numeric; bad int := 0; m0 int; n int;
begin
  cr := public.town_create('ZZSOC','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  rb := ((public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'))->>'resident_id')::bigint;
  -- 1 效果表：每個賭的選項期望值要略負，安全選項不給錢
  for p in select unnest(array['restaurant','market','cafe','cinema','gym','park','plaza','office','arena','stock','rafi','carshop','slaughter']) loop
    for k in 0..2 loop for o in 0..1 loop
      ef := public.town_pe_eff(p,k,o);
      if ef is null or cardinality(ef) <> 9 then bad := bad + 1; rep := rep || 'BAD eff '||p||k||o||E'\n'; continue; end if;
      ev := (ef[5] * ef[3] + (100 - ef[5]) * ef[8]) / 100.0;
      if ev > 0 then bad := bad + 1; rep := rep || 'EV>0 '||p||k||o||' '||ev||E'\n'; end if;
    end loop; end loop;
  end loop;
  rep := rep || 'eff table bad=' || bad || E' (expect 0)\n';
  -- 2 事件：先 poll（建立計時）→ 改成到期 → poll 出事件 → pick
  update public.town_residents set place='cafe',x=37,y=5,energy=60,fun=50,money=1000,sleeping=false,items='{}'::jsonb,updated_at=now() where id in (ra,rb);
  j := public.town_pevent(ra,'1234','poll'); rep := rep || 'poll1 ev=' || coalesce((j->'ev')::text,'null') || ' (expect null)' || E'\n';
  update public.town_residents set items = jsonb_set(items,'{pe,nx}', to_jsonb(now() - interval '1 minute')) where id=ra;
  j := public.town_pevent(ra,'1234','poll'); rep := rep || 'poll2 ev=' || (j->'ev')::text || ' (expect cafe event)' || E'\n';
  j := public.town_pevent(ra,'1234','poll'); rep := rep || 'poll3 same ev=' || (j->'ev')::text || E'\n';
  select fun, money into m0, n from public.town_residents where id=ra;
  j := public.town_pevent(ra,'1234','pick','0'); rep := rep || 'pick -> ' || j::text || ' fun ' || m0 || '->' || (select fun from public.town_residents where id=ra) || E'\n';
  begin perform public.town_pevent(ra,'1234','pick','0'); rep := rep || 'pick twice NOT BLOCKED' || E'\n'; exception when others then rep := rep || 'pick twice: ' || sqlerrm || E'\n'; end;
  -- 3 每日上限 8、離線不累積
  for i in 1..12 loop
    update public.town_residents set items = jsonb_set(items,'{pe}', (items->'pe') - 'q' || jsonb_build_object('nx', now() - interval '1 minute','lp',now())) where id=ra;
    j := public.town_pevent(ra,'1234','poll'); if (j->'ev') is not null and (j->>'ev') is not null then n := n; end if;
    update public.town_residents set items = items where id=ra;
  end loop;
  rep := rep || 'events today n=' || (select items->'pe'->>'n' from public.town_residents where id=ra) || ' (expect 8)' || E'\n';
  update public.town_residents set items = jsonb_set(items,'{pe,lp}', to_jsonb(now() - interval '10 minutes')) where id=ra;
  j := public.town_pevent(ra,'1234','poll'); rep := rep || 'after offline ev=' || coalesce((j->'ev')::text,'null') || ' nx>now=' || ((select items->'pe'->>'nx' from public.town_residents where id=ra)::timestamptz > now()) || E'\n';
  -- 4 邀請：乙發給甲 → 甲接受
  update public.town_residents set items = '{}'::jsonb, fun=40, energy=50 where id in (ra,rb);
  j := public.town_invite(rb,'1234','send',ra); rep := rep || 'send ' || j::text || E'\n';
  begin perform public.town_invite(rb,'1234','send',ra); rep := rep || 'send again NOT BLOCKED' || E'\n'; exception when others then rep := rep || 'send again: ' || sqlerrm || E'\n'; end;
  j := public.town_invite(ra,'1234','yes',rb); rep := rep || 'yes ' || j::text || ' fun a=' || (select fun from public.town_residents where id=ra) || ' b=' || (select fun from public.town_residents where id=rb) || ' bond=' || public.town_bond_get(ra,rb) || E'\n';
  begin perform public.town_invite(ra,'1234','yes',rb); rep := rep || 'yes twice NOT BLOCKED' || E'\n'; exception when others then rep := rep || 'yes twice: ' || sqlerrm || E'\n'; end;
  begin perform public.town_invite(ra,'1234','send',rb); rep := rep || 'cooldown NOT BLOCKED' || E'\n'; exception when others then rep := rep || 'cooldown: ' || sqlerrm || E'\n'; end;
  -- 5 邀請過期（1 分鐘）
  update public.town_residents set items = '{}'::jsonb where id in (ra,rb);
  perform public.town_invite(rb,'1234','send',ra);
  update public.town_residents set items = jsonb_set(items,'{iv,at}', to_jsonb(now() - interval '2 minutes')) where id=ra;
  begin perform public.town_invite(ra,'1234','yes',rb); rep := rep || 'expired NOT BLOCKED' || E'\n'; exception when others then rep := rep || 'expired: ' || sqlerrm || E'\n'; end;
  -- 6 每天 8 次加成上限
  update public.town_residents set items = '{}'::jsonb, fun=10 where id=ra;
  for i in 1..12 loop update public.town_residents set items = items || jsonb_build_object('cd','{}'::jsonb) where id in (ra,rb); perform public.town_invite(rb,'1234','send',ra); perform public.town_invite(ra,'1234','yes',rb); end loop;
  rep := rep || 'tg n(a)=' || (select items->'tg'->>'n' from public.town_residents where id=ra) || ' (expect 8) bond=' || public.town_bond_get(ra,rb) || ' (expect ≤ 12)' || E'\n';
  raise exception 'REPORT%', E'\n' || rep;
end $$;
