# 1. 技術棧

## 1.1 Core

| 用途                  | 選擇                                                    |
| --------------------- | ------------------------------------------------------- |
| Build tool            | Vite                                                    |
| UI                    | React + TypeScript（strict mode）                       |
| Styling / components  | Chakra UI v3（Emotion）                                 |
| Routing               | React Router                                            |
| App state             | Zustand                                                 |
| HTTP client           | axios（`data/apiRepository.ts`）                        |
| Local persistence     | `localStorage`（session）／`sessionStorage`             |
| Form                  | React Hook Form + Zod                                   |
| PWA                   | `vite-plugin-pwa`（Workbox）                            |
| Icons                 | Lucide React + `@iconify/react`（icon picker）          |
| Charts                | Recharts                                                |
| Date                  | 原生 `Intl`（集中於 `lib/date.ts`）                     |
| i18n                  | react-intl（`lib/i18n.ts` 集中 message descriptor）     |
| Unit / component test | Vitest + React Testing Library                          |
| E2E                   | Playwright（已在 devDependencies，但 E2E suite 未實作） |

Zustand 使用 `create`；只有 `draftStore` 用 `persist` middleware。`authStore` 唔用 `persist`，token 由 `authRepository` 手動讀寫 `localStorage`。不使用 remote data cache library（React Query／SWR）。

## 1.2 Coding conventions

- `import React` 必須為 React／TSX 檔第一個 import
- Component 使用 named export：`export const ComponentName`
- Hook 使用 function declaration：`export function useSomething()`
- 使用 `<React.Fragment>`，不使用 fragment shorthand
- 使用 `React.useState()`、`React.useEffect()` 等 namespace API
- Component 內 event handler 用一般 arrow function，除非有實測需要，否則不加 `React.useCallback()`
- 非 component／hook function 使用 function declaration
- 一般 TypeScript／模組檔名用 camelCase（例如 `authRepository.ts`、`authStore.ts`）
- React component 檔名用 TitleCase（例如 `DashboardPage.tsx`、`LoginForm.tsx`）
- 入口 component 檔名為 `app.tsx`，並使用 `export const App`
- `.less` 不在本專案使用；如將來需要引入，import 必須放於所有 import 最後
- 不使用 `any`；fixture、form input、local query params 全部有明確型別
- 金額轉換集中於 `lib/money.ts`，日期／時區轉換集中於 `lib/date.ts`
- Domain data 由 API repository 提供；只有 accounts／categories／merchants 經 `useDomainReference` 寫入 appStore 作 shared reference cache，其餘 list hook 用 component-local state。URL 是可分享 filter 的唯一 source of truth

## 1.3 目錄

```text
src/
  app.tsx
  main.tsx
  routes/              # AppRoutes、auth gate、useRouteDrawerDismiss
  components/
    layout/            # AppLayout、AppHeader、SidebarNav、MobileTabBar、SectionCard…
    # 跨 feature primitive（EntityAvatar、TransactionKindIcon、SummaryTotalsGrid…）
  features/
    auth/
    dashboard/
    transactions/      # TransactionsLayout 永遠 mount 列表；detail／form 係 child drawer
    receiptScan/
    summaries/
    recurringRules/
    settings/          # 帳戶／分類／商戶（含對應 FormDrawer）
    pwa/
  data/
    types.ts
    schema.ts
    apiRepository.ts   # axios 核心 + LocalResult
    authRepository.ts
    transactionsRepository.ts
    ...
  stores/
    authStore.ts
    appStore.ts
    uiStore.ts
    draftStore.ts
  hooks/
  lib/                 # money、date、i18n、searchParams、colors…
  theme/               # Chakra design system
  test/
```

Feature 內可再分 `components/`、`hooks/`、`model.ts`／`schema.ts` 及 `types.ts`。Component 檔名用 TitleCase，其餘模組檔名用 camelCase。共用 UI 只放真正跨 feature 重用的 primitive，避免過早抽象。
