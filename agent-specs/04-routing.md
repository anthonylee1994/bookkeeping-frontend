# 4. Routing 與導航

```text
/login                         公開：登入
/register                      公開：註冊
/                              私有：Dashboard
/transactions                  私有：交易列表（layout 永遠 mount）
/transactions/new              私有：新增交易 drawer（列表做背景）
/transactions/:id              私有：交易詳情 drawer（列表做背景）
/transactions/:id/edit         私有：修改交易 drawer（列表做背景）
/summaries                     私有：報表
/recurring-rules               私有：定期交易
/settings                      私有：設定首頁
/settings/accounts             私有：帳戶
/settings/categories           私有：分類
/settings/merchants            私有：商戶
/settings/password             私有：更改密碼
*                              404
```

- 未登入進入 private route：redirect `/login?returnTo=<path>`
- 已登入進入 `/login` 或 `/register`：redirect `/`
- Reload private route 先顯示全頁 loading，透過 `GET /me` 驗證 token，期間不可閃出 login page
- 只接受站內 `returnTo` path，防止 open redirect
- Browser back 必須可以關閉 modal／drawer 或返回上一步
- `/transactions` 係 nested layout：`TransactionsLayout` 永遠 mount `TransactionsPage`；`new`／`:id`／`:id/edit` 經 `Outlet` 疊 drawer，開／關 drawer 唔會 unmount 列表
- 詳情／修改 URL 必須帶住列表當時嘅 search（filter／sort／page），關閉 drawer 先唔會清 filter
- 路由控制嘅交易 drawer 用 `useRouteDrawerDismiss`：router 已經離開呢條 URL（例如詳情 → 修改）就唔可以再 `navigate` 返列表，否則會 `/id` → `/id/edit` → 即刻彈返 `/transactions`
- Lazy load：transactions 子樹（layout + detail + form）同一個 chunk；summaries、recurring、settings；dashboard／auth eager
