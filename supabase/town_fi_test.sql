-- 進設施實測：接在 town.sql、town_social.sql、town_fi.sql 之後執行，結果在錯誤訊息 REPORT，整段 rollback
do $$
declare cr json; ra bigint; rb bigint; rep text := ''; tid text; j json; r public.town_residents;
begin
  cr := public.town_create('ZZFI','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  rb := ((public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'))->>'resident_id')::bigint;
  update public.town_residents set sleeping = false, seen_at = now(), place = 'cafe' where id in (ra, rb);
  select * into r from public.town_residents where id = ra; rep := rep||'舊角色缺值 fin='||public.town_fin(r)||' (期望 false)'||E'\n';
  j := public.town_fi(ra,'1234','enter','cafe'); select * into r from public.town_residents where id = ra; rep := rep||'enter cafe: '||j::text||' fin='||public.town_fin(r)||' (期望 true)'||E'\n';
  begin perform public.town_fi(ra,'1234','enter','gym'); rep := rep||'enter 別的地點 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'enter gym 不在門口: '||sqlerrm||E'\n'; end;
  begin perform public.town_fi(ra,'1234','enter','market'); rep := rep||'enter market NOT BLOCKED'||E'\n'; exception when others then rep := rep||'enter market: '||sqlerrm||E'\n'; end;
  begin perform public.town_fi(ra,'1234','enter',null); rep := rep||'enter null NOT BLOCKED'||E'\n'; exception when others then rep := rep||'enter null: '||sqlerrm||E'\n'; end;
  begin perform public.town_fi(ra,'1234','dance','cafe'); rep := rep||'bad op NOT BLOCKED'||E'\n'; exception when others then rep := rep||'bad op: '||sqlerrm||E'\n'; end;
  begin perform public.town_fi(ra,'9999','enter','cafe'); rep := rep||'bad pin NOT BLOCKED'||E'\n'; exception when others then rep := rep||'bad pin: '||sqlerrm||E'\n'; end;
  -- 走到別處：place 一變就自動失效
  update public.town_residents set place = 'park' where id = ra; select * into r from public.town_residents where id = ra;
  rep := rep||'走到公園 fin='||public.town_fin(r)||' (期望 false，items.fi 還在 '||coalesce(r.items->>'fi','-')||')'||E'\n';
  update public.town_residents set place = 'cafe' where id = ra; select * into r from public.town_residents where id = ra;
  rep := rep||'回到咖啡廳又自動算在裡面 fin='||public.town_fin(r)||' (已知：沒按出門就走回來；前端走路時會先 exit)'||E'\n';
  j := public.town_fi(ra,'1234','exit'); select * into r from public.town_residents where id = ra; rep := rep||'exit: '||j::text||' fin='||public.town_fin(r)||' (期望 false) fi='||coalesce(r.items->>'fi','-')||E'\n';
  -- 睡覺、關設施
  update public.town_residents set sleeping = true where id = ra;
  begin perform public.town_fi(ra,'1234','enter','cafe'); rep := rep||'sleeping NOT BLOCKED'||E'\n'; exception when others then rep := rep||'sleeping: '||sqlerrm||E'\n'; end;
  update public.town_residents set sleeping = false where id = ra;
  update public.town_towns set off = array['cafe'] where id = tid;
  begin perform public.town_fi(ra,'1234','enter','cafe'); rep := rep||'設施關閉 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'設施關閉: '||sqlerrm||E'\n'; end;
  update public.town_towns set off = '{}' where id = tid;
  -- 室內不影響設施互動
  update public.town_residents set money = 1000, energy = 50, items = (items - 'cd') where id = ra; perform public.town_fi(ra,'1234','enter','cafe');
  j := public.town_fac(ra,'1234','latte'); rep := rep||'室內買咖啡: '||j::text||E'\n';
  -- 餐廳、健身房也能進
  update public.town_residents set place = 'restaurant' where id = rb; j := public.town_fi(rb,'1234','enter','restaurant'); rep := rep||'enter restaurant: '||j::text||E'\n';
  update public.town_residents set place = 'gym' where id = rb; j := public.town_fi(rb,'1234','enter','gym'); rep := rep||'enter gym: '||j::text||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;
