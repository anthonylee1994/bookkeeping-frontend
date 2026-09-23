# 9. Loading、Empty、Error 與 Feedback

- 首次 page load：主要頁面用 `LoadingIndicator`（progress circle）並預留最小高度；交易詳情 drawer 用 `Skeleton`
- 寫入操作：按鈕內 progress，disable 同一 action；頁面其餘安全操作可繼續
- 成功 create/update/delete：結果直接反映於頁面（inline banner／列表），**全 app 不使用 toast**
- Validation：欄位下方錯誤 + focus 第一個錯誤欄位
- Empty state 要區分「完全沒有資料」與「filter 無結果」
- 全頁 fatal error 提供重試、返回首頁、清除本機資料等復原入口（full-screen，風格跟 404 一致）
- 使用 Error Boundary 隔離 route-level render error
- 阻塞錯誤使用 `role="alert"`
- 非阻塞的次要內容（例如報表頁 AI 收支概況）用 `aria-live="polite"` + `Skeleton`；失敗時只在卡片內顯示重試，不影響頁面其餘 deterministic 內容
