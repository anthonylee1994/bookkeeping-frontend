# 記帳 App 逐步實作規格

對齊 `frontend-spec.md`（產品／UX／本地資料規則）及 `swagger.yaml`（domain／input shape）。本文件是實作順序，並非重寫產品 spec。

## 兩份文件如何對齊

| 來源               | 角色                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `frontend-spec.md` | 產品範圍、頁面、互動、PWA、a11y、coding conventions、本地 repository／Zustand 規則                       |
| `swagger.yaml`     | Domain input／enum／pagination／idempotency／auth 語意。Local repository function 用同一套 payload shape |
| 衝突時             | UX 依 frontend spec；欄位 enum 依 swagger；swagger 欠缺的 UI 欄位由 frontend spec 補入 local type        |

MVP 是 **pure local prototype**。Repository 不發送 HTTP。Swagger path 僅作為 function 命名及語意對照（例如 `getMe` 對 `GET /api/v1/me`），方便日後更換為真實 API。

### Swagger 欠缺、frontend spec 必須具備的欄位

Local domain type 必須補齊，不可只複製 swagger input：

- `Transaction`：`id`、`created_at`、`updated_at`
- `RecurringRule`：`id`、`status`、`note`、`day_of_week`（0–6）、`day_of_month`（1–31）、`month_of_year`（1–12）、`created_at`、`updated_at`
- `Account`／`Category`／`Merchant`／`User`：`id`、timestamps；merchant 加 `usage_count`
- `AiPreview`：confidence、parsed fields、missing／low-confidence flags（swagger 只寫 200 description）

### Swagger 具備、frontend spec 要模擬的語意

- `Idempotency-Key`：create transaction／AI confirm 使用 UUID，同一 key 回傳同一結果
- `GET /me`：reload private route 用本地 session 驗證，hydration 完成前不 redirect login
- `409 already_materialized`：`run now` 今日已產生過交易時回傳本地錯誤碼
- Pagination：`page`、`per_page`（1–100，default 25）、`total`、`total_pages`
- Query：transactions 的 `from`／`to`；dashboard／summaries 的 `date`；merchants 的 `q`

`.env` 使用 spec 的 `VITE_APP_ENV`。`VITE_API_URL` 本版本不使用。

---

## 關鍵決策

1. **單一 source of truth**：domain data 位於 `data/authRepository.ts` + `appStore`。URL 負責可分享 filter。RHF 負責表單暫態。不引入 React Query／SWR。
2. **金額只做 integer cents**：所有加減於 `lib/money.ts`。UI 輸入 dollar string，submit 時才轉換為 cents。
3. **時區固定 `Asia/Hong_Kong`**：全部 datetime 經由 `lib/date.ts`。顯示 `YYYY年M月D日` + 24 小時。
4. **Auth 是 route gate**，不是安全邊界。Token 是本地 UUID。密碼不 persist 明文至 authStore；users 表只儲存必要欄位。
5. **圖片不 persist base64**。Preview 使用 object URL，unmount／logout 需 revoke。Fixture 圖片使用細小 public asset。
6. **AI parse 使用 deterministic fixture**，可依檔名／hash 選擇成功或失敗 mock。
7. **`tsconfig` 開啟 `strict`**。`erasableSyntaxOnly` 已開啟，使用 union type 而非 enum。Type-only import 使用 `import type`。
8. **UI primitives 使用 shadcn/ui**（Radix + Tailwind v4 style `radix-nova`）：`src/components/ui/` 直接放置 shadcn 生成的 component（已統一成專案 convention），專案自建的再 compose 上去。`@/*` alias → `src/*`。
9. **Refund 已於 2026-09-15 按用戶決定移除**（前後端一併刪除）。不再有 `POST /transactions/:id/refund`、`refund_of_id`、`net_amount_cents`、dashboard／summary 的 `refund_cents`。舊退款紀錄於 migration 轉成對應收入／支出（支出退款→收入、收入退款→支出）之後 drop column，帳戶餘額不會失準。若要還原，需將 API、欄位、UI、統計一併加回。

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
- 修改完成後執行 Prettier；本專案不執行 ESLint／tsc 作為 agent 驗證步驟（build 前仍須 type-safe）

---

## Step 0 — 專案骨架及依賴

**目標**：安裝完整技術棧、目錄、env、strict TS、基本 CSS token。

**執行：**

