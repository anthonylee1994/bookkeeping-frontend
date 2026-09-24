# 2. 視覺與體驗方向

## 2.1 原則

- Mobile-first，主要操作可以單手完成
- 財務資料要安靜、清晰、易掃描；避免大量裝飾卡片及過度漸變
- 收入、支出除了顏色，必須同時用正負號、文字或 icon 區分
- 主要新增交易按鈕固定容易觸及，但不可遮住內容或 bottom navigation
- 所有破壞性操作都要明確說明清楚影響，確認後才執行

## 2.2 Design tokens

實際 token 定義於 `src/theme/system.ts`：

- Background：gray.50（dark gray.950）；surface：white（dark gray.900）
- Primary action：`brand.solid` = emerald 700 `#047857`（dark：emerald 500 `#10b981`）；focus ring `brand.500`
- Income：green；expense：red；transfer：blue（semantic token，必須配合正負號／文字）
- AI 生成內容（報表頁「AI 收支概況」）：`ai.bg` 淡藍底（light blue.50／dark blue.900）、`ai.border` blue.200、`ai.fg` blue.700，令佢同一般白色 card 一眼分得開；交易表單「AI 建議」分類 badge 同用 `colorPalette="blue"`（subtle）以資識別
- Border radius：控件 10px（`radii.lg`，semantic `l2`）、card 14px（`radii.xl`）、drawer 18px（`radii.2xl`）
- Touch target：最少 `44px × 44px`
- 字級（theme 自訂 scale）：body `md` 15px、secondary `sm` 13px、meta `xs` 12px
- Desktop content max width：`1280px`（`maxW="7xl"`）
- heading 用負 letter-spacing（`tight`），body 保持 `0`

## 2.3 金額顯示

- 顯示：`$1,234.50`
- 收入：`+$1,234.50`
- 支出：`-$1,234.50`
- 輸入欄顯示 dollar value，提交前用字串精確轉成 cents
- 不容許負數、零、超過兩位小數、科學記數法
