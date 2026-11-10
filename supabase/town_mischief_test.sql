-- 格鬥場邀約 PK ＋ 惡趣味 ＋ 免整牌 ＋ 室內扁人被趕出門 實測：接在 town.sql、town_social.sql、town_mischief.sql 之後執行，
-- 結果在錯誤訊息 REPORT，整段 rollback（測試鎮，不碰真人）。模擬次數別加大（SQL Editor 約 60 秒會 upstream timeout）。
-- 檢查：1) PK：沒邀約不能接、下注付不起被擋、接受後兩人在格鬥場、錢的流向（贏拿 95%、5% 進鎮基金）、每對每小時最多 3 場、格鬥場不能直接 fight
--       2) 惡趣味 8 種：條件（面對面／門口／同在店裡）、效果、冷卻、報復不扣好感、偷零食期望值 ≤ 0
--       3) 免整牌擋住惡搞與丟蛋；每人每天最多被惡搞 6 次；原諒
--       4) 在別人家裡 fight：訪客有機率被趕出門（fv 被清掉）
do $$
declare cr json; jn json; ra bigint; rb bigint; rc bigint; tid text; rep text := ''; r1 public.town_residents; r2 public.town_residents; j json;
  n int; k int; won int; kick int; sn int; paid int; fund0 bigint; fund1 bigint; m0 int; m1 int; m2 int; ok boolean; i int;
