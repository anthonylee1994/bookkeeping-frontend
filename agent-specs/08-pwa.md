# 8. PWA 規格

## 8.1 Manifest

- `name`、`short_name`、description 使用繁體中文
- `display: standalone`、`start_url: /`、`scope: /`
- `theme_color` 用品牌綠 `#047857`；`background_color` 用 neutral background
- 提供 192×192（any）、512×512（any）、512×512 maskable icon，及 Apple touch icon（正式 bitmap，不使用臨時 Vite logo）

## 8.2 Service worker / caching

- 由 `vite-plugin-pwa`（generateSW）產生；`registerType: "prompt"`、`injectRegister: null`，app 自己註冊
- Precache hashed JS、CSS、icons 及 app shell（`index.html`）
- Navigation 採 **NetworkFirst + 3 秒 timeout**，失敗時用 `precacheFallback` 回退至 app shell
- Domain data（API）**不寫入 Cache Storage**；只可經 browser storage persistence
- `globPatterns` 會 precache build 出嘅 js／css／html／svg／png／ico／woff／woff2；API 回應唔會被 precache
- 新版本採 prompt update：顯示「有新版本／重新載入」banner，由用戶按「重新載入」套用
- 不可在用戶填寫表單時自動 reload
- Dev 模式（`devOptions`）同樣啟用 SW 方便測試 install／離線；因 dev asset 由 Vite 喺記憶體 serve，`dev-dist` 冇檔可 precache，會開 `devOptions.suppressWarnings` 避免 workbox-build 出「glob pattern doesn't match any files」warning（只影響 dev，build 不受影響）

## 8.3 Offline UX

- 全局由 `OfflineBanner` 顯示低干擾 offline banner（`navigator.onLine` 加 `online`／`offline` events，寫入 `uiStore.isOffline`）
- 已載入且仍在 memory 嘅資料可繼續查看；reload 後只可由 `localStorage` 還原 session token，domain data 要連線重新抓取
- 所有寫入（create／edit／delete／duplicate／recurring actions）都直接呼叫 API：離線時會失敗並 inline 顯示錯誤，唔會排隊、唔會假裝成功、冇 background sync
- 交易／AI 表單 state 只存在記憶體，offline reload 唔會保留（`draftStore` 未接上 feature）
- 需要外部圖片或 AI asset 時顯示 unavailable fallback

## 8.4 Install UX

- Android／desktop 捕捉 `beforeinstallprompt`，只在用戶有互動並使用 app 一段時間後顯示一次（dismiss 記入 localStorage，之後不再彈）
- iOS 提供簡短「加入主畫面」指引，但只在 iOS 裝置且未 standalone 時顯示
- 已安裝或用戶 dismiss 後，不反覆彈出提示
- 提示以固定底部 banner 呈現（新版本 → 安裝 → iOS 指引 → 已可離線，一次只顯示一個）
