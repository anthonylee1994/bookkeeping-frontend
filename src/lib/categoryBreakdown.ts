import type {CategoryBreakdown} from "@/data/types";
import {formatMessage, messages} from "./i18n";

/** 分類 chart 用的固定色序；API 冇跟 category color，所以由 UI 決定。 */
export const CATEGORY_COLORS = ["#047857", "#0284c7", "#d97706", "#7c3aed", "#e11d48"];

export type CategoryBreakdownKind = "income" | "expense";

export type CategorySlice = {
    id: string;
    name: string;
    cents: number;
    share: number;
    color: string;
};

type RankCategoriesOptions = {
    limit?: number;
    /** 分類名為 null 時顯示的文案；預設「未分類」。 */
    uncategorizedLabel?: string;
};

function amountOf(item: CategoryBreakdown, kind: CategoryBreakdownKind): number {
    return kind === "income" ? item.income_cents : item.expense_cents;
}

/** 按指定種類（收入／支出）排序，取頭 N 個分類；share 相對同種類總額計算。 */
export function rankCategories(breakdown: CategoryBreakdown[], kind: CategoryBreakdownKind, {limit = 5, uncategorizedLabel}: RankCategoriesOptions = {}): CategorySlice[] {
    const total = breakdown.reduce((sum, item) => sum + Math.max(amountOf(item, kind), 0), 0);
    const label = uncategorizedLabel ?? formatMessage(messages.common.uncategorized);

    return [...breakdown]
        .filter(item => amountOf(item, kind) > 0)
        .sort((left, right) => amountOf(right, kind) - amountOf(left, kind))
        .slice(0, limit)
        .map((item, index) => ({
            id: item.category_id ?? `uncategorized-${index}`,
            name: item.name ?? label,
            cents: amountOf(item, kind),
            share: total === 0 ? 0 : amountOf(item, kind) / total,
            color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        }));
}

export function formatShare(share: number): string {
    return `${Math.round(share * 100)}%`;
}
