# 記帳 App 逐步實作規格

對齊 `frontend-spec.md`（產品／UX／本地資料規則）同 `swagger.yaml`（domain／input shape）。呢份文件係實作順序，唔係重寫產品 spec。

## 兩份文件點對齊

| 來源               | 角色                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `frontend-spec.md` | 產品範圍、頁面、互動、PWA、a11y、coding conventions、本地 repository／Zustand 規則                       |
| `swagger.yaml`     | Domain input／enum／pagination／idempotency／auth 語意。Local repository function 用同一套 payload shape |
| 衝突時             | UX 跟 frontend spec；欄位 enum 跟 swagger；swagger 缺嘅 UI 欄位由 frontend spec 補入 local type          |

MVP 係 **pure local prototype**。Repository 唔發 HTTP。Swagger path 只作為 function 命名同語意對照（例如 `getMe` 對 `GET /api/v1/me`），方便日後換真 API。

### Swagger 缺、frontend spec 要有嘅欄位

Local domain type 必須補齊，唔可以只抄 swagger input：

- `Transaction`：`id`、`created_at`、`updated_at`
- `RecurringRule`：`id`、`status`、`note`、`day_of_week`（0–6）、`day_of_month`（1–31）、`month_of_year`（1–12）、`created_at`、`updated_at`
- `Account`／`Category`／`Merchant`／`User`：`id`、timestamps；merchant 加 `usage_count`
- `AiPreview`：confidence、parsed fields、missing／low-confidence flags（swagger 只寫 200 description）

### Swagger 有、frontend spec 要模擬嘅語意

- `Idempotency-Key`：create transaction／AI confirm 用 UUID，同一 key 回同一結果
- `GET /me`：reload private route 用本地 session 驗證，hydration 完成前唔 redirect login
- `409 already_materialized`：`run now` 今日已產生過交易時回本地錯誤碼
- Pagination：`page`、`per_page`（1–100，default 25）、`total`、`total_pages`
- Query：transactions 嘅 `from`／`to`；dashboard／summaries 嘅 `date`；merchants 嘅 `q`

`.env` 用 spec 嘅 `VITE_APP_ENV`。`VITE_API_URL` 呢版唔用。

---

## 關鍵決策

1. **單一 source of truth**：domain data 喺 `data/authRepository.ts` + `appStore`。URL 管可分享 filter。RHF 管表單暫態。唔引入 React Query／SWR。
2. **金額只做 integer cents**：所有加減喺 `lib/money.ts`。UI 輸入 dollar string，submit 先轉 cents。
3. **時區固定 `Asia/Hong_Kong`**：全部 datetime 經 `lib/date.ts`。顯示 `YYYY年M月D日` + 24 小時。
4. **Auth 係 route gate**，唔係安全邊界。Token 係本地 UUID。密碼唔 persist 明文到 authStore；users 表只存必要欄位。
5. **圖片唔 persist base64**。Preview 用 object URL，unmount／logout 要 revoke。Fixture 圖片用細小 public asset。
6. **AI parse 用 deterministic fixture**，可按檔名／hash 選成功或失敗 mock。
7. **`tsconfig` 開 `strict`**。`erasableSyntaxOnly` 已開，用 union type 唔用 enum。Type-only import 用 `import type`。
8. **UI primitives 用 shadcn/ui**（Radix + Tailwind v4 style `radix-nova`）：`src/components/ui/` 直接放 shadcn 生成嘅 component（已統一成專案 convention），專案自建嘅再 compose 上去。`@/*` alias → `src/*`。
9. **Refund 已於 2026-09-15 按用戶決定移除**（前後端一齊剷）。唔再有 `POST /transactions/:id/refund`、`refund_of_id`、`net_amount_cents`、dashboard／summary 嘅 `refund_cents`。舊退款紀錄喺 migration 轉成對應收入／支出（支出退款→收入、收入退款→支出）之後 drop column，帳戶餘額唔會歪。想還原就要連 API、欄位、UI、統計一齊加返。

---

## 共用約束（每步都要跟）

- `import React` 放 TSX 第一行
- Component：`export const Name`
- Hook：`export function useXxx()`
- `<React.Fragment>`，唔用 `<>`
- `React.useState`／`React.useEffect`，唔解構
- Component 內 handler 用 arrow function，唔包 `useCallback`（除非有實測需要）
- 其他 function 用 `function name()`
- 唔用 `any`
- 改完跑 Prettier；呢個專案唔跑 ESLint／tsc 作為 agent 驗證步驟（build 前仍要 type-safe）

