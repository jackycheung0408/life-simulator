-- 鎮長管理權第二批實測：接在 town_powers.sql、town_world.sql、town_powers2.sql 之後執行，結果在錯誤訊息 REPORT，整段 rollback（測試鎮，不碰真人）
-- 注意：用「往前推 125 分鐘」避開冷卻，台灣時間 00:00～02:05 之間跑會跨日而誤判，請避開。
-- 檢查：全鎮活動（費用、規模、擋重疊、煙火夜心情、價格、每日上限、冷卻、新鎮保護）、任命官員（任期、免職、辭職、單一官職、<3 人）、
--       警長與財務官的行使與限制與計入次數、補助申訴收回、全民紅包（金額、每人上限、活躍、冪等冷卻、投票）、搬設施登記、錢與基金守恆與不變負
do $$
declare cr json; jn json; ra bigint; rb bigint; rc bigint; rd bigint; re bigint; tid text; tid2 text; tid3 text; rep text := ''; j json; r1 public.town_residents; lid text; i int;
  v_f0 bigint; v_m0 bigint; v_f1 bigint; v_m1 bigint; v_p jsonb;
begin
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  cr := public.town_create('ZZP2A','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  jn := public.town_join(tid,(select invite from public.town_towns where id = tid),'乙','1234'); rb := (jn->>'resident_id')::bigint;
  jn := public.town_join(tid,(select invite from public.town_towns where id = tid),'丙','1234'); rc := (jn->>'resident_id')::bigint;
  jn := public.town_join(tid,(select invite from public.town_towns where id = tid),'丁','1234'); rd := (jn->>'resident_id')::bigint;
  update public.town_residents set place='street', x=40, y=8, sleeping=false, energy=90, hunger=90, fun=50, hygiene=50, bladder=90, money=5000, items='{}'::jsonb, seen_at=now(), updated_at=now() where town_id=tid;
  update public.town_towns set fund = 20000, created_at = now() - interval '2 hours' where id = tid;
  -- 0) 補丁都在
  rep := rep||'補丁在位：check='||(position('town_pw2_check' in pg_get_functiondef('public.town_pw_check(text,bigint,text,bigint,int)'::regprocedure))>0)||' do='||(position('town_pw2_do' in pg_get_functiondef('public.town_pw_do(text,bigint,text,bigint,int,text)'::regprocedure))>0)
    ||' power='||(position('town_pw2_officer' in pg_get_functiondef('public.town_power(bigint,text,text,text,bigint,int,text)'::regprocedure))>0)||' world='||(position('fireworks' in pg_get_functiondef('public.town_world(bigint,text,text)'::regprocedure))>0)||'（期望全 true）'||E'\n';
  rep := rep||'登錄：event='||array_to_string(public.town_pw_def('event'),',')||' appoint='||array_to_string(public.town_pw_def('appoint'),',')||' payout='||array_to_string(public.town_pw_def('payout'),',')||' relocate='||array_to_string(public.town_pw_def('relocate'),',')||E'\n';

  -- 1) 全鎮活動
  begin perform public.town_power(rb,'1234','use','event',null,1); rep := rep||'非鎮長發動：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'非鎮長發動：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(ra,'1234','use','event',null,4); rep := rep||'選景氣差：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'選不存在的第 4 種（景氣差不可選）：'||sqlerrm||E'\n'; end;
  update public.town_towns set created_at = now() where id = tid;
  begin perform public.town_power(ra,'1234','use','event',null,1); rep := rep||'新鎮保護：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'新鎮保護：'||sqlerrm||E'\n'; end;
  update public.town_towns set created_at = now() - interval '2 hours' where id = tid;
  update public.town_towns set fund = 1000 where id = tid;
  begin perform public.town_power(ra,'1234','use','event',null,1); rep := rep||'基金不夠：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'基金不夠：'||sqlerrm||E'\n'; end;
  update public.town_towns set fund = 20000 where id = tid;
  j := public.town_power(ra,'1234','use','event',null,1);
  rep := rep||'市集日：'||(j->>'msg')||' 基金='||(select fund from public.town_towns where id = tid)||'（期望 17000）k='||(select k from public.town_worlds where town_id = tid)||' 吃喝價 250→'||public.town_px(tid,250)||'（期望 213）薪 100→'||public.town_wd_pct(tid)||'（期望 100）'||E'\n';
  rep := rep||'town_world 顯示名：'||coalesce((public.town_world(ra,'1234','poll')->'ev'->>'name'),'無')||'（期望 市集日）'||E'\n';
  begin perform public.town_power(ra,'1234','use','event',null,2); rep := rep||'冷卻內再發動：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'冷卻中：'||sqlerrm||E'\n'; end;
  update public.town_powers set log = (select jsonb_agg(e || jsonb_build_object('at', now() - interval '125 minutes')) from jsonb_array_elements(log) e) where town_id = tid;
  begin perform public.town_power(ra,'1234','use','event',null,2); rep := rep||'疊加事件：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'進行中再發動（冷卻已過）：'||sqlerrm||E'\n'; end;
  update public.town_worlds set until = now() - interval '1 minute' where town_id = tid;
  update public.town_residents set fun = 50, sleeping = false, seen_at = now() where id in (ra, rb);
  update public.town_residents set sleeping = true, fun = 50 where id = rc;
  update public.town_residents set seen_at = now() - interval '1 hour', fun = 50 where id = rd;
  j := public.town_power(ra,'1234','use','event',null,3);
  rep := rep||'煙火夜：'||(j->>'msg')||' 基金='||(select fund from public.town_towns where id = tid)||'（期望 15000）甲心情='||(select fun from public.town_residents where id = ra)||' 乙='||(select fun from public.town_residents where id = rb)||'（期望 62 62）睡覺的丙='||(select fun from public.town_residents where id = rc)||' 離線的丁='||(select fun from public.town_residents where id = rd)||'（期望 50 50）煙火夜價格 250→'||public.town_px(tid,250)||' 薪→'||public.town_wd_pct(tid)||'（期望 250 100）'||E'\n';
  update public.town_worlds set until = now() - interval '1 minute' where town_id = tid;
  update public.town_powers set log = (select jsonb_agg(e || jsonb_build_object('at', now() - interval '125 minutes')) from jsonb_array_elements(log) e) where town_id = tid;
  begin perform public.town_power(ra,'1234','use','event',null,2); rep := rep||'今天第 3 次：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'每天第 3 次：'||sqlerrm||E'\n'; end;
  -- 規模係數：另一個 11 人的鎮 → 3000 × 2.2 = 6600
  cr := public.town_create('ZZP2C','甲','1234'); tid3 := cr->>'town_id';
  for i in 1..10 loop perform public.town_join(tid3,(select invite from public.town_towns where id = tid3),'民'||i,'1234'); end loop;
  rep := rep||'規模費用：4 人鎮 '||public.town_pw2_cost(tid,1)||'／11 人鎮 '||public.town_pw2_cost(tid3,1)||'／'||public.town_pw2_cost(tid3,2)||'／'||public.town_pw2_cost(tid3,3)||'（期望 3000／6600／17600／4400；鎮最多 12 人，係數上限實際 2.4）'||E'\n';

  -- 2) 任命官員
  update public.town_residents set seen_at = now() where town_id = tid;
  begin perform public.town_power(ra,'1234','use','appoint',ra,1); rep := rep||'任命自己：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'任命自己：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(rb,'1234','use','appoint',rc,1); rep := rep||'非鎮長任命：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'非鎮長任命：'||sqlerrm||E'\n'; end;
  j := public.town_power(ra,'1234','use','appoint',rb,1);
  rep := rep||'任命警長：'||(j->>'msg')||' 官員='||(j->'p2'->'officers'->'sheriff'->>'name')||' 乙收到通知='||coalesce(jsonb_array_length((select items->'pwn' from public.town_residents where id = rb))::text,'0')||'（期望 乙 1）'||E'\n';
  begin perform public.town_power(ra,'1234','use','appoint',rc,1); rep := rep||'重複任命警長：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'警長已有人：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(ra,'1234','use','appoint',rb,2); rep := rep||'一人兩職：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'一人兩職：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(ra,'1234','use','appoint',rc,3); rep := rep||'免錯人：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'免職對象不是現任：'||sqlerrm||E'\n'; end;
  j := public.town_power(ra,'1234','use','appoint',rc,2);
  rep := rep||'任命財務官：'||(j->>'msg')||' 官員='||(j->'p2'->'officers'->'treasurer'->>'name')||E'\n';
  begin perform public.town_power(rb,'1234','resign',null,null,null,'treasurer'); rep := rep||'替別人辭職：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'不是財務官去辭：'||sqlerrm||E'\n'; end;
  j := public.town_power(rc,'1234','resign',null,null,null,'treasurer');
  rep := rep||'財務官辭職：'||(j->>'msg')||' 官員剩='||(select string_agg(key,',') from jsonb_each((j->'p2'->'officers')::jsonb))||'（期望 sheriff）'||E'\n';
  j := public.town_power(ra,'1234','use','appoint',rc,2);
  j := public.town_power(ra,'1234','use','appoint',rc,4);
  rep := rep||'免職財務官：'||(j->>'msg')||' 剩='||(select string_agg(key,',') from jsonb_each((j->'p2'->'officers')::jsonb))||' 丙通知='||coalesce(jsonb_array_length((select items->'pwn' from public.town_residents where id = rc))::text,'0')||E'\n';
  rep := rep||'動態 mayor 含警長任命：'||(select count(*) from public.town_events where town_id = tid and kind = 'mayor' and msg like '%任命%警長%')||'（期望 1）'||E'\n';
  cr := public.town_create('ZZP2B','己','1234'); tid2 := cr->>'town_id';
  jn := public.town_join(tid2,(select invite from public.town_towns where id = tid2),'庚','1234');
  begin perform public.town_power((cr->>'resident_id')::bigint,'1234','use','appoint',(jn->>'resident_id')::bigint,1); rep := rep||'2 人鎮任命：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'2 人鎮任命：'||sqlerrm||E'\n'; end;

  -- 3) 警長（乙）與財務官（丙，重新任命）
  j := public.town_power(ra,'1234','use','appoint',rc,2);
  update public.town_residents set place='street', sleeping=false, money=5000, seen_at=now(), items = items - 'pwn' where town_id = tid;
  update public.town_towns set fund = 20000 where id = tid;
  update public.town_powers set log = '[]'::jsonb where town_id = tid;
  begin perform public.town_power(rd,'1234','use','jail',rc,30); rep := rep||'平民關人：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'平民關人：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(rb,'1234','use','jail',rd,90); rep := rep||'警長關 90 分：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'警長關 90 分：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(rb,'1234','use','jail',ra,30); rep := rep||'警長關鎮長：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'警長關鎮長：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(rb,'1234','use','free',rd); rep := rep||'警長放人：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'警長用放人：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(rb,'1234','use','fine',rd,100); rep := rep||'警長罰款：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'警長罰款：'||sqlerrm||E'\n'; end;
  j := public.town_power(rb,'1234','use','jail',rd,30);
  select * into r1 from public.town_residents where id = rd;
  rep := rep||'警長關人：'||(j->>'msg')||' 丁入獄='||public.town_jailed(r1)||' via='||(select z.e->>'via' from public.town_powers p, jsonb_array_elements(p.log) z(e) where p.town_id = tid and z.e->>'k' = 'jail' limit 1)||' 可申訴='||(select z.e->>'ap' from public.town_powers p, jsonb_array_elements(p.log) z(e) where p.town_id = tid and z.e->>'k' = 'jail' limit 1)||'（期望 sheriff true）'||E'\n';
  rep := rep||'動態文字：'||(select msg from public.town_events where town_id = tid and kind = 'mayor' and msg like '警長%' limit 1)||E'\n';
  begin perform public.town_power(rb,'1234','use','jail',rc,30); rep := rep||'警長第 2 次：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'警長一天第 2 次：'||sqlerrm||E'\n'; end;
  -- 計入鎮長的全鎮每日次數：塞滿 3 筆，另一天的警長也不能再關
  update public.town_powers set log = (select jsonb_agg(e || '{"via":"mayor"}'::jsonb) from jsonb_array_elements(log) e) where town_id = tid;
  update public.town_powers set log = log || '[{"k":"jail","t":"9991","at":"2026-01-01T00:00:00Z","via":"mayor"}]'::jsonb where town_id = tid;
  update public.town_powers set log = (select jsonb_agg(case when e->>'t' = '9991' then e || jsonb_build_object('at', now()) else e end) from jsonb_array_elements(log) e) where town_id = tid;
  update public.town_powers set log = log || jsonb_build_array(jsonb_build_object('k','jail','t','9992','at',now(),'via','mayor'), jsonb_build_object('k','jail','t','9993','at',now(),'via','mayor')) where town_id = tid;
  update public.town_residents set items = items - 'jl' - 'jp' where id = rd;
  begin perform public.town_power(rb,'1234','use','jail',rc,30); rep := rep||'官員超過全鎮每日次數：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'警長 or 全鎮次數：'||sqlerrm||E'\n'; end;
  -- 財務官（丙）
  update public.town_powers set log = '[]'::jsonb where town_id = tid;
  v_f0 := (select fund from public.town_towns where id = tid); v_m0 := (select sum(money) from public.town_residents where town_id = tid);
  begin perform public.town_power(rc,'1234','use','grant',rd,2000); rep := rep||'財務官 2000：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'財務官超過 1500：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(rc,'1234','use','grant',rc,500); rep := rep||'財務官給自己：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'財務官給自己：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(rc,'1234','use','grant',rd,500,'vote'); rep := rep||'財務官交投票：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'財務官交投票：'||sqlerrm||E'\n'; end;
  j := public.town_power(rc,'1234','use','grant',rd,500);
  rep := rep||'財務官發補助：'||(j->>'msg')||' 基金 '||v_f0||'→'||(select fund from public.town_towns where id = tid)||'（期望 −500）丁錢='||(select money from public.town_residents where id = rd)||'（期望 5500）可申訴='||(select z.e->>'ap' from public.town_powers p, jsonb_array_elements(p.log) z(e) where p.town_id = tid and z.e->>'k' = 'grant' limit 1)||E'\n';
  begin perform public.town_power(rc,'1234','use','grant',rb,300); rep := rep||'財務官第 2 次：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'財務官一天第 2 次：'||sqlerrm||E'\n'; end;
  -- 申訴推翻補助 → 收回
  select z.e->>'id' into lid from public.town_powers p, jsonb_array_elements(p.log) as z(e) where p.town_id = tid and z.e->>'k' = 'grant' limit 1;
  perform public.town_power(rb,'1234','appeal',null,null,null,lid); perform public.town_power(rd,'1234','vote',null,null,null,'yes');
  update public.town_powers set vote = jsonb_set(vote, '{end}', to_jsonb((now() - interval '1 minute')::text)) where town_id = tid;
  perform public.town_power(rb,'1234','view');
  rep := rep||'申訴推翻補助：丁錢='||(select money from public.town_residents where id = rd)||' 基金='||(select fund from public.town_towns where id = tid)||'（期望 5000 與 '||v_f0||'）錢合計差='||((select sum(money) from public.town_residents where town_id = tid) - v_m0)||'（期望 0）'||E'\n';
  -- 補助：丁先花掉錢，只收回剩下的
  update public.town_powers set log = '[]'::jsonb where town_id = tid;
  perform public.town_power(rc,'1234','use','grant',rd,500);
  update public.town_residents set money = 120 where id = rd;
  select z.e->>'id' into lid from public.town_powers p, jsonb_array_elements(p.log) as z(e) where p.town_id = tid and z.e->>'k' = 'grant' limit 1;
  perform public.town_power(rb,'1234','appeal',null,null,null,lid); perform public.town_power(rd,'1234','vote',null,null,null,'yes');
  update public.town_powers set vote = jsonb_set(vote, '{end}', to_jsonb((now() - interval '1 minute')::text)) where town_id = tid;
  perform public.town_power(rb,'1234','view');
  rep := rep||'補助被花掉再推翻：丁錢='||(select money from public.town_residents where id = rd)||'（期望 0，不變負）'||E'\n';
  -- 鎮長自己的補助照舊不能申訴
  update public.town_powers set log = '[]'::jsonb where town_id = tid;
  perform public.town_power(ra,'1234','use','grant',rd,300);
  select z.e->>'id' into lid from public.town_powers p, jsonb_array_elements(p.log) as z(e) where p.town_id = tid and z.e->>'k' = 'grant' limit 1;
  begin perform public.town_power(rb,'1234','appeal',null,null,null,lid); rep := rep||'鎮長補助申訴：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'鎮長補助申訴：'||sqlerrm||E'\n'; end;
  -- 任期到了：官員失效
  update public.town_powers set officers = jsonb_set(officers, '{sheriff,until}', to_jsonb((now() - interval '1 minute')::text)) where town_id = tid;
  update public.town_powers set log = '[]'::jsonb where town_id = tid;
  begin perform public.town_power(rb,'1234','use','jail',rd,30); rep := rep||'任期過了還能關人：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'任期過了的警長：'||sqlerrm||E'\n'; end;
  rep := rep||'任期過了 view 官員='||coalesce((select string_agg(key,',') from jsonb_each((public.town_power(rb,'1234','view')->'p2'->'officers')::jsonb)),'無')||'（期望 treasurer）'||E'\n';
  j := public.town_power(ra,'1234','use','appoint',rd,1);
  rep := rep||'任期過了可重新任命：'||(j->>'msg')||E'\n';

  -- 4) 全民紅包（要在 town_payout_cd.sql 之後：冷卻改讀 pay_at，重設冷卻要連 pay_at 一起清）
  update public.town_residents set seen_at = now(), money = 1000, items = '{}'::jsonb, place='street' where town_id = tid;
  update public.town_residents set seen_at = now() - interval '4 days' where id = rd;   -- 丁 4 天沒上線 → 活躍 3 人
  update public.town_towns set fund = 10000 where id = tid;
  update public.town_powers set log = '[]'::jsonb, pay_at = null where town_id = tid;
  v_f0 := 10000; v_m0 := (select sum(money) from public.town_residents where town_id = tid);
  begin perform public.town_power(rb,'1234','use','payout',null,5); rep := rep||'非鎮長紅包：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'非鎮長紅包：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(ra,'1234','use','payout',null,15); rep := rep||'15% 直接發：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'15% 直接發：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(ra,'1234','use','payout',null,25); rep := rep||'25%：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'超過 20%：'||sqlerrm||E'\n'; end;
  j := public.town_power(ra,'1234','use','payout',null,10);
  rep := rep||'紅包 10%：'||(j->>'msg')||' 基金='||(select fund from public.town_towns where id = tid)||'（期望 9000）甲='||(select money from public.town_residents where id = ra)||' 乙='||(select money from public.town_residents where id = rb)||' 丙='||(select money from public.town_residents where id = rc)||'（期望 1333 ×3）4 天沒上線的丁='||(select money from public.town_residents where id = rd)||'（期望 1000）'||E'\n';
  rep := rep||'紅包守恆：錢+基金差='||((select sum(money) from public.town_residents where town_id = tid) + (select fund from public.town_towns where id = tid) - v_m0 - v_f0)||'（期望 0）luck 動態='||(select count(*) from public.town_events where town_id = tid and kind = 'luck' and msg like '%全民紅包%')||'（期望 3）'||E'\n';
  begin perform public.town_power(ra,'1234','use','payout',null,5); rep := rep||'3 天內再發：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'3 天冷卻：'||sqlerrm||E'\n'; end;
  -- 活躍不到 3 人
  update public.town_powers set log = '[]'::jsonb, pay_at = null where town_id = tid;
  update public.town_residents set seen_at = now() - interval '4 days' where id = rc;
  begin perform public.town_power(ra,'1234','use','payout',null,5); rep := rep||'活躍 2 人：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'活躍 2 人：'||sqlerrm||E'\n'; end;
  update public.town_residents set seen_at = now() where id = rc;
  -- 每人上限 2000
  update public.town_towns set fund = 4000000 where id = tid;
  update public.town_powers set log = '[]'::jsonb, pay_at = null where town_id = tid;
  v_m0 := (select sum(money) from public.town_residents where town_id = tid);
  j := public.town_power(ra,'1234','use','payout',null,10);
  rep := rep||'每人上限：基金 4000000 發 10% → 基金='||(select fund from public.town_towns where id = tid)||'（期望 3994000：3 人 ×2000）錢增='||((select sum(money) from public.town_residents where town_id = tid) - v_m0)||'（期望 6000）'||E'\n';
  -- 基金太少
  update public.town_towns set fund = 10 where id = tid;
  update public.town_powers set log = '[]'::jsonb, pay_at = null where town_id = tid;
  begin perform public.town_power(ra,'1234','use','payout',null,5); rep := rep||'基金 10：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'基金太少：'||sqlerrm||E'\n'; end;
  -- 投票通過：15%（> 10%）
  update public.town_towns set fund = 30000 where id = tid;
  update public.town_powers set log = '[]'::jsonb, pay_at = null where town_id = tid;
  v_f0 := 30000; v_m0 := (select sum(money) from public.town_residents where town_id = tid);
  j := public.town_power(ra,'1234','use','payout',null,15,'vote');
  rep := rep||'紅包投票發起：'||(j->>'msg')||E'\n';
  perform public.town_power(rb,'1234','vote',null,null,null,'yes');
  update public.town_powers set vote = jsonb_set(vote, '{end}', to_jsonb((now() - interval '1 minute')::text)) where town_id = tid;
  perform public.town_power(rc,'1234','view');
  rep := rep||'紅包投票通過（贊成 2 票就夠）：基金='||(select fund from public.town_towns where id = tid)||'（期望 25500 = 30000 − 3×1500）錢增='||((select sum(money) from public.town_residents where town_id = tid) - v_m0)||'（期望 4500）紀錄 via='||(select z.e->>'via' from public.town_powers p, jsonb_array_elements(p.log) z(e) where p.town_id = tid and z.e->>'k' = 'payout' limit 1)||E'\n';
  -- 投票沒過：只有發起人 1 票
  update public.town_powers set log = '[]'::jsonb, pay_at = null where town_id = tid;
  perform public.town_power(ra,'1234','use','payout',null,15,'vote');
  update public.town_powers set vote = jsonb_set(vote, '{end}', to_jsonb((now() - interval '1 minute')::text)) where town_id = tid;
  perform public.town_power(rc,'1234','view');
  rep := rep||'紅包投票 1 票沒過：基金='||(select fund from public.town_towns where id = tid)||'（期望仍 25500）'||E'\n';
  -- 5) 搬設施登記
  begin perform public.town_power(ra,'1234','use','relocate'); rep := rep||'搬設施走這裡：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'搬設施要到不動產公司：'||sqlerrm||E'\n'; end;
  rep := rep||'名稱：'||public.town_pw_name('event')||'／'||public.town_pw_name('appoint')||'／'||public.town_pw_name('payout')||'／'||public.town_pw_name('relocate')||E'\n';
  -- 6) 舊權力不受影響
  update public.town_residents set place='street', sleeping=false, money=5000, items='{}'::jsonb, seen_at=now() where town_id = tid;
  update public.town_powers set log = '[]'::jsonb, pay_at = null where town_id = tid;
  j := public.town_power(ra,'1234','use','jail',rb,30);
  rep := rep||'舊關人照常：'||(j->>'msg')||E'\n';
  rep := rep||'toggle 不能關新權力？（可關 event 屬於設計：）'||(case when (select count(*) from public.town_powers where town_id = tid) = 1 then 'ok' else '?' end)||E'\n';
  -- 7) 結算
  rep := rep||'錢最小='||(select min(money) from public.town_residents where town_id in (tid,tid2,tid3))||'（期望 ≥ 0）基金最小='||(select min(fund) from public.town_towns where id in (tid,tid2,tid3))||'（期望 ≥ 0）'||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;
