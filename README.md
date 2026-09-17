# 簡單記帳

Mobile-first 記帳 SPA。用戶可以快速記收入、支出同轉帳，睇本月收支、帳戶餘額、分類分佈同報表。支援單據拍攝／上載、AI 辨識後人工覆核入帳、定期交易，以及安裝成 PWA。

Frontend 係 React SPA，經 typed axios repository 呼叫 Rails API。瀏覽器只持久化 session token 同表單 draft，domain data 一律存於後端。

語言固定繁體中文（香港），時區 `Asia/Hong_Kong`，貨幣只支援 HKD。金額以 integer cents 儲存，frontend 唔用浮點數做金額運算。

產品範圍、互動同驗收標準見 [`frontend-spec.md`](./frontend-spec.md)。API 語意見 [`swagger.yaml`](./swagger.yaml)。實作順序見 [`plan.md`](./plan.md)。

## 功能

- 登入／註冊（JWT；frontend 只持有 bearer token）
- Dashboard：本月收支、帳戶餘額、分類分佈、最近交易、即將到期定期交易
- 交易：新增、修改、複製、刪除、搜尋同篩選；收入／支出／轉帳
- 單據掃描：拍攝或上載 → 後端 AI parse（DeepSeek）→ 人工覆核後入帳
- 報表：日／週／月總覽同帳戶分佈
- 定期交易：建立、暫停、恢復、立即執行
- 設定：帳戶、分類、商戶、更改密碼
- PWA：可安裝；離線可開 app shell 同讀本機 session／draft；有新版本會提示用戶自行重新載入

MVP 唔包括：多用戶共享帳簿、多貨幣、忘記密碼／OAuth、背景同步、push、CSV／月結單匯入、退款。

## 技術棧

| 用途                  | 選擇                                 |
| --------------------- | ------------------------------------ |
| Build                 | Vite                                 |
| UI                    | React 19 + TypeScript（strict）      |
| Styling               | Chakra UI v3（Emotion）              |
| Routing               | React Router                         |
| App state             | Zustand                              |
| HTTP                  | axios（`src/data/apiRepository.ts`） |
| Form                  | React Hook Form + Zod                |
| i18n                  | react-intl                           |
| PWA                   | vite-plugin-pwa（Workbox）           |
| Charts                | Recharts                             |
| Unit / component test | Vitest + React Testing Library       |
| Deploy                | Vercel                               |

唔用 React Query／SWR。Domain data 由 repository 抓取後寫入 `appStore` 作 memory mirror；可分享嘅 filter 以 URL 為 source of truth。

## 本機開發

需要 Node.js 同 [pnpm](https://pnpm.io)。本 repo 以 pnpm 為準（`vercel.json` 亦指定 `pnpm install --frozen-lockfile`）。

```bash
pnpm install
cp .env.example .env
pnpm dev
```

`.env` 至少要有 API base：

```dotenv
VITE_APP_ENV=development
VITE_API_URL=http://localhost:3000
```

`VITE_API_URL` 係唯一必要嘅 build-time 變數（axios baseURL = `${VITE_API_URL}/api/v1`）。所有 `VITE_*` 都視為可公開，唔好放 secret。`VITE_APP_ENV` 目前未使用。

開發時後端要喺 `VITE_API_URL` 對應嘅 origin 行緊，並且 CORS 要允許 frontend origin。

## Scripts

```bash
pnpm dev          # Vite dev server（dev 亦會啟用 Service Worker，方便測 install／離線）
pnpm build        # tsc -b && vite build
pnpm preview      # 預覽 production build
pnpm test         # Vitest
pnpm format       # Prettier
```

Dev 如遇到 stale Service Worker cache，可喺 DevTools 清 Cache Storage。

## 目錄

```text
src/
  app.tsx                 # Router + session bootstrap
  main.tsx
  routes/                 # 路徑、auth gate、lazy route
  components/layout/      # AppLayout、header、sidebar、mobile tab bar
  features/
    auth/
    dashboard/
    transactions/
    receiptScan/
    summaries/
    recurringRules/
    settings/
    pwa/
  data/                   # axios repositories + Zod schemas
  stores/                 # auth / app / ui / draft
  lib/                    # money、date、i18n、searchParams…
  theme/                  # Chakra design system
  test/
```

路徑 alias：`@/*` → `src/*`。

## 架構重點

- **單一 source of truth**：domain data 喺後端。`data/*Repository.ts` 負責讀寫；feature hook 收到結果後寫入 `appStore`。
- **金額**：所有加減經 `src/lib/money.ts`。UI 輸入 dollar string，submit 時先轉 cents；顯示用 `$`。
- **日期**：全部經 `src/lib/date.ts`，時區固定 `Asia/Hong_Kong`。顯示 `YYYY年M月D日` + 24 小時。
- **圖片**：preview 用 object URL，unmount／logout 要 revoke；上載後先用遠端 URL。唔 persist base64。
- **PWA**：只 precache 靜態 asset。API 唔寫入 Cache Storage。Navigation 用 Network First，失敗先回落 app shell。新版本用 `prompt`，由頁內 banner 提示，避免打斷 dirty form。

Coding conventions（`import React` 第一行、named export component、`export function useXxx`、`<React.Fragment>`、`React.useState` 等）見 spec §1.2。

## 部署

Frontend 部署喺 Vercel。`vercel.json` 設定：

- `installCommand`: `pnpm install --frozen-lockfile`
- `buildCommand`: `pnpm run build`
- `outputDirectory`: `dist`
- SPA fallback：未知路徑 rewrite 去 `/index.html`
- `/sw.js`、`manifest.webmanifest`、`apple-touch-icon.png`：`Cache-Control: max-age=0, must-revalidate`
- `/assets/*`：`immutable`

Production／preview 都要喺 Vercel project 設定 `VITE_API_URL`。Frontend origin 要加入後端 `CORS_ORIGINS`。

Backend 係 Rails + SQLite，部署喺 Dokku。