---

## Step 0 — 專案骨架同依賴

**目標**：裝齊技術棧、目錄、env、strict TS、基本 CSS token。

**做：**

- 安裝：`react-router`、`zustand`、`react-hook-form`、`@hookform/resolvers`、`zod`、`react-intl`、`lucide-react`、`recharts`、`uuid`、`vite-plugin-pwa`、`vitest`、`@testing-library/react`、`jsdom`、`@playwright/test`
- shadcn UI 依賴（Step 8 用）：`radix-ui`、`class-variance-authority`、`cn`、`tw-animate-css`、`shadcn`（CLI + `shadcn/tailwind.css`）、`@testing-library/jest-dom`、`@testing-library/user-event`
- 路徑 alias：`@/*` → `src/*`（`tsconfig.json`、`tsconfig.app.json`、`vite.config.ts`）
- `vite.config.ts`：PWA plugin（dev 唔 enable SW）、`test.environment = "jsdom"` + setup file
- `tsconfig.app.json`：`strict: true`；Vitest types
- `.env.example`：`VITE_APP_ENV=development`
- `index.html`：`lang="zh-Hant-HK"`、viewport + `viewport-fit=cover`、title 用繁中
    - **CSP 已於 2026-09-15 按用戶決定停用**：`index.html` 嘅 CSP meta 同 `vite.config.ts` 嘅 `app-csp` plugin 均已移除。原因係單據圖由 API origin 出，`img-src 'self'` 會擋住。已提出可改為只放寬 `img-src`，用戶選擇完全停用。想還原就重新加返 meta，並將 `VITE_API_URL` 嘅 origin 補入 `img-src` 同 `connect-src`
- `src/index.css`：neutral-50 bg、emerald primary、touch 44px、letter-spacing 0、safe-area、`prefers-reduced-motion`
- 建目錄：`src/{routes,components/{ui,layout},features/{auth,dashboard,transactions,receiptScan,summaries,recurringRules,accounts,categories,merchants},data,stores,hooks,lib,styles,test}`
- 刪 Vite demo asset（`hero.png`、react/vite svg）如唔再使用

**完成標準**：`pnpm dev` 起得；目錄齊；未有業務 UI 都得。

---

## Step 1 — Domain types 同 Zod schema

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
- `RecurringRule`：swagger `RecurringRuleInput` + spec 嘅 `day_of_week`／`day_of_month`／`month_of_year`／`status`／`note` + `id`、timestamps
- `PaginationMeta`：跟 spec
- `LocalError`：`{code, message, fields?}`；code 包括 `validation`、`unauthorized`、`not_found`、`conflict_already_materialized`、`in_use`、`storage_failed`

Input types 直接對 swagger `*Input`。Fixtures 用同一套 Zod parse，parse 失敗就唔入 store。

**完成標準**：types 無 `any`；schema 可以 parse 下一步 fixtures。

---

## Step 2 — Money 同 Date helpers + unit tests

**檔案**：`src/lib/money.ts`、`src/lib/date.ts`、`src/lib/schedule.ts`、`src/lib/calendar.ts`（內部共用 calendar primitive）、對應 `*.test.ts`

Money：

- `dollarsToCents(input: string): number | MoneyError`
- `centsToDollars(cents: number): string` → `HK$1,234.50`
- `formatSignedAmount({cents, kind})`：收入 `+`、支出 `-`、轉帳無正負號
- 拒絕：負數、0、超過兩位小數、科學記數、空白以外嘅 trim 失敗、非數字
- 加減只用 integer

Date（`Asia/Hong_Kong`）：

- `nowIso()`、`toDisplayDate()` → `YYYY年M月D日`
- `toDisplayDateTime()` 24 小時
- Month／week／day range：weekly 一至日
- `addPeriod`／`startOfPeriod`／`endOfPeriod` for daily／weekly／monthly
- Recurring `nextRunAt`（`src/lib/schedule.ts`）from start_on + frequency + interval + day fields
- `calendar.ts` 只放 `date.ts`／`schedule.ts` 共用嘅 HK calendar primitive（`toHongKongCalendar`、`addCalendarDays`、`daysInMonth` 等），唔對外

**完成標準**：spec 12.1 金額同香港日期 boundary 有 Vitest。

---

## Step 3 — Fixtures、persistence、repository 核心

