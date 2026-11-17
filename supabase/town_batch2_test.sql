-- 第二批實測（取消限制、能力屬性、隨機互動）：接在 town.sql…town_roll.sql 之後執行，最後 rollback，結果在錯誤訊息 REPORT。
do $$
declare cr json; jn json; ra bigint; rb bigint; tid text; rep text := ''; r1 public.town_residents; r2 public.town_residents; j json;
  i int; ok int; bad int; msg text; neg boolean := false; dbt boolean := false;
begin
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  cr := public.town_create('ZZB2','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  jn := public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'); rb := (jn->>'resident_id')::bigint;
  update public.town_residents set place='street', x=20, y=7, sleeping=false, energy=95, hunger=95, fun=90, hygiene=95, bladder=95, money=50000, items='{}'::jsonb, seen_at=now(), updated_at=now() where id in (ra,rb);
  -- 1 stats
  j := public.town_stats(ra,'1234','view'); rep := rep||'1) 舊角色 view：'||j::text||'（期望全 0、init false）'||E'\n';
  begin perform public.town_stats(ra,'1234','set','6,0,0,0,0'); rep := rep||'   單項 6 沒擋 BAD'||E'\n'; exception when others then rep := rep||'   單項 6 擋住：'||SQLERRM||E'\n'; end;
  begin perform public.town_stats(ra,'1234','set','5,5,1,0,0'); rep := rep||'   總和 11 沒擋 BAD'||E'\n'; exception when others then rep := rep||'   總和 11 擋住：'||SQLERRM||E'\n'; end;
  j := public.town_stats(ra,'1234','set','5,3,2,0,0'); rep := rep||'   set 5,3,2,0,0：'||j::text||E'\n';
  begin perform public.town_stats(ra,'1234','set','1,1,1,1,1'); rep := rep||'   第二次 set 沒擋 BAD'||E'\n'; exception when others then rep := rep||'   第二次 set 擋住：'||SQLERRM||E'\n'; end;
  begin perform public.town_stats(ra,'1234','spend','st'); rep := rep||'   無點數 spend 沒擋 BAD'||E'\n'; exception when others then rep := rep||'   無點數 spend 擋住：'||SQLERRM||E'\n'; end;
  update public.town_residents set items = jsonb_set(items,'{al}','{"lv":3}') where id = ra;
  j := public.town_stats(ra,'1234','spend','iq'); rep := rep||'   Lv3 spend iq：'||j::text||'（期望 iq 1、avail 1）'||E'\n';
  j := public.town_stats(ra,'1234','spend','st'); 
  begin perform public.town_stats(ra,'1234','spend','st'); rep := rep||'   st 已 5 再加沒擋 BAD'||E'\n'; exception when others then rep := rep||'   st 已 5 擋住：'||SQLERRM||E'\n'; end;
  -- 2 roll fun/mis
  ok := 0; bad := 0;
  for i in 1..10 loop begin perform public.town_roll(ra,'1234','fun',rb); ok := ok + 1; exception when others then bad := bad + 1; msg := SQLERRM; end; end loop;
  rep := rep||'2) roll fun 10 次：成功 '||ok||' 失敗 '||bad||coalesce('（最後原因 '||msg||'）','')||E'\n';
  ok := 0; bad := 0; msg := null;
  for i in 1..10 loop begin perform public.town_roll(ra,'1234','mis',rb); ok := ok + 1; exception when others then bad := bad + 1; msg := SQLERRM; end; end loop;
  rep := rep||'   roll mis 10 次：成功 '||ok||' 失敗 '||bad||coalesce('（最後原因 '||msg||'）','')||E'\n';
  -- 3 連按 30 次擊掌
  update public.town_residents set energy=95, hunger=95, fun=90, hygiene=95, bladder=95 where id in (ra,rb);
  ok := 0; bad := 0; msg := null;
  for i in 1..30 loop begin perform public.town_act(rid=>ra, pin=>'1234', act=>'greet', target=>rb); ok := ok + 1; exception when others then bad := bad + 1; msg := SQLERRM; end; end loop;
  rep := rep||'3) 擊掌連按 30 次：成功 '||ok||' 失敗 '||bad||coalesce('（最後原因 '||msg||'）','')||'（期望 30／0）'||E'\n';
  ok := 0; bad := 0; msg := null;
  for i in 1..30 loop begin perform public.town_act(rid=>ra, pin=>'1234', act=>'work'); ok := ok + 1; exception when others then bad := bad + 1; msg := SQLERRM; end; end loop;
  rep := rep||'   公司打工連按 30 次（地點在街上，可能因地點擋）：成功 '||ok||' 失敗 '||bad||coalesce('（'||msg||'）','')||E'\n';
  -- 4 擋住的情況
  update public.town_residents set items = jsonb_set(items,'{jl}', to_jsonb(now() + interval '1 hour')), place='jail' where id = ra;
  begin perform public.town_roll(ra,'1234','fun',rb); rep := rep||'4) 入獄 roll 沒擋 BAD'||E'\n'; exception when others then rep := rep||'4) 入獄 roll 擋住：'||SQLERRM||E'\n'; end;
  update public.town_residents set items = items - 'jl', place='street', sleeping=true where id = ra;
  begin perform public.town_roll(ra,'1234','fun',rb); rep := rep||'   睡覺 roll 沒擋 BAD'||E'\n'; exception when others then rep := rep||'   睡覺 roll 擋住：'||SQLERRM||E'\n'; end;
  update public.town_residents set sleeping=false, items = jsonb_set(items,'{faint}', to_jsonb(now() + interval '1 hour')) where id = ra;
  begin perform public.town_roll(ra,'1234','fun',rb); rep := rep||'   昏倒 roll 沒擋 BAD'||E'\n'; exception when others then rep := rep||'   昏倒 roll 擋住：'||SQLERRM||E'\n'; end;
  update public.town_residents set items = items - 'faint', energy = 5 where id = ra;
  begin perform public.town_act(rid=>ra, pin=>'1234', act=>'greet', target=>rb); rep := rep||'   精力 5 擊掌：沒擋（若擊掌本無精力需求屬正常）'||E'\n'; exception when others then rep := rep||'   精力 5 擊掌擋住：'||SQLERRM||E'\n'; end;
  -- 5 ecap / dcap
  update public.town_residents set energy=95, place='street', items = items || '{"ec":{"d":"2000-01-01","n":0}}' where id = ra;
  r1 := public.town_dcap((select r from public.town_residents r where id = ra), 'zz', 1);
  r1 := public.town_dcap(r1, 'zz', 1); r1 := public.town_dcap(r1, 'zz', 1);
  rep := rep||'5) dcap 上限 1 連呼 3 次沒丟錯（期望通過）：dn='||(r1.items->'dn')::text||E'\n';
  -- 6 負數檢查
  select * into r1 from public.town_residents where id = ra; select * into r2 from public.town_residents where id = rb;
  neg := r1.money < 0 or r2.money < 0; dbt := coalesce((r1.items->'db'->>'a')::int,0) > 0 or coalesce((r2.items->'db'->>'a')::int,0) > 0;
  rep := rep||'6) 錢 甲 '||r1.money||' 乙 '||r2.money||' 負數 '||neg||' 欠款 '||dbt||'（期望 false／false）'||E'\n';
  delete from public.town_towns where id = tid;
  raise exception E'REPORT\n%', rep;
end $$;
