# 0. 文件目的

本文件定義記帳 App frontend 的產品範圍、資訊架構、互動、PWA 行為、responsive 規則及驗收標準。Frontend 是 React SPA，經 typed API repository（axios）呼叫 Rails API（API 規格見 backend repo 的 `BACKEND.md` 及本 repo `swagger.yaml`）；瀏覽器只持久化 session token（`draftStore` 存在但未接上 feature），domain data 一律存於後端。

### 文件維護（硬性）

**每次改 code 都要同步更新本文件相關章節。** 路由、互動、狀態、loading／error、測試範圍有變，就改對應 §。未更新本文件嘅改動當未完成，唔好當做完（見 [§14](./14-definition-of-done.md)）。

## 0.1 產品目標

- 令用戶可以用手機快速記一筆收入、支出或轉帳
- 一眼看到本月收支、帳戶餘額、分類分佈及最近交易
- 支援搜尋、篩選、修改、複製及刪除交易
- 支援單據拍攝／上載、AI 辨識（DeepSeek）、人工覆核後入帳
- 支援用自然語言（打一句話）快速預填交易，人手核對後入帳
- 支援定期交易及日／週／月報表
- 可安裝成 PWA，於 iOS、Android 及 desktop browser 使用

## 0.2 非目標（MVP）

- 多用戶共享帳簿、家庭帳戶或權限管理
- 多貨幣換算；UI 只支援 HKD
- 忘記密碼、email 驗證、OAuth 登入
- 背景同步或 push notification
- CSV／銀行月結單匯入
- 退款功能（2026-09-15 由產品決定移除，見 [§5.5](./05-pages/5.5-transaction-detail.md)）

## 0.3 基本假設

- 顯示語言為繁體中文（香港），預留 i18n 結構但 MVP 不提供語言切換
- 時區固定為 `Asia/Hong_Kong`
- 金額以 integer cents 儲存；frontend 不使用浮點數做金額運算
- 日期格式顯示為 `YYYY年M月D日`，時間使用 24 小時制
- 所有資料操作經 typed API repository（axios）完成，domain data 存於後端 SQLite