**檔案**：`src/data/fixtures.ts`、`src/data/persistence.ts`、`src/data/authRepository.ts`（骨架）、`src/lib/id.ts`

- UUID：用 `uuid` package（`v4`）
- Persistence key 版本化，例如 `bookkeeping.v1`
- `loadState()`／`saveState()`：失敗回 `storage_failed`，唔 throw 未處理 exception
- Seed（註冊後或首次空庫）：
    - 1 個現金帳戶（HKD，initial 0 或細額）
    - 預設收入／支出分類（飲食、交通、工資等，有 icon／color／position）
    - 幾個 merchant
    - 十幾筆交易（含收入、支出、轉帳）覆蓋 dashboard／filter demo
    - 1–2 條 recurring rule（active + paused）
- Repository 純同步、無 React import
- Idempotency map：key → created transaction id

**完成標準**：load／save round-trip；fixture 過 Zod。

---

## Step 4 — Auth repository + authStore

對照 swagger：`POST /api/v1/auth/register`、`POST /api/v1/auth/login`、`GET /api/v1/me`

**檔案**：`src/data/authRepository.ts`（auth 部分）、`src/stores/authStore.ts`、`src/stores/authStore.test.ts`

- Register：username trim 必填；password ≥ 8；username 重複 → 一般化錯誤（唔講「已存在」過細，login 失敗一律同一句）
- Login 失敗唔透露 username 是否存在
- 成功：發本地 token、`setSession(token, user)`、persist `localStorage`（zustand persist，有 version／migration）
- `getMe(token)`：token 無效 → unauthorized
- `clearSession`：清 token／user
- 跨 tab：`storage` event → 其他 tab logout
- 密碼唔放入 persist 嘅 user payload

**完成標準**：store 測試覆蓋 initial、set／clear、persist hydration、logout cleanup。

---

## Step 5 — Domain repository（CRUD 語意）

全部 function 同步、typed、更新 persistence。錯誤用 `LocalError`，唔模擬 HTTP status 數字；但 **code 對齊 swagger 語意**。

### Accounts — `/api/v1/accounts`

- list／create／update／delete
- `currency` 固定 `HKD`
- `balance_cents` = `initial_balance_cents` + income − expense − 轉出 + 轉入
- 刪除：如仍被 transaction 或 recurring rule 使用 → `in_use`，message 講明原因

### Categories — `/api/v1/categories`

- list（按 kind + position）
- create／update／delete
- 刪除：歷史交易保留，`category_id` 變 `null`；提示文案喺 UI 層

### Merchants — `/api/v1/merchants`

- search `q`（name substring）
- create（name + optional `default_category_id`）
- delete：交易 `merchant_id` 清空；**MVP 無 update**
- `usage_count` 由交易計

### Transactions — `/api/v1/transactions`

- list：filter（from／to、kind、account、category、merchant、keyword note／payment_method／merchant name、min／max amount）、sort（occurred_at／amount_cents／created_at asc／desc）、pagination
- get by id
- create：要 `Idempotency-Key`；kind 欄位規則跟 spec 5.4；transfer 要 `transfer_account_id` 且 ≠ `account_id`；`amount_cents >= 1`
- update：不可改 `source`
- delete：hard delete 單筆交易
- duplicate：新 id、`occurred_at` = now、source 跟產品（manual）、打開新詳情由 UI 做
- **唔做 refund**（見關鍵決策 9）

### Receipts / AI — `/api/v1/receipts/upload`、`/ai/parse`、`/ai/confirm`

- upload：驗證 jpeg／png／webp、≤ 10 MiB；回本地 object URL + sha256（Web Crypto）；**唔把 file persist**
- parse：deterministic fixture；失敗可重試
- confirm：當 create transaction，`source: "ai"`，帶 idempotency key

### Dashboard / summaries

- dashboard(date)：當月淨額、收入、支出、top 5 支出分類、帳戶餘額、未來 7 日 recurring、最近 10 筆
- summary(period, date, page)：收入／支出／淨額、分類分佈、帳戶分佈、轉帳摘要（**轉帳唔入收支／淨額**）、期內交易分頁
- weekly range 一至日

### Recurring — `/api/v1/recurring_rules` + `/{id}/{action}`

- list／create／update／delete（刪 rule 保留已產生交易）
- pause／resume／run_now／skip_next
- `run_now`：今日已 materialize → `conflict_already_materialized`
- `next_run_at` 用香港時區 ISO
- skip_next 回將被跳過嘅日期，畀 UI 確認文案用

