import {z} from "zod";
import {dateTimeLocalToIso, isoToDateTimeLocal} from "@/features/transactions/TransactionFormModel";
import {formatMessage, messages} from "@/lib/i18n";
import {dollarsToCents} from "@/lib/money";
import type {Account, AiPreview, Category, Merchant, TransactionInput} from "@/data/types";

/** 低於呢個信心度就要明顯提示用戶逐項核對。 */
export const LOW_CONFIDENCE_THRESHOLD = 0.6;

export type ScanReviewField = "amount" | "kind" | "occurredAt" | "merchant";

export type ScanReviewValues = {
    kind: "income" | "expense";
    amount: string;
    accountId: string;
    categoryId: string;
    merchantId: string;
    occurredAt: string;
    note: string;
};

export type ScanReference = {
    accounts: Account[];
    categories: Category[];
    merchants: Merchant[];
};

function isBlank(value: string | null | undefined): boolean {
    return value === null || value === undefined || value.trim() === "";
}

function findByName<Item extends {name: string}>(items: Item[], name: string | null | undefined): Item | null {
    const target = name?.trim() ?? "";
    if (target === "") return null;
    return items.find(item => item.name.localeCompare(target, "zh-HK", {sensitivity: "accent"}) === 0) ?? null;
}

/** AI 可能回無效或缺失日期，一律退回「而家」，唔會令表單出 NaN。 */
function toDateTimeLocal(iso: string | null | undefined): string {
    const value = iso?.trim() ?? "";
    const parsed = value === "" ? new Date(Number.NaN) : new Date(value);
    return isoToDateTimeLocal(Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString());
}

export function isLowConfidence(preview: AiPreview): boolean {
    const confidence = preview.parsed?.confidence;
    return confidence !== null && confidence !== undefined && confidence < LOW_CONFIDENCE_THRESHOLD;
}

export function confidencePercent(preview: AiPreview): number {
    return Math.round((preview.parsed?.confidence ?? 0) * 100);
}

/** AI 未能辨識嘅欄位；UI 會逐個標「需覆核」。 */
export function missingReviewFields(preview: AiPreview): ScanReviewField[] {
    const parsed = preview.parsed;
    const missing: ScanReviewField[] = [];
    if (parsed?.amount_cents === null || parsed?.amount_cents === undefined) missing.push("amount");
    if (parsed?.kind === null || parsed?.kind === undefined) missing.push("kind");
    if (isBlank(parsed?.occurred_at)) missing.push("occurredAt");
    if (isBlank(parsed?.merchant_name)) missing.push("merchant");
    return missing;
}

/** 解析結果只做建議：對唔到名嘅商戶／分類留空，唔會亂猜。 */
export function previewToReviewValues(preview: AiPreview, reference: ScanReference): ScanReviewValues {
    const parsed = preview.parsed;
    const kind = parsed?.kind ?? "expense";
    const merchant = findByName(reference.merchants, parsed?.merchant_name);
    const category =
        findByName(
            reference.categories.filter(item => item.kind === kind),
            parsed?.category_hint
        ) ?? (merchant?.default_category_id != null ? (reference.categories.find(item => item.id === merchant.default_category_id && item.kind === kind) ?? null) : null);

    return {
        kind,
        amount: parsed?.amount_cents === null || parsed?.amount_cents === undefined ? "" : (parsed.amount_cents / 100).toFixed(2),
        accountId: reference.accounts[0]?.id ?? "",
        categoryId: category?.id ?? "",
        merchantId: merchant?.id ?? "",
        occurredAt: toDateTimeLocal(parsed?.occurred_at),
        note: parsed?.note ?? "",
    };
}

/** 對唔到現有商戶時，仍然將 AI 讀到嘅名帶入 autocomplete，畀用戶一撳就建立。 */
export function suggestedMerchantName(preview: AiPreview): string {
    return preview.parsed?.merchant_name?.trim() ?? "";
}

export const scanReviewSchema = z
    .object({
        kind: z.enum(["income", "expense"]),
        amount: z.string().min(1, formatMessage(messages.fields.amountRequired)),
        accountId: z.string().min(1, formatMessage(messages.fields.accountRequired)),
        categoryId: z.string(),
        merchantId: z.string(),
        occurredAt: z.string().min(1, formatMessage(messages.fields.dateTimeRequired)),
        note: z.string(),
    })
    .superRefine((values, context) => {
        const amount = dollarsToCents(values.amount);
        if (typeof amount !== "number") context.addIssue({code: "custom", path: ["amount"], message: amount.message});
    });

export function reviewValuesToInput(values: ScanReviewValues, imageUrls: string[]): TransactionInput {
    const amount = dollarsToCents(values.amount);
    if (typeof amount !== "number") throw new Error(amount.message);
    return {
        kind: values.kind,
        amount_cents: amount,
        account_id: values.accountId,
        category_id: values.categoryId === "" ? null : values.categoryId,
        merchant_id: values.merchantId === "" ? null : values.merchantId,
        transfer_account_id: null,
        occurred_at: dateTimeLocalToIso(values.occurredAt),
        payment_method: null,
        note: values.note.trim() === "" ? null : values.note.trim(),
        currency: "HKD",
        source: "ai",
        image_urls: imageUrls,
    };
}
