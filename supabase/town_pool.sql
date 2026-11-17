-- 小豬鎮：大量隨機事件池（模板＋變數，文字與效果全由伺服器產生，前端只顯示回傳字串）。要在 town.sql、town_social.sql、town_stats2.sql 之後套用，可重複執行。
-- 三個池（eid 範圍）：
--   A 個人突發事件 eid 1～320：8 個開場（時段／天氣）× 40 個場景（街上／公園／廣場）。town_pool(op='luck')。
--   B 朋友互動事件 eid 1001～1120：40 個活動 × 3 種版本（輕鬆／冒險／大膽）。op='draw'（抽 5 個不重複）→ op='do'（選一個）。
--   C 設施情境 eid 2001～2624：13 個設施 × 6 個人物 × 8 種情節，每個 2 個選項。op='fpoll'／'fpick'（取代 town_pevent 的 3 事件／地點）。
-- 分級表只在 town_pl_scale／town_pl_tier：小 100%、中 170%、大 260%，抽到的機率 60%／30%／10%。各情節的效果在 town_pl_arch_e（C）與下面各函式的基準值。
-- 最近出現過的 20 個 id 存在 items.rc（缺值 = 空），抽樣會避開；items.pl = {d,n,at} 個人事件計數、items.pd = {t,ids,at} 朋友事件抽到的 5 個。
-- 平衡：錢的期望值 ≤ 0（賺錢事件佔比低且金額小、賭的選項期望為負）、現金不變負、不欠款、角色不會死；入獄、睡覺、昏倒擋；能力只給「進度」（沿用 town_stats2 的規則，每天合計最多 8）；好感走 town_bond。

create or replace function public.town_pl_scale(t int) returns int language sql immutable as $$ select (array[100,170,260])[least(2, greatest(0, t)) + 1] $$;
create or replace function public.town_pl_tier(n int) returns int language sql immutable as $$ select case when n < 6 then 0 when n < 9 then 1 else 2 end $$;
create or replace function public.town_pl_places() returns text[] language sql immutable as $$
  select array['restaurant','market','cafe','cinema','gym','park','plaza','office','arena','stock','rafi','carshop','slaughter'] $$;

-- A：開場（時段）。格式 起始時|結束時|文字（0～24，跨午夜寫兩段不需要，這裡只標最合適的時段）
create or replace function public.town_pl_open() returns text[] language sql immutable as $$
  select array['5|9|清晨，','12|16|午後，','16|19|傍晚，','19|24|夜裡，','0|24|微風吹來，','0|24|剛下過小雨，','10|16|大太陽底下，','0|24|人來人往中，'] $$;
-- A：場景。格式 地點類|效果|正負|標題|說明（地點類 a 全部戶外、s 街上、k 公園、z 廣場；效果 fun energy hunger hygiene money bond prog:能力）
create or replace function public.town_pl_scenes() returns text[] language sql immutable as $$
  select array[
   'a|fun|+|路邊的小貓|一隻小貓蹭了蹭你的腳邊，你忍不住蹲下來摸了摸。',
   'a|fun|+|街頭彈唱|不遠處有人在彈吉他，你停下來聽完了一整首。',
   'a|money|+|地上的零錢|腳邊閃了一下，你撿到一些零錢。',
   'a|energy|+|涼風|一陣涼風吹過，整個人精神都來了。',
   'a|hunger|+|試吃|攤販遞來一小塊試吃，你開心地收下了。',
   'a|hygiene|-|水坑|一不小心踩進水坑，鞋子濕透了。',
   'a|hygiene|-|鳥來問候|頭頂被一隻鳥「問候」了一下。',
   'a|energy|-|走錯路|你走錯了路，繞了一大圈才發現。',
   'a|money|-|熱情的推銷員|被推銷員纏住，不好意思拒絕就買了點東西。',
   'a|money|-|破洞的口袋|口袋破了個洞，零錢不知不覺掉了。',
   'a|fun|-|突然下雨|天空突然飄起雨，掃了你的興。',
   'a|hunger|-|飄來的香味|附近飄來好香的味道，肚子咕嚕叫了起來。',
   'a|fun|+|淡淡的彩虹|抬頭看見一道淡淡的彩虹。',
   'a|fun|+|遠方的招呼|有人遠遠對你揮手，你也笑著揮了揮。',
   'a|bond|+|巧遇鄰居|你和一位鄰居不期而遇，聊了好一會兒。',
   'a|bond|-|不太客氣的擦肩|有人和你擦肩而過，態度不太客氣，氣氛有點尷尬。',
   'a|prog:ch|+|熱心指路|有人向你問路，你耐心解釋了好一陣子。',
   'a|prog:iq|+|路邊公告|你認真讀了一張路邊的公告，學到一點新東西。',
   'a|prog:lk|+|四葉草|你在草叢裡瞥見一株四葉草。',
   'a|energy|-|小狗追著你|一隻小狗開心地追著你跑了一小段。',
   'a|fun|-|漫長的等待|在路口等了好久的燈，有點無聊。',
   'a|hygiene|+|毛毛細雨|毛毛雨帶走了身上的灰塵，清爽多了。',
   'a|energy|+|陰涼處小憩|找到一塊陰涼處，短短地歇了一下。',
   'a|fun|+|漂亮的天空|天空的顏色特別漂亮，你多看了好幾眼。',
   's|hygiene|-|濺起的水花|路過的車子濺了你一身水。',
   's|fun|-|吵雜的喇叭|路上的喇叭聲此起彼落，吵得你心煩。',
   's|prog:ag|+|追公車|你小跑步追著一輛公車，雖然沒追上，身手變靈活了。',
   's|money|-|路邊小攤|忍不住買了路邊攤的一個小玩意兒。',
   's|hunger|+|分你一塊餅乾|路過的阿姨分給你一塊餅乾。',
   's|fun|+|櫥窗倒影|你在櫥窗裡瞥見自己的倒影，覺得今天挺帥氣的。',
   'k|fun|+|池塘的鴨子|池塘裡的鴨子排成一列游過來。',
   'k|energy|+|草地上的午睡|躺在草地上看了一會兒雲，精神回來了。',
   'k|prog:ag|+|晨跑的人|被一位晨跑的人帶著跑了一段，腳步變輕盈了。',
   'k|hygiene|-|草地上的泥巴|不小心踩到草地上的爛泥巴。',
   'k|bond|+|鄰座的野餐|隔壁野餐的人招手要你一起坐下聊聊。',
   'k|fun|-|討厭的蚊子|一群蚊子圍著你轉，煩死了。',
   'z|fun|+|噴水池水花|噴水池的水花在陽光下閃閃發亮。',
   'z|prog:ch|+|廣場閒聊|你和廣場上的路人聊得很投機。',
   'z|money|+|池邊的硬幣|許願池邊有人遺落了幾枚硬幣。',
   'z|energy|-|被拉去排隊|你被熱情的路人拉去排了一陣子的隊。'
  ] $$;
