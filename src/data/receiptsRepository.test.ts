import {afterEach, describe, expect, it, vi} from "vitest";
import {domainTestState} from "../test/domainFixtures";
import {apiClient} from "./apiRepository";
import {ReceiptsRepository} from "./receiptsRepository";

const TOKEN = "api-token";
const IDEMPOTENCY_KEY = "60000000-0000-4000-8000-000000000001";
const IMPORT_LOG_ID = "80000000-0000-4000-8000-000000000001";
const transaction = domainTestState.transactions[0];
const transactionRow = {
    id: transaction.id,
    account_id: transaction.account_id,
    category_id: transaction.category_id,
    merchant_id: transaction.merchant_id,
    kind: transaction.kind,
    amount_cents: transaction.amount_cents,
    currency: transaction.currency,
    occurred_at: transaction.occurred_at,
    note: transaction.note,
    payment_method: transaction.payment_method,
    source: transaction.source,
    transfer_account_id: transaction.transfer_account_id,
    image_urls: transaction.image_urls,
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe("ReceiptsRepository", () => {
    it("uploads a supported receipt as multipart form data", async () => {
        const request = vi.spyOn(apiClient, "request").mockResolvedValue({data: {url: "https://example.test/receipt.png", sha256: "a".repeat(64)}});

        expect(await new ReceiptsRepository(TOKEN).upload(new File(["receipt"], "receipt.png", {type: "image/png"}))).toMatchObject({ok: true, value: {url: "https://example.test/receipt.png"}});
        const body = request.mock.calls[0]?.[0].data;
        expect(body).toBeInstanceOf(FormData);
        expect((body as FormData).get("file")).toBeInstanceOf(File);
    });

    it("rejects unsupported and oversized receipt files locally", async () => {
        const request = vi.spyOn(apiClient, "request");
        const repository = new ReceiptsRepository(TOKEN);

        expect(await repository.upload(new File(["text"], "receipt.txt", {type: "text/plain"}))).toMatchObject({ok: false, error: {code: "validation"}});
        expect(await repository.upload(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", {type: "image/png"}))).toMatchObject({ok: false, error: {code: "validation"}});
        expect(request).not.toHaveBeenCalled();
    });

    it("parses a receipt preview", async () => {
        const preview = {
            id: IMPORT_LOG_ID,
            image_urls: ["https://example.test/receipt.png"],
            sha256: "a".repeat(64),
            status: "success" as const,
            parsed: {amount_cents: 1200, kind: "expense" as const, occurred_at: "2026-09-14T16:00:00+08:00", merchant_name: "茶餐廳", confidence: 0.9},
        };
        const request = vi.spyOn(apiClient, "request").mockResolvedValue({data: preview});

        expect(await new ReceiptsRepository(TOKEN).parse(preview.image_urls[0])).toEqual({ok: true, value: preview});
        expect(request).toHaveBeenCalledWith(expect.objectContaining({method: "POST", url: "/ai/parse", data: {image_url: preview.image_urls[0]}}));
    });

    it("interprets a natural-language sentence with trimmed text", async () => {
        const preview = {
            id: IMPORT_LOG_ID,
            source: "text" as const,
            image_urls: [],
            sha256: "a".repeat(64),
            status: "success" as const,
            parsed: {amount_cents: 4500, kind: "expense" as const, occurred_at: "2026-09-14T16:00:00+08:00", merchant_name: "茶餐廳", confidence: 0.9},
        };
        const request = vi.spyOn(apiClient, "request").mockResolvedValue({data: preview});

        expect(await new ReceiptsRepository(TOKEN).interpret(" 尋日茶餐廳 45 蚊 ")).toEqual({ok: true, value: preview});
        expect(request).toHaveBeenCalledWith(expect.objectContaining({method: "POST", url: "/ai/interpret", data: {text: "尋日茶餐廳 45 蚊"}}));
    });

    it("rejects blank or oversized interpret text locally", async () => {
        const request = vi.spyOn(apiClient, "request");
        const repository = new ReceiptsRepository(TOKEN);

        expect(await repository.interpret("   ")).toMatchObject({ok: false, error: {code: "validation"}});
        expect(await repository.interpret("a".repeat(501))).toMatchObject({ok: false, error: {code: "validation"}});
        expect(request).not.toHaveBeenCalled();
    });

    it("confirms an AI transaction with the import log id and an idempotency key", async () => {
        const request = vi.spyOn(apiClient, "request").mockResolvedValue({data: {transaction: transactionRow}});
        const input = {
            account_id: transaction.account_id,
            category_id: transaction.category_id,
            kind: transaction.kind,
            amount_cents: transaction.amount_cents,
            occurred_at: transaction.occurred_at,
        };

        expect(await new ReceiptsRepository(TOKEN).confirm(input, IMPORT_LOG_ID, IDEMPOTENCY_KEY)).toMatchObject({ok: true});
        expect(request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "POST",
                url: "/ai/confirm",
                data: expect.objectContaining({source: "ai", ai_import_log_id: IMPORT_LOG_ID}),
                headers: expect.objectContaining({"Idempotency-Key": IDEMPOTENCY_KEY}),
            })
        );
    });
});
