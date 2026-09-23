# 12. 測試策略

## 12.1 Unit

- Dollar string ↔ cents conversion：正常、0、負數、千位、小數位、超大值
- 香港日期／日週月 boundary formatting、`daysFromToday`
- Local repository result／error normalization
- URL filter serialize／parse
- Recurring frequency label 及 payload mapping
- Summary insight invalidation key（aggregate／筆數敏感、分頁唔敏感）

## 12.2 Component / integration

- Session redirect、logout、returnTo validation
- Zustand stores 的 hydration、selector、persist／migration、跨 tab logout cleanup
- Transaction form 三種 kind 的欄位切換及 validation
- UUID 唯一性同重複提交保護（create transaction／AI confirm）
- Filter、sort、pagination 與 URL 同步
- 交易 drawer 導航：由詳情撳「修改」停喺 `/edit`、唔彈返列表；關閉詳情返回列表並保留 filter；列表喺 drawer 後面保持 mount
- 定期交易：status tab、pause／resume／run now／skip next／delete 文案
- AI upload／parse／edit／confirm，以及每段失敗重試
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
