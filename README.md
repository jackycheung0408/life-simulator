# 小豬鎮與入口導覽頁

和朋友住在同一個像素小鎮的多人遊戲，以及三個遊戲的入口導覽頁。

**小豬鎮：https://jackycheung0408.github.io/life-simulator/town/**
**入口導覽頁：https://jackycheung0408.github.io/life-simulator/**

- 測試：`node town/test.js`（pre-push hook 會自動跑，`git config core.hooksPath .githooks` 啟用）
- 改了 `town/` 的 js 要跑 `node tools/town-bump.mjs`
- 後端 SQL 在 `supabase/town*.sql`，規則與檔案分工見 `CLAUDE.md`
- 兄弟 repo：人生模擬器 `life-sim`（https://jackycheung0408.github.io/life-sim/）、足球員模擬器 `football-life`（https://jackycheung0408.github.io/football-life/）
- `football/` 在這裡只剩一個轉址頁，舊網址不會 404
