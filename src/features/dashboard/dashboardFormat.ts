import type {CategoryBreakdown, TransactionKind, TransactionRow} from "@/data/types";
import {formatMessage, messages} from "@/lib/i18n";
import {formatSignedAmount} from "@/lib/money";

/** 分類 chart 用嘅固定色序；dashboard response 冇跟 category color，所以由 UI 決定。 */
export const CATEGORY_COLORS = ["#047857", "#0284c7", "#d97706", "#7c3aed", "#e11d48"];

export type CategorySlice = {
    id: string;
    name: string;
    cents: number;
    share: number;
    color: string;
};

export type TransactionTone = "income" | "expense" | "transfer" | "refund";

export function kindLabel(kind: TransactionKind): string {
    if (kind === "income") return formatMessage(messages.transactions.income);
    if (kind === "expense") return formatMessage(messages.transactions.expense);
    return formatMessage(messages.transactions.transfer);
}

/** 按本月總支出排序，攞頭 N 個分類；share 係相對「所有分類支出總和」計。 */
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

export function transactionTone(transaction: TransactionRow): TransactionTone {
    if (transaction.refund_of_id !== null && transaction.refund_of_id !== undefined) return "refund";
    return transaction.kind;
}

export function transactionTitle(transaction: TransactionRow): string {
    if (transaction.note !== null && transaction.note !== undefined && transaction.note.trim() !== "") return transaction.note;
    if (transaction.payment_method !== null && transaction.payment_method !== undefined && transaction.payment_method.trim() !== "") return transaction.payment_method;
    return kindLabel(transaction.kind);
}

export function transactionAmountLabel(transaction: TransactionRow): string {
    return formatSignedAmount({cents: transaction.amount_cents, kind: transaction.kind, isRefund: transactionTone(transaction) === "refund"});
}

export function formatShare(share: number): string {
    return `${Math.round(share * 100)}%`;
}
