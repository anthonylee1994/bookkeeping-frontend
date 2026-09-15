import type {TransactionKind, TransactionRow} from "@/data/types";
import {formatMessage, messages} from "./i18n";
import {formatSignedAmount} from "./money";

export type TransactionTone = "income" | "expense" | "transfer";

export function kindLabel(kind: TransactionKind): string {
    if (kind === "income") return formatMessage(messages.transactions.income);
    if (kind === "expense") return formatMessage(messages.transactions.expense);
    return formatMessage(messages.transactions.transfer);
}

export function isRefund(transaction: TransactionRow): boolean {
    return transaction.refund_of_id !== null && transaction.refund_of_id !== undefined;
}

/**
 * 金額顏色跟顯示正負號：支出紅、收入／退款綠（退款顯示為 +）；轉帳無正負號。
 */
export function transactionTone(transaction: TransactionRow): TransactionTone {
    if (transaction.kind === "transfer" && !isRefund(transaction)) return "transfer";
    if (isRefund(transaction) || transaction.kind === "income") return "income";
    return "expense";
}

export function transactionTitle(transaction: TransactionRow): string {
    if (transaction.note !== null && transaction.note !== undefined && transaction.note.trim() !== "") return transaction.note;
    if (transaction.payment_method !== null && transaction.payment_method !== undefined && transaction.payment_method.trim() !== "") return transaction.payment_method;
    return kindLabel(transaction.kind);
}

/** 交易本身金額（退款加後綴），不計其他退款。 */
export function transactionAmountLabel(transaction: TransactionRow): string {
    return formatSignedAmount({cents: transaction.amount_cents, kind: transaction.kind, isRefund: isRefund(transaction)});
}

/** 列表用金額：退款行顯示正值加「退款」後綴；其他行顯示 `net_amount_cents`（原交易扣除退款後）。 */
export function transactionDisplayAmount(transaction: TransactionRow): string {
    if (isRefund(transaction)) {
        return formatSignedAmount({cents: transaction.amount_cents, kind: transaction.kind, isRefund: true});
    }
    return formatSignedAmount({cents: transaction.net_amount_cents, kind: transaction.kind});
}