**完成標準**：repository unit tests：filter／sort／page、transfer 唔入 summary 收支、idempotency、already_materialized、delete account in_use。

---

## Step 6 — appStore、uiStore、draftStore

**檔案**：`src/stores/appStore.ts`、`uiStore.ts`、`draftStore.ts` + tests

- `appStore`：accounts／categories／merchants／transactions／recurringRules、loading／error。Persist domain 到 `localStorage`（或 repository 自己 persist，store 只係 memory mirror——選 **repository persist，store 由 repository 寫入後 setState**，避免雙重 cache）
- Selectors 只訂閱需要 slice：`useAppStore(s => s.transactions)`
- `uiStore`（唔 persist）：`isMobileNavOpen`、`activeDialog`、`isOffline`、install prompt 狀態；全 app 不使用 toast
- `isOffline`：`navigator.onLine` + online／offline events
- `draftStore` persist `sessionStorage`：`transactionDraft`、`aiScan`（step、imageUrl string、preview）。**File／Blob／object URL 唔 persist**
- Logout：原子 `clearSession` + `resetDrafts` + revoke object URLs + navigate `/login`

**完成標準**：store tests：selector、reset、draft persist 唔含 File、logout cleanup。

---

## Step 7 — URL helpers、i18n（react-intl）、共用 hooks

**檔案**：`src/lib/searchParams.ts`、`src/lib/i18n.ts`、`src/main.tsx`、`src/hooks/useOffline.ts`、`useMediaQuery.ts`

- Transaction filter serialize／parse：`from`、`to`、`kind`、`account_id`、`category_id`、`merchant_id`、`q`、`min`、`max`、`sort`、`order`、`page`、`per_page`
- Summary：`period`、`date`、`page`
- `returnTo`：只接受站內 path（`/` 開頭、唔得 `//`、唔得 protocol）
- i18n 用 `react-intl`：`main.tsx` 用 `<IntlProvider>` 包住 app；locale 固定 `zh-HK`，MVP 無切換器
- 文案集中 `src/lib/i18n.ts`：每個 leaf 係 `MessageDescriptor`（`id` + `defaultMessage`），經 `flattenMessages` 砌成 `intlMessages` catalog 畀 `IntlProvider`
- component 內用 `useIntl()`／`<FormattedMessage>`；非 React context（data layer）用 module-level `intl` 嘅 `formatMessage()`
- Unit test：URL parse／serialize round-trip、open redirect reject、placeholder 插值、missing id fallback `defaultMessage`、catalog flatten

---

## Step 8 — UI primitives（shadcn + Tailwind）

用 **shadcn/ui**（Radix primitives + Tailwind v4）做基礎，專案自建嘅再 compose 上去。

**基建**

- `components.json`（shadcn CLI，style `radix-nova`）；加 component：`pnpm dlx shadcn@latest add <name>`
- `src/lib/utils.ts`：`cn()`（`cn` package）
- `src/index.css`：shadcn semantic tokens（`:root` + `@theme inline`）；primary `emerald-700`、ring `emerald-500`；另 map `income`／`expense`／`transfer` 做 `text-income` 等 utility；radius control 6px、card 8px
- 測試：Vitest `jsdom`、`pool: "vmThreads"`（jsdom 每個 worker 只建一次）、`src/test/setup.ts`（jest-dom、matchMedia／ResizeObserver／pointer-capture stubs）、`src/test/renderWithIntl.ts` 包 `IntlProvider`

**Components**（`src/components/ui/`）

- shadcn 生成：Button、Select、Textarea、Checkbox、Tabs、Dialog、Skeleton、Badge、Card、Table、Pagination、Label、RadioGroup、Tooltip
- 專案自建（compose shadcn／radix）：
    - `IconButton`：強制 `label`（accessible name）+ tooltip
    - `TextField`：label + error／hint；error 用 `aria-describedby`、`role="alert"`、`aria-invalid`
    - `SegmentedControl`：Radix RadioGroup，`radiogroup`／`radio` ARIA、keyboard 左右鍵
    - `Drawer`（右側）／`BottomSheet`（底部）：由 `Sheet` 包
    - `ConfirmDialog`：`AlertDialog`（可 `destructive`）
    - `Banner`：info／success／warning／error；error 用 `role="alert"`
    - `EmptyState`、`Amount`（用 `lib/money.ts` + kind tone）
