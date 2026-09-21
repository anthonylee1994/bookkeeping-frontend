# 10. Accessibility

最低要求 WCAG 2.2 AA：

- 全部操作可用 keyboard 完成，focus 順序合理且 focus ring 清晰
- Modal／drawer 有 focus trap、Escape 關閉、關閉後 focus 返回觸發元素
- Confirm dialog 一律置中（`placement="center"`）
- Icon-only button 有 accessible name 同 tooltip
- Form 每個 input 有 persistent label；不以 placeholder 代替 label
- Error 透過 `aria-describedby` 連到欄位
- Segmented control、tabs、menu 使用正確 ARIA pattern
- 色彩對比達 AA；狀態不可只靠顏色
- 支援 200% text zoom，不截斷必要操作
- 尊重 `prefers-reduced-motion`；動畫不可影響理解或操作
- Chart 必須有等價文字／table 資料