create or replace function public.town_pl_okind(pl text) returns text language sql immutable as $$
  select case pl when 'park' then 'k' when 'plaza' then 'z' when 'street' then 's' else null end $$;
-- A 的結果句（依正負與分級）
create or replace function public.town_pl_res(sg text, t int) returns text language sql immutable as $$
  select case when sg = '+' then (array['有點小確幸。','心情真的很好！','今天運氣真好，值得記一筆！'])[t + 1]
              else (array['沒什麼大不了。','有點倒楣…','真是倒楣的一刻。'])[t + 1] end $$;

-- 加權抽 A：回傳 eid（1～320 = (場景-1)*8 + 開場）
create or replace function public.town_pl_pickA(r public.town_residents, recent int[]) returns int language plpgsql stable as $$
declare sc text[] := public.town_pl_scenes(); op text[] := public.town_pl_open(); ok text := public.town_pl_okind(r.place);
  i int; s int; o int; pa text[]; po text[]; w real; hr int := extract(hour from now() at time zone 'Asia/Taipei')::int; lk int := public.town_at(r, 'lk');
begin
  for i in 1..30 loop
    s := 1 + floor(random() * array_length(sc, 1))::int; o := 1 + floor(random() * 8)::int;
    if ((s - 1) * 8 + o) = any(recent) then continue; end if;
    pa := string_to_array(sc[s], '|'); po := string_to_array(op[o], '|');
    if pa[1] <> 'a' and pa[1] is distinct from ok then continue; end if;
    w := 1;
    if hr < po[1]::int or hr >= po[2]::int then w := w * 0.4; end if;
    if pa[3] = '+' then w := w * (1 + 0.04 * lk) * (case when r.fun < 30 then 1.4 else 1 end);
    else w := w * (case when r.fun < 30 then 0.7 else 1 end); end if;
    if random() * 2 < w then return (s - 1) * 8 + o; end if;
  end loop;
  return 1;
end $$;

-- 把進度加進 r（沿用 town_stats2 規則：每天合計 8、每項 ≤ 5、need = 6 + 3×目前點數）；回傳新的 r
create or replace function public.town_pl_prog(r public.town_residents, k text) returns public.town_residents language plpgsql as $$
declare a jsonb := coalesce(r.items->'at', '{}'::jsonb); td jsonb := coalesce(a->'td', '{}'::jsonb); p jsonb := coalesce(a->'p', '{}'::jsonb);
  today text := to_char(now() at time zone 'Asia/Taipei', 'YYYY-MM-DD'); dn int; cur int; pr int; need int;
