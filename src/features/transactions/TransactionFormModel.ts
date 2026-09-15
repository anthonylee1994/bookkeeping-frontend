import {z} from "zod";
import {dollarsToCents} from "@/lib/money";
import type {Transaction, TransactionInput, TransactionKind, TransactionUpdateInput} from "@/data/types";

export type TransactionFormValues = {
    kind: TransactionKind;
    amount: string;
    accountId: string;
    transferAccountId: string;
    categoryId: string;
    merchantId: string;
    occurredAt: string;
    paymentMethod: string;
    note: string;
};

export const transactionFormSchema = z
    .object({
        kind: z.enum(["income", "expense", "transfer"]),
        amount: z.string().min(1, "請輸入金額"),
        accountId: z.string().min(1, "請選擇帳戶"),
        transferAccountId: z.string(),
        categoryId: z.string(),
        merchantId: z.string(),
        occurredAt: z.string().min(1, "請選擇日期時間"),
        paymentMethod: z.string(),
        note: z.string(),
    })
    .superRefine((values, context) => {
        const amount = dollarsToCents(values.amount);
        if (typeof amount !== "number") context.addIssue({code: "custom", path: ["amount"], message: amount.message});
        if (values.kind === "transfer" && values.transferAccountId === "") {
            context.addIssue({code: "custom", path: ["transferAccountId"], message: "請選擇轉入帳戶"});
        }
        if (values.kind === "transfer" && values.transferAccountId === values.accountId && values.accountId !== "") {
            context.addIssue({code: "custom", path: ["transferAccountId"], message: "轉出與轉入帳戶不可相同"});
        }
    });

function pad(value: number): string {
    return String(value).padStart(2, "0");
}

/** 將 ISO instant 顯示成香港 datetime-local 控件需要的值。 */
export function isoToDateTimeLocal(iso: string): string {
    const shifted = new Date(new Date(iso).getTime() + 8 * 60 * 60 * 1000);
    return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}

/** datetime-local 無 offset；產品固定視為香港時間。 */
export function dateTimeLocalToIso(value: string): string {
    return new Date(`${value}:00+08:00`).toISOString();
}

export function emptyTransactionFormValues(): TransactionFormValues {
    return {
        kind: "expense",
        amount: "",
        accountId: "",
        transferAccountId: "",
        categoryId: "",
        merchantId: "",
        occurredAt: isoToDateTimeLocal(new Date().toISOString()),
        paymentMethod: "",
        note: "",
    };
}

export function transactionToFormValues(transaction: Transaction): TransactionFormValues {
    return {
        kind: transaction.kind,
        amount: (transaction.amount_cents / 100).toFixed(2),
        accountId: transaction.account_id,
        transferAccountId: transaction.transfer_account_id ?? "",
        categoryId: transaction.category_id ?? "",
        merchantId: transaction.merchant_id ?? "",
        occurredAt: isoToDateTimeLocal(transaction.occurred_at),
        paymentMethod: transaction.payment_method ?? "",
        note: transaction.note ?? "",
    };
}

export function formValuesToInput(values: TransactionFormValues, imageUrls: string[]): TransactionInput | TransactionUpdateInput {
    const amount = dollarsToCents(values.amount);
    if (typeof amount !== "number") throw new Error(amount.message);
    return {
        kind: values.kind,
        amount_cents: amount,
        account_id: values.accountId,
        transfer_account_id: values.kind === "transfer" ? values.transferAccountId : null,
        category_id: values.kind === "transfer" || values.categoryId === "" ? null : values.categoryId,
        merchant_id: values.kind === "transfer" || values.merchantId === "" ? null : values.merchantId,
        occurred_at: dateTimeLocalToIso(values.occurredAt),
        payment_method: values.paymentMethod.trim() === "" ? null : values.paymentMethod.trim(),
        note: values.note.trim() === "" ? null : values.note.trim(),
        currency: "HKD",
        image_urls: imageUrls,
    };
}
