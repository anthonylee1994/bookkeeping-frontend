# 記帳 App Frontend Spec（Index）

本文件係 index。產品／UX／架構的 source of truth 已拆分到 [`agent-specs/`](./agent-specs/README.md)。Frontend 是 React SPA，經 typed API repository（axios）呼叫 Rails API（API 規格見 backend repo 的 `BACKEND.md` 及本 repo `swagger.yaml`）；瀏覽器只持久化 session token（`draftStore` 存在但未接上 feature），domain data 一律存於後端。

### 文件維護（硬性）

**每次改 code 都要同步更新 `agent-specs/` 相關章節。** 路由、互動、狀態、loading／error、測試範圍有變，就改對應檔。未更新 spec 當未完成，唔好當做完（見 [§14](./agent-specs/14-definition-of-done.md)）。

## 索引

| 檔                                                                                  | 內容                                        |
| ----------------------------------------------------------------------------------- | ------------------------------------------- |
| [00-overview](./agent-specs/00-overview.md)                                         | §0 文件目的、產品目標、非目標、基本假設     |
| [01-tech-stack](./agent-specs/01-tech-stack.md)                                     | §1 技術棧、coding conventions、目錄         |
| [02-visual-design](./agent-specs/02-visual-design.md)                               | §2 視覺與體驗方向、design tokens、金額顯示  |
| [03-responsive-layout](./agent-specs/03-responsive-layout.md)                       | §3 Responsive Layout                        |
| [04-routing](./agent-specs/04-routing.md)                                           | §4 Routing 與導航                           |
| [05-pages](./agent-specs/05-pages/README.md)                                        | §5 頁面規格（每個頁面一檔）                 |
| [06-data-state](./agent-specs/06-data-state.md)                                     | §6 資料與狀態、Zustand、repository          |
| [07-auth-security](./agent-specs/07-auth-security.md)                               | §7 Auth 與安全                              |
| [08-pwa](./agent-specs/08-pwa.md)                                                   | §8 PWA 規格                                 |
| [09-feedback](./agent-specs/09-feedback.md)                                         | §9 Loading、Empty、Error 與 Feedback        |
| [10-accessibility](./agent-specs/10-accessibility.md)                               | §10 Accessibility                           |
| [11-performance](./agent-specs/11-performance.md)                                   | §11 Performance                             |
| [12-testing](./agent-specs/12-testing.md)                                           | §12 測試策略                                |
| [13-deployment](./agent-specs/13-deployment.md)                                     | §13 環境與部署                              |
| [14-definition-of-done](./agent-specs/14-definition-of-done.md)                     | §14 Definition of Done                      |
| [15-division-of-responsibilities](./agent-specs/15-division-of-responsibilities.md) | §15 前後端分工與限制                        |
| [99-project-rules](./agent-specs/99-project-rules.md)                               | Project rules（spec source of truth、驗證） |

`agent-specs/05-pages/`：5.1 登入註冊、5.2 Dashboard、5.3 交易列表、5.4 新增修改交易、5.5 交易詳情、5.6 AI 單據、5.7 報表、5.8 定期交易、5.9 設定。

## Project rules

- 產品／UX／架構 source of truth 係 [`agent-specs/`](./agent-specs/README.md)。
- **每次改 code 都要同步更新相關章節**（路由、互動、狀態、loading／error、測試、DoD）。未更新 spec 當未完成。
- API 語意見 [`swagger.yaml`](./swagger.yaml)。
- 改完 TypeScript／JavaScript 要跑 Prettier。
- 唔好跑 ESLint 做 agent 驗證。
