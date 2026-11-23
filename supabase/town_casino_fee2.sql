-- 小豬鎮：賭場換回現金手續費 1.5% → 0.5%（使用者 2026-11-23；仍無條件進位，一半進鎮基金、一半銷毀）。要在 town_casino_fee.sql 之後套用，可重複執行。
-- 1) town_casino_state 的 sell：用 pg_get_functiondef 就地改費率（保留進館檢查、人氣累加等其他改動）；已改過就跳過。
-- 2) town_casino_leave 離場觸發函式：整個重建（本體與 town_casino_fee.sql 相同，只有費率）。
-- 注意：town_casino_fee.sql 的 town_casino_leave 段已被本檔取代，兩檔一起套用時本檔要排後面。

do $$
declare def text;
begin
  select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'town_casino_state';
  if def is not null and position('val::bigint * 15 + 999) / 1000' in def) > 0 then
    def := replace(def, 'val::bigint * 15 + 999) / 1000', 'val::bigint * 5 + 999) / 1000');
    execute def;
  end if;
end $$;

create or replace function public.town_casino_leave() returns trigger language plpgsql security definer set search_path = public as $$
declare v_chips bigint; v_fee bigint; v_back bigint;
begin
  v_chips := coalesce((NEW.items->'cas'->>'ch')::bigint, 0);
  if v_chips <= 0 then return NEW; end if;
  v_fee := (v_chips * 5 + 999) / 1000; v_back := v_chips - v_fee;
  NEW.money := NEW.money + v_back;
  NEW.items := jsonb_set(NEW.items, '{cas,ch}', '0'::jsonb);
  perform public.town_fund_add(NEW.town_id, 'casino', (v_fee / 2)::int);
  insert into public.town_events(town_id, actor, target, kind, msg) values (NEW.town_id, NEW.id, NEW.id, 'luck', NEW.name || ' 離開賭場，籌碼換回現金 €' || v_back || '（手續費 €' || v_fee || '）');
  return NEW;
end $$;
revoke all on function public.town_casino_leave() from public, anon, authenticated;
