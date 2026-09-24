# PLAN — AI 功能擴充路線圖

本文件記錄記帳 App **現有 AI 功能**同**計劃新增**嘅 AI 功能。產品／UX／架構嘅 source of truth 仍然係 [`agent-specs/`](./agent-specs/README.md)；本文件只做規劃同排序，落實任何一項之前要先更新對應 spec 章節（見 [§14](./agent-specs/14-definition-of-done.md)）。

## 現有 AI 功能

| 功能         | API                               | Spec                                                           | 說明                                       |
| ------------ | --------------------------------- | -------------------------------------------------------------- | ------------------------------------------ |
| 單據掃描     | `POST /ai/parse`                  | [§5.6](./agent-specs/05-pages/5.6-receipt-scan.md)             | 相機／上載 → DeepSeek 辨識 → 人手覆核      |
| 打字記帳     | `POST /ai/interpret`              | [§5.10](./agent-specs/05-pages/5.10-natural-language-entry.md) | 自然語言 → 預填交易表單 → 人手確認         |
| AI 收支概況  | `GET /summaries/{period}/insight` | [§5.7](./agent-specs/05-pages/5.7-summaries.md)                | 週／月報表 AI 生成結論同 highlights        |
| 入帳（共用） | `POST /ai/confirm`                | [§5.6](./agent-specs/05-pages/5.6-receipt-scan.md)             | AI preview 經人手覆核後入帳，`source = ai` |

### 不變原則（所有新功能都要守）

- **AI 只出建議**，一律經人手覆核先入帳，唔可以自動寫入。
- **API key、prompt、模型呼叫全部留後端**；frontend 只透過 typed repository 打 API，唔會接觸 DeepSeek。
- AI 生成內容一律用 `ai.bg`／`ai.border`／`ai.fg`（藍色系）同一般品牌綠區分，見 [§2](./agent-specs/02-visual-design.md)。
- 失敗要有 inline retry，唔阻塞其他 deterministic 內容，見 [§9](./agent-specs/09-feedback.md)。
- 每項落實時，同步更新 `swagger.yaml`（API 語意）、對應 §5 spec、`06-data-state`（狀態）同 `12-testing`（測試範圍）。

---

## 路線圖

優先次序：**抵做（重用現有基建）→ 需要新 backend endpoint → 要諗清（撞非目標／高成本）**。

### P1 — 抵做，可重用現有基建

#### 1. 批量打字記帳（拆單）

- **問題**：而家 §5.10 明寫 MVP 只填第一筆，多筆交易回 `status: partial`。但「早餐 30 午餐 50 車費 20」係好常見嘅輸入。
- **做法**：後端 `/ai/interpret` 改為回多筆 `parsed: [...]`；frontend 覆核 drawer 變 multi-row，逐筆可刪／改。
- **重用**：現有 `previewToReviewValues`／`isLowConfidence` 同 review model。
- **影響**：改 §5.10、§5.6；`AiPreview` schema；測試覆蓋多筆。
- **ROI**：最高（修現有短板）。

#### 2. 自然語言查詢

- **做法**：「上月喺 Starbucks 洗咗幾多」「搵返所有醫療開支」→ 後端譯成**現有 filter params**（URL 已經係 filter 嘅 source of truth，見 [§5.3](./agent-specs/05-pages/5.3-transactions-list.md)）。
- **前端**：只負責 render 結果同更新搜尋參數，query 邏輯交後端。
- **影響**：新 endpoint（例如 `POST /ai/query`）；§5.3 加 AI 搜尋入口。

#### 3. 自動分類／商戶建議

- **做法**：打商戶或備註時，AI 建議 category；已有「商戶 default category」deterministic 機制，AI 只喺對唔上時補位。
- **標示**：建議值加「AI 建議」badge，用戶可覆寫。
- **影響**：§5.4；可能重用 `/ai/interpret` 或加輕量 endpoint。

#### 4. 定期交易自動偵測

- **做法**：掃過去 3–6 個月交易，揾到「每月同一商戶、差唔多金額」就建議建立 recurring rule。
- **重用**：[§5.8](./agent-specs/05-pages/5.8-recurring-rules.md) 模組；只加建議卡。

#### 5. 重複交易偵測

- **做法**：新增時如果已有相近交易（同金額／商戶／日期），表單頂提示「可能重複」。
- **分工**：deterministic 做 80%（完全相同），AI 處理模糊案例（金額差幾毫、日期差一日）。

#### 6. 語音記帳

- **做法**：Web Speech API 拎文字 → 直接餵落現有 `/ai/interpret`。
- **前端主導**：幾乎零 backend 改動；要處理瀏覽器支援同權限 fallback。
- **影響**：§5.10 加語音入口。

### P2 — 要新 backend endpoint，價值高

#### 7. 異常／超支提示

- **做法**：月報 insight 進化版，對比歷史 baseline，標出「今月外食比平時多 60%」「呢筆大額唔尋常」。
- **重用**：[§5.7](./agent-specs/05-pages/5.7-summaries.md) 嘅 highlight／callout UI，唔使新 UI 概念。

### P3 — 要做就要先過產品決策

- **銀行月結單／發票 OCR**：直接違反 [§0.2](./agent-specs/00-overview.md) non-goal「CSV／銀行月結單匯入」，要加就係產品決定。
- **財務聊天助手**：成本高，要處理 query safety，MVP 階段唔值。
- **自動外幣換算**：撞 §0.2「多貨幣換算」non-goal。

---

## 建議落地次序

1. 批量拆單（P1-1）
2. 自然語言查詢（P1-2）
3. 自動分類建議（P1-3）
4. 定期／重複偵測（P1-4、P1-5）
5. 語音輸入（P1-6）
6. 異常／超支提示（P2-7）

每完成一項：更新 `swagger.yaml` → 對應 `agent-specs/05-pages/*` → `06-data-state`（新增狀態／hook）→ `12-testing`（測試範圍）→ 跑 Prettier。