- 安裝：`react-router`、`zustand`、`react-hook-form`、`@hookform/resolvers`、`zod`、`react-intl`、`lucide-react`、`recharts`、`uuid`、`vite-plugin-pwa`、`vitest`、`@testing-library/react`、`jsdom`、`@playwright/test`
- shadcn UI 依賴（Step 8 用）：`radix-ui`、`class-variance-authority`、`cn`、`tw-animate-css`、`shadcn`（CLI + `shadcn/tailwind.css`）、`@testing-library/jest-dom`、`@testing-library/user-event`
- 路徑 alias：`@/*` → `src/*`（`tsconfig.json`、`tsconfig.app.json`、`vite.config.ts`）
- `vite.config.ts`：PWA plugin（dev 不 enable SW）、`test.environment = "jsdom"` + setup file
- `tsconfig.app.json`：`strict: true`；Vitest types
- `.env.example`：`VITE_APP_ENV=development`
- `index.html`：`lang="zh-Hant-HK"`、viewport + `viewport-fit=cover`、title 用繁中
    - **CSP 已於 2026-09-15 按用戶決定停用**：`index.html` 的 CSP meta 及 `vite.config.ts` 的 `app-csp` plugin 均已移除。原因為單據圖由 API origin 發出，`img-src 'self'` 會擋住。已提出可改為只放寬 `img-src`，用戶選擇完全停用。若要還原，需重新加回 meta，並將 `VITE_API_URL` 的 origin 補入 `img-src` 及 `connect-src`
- `src/index.css`：neutral-50 bg、emerald primary、touch 44px、letter-spacing 0、safe-area、`prefers-reduced-motion`
- 建立目錄：`src/{routes,components/{ui,layout},features/{auth,dashboard,transactions,receiptScan,summaries,recurringRules,accounts,categories,merchants},data,stores,hooks,lib,styles,test}`
- 刪除 Vite demo asset（`hero.png`、react/vite svg）如不再使用

**完成標準**：`pnpm dev` 可啟動；目錄齊全；尚未有業務 UI 亦可。

---

## Step 1 — Domain types 與 Zod schema

**檔案**：`src/data/types.ts`、`src/data/schema.ts`

對齊 swagger enums：

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

Entity（比 swagger input 多 id／timestamps／derived）：

- `User`：`id`、`username`、`created_at`
- `Account`：swagger `AccountInput` + `id`、`created_at`、`updated_at`、computed `balance_cents`
- `Category`：swagger `CategoryInput` + `id`、timestamps
- `Merchant`：swagger `MerchantInput` + `id`、`usage_count`、timestamps
- `Transaction`：swagger `TransactionInput` + `id`、timestamps
- `RecurringRule`：swagger `RecurringRuleInput` + spec 的 `day_of_week`／`day_of_month`／`month_of_year`／`status`／`note` + `id`、timestamps
- `PaginationMeta`：跟 spec
- `LocalError`：`{code, message, fields?}`；code 包括 `validation`、`unauthorized`、`not_found`、`conflict_already_materialized`、`in_use`、`storage_failed`

Input types 直接對應 swagger `*Input`。Fixtures 使用同一套 Zod parse，parse 失敗則不寫入 store。

**完成標準**：types 無 `any`；schema 可以 parse 下一步的 fixtures。

---

## Step 2 — Money 與 Date helpers + unit tests

**檔案**：`src/lib/money.ts`、`src/lib/date.ts`、`src/lib/schedule.ts`、`src/lib/calendar.ts`（內部共用 calendar primitive）、對應 `*.test.ts`

Money：

- `dollarsToCents(input: string): number | MoneyError`
- `centsToDollars(cents: number): string` → `$1,234.50`
- `formatSignedAmount({cents, kind})`：收入 `+`、支出 `-`、轉帳無正負號
- 拒絕：負數、0、超過兩位小數、科學記數、空白以外的 trim 失敗、非數字
- 加減只用 integer

Date（`Asia/Hong_Kong`）：

- `nowIso()`、`toDisplayDate()` → `YYYY年M月D日`
- `toDisplayDateTime()` 24 小時
- Month／week／day range：weekly 一至日
- `addPeriod`／`startOfPeriod`／`endOfPeriod` for daily／weekly／monthly
- Recurring `nextRunAt`（`src/lib/schedule.ts`）from start_on + frequency + interval + day fields
- `calendar.ts` 只放 `date.ts`／`schedule.ts` 共用的 HK calendar primitive（`toHongKongCalendar`、`addCalendarDays`、`daysInMonth` 等），不對外

**完成標準**：spec 12.1 金額及香港日期 boundary 有 Vitest。

---

## Step 3 — Fixtures、persistence、repository 核心

**檔案**：`src/data/fixtures.ts`、`src/data/persistence.ts`、`src/data/authRepository.ts`（骨架）、`src/lib/id.ts`

- UUID：用 `uuid` package（`v4`）
- Persistence key 版本化，例如 `bookkeeping.v1`
- `loadState()`／`saveState()`：失敗回傳 `storage_failed`，不 throw 未處理 exception
- Seed（註冊後或首次空白資料庫）：
    - 1 個現金帳戶（HKD，initial 0 或小額）
    - 預設收入／支出分類（飲食、交通、工資等，有 icon／color）
    - 數個 merchant
    - 十多筆交易（含收入、支出、轉帳）覆蓋 dashboard／filter demo
    - 1–2 條 recurring rule（active + paused）
