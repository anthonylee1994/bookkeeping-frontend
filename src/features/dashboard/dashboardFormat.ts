import type {CategoryBreakdown} from "@/data/types";
import {formatMessage, messages} from "@/lib/i18n";

/** 分類 chart 用的固定色序；dashboard response 沒有跟 category color，所以由 UI 決定。 */
export const CATEGORY_COLORS = ["#047857", "#0284c7", "#d97706", "#7c3aed", "#e11d48"];

export type CategorySlice = {
    id: string;
    name: string;
    cents: number;
    share: number;
    color: string;
};

/** 按本月總支出排序，取頭 N 個分類；share 是相對「所有分類支出總和」計算。 */
export function rankExpenseCategories(breakdown: CategoryBreakdown[], limit = 5): CategorySlice[] {
    const total = breakdown.reduce((sum, item) => sum + Math.max(item.expense_cents, 0), 0);

    return [...breakdown]
        .filter(item => item.expense_cents > 0)
        .sort((left, right) => right.expense_cents - left.expense_cents)
        .slice(0, limit)
        .map((item, index) => ({
            id: item.category_id ?? `uncategorized-${index}`,
            name: item.name ?? formatMessage(messages.dashboard.uncategorized),
            cents: item.expense_cents,
            share: total === 0 ? 0 : item.expense_cents / total,
            color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        }));
}

export function formatShare(share: number): string {
    return `${Math.round(share * 100)}%`;
}
