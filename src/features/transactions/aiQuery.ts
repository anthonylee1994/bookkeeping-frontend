import type {AiQueryFilters, TransactionFilters} from "@/data/types";
import {parseTransactionFilters} from "@/lib/searchParams";

/**
 * 將 `/ai/query` 回傳嘅 URL 同名 filter params 轉成 `TransactionFilters`。
 * 經 `parseTransactionFilters` 正規化（`q` → `keyword`、`min`／`max` → `min_amount_cents`／`max_amount_cents`），
 * 無效值會自動丟棄，同手動篩選行同一條路徑。
 */
export function aiQueryToFilters(query: AiQueryFilters | null): TransactionFilters {
    if (query === null) return {};

    const params = new URLSearchParams();
    if (query.from !== undefined) params.set("from", query.from);
    if (query.to !== undefined) params.set("to", query.to);
    if (query.kind !== undefined) params.set("kind", query.kind);
    if (query.account_id !== undefined) params.set("account_id", query.account_id);
    if (query.category_id !== undefined) params.set("category_id", query.category_id);
    if (query.merchant_id !== undefined) params.set("merchant_id", query.merchant_id);
    if (query.q !== undefined) params.set("q", query.q);
    if (query.min !== undefined) params.set("min", String(query.min));
    if (query.max !== undefined) params.set("max", String(query.max));

    return parseTransactionFilters(params);
}

/** AI 譯唔到任何有效條件時回 false（前端當「解讀唔到」處理）。 */
export function hasAiQueryFilters(filters: TransactionFilters): boolean {
    return Object.keys(filters).length > 0;
}