- Repository 純同步、無 React import
- Idempotency map：key → created transaction id

**完成標準**：load／save round-trip；fixture 通過 Zod。

---

## Step 4 — Auth repository + authStore

對照 swagger：`POST /api/v1/auth/register`、`POST /api/v1/auth/login`、`GET /api/v1/me`

**檔案**：`src/data/authRepository.ts`（auth 部分）、`src/stores/authStore.ts`、`src/stores/authStore.test.ts`

- Register：username trim 必填；password ≥ 8；username 重複 → 一般化錯誤（不說明「已存在」等細節，login 失敗一律同一句）
- Login 失敗不透露 username 是否存在
- 成功：發出本地 token、`setSession(token, user)`、persist `localStorage`（zustand persist，有 version／migration）
- `getMe(token)`：token 無效 → unauthorized
- `clearSession`：清除 token／user
- 跨 tab：`storage` event → 其他 tab logout
- 密碼不放入 persist 的 user payload

**完成標準**：store 測試覆蓋 initial、set／clear、persist hydration、logout cleanup。

---

## Step 5 — Domain repository（CRUD 語意）

全部 function 同步、typed、更新 persistence。錯誤使用 `LocalError`，不模擬 HTTP status 數字；但 **code 對齊 swagger 語意**。

### Accounts — `/api/v1/accounts`

- list／create／update／delete
- `currency` 固定 `HKD`
- `balance_cents` = `initial_balance_cents` + income − expense − 轉出 + 轉入
- 刪除：如仍被 transaction 或 recurring rule 使用 → `in_use`，message 說明原因

### Categories — `/api/v1/categories`

- list（按 kind + created_at）
- create／update／delete
- 刪除：歷史交易保留，`category_id` 變為 `null`；提示文案位於 UI 層

### Merchants — `/api/v1/merchants`

- search `q`（name substring）
- create（name + optional `default_category_id`）
- delete：交易 `merchant_id` 清空；**MVP 不設 update**
- `usage_count` 由交易計算

### Transactions — `/api/v1/transactions`

- list：filter（from／to、kind、account、category、merchant、keyword note／payment_method／merchant name、min／max amount）、sort（occurred_at／amount_cents／created_at asc／desc）、pagination
- get by id
- create：需要 `Idempotency-Key`；kind 欄位規則依 spec 5.4；transfer 需要 `transfer_account_id` 且 ≠ `account_id`；`amount_cents >= 1`
- update：不可更改 `source`
- delete：hard delete 單筆交易
- duplicate：新 id、`occurred_at` = now、source 依產品（manual）、開啟新詳情由 UI 負責
- **不進行 refund**（見關鍵決策 9）

### Receipts / AI — `/api/v1/receipts/upload`、`/ai/parse`、`/ai/confirm`

- upload：驗證 jpeg／png／webp、≤ 10 MiB；回傳本地 object URL + sha256（Web Crypto）；**不把 file persist**
- parse：deterministic fixture；失敗可重試
- confirm：當作 create transaction，`source: "ai"`，帶 idempotency key

### Dashboard / summaries

- dashboard(date)：當月淨額、收入、支出、top 5 支出分類、帳戶餘額、未來 7 日 recurring、最近 10 筆
- summary(period, date, page)：收入／支出／淨額、分類分佈、帳戶分佈、轉帳摘要（**轉帳不計入收支／淨額**）、期內交易分頁
- weekly range 一至日

### Recurring — `/api/v1/recurring_rules` + `/{id}/{action}`

- list／create／update／delete（刪 rule 保留已產生交易）
- pause／resume／run_now／skip_next
- `run_now`：今日已 materialize → `conflict_already_materialized`
- `next_run_at` 使用香港時區 ISO
- skip_next 回傳將被跳過的日期，供 UI 確認文案使用

**完成標準**：repository unit tests：filter／sort／page、transfer 不計入 summary 收支、idempotency、already_materialized、delete account in_use。

---

## Step 6 — appStore、uiStore、draftStore

**檔案**：`src/stores/appStore.ts`、`uiStore.ts`、`draftStore.ts` + tests