begin
  dn := case when td->>'d' = today then coalesce((td->>'n')::int, 0) else 0 end;
  cur := least(5, coalesce((a->>k)::int, 0));
  if dn >= 8 or cur >= 5 then return r; end if;
  pr := coalesce((p->>k)::int, 0) + 1; need := 6 + 3 * cur;
  if pr >= need then cur := cur + 1; pr := 0; a := a || jsonb_build_object(k, cur); end if;
  a := a || jsonb_build_object('p', p || jsonb_build_object(k, pr), 'td', jsonb_build_object('d', today, 'n', dn + 1));
  r.items := jsonb_set(r.items, '{at}', a);
  return r;
end $$;

create or replace function public.town_pl_fx(f int, e int, m int, h int, y int, b int, who text, pg text) returns text language sql immutable as $$
  select nullif(concat_ws(' · ',
    case when f <> 0 then '心情 ' || case when f > 0 then '+' else '' end || f end,
    case when e <> 0 then '精力 ' || case when e > 0 then '+' else '' end || e end,
    case when m <> 0 then case when m > 0 then '+' else '−' end || '€' || abs(m) end,
    case when h <> 0 then '飽足 ' || case when h > 0 then '+' else '' end || h end,
    case when y <> 0 then '清潔 ' || case when y > 0 then '+' else '' end || y end,
    case when b <> 0 and who is not null then who || ' 好感 ' || case when b > 0 then '+' else '' end || b end,
    pg), '') $$;

-- B：40 個活動。格式 標題|說明（{w} = 對方名字）|種類（t 聊 g 玩 s 運動 e 吃喝 c 安靜創作）|進度能力（空 = 無）
create or replace function public.town_pl_acts() returns text[] language sql immutable as $$
  select array[
   '聊聊今天|和{w}分享今天遇到的事。|t|ch','交換八卦|{w}說他聽到一個有趣的小道消息。|t|ch','談談夢想|你和{w}聊起將來想做的事。|t|iq','互相吐槽|你和{w}開始互相損對方，笑成一團。|t|ch',
   '分享笑話|你想到一個冷笑話要講給{w}聽。|t|ch','說說心事|{w}看起來有心事，你問他怎麼了。|t|ch','猜謎語|你出了個謎語考{w}。|t|iq','回憶往事|你和{w}聊起剛搬來小鎮的那些日子。|t|',
   '比腕力|你向{w}挑戰比腕力。|s|st','賽跑|你邀{w}比賽誰先跑到前面的路燈。|s|ag','一起暖身|你拉著{w}一起做伸展操。|s|ag','比賽單腳站|你和{w}比誰單腳站得久。|s|st',
   '丟接球|你掏出一顆球，和{w}玩起了傳接球。|s|ag','比俯臥撐|你和{w}比誰做得多。|s|st','踢石頭比賽|你和{w}比誰能把石頭踢得更準。|s|ag','慢慢散步|你邀{w}繞著附近慢慢走一圈。|s|',
   '猜拳決勝負|你和{w}用猜拳決定誰請喝飲料。|g|lk','比誰先笑|你和{w}玩「誰先笑誰輸」。|g|','玩文字接龍|你和{w}玩起了文字接龍。|g|iq','玩比手畫腳|你和{w}玩比手畫腳，笑聲不斷。|g|ch',
   '擲硬幣預測|你和{w}比賽猜硬幣正反面。|g|lk','玩記憶遊戲|你和{w}比賽誰記得住路過的招牌。|g|iq','玩找不同|你和{w}一起找路邊廣告的細微差異。|g|iq','打賭明天天氣|你和{w}打賭明天天氣怎麼樣。|g|lk',
   '請喝一杯|你想請{w}喝杯飲料。|e||','分一包零食|你掏出零食和{w}分著吃。|e||','請吃點心|你想請{w}吃個小點心。|e||','一起買小吃|你和{w}合買了一份熱呼呼的小吃。|e||',
   '請他吃飯|你看{w}肚子餓了，提議一起吃一頓。|e||','交換便當菜|你和{w}交換了各自的拿手菜。|e||','共享甜點|你和{w}一人一半分著一份甜點。|e||','買冰淇淋|你和{w}一人一支冰淇淋。|e||',
   '一起看雲|你和{w}躺在一旁看雲慢慢飄。|c||','畫畫塗鴉|你和{w}拿樹枝在地上畫起了塗鴉。|c|iq','哼一首歌|你哼起一首歌，{w}跟著和了起來。|c|ch','拍張紀念照|你提議和{w}拍張紀念照。|c||',
   '寫張小卡片|你想寫張小卡片送給{w}。|c|ch','幫他整理頭髮|你看{w}的頭髮亂了，伸手幫他整理。|c||','講個故事|你想說個編出來的故事給{w}聽。|c|iq','靜靜發呆|你和{w}並肩坐著，什麼也不說，也很自在。|c||'
  ] $$;
