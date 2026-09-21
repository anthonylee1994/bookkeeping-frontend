# 15. 前後端分工與限制

1. Frontend 只管 presentation 及 route gating；權限與資料完整性由後端負責。
2. `localStorage` 只存 session token 及 UI flag（例如 install dismiss）；`sessionStorage` 只存 draft，不將大型 base64 persist。
3. AI 辨識由後端呼叫 DeepSeek，結果只作建議，必須經人工覆核才入帳。
4. 資料存於後端 SQLite（Dokku volume）；清除 browser site data 只會登出，不會失去帳務資料。
5. 跨裝置共用同一帳戶即可看到相同資料；多人協作、server backup／recovery 不在 MVP 範圍。
6. Hard delete 不可復原，frontend 不應提供虛假 undo。
