#!/usr/bin/env node
// 比對 supabase/*.sql 的 create table 與 tools/backup/tables.txt，沒列也沒在「刻意不備份」清單的就報錯。0 依賴、離線。
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const here = path.dirname(fileURLToPath(import.meta.url)), sd = path.join(here, "../../supabase");
const txt = fs.readFileSync(path.join(here, "tables.txt"), "utf8");
const listed = new Set(txt.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#")));
const skip = new Set((txt.match(/刻意不備份[^\n]*：([^\n]*)/) || ["", ""])[1].trim().split(/\s+/).filter(Boolean));
const found = new Set();
for (const f of fs.readdirSync(sd).filter(f => f.endsWith(".sql") && !f.includes("_test")))
  for (const m of fs.readFileSync(path.join(sd, f), "utf8").matchAll(/create table if not exists public\.([a-z_0-9]+)/g)) found.add(m[1]);
const missing = [...found].filter(t => !listed.has(t) && !skip.has(t)), ghost = [...listed].filter(t => !found.has(t));
console.log(`repo 建立的表 ${found.size}、備份 ${listed.size}、刻意略過 ${skip.size}`);
if (missing.length) console.log("✗ 沒備份也沒列入略過：" + missing.join(" "));
if (ghost.length) console.log("✗ tables.txt 有但 repo 沒建的表：" + ghost.join(" "));
if (!missing.length && !ghost.length) console.log("✓ 清單與 supabase/*.sql 一致");
process.exit(missing.length || ghost.length ? 1 : 0);