create or replace function public.town_pl_tw() returns text[] language sql immutable as $$ select array['輕鬆版','冒險版','大膽版'] $$;
create or replace function public.town_pl_twh() returns text[] language sql immutable as $$ select array['穩穩的，不太會出錯','可能很好笑，也可能很尷尬','大膽一點，成功了超開心，失敗只是白忙'] $$;
-- B 效果：回傳 [我心情, 對方心情, 我精力, 我花錢, 好感, 成功%, 失敗我心情, 失敗好感, 進度(1/0)]。種類基準 × 分級（輕鬆 100%／冒險 170%／大膽 260%）
-- 吃喝：我花 €45 × 倍率，對方心情較多；沒有任何賺錢。
create or replace function public.town_pl_bfx(eid int) returns int[] language plpgsql immutable as $$
declare ac text[] := string_to_array((public.town_pl_acts())[(eid - 1001) / 3 + 1], '|'); tw int := (eid - 1001) % 3; sc int := public.town_pl_scale(tw);
  bf int := 4; bt int := 4; be int := 0; bm int := 0;
begin
  if ac[3] = 'g' then bf := 5; bt := 5;
  elsif ac[3] = 's' then be := -5;
  elsif ac[3] = 'e' then bf := 3; bt := 6; bm := 45;
  elsif ac[3] = 'c' then bf := 3; bt := 3; end if;
  return array[round(bf * sc / 100.0)::int, round(bt * sc / 100.0)::int, round(be * sc / 100.0)::int, round(bm * sc / 100.0)::int,
    case tw when 0 then 1 when 1 then 2 else 3 end, case tw when 0 then 100 when 1 then 60 else 35 end,
    case tw when 0 then 0 when 1 then -4 else -2 end, case tw when 0 then 0 when 1 then -1 else 0 end, case when ac[4] <> '' then 1 else 0 end];
end $$;
create or replace function public.town_pl_btext(eid int, wn text) returns text[] language sql immutable as $$
  select array[(public.town_pl_tw())[(eid - 1001) % 3 + 1] || '・' || split_part((public.town_pl_acts())[(eid - 1001) / 3 + 1], '|', 1),
    replace(split_part((public.town_pl_acts())[(eid - 1001) / 3 + 1], '|', 2), '{w}', wn), (public.town_pl_twh())[(eid - 1001) % 3 + 1]] $$;

-- C：13 個設施各 6 個人物（順序同 town_pl_places）
create or replace function public.town_pl_subj(pn int) returns text[] language sql immutable as $$
  select array(select jsonb_array_elements_text(('[["隔壁桌的客人","老闆阿福","新來的服務生","帶小孩的家庭","一位老先生","外送員"],["理貨的店員","結帳的阿姨","試吃攤的小姐","推著推車的大叔","一位小朋友","搶特價的客人"],["咖啡師小咪","窗邊的作家","排隊的上班族","打瞌睡的學生","抱著筆電的人","常客大叔"],["賣爆米花的店員","前排的情侶","影癡先生","剪票員","睡著的觀眾","看第三遍的影迷"],["教練阿力","正在喘氣的壯漢","瑜伽墊上的阿姨","跑步機上的人","剛辦會員的新手","舉鐵的老先生"],["遛狗的人","長椅上的老爺爺","慢跑的少年","野餐的一家人","打太極的阿嬤","玩飛盤的孩子"],["賣氣球的小販","表演的魔術師","噴水池旁的小孩","發傳單的人","看報紙的爺爺","逛街的情侶"],["加班的同事","茶水間的前輩","抱著文件的實習生","打電話的主管","送快遞的人","睡著的同事"],["練拳的選手","裁判叔叔","賣水的小販","場邊的老觀眾","綁頭巾的少年","拿著毛巾的教練"],["盯盤的阿伯","拿著報紙的老先生","興奮的散戶","穿西裝的分析師","打瞌睡的警衛","愁眉苦臉的投資人"],["拉菲的祕書","在影印的職員","打領帶的業務","路過的經理","端咖啡的助理","看報表的會計"],["業務員","修車師傅","看車的客人","試乘的大叔","洗車的小弟","抱著機油的學徒"],["守衛","磨刀的師傅","抱著豬肉的工人","路過的貓","老闆娘","打掃的阿伯"]]'::jsonb) -> (pn - 1))) $$;