- shadcn 檔案由 CLI 生成後統一改成專案 convention：`export const` arrow component、`import React` 第一行、移除 `"use client"`、可見字串走 i18n（`useIntl()`／`messages`）

**規則**（spec 2.2／10）

- radius：input／button 6px，card 8px
- primary `emerald-700`，focus ring `emerald-500`
- 收入 emerald／支出 rose／轉帳 blue，**同時有正負號或文字**
- touch ≥ 44px；body ≥ 16px；secondary ≥ 14px
- icon-only 要 `aria-label` + tooltip
- Dialog／Sheet：focus trap、Escape、關閉後 focus 返觸發者；body 先 scroll
- Segmented control／tabs 用正確 ARIA

**完成標準**：RTL tests（`src/components/ui/*.test.tsx`）：Dialog Escape + focus return、TextField `aria-describedby`、SegmentedControl radiogroup、Amount tone。

---

## Step 9 — Layout、routing、route guard、PWA chrome

**檔案**：`src/app.tsx`、`src/main.tsx`、`src/routes/*`、`src/components/layout/*`

**Bootstrap** — `src/routes/useSessionBootstrap.ts`

1. `hydrateAuthStore()` 由 localStorage 讀 token
2. token 有效就 `AuthRepository.getMe`，成功 `setSession` 補返 user
3. **只有 `unauthorized` 才 `clearSession`**（其他錯誤保留 token，避免 offline reload 被登出）
4. 完成前 render `<FullPageLoading/>`，**唔閃 login**
5. `subscribeToAuthStorageEvents()` 支援跨 tab logout

**Routes** — `src/routes/AppRoutes.tsx`、`paths.ts`

- `ROUTES` 集中 path（跟 spec §4）
- `RedirectIfAuthenticated`：已登入入 `/login`／`/register` → `/`
- `RequireAuth`：未登入 → `/login?returnTo=<pathname+search>`；`returnTo` 用 `parseReturnTo` 驗證
- `LazyRoute`（`React.lazy` + `Suspense`）lazy load：transactions、scan、summaries、recurring、settings（+ settings 三頁）；dashboard／auth eager
- `NotFoundPage`：catch-all 404
- `RouteErrorBoundary`（per route）：fatal 提供「重試」／「返首頁」／「清除本機資料」

**Layout** — `src/components/layout/*`

- `AppLayout`：`<768` header 56px + bottom nav 5 項（掃描置中相機 icon）+ FAB；`768–1023` 可收合 sidebar；`≥1024` 固定 sidebar（多「定期交易」）；content max 1280px
- `SidebarNav`／`BottomNav`：`NavLink` active 樣式、`<nav aria-label>`；collapsed 用 `sr-only` 保留 accessible name
- `AppHeader`：sidebar toggle（md+）、app name（mobile）、sign out（`useLogout` 原子清 session／draft／domain）
- `AddTransactionFab`：bottom nav 上方；`OfflineBanner`：`useOffline()` + `Banner`
- `PublicLayout`、`PageHeader`、`FullPageLoading`

**PWA chrome**

- Manifest／theme color 已喺 `vite.config.ts`（emerald `#047857`）；`index.html` 有 viewport `viewport-fit=cover`、`theme-color`（CSP 已停用，見 Step 0）
- 正式 192／512 maskable icon、Apple touch icon、install prompt 留 Step 19

Browser back 關 modal／drawer：dialog 狀態用 URL search 或 history stack（`?dialog=` 或 `useBlocker`）留 feature step（12–14）做。

**完成標準**：`src/routes/*.test.tsx`：未登入 `/transactions?…` → `/login?returnTo=…`；未 hydrate 顯示全頁 loading 而唔係 login；有 token 直接 render private route 唔閃 login；已登入 `/login` → `/`。

---

## Step 10 — 登入／註冊

**檔案**：`src/features/auth/*`

- `AuthCard`：Card 外殼（標題／描述／footer 連結）
- `LoginForm`：RHF + Zod（`username` 必填、`password` 必填）；submit 中 disable + inline `Loader2`；失敗用 `Banner variant="error"` 顯示 repository 嘅一般化錯誤（唔透露 username 是否存在）
- `RegisterForm`：schema 加 `confirmPassword`，`.refine` 唔一致就出 `passwordMismatch`；`password` min 8；成功只送 `{username, password}` 去 repository
- 成功：`useAuthStore.setSession(token, user)` + `navigate(returnTo ?? "/")`，不顯示 toast
- `PasswordField`：`TextField` + `trailing` IconButton 切換 `type`（顯示／隱藏）；`TextField` 加咗 `trailing` support（input 自動加 `pr-11`）
- `LoginPage`／`RegisterPage`：`useSearchParams` + `parseReturnTo` 驗證 `returnTo`，兩頁互相連結都保留 `returnTo`
- Zod 訊息集中 `messages.fields.*`（module 層 `formatMessage`）
- Seed 預設帳戶／分類由後端 `POST /auth/register` 負責；frontend 註冊成功等同登入

