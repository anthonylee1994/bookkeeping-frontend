import axios from "axios";
import {afterEach, describe, expect, it, vi} from "vitest";
import {domainTestState} from "../test/domainFixtures";
import {ReceiptsRepository} from "./receiptsRepository";

const TOKEN = "api-token";
const IDEMPOTENCY_KEY = "60000000-0000-4000-8000-000000000001";
const transaction = domainTestState.transactions[0];

afterEach(() => {
    vi.restoreAllMocks();
});

describe("ReceiptsRepository", () => {
    it("uploads a supported receipt as multipart form data", async () => {
        const request = vi.spyOn(axios, "request").mockResolvedValue({data: {image_url: "https://example.test/receipt.png", sha256: "a".repeat(64)}});

        expect(await new ReceiptsRepository(TOKEN).upload(new File(["receipt"], "receipt.png", {type: "image/png"}))).toMatchObject({ok: true});
        const body = request.mock.calls[0]?.[0].data;
        expect(body).toBeInstanceOf(FormData);
        expect((body as FormData).get("file")).toBeInstanceOf(File);
    });

    it("rejects unsupported and oversized receipt files locally", async () => {
        const request = vi.spyOn(axios, "request");
        const repository = new ReceiptsRepository(TOKEN);

        expect(await repository.upload(new File(["text"], "receipt.txt", {type: "text/plain"}))).toMatchObject({ok: false, error: {code: "validation"}});
        expect(await repository.upload(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", {type: "image/png"}))).toMatchObject({ok: false, error: {code: "validation"}});
        expect(request).not.toHaveBeenCalled();
    });

    it("parses a receipt preview", async () => {
        const preview = {
            confidence: 0.9,
            parsed: {amount_cents: 1200, currency: "HKD" as const, occurred_at: "2026-09-14T16:00:00+08:00"},
            missing_fields: [],
            low_confidence_fields: [],
            image_url: "https://example.test/receipt.png",
        };
        const request = vi.spyOn(axios, "request").mockResolvedValue({data: {preview}});

        expect(await new ReceiptsRepository(TOKEN).parse(preview.image_url)).toEqual({ok: true, value: preview});
        expect(request).toHaveBeenCalledWith(expect.objectContaining({method: "POST", url: "/api/v1/ai/parse", data: {image_url: preview.image_url}}));
    });

    it("confirms an AI transaction with an idempotency key", async () => {
        const request = vi.spyOn(axios, "request").mockResolvedValue({data: {transaction}});
        const input = {
            account_id: transaction.account_id,
            category_id: transaction.category_id,
            kind: transaction.kind,
            amount_cents: transaction.amount_cents,
            occurred_at: transaction.occurred_at,
        };

        expect(await new ReceiptsRepository(TOKEN).confirm(input, IDEMPOTENCY_KEY)).toMatchObject({ok: true});
        expect(request).toHaveBeenCalledWith(
            expect.objectContaining({method: "POST", url: "/api/v1/ai/confirm", data: expect.objectContaining({source: "ai"}), headers: expect.objectContaining({"Idempotency-Key": IDEMPOTENCY_KEY})})
        );
    });
});
