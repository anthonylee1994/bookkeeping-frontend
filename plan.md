# 記帳 App 逐步實作規格

對齊 `frontend-spec.md`（產品／UX 規則）及 `swagger.yaml`／`backend-spec.md`（domain／input shape / API 語意）。本文件是實作順序，並非重寫產品 spec。

## 兩份文件如何對齊

| 來源                              | 角色                                                                       |
| --------------------------------- | -------------------------------------------------------------------------- |
| `frontend-spec.md`                | 產品範圍、頁面、互動、PWA、a11y、coding conventions、Zustand 規則          |
| `swagger.yaml`／`backend-spec.md` | Domain input／enum／pagination／idempotency／auth 語意、Rails API endpoint |
| 衝突時                            | UX 依 frontend spec；欄位 enum 依 swagger；後端未提供的 UI 欄位由前端推導  |

產品已是**前後端分離**：Rails API（Dokku）提供 domain data 及 JWT auth；frontend（Vercel）是 React SPA，經 typed axios repository 讀寫。瀏覽器只持久化 session token 及表單 draft。

### 後端新增、swagger 未必齊全的欄位

Local domain type 必須補齊：

- `Transaction`：`id`、`created_at`、`updated_at`
- `RecurringRule`：`id`、`status`、`note`、`day_of_week`（0–6）、`day_of_month`（1–31）、`month_of_year`（1–12）、`created_at`、`updated_at`
- `Account`／`Category`／`Merchant`／`User`：`id`、timestamps；merchant 加 `usage_count`；account／category 加 `icon`、`color`
- `AiPreview`：confidence、parsed fields、missing／low-confidence flags

### 要模擬的 API 語意

- `Idempotency-Key`：create transaction／AI confirm 使用 UUID，同一 key 回傳同一結果
- `GET /me`：reload private route 用 token 驗證，hydration 完成前不 redirect login
- `409 already_materialized`：`run now` 今日已產生過交易
- `GET /recurring_rules?status=`：active／paused／ended filter（後端負責）
- Pagination：`page`、`per_page`（1–100，default 25）、`total`、`total_pages`
- Query：transactions 的 `from`／`to`／filter；dashboard／summaries 的 `date`；merchants 的 `q`

`.env`：`VITE_APP_ENV`（保留但未使用）、`VITE_API_URL`（API base，唯一必要 build-time 變數）。

---

## 關鍵決策

1. **單一 source of truth**：domain data 在後端。Frontend 由 `data/*Repository.ts`（axios）抓取，寫入 `appStore` 作 memory mirror；URL 負責可分享 filter；RHF 負責表單暫態。不引入 React Query／SWR。
2. **金額只做 integer cents**：所有加減於 `lib/money.ts`。UI 輸入 dollar string，submit 時才轉換為 cents；顯示用 `$`（`centsToDollars`）。
3. **時區固定 `Asia/Hong_Kong`**：全部 datetime 經由 `lib/date.ts`。顯示 `YYYY年M月D日` + 24 小時。
4. **Auth 是後端 JWT**：frontend 只持有 bearer token 作 route gate；密碼不 persist。
5. **圖片不 persist base64**。Preview 使用 object URL，unmount／logout 需 revoke。上載後才用遠端 URL。
6. **AI parse 由後端（DeepSeek）**：回傳 preview，缺失／低信心欄位要標示；必須人工覆核才 confirm。
7. **`tsconfig` 開啟 `strict`**。`erasableSyntaxOnly` 已開啟，使用 union type 而非 enum。Type-only import 使用 `import type`。
8. **UI 使用 Chakra UI v3**（Emotion）：design system 集中 `src/theme/system.ts`；共用 primitive 放 `src/components/`，feature 專屬放 feature 內。`@/*` alias → `src/*`。
9. **Refund 已於 2026-09-15 按用戶決定移除**（前後端一併刪除）。不再有 `POST /transactions/:id/refund`、`refund_of_id`、`net_amount_cents`、dashboard／summary 的 `refund_cents`。舊退款紀錄於 migration 轉成對應收入／支出後 drop column，帳戶餘額不會失準。若要還原，需將 API、欄位、UI、統計一併加回。
10. **部署**：backend 用 Dokku（`git push dokku main`，release 跑 `db:prepare`），frontend 用 Vercel（`vercel.json`，SPA fallback）。

