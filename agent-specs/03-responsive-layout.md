# 3. Responsive Layout

Chakra breakpoint 採用預設值（md 768px、lg 992px），layout 以內容需要而非指定裝置名稱設計。JS 內用 `useMediaQuery(DESKTOP_QUERY)`（≥1024px）決定 sidebar／drawer 形態。

| Viewport       | Navigation                      | Content                                       |
| -------------- | ------------------------------- | --------------------------------------------- |
| `< 768px`      | App bar + 底部 4 tab + 中間 FAB | 單欄、全寬表單、filter／覆核用 bottom sheet   |
| `768px–1023px` | 可收合左側 navigation           | 1–2 欄、modal 最大 640px                      |
| `>= 1024px`    | 固定左側 navigation             | Dashboard grid、交易 table、右側 detail panel |

## 3.1 Mobile

- Header 高 56px，尊重 `env(safe-area-inset-top)`
- Bottom navigation 4 個 tab：首頁、交易、報表、設定；中間凸起 FAB 為「新增交易」
- 「掃描」（一 click 開相機／上載，選圖後彈覆核 drawer）及「定期交易」放 app bar（因底部只夠 4 格）
- Page bottom padding 包括 navigation 高度同 `env(safe-area-inset-bottom)`
- 長表格改用 list row；主要資料先顯示，次要資料可展開
- 交易列表每行左邊顯示分類頭像（color + icon），meta 行顯示帳戶小頭像

## 3.2 Tablet / Desktop

- 左側 navigation：儀表板、交易、掃描（一 click 動作）、報表、定期交易、設定 + 「新增交易」按鈕
- App header 放 sidebar 收起／展開、掃描同登出；頁面標題、日期範圍同 contextual actions 由頁內 `PageHeader` 提供
- 交易列表使用 table（分類／帳戶欄顯示頭像）；點擊 row 開右側 detail panel，保留列表位置
- 表單 create/edit 使用右側 drawer，不跳離當前工作脈絡

## 3.3 Layout safety

- 支援最窄 320px viewport，無水平捲動（圖表可以自身橫向捲動）
- Dialog 高度超過 viewport 時只捲動 dialog body，header/footer 保持可見
- 文字、金額、badge 不可互相遮擋；長 merchant／note 使用合理 truncate 並提供完整內容
- On-screen keyboard 打開後，focused input 同 submit action 仍可到達
