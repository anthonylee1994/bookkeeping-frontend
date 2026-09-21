# 記帳 App Frontend Spec

本資料夾係 frontend 產品／UX／架構嘅 source of truth，由原本 `AGENTS.md` 拆分而成。Root `AGENTS.md` 只保留索引同硬性維護規則。

## 文件維護（硬性）

**每次改 code 都要同步更新本資料夾相關章節。** 路由、互動、狀態、loading／error、測試範圍有變，就改對應檔。未更新 spec 當未完成，唔好當做完（見 [14-definition-of-done.md](./14-definition-of-done.md)）。

## 索引

| 檔                                                                         | 內容                                        |
| -------------------------------------------------------------------------- | ------------------------------------------- |
| [00-overview.md](./00-overview.md)                                         | §0 文件目的、產品目標、非目標、基本假設     |
| [01-tech-stack.md](./01-tech-stack.md)                                     | §1 技術棧、coding conventions、目錄         |
| [02-visual-design.md](./02-visual-design.md)                               | §2 視覺與體驗方向、design tokens、金額顯示  |
| [03-responsive-layout.md](./03-responsive-layout.md)                       | §3 Responsive Layout                        |
| [04-routing.md](./04-routing.md)                                           | §4 Routing 與導航                           |
| [05-pages/README.md](./05-pages/README.md)                                 | §5 頁面規格（每個頁面一檔）                 |
| [06-data-state.md](./06-data-state.md)                                     | §6 資料與狀態、Zustand、repository          |
| [07-auth-security.md](./07-auth-security.md)                               | §7 Auth 與安全                              |
| [08-pwa.md](./08-pwa.md)                                                   | §8 PWA 規格                                 |
| [09-feedback.md](./09-feedback.md)                                         | §9 Loading、Empty、Error 與 Feedback        |
| [10-accessibility.md](./10-accessibility.md)                               | §10 Accessibility                           |
| [11-performance.md](./11-performance.md)                                   | §11 Performance                             |
| [12-testing.md](./12-testing.md)                                           | §12 測試策略                                |
| [13-deployment.md](./13-deployment.md)                                     | §13 環境與部署                              |
| [14-definition-of-done.md](./14-definition-of-done.md)                     | §14 Definition of Done                      |
| [15-division-of-responsibilities.md](./15-division-of-responsibilities.md) | §15 前後端分工與限制                        |
| [99-project-rules.md](./99-project-rules.md)                               | Project rules（spec source of truth、驗證） |

API 語意見 [`../swagger.yaml`](../swagger.yaml)。
