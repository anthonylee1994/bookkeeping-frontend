# Project rules

## Spec

- 產品／UX／架構 source of truth 係 repo root 嘅 [`FRONTEND.md`](./FRONTEND.md)。
- **每次改 code 都要同步更新 `FRONTEND.md` 相關章節**（路由、互動、狀態、loading／error、測試、DoD）。未更新 spec 當未完成。
- 實作順序同歷史決策寫喺 [`plan.md`](./plan.md)；行為改動要喺對應 Step 補註，或加 Post-MVP step。
- API 語意見 [`swagger.yaml`](./swagger.yaml)。

## 驗證

- 改完 TypeScript／JavaScript 要跑 Prettier。
- 唔好跑 ESLint 做 agent 驗證。