- `appStore`：accounts／categories／merchants／transactions／recurringRules、loading／error。Persist domain 到 `localStorage`（或 repository 自己 persist，store 只是 memory mirror——選擇 **repository persist，store 由 repository 寫入後 setState**，避免雙重 cache）
- Selectors 只訂閱需要 slice：`useAppStore(s => s.transactions)`
- `uiStore`（不 persist）：`isMobileNavOpen`、`activeDialog`、`isOffline`、install prompt 狀態；全 app 不使用 toast
- `isOffline`：`navigator.onLine` + online／offline events
- `draftStore` persist `sessionStorage`：`transactionDraft`、`aiScan`（step、imageUrl string、preview）。**File／Blob／object URL 不 persist**
- Logout：原子 `clearSession` + `resetDrafts` + revoke object URLs + navigate `/login`

**完成標準**：store tests：selector、reset、draft persist 不含 File、logout cleanup。

---

## Step 7 — URL helpers、i18n（react-intl）、共用 hooks

**檔案**：`src/lib/searchParams.ts`、`src/lib/i18n.ts`、`src/main.tsx`、`src/hooks/useOffline.ts`、`useMediaQuery.ts`

- Transaction filter serialize／parse：`from`、`to`、`kind`、`account_id`、`category_id`、`merchant_id`、`q`、`min`、`max`、`sort`、`order`、`page`、`per_page`
- Summary：`period`、`date`、`page`
- `returnTo`：只接受站內 path（`/` 開頭、不可 `//`、不可 protocol）
- i18n 使用 `react-intl`：`main.tsx` 使用 `<IntlProvider>` 包住 app；locale 固定 `zh-HK`，MVP 無切換器
- 文案集中 `src/lib/i18n.ts`：每個 leaf 是 `MessageDescriptor`（`id` + `defaultMessage`），經 `flattenMessages` 組成 `intlMessages` catalog 供 `IntlProvider`
- component 內使用 `useIntl()`／`<FormattedMessage>`；非 React context（data layer）使用 module-level `intl` 的 `formatMessage()`
- Unit test：URL parse／serialize round-trip、open redirect reject、placeholder 插值、missing id fallback `defaultMessage`、catalog flatten

---

## Step 8 — UI primitives（shadcn + Tailwind）

使用 **shadcn/ui**（Radix primitives + Tailwind v4）做基礎，專案自建的再 compose 上去。

**基建**

- `components.json`（shadcn CLI，style `radix-nova`）；加 component：`pnpm dlx shadcn@latest add <name>`
- `src/lib/utils.ts`：`cn()`（`cn` package）
- `src/index.css`：shadcn semantic tokens（`:root` + `@theme inline`）；primary `emerald-700`、ring `emerald-500`；另 map `income`／`expense`／`transfer` 為 `text-income` 等 utility；radius control 6px、card 8px
- 測試：Vitest `jsdom`、`pool: "vmThreads"`（jsdom 每個 worker 只建立一次）、`src/test/setup.ts`（jest-dom、matchMedia／ResizeObserver／pointer-capture stubs）、`src/test/renderWithIntl.ts` 包 `IntlProvider`

**Components**（`src/components/ui/`）

- shadcn 生成：Button、Select、Textarea、Checkbox、Tabs、Dialog、Skeleton、Badge、Card、Table、Pagination、Label、RadioGroup、Tooltip
- 專案自建（compose shadcn／radix）：
    - `IconButton`：強制 `label`（accessible name）+ tooltip
    - `TextField`：label + error／hint；error 用 `aria-describedby`、`role="alert"`、`aria-invalid`
    - `SegmentedControl`：Radix RadioGroup，`radiogroup`／`radio` ARIA、keyboard 左右鍵
    - `Drawer`（右側）／`BottomSheet`（底部）：由 `Sheet` 包覆
    - `ConfirmDialog`：`AlertDialog`（可 `destructive`）
    - `Banner`：info／success／warning／error；error 用 `role="alert"`
    - `EmptyState`、`Amount`（使用 `lib/money.ts` + kind tone）
- shadcn 檔案由 CLI 生成後統一改成專案 convention：`export const` arrow component、`import React` 第一行、移除 `"use client"`、可見字串使用 i18n（`useIntl()`／`messages`）

**規則**（spec 2.2／10）

- radius：input／button 6px，card 8px
- primary `emerald-700`，focus ring `emerald-500`
- 收入 emerald／支出 rose／轉帳 blue，**同時有正負號或文字**
- touch ≥ 44px；body ≥ 16px；secondary ≥ 14px
- icon-only 要 `aria-label` + tooltip
- Dialog／Sheet：focus trap、Escape、關閉後 focus 返回觸發者；body 先 scroll
- Segmented control／tabs 使用正確 ARIA

**完成標準**：RTL tests（`src/components/ui/*.test.tsx`）：Dialog Escape + focus return、TextField `aria-describedby`、SegmentedControl radiogroup、Amount tone。

---

## Step 9 — Layout、routing、route guard、PWA chrome

**檔案**：`src/app.tsx`、`src/main.tsx`、`src/routes/*`、`src/components/layout/*`