---

## 共用約束（每步都須遵循）

- `import React` 放 TSX 第一行
- Component：`export const Name`
- Hook：`export function useXxx()`
- `<React.Fragment>`，不使用 `<>`
- `React.useState`／`React.useEffect`，不進行解構
- Component 內 handler 使用 arrow function，不包 `useCallback`（除非有實測需要）
- 其他 function 使用 `function name()`
- 不使用 `any`
- 修改完成後執行 `tsc -b` 及 Prettier；本專案不執行 ESLint 作為 agent 驗證步驟（build 前仍須 type-safe）
- **任何 UI／行為改動都要同步更新 `plan.md` 及 `frontend-spec.md`**：plan 於對應 Step 補註或新增 Post-MVP step；spec 更新相關章節。改完 code 唔更新 docs 當未完成

---

## Step 0 — 專案骨架及依賴

**狀態：已完成**

**執行：**

- 安裝：`react-router`、`zustand`、`react-hook-form`、`@hookform/resolvers`、`zod`、`react-intl`、`lucide-react`、`recharts`、`uuid`、`axios`、`@chakra-ui/react` + `@emotion/react`、`@iconify/react`、`vite-plugin-pwa`、`vitest`、`@testing-library/react`、`jsdom`、`@playwright/test`
- 路徑 alias：`@/*` → `src/*`（`tsconfig.json`、`tsconfig.app.json`、`vite.config.ts`）
- `vite.config.ts`：PWA plugin（dev 不 enable SW）、`test.environment = "jsdom"` + setup file、`advancedChunks` 手動拆 bundle
- `tsconfig.app.json`：`strict: true`；Vitest types
- `.env.example`：`VITE_APP_ENV=development`、`VITE_API_URL=http://localhost:3000`
- `index.html`：`lang="zh-Hant-HK"`、viewport + `viewport-fit=cover`、title 用繁中
    - **CSP 已於 2026-09-15 按用戶決定停用**：`index.html` 的 CSP meta 及 `vite.config.ts` 的 `app-csp` plugin 均已移除。原因為單據圖由 API origin 發出，`img-src 'self'` 會擋住。若要還原，需重新加回 meta，並將 API origin 補入 `img-src` 及 `connect-src`
- `src/index.css`：全 app 視覺交由 Chakra design system；只留 safe-area、`prefers-reduced-motion` 及 page-enter 動畫
- 建立目錄：`src/{routes,components/{layout},features/*,data,stores,hooks,lib,theme,test}`
- 刪除 Vite demo asset

**完成標準**：`pnpm dev` 可啟動；目錄齊全。

---

## Step 1 — Domain types 與 Zod schema

**狀態：已完成**

```ts
export type UUID = string;
export type Currency = "HKD";
export type TransactionKind = "income" | "expense" | "transfer";
export type TransactionSource = "manual" | "recurring" | "ai" | "import";
export type AccountKind = "cash" | "bank" | "credit_card" | "e_wallet" | "other";
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type RecurringStatus = "active" | "paused" | "ended";
export type SummaryPeriod = "daily" | "weekly" | "monthly";
export type CategoryKind = "income" | "expense";
```

`src/data/types.ts` 定義 entity／input type，`src/data/schema.ts` + `repositorySchemas.ts` 定義 Zod schema，response 一律經 schema parse 才寫入 store。

**完成標準**：types 無 `any`；response schema 對應後端 payload。

---

## Step 2 — Money 與 Date helpers + unit tests

**狀態：已完成**

Money（`src/lib/money.ts`）：

- `dollarsToCents(input: string): number | MoneyError`
- `centsToDollars(cents: number): string` → `$1,234.50`
- `formatSignedAmount({cents, kind})`：收入 `+`、支出 `-`、轉帳無正負號
- 拒絕：負數、0、超過兩位小數、科學記數、非數字

Date（`Asia/Hong_Kong`）：

- `nowIso()`、`toDisplayDate()` → `YYYY年M月D日`、`toDisplayDateTime()` 24 小時
- `daysFromToday()`（定期交易「今日／聽日／N 日後」用）
- `addPeriod`／`startOfPeriod`／`endOfPeriod` for daily／weekly／monthly
- Recurring `nextRunAt`（`src/lib/schedule.ts`）
- `calendar.ts` 放共用 HK calendar primitive

