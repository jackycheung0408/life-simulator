-- 公共建設實測：接在 town.sql、town_social.sql、town_fi.sql、town_jail.sql、town_civic.sql、town_wake_out.sql 之後執行，結果在錯誤訊息 REPORT，整段 rollback（測試鎮，不碰真人）
-- 檢查：醫院（送醫 town_admit、看診、出院、探病）、警察局（9 折繳罰單、自首、報案）、市政廳（公告、建設案投票、結算、基金不夠、使用建好的設施）
do $$
declare cr json; jn json; ra bigint; rb bigint; rc bigint; tid text; rep text := ''; i int; r1 public.town_residents; r2 public.town_residents; j json; n int; f0 bigint;
begin
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  cr := public.town_create('ZZCV','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';   -- 甲 = 鎮長
  jn := public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'); rb := (jn->>'resident_id')::bigint;
  jn := public.town_join(tid, (select invite from public.town_towns where id = tid), '丙','1234'); rc := (jn->>'resident_id')::bigint;
  update public.town_residents set place='street', x=40, y=8, sleeping=false, energy=90, hunger=90, fun=90, hygiene=50, bladder=90, money=5000, items='{}'::jsonb, seen_at=now(), updated_at=now() where town_id=tid;

  -- ── 醫院 ──
  -- 1) town_admit：昏倒的人被送到醫院門口，items.fi = hospital
  select * into r1 from public.town_residents where id = rb;
  r1.items := jsonb_set(jsonb_set(r1.items,'{faint}',to_jsonb((now()+interval '2 hours')::text)),'{hosp}','1'::jsonb); r1.sleeping := true; r1 := public.town_admit(r1);
  rep := rep||'送醫：place='||r1.place||' x,y='||r1.x||','||r1.y||' fi='||coalesce(r1.items->>'fi','無')||'（期望 hospital 61,14 hospital）'||E'\n';
  update public.town_residents set place=r1.place, x=r1.x, y=r1.y, sleeping=true, items=r1.items where id=rb;
  -- 2) 人在監獄不搬
  select * into r2 from public.town_residents where id = rc; r2.place := 'jail'; r2 := public.town_admit(r2);
  rep := rep||'監獄裡的人不送醫：place='||r2.place||'（期望 jail）'||E'\n';
  -- 3) 甲走到醫院：看診 €150、一天一次、清潔 +40、精力 +20
  update public.town_residents set place='hospital', x=61, y=14, items=jsonb_build_object('fi','hospital'), hygiene=50, energy=40 where id=ra;
  j := public.town_hospital(ra,'1234','consult');
  select * into r1 from public.town_residents where id = ra;
  rep := rep||'看診：錢 '||r1.money||'（期望 4850）清潔 '||round(r1.hygiene::numeric)||'（期望約 90）精力 '||round(r1.energy::numeric)||'（期望約 60）'||E'\n';
  begin perform public.town_hospital(ra,'1234','consult'); rep := rep||'同一天再看診：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'同一天再看診：'||sqlerrm||E'\n'; end;
  -- 4) 探病：乙住院中，甲去探；60 分鐘內不能再探
  j := public.town_hospital(ra,'1234','visit',rb);
  select * into r1 from public.town_residents where id = rb;
  rep := rep||'探病：'||(j->>'msg')||' 乙心情 '||round(r1.fun::numeric)||'（期望約 100）'||E'\n';
  begin perform public.town_hospital(ra,'1234','visit',rb); rep := rep||'60 分鐘內再探：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'60 分鐘內再探：'||sqlerrm||E'\n'; end;
  -- 5) 住院中不能看診、不能出院；甲不在醫院不能做
  update public.town_residents set sleeping=true where id=rb;
  begin perform public.town_hospital(rb,'1234','discharge'); rep := rep||'住院中出院：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'住院中出院：'||sqlerrm||E'\n'; end;
  begin perform public.town_hospital(rc,'1234','consult'); rep := rep||'不在醫院看診：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'不在醫院看診：'||sqlerrm||E'\n'; end;
  -- 6) 出院：faint 結束後（把 faint 設成過去）走 town_tick 醒來，再出院
  update public.town_residents set updated_at = now() - interval '2 minutes', items = jsonb_set(items,'{faint}',to_jsonb((now()-interval '1 minute')::text)) where id=rb;   -- tick 要動起來：updated_at 不能是現在
  perform public.town_hospital(rb,'1234','discharge');
  select * into r1 from public.town_residents where id = rb;
  rep := rep||'出院後：place='||r1.place||' fi='||coalesce(r1.items->>'fi','無')||' sleeping='||r1.sleeping||'（期望 street 無 false）'||E'\n';
  -- 7) 鎮長關掉醫院：不送醫、不能用
  update public.town_towns set off = array['hospital'] where id = tid;
  select * into r2 from public.town_residents where id = rc; r2.place := 'street'; r2 := public.town_admit(r2);
  rep := rep||'醫院關掉不送醫：place='||r2.place||'（期望 street）'||E'\n';
  update public.town_towns set off = '{}' where id = tid;

  -- ── 警察局 ──
  update public.town_residents set place='police', x=58, y=21, items=jsonb_build_object('fi','police','tk', jsonb_build_array(jsonb_build_object('id','t1','k','red','a',900,'at',now(),'due',now()+interval '1 day'),jsonb_build_object('id','t2','k','spd','a',600,'at',now(),'due',now()+interval '1 day'))), money=2000 where id=ra;
  j := public.town_police(ra,'1234','pay','all');
  select * into r1 from public.town_residents where id = ra;
  rep := rep||'繳罰單 9 折：'||(j->>'msg')||' 錢 '||r1.money||'（期望 2000-810-540=650）剩罰單 '||jsonb_array_length(coalesce(r1.items->'tk','[]'::jsonb))||'（期望 0）'||E'\n';
  begin perform public.town_police(ra,'1234','pay','all'); rep := rep||'沒有罰單還繳：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'沒有罰單還繳：'||sqlerrm||E'\n'; end;
  begin perform public.town_police(ra,'1234','surrender'); rep := rep||'沒被通緝自首：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'沒被通緝自首：'||sqlerrm||E'\n'; end;
  -- 自首：通緝中 → 關 30 分鐘、通緝解除、不惹事
  update public.town_residents set items = jsonb_set(items,'{wt}',to_jsonb((now()+interval '2 hours')::text)) where id=ra;
  j := public.town_police(ra,'1234','surrender');
  select * into r1 from public.town_residents where id = ra;
  rep := rep||'自首：place='||r1.place||' wt='||coalesce(r1.items->>'wt','無')||' jl 還有 '||round(extract(epoch from ((r1.items->>'jl')::timestamptz - now()))/60)||' 分鐘 bad='||coalesce(r1.items#>>'{jp,bad}','?')||' 前科='||public.town_pr_on(r1)||'（期望 jail 無 約 30 0 true）'||E'\n';
  -- 報案：乙對甲做過惡作劇，甲報案；乙記 1 點；巡警機率 ×1.1；不會入獄
  update public.town_residents set place='police', x=58, y=21, items='{}'::jsonb, money=1000 where id=ra;
  begin perform public.town_police(ra,'1234','report',rb::text); rep := rep||'沒被整就報案：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'沒被整就報案：'||sqlerrm||E'\n'; end;
  insert into public.town_events(town_id,actor,target,kind,msg) values (tid, rb, ra, 'prank', '乙 惡作劇');
  j := public.town_police(ra,'1234','report',rb::text);
  select * into r1 from public.town_residents where id = rb;
  rep := rep||'報案：'||(j->>'msg')||' 乙 rp='||coalesce(r1.items->'rp'->>'n','無')||' 巡警倍率 '||public.town_pr_mult(r1)||'（期望 1 1.1）入獄='||public.town_jailed(r1)||'（期望 false）'||E'\n';
  begin perform public.town_police(ra,'1234','report',rb::text); rep := rep||'同天再報案：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'同天再報案：'||sqlerrm||E'\n'; end;
  j := public.town_police(ra,'1234','stats');
  rep := rep||'治安統計：'||j::text||E'\n';

  -- ── 市政廳 ──
  update public.town_residents set place='townhall', x=68, y=5, items='{}'::jsonb where town_id=tid;
  update public.town_towns set fund = 20000 where id = tid;
  -- 公告：鎮長才能發、最多 3 則
  begin perform public.town_civic(rb,'1234','announce','乙發公告'); rep := rep||'非鎮長發公告：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'非鎮長發公告：'||sqlerrm||E'\n'; end;
  for i in 1..4 loop perform public.town_civic(ra,'1234','announce','公告 '||i); end loop;
  j := public.town_civic(ra,'1234','view');
  rep := rep||'公告 4 則發出後：'||json_array_length(j->'ann')||' 則（期望 3），最新 '||(j->'ann'->0->>'t')||E'\n';
  -- 建設案：只有鎮長、基金不夠被擋
  begin perform public.town_civic(rb,'1234','propose','bench2'); rep := rep||'非鎮長提建設案：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'非鎮長提建設案：'||sqlerrm||E'\n'; end;
  begin perform public.town_civic(ra,'1234','propose','statue'); rep := rep||'基金不夠提雕像：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'基金不夠提雕像：'||sqlerrm||E'\n'; end;
  j := public.town_civic(ra,'1234','propose','bench2');
  rep := rep||'提長椅：'||(j->'vote')::text||E'\n';
  begin perform public.town_civic(rb,'1234','propose','poll','要辦派對嗎'); rep := rep||'已有投票又發起：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'已有投票又發起：'||sqlerrm||E'\n'; end;
  -- 投票：甲、乙贊成，丙反對；重複投被擋
  perform public.town_civic(ra,'1234','vote','yes'); perform public.town_civic(rb,'1234','vote','yes'); perform public.town_civic(rc,'1234','vote','no');
  begin perform public.town_civic(ra,'1234','vote','no'); rep := rep||'重複投票：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'重複投票：'||sqlerrm||E'\n'; end;
  -- 24 小時內不結算；把 end 設成過去 → 結算：通過（贊成 2 > 反對 1，3 票 ≥ 2）、扣基金 15000、proj 有 bench2
  j := public.town_civic(ra,'1234','view');
  rep := rep||'投票中 proj='||(j->'proj')::text||' 基金 '||(j->>'fund')||'（期望 [] 20000）'||E'\n';
  update public.town_civic set vote = jsonb_set(vote,'{end}',to_jsonb((now()-interval '1 minute')::text)) where town_id = tid;
  j := public.town_civic(ra,'1234','view');
  rep := rep||'結算後：proj='||(j->'proj')::text||' 基金 '||(j->>'fund')||' vote='||coalesce((j->'vote')::text,'null')||'（期望 ["bench2"] 5000 null）'||E'\n'||'  結果：'||(j->'hist'->0->>'m')||E'\n';
  -- 反對票多：不通過、基金不扣；票數不夠：不通過
  begin perform public.town_civic(ra,'1234','propose','lamp'); rep := rep||'基金 5000 提路燈（20000）：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'基金 5000 提路燈（20000）：'||sqlerrm||E'\n'; end;
  update public.town_towns set fund = 40000 where id = tid;
  perform public.town_civic(ra,'1234','propose','lamp');
  perform public.town_civic(ra,'1234','vote','yes');
  update public.town_civic set vote = jsonb_set(vote,'{end}',to_jsonb((now()-interval '1 minute')::text)) where town_id = tid;
  j := public.town_civic(ra,'1234','view');
  rep := rep||'只有 1 票（要 2 票）：proj='||(j->'proj')::text||' 基金 '||(j->>'fund')||'（期望 ["bench2"] 40000）'||E'\n'||'  結果：'||(j->'hist'->0->>'m')||E'\n';
  -- 發起一般投票（任何居民），題目有髒話被擋
  j := public.town_civic(rb,'1234','propose','poll','要辦派對嗎');
  rep := rep||'居民發起投票：'||(j->'vote'->>'q')||E'\n';
  -- 使用建好的長椅：要在 (48,8) 附近、10 分鐘一次、不給錢
  update public.town_residents set place='street', x=48, y=8, energy=50, fun=50 where id=ra;
  j := public.town_civic_use(ra,'1234','bench2');
  select * into r1 from public.town_residents where id = ra;
  rep := rep||'坐長椅：'||(j->>'msg')||' 精力 '||round(r1.energy::numeric)||'（期望 65）心情 '||round(r1.fun::numeric)||'（期望 53）錢 '||r1.money||'（期望 1000 不變）'||E'\n';
  begin perform public.town_civic_use(ra,'1234','bench2'); rep := rep||'10 分鐘內再坐：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'10 分鐘內再坐：'||sqlerrm||E'\n'; end;
  update public.town_residents set x=30, y=30 where id=ra;
  begin perform public.town_civic_use(ra,'1234','bench2'); rep := rep||'離得太遠：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'離得太遠：'||sqlerrm||E'\n'; end;
  begin perform public.town_civic_use(ra,'1234','statue'); rep := rep||'還沒蓋好的雕像：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'還沒蓋好的雕像：'||sqlerrm||E'\n'; end;
  rep := rep||'公開清單：'||public.town_civic_proj_list(tid)::text||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;
