# 營運統計（唯讀）
一行指令（在終端機，需 `SUPABASE_ACCESS_TOKEN`）：
```
python3 tools/sql/sql.py query "$(cat tools/stats/stats.sql)"
```
輸出三塊：summary（總鎮數、近 7 天活躍鎮、居民數）、town（每鎮：居民數 v1、近 7 天活躍 v2，鎮用序號）、weekly（每週新增鎮數）。
活躍＝`town_residents.seen_at` 近 7 天（定義寫在檔頭）。只出數量與時間，不含個資；不動資料庫函式。