**完成標準**：金額及香港日期 boundary、`daysFromToday` 有 Vitest。

---

## Step 3 — API repository 核心

**狀態：已完成**

**檔案**：`src/data/apiRepository.ts`、`apiError.ts`、`localResult.ts`、`repositorySchemas.ts`、各 feature repository

- `apiRepository`：axios instance（baseURL = `VITE_API_URL`）、bearer token、`LocalResult<T>` 統一錯誤正規化（含後端 error code）
- 每個 feature 一個 repository（`authRepository`、`transactionsRepository`、`accountsRepository`、`categoriesRepository`、`merchantsRepository`、`receiptsRepository`、`dashboardRepository`、`summariesRepository`、`recurringRulesRepository`）
- Repository 不 throw，只回 `{ok: true, value}`／`{ok: false, error}`
- Repository 各有 unit test（mock axios）

**完成標準**：每個 repository 的 success／error path 有 Vitest。

---

## Step 4 — Auth repository + authStore

**狀態：已完成**

對照 swagger：`POST /auth/register`、`POST /auth/login`、`GET /me`

- Register：username trim 必填；password ≥ 8；重複 username → 一般化錯誤
- Login 失敗不透露 username 是否存在
- 成功：token 存 `localStorage`（`AUTH_TOKEN_STORAGE_KEY`）、`setSession(token, user)`
- `getMe(token)`：token 無效 → unauthorized
- 跨 tab：`storage` event → 其他 tab logout
- 密碼不 persist

**完成標準**：store 測試覆蓋 initial、set／clear、hydrate、logout cleanup。

---

## Step 5 — Domain repository（CRUD）

**狀態：已完成**

- Accounts：list／create／update／delete；`currency` 固定 HKD；刪除被使用 → `in_use` / 422
- Categories：list（按 kind + created_at）／create／update／delete；刪除歷史交易保留、`category_id` 變 null
- Merchants：search `q`／create／delete；MVP 不設 update；`usage_count` 由後端計
- Transactions：list（filter／sort／pagination）、get、create（idempotency）、update、delete、duplicate
- Receipts / AI：upload（jpeg／png／webp、≤10 MiB）→ parse → confirm（`source: "ai"` + idempotency key）
- Dashboard / summaries：dashboard(date)、summary(period, date, page)；轉帳不計入收支／淨額
- Recurring：list（可選 `status`）／create／update／delete／pause／resume／run_now／skip_next

**完成標準**：各 repository unit test（filter／sort／page、transfer 不計入 summary、idempotency、already_materialized、in_use）。

---

## Step 6 — appStore、uiStore、draftStore

**狀態：已完成**

**檔案**：`src/stores/appStore.ts`、`uiStore.ts`、`draftStore.ts` + tests

- `appStore`：accounts／categories／merchants／transactions／recurringRules、`referenceLoaded`、loading／error；**不 persist**（後端才是 source of truth）
- Selectors 只訂閱需要 slice：`useAppStore(s => s.transactions)`
- `uiStore`（不 persist）：`isMobileNavOpen`、`activeDialog`、`isOffline`、`installPrompt`
- `draftStore` persist `sessionStorage`：`transactionDraft`。**File／Blob／object URL 不 persist**
- Logout：原子 `clearSession` + `resetDrafts` + revoke object URLs + navigate `/login`

**完成標準**：store tests：selector、reset、draft persist 不含 File、logout cleanup。

---

## Step 7 — URL helpers、i18n（react-intl）、共用 hooks

**狀態：已完成**

- `src/lib/searchParams.ts`：transaction filter／summary／recurring status serialize／parse；`returnTo` 只接受站內 path
- i18n：`react-intl`，`main.tsx` 用 `<IntlProvider>`；locale 固定 `zh-HK`
- 文案集中 `src/lib/i18n.ts`（`MessageDescriptor`，`flattenMessages` 成 catalog）
- Component 用 `useIntl()`；data layer 用 module-level `formatMessage()`
- Hooks：`useOffline`、`useMediaQuery`（`DESKTOP_QUERY` 等）、`useDomainReference`

**完成標準**：URL round-trip、open redirect reject、插值／fallback 有測試。

---

## Step 8 — UI design system（Chakra UI v3）

**狀態：已完成**

使用 **Chakra UI v3**（Emotion）作基礎，design system 集中 `src/theme/system.ts`。