**完成標準**：`src/features/auth/*.test.tsx`：空表單顯示 field errors 且唔發 request；成功登入／註冊寫 session + redirect `returnTo`（冇就 `/`）；失敗顯示一般化錯誤唔開 session；密碼 min 8；兩次密碼唔一致；show／hide 切換。（E2E #1 留 Step 20）

---

## Step 11 — Dashboard `/`

Query `date` 預設當月。上／下月按鈕。

內容次序跟 spec 5.2。Empty：主動作「新增第一筆交易」。Chart 有 legend + 金額 table。點分類／帳戶／最近交易去已 filter 嘅列表或詳情。

Loading：同 layout 尺寸 skeleton。

**完成標準**：有／無資料兩態；轉帳唔影響收支數字。

---

## Step 12 — 交易列表 `/transactions`

URL 同步全部 filter／sort／page。Mobile list row；desktop table。金額用 `amount_cents`。Skeleton 固定高。無結果：清 filter。換頁 scroll 去列表頂。`per_page` desktop 25／50／100。

點 row：所有 viewport 都去 `/transactions/:id`；route 保留交易列表做背景，mobile 開底部 drawer、desktop 開右側 drawer。

**完成標準**：reload 還原 query；integration test。

---

## Step 13 — 新增／修改交易

**狀態：已完成（2026-09-15）**

Segmented control 切 kind，欄位表跟 spec 5.4。

- RHF + Zod
- Merchant autocomplete debounce 300ms；可即場建立
- Merchant 有 default category 時建議分類，**唔 silently 覆蓋用戶已選**
- Create 開表單即生 UUID 做 idempotency
- Edit 唔改 source
- Dirty leave：`useBlocker` 確認
- 離線：spec 5.4 寫 disable submit，但 8.3 寫 CRUD 離線照常。**跟 8.3**：離線仍可本地寫入；5.4 嘅「disable」理解為唔做假網絡 retry。Banner 提示資料只在本機。
- 成功後同步所有 view；全 app 不顯示 toast
- 新增交易預設選取帳戶列表第一個帳戶；修改交易保留原有帳戶
- Segmented control 未選中狀態用 neutral 灰底／灰色 hover；active 狀態用品牌深綠

Desktop：右側 drawer。Mobile：底部 drawer（最高 92dvh）。兩者都保留交易列表做遮罩後背景；直接進入 `/transactions/new`／edit URL 亦相同，唔 render 空白中間頁。Drawer 內 action 跟表單正常 flow，唔 sticky。

**完成標準（已達成）**：三種 kind 欄位切換同 validation、create cents payload／idempotency、edit payload、商戶建議／即場建立、dirty leave、responsive overlay route 均有測試；ESLint、完整 Vitest 同 production build 通過。

---

## Step 14 — 交易詳情

**狀態：已完成（2026-09-15）**

顯示全部欄位、單據圖、source、時間。金額用 `amount_cents`。

Actions：改、複製、刪。（**唔做退款**，見關鍵決策 9）

- 複製成功去新詳情，日期 now
- 刪除確認：此操作無法復原；成功返列表
- 圖片 lightbox；失效 fallback，唔無限重試

實作備註：

- **Refund 已移除（2026-09-15）**：`refundModel.ts`、`TransactionRefundDialog`、詳情「退款」掣、列表退款 badge、dashboard 退款格、`refund_of_id`／`net_amount_cents`／`refund_cents` 均已刪。後端 migration 將舊退款紀錄轉成對應收入／支出後 drop `refund_of_id`。
- 備註長文：`TransactionDetailRow` 用 `preserveLineBreaks`（標籤喺上、內容靠左、`pre-wrap`／`keep-all`），唔跟其他欄位靠右摺行
- `TransactionReceiptImages`：標題同縮圖靠右；縮圖係 button，開 lightbox dialog；`onError` 轉 fallback tile，唔會重複重試