-- C：8 種情節。格式 標題|說明|選項A|A提示|選項B|B提示（{S} = 人物）
create or replace function public.town_pl_arch_t() returns text[] language sql immutable as $$
  select array[
   '{S}主動搭話|{S}笑著跟你聊了起來，似乎很想找人說話。|陪他聊聊|心情＋，可能多一點好感|禮貌點頭|心情 +1',
   '{S}遇到小麻煩|{S}看起來手忙腳亂的，好像需要幫忙。|上前幫忙|大多會成功，偶爾幫倒忙|假裝沒看見|心情 −2',
   '{S}推薦限定品|{S}神祕地說今天有個限定的好東西。|買一份試試|花錢，心情大增|不用了|什麼也不花',
   '{S}向你挑戰|{S}挑起眉毛，問你敢不敢比一場。|接受挑戰|看運氣：贏了開心、輸了氣餒|認輸|心情 +1',
   '{S}塞給你小東西|{S}不由分說塞了個小東西到你手裡。|開心收下|心情＋|禮貌婉拒|心情 +1，可能多一點好感',
   '你發現{S}的小祕密|你不小心瞥見{S}藏起來的東西。|偷偷看一眼|看運氣：有趣或被發現|假裝沒看到|心情 +2',
   '{S}邀你一起|{S}問你要不要一起做點什麼。|好啊一起|心情＋、精力少許、可能練到一點能力|下次吧|沒有影響',
   '{S}拉你小賭一把|{S}掏出一枚硬幣，問你敢不敢賭。|來一把|可能贏錢也可能輸錢（長期略虧）|不賭|什麼也不花'
  ] $$;
