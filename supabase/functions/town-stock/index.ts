// 小豬鎮股市：抓證交所每日收盤價（openapi.twse.com.tw STOCK_DAY_ALL），只更新 town_stocks 裡有的股票
// 部署：supabase functions deploy town-stock --project-ref gerqdagicybtyilihvvm --no-verify-jwt
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

Deno.serve(async () => {
  const { data: rows, error } = await db.from("town_stocks").select("code");
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: CORS });
  const want = new Set((rows ?? []).map((x: { code: string }) => x.code));
  const res = await fetch("https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL");
  if (!res.ok) return new Response(JSON.stringify({ error: "twse " + res.status }), { status: 502, headers: CORS });
  const all: { Code: string; Date: string; ClosingPrice: string }[] = await res.json();
  const out: Record<string, string> = {};
  for (const x of all) {
    if (!want.has(x.Code)) continue;
    const close = parseFloat(x.ClosingPrice);
    if (!(close > 0) || !/^\d{7}$/.test(x.Date)) continue; // 沒成交時是空字串
    const d = `${+x.Date.slice(0, 3) + 1911}-${x.Date.slice(3, 5)}-${x.Date.slice(5, 7)}`; // 民國年 → 西元
    const { data, error: e } = await db.rpc("town_stock_set", { code: x.Code, close, d });
    out[x.Code] = e ? "error: " + e.message : String(data);
  }
  return new Response(JSON.stringify({ ok: true, result: out }), { headers: CORS });
});