**基建**

- `createSystem(defaultConfig, config)`：自訂 `fontSizes`、`radii`、`brand` palette、semantic tokens（`bg`／`bg.panel`／`brand.solid`／`income`／`expense`／`transfer`）、低透明度多層 shadow
- Button recipe：ghost／outline／subtle hover 統一用 `brand.active`
- `src/index.css`：只留 safe-area、`prefers-reduced-motion`、`page-enter`（含 `scan-sweep`）
- 測試：Vitest `jsdom`、`pool: "vmThreads"`、`src/test/setup.ts`、`renderWithIntl.ts`（包 Chakra + Intl）

**共用 primitive**（`src/components/`）

- `layout/SectionCard`（標題／描述／action；header 補 `padding-bottom`）、`SummaryTotalsGrid`、`CategoryBreakdownChart`、`EntityAvatar`（account／category color + icon）、`TransactionKindIcon`、`ColorPicker`、`IconPicker`
- `layout/*`：`AppLayout`、`AppHeader`、`SidebarNav`、`MobileTabBar`、`OfflineBanner`、`PageHeader`、`LoadingIndicator`、`FullPageLoading`

**規則**

- 控件圓角 `l2`（10px）、card `xl`（14px）
- 收入 green／支出 red／轉帳 blue，**同時有正負號或 icon**
- touch ≥ 44px；icon-only 要 `aria-label`
- Dialog／Drawer：focus trap、Escape、關閉後 focus 返回觸發者

**完成標準**：layout／chart／form 元件有 RTL 測試。

---

## Step 9 — Layout、routing、route guard、PWA chrome

**狀態：已完成**

**Bootstrap** — `src/routes/useSessionBootstrap.ts`

1. `hydrateAuthStore()` 由 localStorage 讀取 token
2. token 有效即 `AuthRepository.getMe` 補回 user
3. **只有 `unauthorized` 才 `clearSession`**（其他錯誤保留 token，避免 offline reload 被登出）
4. 完成前 render `<FullPageLoading/>`，**不閃現 login**
5. `subscribeToAuthStorageEvents()` 支援跨 tab logout

**Routes** — `src/routes/AppRoutes.tsx`、`paths.ts`

- `ROUTES` 集中 path
- `RedirectIfAuthenticated`／`RequireAuth`（`returnTo` 經 `parseReturnTo`）
- `LazyRoute`（`React.lazy` + `Suspense`）：transactions、summaries、recurring、settings；dashboard／auth eager
- `NotFoundPage`（404）、`RouteErrorBoundary`（full-screen fatal fallback：重試／返回首頁／清除本機資料）

**Layout**

- `AppLayout`：mobile = app bar + 底部 4 tab + 中間 FAB；`md+` 可收合 sidebar；`lg+`（≥1024）固定 sidebar
- `AppHeader`：sidebar toggle（md+）、返回、定期交易（mobile）、掃描（一 click 開相機／上載）、登出
- `MobileTabBar`：儀表板／交易／報表／設定 + FAB
- `OfflineBanner`（`useOffline`）、`PwaBanners`（見 Step 19）

**完成標準**：`src/routes/*.test.tsx`：未登入 redirect、未 hydrate 顯示全頁 loading、有 token 直接 render。

---

## Step 10 — 登入／註冊

**狀態：已完成**

- `AuthCard`、`LoginForm`、`RegisterForm`、`PasswordField`、`LoginPage`／`RegisterPage`
- RHF + Zod；register 加 confirmPassword；password min 8
- 成功：`setSession` + `navigate(returnTo ?? "/")`，不顯示 toast
- 失敗：一般化錯誤 banner，不透露 username 是否存在
- `returnTo` 驗證並在兩頁互傳

**完成標準**：空表單顯示 field errors 且不送 request；成功登入／註冊寫 session + redirect；失敗不開 session；show／hide 切換。

---

## Step 11 — Dashboard `/`

**狀態：已完成**

Query `date` 預設當月，上／下月按鈕。內容次序依 spec 5.2。

實作備註：

