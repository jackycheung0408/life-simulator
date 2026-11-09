-- 走進朋友家實測：接在 town.sql、town_visit.sql 之後執行，結果在錯誤訊息 REPORT，整段 rollback（測試鎮，不碰真人）
-- 檢查：1) 門口沒進去就煮飯、洗澡、叫醒、串門子被擋；惡作劇、丟雞蛋、留言、送禮不受影響
--       2) 在門口且屋主在屋裡才進得去；屋主在門口（dr=1）、離線、關係太差、自己不在他家門口都進不去
--       3) 進去後煮飯、洗澡可以；移動一定離開（fv 被清掉）；出門清 fv；fv 指向別人不算
do $$
declare cr json; jn json; ra bigint; rb bigint; rc bigint; tid text; rep text := ''; r1 public.town_residents; r2 public.town_residents;
begin
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  cr := public.town_create('ZZVS','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  jn := public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'); rb := (jn->>'resident_id')::bigint;
  jn := public.town_join(tid, (select invite from public.town_towns where id = tid), '丙','1234'); rc := (jn->>'resident_id')::bigint;
  update public.town_residents set energy=90, hunger=50, fun=80, hygiene=50, bladder=90, sleeping=false, money=1000, items='{}'::jsonb, seen_at=now(), updated_at=now() where id in (ra,rb,rc);
  -- 甲站在乙家門口；乙在屋裡（沒有 dr）
  update public.town_residents set place='home:'||rb where id=ra;
  update public.town_residents set place='home:'||rb where id=rb;
  -- 1) 還沒進去：煮飯、洗澡、叫醒、串門子都被擋
  begin perform public.town_act(ra,'1234','feed',target:=rb); rep := rep||'門口煮飯：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'門口煮飯：'||sqlerrm||E'\n'; end;
  begin perform public.town_act(ra,'1234','wash',target:=rb); rep := rep||'門口洗澡：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'門口洗澡：'||sqlerrm||E'\n'; end;
  begin perform public.town_act(ra,'1234','visit',target:=rb); rep := rep||'門口串門子：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'門口串門子：'||sqlerrm||E'\n'; end;
  update public.town_residents set sleeping=true, energy=100 where id=rb;
  begin perform public.town_act(ra,'1234','wakeup',target:=rb); rep := rep||'門口叫醒：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'門口叫醒：'||sqlerrm||E'\n'; end;
  update public.town_residents set sleeping=false where id=rb;
  -- 門口該能做的：惡作劇、丟雞蛋、送禮、留言
  begin perform public.town_act(ra,'1234','prank',target:=rb); rep := rep||'門口惡作劇：可以（對）'||E'\n'; exception when others then rep := rep||'門口惡作劇：被擋 '||sqlerrm||'（錯）'||E'\n'; end;
  begin perform public.town_act(ra,'1234','egg',target:=rb); rep := rep||'門口丟雞蛋：可以（對）'||E'\n'; exception when others then rep := rep||'門口丟雞蛋：被擋 '||sqlerrm||'（錯）'||E'\n'; end;
  begin perform public.town_act(ra,'1234','note',target:=rb,note:='你好'); rep := rep||'門口留言：可以（對）'||E'\n'; exception when others then rep := rep||'門口留言：被擋 '||sqlerrm||'（錯）'||E'\n'; end;
  -- 2) 進去的各種條件
  update public.town_residents set items=jsonb_build_object('dr',1) where id=rb;
  begin perform public.town_visit(ra,'1234','enter',rb); rep := rep||'屋主在門口：進得去（錯）'||E'\n'; exception when others then rep := rep||'屋主在門口：'||sqlerrm||E'\n'; end;
  update public.town_residents set items='{}'::jsonb where id=rb;
  update public.town_residents set place='plaza' where id=ra;
  begin perform public.town_visit(ra,'1234','enter',rb); rep := rep||'自己不在他家門口：進得去（錯）'||E'\n'; exception when others then rep := rep||'自己不在他家門口：'||sqlerrm||E'\n'; end;
  update public.town_residents set place='home:'||rb where id=ra;
  -- 關係太差（< -20）
  insert into public.town_bonds(town_id,a,b,score) values (tid,least(ra,rb),greatest(ra,rb),-30) on conflict (a,b) do update set score=-30;
  begin perform public.town_visit(ra,'1234','enter',rb); rep := rep||'關係 -30：進得去（錯）'||E'\n'; exception when others then rep := rep||'關係 -30：'||sqlerrm||E'\n'; end;
  update public.town_bonds set score=0 where a=least(ra,rb) and b=greatest(ra,rb);
  -- 正常進去
  perform public.town_visit(ra,'1234','enter',rb); select * into r1 from public.town_residents where id=ra;
  rep := rep||'進去後 items.fv = '||coalesce(r1.items->>'fv','無')||'（期望 '||rb||'）town_vin='||public.town_vin(r1)||E'\n';
  -- 3) 進去後煮飯、洗澡可以
  begin perform public.town_act(ra,'1234','feed',target:=rb); select * into r2 from public.town_residents where id=rb; rep := rep||'進去後煮飯：可以，乙飽足 '||round(r2.hunger::numeric)||'（原 50，期望約 +35）'||E'\n'; exception when others then rep := rep||'進去後煮飯：被擋 '||sqlerrm||'（錯）'||E'\n'; end;
  begin perform public.town_act(ra,'1234','wash',target:=rb); select * into r2 from public.town_residents where id=rb; rep := rep||'進去後洗澡：可以，乙清潔 '||round(r2.hygiene::numeric)||'（原 50，期望約 +45）'||E'\n'; exception when others then rep := rep||'進去後洗澡：被擋 '||sqlerrm||'（錯）'||E'\n'; end;
  -- fv 指向別人（丙）不算在乙家
  update public.town_residents set items=jsonb_build_object('fv',rc) where id=ra;
  select * into r1 from public.town_residents where id=ra;
  rep := rep||'fv 指向丙但人在乙家：town_vin='||public.town_vin(r1)||'（期望 false）'||E'\n';
  begin perform public.town_act(ra,'1234','feed',target:=rb); rep := rep||'fv 指向別人還能煮飯（錯）'||E'\n'; exception when others then rep := rep||'fv 指向別人煮飯：'||sqlerrm||E'\n'; end;
  -- 出門清掉 fv
  update public.town_residents set items=jsonb_build_object('fv',rb) where id=ra;
  perform public.town_visit(ra,'1234','exit'); select * into r1 from public.town_residents where id=ra;
  rep := rep||'出門後 fv = '||coalesce(r1.items->>'fv','無')||'（期望 無）'||E'\n';
  -- 移動一定離開朋友家
  update public.town_residents set items=jsonb_build_object('fv',rb) where id=ra;
  perform public.town_act(ra,'1234','move',px:=14,py:=11,dest:='plaza'); select * into r1 from public.town_residents where id=ra;
  rep := rep||'走去廣場後 fv = '||coalesce(r1.items->>'fv','無')||' place='||r1.place||'（期望 無、plaza）'||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;