**Bootstrap** — `src/routes/useSessionBootstrap.ts`

1. `hydrateAuthStore()` 由 localStorage 讀取 token
2. token 有效即 `AuthRepository.getMe`，成功後 `setSession` 補回 user
3. **只有 `unauthorized` 才 `clearSession`**（其他錯誤保留 token，避免 offline reload 被登出）
4. 完成前 render `<FullPageLoading/>`，**不閃現 login**
5. `subscribeToAuthStorageEvents()` 支援跨 tab logout

**Routes** — `src/routes/AppRoutes.tsx`、`paths.ts`

- `ROUTES` 集中 path（依 spec §4）
- `RedirectIfAuthenticated`：已登入進入 `/login`／`/register` → `/`
- `RequireAuth`：未登入 → `/login?returnTo=<pathname+search>`；`returnTo` 用 `parseReturnTo` 驗證
- `LazyRoute`（`React.lazy` + `Suspense`）lazy load：transactions、scan、summaries、recurring、settings（+ settings 三頁）；dashboard／auth eager
- `NotFoundPage`：catch-all 404
- `RouteErrorBoundary`（per route）：fatal 提供「重試」／「返回首頁」／「清除本機資料」

**Layout** — `src/components/layout/*`

- `AppLayout`：`<768` header 56px + bottom nav 5 項（掃描置中相機 icon）+ FAB；`768–1023` 可收合 sidebar；`≥1024` 固定 sidebar（多「定期交易」）；content max 1280px
- `SidebarNav`／`BottomNav`：`NavLink` active 樣式、`<nav aria-label>`；collapsed 使用 `sr-only` 保留 accessible name
- `AppHeader`：sidebar toggle（md+）、app name（mobile）、sign out（`useLogout` 原子清除 session／draft／domain）
- `AddTransactionFab`：bottom nav 上方；`OfflineBanner`：`useOffline()` + `Banner`
- `PublicLayout`、`PageHeader`、`FullPageLoading`

**PWA chrome**

- Manifest／theme color 已位於 `vite.config.ts`（emerald `#047857`）；`index.html` 有 viewport `viewport-fit=cover`、`theme-color`（CSP 已停用，見 Step 0）
- 正式 192／512 maskable icon、Apple touch icon、install prompt 留待 Step 19

Browser back 關閉 modal／drawer：dialog 狀態使用 URL search 或 history stack（`?dialog=` 或 `useBlocker`）留待 feature step（12–14）處理。

**完成標準**：`src/routes/*.test.tsx`：未登入 `/transactions?…` → `/login?returnTo=…`；未 hydrate 顯示全頁 loading 而非 login；有 token 直接 render private route 而不閃現 login；已登入 `/login` → `/`。

---

## Step 10 — 登入／註冊

**檔案**：`src/features/auth/*`

- `AuthCard`：Card 外殼（標題／描述／footer 連結）
- `LoginForm`：RHF + Zod（`username` 必填、`password` 必填）；submit 中 disable + inline `Loader2`；失敗使用 `Banner variant="error"` 顯示 repository 的一般化錯誤（不透露 username 是否存在）
- `RegisterForm`：schema 加 `confirmPassword`，`.refine` 不一致則出 `passwordMismatch`；`password` min 8；成功只送 `{username, password}` 至 repository
- 成功：`useAuthStore.setSession(token, user)` + `navigate(returnTo ?? "/")`，不顯示 toast
- `PasswordField`：`TextField` + `trailing` IconButton 切換 `type`（顯示／隱藏）；`TextField` 已加 `trailing` support（input 自動加 `pr-11`）
- `LoginPage`／`RegisterPage`：`useSearchParams` + `parseReturnTo` 驗證 `returnTo`，兩頁互相連結都保留 `returnTo`
- Zod 訊息集中 `messages.fields.*`（module 層 `formatMessage`）
- Seed 預設帳戶／分類由後端 `POST /auth/register` 負責；frontend 註冊成功等同登入

**完成標準**：`src/features/auth/*.test.tsx`：空表單顯示 field errors 且不發送 request；成功登入／註冊寫 session + redirect `returnTo`（沒有則 `/`）；失敗顯示一般化錯誤不開啟 session；密碼 min 8；兩次密碼不一致；show／hide 切換。（E2E #1 留待 Step 20）

---

## Step 11 — Dashboard `/`

Query `date` 預設當月。上／下月按鈕。

內容次序依 spec 5.2。Empty：主動作「新增第一筆交易」。Chart 有 legend + 金額 table。點擊分類／帳戶／最近交易前往已 filter 的列表或詳情。

Loading：與 layout 尺寸一致的 skeleton。

**完成標準**：有／無資料兩態；轉帳不影響收支數字。

---

## Step 12 — 交易列表 `/transactions`