-- C 效果（基準，未乘分級）：[心情, 精力, 錢, 好感, 成功%, 失敗心情, 失敗精力, 失敗錢, 失敗好感]；a = 情節 1～8，o = 選項 0／1
create or replace function public.town_pl_arch_e(a int, o int) returns int[] language sql immutable as $$
  select array(select jsonb_array_elements_text(('[[[5,-1,0,1,100,0,0,0,0],[1,0,0,0,100,0,0,0,0]],[[6,-3,0,1,70,-4,-3,0,0],[-2,0,0,0,100,0,0,0,0]],[[8,0,-50,0,100,0,0,0,0],[0,0,0,0,100,0,0,0,0]],[[10,-4,0,1,50,-6,-4,0,0],[1,0,0,0,100,0,0,0,0]],[[5,0,0,0,100,0,0,0,0],[1,0,0,1,100,0,0,0,0]],[[7,0,0,0,50,-5,0,0,0],[2,0,0,0,100,0,0,0,0]],[[7,-3,0,1,100,0,0,0,0],[0,0,0,0,100,0,0,0,0]],[[8,0,100,0,30,-4,0,-60,0],[0,0,0,0,100,0,0,0,0]]]'::jsonb) #> array[(a - 1)::text, o::text]))::int[] $$;
-- C：某設施做「好啊一起」時練到的能力（空 = 無）
create or replace function public.town_pl_cprog(pl text) returns text language sql immutable as $$
  select case pl when 'gym' then 'st' when 'arena' then 'st' when 'park' then 'ag' when 'plaza' then 'ch' when 'cafe' then 'iq' when 'office' then 'iq' when 'rafi' then 'iq' when 'stock' then 'lk' else '' end $$;
-- C 的分級：由 eid 決定（60%／30%／10%）
create or replace function public.town_pl_ct(eid int) returns int language sql immutable as $$ select public.town_pl_tier((eid * 7 + (eid / 13)) % 10) $$;
create or replace function public.town_pl_ceff(eid int, o int) returns int[] language plpgsql immutable as $$
declare a int := (eid - 2001) % 8 + 1; sc int := public.town_pl_scale(public.town_pl_ct(eid)); ef int[] := public.town_pl_arch_e(a, o);
begin
  return array[round(ef[1] * sc / 100.0)::int, round(ef[2] * sc / 100.0)::int, round(ef[3] * sc / 100.0)::int, round(ef[4] * sc / 100.0)::int, ef[5],
    round(ef[6] * sc / 100.0)::int, round(ef[7] * sc / 100.0)::int, round(ef[8] * sc / 100.0)::int, round(ef[9] * sc / 100.0)::int];
end $$;
create or replace function public.town_pl_ctext(eid int) returns text[] language plpgsql immutable as $$
declare pn int := (eid - 2001) / 48 + 1; si int := ((eid - 2001) % 48) / 8 + 1; a int := (eid - 2001) % 8 + 1; t text[] := string_to_array((public.town_pl_arch_t())[a], '|'); s text := (public.town_pl_subj(pn))[si];
begin
  return array[replace(t[1], '{S}', s), replace(t[2], '{S}', s), t[3], t[4], t[5], t[6], (public.town_pl_places())[pn]];
end $$;

-- 最近 20 個 eid
create or replace function public.town_pl_rc(r public.town_residents) returns int[] language sql immutable as $$
  select coalesce(array(select jsonb_array_elements_text(coalesce(r.items->'rc', '[]'::jsonb))::int), '{}'::int[]) $$;
create or replace function public.town_pl_rc_add(r public.town_residents, ids int[]) returns public.town_residents language plpgsql immutable as $$
declare cur int[] := public.town_pl_rc(r) || ids;
begin
  if array_length(cur, 1) > 20 then cur := cur[array_length(cur, 1) - 19:array_length(cur, 1)]; end if;
  r.items := jsonb_set(r.items, '{rc}', to_jsonb(cur));
  return r;
end $$;

-- 主 RPC。op：luck（個人事件）、draw／do（朋友互動，target = 對方、item = 事件 eid）、fpoll／fpick（設施情境，item = 0 或 1）、stat（池大小）
create or replace function public.town_pool(rid bigint, pin text, op text, target bigint default null, item text default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; t public.town_residents; today text := to_char(now() at time zone 'Asia/Taipei', 'YYYY-MM-DD');
  pl jsonb; n int; eid int; tier int; sc int; s text[]; od text[]; amt int; f int := 0; e int := 0; m int := 0; h int := 0; hy int := 0; b int := 0; who text; pg text := null; msg text; title text; sg text; ef text; ki text;
  bf int[]; ct text[]; ce int[]; hit boolean; o int; ids int[] := '{}'::int[]; tries int; ac text[]; before int; pe jsonb; q jsonb; dn int; xid bigint; xname text; ak text;
begin
  if op = 'stat' then
    return json_build_object('a', array_length(public.town_pl_scenes(), 1) * 8, 'b', array_length(public.town_pl_acts(), 1) * 3, 'c', array_length(public.town_pl_places(), 1) * 48);
  end if;
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if r.sleeping then raise exception '睡著了，先起床'; end if;
  if public.town_jailed(r) then raise exception '入獄中沒有這些事'; end if;
  pl := coalesce(r.items->'pl', '{}'::jsonb);

  -- ── A 個人突發事件：戶外、約 50%、間隔 5 分鐘、每天最多 15 個 ──
  if op = 'luck' then
    if r.place not in ('street','plaza','park') then return json_build_object('none', true); end if;
    n := case when pl->>'d' = today then coalesce((pl->>'n')::int, 0) else 0 end;
    if n >= 15 then return json_build_object('none', true); end if;
    if pl ? 'at' and (pl->>'at')::timestamptz > now() - interval '5 minutes' then return json_build_object('none', true); end if;
    if random() >= 0.5 then return json_build_object('none', true); end if;
    eid := public.town_pl_pickA(r, public.town_pl_rc(r));
    s := string_to_array((public.town_pl_scenes())[(eid - 1) / 8 + 1], '|'); od := string_to_array((public.town_pl_open())[(eid - 1) % 8 + 1], '|');
    tier := public.town_pl_tier(floor(random() * 10)::int); sc := public.town_pl_scale(tier); sg := s[3]; ki := s[2];
    -- 運氣：每點 1% 把壞事改成沒事（只改成心情 +小）
    if sg = '-' and random() < 0.01 * public.town_at(r, 'lk') then sg := '+'; ki := 'fun'; end if;
    amt := round((case ki when 'fun' then 4 when 'energy' then 4 when 'hunger' then 5 when 'hygiene' then 6 when 'money' then 25 when 'bond' then 1 else 0 end) * sc / 100.0)::int;
    if sg = '-' then amt := -amt; end if;
    if ki = 'fun' then f := amt; r.fun := r.fun + f;
    elsif ki = 'energy' then e := amt; r.energy := r.energy + e;
    elsif ki = 'hunger' then h := amt; r.hunger := r.hunger + h;
    elsif ki = 'hygiene' then hy := amt; r.hygiene := r.hygiene + hy;
    elsif ki = 'money' then m := case when amt < 0 then -least(-amt, r.money) else amt end; r.money := r.money + m;
    elsif ki = 'bond' then
      select o2.id, o2.name into xid, xname from public.town_residents o2 where o2.town_id = r.town_id and o2.id <> rid and o2.place = r.place and not o2.sleeping and not public.town_jailed(o2) order by random() limit 1;
      if xid is null then f := case when amt > 0 then 2 else -2 end; r.fun := r.fun + f;
      else b := amt; who := xname; perform public.town_bond(r.town_id, rid, xid, b); end if;
    elsif ki like 'prog:%' then
      ak := substr(ki, 6); before := coalesce((r.items->'at'->>ak)::int, 0);
      r := public.town_pl_prog(r, ak);
      pg := case when coalesce((r.items->'at'->>ak)::int, 0) > before then '能力 +1 點！' else '練習進度 +1' end;
    end if;
    r := public.town_pl_rc_add(r, array[eid]);
    r.items := jsonb_set(r.items, '{pl}', jsonb_build_object('d', today, 'n', n + 1, 'at', now()));
    title := btrim(od[3], '，') || '・' || s[4];
    msg := od[3] || s[5] || public.town_pl_res(sg, tier);
    ef := public.town_pl_fx(f, e, m, h, hy, b, who, pg);
    insert into public.town_events(town_id, actor, kind, msg) values (r.town_id, rid, 'luck', r.name || ' ' || title || (case when ef is null then '' else '（' || ef || '）' end));
    perform public.town_save_r(r);
    return json_build_object('id', eid, 'title', title, 'msg', msg, 'fx', ef);
  end if;

  -- ── B 朋友互動：draw 抽 5 個不重複的活動給玩家挑，do 執行選的那個 ──
  if op = 'draw' or op = 'do' then
    if target is null or target = rid then raise exception '要選一位鄰居'; end if;
    select * into t from public.town_residents where id = target and town_id = r.town_id for update;
    if not found then raise exception '找不到這位鄰居'; end if;
    if t.sleeping or public.town_jailed(t) or t.place is distinct from r.place then raise exception '% 不在這裡，或在睡覺', t.name; end if;
    if op = 'draw' then
      for tries in 1..60 loop
        exit when coalesce(array_length(ids, 1), 0) >= 5;
        eid := 1001 + floor(random() * 120)::int;
        if eid = any(ids) or eid = any(public.town_pl_rc(r)) then continue; end if;
        -- 同一個活動的不同版本不一起出現
        if exists (select 1 from unnest(ids) u where (u - 1001) / 3 = (eid - 1001) / 3) then continue; end if;
        ids := ids || eid;
      end loop;
      r.items := jsonb_set(r.items, '{pd}', jsonb_build_object('t', target, 'ids', to_jsonb(ids), 'at', now()));
      perform public.town_save_r(r);
      return json_build_object('who', t.name, 'list', (select json_agg(json_build_object('id', u, 'title', (public.town_pl_btext(u, t.name))[1], 'desc', (public.town_pl_btext(u, t.name))[2], 'hint', (public.town_pl_btext(u, t.name))[3],
        'cost', (public.town_pl_bfx(u))[4]) order by ord) from unnest(ids) with ordinality as z(u, ord)));
    end if;
    pe := r.items->'pd'; eid := coalesce(item::int, 0);
    if pe is null or (pe->>'t')::bigint <> target or (pe->>'at')::timestamptz < now() - interval '5 minutes' or not (pe->'ids') @> to_jsonb(eid) then raise exception '這個選擇已經過期了，重新抽一次'; end if;
    bf := public.town_pl_bfx(eid); ac := string_to_array((public.town_pl_acts())[(eid - 1001) / 3 + 1], '|');
    if r.money < bf[4] then raise exception '錢不夠（要 €%）', bf[4]; end if;
    if r.energy < -bf[3] then raise exception '精力不夠'; end if;
    hit := random() * 100 < bf[6];
    r.money := r.money - bf[4]; r.energy := r.energy + bf[3];
    if hit then
      f := bf[1]; r.fun := r.fun + f; t.fun := least(100, t.fun + bf[2]); b := bf[5];
      if bf[9] = 1 and ac[4] <> '' then ak := ac[4]; before := coalesce((r.items->'at'->>ak)::int, 0); r := public.town_pl_prog(r, ak);
        pg := case when coalesce((r.items->'at'->>ak)::int, 0) > before then '能力 +1 點！' else '練習進度 +1' end; end if;
    else f := bf[7]; r.fun := r.fun + f; b := bf[8]; t.fun := greatest(0, t.fun + (case when bf[7] < -3 then -2 else 0 end)); end if;
    if b <> 0 then perform public.town_bond(r.town_id, rid, target, b); end if;
    r.items := (r.items - 'pd');
    r := public.town_pl_rc_add(r, array[eid]);
    perform public.town_save_r(r); perform public.town_save_r(t);
    ef := public.town_pl_fx(f, bf[3], -bf[4], 0, 0, b, t.name, pg);
    insert into public.town_events(town_id, actor, target, kind, msg) values (r.town_id, rid, target, 'fun', r.name || ' 和 ' || t.name || '：' || (public.town_pl_btext(eid, t.name))[1] || (case when hit then '，很順利' else '，不太順利' end));
    return json_build_object('hit', hit, 'msg', (public.town_pl_btext(eid, t.name))[1] || (case when hit then '，很順利！' else '，有點尷尬…' end), 'fx', ef, 'f', f, 'm', -bf[4]);
  end if;

  -- ── C 設施情境：fpoll 看有沒有新事件（約 10～20 分鐘一個）、fpick 選 0／1 ──
  if op = 'fpoll' or op = 'fpick' then
    pe := coalesce(r.items->'pe', '{}'::jsonb);
    if not public.town_pe_place(r.place) then return json_build_object('ev', null); end if;
    if op = 'fpoll' then
      if pe->>'pl' is distinct from r.place or pe->>'lp' is null or (pe->>'lp')::timestamptz < now() - interval '5 minutes' then
        pe := jsonb_build_object('pl', r.place, 'nx', now() + (10 + random() * 10) * interval '1 minute', 'lp', now(), 'd', today, 'n', coalesce((pe->>'n')::int, 0));
        update public.town_residents set items = jsonb_set(items, '{pe}', pe) where id = rid;
        return json_build_object('ev', null);
      end if;
      pe := pe || jsonb_build_object('lp', now()); q := pe->'q';
      if q is not null and (q->>'at')::timestamptz < now() - interval '5 minutes' then pe := pe - 'q'; q := null; end if;
      if q is null and now() >= (pe->>'nx')::timestamptz then
        n := array_position(public.town_pl_places(), r.place);
        for tries in 1..30 loop
          eid := 2001 + (n - 1) * 48 + floor(random() * 48)::int;
          exit when not (eid = any(public.town_pl_rc(r)));
        end loop;
        -- 低心情時少遇到挑戰、偷看與賭（情節 4、6、8）
        if r.fun < 25 and (eid - 2001) % 8 in (3, 5, 7) and random() < 0.6 then eid := eid - ((eid - 2001) % 8) ; end if;
        q := jsonb_build_object('id', eid, 'at', now());
        pe := pe || jsonb_build_object('q', q, 'nx', now() + (10 + random() * 10) * interval '1 minute', 'n', coalesce((pe->>'n')::int, 0) + 1);
      end if;
      update public.town_residents set items = jsonb_set(items, '{pe}', pe) where id = rid;
      if q is null then return json_build_object('ev', null); end if;
      ct := public.town_pl_ctext((q->>'id')::int);
      return json_build_object('ev', json_build_object('pl', r.place, 'id', (q->>'id')::int, 'at', q->>'at', 'title', ct[1], 'desc', ct[2], 'a', ct[3], 'ah', ct[4], 'b', ct[5], 'bh', ct[6]));
    end if;
    q := pe->'q';
    if q is null or pe->>'pl' is distinct from r.place or (q->>'at')::timestamptz < now() - interval '5 minutes' then raise exception '這個事件已經過去了'; end if;
    if item not in ('0','1') then raise exception '選項不對'; end if;
    o := item::int; eid := (q->>'id')::int; ce := public.town_pl_ceff(eid, o); ct := public.town_pl_ctext(eid);
    if least(ce[3], ce[8]) < 0 and r.money < -least(ce[3], ce[8]) then raise exception '錢不夠，這個選項最多要花 €%', -least(ce[3], ce[8]); end if;
    hit := random() * 100 < ce[5];
    f := case when hit then ce[1] else ce[6] end; e := case when hit then ce[2] else ce[7] end;
    m := case when hit then ce[3] else ce[8] end; b := case when hit then ce[4] else ce[9] end;
    r.fun := r.fun + f; r.energy := r.energy + e; r.money := r.money + m;
    select o2.id, o2.name into xid, xname from public.town_residents o2 where o2.town_id = r.town_id and o2.place = r.place and o2.id <> rid and not o2.sleeping order by random() limit 1;
    if xid is not null then
      if b <> 0 then perform public.town_bond(r.town_id, rid, xid, b); end if;
      r := public.town_tg(r, 4, 2);
    else b := 0; end if;
    ak := public.town_pl_cprog(r.place);
    if o = 0 and hit and (eid - 2001) % 8 = 6 and ak <> '' then
      before := coalesce((r.items->'at'->>ak)::int, 0); r := public.town_pl_prog(r, ak);
      pg := case when coalesce((r.items->'at'->>ak)::int, 0) > before then '能力 +1 點！' else '練習進度 +1' end;
    end if;
    pe := (pe - 'q') || jsonb_build_object('lp', now());
    r.items := jsonb_set(r.items, '{pe}', pe);
    r := public.town_pl_rc_add(r, array[eid]);
    perform public.town_save_r(r);
    ef := public.town_pl_fx(f, e, m, 0, 0, b, xname, pg);
    return json_build_object('hit', hit, 'f', f, 'e', e, 'm', m, 'b', b, 'who', xname, 'msg', ct[1], 'fx', ef);
  end if;
  raise exception '不明的操作';
end $$;
revoke all on function public.town_pool(bigint,text,text,bigint,text) from public;
grant execute on function public.town_pool(bigint,text,text,bigint,text) to anon, authenticated;
revoke all on function public.town_pl_scale(int), public.town_pl_tier(int), public.town_pl_places(), public.town_pl_open(), public.town_pl_scenes(), public.town_pl_okind(text), public.town_pl_res(text,int),
  public.town_pl_pickA(public.town_residents,int[]), public.town_pl_prog(public.town_residents,text), public.town_pl_fx(int,int,int,int,int,int,text,text), public.town_pl_acts(), public.town_pl_tw(), public.town_pl_twh(),
  public.town_pl_bfx(int), public.town_pl_btext(int,text), public.town_pl_subj(int), public.town_pl_arch_t(), public.town_pl_arch_e(int,int), public.town_pl_cprog(text), public.town_pl_ct(int), public.town_pl_ceff(int,int),
  public.town_pl_ctext(int), public.town_pl_rc(public.town_residents), public.town_pl_rc_add(public.town_residents,int[]) from public, anon, authenticated;
grant execute on function public.town_pool(bigint,text,text,bigint,text) to anon, authenticated;
