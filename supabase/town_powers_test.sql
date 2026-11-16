-- 鎮長管理權實測：接在 town.sql、town_social.sql、town_fi.sql、town_jail.sql、town_civic.sql、town_powers.sql 之後執行，結果在錯誤訊息 REPORT，整段 rollback（測試鎮，不碰真人）
-- 檢查：關人／放人／罰款／補助／彈劾各自成功，各條安全閥（自己、鎮長、睡覺、重複、每日上限、數字範圍、冷卻、人數、關掉）被擋，申訴推翻（放人、退罰款），投票通過的補助，錢與基金不變負、舊角色（items 空）可用
do $$
declare cr json; jn json; ra bigint; rb bigint; rc bigint; rd bigint; tid text; tid2 text; rep text := ''; j json; r1 public.town_residents; f0 bigint; lid text; i int; ok int;
begin
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  cr := public.town_create('ZZPW','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';   -- 甲 = 鎮長
  jn := public.town_join(tid,(select invite from public.town_towns where id = tid),'乙','1234'); rb := (jn->>'resident_id')::bigint;
  jn := public.town_join(tid,(select invite from public.town_towns where id = tid),'丙','1234'); rc := (jn->>'resident_id')::bigint;
  jn := public.town_join(tid,(select invite from public.town_towns where id = tid),'丁','1234'); rd := (jn->>'resident_id')::bigint;
  update public.town_residents set place='street', x=40, y=8, sleeping=false, energy=90, hunger=90, fun=90, hygiene=50, bladder=90, money=5000, items='{}'::jsonb, seen_at=now(), updated_at=now() where town_id=tid;
  update public.town_towns set fund = 600 where id = tid;

  -- 1) 關人
  j := public.town_power(ra,'1234','use','jail',rb,60);
  select * into r1 from public.town_residents where id = rb;
  rep := rep||'關人：'||(j->>'msg')||' place='||r1.place||' 入獄='||public.town_jailed(r1)||' 前科='||coalesce(r1.items->>'pr','無')||' pwn='||coalesce(jsonb_array_length(r1.items->'pwn')::text,'0')||'（期望 jail true 無 1）'||E'\n';
  rep := rep||'動態 kind=mayor：'||(select count(*) from public.town_events where town_id=tid and kind='mayor')||'（期望 1）'||E'\n';
  -- 2) 安全閥
  begin perform public.town_power(ra,'1234','use','jail',ra,60); rep := rep||'關自己：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'關自己：'||sqlerrm||E'\n'; end;
  update public.town_powers set log = (select jsonb_agg(e || jsonb_build_object('at', now() - interval '30 hours')) from jsonb_array_elements(log) e) where town_id = tid;
  update public.town_residents set mayor = true where id = rc;
  begin perform public.town_power(ra,'1234','use','jail',rc,60); rep := rep||'關另一位鎮長：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'關另一位鎮長：'||sqlerrm||E'\n'; end;
  update public.town_residents set mayor = false where id = rc;
  begin perform public.town_power(rd,'1234','use','jail',rb,60); rep := rep||'非鎮長行使：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'非鎮長行使：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(ra,'1234','use','jail',rb,60); rep := rep||'關已被關的人：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'關已被關的人：'||sqlerrm||E'\n'; end;
  update public.town_powers set log = (select jsonb_agg(e || jsonb_build_object('at', now() - interval '30 hours')) from jsonb_array_elements(log) e) where town_id = tid;   -- 把紀錄往前推到昨天，避開冷卻與每日上限
  update public.town_residents set sleeping = true where id = rc;
  begin perform public.town_power(ra,'1234','use','jail',rc,60); rep := rep||'關睡覺的人：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'關睡覺的人：'||sqlerrm||E'\n'; end;
  update public.town_residents set sleeping = false, place='hospital' where id = rc;
  begin perform public.town_power(ra,'1234','use','jail',rc,60); rep := rep||'關住院的人：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'關住院的人：'||sqlerrm||E'\n'; end;
  update public.town_residents set place='street' where id = rc;
  begin perform public.town_power(ra,'1234','use','jail',rc,5); rep := rep||'刑期 5 分鐘：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'刑期 5 分鐘：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(ra,'1234','use','jail',rc,500); rep := rep||'刑期 500 分鐘：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'刑期 500 分鐘：'||sqlerrm||E'\n'; end;
  -- 3) 每人每天一次、全鎮每天 3 人、冷卻
  perform public.town_power(ra,'1234','use','jail',rc,30);
  begin perform public.town_power(ra,'1234','use','jail',rd,30); rep := rep||'10 分鐘內再關：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'冷卻：'||sqlerrm||E'\n'; end;
  update public.town_powers set log = (select jsonb_agg(case when (e->>'t')::bigint = rc then e else e || jsonb_build_object('at', now() - interval '30 hours') end) from jsonb_array_elements(log) e) where town_id = tid;
  -- 丙今天已被關過（把他放出來再試：每人每天只能被關一次）
  perform public.town_power(ra,'1234','use','free',rc);
  update public.town_powers set log = (select jsonb_agg(e || jsonb_build_object('at', now() - interval '20 minutes')) from jsonb_array_elements(log) e where e->>'k' = 'jail') where town_id = tid;
  update public.town_powers set log = (select jsonb_agg(e) from jsonb_array_elements(log) e) where town_id = tid;
  begin perform public.town_power(ra,'1234','use','jail',rc,30); rep := rep||'同一人同一天再關：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'同一人同一天再關：'||sqlerrm||E'\n'; end;
  -- 全鎮每天 3 人：目前今天已有 丙（乙那筆被推到 10 分鐘前也算今天）→ 湊滿 3 筆再試第 4 筆
  update public.town_powers set log = (select jsonb_agg(e || jsonb_build_object('at', now() - interval '20 minutes')) from jsonb_array_elements(log) e) where town_id = tid;
  update public.town_powers set log = log || jsonb_build_array(jsonb_build_object('id','fake1','k','jail','by',ra,'bn','甲','t',999,'tn','x','n',30,'at',now()-interval '20 minutes','ap',true,'undone',false,'via','mayor'), jsonb_build_object('id','fake2','k','jail','by',ra,'bn','甲','t',998,'tn','y','n',30,'at',now()-interval '20 minutes','ap',true,'undone',false,'via','mayor')) where town_id = tid;
  begin perform public.town_power(ra,'1234','use','jail',rd,30); rep := rep||'全鎮每天 3 人：第 4 人沒被擋（錯）'||E'\n'; exception when others then rep := rep||'全鎮每天上限：'||sqlerrm||E'\n'; end;
  -- 4) 放人
  begin perform public.town_power(ra,'1234','use','free',rd); rep := rep||'放沒被關的人：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'放沒被關的人：'||sqlerrm||E'\n'; end;
  j := public.town_power(ra,'1234','use','free',rb);
  select * into r1 from public.town_residents where id = rb;
  rep := rep||'放人：'||(j->>'msg')||' 入獄='||public.town_jailed(r1)||'（期望 false）'||E'\n';
  -- 5) 罰款（紀錄清乾淨再測）
  update public.town_powers set log = '[]'::jsonb where town_id = tid;
  f0 := (select fund from public.town_towns where id = tid);
  j := public.town_power(ra,'1234','use','fine',rb,500);
  select * into r1 from public.town_residents where id = rb;
  rep := rep||'罰款：'||(j->>'msg')||' 乙錢 '||r1.money||'（期望 4500）基金 '||(select fund from public.town_towns where id = tid)||'（期望 '||(f0+500)||'）'||E'\n';
  begin perform public.town_power(ra,'1234','use','fine',rc,99); rep := rep||'罰 99：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'罰 99：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(ra,'1234','use','fine',rc,2001); rep := rep||'罰 2001：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'罰 2001：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(ra,'1234','use','fine',ra,200); rep := rep||'罰自己：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'罰自己：'||sqlerrm||E'\n'; end;
  update public.town_powers set log = (select jsonb_agg(e || jsonb_build_object('at', now() - interval '30 hours')) from jsonb_array_elements(log) e) where town_id = tid;
  update public.town_residents set money = 300 where id = rc;
  j := public.town_power(ra,'1234','use','fine',rc,2000);
  select * into r1 from public.town_residents where id = rc;
  rep := rep||'罰款超過身上的錢：'||(j->>'msg')||' 丙錢 '||r1.money||'（期望 0，不是負的）'||E'\n';
  begin perform public.town_power(ra,'1234','use','fine',rd,0); rep := rep||'罰 0：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'罰 0：'||sqlerrm||E'\n'; end;
  update public.town_residents set money = 0 where id = rd;
  update public.town_powers set log = (select jsonb_agg(e || jsonb_build_object('at', now() - interval '30 hours')) from jsonb_array_elements(log) e) where town_id = tid;
  begin perform public.town_power(ra,'1234','use','fine',rd,100); rep := rep||'罰沒錢的人：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'罰沒錢的人：'||sqlerrm||E'\n'; end;
  -- 6) 補助
  update public.town_towns set fund = 600 where id = tid;
  begin perform public.town_power(ra,'1234','use','grant',rb,1000); rep := rep||'基金不夠補助：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'基金不夠補助：'||sqlerrm||E'\n'; end;
  update public.town_towns set fund = 5000 where id = tid; update public.town_residents set money = 5000 where id = rb;
  j := public.town_power(ra,'1234','use','grant',rb,1000);
  select * into r1 from public.town_residents where id = rb;
  rep := rep||'補助：'||(j->>'msg')||' 乙錢 '||r1.money||'（期望 6000）基金 '||(select fund from public.town_towns where id = tid)||'（期望 4000）'||E'\n';
  begin perform public.town_power(ra,'1234','use','grant',ra,500); rep := rep||'補助自己：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'補助自己：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(ra,'1234','use','grant',rb,500); rep := rep||'同一人同一天再補助：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'同一人同一天再補助：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(ra,'1234','use','grant',rc,3001); rep := rep||'補助 3001：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'補助 3001：'||sqlerrm||E'\n'; end;
  -- 補助走居民投票（note=vote）：甲發起（自動贊成），乙丙贊成，到期結算 → 丁收到
  update public.town_powers set log = (select jsonb_agg(e || jsonb_build_object('at', now() - interval '30 hours')) from jsonb_array_elements(log) e) where town_id = tid;
  update public.town_residents set money = 100 where id = rd;
  j := public.town_power(ra,'1234','use','grant',rd,800,'vote');
  perform public.town_power(rb,'1234','vote',null,null,null,'yes'); perform public.town_power(rc,'1234','vote',null,null,null,'yes');
  begin perform public.town_power(rb,'1234','vote',null,null,null,'no'); rep := rep||'重複投票：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'重複投票：'||sqlerrm||E'\n'; end;
  update public.town_powers set vote = jsonb_set(vote, '{end}', to_jsonb((now() - interval '1 minute')::text)) where town_id = tid;
  perform public.town_power(rd,'1234','view');
  select * into r1 from public.town_residents where id = rd;
  rep := rep||'投票通過的補助：丁錢 '||r1.money||'（期望 900）基金 '||(select fund from public.town_towns where id = tid)||'（期望 3200）投票清掉='||((select vote from public.town_powers where town_id = tid) is null)||E'\n';
  -- 7) 申訴推翻：關人
  update public.town_powers set log = '[]'::jsonb where town_id = tid;
  update public.town_residents set money = 5000 where town_id = tid;
  perform public.town_power(ra,'1234','use','jail',rb,90);
  select z.e->>'id' into lid from public.town_powers p, jsonb_array_elements(p.log) as z(e) where p.town_id = tid limit 1;
  begin perform public.town_power(ra,'1234','appeal',null,null,null,lid); rep := rep||'鎮長申訴：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'鎮長申訴：'||sqlerrm||E'\n'; end;
  perform public.town_power(rc,'1234','appeal',null,null,null,lid);
  begin perform public.town_power(rd,'1234','appeal',null,null,null,lid); rep := rep||'投票中再申訴：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'投票中再申訴：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(ra,'1234','vote',null,null,null,'no'); rep := rep||'鎮長對申訴投票：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'鎮長對申訴投票：'||sqlerrm||E'\n'; end;
  perform public.town_power(rd,'1234','vote',null,null,null,'yes');
  update public.town_powers set vote = jsonb_set(vote, '{end}', to_jsonb((now() - interval '1 minute')::text)) where town_id = tid;
  perform public.town_power(rd,'1234','view');
  select * into r1 from public.town_residents where id = rb;
  rep := rep||'申訴推翻關人：乙入獄='||public.town_jailed(r1)||'（期望 false）紀錄 undone='||(select z.e->>'undone' from public.town_powers p, jsonb_array_elements(p.log) as z(e) where p.town_id = tid limit 1)||'（期望 true）'||E'\n';
  begin perform public.town_power(rc,'1234','appeal',null,null,null,lid); rep := rep||'已推翻再申訴：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'已推翻再申訴：'||sqlerrm||E'\n'; end;
  -- 申訴推翻：罰款退回；基金只剩 100 時只退 100
  update public.town_powers set log = '[]'::jsonb where town_id = tid;
  update public.town_towns set fund = 0 where id = tid; update public.town_residents set money = 5000 where id = rb;
  perform public.town_power(ra,'1234','use','fine',rb,400);
  update public.town_towns set fund = 100 where id = tid;
  select z.e->>'id' into lid from public.town_powers p, jsonb_array_elements(p.log) as z(e) where p.town_id = tid limit 1;
  perform public.town_power(rc,'1234','appeal',null,null,null,lid); perform public.town_power(rd,'1234','vote',null,null,null,'yes');
  update public.town_powers set vote = jsonb_set(vote, '{end}', to_jsonb((now() - interval '1 minute')::text)) where town_id = tid;
  perform public.town_power(rd,'1234','view');
  select * into r1 from public.town_residents where id = rb;
  rep := rep||'申訴退罰款（基金只剩 100）：乙錢 '||r1.money||'（期望 4700）基金 '||(select fund from public.town_towns where id = tid)||'（期望 0）'||E'\n';
  -- 申訴沒過：只有 1 票贊成
  update public.town_powers set log = '[]'::jsonb where town_id = tid;
  perform public.town_power(ra,'1234','use','fine',rb,200);
  select z.e->>'id' into lid from public.town_powers p, jsonb_array_elements(p.log) as z(e) where p.town_id = tid limit 1;
  perform public.town_power(rc,'1234','appeal',null,null,null,lid);
  update public.town_powers set vote = jsonb_set(vote, '{end}', to_jsonb((now() - interval '1 minute')::text)) where town_id = tid;
  perform public.town_power(rd,'1234','view');
  rep := rep||'申訴票數不夠：紀錄 undone='||(select z.e->>'undone' from public.town_powers p, jsonb_array_elements(p.log) as z(e) where p.town_id = tid limit 1)||'（期望 false）'||E'\n';
  -- 授權補助不能申訴
  update public.town_powers set log = '[]'::jsonb where town_id = tid; update public.town_towns set fund = 5000 where id = tid;
  perform public.town_power(ra,'1234','use','grant',rb,300);
  select z.e->>'id' into lid from public.town_powers p, jsonb_array_elements(p.log) as z(e) where p.town_id = tid limit 1;
  begin perform public.town_power(rc,'1234','appeal',null,null,null,lid); rep := rep||'申訴補助：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'申訴補助：'||sqlerrm||E'\n'; end;
  -- 8) 開關權力
  perform public.town_power(ra,'1234','toggle',null,null,null,'fine,grant');
  update public.town_powers set log = '[]'::jsonb where town_id = tid;
  begin perform public.town_power(ra,'1234','use','fine',rc,100); rep := rep||'關掉的罰款：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'關掉的罰款：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(ra,'1234','toggle',null,null,null,'impeach'); rep := rep||'關彈劾：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'關彈劾：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(ra,'1234','toggle',null,null,null,'build'); rep := rep||'關建設案：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'關建設案：'||sqlerrm||E'\n'; end;
  begin perform public.town_power(rb,'1234','toggle',null,null,null,''); rep := rep||'非鎮長開關：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'非鎮長開關：'||sqlerrm||E'\n'; end;
  perform public.town_power(ra,'1234','toggle',null,null,null,'');
  begin perform public.town_power(ra,'1234','use','announce'); rep := rep||'公告走這裡：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'公告走市政廳：'||sqlerrm||E'\n'; end;
  -- 9) 通知 ack
  perform public.town_power(rb,'1234','ack');
  select * into r1 from public.town_residents where id = rb;
  rep := rep||'ack：pwn='||coalesce(r1.items->>'pwn','無')||'（期望 無）'||E'\n';
  -- 10) 彈劾：鎮長不能彈劾自己；甲、乙、丙、丁 4 人，丙提名乙，丁、乙贊成 → 3 票、>2 → 換人
  begin perform public.town_power(ra,'1234','use','impeach',rb); rep := rep||'鎮長彈劾自己：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'鎮長彈劾自己：'||sqlerrm||E'\n'; end;
  perform public.town_power(rc,'1234','use','impeach',rb);
  perform public.town_power(rd,'1234','vote',null,null,null,'yes'); perform public.town_power(rb,'1234','vote',null,null,null,'yes');
  update public.town_powers set vote = jsonb_set(vote, '{end}', to_jsonb((now() - interval '1 minute')::text)) where town_id = tid;
  perform public.town_power(rd,'1234','view');
  rep := rep||'彈劾：乙鎮長='||(select mayor from public.town_residents where id = rb)||' 甲鎮長='||(select mayor from public.town_residents where id = ra)||' 鎮長人數='||(select count(*) from public.town_residents where town_id = tid and mayor)||'（期望 true false 1）'||E'\n';
  begin perform public.town_power(rc,'1234','use','impeach',ra); rep := rep||'彈劾冷卻：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'彈劾冷卻：'||sqlerrm||E'\n'; end;
  -- 11) 只有鎮長一人（另一個測試鎮）
  cr := public.town_create('ZZP2','戊','1234'); tid2 := cr->>'town_id';
  begin perform public.town_power((cr->>'resident_id')::bigint,'1234','use','jail',(cr->>'resident_id')::bigint,30); rep := rep||'單人鎮：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'單人鎮關人：'||sqlerrm||E'\n'; end;
  -- 12) 結算
  rep := rep||'錢最小='||(select min(money) from public.town_residents where town_id in (tid,tid2))||'（期望 ≥ 0）基金='||(select min(fund) from public.town_towns where id in (tid,tid2))||'（期望 ≥ 0）'||E'\n';
  rep := rep||'檢視（非鎮長）：log 筆數='||json_array_length((public.town_power(rd,'1234','view')->'log'))||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;