URL 同步全部 filter／sort／page。Mobile list row；desktop table。金額使用 `amount_cents`。Skeleton 固定高度。無結果：清除 filter。換頁 scroll 至列表頂。`per_page` desktop 25／50／100。

點擊 row：所有 viewport 皆前往 `/transactions/:id`；route 保留交易列表做背景，mobile 開啟底部 drawer、desktop 開啟右側 drawer。

**完成標準**：reload 還原 query；integration test。

---

## Step 13 — 新增／修改交易

**狀態：已完成（2026-09-15）**

Segmented control 切換 kind，欄位表依 spec 5.4。

- RHF + Zod
- Merchant autocomplete debounce 300ms；可即時建立
- Merchant 有 default category 時建議分類，**不 silently 覆蓋用戶已選**
- Create 開啟表單即產生 UUID 作為 idempotency
- Edit 不更改 source
- Dirty leave：`useBlocker` 確認
- 離線：spec 5.4 寫 disable submit，但 8.3 寫 CRUD 離線照常。**依 8.3**：離線仍可本地寫入；5.4 的「disable」理解為不進行假網絡 retry。Banner 提示資料只在本機。
- 成功後同步所有 view；全 app 不顯示 toast
- 新增交易預設選取帳戶列表第一個帳戶；修改交易保留原有帳戶
- Segmented control 未選中狀態使用 neutral 灰底／灰色 hover；active 狀態使用品牌深綠

Desktop：右側 drawer。Mobile：底部 drawer（最高 92dvh）。兩者皆保留交易列表做遮罩後背景；直接進入 `/transactions/new`／edit URL 亦相同，不 render 空白中間頁。Drawer 內 action 依表單正常 flow，不 sticky。

**完成標準（已達成）**：三種 kind 欄位切換及 validation、create cents payload／idempotency、edit payload、商戶建議／即時建立、dirty leave、responsive overlay route 均有測試；ESLint、完整 Vitest 及 production build 通過。

---

## Step 14 — 交易詳情

**狀態：已完成（2026-09-15）**

顯示全部欄位、單據圖、source、時間。金額用 `amount_cents`。

Actions：修改、複製、刪除。（**不進行退款**，見關鍵決策 9）

- 複製成功前往新詳情，日期 now
- 刪除確認：此操作無法復原；成功返回列表
- 圖片 lightbox；失效 fallback，不無限重試

實作備註：

- **Refund 已移除（2026-09-15）**：`refundModel.ts`、`TransactionRefundDialog`、詳情「退款」按鈕、列表退款 badge、dashboard 退款格、`refund_of_id`／`net_amount_cents`／`refund_cents` 均已刪除。後端 migration 將舊退款紀錄轉成對應收入／支出後 drop `refund_of_id`。
- 備註長文：`TransactionDetailRow` 使用 `preserveLineBreaks`（標籤在上、內容靠左、`pre-wrap`／`keep-all`），不跟其他欄位靠右摺行
- `TransactionReceiptImages`：標題及縮圖靠右；縮圖是 button，開啟 lightbox dialog；`onError` 轉為 fallback tile，不會重複重試

**完成標準（已達成）**：delete、duplicate（成功轉往新詳情、失敗顯示錯誤）、圖片 lightbox 及 fallback 均有測試；Prettier、完整 Vitest（178 個）及 production build 通過。

---

## Step 15 — AI 單據 `/scan`

**狀態：已完成（2026-09-15）**

步驟：選擇圖片／拍攝 → 本地 mock parse → 覆核表單 → confirm。

1. `input file` `accept="image/jpeg,image/png,image/webp"` `capture="environment"`
2. 類型 + 10 MiB
3. object URL preview；progress 可取消
4. deterministic parse fixture
5. 低 confidence／缺欄位明顯標示
6. 補 account／category／merchant 後 repository confirm
7. UUID 防重複
8. parse 失敗：保留圖、重試或轉手動
9. draftStore 儲存 step；reload 清除無效 object URL

Lazy load 這個 feature。

實作備註：

- `validateReceiptFile`／`RECEIPT_ACCEPT` 由 `receiptsRepository` 匯出，UI 與 repository 共用同一套類型／10 MiB 檢查；UI 於上載前即使用它擋下，不合規不會發送 request
- `ScanPage` 使用 `runRef` generation counter 做取消：取消／換相之後，舊 run 回來發現 generation 不同即不再寫 state
- Object URL 只留在 component state（unmount 由 effect revoke），`draftStore.aiScan.imageUrl` 只存上載後的遠端 URL，所以 reload 之後 blob 失效也不會卡住
- 實際步驟由 `phase` + draft 推導（`step` derived），reload 後沒有圖即自動退回 idle，不會停在假「解析中」
- `scanModel.ts`：`missingReviewFields`（逐欄「需覆核」badge）、`isLowConfidence`（< 0.6 出警告 banner）、`previewToReviewValues`（無法對應名稱的商戶／分類留空，不亂猜）
- Idempotency key 於 `ScanReviewForm` mount 時生成；confirm 失敗重試沿用同一條 key
- `MerchantAutocomplete` 加 `defaultQuery`，AI 讀到但未建立的商戶名會帶入，一點擊即建立

