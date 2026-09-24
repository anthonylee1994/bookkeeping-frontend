# 12. 測試策略

## 12.1 Unit

- Dollar string ↔ cents conversion：正常、0、負數、千位、小數位、超大值
- 香港日期／日週月 boundary formatting、`daysFromToday`
- Local repository result／error normalization
- URL filter serialize／parse
- Recurring frequency label 及 payload mapping
- Summary insight invalidation key（aggregate／筆數敏感、分頁唔敏感）
- AI 文字解讀 repository validation（空白／超過 500 字）及 text → 表單欄位 mapping（重用 `scanModel`），包括多筆 `parsed_items`（`previewItems` 正規化、逐筆 `parsedItemToReviewValues`／`suggested_category_id`）
- AI 自然語言查詢 repository validation（空白／超過 500 字）及 `aiQueryToFilters`（URL 同名 params `q`／`min`／`max` → `keyword`／`min_amount_cents`／`max_amount_cents`，無效值丟棄、`filters: null` → 空 filter）
- AI 自動分類建議 repository validation（商戶同備註皆空白）及 request mapping（trim、空白邊傳 `null`、`kind` 原樣傳）

## 12.2 Component / integration

- Session redirect、logout、returnTo validation
- Zustand stores 的 hydration、selector、persist／migration、跨 tab logout cleanup
- Transaction form 三種 kind 的欄位切換及 validation
- UUID 唯一性同重複提交保護（create transaction／AI confirm）
- Filter、sort、pagination 與 URL 同步
- 交易 drawer 導航：由詳情撳「修改」停喺 `/edit`、唔彈返列表；關閉詳情返回列表並保留 filter；列表喺 drawer 後面保持 mount
- 定期交易：status tab、pause／resume／run now／skip next／delete 文案
- AI upload／parse／edit／confirm，以及每段失敗重試
- AI 打字記帳：解讀成功預填並提示、低信心／缺欄位標示、`422`／`502` 重試與改用手動、空白唔可送出
- AI 打字記帳拆單：多筆 `parsed_items` 先閂新增交易 drawer、喺交易 layout 層開批量覆核 drawer、逐筆改／刪、逐筆 `/ai/confirm`（共用 log id、各自 idempotency key）、失敗保留 drawer 同重試、全部成功收 drawer 並 bump revision
- AI 自然語言查詢：`AiQuerySearch` 面板開合、空白唔可送出、成功將 filter 寫入 URL 並清空輸入、`partial`／空 filters 顯示「解讀唔到」、錯誤保留原文同重試
- AI 自動分類建議：商戶／備註失焦先觸發、商戶有 default category 時唔發請求、成功套用分類並顯示「AI 建議」badge、用戶改分類清走 badge、失敗顯示 inline 重試
- 報表：AI 收支概況 loading／success／失敗重試；期間無交易或 `daily` 期間時唔顯示、唔發請求
- PWA：update banner、install prompt（延遲、dismiss 記憶）、offline ready
- Repository validation errors 正確套用到 form input

## 12.3 E2E critical paths

> 注意：Playwright 已列入 devDependencies，但 E2E suite 尚未實作。以下為目標 critical paths。

1. Register -> 自動登入 -> 看到預設現金帳戶及分類
2. 新增支出 -> Dashboard／交易列表反映結果
3. 新增轉帳 -> 報表不計入收入／支出
4. 搜尋及篩選交易 -> reload 後條件保留
5. 建立定期交易 -> pause -> resume -> run now
6. 上載單據 -> AI preview -> 修正 -> confirm
7. Logout -> private route 無法進入
8. PWA manifest、service worker、offline fallback

## 12.4 Viewport matrix

- Mobile：320×568、390×844
- Tablet：768×1024
- Desktop：1280×800、1440×900
- 每個 breakpoint 驗證無水平 overflow、無遮擋、dialog 可操作、bottom nav safe-area 正確
