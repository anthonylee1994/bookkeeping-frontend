# 14. Definition of Done

一個 feature 只有符合以下條件才算完成：

- 實作本 spec 所列正常、loading、empty、error、offline 狀態
- Mobile、tablet、desktop layout 經實機或 Playwright screenshot 驗證
- Keyboard、screen reader labels、focus management、對比符合要求
- API input／output 全部有 TypeScript type，repository 不 throw
- 寫入操作有防重複提交；建立交易同 AI confirm 產生唯一 UUID
- Relevant unit／integration test 完成，critical flow E2E 通過
- `pnpm run build`、`tsc`、Prettier、Vitest 全部通過
- 無 console error、React warning、水平 overflow 或 UI overlap
- PWA 可安裝、更新提示正常，offline 可還原 local session／draft
- **每次改 code 都已同步更新 `agent-specs/` 相關章節**。未更新 spec 當未完成