**完成標準（已達成）**：類型／大小本地擋下、upload → parse → 覆核預填、低信心度及缺欄位標示、parse 失敗保留圖片可重試（不重複上載）／轉手動、取消解析、confirm payload（`source: "ai"`／`ai_import_log_id`／idempotency key）及轉往新詳情、confirm 失敗重用同一條 key、reload 後失效 object URL 退回 idle，全部有測試；Prettier、完整 Vitest（195 個）及 production build 通過。

---

## Step 16 — 報表 `/summaries`

**狀態：已完成（2026-09-15）**

Period segmented：日／週／月。上一期／下一期。URL：`period`、`date`、`page`。轉帳獨立、不計入淨額。Chart tooltip keyboard 可用 + 旁表。

完成內容：淨額／收入／支出、分類分佈（收入、支出各一張卡，donut + 資料表）、帳戶分佈、轉帳摘要、期內交易分頁。日期 picker + 上一期／下一期。

實作備註：

- `useSummary` 以 `period`／`date`／`page` 做 request key，一變即清除舊數據，免得期間標題與數字對不上
- URL state 沿用 `parseSummaryParams`／`serializeSummaryParams`；換期間或日期會自動清 `page` 返回第一頁
- `summariesFormat.ts`：`periodRange`／`periodRangeLabel`（週報明文寫「星期一至星期日」）／`shiftPeriod`（以原本 anchor 加減整個期間）
- 轉帳來自 API `transfers`，獨立一卡並註明不計入收入／支出／淨額；`summary.transactions` 後端已排除轉帳，所以「期內交易」只列收入及支出
- 分類分佈不使用 tab：收入及支出各自一張 `CategoryBreakdownChart` 卡；dashboard 與 summaries 共用（dashboard 照舊 lazy load）
- Back-end `summaries#by_category` 及 `dashboard#category_breakdown` 都改為 group 非轉帳交易並回傳 `income_cents` + `expense_cents`；dashboard 由 frontend 自行取每種 Top 5
- 抽出共用 `components/layout/SectionCard`（原本 dashboard `DashboardSection`）、`components/SummaryTotalsGrid`（dashboard／summaries 三格數字）及 `lib/categoryBreakdown`（原本 dashboard `dashboardFormat`，`rankCategories` 支援收入／支出）
- Mobile 排版：淨額橫跨兩格、收入／支出各佔一格（三格只在 md 以上）；金額使用 `clamp()` 隨 viewport 縮放，避免窄機（320px）斷行；期間導覽 label 及日期 picker 在 mobile 上下分開；`SectionCard` padding 收窄（base 4／md 6）；列表金額 `nowrap` + `flexShrink="0"`，長備註會 truncate 而不會擠壓金額；dashboard 月份導覽 mobile 撐滿一行（`PageHeader` 加 `actionsFullWidth`，desktop 維持右上角）
- Recharts v3 `PieChart` 內建 accessibility layer：圖表可鍵盤 focus ＋ 方向鍵移動 tooltip；旁邊附完整資料表及 caption

**完成標準（已達成）**：週報範圍一至日（`periodRange` 測試）、轉帳獨立不計入收支（fixture transfers 20000 但 net 仍為 income−expense）、dashboard 及 summaries 各有收入／支出兩張分類卡、period／date／page URL 同步、換期間／日期及分頁重新 fetch、錯誤重試，全部有測試；Prettier、完整 Vitest（193 個）及 production build 通過（後端 `phase6_spec` 亦通過）。

---

## Step 17 — 定期交易 `/recurring-rules`

**狀態：已完成（2026-09-15）**

Tabs：active／paused／ended。Create／edit 欄位依 spec 5.8。Actions 確認文案：

- run now 成功顯示新交易入口
- already_materialized →「今日已產生過交易」
- skip next 列出日期
- 刪除只刪 rule

完成內容：狀態 tabs、每張卡顯示類型、金額、頻率、下次執行、帳戶／分類／商戶及狀態；create／edit drawer（kind、金額、帳戶、分類、商戶、備註、頻率、間隔、週／月／年相關日期、開始日、可選結束日）；pause／resume／run now／skip next／edit／delete。

實作備註：

