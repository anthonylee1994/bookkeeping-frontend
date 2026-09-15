import {apiRequest} from "./apiRepository";
import {localValidation} from "./localResult";
import {aiResponseSchema, receiptUploadResponseSchema, transactionRowResponseSchema} from "./repositorySchemas";
import {transactionInputSchema, uuidSchema} from "./schema";
import {formatMessage, messages} from "../lib/i18n";
import type {AiPreview, LocalResult, ReceiptUpload, TransactionInput, TransactionRow, UUID} from "./types";

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
const receiptTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export class ReceiptsRepository {
    readonly #token: string;

    constructor(token: string) {
        this.#token = token;
    }

    async upload(file: File): Promise<LocalResult<ReceiptUpload>> {
        if (!receiptTypes.has(file.type)) return localValidation(formatMessage(messages.validation.receiptTypeUnsupported), {file: formatMessage(messages.fields.fileTypeUnsupported)});
        if (file.size > MAX_RECEIPT_BYTES) return localValidation(formatMessage(messages.validation.receiptTooLarge), {file: formatMessage(messages.fields.fileTooLarge)});
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
