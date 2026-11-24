#!/usr/bin/env node
// 小豬鎮壓測輔助（0 依賴，只讀 repo；預設不連任何資料庫）。
//   node tools/stress/stress.mjs            → 靜態負載模型（輪詢頻率 → QPS／出流量估算）＋ 印出實測指令
//   node tools/stress/stress.mjs --check    → 離線檢查實測檔語法（sql.py check）
//   參數：--towns 100 --per-town 12 --items-kb 4 --state-ms 10
// 實測檔 supabase/town_stress_test.sql 整段 rollback，不留資料。
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url"; import { spawnSync } from "child_process";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const js = fs.readFileSync(path.join(root, "town/town.js"), "utf8");
const args = process.argv.slice(2);
const A = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 ? Number(args[i + 1]) : d };
// 輪詢模型（每人在線；數字讀自 town.js，找不到就用預設並標註）
const polls = [
  ["town_state", 15, /setInterval\(\(\)=>\{if\(document\.visibilityState=="visible"&&S\)\{touchMine\(\);refresh\(\)/],
  ["pePoll", 20, /setInterval\(pePoll,20000\)/], ["wevPoll", 60, /setInterval\(wevPoll,6e4\)/], ["npcPoll", 60, /setInterval\(npcPoll,6e4\)/],
  ["trvPoll", 60, /setInterval\(trvPoll,6e4\)/], ["luckPoll", 180, /setInterval\(luckPoll,18e4\)/]];
const itemsKB = A("items-kb", 4), perTown = A("per-town", 12), towns = A("towns", 100), ms = A("state-ms", 10);
let qps = 0; console.log("輪詢（每人在線）：");
for (const [n, s, re] of polls) { const ok = re.test(js); qps += 1 / s; console.log(`  ${n.padEnd(11)} 每 ${s} 秒 ${ok ? "" : "（town.js 找不到，用預設）"}`) }
const users = towns * perTown, stateQps = users / 15;
const payloadKB = perTown * itemsKB + 12;   // 12 人 × items ＋事件／羈絆等
console.log(`\n每人 ≈ ${qps.toFixed(2)} QPS；${towns} 鎮 × ${perTown} 人 = ${users} 人同時在線`);
console.log(`  全部 RPC ≈ ${(qps * users).toFixed(0)} QPS，其中 town_state ${stateQps.toFixed(0)} QPS`);
console.log(`  town_state 回傳約 ${payloadKB} KB／次 → 出流量 ≈ ${(stateQps * payloadKB / 1024).toFixed(1)} MB/s`);
console.log(`  town_state 單次 ${ms} ms（--state-ms 改成實測值）→ 需要 ≈ ${(stateQps * ms / 1000).toFixed(2)} 顆 CPU 核心（只算 state）`);
console.log(`  town_state 每次會 UPDATE 同鎮全部 ${perTown} 人 ⇒ 每鎮每秒 ${(perTown / 15 * perTown).toFixed(1)} 次列寫入（O(人數²)，見 docs/town-state-slimming.md）`);
console.log("\n實測（回滾交易，單連線，不留資料）：把 supabase/town_stress_test.sql 全文貼進 Supabase SQL Editor 執行（或搭配 errlog 補丁：python3 tools/sql/sql.py apply town_errlog.sql --test town_errlog_test.sql），REPORT 在錯誤訊息；把 town_state 的 avg 填回 --state-ms 重算。");
if (args.includes("--check")) { const r = spawnSync("python3", [path.join(root, "tools/sql/sql.py"), "check", "town_stress_test.sql"], { stdio: "inherit", cwd: root }); process.exit(r.status || 0) }