**完成標準（已達成）**：delete、duplicate（成功轉去新詳情、失敗顯示錯誤）、圖片 lightbox 同 fallback 均有測試；Prettier、完整 Vitest（178 個）同 production build 通過。

---

## Step 15 — AI 單據 `/scan`

**狀態：已完成（2026-09-15）**

步驟：選圖／拍 → 本地 mock parse → 覆核表單 → confirm。

1. `input file` `accept="image/jpeg,image/png,image/webp"` `capture="environment"`
2. 類型 + 10 MiB
3. object URL preview；progress 可取消
4. deterministic parse fixture
5. 低 confidence／缺欄位明顯標示
6. 補 account／category／merchant 後 repository confirm
7. UUID 防重複
8. parse 失敗：保留圖、重試或轉手動
9. draftStore 存 step；reload 清無效 object URL

Lazy load 呢個 feature。

實作備註：

- `validateReceiptFile`／`RECEIPT_ACCEPT` 由 `receiptsRepository` 匯出，UI 同 repository 共用同一套類型／10 MiB 檢查；UI 喺上載前就用佢擋，唔合規唔會發 request
- `ScanPage` 用 `runRef` generation counter 做取消：取消／換相之後，舊 run 回來發現 generation 唔同就唔再寫 state
- Object URL 只留喺 component state（unmount 由 effect revoke），`draftStore.aiScan.imageUrl` 只存上載後嘅遠端 URL，所以 reload 之後 blob 失效都唔會卡住
- 實際步驟由 `phase` + draft 推導（`step` derived），reload 後冇圖就自動退回 idle，唔會停喺假「解析中」
- `scanModel.ts`：`missingReviewFields`（逐欄「需覆核」badge）、`isLowConfidence`（< 0.6 出警告 banner）、`previewToReviewValues`（對唔到名嘅商戶／分類留空，唔亂猜）
- Idempotency key 喺 `ScanReviewForm` mount 時生成；confirm 失敗重試沿用同一條 key
- `MerchantAutocomplete` 加 `defaultQuery`，AI 讀到但未建立嘅商戶名會帶入，一撳即建立

**完成標準（已達成）**：類型／大小本地擋、upload → parse → 覆核預填、低信心度同缺欄位標示、parse 失敗保留圖片可重試（唔重複上載）／轉手動、取消解析、confirm payload（`source: "ai"`／`ai_import_log_id`／idempotency key）同轉去新詳情、confirm 失敗重用同一條 key、reload 後失效 object URL 退回 idle，全部有測試；Prettier、完整 Vitest（195 個）同 production build 通過。

---

## Step 16 — 報表 `/summaries`

**狀態：已完成（2026-09-15）**

Period segmented：日／週／月。上一期／下一期。URL：`period`、`date`、`page`。轉帳獨立、唔入淨額。Chart tooltip keyboard 可用 + 旁表。

完成內容：淨額／收入／支出、分類分佈（收入、支出各一張卡，donut + 資料表）、帳戶分佈、轉帳摘要、期內交易分頁。日期 picker + 上一期／下一期。

實作備註：

- `useSummary` 以 `period`／`date`／`page` 做 request key，一變即清舊數據，免得期間標題同數字對唔上
- URL state 沿用 `parseSummaryParams`／`serializeSummaryParams`；換期間或日期會自動清 `page` 返第一頁
- `summariesFormat.ts`：`periodRange`／`periodRangeLabel`（週報明文寫「星期一至星期日」）／`shiftPeriod`（以原本 anchor 加減整個期間）
- 轉帳來自 API `transfers`，獨立一卡並註明唔計入收入／支出／淨額；`summary.transactions` 後端已排除轉帳，所以「期內交易」只列收入同支出
- 分類分佈唔用 tab：收入同支出各自一張 `CategoryBreakdownChart` 卡；dashboard 同 summaries 共用（dashboard 照舊 lazy load）
- Back-end `summaries#by_category` 同 `dashboard#category_breakdown` 都改為 group 非轉帳交易並回 `income_cents` + `expense_cents`；dashboard 由 frontend 自行取每種 Top 5
- 抽出共用 `components/layout/SectionCard`（原本 dashboard `DashboardSection`）、`components/SummaryTotalsGrid`（dashboard／summaries 三格數字）同 `lib/categoryBreakdown`（原本 dashboard `dashboardFormat`，`rankCategories` 支援收入／支出）
- Mobile 排版：淨額橫跨兩格、收入／支出各佔一格；金額用 `clamp()` 隨 viewport 縮放，避免窄機（320px）斷行；期間導覽 label 同日期 picker 喺 mobile 上下分開；`SectionCard` padding 收窄（base 4／md 6）；列表金額 `nowrap` + `flexShrink="0"`，長備註會 truncate 而唔會逼爆金額；dashboard 月份導覽 mobile 撐滿一行（`PageHeader` 加 `actionsFullWidth`，desktop 維持右上角）
- Recharts v3 `PieChart` 內建 accessibility layer：圖表可鍵盤 focus ＋ 方向鍵郁 tooltip；旁邊附完整資料表同 caption

