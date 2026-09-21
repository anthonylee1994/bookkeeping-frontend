# Project rules

## Spec

- 產品／UX／架構 source of truth 係 [`agent-specs/`](./README.md)（由 root `AGENTS.md` 索引）。
- **每次改 code 都要同步更新相關章節**（路由、互動、狀態、loading／error、測試、DoD）。未更新 spec 當未完成。
- API 語意見 [`../swagger.yaml`](../swagger.yaml)。

## 驗證

- 改完 TypeScript／JavaScript 要跑 Prettier。
- 唔好跑 ESLint 做 agent 驗證。
