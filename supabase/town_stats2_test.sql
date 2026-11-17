-- 實測 town_stats2.sql：接在 town.sql、town_social.sql、town_stats.sql、town_stats2.sql 之後貼上；結果在錯誤訊息 REPORT，整段 rollback（測試鎮，不碰真人）
-- 檢查：1) 健身房 lift 6 次 $150／力量 +1 點、進度歸零；2) 每天 8 進度上限；3) 錯地點／錢不夠／睡著／沒人聊天被擋；4) 暫時減益（鼻青臉腫、心情低落、發臭、精力不足、欠款）不動永久點、解除即恢復；5) 單項 5 點封頂
do $$
declare cr json; jn json; ra bigint; rb bigint; tid text; rep text := ''; j json; r1 public.town_residents; i int; n int := 0; e text;
begin
  cr := public.town_create('ZZS2','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  jn := public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'); rb := (jn->>'resident_id')::bigint;
  update public.town_residents set place='gym', sleeping=false, energy=100, hunger=100, fun=50, hygiene=100, bladder=90, money=5000, items='{}'::jsonb, seen_at=now(), updated_at=now() where id in (ra, rb);
  for i in 1..6 loop j := public.town_train(ra,'1234','lift'); end loop;
  select * into r1 from public.town_residents where id = ra;
  rep := rep||'lift×6：st='||(j->'at'->>'st')||' 進度='||(j->'p'->>'st')||' 錢='||r1.money||'（期望 1／0／4100）'||E'\n';
  begin for i in 1..5 loop j := public.town_train(ra,'1234','lift'); end loop; exception when others then e := sqlerrm; end;
  rep := rep||'繼續練到每日上限：'||coalesce(e,'沒擋')||'（期望「今天練得夠多了」，td='||(public.town_train(ra,'1234','view')->>'td')||' 期望 8）'||E'\n';
  update public.town_residents set items = jsonb_set(items,'{at,td}','{"d":"2000-01-01","n":8}') where id = ra;
  e := null; begin perform public.town_train(ra,'1234','run'); exception when others then e := sqlerrm; end; rep := rep||'在健身房慢跑：'||coalesce(e,'沒擋')||'（期望要在公園）'||E'\n';
  e := null; update public.town_residents set money = 50 where id = ra; begin perform public.town_train(ra,'1234','lift'); exception when others then e := sqlerrm; end; rep := rep||'錢不夠舉重：'||coalesce(e,'沒擋')||'（期望錢不夠）'||E'\n';
  e := null; update public.town_residents set money = 5000, place='plaza' where id = ra; update public.town_residents set place='park' where id = rb;
  begin perform public.town_train(ra,'1234','chat'); exception when others then e := sqlerrm; end; rep := rep||'廣場沒別人聊天：'||coalesce(e,'沒擋')||'（期望沒有別人）'||E'\n';
  update public.town_residents set place='plaza' where id = rb; j := public.town_train(ra,'1234','chat'); rep := rep||'有人聊天：'||(j->>'msg')||E'\n';
  e := null; update public.town_residents set sleeping=true where id = ra; begin perform public.town_train(ra,'1234','pray'); exception when others then e := sqlerrm; end; rep := rep||'睡著：'||coalesce(e,'沒擋')||'（期望被擋）'||E'\n';
  update public.town_residents set sleeping=false, items = jsonb_set(items,'{at}','{"st":5,"iq":3}') where id = ra;
  e := null; update public.town_residents set place='gym' where id = ra; begin perform public.town_train(ra,'1234','lift'); exception when others then e := sqlerrm; end; rep := rep||'力量已 5 點：'||coalesce(e,'沒擋')||'（期望已經最高）'||E'\n';
  -- 暫時減益
  select * into r1 from public.town_residents where id = ra;
  update public.town_residents set bruised_until = now() + interval '1 hour' where id = ra; select * into r1 from public.town_residents where id = ra;
  rep := rep||'鼻青臉腫：st '||public.town_at(r1,'st')||' ag '||public.town_at(r1,'ag')||'（期望 4／0，永久 st 仍 5）'||E'\n';
  update public.town_residents set bruised_until = null, energy = 5, hygiene = 0, items = items || '{"sad":true,"db":{"a":100}}' where id = ra; select * into r1 from public.town_residents where id = ra;
  rep := rep||'低精力／發臭／低落／欠款：iq '||public.town_at(r1,'iq')||' ch '||public.town_at(r1,'ch')||' lk '||public.town_at(r1,'lk')||'（期望 1／0／0）'||E'\n';
  update public.town_residents set energy = 100, hygiene = 100, items = (items - 'sad') || '{"db":{"a":0}}' where id = ra; select * into r1 from public.town_residents where id = ra;
  rep := rep||'解除後 st '||public.town_at(r1,'st')||' iq '||public.town_at(r1,'iq')||'（期望 5／3）'||E'\n';
  raise exception 'REPORT %', E'\n'||rep;
end $$;
