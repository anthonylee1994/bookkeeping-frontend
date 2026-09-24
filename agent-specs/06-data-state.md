# 6. 資料與狀態

## 6.1 API repository 規則

- 所有 domain data 經 `data/*Repository.ts`（axios）向 Rails API 讀寫；`apiRepository.ts` 統一處理 token、錯誤正規化（`LocalResult`）及 query serialization
- Repository 只回傳 typed `LocalResult<T>`，不 throw；錯誤 code 對齊 swagger 語意（`unauthorized`、`not_found`、`conflict_already_materialized`、`in_use` 等）
- Session token 存 `localStorage`；`draftStore` 用 `sessionStorage` persist（version 1），但目前只喺 logout 被 reset，未有 feature 將表單寫入（交易／AI 表單用 React Hook Form in-memory state）
- 讀寫失敗顯示對應 error state，不模擬 HTTP status 數字

## 6.2 Core TypeScript types

```ts
export type UUID = string;
export type Currency = "HKD";
export type TransactionKind = "income" | "expense" | "transfer";
export type TransactionSource = "manual" | "recurring" | "ai" | "import";
export type AccountKind = "cash" | "bank" | "credit_card" | "e_wallet" | "other";
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type RecurringStatus = "active" | "paused" | "ended";

export interface PaginationMeta {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
}
```

完整 domain type 由 `data/types.ts` 定義；測試 fixture（`test/domainFixtures.ts`）必須符合同一套 Zod schema，確保 UI 測試資料同 production shape 一致。

## 6.3 appStore selectors

```text
useAppStore((state) => state.accounts)
useAppStore((state) => state.categories)
useAppStore((state) => state.merchants)
useAppStore((state) => state.referenceLoaded)
useAppStore((state) => state.transactionsRevision)
```

- `accounts`／`categories`／`merchants`／`referenceLoaded` 係實際共用嘅 slice，由 `useDomainReference` 寫入。
- 交易、報表、定期交易清單由各自 feature hook 用 component-local state 管理，唔經 appStore；`transactions`／`transactionsMeta` 只作交易詳情／表單嘅局部 cache。
- `recurringRules`／`isLoading`／`error` 仍存在於 store shape，但目前冇 feature 讀寫。
- `transactionsRevision` 唔存資料：交易 mutation 加一，令已 mount 嘅 `useTransactions` 重新抓取（列表喺 drawer 後面唔會因為 route 變而 remount）。
- Selector 只讀取需要的 slice，避免 component 訂閱整個 store；不建立 duplicated cache。

## 6.4 Zustand state management

Zustand 管理 frontend app state；React Hook Form 管理表單暫態，URL 管理可分享 filter state。

### State ownership

| State 類型                | Owner                      | 例子                                                                                                                                                                                    |
| ------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reference data mirror     | `appStore`                 | accounts、categories、merchants、referenceLoaded（由 `useDomainReference` 寫入）；transactions 只作交易詳情／表單局部 cache；`transactionsRevision` 觸發已 mount 列表刷新（不 persist） |
| URL state                 | React Router search params | transaction filters、sort、page、summary period/date、recurring status、returnTo                                                                                                        |
| Form state                | React Hook Form            | transaction／account／category／recurring rule／AI confirm 欄位、dirty／validation state                                                                                                |
| Session state             | `authStore`                | token、minimal user payload、hydrated、logout                                                                                                                                           |
| UI state                  | `uiStore`                  | mobile nav、drawer／dialog、offline flag、install prompt status、AI 拆單待覆核 preview（`pendingAiBatch`，不 persist）                                                                  |
| Temporary workflow／draft | `draftStore`               | transaction draft mirror（store 存在但未接上 feature；只有 logout 會 reset）                                                                                                            |

### Store contract

```ts
type AuthState = {
    token: string | null;
    user: User | null;
    hydrated: boolean;
    setSession: (token: string, user: User) => void;
    clearSession: () => void;
};

type UiState = {
    isMobileNavOpen: boolean;
    activeDialog: string | null;
    isOffline: boolean;
    installPrompt: "unavailable" | "available" | "dismissed" | "installed";
    setMobileNavOpen: (open: boolean) => void;
    setActiveDialog: (dialog: string | null) => void;
    setOffline: (offline: boolean) => void;
    setInstallPrompt: (status: InstallPromptStatus) => void;
};

type DraftState = {
    transactionDraft: TransactionDraft | null;
    setTransactionDraft: (draft: TransactionDraft | null) => void;
    resetDrafts: () => void;
};
```

