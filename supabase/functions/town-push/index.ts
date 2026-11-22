// 小豬鎮推播：有人對你做了什麼（資料庫新增動態時呼叫），以及每 30 分鐘檢查誰快撐不住了
// 推播金鑰第一次執行時自動產生並存在資料庫（town_vapid，只有伺服器讀得到），不需要手動設定
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, apikey, authorization", "Content-Type": "application/json" };
const SITE = "https://jackycheung0408.github.io/life-simulator/town/";
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: CORS });

async function keys() {
  let { data } = await db.from("town_vapid").select("*").eq("id", 1).maybeSingle();
  if (!data) {
    const k = webpush.generateVAPIDKeys();
    await db.from("town_vapid").insert({ id: 1, public_key: k.publicKey, private_key: k.privateKey });
    ({ data } = await db.from("town_vapid").select("*").eq("id", 1).single()); // 同時有兩個請求時，以先寫入的為準
  }
  webpush.setVapidDetails("mailto:town@jackycheung0408.github.io", data.public_key, data.private_key);
  return data;
}

async function send(rid: number, title: string, body: string, url: string, tag: string) {
  const { data: subs } = await db.from("town_push").select("*").eq("resident_id", rid);
  let n = 0;
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ title, body, url, tag }));
      n++;
    } catch (e) {
      // 手機取消訂閱或換了瀏覽器：刪掉失效的訂閱
      if (e.statusCode === 404 || e.statusCode === 410) await db.from("town_push").delete().eq("endpoint", s.endpoint);
    }
  }
  return n;
}

const taipeiHour = () => new Date(Date.now() + 8 * 36e5).getUTCHours();
const taipeiDay = (offsetDays = 0) => new Date(Date.now() + 8 * 36e5 - offsetDays * 864e5).toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const k = await keys();
  if (req.method === "GET") return json({ key: k.public_key });
  const b = await req.json().catch(() => ({}));

  // 新動態：通知被互動的那個人（只處理 5 分鐘內的動態，舊的不重發）
  if (b.event_id) {
    const { data: e } = await db.from("town_events").select("*").eq("id", b.event_id).maybeSingle();
    if (!e || !e.target || e.actor === e.target || Date.now() - Date.parse(e.at) > 5 * 60e3) return json({ ok: true, sent: 0 });
    return json({ ok: true, sent: await send(e.target, "🐷 小豬鎮", e.msg, `${SITE}?t=${e.town_id}`, `ev${e.id}`) });
  }

  // 每 30 分鐘：需求快見底就提醒（同一個人 6 小時最多一次，台灣時間 23:00～08:00 不吵人）
  if (b.check) {
    const h0 = taipeiHour();
    if (h0 >= 23 || h0 < 8) return json({ ok: true, sent: 0, quiet: true });
    const { data: subs } = await db.from("town_push").select("resident_id");
    const ids = [...new Set((subs ?? []).map((s) => s.resident_id))];
    if (!ids.length) return json({ ok: true, sent: 0 });
    const { data: rs } = await db.from("town_residents").select("id,town_id,name,sleeping,hunger,energy,bladder,hygiene,updated_at,seen_at,push_need_at,items").in("id", ids);
    const today = taipeiDay(), yday = taipeiDay(1);
    let n = 0;
    for (const r of rs ?? []) {
      const url = `${SITE}?t=${r.town_id}`;
      // 和資料庫 town_tick 同一套速率：醒著 飽足 8／精力 5／膀胱 10／清潔 5，睡覺 5／7／2.4；最後動作 30 分鐘後 ×0.4 且停在 30
      const now = Date.now(), h = Math.min(72, (now - Date.parse(r.updated_at)) / 36e5), z = r.sleeping;
      const hon = Math.max(0, Math.min(h, (Date.parse(r.seen_at ?? r.updated_at) + 18e5 - (now - h * 36e5)) / 36e5)), hof = h - hon;
      const dec = (v: number, rate: number) => Math.max(v - rate * hon - 0.4 * rate * hof, Math.min(v - rate * hon, 30));
      const hunger = dec(r.hunger, z ? 5 : 8), bladder = dec(r.bladder, z ? 7 : 10), hygiene = dec(r.hygiene, z ? 2.4 : 5), energy = z ? 100 : dec(r.energy, 5);
      const faint = !!(r.items && r.items.faint);
      const msg = faint ? null : hunger < 20 ? "快餓昏了 🍚 再不吃東西就要昏倒了" : bladder < 20 ? "快憋不住了 🚽 再不上廁所就要大在路上了" : energy < 8 ? "累到快睡著了 ⚡ 回家睡一覺吧" : hygiene < 10 ? "身上開始發臭了 🛁 洗個澡吧" : null;
      if (msg && (!r.push_need_at || Date.now() - Date.parse(r.push_need_at) > 6 * 36e5)) {
        n += await send(r.id, `🐷 ${r.name}，`, msg, url, "need");
        await db.from("town_residents").update({ push_need_at: new Date().toISOString() }).eq("id", r.id);
      }

      // 每種通知每人每天最多一次：先寫入紀錄（town_push_log），寫入失敗（已存在）就不送
      const once = async (kind: string) => {
        const { error } = await db.from("town_push_log").insert({ rid: r.id, day: today, kind });
        return !error;
      };
      const al = (r.items && r.items.al) || {};
      // 連續上線快斷了：昨天有上線、今天還沒上線、晚上 19 點之後
      if ((al.s ?? 0) >= 3 && al.d === yday && h0 >= 19 && (await once("streak"))) {
        n += await send(r.id, `🐷 ${r.name}，`, `🔥 你已經連續上線 ${al.s} 天了，今天還沒來，別讓連續中斷！`, url, "streak");
      }
      // 午間市集（12 點）與夜市（21 點）開張
      if (h0 === 12 && (await once("noon"))) {
        n += await send(r.id, "🐷 小豬鎮", "🌞 午間市集開張！12:00～14:00 打工薪水 +10%", url, "happy");
      }
      if (h0 === 21 && (await once("night"))) {
        n += await send(r.id, "🐷 小豬鎮", "🌙 夜市開張！21:00～23:00 打工薪水 +10%", url, "happy");
      }
    }
    return json({ ok: true, sent: n });
  }
  return json({ ok: false }, 400);
});