begin
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  cr := public.town_create('ZZMS','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  jn := public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'); rb := (jn->>'resident_id')::bigint;
  jn := public.town_join(tid, (select invite from public.town_towns where id = tid), '丙','1234'); rc := (jn->>'resident_id')::bigint;
  update public.town_residents set energy=90, hunger=50, fun=70, hygiene=70, bladder=90, sleeping=false, money=5000, items='{}'::jsonb, seen_at=now(), updated_at=now(), place='plaza', x=14, y=10 where id in (ra,rb,rc);

  -- ── 1) PK ──
  begin perform public.town_pk(rb,'1234','accept',ra); rep := rep||'沒邀約就接受：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'沒邀約就接受：'||sqlerrm||E'\n'; end;
  begin perform public.town_pk(ra,'1234','send',rb,9999); rep := rep||'下注 9999：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'下注 9999：'||sqlerrm||E'\n'; end;
  update public.town_residents set money=100 where id=rb;
  begin perform public.town_pk(ra,'1234','send',rb,500); rep := rep||'對方付不起：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'對方付不起：'||sqlerrm||E'\n'; end;
  update public.town_residents set money=5000 where id=rb;
  -- 友誼賽（不下注）：邀約 → 接受
  update public.town_residents set items = items - 'cd' where id=ra; j := public.town_pk(ra,'1234','send',rb,0); rep := rep||'送出邀約：'||(j->>'msg')||E'\n';
  select * into r2 from public.town_residents where id=rb; rep := rep||'乙收到邀約 items.pk = '||coalesce((r2.items->'pk')::text,'無')||E'\n';
  begin perform public.town_pk(ra,'1234','send',rb,0); rep := rep||'3 分鐘內重送：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'3 分鐘內重送：'||sqlerrm||E'\n'; end;
  j := public.town_pk(rb,'1234','accept',ra);
  select * into r1 from public.town_residents where id=ra; select * into r2 from public.town_residents where id=rb;
  rep := rep||'接受後 甲 place='||r1.place||' 乙 place='||r2.place||'（期望都是 arena）rounds='||(j->'pkr'->>'rounds')||' 贏的 id='||(j->'pkr'->>'w')||E'\n';
  rep := rep||'甲有 pkr='||(r1.items->'pkr' is not null)::text||'、乙有 pkr='||(r2.items->'pkr' is not null)::text||'、乙的邀約已清掉='||(r2.items->'pk' is null)::text||E'\n';
  j := public.town_pk(ra,'1234','poll'); rep := rep||'甲 poll 拿到結果：'||((j->'pkr') is not null and (j->>'pkr') is not null)::text||'；再 poll 一次：'||coalesce((public.town_pk(ra,'1234','poll')->>'pkr'),'空')||E'\n';
  -- 格鬥場不能直接 fight
  begin perform public.town_act(ra,'1234','fight',target:=rb); rep := rep||'格鬥場直接扁人：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'格鬥場直接扁人：'||sqlerrm||E'\n'; end;
  -- 下注：贏的拿 95%、5% 進基金；用多場統計錢的總和只少 5%
  update public.town_residents set money=5000, energy=90, fun=70, bruised_until=null where id in (ra,rb);
  delete from public.town_events where kind='pk';
  select fund into fund0 from public.town_towns where id=tid;
  update public.town_residents set items = items - 'cd' where id=ra; j := public.town_pk(ra,'1234','send',rb,1000); j := public.town_pk(rb,'1234','accept',ra);
  select * into r1 from public.town_residents where id=ra; select * into r2 from public.town_residents where id=rb; select fund into fund1 from public.town_towns where id=tid;
  rep := rep||'賭 1000：甲 '||r1.money||'、乙 '||r2.money||'（期望一個 5950、一個 4000）鎮基金 +'||(fund1-fund0)||'（期望 50）'||E'\n';
  -- 每對每小時最多 3 場
  update public.town_residents set money=5000, energy=90, bruised_until=null where id in (ra,rb);
  update public.town_residents set items = items - 'cd' where id=ra; j := public.town_pk(ra,'1234','send',rb,0); j := public.town_pk(rb,'1234','accept',ra);
  update public.town_residents set money=5000, energy=90, bruised_until=null where id in (ra,rb);
  update public.town_residents set items = items - 'cd' where id=ra; j := public.town_pk(ra,'1234','send',rb,0); j := public.town_pk(rb,'1234','accept',ra);
  begin update public.town_residents set items = items - 'cd' where id=ra; j := public.town_pk(ra,'1234','send',rb,0); rep := rep||'第 4 場：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'第 4 場：'||sqlerrm||E'\n'; end;
  -- 婉拒
  delete from public.town_events where kind='pk'; update public.town_residents set energy=90, place='plaza' where id in (ra,rb);
  update public.town_residents set items = items - 'cd' where id=ra; j := public.town_pk(ra,'1234','send',rb,0); j := public.town_pk(rb,'1234','decline',ra);
  j := public.town_pk(ra,'1234','poll'); rep := rep||'婉拒後甲 poll：no='||coalesce(j->'pkr'->>'no','無')||E'\n';
  -- 睡著的人不能邀
  update public.town_residents set sleeping=true where id=rb;
  begin perform public.town_pk(ra,'1234','send',rb,0); rep := rep||'邀睡著的人：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'邀睡著的人：'||sqlerrm||E'\n'; end;
  update public.town_residents set sleeping=false where id=rb;

  -- ── 2) 惡趣味 ──
  update public.town_residents set items='{}'::jsonb, place='plaza', x=14, y=10, energy=90, fun=70, hygiene=70, money=5000, sleeping=false where id in (ra,rb,rc);
  delete from public.town_events;
  -- 潑水
  j := public.town_mischief(ra,'1234','splash',rb); select * into r2 from public.town_residents where id=rb; rep := rep||'潑水：乙清潔 '||round(r2.hygiene)||'（期望約 55）；訊息 '||(j->>'msg')||E'\n';
  begin perform public.town_mischief(ra,'1234','splash',rb); rep := rep||'潑水冷卻：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'潑水冷卻：'||sqlerrm||E'\n'; end;
  -- 貼紙條
  j := public.town_mischief(ra,'1234','sticker',rb); select * into r2 from public.town_residents where id=rb; rep := rep||'貼紙條：sk='||coalesce((r2.items->'sk')::text,'無')||E'\n';
  -- 假告白
  j := public.town_mischief(ra,'1234','fakelove',rb); rep := rep||'假告白：'||(j->>'msg')||E'\n';
  -- 醜照
  j := public.town_mischief(ra,'1234','photo',rb); rep := rep||'醜照：'||(j->>'msg')||'，動態 photo 筆數 '||(select count(*) from public.town_events where kind='photo')||E'\n';
  -- 條件：不是面對面
  update public.town_residents set x=50, y=10 where id=rc;
  begin perform public.town_mischief(ra,'1234','splash',rc); rep := rep||'太遠潑水：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'太遠潑水：'||sqlerrm||E'\n'; end;
  update public.town_residents set x=14, y=10 where id=rc;
  -- 按門鈴／假便便：要站在對方家門口
  begin perform public.town_mischief(ra,'1234','doorbell',rc); rep := rep||'不在門口按門鈴：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'不在門口按門鈴：'||sqlerrm||E'\n'; end;
  update public.town_residents set place='home:'||rc where id=ra; update public.town_residents set place='home:'||rc where id=rc;
  j := public.town_mischief(ra,'1234','doorbell',rc); rep := rep||'按門鈴：'||(j->>'msg')||E'\n';
  j := public.town_mischief(ra,'1234','fakepoop',rc); rep := rep||'假便便：'||(j->>'msg')||E'\n';
  -- 睡著的人可以被按門鈴（有機率吵醒），但不能被面對面整
  update public.town_residents set sleeping=true, energy=60, items=jsonb_build_object('cd','{}'::jsonb) where id=rc;
  begin perform public.town_mischief(ra,'1234','splash',rc); rep := rep||'潑睡著的人：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'潑睡著的人：'||sqlerrm||E'\n'; end;
  update public.town_residents set sleeping=false, items='{}'::jsonb where id=rc;
  -- 換座位：要同在咖啡廳裡面
  begin perform public.town_mischief(ra,'1234','swapseat',rb); rep := rep||'不在咖啡廳換座位：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'不在咖啡廳換座位：'||sqlerrm||E'\n'; end;
  update public.town_residents set place='cafe', items=jsonb_build_object('fi','cafe') where id in (ra,rb);
  j := public.town_mischief(ra,'1234','swapseat',rb); rep := rep||'換座位：'||(j->>'msg')||E'\n';
  -- 偷零食：他沒零食被擋；有零食時 55% 被抓、賠 €60，期望值 ≤ 0
  update public.town_residents set items=jsonb_build_object('fi','cafe') where id in (ra,rb);
  begin perform public.town_mischief(ra,'1234','snack',rb); rep := rep||'沒零食偷：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'沒零食偷：'||sqlerrm||E'\n'; end;
  sn := 0; paid := 0;
  for i in 1..60 loop
    update public.town_residents set items=jsonb_build_object('fi','cafe','snack',3), money=5000 where id=ra;
    update public.town_residents set items=jsonb_build_object('fi','cafe','snack',3,'ms',jsonb_build_object('d',to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'),'n',0)) where id=rb;
    j := public.town_mischief(ra,'1234','snack',rb);
    select money into m1 from public.town_residents where id=ra;
    if m1 < 5000 then paid := paid + (5000 - m1); else sn := sn + 1; end if;
  end loop;
  rep := rep||'偷零食 60 次：成功 '||sn||' 次、被抓共賠 €'||paid||'；平均每次金錢 = '||round((-paid)::numeric/60,2)||'，加上成功拿到的零食價值 €60×'||sn||' → 每次期望 '||round(((sn*60 - paid)::numeric)/60,2)||'（要 ≤ 約 0）'||E'\n';

  -- ── 3) 免整牌／每日上限／原諒 ──
  update public.town_residents set items='{}'::jsonb, place='plaza', x=14, y=10, money=5000, sleeping=false where id in (ra,rb,rc);
  j := public.town_mischief(rb,'1234','shield'); rep := rep||'乙掛免整牌：'||(j->>'msg')||E'\n';
  begin perform public.town_mischief(ra,'1234','splash',rb); rep := rep||'整免整牌的人：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'整免整牌的人：'||sqlerrm||E'\n'; end;
  begin perform public.town_act(ra,'1234','egg',target:=rb); rep := rep||'對免整牌丟蛋：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'對免整牌丟蛋：'||sqlerrm||E'\n'; end;
  begin perform public.town_act(ra,'1234','fight',target:=rb); rep := rep||'對免整牌扁人：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'對免整牌扁人：'||sqlerrm||E'\n'; end;
  j := public.town_mischief(rb,'1234','unshield');
  -- 每天最多被惡搞 6 次
  update public.town_residents set items=jsonb_build_object('ms',jsonb_build_object('d',to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'),'n',6)) where id=rb;
  begin perform public.town_mischief(ra,'1234','splash',rb); rep := rep||'被整第 7 次：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'被整第 7 次：'||sqlerrm||E'\n'; end;
  update public.town_residents set items='{}'::jsonb where id in (ra,rb);
  -- 報復不扣好感：乙先整甲，甲整回去好感不變
  delete from public.town_bonds where a=least(ra,rb) and b=greatest(ra,rb);
  j := public.town_mischief(rb,'1234','splash',ra);
  j := public.town_mischief(ra,'1234','splash',rb); rep := rep||'報復：rev='||(j->>'rev')||'、好感變化 b='||(j->>'b')||'（期望 true、0）'||E'\n';
  -- 原諒
  j := public.town_mischief(ra,'1234','forgive',rb); rep := rep||'原諒：'||(j->>'msg')||E'\n';
  begin perform public.town_mischief(ra,'1234','forgive',rb); rep := rep||'重複原諒：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'重複原諒：'||sqlerrm||E'\n'; end;
  begin perform public.town_mischief(rc,'1234','forgive',ra); rep := rep||'原諒沒整過你的人：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'原諒沒整過你的人：'||sqlerrm||E'\n'; end;
  -- 被關著的人不能整人
  update public.town_residents set items=jsonb_build_object('jl', now() + interval '1 hour') where id=ra;
  begin perform public.town_mischief(ra,'1234','splash',rb); rep := rep||'坐牢中整人：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'坐牢中整人：'||sqlerrm||E'\n'; end;
  update public.town_residents set items='{}'::jsonb where id in (ra,rb);

  -- ── 4) 在別人家裡 fight：訪客有機率被趕出門（fv 被清掉），100 次統計 ──
  kick := 0; won := 0;
  for i in 1..100 loop
    update public.town_residents set items=jsonb_build_object('fv', rb), place='home:'||rb, energy=90, fun=70, bruised_until=null, money=5000 where id=ra;
    update public.town_residents set items='{}'::jsonb, place='home:'||rb, energy=90, fun=70, bruised_until=null, sleeping=false where id=rb;
    delete from public.town_events where kind in ('fight','kick');
    begin perform public.town_act(ra,'1234','fight',target:=rb);
      select * into r1 from public.town_residents where id=ra;
      if r1.items->'fv' is null then kick := kick + 1; end if;
    exception when others then rep := rep||'室內 fight 出錯：'||sqlerrm||E'\n'; exit; end;
  end loop;
  rep := rep||'室內扁屋主 100 次，訪客被趕出門 '||kick||' 次（期望約 42：輸 60%、贏 25%，各半）'||E'\n';
  -- 屋主睡著不能被扁
  update public.town_residents set sleeping=true where id=rb; update public.town_residents set items=jsonb_build_object('fv', rb) where id=ra;
  begin perform public.town_act(ra,'1234','fight',target:=rb); rep := rep||'扁睡著的屋主：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'扁睡著的屋主：'||sqlerrm||E'\n'; end;

  raise exception E'REPORT\n%', rep;
end $$;
