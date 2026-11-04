# life-simulator

純靜態網站，推到 main 就由 GitHub Pages 部署：https://jackycheung0408.github.io/life-simulator/

## 三個遊戲
- **人生模擬器**（根目錄）：`index.html`，主要邏輯在 `life.js`、`events.js`、`events2.js`、`story.js`、`foreshadow.js`、`realism.js`；國家資料 `countries.js`、`taiwan.js`；測試 `node tests/life.js`
- **足球員模擬器**（`football/`）：
  - `js/data.js`：國家、聯賽、球會、能力（FACE／DPW 權重、ovr、rateAt、value）
  - `js/events.js`：問答視窗 ask、關鍵時刻、機率動畫、訓練成長
  - `js/career.js`：每季流程 season、轉會、國家隊、同世代球星（STARS、LEGENDS、STAR_BORN）、真實足壇大事（REAL_EV、REAL_WC）
  - `js/ui.js`：畫面、陣容、場上意向、報表
  - `js/home.js`：首頁（玩法、搜尋 picker、捏人、出生年份、存檔與 migrate）
  - 測試：`node football/test/run.js`（pre-push hook 會自動跑，要看到「✅ 全部通過」）
- **小豬鎮**（`town/`）：另一個 session 在開發，沒被要求就不要動

## 規則
- 改了 js／css，要把對應 `index.html` 裡所有的 `?v=N` 加 1（快取）
- 舊存檔要能繼續玩；平衡改動用 `football/js/home.js` 的 migrate（SAVE_VER）
- 互動一律用按鈕，不要用超連結
- 球員一律用英文名字
- 要擬真，不要偏袒玩家
- 回覆用繁體中文，簡短
- Supabase 專案 gerqdagicybtyilihvvm；SQL 放在 `supabase/`

## 改檔習慣
- 中文 Python heredoc 容易出現編碼錯誤：先寫成 .py 檔，再用 `exec(compile(open(f,encoding="utf-8").read(),"p","exec"))` 執行
- 小改動不用開瀏覽器驗證；邏輯改動才在推上去之後檢查線上版
