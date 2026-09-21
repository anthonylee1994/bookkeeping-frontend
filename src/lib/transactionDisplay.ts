import type {TransactionKind, TransactionRow} from "@/data/types";
import {formatMessage, messages} from "./i18n";
import {formatSignedAmount} from "./money";

export type TransactionTone = "income" | "expense" | "transfer";

export function kindLabel(kind: TransactionKind): string {
    if (kind === "income") return formatMessage(messages.transactions.income);
    if (kind === "expense") return formatMessage(messages.transactions.expense);
    return formatMessage(messages.transactions.transfer);
}

/**
 * 金額顏色跟顯示正負號：支出紅、收入綠；轉帳無正負號。
 */
export function transactionTone(transaction: TransactionRow): TransactionTone {
    if (transaction.kind === "transfer") return "transfer";
    if (transaction.kind === "income") return "income";
    return "expense";
}

export function transactionTitle(transaction: TransactionRow, categoryName?: string | null, merchantName?: string | null): string {
    if (transaction.note !== null && transaction.note !== undefined && transaction.note.trim() !== "") return transaction.note;
    if (categoryName !== null && categoryName !== undefined && categoryName.trim() !== "") return categoryName;
    if (merchantName !== null && merchantName !== undefined && merchantName.trim() !== "") return merchantName;
    if (transaction.payment_method !== null && transaction.payment_method !== undefined && transaction.payment_method.trim() !== "") return transaction.payment_method;
    return kindLabel(transaction.kind);
}

export function transactionAmountLabel(transaction: TransactionRow): string {
    return formatSignedAmount({cents: transaction.amount_cents, kind: transaction.kind});
}

export function transactionDisplayAmount(transaction: TransactionRow): string {
    return formatSignedAmount({cents: transaction.amount_cents, kind: transaction.kind});
}
