-- 昏倒／各種「一次性事件」重複寫入的修正（2026-11-23）
-- 原因：town_tick 在記憶體裡算完、寫了事件（餓到昏倒、醒來扣醫藥費、便便、發臭…），但很多呼叫者
--   （town_auth 之後只讀不寫的 RPC、town_tick(t) 對方列等）不會把結果存回，下一次呼叫又從舊狀態重算一次，
--   同一次昏倒就被寫 3～4 筆，醒來的醫藥費 €1500 也可能被重複扣。
-- 修法：town_tick 結尾把算好的狀態當場存回該列（呼叫者本來就 for update 鎖著列），之後的呼叫看到的是新狀態，冪等。
--   用 returning 把觸發器（離開賭場換籌碼）改過的 money／items 帶回，避免呼叫者之後存檔把它蓋掉。
-- 就地改 town_tick（pg_get_functiondef），不整份重套；已改過會略過；可重複執行。
do $do$
declare def text; pat text := E'  r.updated_at := now();\n  return r;';
begin
  select pg_get_functiondef('public.town_tick(public.town_residents)'::regprocedure) into def;
  if position('town_faint_fix' in def) > 0 then return; end if;
  if (length(def) - length(replace(def, pat, ''))) <> length(pat) then raise exception 'town_tick 結尾錨點不是唯一一個，沒有修改'; end if;
  def := replace(def, pat,
    E'  r.updated_at := now();\n  -- town_faint_fix：事件寫了，狀態就當場存回，下一次呼叫不會再重算一次\n'
    || E'  update public.town_residents set hunger=r.hunger,energy=r.energy,bladder=r.bladder,hygiene=r.hygiene,fun=r.fun,sleeping=r.sleeping,place=r.place,x=r.x,y=r.y,items=r.items,money=r.money,bruised_until=r.bruised_until,updated_at=r.updated_at where id=r.id returning money, items into r.money, r.items;\n  return r;');
  execute def;
end $do$;
revoke all on function public.town_tick(public.town_residents) from public, anon, authenticated;
