# 7. Auth 與安全

- Auth 由後端 JWT 簽發；frontend 只持有 bearer token 作為 route gate。
- 所有可插入 UI 的文字經 React escaping；不使用 `dangerouslySetInnerHTML`
- **CSP 已於 2026-09-15 按用戶決定停用**：單據圖由 API origin 發出，`img-src 'self'` 會擋住。若要還原，需重新加回 meta，並將 API origin 補入 `img-src` 及 `connect-src`
- Production 只使用 HTTPS；service worker 於 production build 同 dev 都啟用（`devOptions.enabled: true`，方便測 install／離線）；dev 遇 stale cache 可於 DevTools 清 Cache Storage
- 登出或切換 session 時清除 auth／draft state、AI preview、draft 同圖片 object URL
- 不在 console、analytics、error tracking 記錄密碼、完整單據圖 URL 或完整 local data snapshot
- `returnTo`、external image URL 及 local error message 不可直接變成 executable URL／HTML
