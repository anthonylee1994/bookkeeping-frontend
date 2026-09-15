import {apiRequest} from "./apiRepository";
import {localValidation} from "./localResult";
import {aiResponseSchema, receiptUploadResponseSchema, transactionRowResponseSchema} from "./repositorySchemas";
import {transactionInputSchema, uuidSchema} from "./schema";
import {formatMessage, messages} from "../lib/i18n";
import type {AiPreview, LocalError, LocalResult, ReceiptUpload, TransactionInput, TransactionRow, UUID} from "./types";

export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
export const RECEIPT_ACCEPT = "image/jpeg,image/png,image/webp";

const receiptTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

/** 類型／大小規則；UI 要喺上載前顯示 preview，所以同 repository 共用同一套檢查。 */
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