- 三格數字（淨額／收入／支出）用共用 `SummaryTotalsGrid`，同一字級
- 快速動作只於 mobile 顯示（desktop 已有 sidebar／header）
- 分類 chart 用共用 `CategoryBreakdownChart`（收入／支出各一張，donut + 資料表；lazy load）
- 帳戶餘額、未來 7 日定期交易、最近 10 筆；最近交易 row 加 `TransactionKindIcon`；定期交易日期用相對日期
- 分類圖表顏色用該分類自訂 color，太淺則退回預設色序，令 donut 與表格頭像一致

**完成標準**：有／無資料兩態；轉帳不影響收支數字。

---

## Step 12 — 交易列表 `/transactions`

**狀態：已完成**

URL 同步全部 filter／sort／page。Mobile list row；desktop table。金額使用 `amount_cents`。無結果：清除 filter。換頁 scroll 至列表頂。`per_page` desktop 25／50／100。

實作備註：

- Mobile list 每行顯示分類頭像（color + icon）＋ 帳戶小頭像；desktop table 分類／帳戶欄同樣有頭像（共用 `EntityAvatar`）
- 快捷日期範圍 segmented control，mobile 撐滿一行（搜尋 + 篩選一行、日期一行）
- 交易詳情沿用 `/transactions/:id` route，mobile 開底部 drawer、desktop 開右側 drawer

**完成標準**：reload 還原 query；integration test。

---

## Step 13 — 新增／修改交易

**狀態：已完成（2026-09-15）**

Segmented control 切換 kind，欄位表依 spec 5.4。

- RHF + Zod
- Merchant autocomplete debounce 300ms；可即時建立
- 商戶與分類並排（md 2 欄、mobile 疊）；商戶排在分類之前
- Merchant 有 default category 時**自動套用**該分類（只在 kind 相符時）；2026-09-18 由「建議、不覆蓋」改成直接套用，見 Step 23
- 新增 merchant 時如已選分類，會將該分類寫入新 merchant 的 default category，見 Step 23
- Create 開啟表單即產生 UUID 作為 idempotency
- Edit 不更改 source
- Dirty leave：`useBlocker` 確認
- 離線：依 spec 8.3，離線仍可本地操作，banner 提示資料可能未更新
- 成功後同步所有 view；全 app 不顯示 toast
- 新增交易預設選取第一個帳戶；修改保留原有帳戶
- Segmented control 未選中狀態用 neutral 灰底；active 用品牌深綠

Desktop：右側 drawer。Mobile：底部 drawer（最高 92dvh）。直接進入 `/transactions/new`／edit URL 亦相同。Drawer 內 action 依表單正常 flow，不 sticky。

**完成標準（已達成）**：三種 kind 欄位切換及 validation、create cents payload／idempotency、edit payload、商戶建議／即時建立、dirty leave、responsive overlay route 均有測試；tsc、完整 Vitest 及 production build 通過。

---

## Step 14 — 交易詳情

**狀態：已完成（2026-09-15）**

顯示全部欄位、單據圖、source、時間。金額用 `amount_cents`。帳戶、分類／轉入帳戶欄顯示頭像。

Actions：修改、複製、刪除。（**不進行退款**，見關鍵決策 9）

實作備註：

- **Refund 已移除（2026-09-15）**：`refundModel.ts`、`TransactionRefundDialog`、詳情「退款」按鈕、列表退款 badge、dashboard 退款格、`refund_of_id`／`net_amount_cents`／`refund_cents` 均已刪除。後端 migration 將舊退款紀錄轉成對應收入／支出後 drop `refund_of_id`。
- 備註長文：`TransactionDetailRow` 使用 `preserveLineBreaks`（標籤在上、內容靠左、`pre-wrap`）
- `TransactionReceiptImages`：標題及縮圖靠右；縮圖是 button，開啟 lightbox dialog（置中）；`onError` 轉 fallback tile，不重複重試

**完成標準（已達成）**：delete、duplicate（成功轉往新詳情、失敗顯示錯誤）、圖片 lightbox 及 fallback 均有測試；Prettier、完整 Vitest 及 production build 通過。

---

## Step 15 — AI 單據（一 click 掃描）

**狀態：已完成（2026-09-15，one-click drawer redesign 2026-09-17）**

步驟：一 click 掃描 → 相機／上載 → 上載 → 後端 parse（DeepSeek）→ 在同頁彈出覆核 drawer → confirm。

實作備註：

