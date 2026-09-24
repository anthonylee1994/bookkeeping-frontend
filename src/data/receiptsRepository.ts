import {apiRequest} from "./apiRepository";
import {localValidation} from "./localResult";
import {aiResponseSchema, receiptUploadResponseSchema, transactionRowResponseSchema} from "./repositorySchemas";
import {aiQuerySchema, transactionInputSchema, uuidSchema} from "./schema";
import {formatMessage, messages} from "../lib/i18n";
import type {AiPreview, AiQuery, LocalError, LocalResult, ReceiptUpload, TransactionInput, TransactionRow, UUID} from "./types";

export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
export const RECEIPT_ACCEPT = "image/jpeg,image/png,image/webp";
/** 自然語言打字記帳嘅輸入上限（字元），同 backend `MAX_INTERPRET_TEXT` 一致。 */
export const MAX_INTERPRET_TEXT = 500;
/** 自然語言查詢嘅輸入上限（字元），同 backend `MAX_QUERY_TEXT` 一致。 */
export const MAX_QUERY_TEXT = 500;

const receiptTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

/** 類型／大小規則；UI 要在上載前顯示 preview，所以與 repository 共用同一套檢查。 */
export function validateReceiptFile(file: File): LocalError | null {
    if (!receiptTypes.has(file.type)) {
        return {code: "validation", message: formatMessage(messages.validation.receiptTypeUnsupported), fields: {file: formatMessage(messages.fields.fileTypeUnsupported)}};
    }
    if (file.size > MAX_RECEIPT_BYTES) {
        return {code: "validation", message: formatMessage(messages.validation.receiptTooLarge), fields: {file: formatMessage(messages.fields.fileTooLarge)}};
    }
    return null;
}

export class ReceiptsRepository {
    readonly #token: string;

    constructor(token: string) {
        this.#token = token;
    }

    async upload(file: File): Promise<LocalResult<ReceiptUpload>> {
        const invalid = validateReceiptFile(file);
        if (invalid !== null) return localValidation(invalid.message, invalid.fields);
        const formData = new FormData();
        formData.append("file", file);
        return apiRequest(this.#token, {method: "POST", url: "/receipts/upload", data: formData}, receiptUploadResponseSchema);
    }

    async parse(imageUrl: string): Promise<LocalResult<AiPreview>> {
        if (imageUrl.trim() === "") return localValidation(formatMessage(messages.validation.receiptImageUrlInvalid), {image_url: formatMessage(messages.fields.required)});
        return apiRequest(this.#token, {method: "POST", url: "/ai/parse", data: {image_url: imageUrl}}, aiResponseSchema);
    }

    /** 自然語言打字記帳：解讀一句文字，回同 `parse` 一樣嘅 preview（`source = text`）。 */
    async interpret(text: string): Promise<LocalResult<AiPreview>> {
        const trimmed = text.trim();
        if (trimmed === "") return localValidation(formatMessage(messages.validation.interpretTextEmpty), {text: formatMessage(messages.fields.required)});
        if (trimmed.length > MAX_INTERPRET_TEXT) return localValidation(formatMessage(messages.validation.interpretTextTooLong), {text: formatMessage(messages.fields.interpretTextTooLong)});
        return apiRequest(this.#token, {method: "POST", url: "/ai/interpret", data: {text: trimmed}}, aiResponseSchema);
    }

    /** 自然語言查詢：一句問題 → 交易列表 filter params（純讀取，唔會入帳）。 */
    async query(text: string): Promise<LocalResult<AiQuery>> {
        const trimmed = text.trim();
        if (trimmed === "") return localValidation(formatMessage(messages.validation.queryTextEmpty), {text: formatMessage(messages.fields.required)});
        if (trimmed.length > MAX_QUERY_TEXT) return localValidation(formatMessage(messages.validation.queryTextTooLong), {text: formatMessage(messages.fields.queryTextTooLong)});
        return apiRequest(this.#token, {method: "POST", url: "/ai/query", data: {text: trimmed}}, aiQuerySchema);
    }

    async confirm(input: TransactionInput, importLogId: UUID, idempotencyKey: UUID): Promise<LocalResult<TransactionRow>> {
        if (!uuidSchema.safeParse(importLogId).success) return localValidation(formatMessage(messages.validation.aiLogIdInvalid));
        if (!uuidSchema.safeParse(idempotencyKey).success) return localValidation(formatMessage(messages.validation.idempotencyKeyInvalid));
        const parsed = transactionInputSchema.safeParse({...input, currency: "HKD", source: "ai"});
        if (!parsed.success) return localValidation(formatMessage(messages.validation.transactionInvalid));
        return apiRequest(
            this.#token,
            {method: "POST", url: "/ai/confirm", data: {...parsed.data, ai_import_log_id: importLogId}, headers: {"Idempotency-Key": idempotencyKey}},
            transactionRowResponseSchema
        );
    }
}