- 狀態 tab 使用 Chakra `Tabs`，同步 URL `status`（`parseRecurringStatus`／`serializeRecurringStatus`，預設 `active`）；`useRecurringRules` 以 `status`＋reload token 做 request key，切 tab 即清除舊數據
- `recurringRuleModel.ts`：`formValuesToInput` 使用 `lib/schedule.nextRunAt` 由開始日計算出香港時區 ISO `next_run_at`；編輯時若排程欄位沒有更改，保留原本 `next_run_at`，免得重算成過去日期而觸發重複入帳
- Zod schema 做頻率對應欄位驗證（weekly 需要 `day_of_week`、monthly／yearly 需要 `day_of_month`、yearly 需要 `month_of_year`）、間隔正整數、結束日不早於開始日
- `runNow` 成功顯示「已產生交易」及連往新交易詳情的入口；`conflict_already_materialized` 直接顯示 repository 的「今日已產生過交易」訊息
- `skip next` 確認文案列出 `next_run_at` 日期；刪除文案說明只刪 rule、已產生交易會保留
- 新增／修改用右側（desktop）／底部（mobile）drawer；有未儲存改動離開時先確認（`useBlocker`＋drawer 內 confirm dialog）
- Create 預設選擇第一帳戶；跑完動作後 reload 清單，新增／修改成功會自動切換至該 rule 狀態的 tab
- Mobile 底部 tab bar 只有 4 格（供 FAB 佔中間），所以定期交易入口放在 header（`RepeatIcon`，跟掃描一樣只在 mobile 顯示；desktop 使用 sidebar）

**完成標準（已達成）**：pause／resume／run now（成功入口及 already_materialized）／skip next 日期／delete 文案、tab 切換、empty state、schedule 描述及 `next_run_at` 計算均有測試；Prettier、完整 Vitest（212 個）及 production build 通過。

---

## Step 18 — 設定

`/settings` 入口連到帳戶／分類／商戶。登出按鈕。

帳戶：list name／kind／icon／color／initial／HKD；CRUD；in_use 阻止刪除。

分類：income／expense tabs；依建立時間排列；刪除提示未分類。

商戶：搜尋／建立／刪除；顯示 default category + usage；無 edit。

**完成標準**：刪除阻止／清空關聯測試。

---

## Step 19 — PWA、install、offline

> CSP 已按用戶決定停用（見 Step 0），本步不再包含 CSP 項目。

- Manifest 繁中 name／short_name；`display: standalone`；`start_url`／`scope` `/`；theme 及 header；192／512 maskable + apple touch（正式 bitmap，不使用 Vite logo）
- SW：precache JS／CSS／fonts／icons／offline shell；navigation Network First + timeout → shell
- Domain data **不進入 Cache Storage**
- 新版本使用頁內 banner 顯示「有新版本／重新載入」；dirty form 不 auto reload
- `beforeinstallprompt`：有互動及使用一段時間才出現一次；dismiss 不再打擾
- iOS Safari 非 standalone：短「加入主畫面」指引
- Production 才 enable SW（localhost 可）

**完成標準**：manifest 存在；offline 可讀 local data。

---

## Step 20 — 測試及驗收

Vitest：money、date、URL、repository、stores、關鍵 forms。

Playwright critical paths（spec 12.3）：

1. Register → 見到預設現金帳戶及分類
2. 新增支出 → dashboard／列表反映
3. 新增轉帳 → 報表不計入收支
4. 搜尋篩選 → reload 保留
5. 定期：建立 → pause → resume → run now
6. 單據 → AI preview → 修正 → confirm
7. Logout → 無法進入 private
8. Manifest／SW／offline fallback（能測多少測多少）

Viewport：320×568、390×844、768×1024、1280×800、1440×900。無水平 overflow、dialog 可用、bottom nav safe-area。

最後：Prettier、`pnpm run build`、手動以瀏覽器執行一次主路徑。

---

## 建議實作批次（可並行時先完成依賴）

```text
Step 0
  → 1 → 2 → 3 → 4 → 5 → 6 → 7
                              → 8 → 9 → 10
                                         → 11, 12, 15, 16, 17, 18（feature 可分批）
                                         → 13, 14 依賴 12
                              → 19 可同 feature 後期並行
                              → 20 每步跟住加 test，最後補 E2E
```

每步都要達到該步「完成標準」才進入下一步。Step 5 是最大塊，可再拆分為 accounts／categories／merchants／transactions／summaries／recurring 六個小 PR，但須同一 repository 檔或清楚 re-export。

---

## 明確不做（依 spec 0.2／15）

- 真 API call、JWT、忘記密碼
- 多貨幣、多用戶、CSV 匯入、push、雲同步
- 商戶 edit、分類 drag-and-drop
- 虛假 undo（hard delete）
- 退款功能（2026-09-15 已由產品決定移除）
- 聲稱真實 OCR／AI