- 已移除 `/scan` 頁面；`AppHeader`／`SidebarNav`／dashboard 快速動作／交易頁的 scan button 一律只作一 click 觸發
- `ScanProvider`（掛在 `AppLayout`）持有隱藏 file input 及 session state；`useScan().startScan()` 直接開相機／上載，選圖後自動上載、解析並彈出 `ScanDrawer`
- `ScanDrawer`：mobile 由底部升起、desktop 由右側滑入；上載／解析時顯示可取消進度，完成後切換成 `ScanReviewForm`
- `ScanStage`：只負責相片預覽 + 掃描遮罩 + 換相片入口（不再有拖放／大片拍攝區）
- `validateReceiptFile`／`RECEIPT_ACCEPT` 由 `receiptsRepository` 匯出，UI 與 repository 共用同一套類型／10 MiB 檢查
- `ScanProvider` 以 `runRef` generation counter 作取消；object URL 只留 component state
- `scanModel.ts`：`missingReviewFields`（逐欄「需覆核」badge）、`isLowConfidence`（< 0.6 警告）、`previewToReviewValues`（無法對應時留空）
- Idempotency key 於 `ScanReviewForm` mount 生成；confirm 失敗重試沿用同一條 key

**完成標準（已達成）**：一 click 開 file picker、類型／大小本地擋下、upload → parse → 覆核預填、低信心度及缺欄位標示、parse 失敗保留圖片可重試（不重複上載）／轉手動、取消解析、confirm payload（`source: "ai"`／`ai_import_log_id`／idempotency key）及轉往新詳情、confirm 失敗重用同一條 key，全部有測試。

---

## Step 16 — 報表 `/summaries`

**狀態：已完成（2026-09-15）**

Period segmented：日／週／月。上一期／下一期。URL：`period`、`date`、`page`。轉帳獨立、不計入淨額。Chart tooltip keyboard 可用 + 旁表。

實作備註：

- `useSummary` 以 `period`／`date`／`page` 做 request key
- `summariesFormat.ts`：`periodRange`／`periodRangeLabel`／`shiftPeriod`
- 分類分佈用共用 `CategoryBreakdownChart`（收入／支出各一張）；dashboard 與 summaries 共用並傳入 `categories` 令顏色／頭像一致
- 期內交易 row 加 `TransactionKindIcon`（跟 dashboard 一致）
- 共用抽出 `SectionCard`、`SummaryTotalsGrid`、`lib/categoryBreakdown`
- Recharts v3 `PieChart` 內建 accessibility layer：可鍵盤 focus ＋ 方向鍵移動 tooltip

**完成標準（已達成）**：週報範圍一至日、轉帳獨立不計入收支、各項 URL 同步、錯誤重試，全部有測試；tsc、完整 Vitest 及 production build 通過。

---

## Step 17 — 定期交易 `/recurring-rules`

**狀態：已完成（2026-09-15；card redesign + status filter 2026-09-16）**

Tabs：active／paused／ended。Create／edit 欄位依 spec 5.8。

實作備註：

- 狀態 tab 同步 URL `status`；`useRecurringRules` 以 `status`＋reload token 做 request key
- **後端 `GET /recurring_rules` 支援 `?status=` filter**（2026-09-16 修復：原本 controller 無視該 param，導致切換 tab 無效）
- `recurringRuleModel.ts`：`formValuesToInput` 用 `lib/schedule.nextRunAt`；編輯時排程未改則保留原 `next_run_at`
- 以 Zod 驗證頻率對應欄位、間隔正整數、結束日不早於開始日
- Card：分類頭像 + 標題／金額 + 狀態 badge + 排程 + 下次執行 + 帳戶／分類／商戶 chips；footer 動作 toolbar（主要動作用實色品牌綠，其餘每行兩個）
- run now 成功顯示新交易入口；`conflict_already_materialized` 顯示「今日已產生過交易」；skip next 列出日期；刪除說明保留已產生交易
- 新增／修改用右側（desktop）／底部（mobile）drawer；dirty leave 用 `useBlocker` + confirm dialog
- 2026-09-18：create／edit form 的商戶／分類並排、揀商戶自動套用 default category、新增商戶存 default category，跟交易表單一致（見 Step 23）

**完成標準（已達成）**：pause／resume／run now／skip next／delete 文案、tab 切換、empty state、schedule 描述及 `next_run_at` 計算均有測試；tsc、完整 Vitest 及 production build 通過。

---

