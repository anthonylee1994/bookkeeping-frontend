import {apiRequest} from "./apiRepository";
import {localValidation} from "./localResult";
import {aiResponseSchema, receiptUploadResponseSchema, transactionResponseSchema} from "./repositorySchemas";
import {transactionInputSchema, uuidSchema} from "./schema";
import type {AiPreview, LocalResult, ReceiptUpload, Transaction, TransactionInput, UUID} from "./types";

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
const receiptTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export class ReceiptsRepository {
    readonly #token: string;

    constructor(token: string) {
        this.#token = token;
    }

    async upload(file: File): Promise<LocalResult<ReceiptUpload>> {
        if (!receiptTypes.has(file.type)) return localValidation("只支援 JPEG、PNG 或 WebP 圖片", {file: "檔案類型不支援"});
        if (file.size > MAX_RECEIPT_BYTES) return localValidation("圖片不可大過 10 MiB", {file: "檔案太大"});
        const formData = new FormData();
        formData.append("file", file);
        return apiRequest(this.#token, {method: "POST", url: "/api/v1/receipts/upload", data: formData}, receiptUploadResponseSchema);
    }

    async parse(imageUrl: string): Promise<LocalResult<AiPreview>> {
        if (imageUrl.trim() === "") return localValidation("單據圖片網址無效", {image_url: "必填"});
        return apiRequest(this.#token, {method: "POST", url: "/api/v1/ai/parse", data: {image_url: imageUrl}}, aiResponseSchema);
    }

    async confirm(input: TransactionInput, idempotencyKey: UUID): Promise<LocalResult<Transaction>> {
        if (!uuidSchema.safeParse(idempotencyKey).success) return localValidation("Idempotency key 無效");
        const parsed = transactionInputSchema.safeParse({...input, currency: "HKD", source: "ai"});
        if (!parsed.success) return localValidation("交易資料無效");
        return apiRequest(this.#token, {method: "POST", url: "/api/v1/ai/confirm", data: parsed.data, headers: {"Idempotency-Key": idempotencyKey}}, transactionResponseSchema);
    }
}
