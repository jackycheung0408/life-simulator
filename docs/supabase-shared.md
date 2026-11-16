# 共用 Supabase 專案（gerqdagicybtyilihvvm）

三個遊戲共用同一個 Supabase 專案，SQL 分散在各自 repo：

| 資料 | 檔案 | 所在 repo |
|---|---|---|
| 小豬鎮全部（`town*`） | `supabase/town*.sql`、`supabase/functions/town-push` | life-simulator（這裡） |
| 足球全球排行榜（`fb_careers`、`fb_guard`、`fb_report`） | `supabase/leaderboard.sql` | football-life |
| 追思館加固（`lives`、`lives_guard`） | `supabase/lives.sql` | life-sim |
| 遊玩統計（`plays`、`play_hit`、`play_stats`） | `supabase/plays.sql` | football-life 與 life-sim 各一份（內容相同，`create ... if not exists` 可重複執行） |
| 共用函式 `has_bad_words` | `supabase/leaderboard.sql`、`supabase/lives.sql` | football-life、life-sim（`create or replace`） |

注意：公開金鑰與專案網址寫在各遊戲前端程式裡（`index.html`、`football/js/ui.js`、`town/town.js`）；若 Supabase 設定了允許網域（CORS），三個網址 `jackycheung0408.github.io` 是同一個網域，不需要調整。
