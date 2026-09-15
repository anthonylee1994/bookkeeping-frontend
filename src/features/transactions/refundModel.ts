import {z} from "zod";
import {dateTimeLocalToIso, isoToDateTimeLocal} from "@/features/transactions/TransactionFormModel";
import {formatMessage, messages} from "@/lib/i18n";
import {centsToDollars, dollarsToCents} from "@/lib/money";
import {isRefund} from "@/lib/transactionDisplay";
import type {RefundInput, Transaction} from "@/data/types";

export type RefundFormValues = {
    amount: string;
    occurredAt: string;
    note: string;
};

export type RefundAvailability = {
    allowed: boolean;
    /** 尚可退款金額（cents）。 */
    remainingCents: number;
    /** 不可退款時的原因文案；可退款時為 null。 */
    reason: string | null;
};

/**
 * 退款上限＝原交易金額減已退款總額，即 `net_amount_cents`。
 * 轉帳不可退款；退款記錄本身亦不可再退。
 */
export function refundAvailability(transaction: Transaction): RefundAvailability {
    if (transaction.kind === "transfer") {
        return {allowed: false, remainingCents: 0, reason: formatMessage(messages.transactions.detail.refundTransferNotAllowed)};
    }
    if (isRefund(transaction)) {
        return {allowed: false, remainingCents: 0, reason: formatMessage(messages.transactions.detail.refundOfRefundNotAllowed)};
    }

    const remainingCents = Math.max(0, transaction.net_amount_cents);
    if (remainingCents === 0) {
        return {allowed: false, remainingCents, reason: formatMessage(messages.transactions.detail.refundFullyRefunded)};
    }
    return {allowed: true, remainingCents, reason: null};
}

/** 上限會隨交易變動，所以 schema 由 remainingCents 產生。 */
export function refundFormSchema(remainingCents: number) {
    return z
        .object({
            amount: z.string().min(1, formatMessage(messages.fields.amountRequired)),
            occurredAt: z.string().min(1, formatMessage(messages.fields.dateTimeRequired)),
            note: z.string(),
        })
        .superRefine((values, context) => {
            const amount = dollarsToCents(values.amount);
            if (typeof amount !== "number") {
                context.addIssue({code: "custom", path: ["amount"], message: amount.message});
                return;
            }
            if (amount > remainingCents) {
                context.addIssue({
                    code: "custom",
                    path: ["amount"],
                    message: formatMessage(messages.transactions.detail.refundExceedsCap, {amount: centsToDollars(remainingCents)}),
                });
            }
        });
}

/** 預設退全數，時間預設現在。 */
export function defaultRefundFormValues(remainingCents: number): RefundFormValues {
    return {
        amount: (remainingCents / 100).toFixed(2),
        occurredAt: isoToDateTimeLocal(new Date().toISOString()),
        note: "",
    };
}

export function refundFormValuesToInput(values: RefundFormValues): RefundInput {
    const amount = dollarsToCents(values.amount);
    if (typeof amount !== "number") throw new Error(amount.message);
    return {
        amount_cents: amount,
        occurred_at: dateTimeLocalToIso(values.occurredAt),
        note: values.note.trim() === "" ? null : values.note.trim(),
    };
}