實際 type 要放 `data/types.ts` 或 feature type file，以上只是 ownership contract；不得用 `any` 或自由格式 object。

### Rules

- 使用 Zustand selectors 讀取最小片段，例如 `useAuthStore((state) => state.token)`；避免 component 直接訂閱整個 store。
- Store action 用同步、可測試的 state transition；所有 repository operation 由 feature hook 呼叫，不將 component-specific logic 寫入 generic store。
- `authStore` **不用** `persist`：token 由 `authRepository` 的 `storeAuthToken`／`getStoredAuthToken`／`clearStoredAuthToken` 直接讀寫 `localStorage`，啟動時經 `hydrateAuthStore()` 同步。全 app 只有 `draftStore` 用 `persist`（version 1 + `sessionStorage`）。密碼及單據原圖絕不 persist。
- App 啟動時首先 hydrate auth，再由 route guard 決定是否顯示 login；hydration 完成前不可 redirect，避免 login page 閃現。
- `uiStore` 不需要持久化；`isOffline` 由 `navigator.onLine` 及 `online`／`offline` events 更新。
- `draftStore` 只 persist 可序列化 draft 欄位到 `sessionStorage`；`File`、Blob、object URL 不可 persist，離開頁面或 reload 要清理無效 preview。
- 設計上 AI preview 入帳成功、交易提交成功、登出或切換 session 都要呼叫 `resetDrafts()`；object URL 要另外 `URL.revokeObjectURL()`。目前 `resetDrafts()` 只喺 logout 被呼叫。
- Logout 流程要原子地 `authStore.clearSession()`、`draftStore.resetDrafts()`、`appStore.resetAppState()`，再導向 `/login`。
- 不可將 filters、pagination、selected date 同時放於 Zustand 與 URL；URL 是可分享頁面 state 的唯一 source of truth。
- Store state 要保持可序列化，禁止將 React element、Promise、AbortController 放入 store。
- 需要跨 tab 登出時監聽 `storage` event；收到 session 清除後，其他 tab 同步清除 local stores 及回到 login。

### Testing

- 每個 store 有獨立 Vitest 測試，覆蓋 initial state、action、reset、persist hydration／migration 同 logout cleanup。
- Component test 要驗證 selector 只因相關 slice 改變而 rerender；不得靠 implementation detail 直接改 store 內部 object。

## 6.5 Repository contract

Repository 必須提供 typed functions，覆蓋 auth、dashboard、transactions、accounts、categories、merchants、receipts、AI preview（`AiPreview` 嘅多筆拆單結果喺 `parsed_items`）、AI 文字解讀（`interpret`）、AI 自然語言查詢（`query`，回 URL 同名 filter params）、summaries（含 AI 收支概況 `getInsight`）及 recurring rules。每個 function 只負責 HTTP（加上 url／params／idempotency key），回傳 `LocalResult<T>`。

Feature hook 在 `requestKey`（token／filter／reload token；交易列表另加 `transactionsRevision`）改變時重新抓取：`useDomainReference` 會將 accounts／categories／merchants 寫入 appStore，`useTransactions`／`useDashboard`／`useSummary`／`useRecurringRules` 則用 component-local state。不得在 component 直接呼叫 axios。`useSummaryInsight` 另加一個由 summary aggregate 派生嘅 `invalidationKey`（見 §5.7），避免純粹轉交易頁碼就重新生成 AI 概況。AI 打字記帳（`interpret`）只屬 on-demand 呼叫：解讀結果、錯誤同原文用 component-local state；單筆結果填落表單，**多筆拆單嘅待覆核 preview 放 `uiStore.pendingAiBatch`**（非 persist，見 §6.4），因為多筆時新增交易 drawer 已經閂、覆核 drawer 掛喺 `TransactionsLayout`。原文只存記憶體、唔入 appStore、唔 persist（見 §5.10、§8.3）。

AI 自然語言查詢（`query`）同樣只屬 on-demand：原文、loading、error 同「已套用」提示用 `AiQuerySearch` 嘅 component-local state；成功後只將回傳 filter 寫入交易列表 URL（URL 仍係 filter 唯一 source of truth，唔另存 store）。查詢唔會改任何 domain data，亦唔 persist。
