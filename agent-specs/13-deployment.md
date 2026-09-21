# 13. 環境與部署

```dotenv
VITE_APP_ENV=development
VITE_API_URL=http://localhost:3000
```

`VITE_API_URL` 於 Vercel project 設定為 production API origin。

- `.env.example` 只放公開設定；所有 `VITE_*` 都視為可公開，不可放 secret
- `VITE_API_URL` 是唯一必要的 build-time 變數（`VITE_APP_ENV` 目前未使用）
- **Frontend（Vercel）**：`vercel.json` 設定 `installCommand: pnpm install --frozen-lockfile`、`buildCommand: pnpm run build`、`outputDirectory: dist`
    - SPA fallback：`rewrites` 將未知路徑指向 `/index.html`（Vercel 先配對靜態檔，所以 `/assets/*`、`/sw.js` 不受影響）
    - Headers：`/sw.js`、`manifest.webmanifest`、`apple-touch-icon.png` 設 `max-age=0, must-revalidate`（否則 SW 永遠不會更新）；`/assets/*` 設 `immutable`
    - `VITE_API_URL` 需在 Vercel project 設定（production／preview）
    - 如用 `*.vercel.app` 網域，需將該 origin 加入後端 `CORS_ORIGINS`
- **Backend（Dokku）**：Rails + SQLite，release 執行 `db:prepare`；`storage/` 為持久 volume。CORS origins 見 `bin/dokku-setup.sh`
- Production build 必須有 SPA fallback，未知 route 回 `index.html`
- CI 次序：typecheck -> prettier -> unit/integration -> build（Playwright smoke 為目標，未實作）
- Production source map 如上傳 error tracker，不應公開提供