**完成標準（已達成）**：週報範圍一至日（`periodRange` 測試）、轉帳獨立唔入收支（fixture transfers 20000 但 net 照係 income−expense）、dashboard 同 summaries 各有收入／支出兩張分類卡、period／date／page URL 同步、換期間／日期同分頁重新 fetch、錯誤重試，全部有測試；Prettier、完整 Vitest（193 個）同 production build 通過（後端 `phase6_spec` 亦通過）。

---

## Step 17 — 定期交易 `/recurring-rules`

Tabs：active／paused／ended。Create／edit 欄位跟 spec 5.8。Actions 確認文案：

- run now 成功顯示新交易入口
- already_materialized →「今日已經產生過交易」
- skip next 列出日期
- 刪除只刪 rule

**完成標準**：pause／resume／run now／skip 測試。

---

## Step 18 — 設定

`/settings` 入口連到帳戶／分類／商戶。登出按鈕。

帳戶：list name／kind／icon／color／initial／HKD；CRUD；in_use 阻止刪除。

分類：income／expense tabs；position numeric；刪除提示未分類。

商戶：搜尋／建立／刪除；顯示 default category + usage；無 edit。

**完成標準**：刪除阻止／清空關聯測試。

---

## Step 19 — PWA、install、offline

> CSP 已按用戶決定停用（見 Step 0），呢步唔再包含 CSP 項目。

- Manifest 繁中 name／short_name；`display: standalone`；`start_url`／`scope` `/`；theme 同 header；192／512 maskable + apple touch（正式 bitmap，唔用 Vite logo）
- SW：precache JS／CSS／fonts／icons／offline shell；navigation Network First + timeout → shell
- Domain data **唔入 Cache Storage**
- 新版本用頁內 banner 顯示「有新版本／重新載入」；dirty form 唔 auto reload
- `beforeinstallprompt`：有互動同使用一段時間先出一次；dismiss 唔再煩
- iOS Safari 非 standalone：短「加入主畫面」指引
- Production 先 enable SW（localhost 可）

**完成標準**：manifest 存在；offline 可讀 local data。

---

## Step 20 — 測試同驗收

Vitest：money、date、URL、repository、stores、關鍵 forms。

Playwright critical paths（spec 12.3）：

1. Register → 見到預設現金帳戶及分類
2. 新增支出 → dashboard／列表反映
3. 新增轉帳 → 報表唔計入收支
4. 搜尋篩選 → reload 保留
5. 定期：建立 → pause → resume → run now
6. 單據 → AI preview → 修正 → confirm
7. Logout → private 入唔到
8. Manifest／SW／offline fallback（能測幾多測幾多）

Viewport：320×568、390×844、768×1024、1280×800、1440×900。無水平 overflow、dialog 可用、bottom nav safe-area。

最後：Prettier、`pnpm run build`、手動 browser 走一次主路徑。

---

## 建議實作批次（可並行時先做完依賴）

```text
Step 0
  → 1 → 2 → 3 → 4 → 5 → 6 → 7
                              → 8 → 9 → 10
                                         → 11, 12, 15, 16, 17, 18（feature 可分批）
                                         → 13, 14 依賴 12
                              → 19 可同 feature 後期並行
                              → 20 每步跟住加 test，最後補 E2E
```

每步都要達到該步「完成標準」先入下一步。Step 5 係最大塊，可再拆 accounts／categories／merchants／transactions／summaries／recurring 六個小 PR，但要同一 repository 檔或清楚 re-export。

---

## 明確唔做（跟 spec 0.2／15）

- 真 API call、JWT、忘記密碼
- 多貨幣、多用戶、CSV 匯入、push、雲同步
- 商戶 edit、分類 drag-and-drop
- 虛假 undo（hard delete）
- 退款功能（2026-09-15 已由產品決定移除）
- 聲稱真實 OCR／AI