## Step 18 — 設定

**狀態：已完成**

`/settings` 入口連到帳戶／分類／商戶。登出按鈕。

- 帳戶：list 顯示 icon／color；CRUD（drawer）；in_use 阻止刪除
- 分類：income／expense tabs；icon／color；刪除提示未分類
- 商戶：搜尋／建立／刪除；顯示 default category + usage；無 edit

**完成標準（已達成）**：刪除阻止／清空關聯測試；settings 系列頁面測試通過。

---

## Step 19 — PWA、install、offline

**狀態：已完成（2026-09-16）**

> CSP 已按用戶決定停用（見 Step 0），本步不再包含 CSP 項目。

- Manifest 繁中 name／short_name；`display: standalone`；`start_url`／`scope` `/`；theme 及 header；192／512 maskable + apple touch（正式 bitmap，不使用 Vite logo）
- SW：precache JS／CSS／icons／app shell；navigation Network First + timeout → shell
- Domain data **不進入 Cache Storage**
- 新版本使用頁內 banner 顯示「有新版本／重新載入」；dirty form 不 auto reload
- `beforeinstallprompt`：有互動及使用一段時間才出現一次；dismiss 不再打擾
- iOS Safari 非 standalone：短「加入主畫面」指引
- Production 才 enable SW

實作備註：

- Icons 由 `favicon.svg` 圖形合成 full-bleed 版本（綠底 + 置中圖示，落在 maskable safe zone 內），用 Chrome canvas 以目標尺寸 rasterize 出 `pwa-192x192.png`、`pwa-512x512.png`、`maskable-512x512.png`、`apple-touch-icon.png`（ImageMagick 內建 SVG renderer 會模糊，已棄用）
- `registerType: "prompt"` + `injectRegister: null`：由 app 自行註冊 SW（`useAppUpdate`），不使用 `virtual:pwa-register`，避免引入 `workbox-window` 依賴
- SW navigation：**NetworkFirst + `networkTimeoutSeconds: 3` + `precacheFallback: {fallbackURL: "/index.html"}`**；要顯式 `workbox.navigateFallback: undefined`，否則 VitePWA 預設的 cache-first `NavigationRoute` 會覆蓋 NetworkFirst
- Domain data 完全沒有 cache rule；只 precache 靜態 asset
- `useAppUpdate`：監聽 `updatefound`／`statechange`／`controllerchange`，有 controller = 更新、沒有 = 首次安裝；按下「重新載入」才 `SKIP_WAITING`
- `useInstallPrompt`：捕捉 `beforeinstallprompt`，有互動再等 20 秒才顯示一次；dismiss 寫入 localStorage
- `useIosInstallHint`：iOS（含 iPadOS MacIntel）非 standalone 時出「分享 → 加入主畫面」
- `PwaBanners` 於 `app.tsx` 全域掛載，一次只顯示一個

**完成標準（已達成）**：manifest 存在；production build 產生 SW（NetworkFirst + PrecacheFallback）；offline reload 由 precache 取回 app shell，本機 session／draft 仍可讀取；PWA hooks 有 Vitest 覆蓋。

---

## Step 20 — 測試及驗收

**狀態：部分完成**

- Vitest：money、date、URL、repository、stores、關鍵 forms、PWA hooks —— 已覆蓋（45 個 test file）
- Playwright critical paths（spec 12.3）—— **未實作**（尚未有 `playwright.config.ts`／e2e 目錄）
- Viewport：320×568、390×844、768×1024、1280×800、1440×900。無水平 overflow、dialog 可用、bottom nav safe-area
- 每步：Prettier、`tsc -b`、`pnpm run build`、必要時手動瀏覽器行一次主路徑

**待辦**：補 Playwright smoke（註冊→新增交易→轉帳→filter→定期→單據→logout→PWA／offline）。

---

## Step 21 — 部署

**狀態：已完成（2026-09-16）**

### Frontend（Vercel）

- `vercel.json`：
    - `installCommand: pnpm install --frozen-lockfile`（repo 同時存在過期 `package-lock.json`，必須明確指定 pnpm）
    - `buildCommand: pnpm run build`、`outputDirectory: dist`
    - SPA fallback：`rewrites: /(.*) → /index.html`（Vercel 先配對靜態檔，`/assets/*`、`/sw.js` 不受影響）
    - Headers：`/sw.js`、`manifest.webmanifest`、`apple-touch-icon.png` 設 `max-age=0, must-revalidate`；`/assets/*` 設 `immutable`
- `VITE_API_URL` 在 Vercel project 設定（production／preview）
- `.gitignore` 加 `.vercel`

### Backend（Dokku）

- `git push dokku main`；Procfile release：`db:prepare && db:migrate`；`bin/docker-entrypoint` 開 web 前再 `db:prepare`
- `storage/` 為持久 volume（SQLite primary + cache）
- CORS `CORS_ORIGINS` 需包含 frontend origin（見 `bin/dokku-setup.sh`）

**曾遇到的問題（記錄）**：`production_cache.sqlite3` 在 `db/cache_schema.rb` 仍是 `version: 1` 時建立，其後 schema version 改為 `20260914180000`，令 cache DB 的 `schema_migrations` 永遠不一致，release `db:migrate` 每次都嘗試再 `create_table` → `table "solid_cache_entries" already exists`；release 一旦失敗，primary 的 pending migration 亦不會執行。修法：更正 cache DB `schema_migrations`（或刪除 cache DB 等待重建）。根治：cache DB 不要放在持久 volume（改放 `tmp/`）。

---

## Step 22 — Post-MVP 調整（2026-09-16）

**狀態：已完成**

- 金額顯示由 `HK$` 改為 `$`（`centsToDollars` 源頭 + settings 頁 + 測試 + fixture + docs）
- 交易列表／詳情／dashboard／定期交易加入帳戶、分類頭像（`EntityAvatar`，color + icon）
- 交易 kind icon（`TransactionKindIcon`）統一 dashboard／summaries／定期交易
- 全 app confirm dialog 統一置中（Chakra `Dialog` 預設 `placement="top"`，一律加 `placement="center"`）
- `/scan` 移除，改為一 click 掃描 + 同頁覆核 drawer
- Dashboard 數字層次、定期交易卡片、`SectionCard` header padding 等視覺調整
- Transaction toolbar 快捷日期範圍 mobile 顯示

---

## Step 23 — Post-MVP 調整（2026-09-18）

**狀態：已完成**

交易／定期交易表單的商戶與分類互動（`TransactionForm` 同 `RecurringRuleForm`）：

- 商戶欄移到分類之前，md 以上並排（`SimpleGrid columns={{base: 1, md: 2}}`）、mobile 自動疊住
- 揀選有 `default_category_id` 的商戶，會即時將該分類套用到表單（只在分類 kind 與目前 kind 相符時）；同時移除舊有「建議分類／套用建議」提示，`transactions.form.categorySuggestion`／`applySuggestion` message 已刪
- 新增商戶 inline 後，如表單已揀分類，會將該分類寫入新商戶的 `default_category_id`（`MerchantsRepository.update`）並同步 appStore；先揀分類或先新增商戶都覆蓋（用 `createdMerchant` state + effect 實作）

Mobile 導航：

- 底部 tab bar 中間 FAB 的 press feedback 由 `transform: scale(0.95)` 改成背景色變化（`_active={{bg: "brand.emphasized"}}`）。iOS standalone 會將 `:active` 的 transform 當成 hover 內容變化，令第一次 tap 被食掉、要撳兩下；改用顏色變化保留 feedback 而唔影響 hit area

Docs：

- 本步同時更新 `frontend-spec.md` §5.4、§5.8、§5.9 及 §14；日後任何 UI／行為改動都要同步更新 `plan.md` 及 `frontend-spec.md`

---

## 建議實作批次（可並行時先完成依賴）

```text
Step 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7
                              → 8 → 9 → 10
                                         → 11, 12, 15, 16, 17, 18（feature 可分批）
                                         → 13, 14 依賴 12
                              → 19 可同 feature 後期並行
                              → 20 每步跟住加 test，最後補 E2E
                              → 21 部署
```

每步都要達到該步「完成標準」才進入下一步。Step 5 是最大塊，可再拆分為各 feature 小 PR，但須清楚 re-export。

---

## 明確不做

- 多貨幣、多用戶共享、CSV 匯入、push、雲端 backup UI
- 商戶 edit、分類 drag-and-drop
- 虛假 undo（hard delete）
- 退款功能（2026-09-15 已由產品決定移除）
- 密碼重設／email 驗證
