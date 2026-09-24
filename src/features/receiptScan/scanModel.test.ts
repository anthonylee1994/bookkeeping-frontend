import {describe, expect, it} from "vitest";
import {
    confidencePercent,
    isItemLowConfidence,
    isLowConfidence,
    itemMissingReviewFields,
    missingReviewFields,
    parsedItemToReviewValues,
    previewItems,
    previewToReviewValues,
    reviewValuesToInput,
    scanReviewSchema,
    suggestedMerchantName,
} from "@/features/receiptScan/scanModel";
import {domainTestState} from "@/test/domainFixtures";
import type {AiParsedFields, AiParsedItem, AiPreview} from "@/data/types";

const reference = {accounts: domainTestState.accounts, categories: domainTestState.categories, merchants: domainTestState.merchants};

function preview(parsed: AiParsedFields | null, status: AiPreview["status"] = "success", suggestedCategoryId: string | null = null): AiPreview {
    return {id: "80000000-0000-4000-8000-000000000001", image_urls: ["https://example.test/receipt.png"], sha256: "a".repeat(64), status, parsed, suggested_category_id: suggestedCategoryId};
}

describe("scanModel flags", () => {
    it("flags a parse below the confidence threshold", () => {
        expect(isLowConfidence(preview({confidence: 0.42}))).toBe(true);
        expect(confidencePercent(preview({confidence: 0.42}))).toBe(42);
        expect(isLowConfidence(preview({confidence: 0.9}))).toBe(false);
        expect(isLowConfidence(preview({amount_cents: 100}))).toBe(false);
    });

    it("lists every field the parse could not read", () => {
        expect(missingReviewFields(preview(null))).toEqual(["amount", "kind", "occurredAt", "merchant"]);
        expect(missingReviewFields(preview({amount_cents: 1200, kind: "expense", occurred_at: "2026-09-14T16:00:00+08:00", merchant_name: "街角咖啡"}))).toEqual([]);
        expect(missingReviewFields(preview({amount_cents: 1200, kind: "expense", merchant_name: "   "}))).toEqual(["occurredAt", "merchant"]);
    });
});

describe("previewToReviewValues", () => {
    it("prefills the parsed fields and matches a known merchant and category", () => {
        const values = previewToReviewValues(preview({amount_cents: 1250, kind: "expense", occurred_at: "2026-09-14T16:00:00+08:00", merchant_name: "街角咖啡", note: "咖啡"}), reference);

        expect(values).toMatchObject({
            kind: "expense",
            amount: "12.50",
            accountId: domainTestState.accounts[0].id,
            merchantId: domainTestState.merchants[0].id,
            categoryId: domainTestState.categories[1].id,
            occurredAt: "2026-09-14T16:00",
            note: "咖啡",
        });
    });

    it("prefers the backend-resolved category id over the category hint", () => {
        const values = previewToReviewValues(preview({amount_cents: 1250, kind: "expense", category_hint: "不存在"}, "success", domainTestState.categories[1].id), reference);

        expect(values.categoryId).toBe(domainTestState.categories[1].id);
    });

    it("ignores a suggested category whose kind does not match", () => {
        const values = previewToReviewValues(preview({amount_cents: 1250, kind: "expense"}, "success", domainTestState.categories[0].id), reference);

        expect(values.categoryId).toBe("");
    });

    it("leaves unmatched merchants and categories blank instead of guessing", () => {
        const values = previewToReviewValues(preview({amount_cents: 1250, kind: "expense", merchant_name: "未見過的店", category_hint: "不存在"}), reference);

        expect(values.merchantId).toBe("");
        expect(values.categoryId).toBe("");
        expect(suggestedMerchantName(preview({merchant_name: " 未見過的店 "}))).toBe("未見過的店");
    });

    it("falls back to now when the parsed date is missing or unusable", () => {
        expect(previewToReviewValues(preview({occurred_at: "不是日期"}), reference).occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
        expect(previewToReviewValues(preview(null), reference)).toMatchObject({kind: "expense", amount: "", categoryId: "", merchantId: ""});
    });
});

describe("scanReviewSchema and payload", () => {
    const valid = {kind: "expense" as const, amount: "12.50", accountId: domainTestState.accounts[0].id, categoryId: "", merchantId: "", occurredAt: "2026-09-15T12:00", note: ""};

    it("requires an amount, an account and a date", () => {
        expect(scanReviewSchema.safeParse({...valid, amount: ""}).error?.issues[0]).toMatchObject({path: ["amount"], message: "請輸入金額"});
        expect(scanReviewSchema.safeParse({...valid, accountId: ""}).error?.issues[0]).toMatchObject({path: ["accountId"], message: "請選擇帳戶"});
        expect(scanReviewSchema.safeParse({...valid, occurredAt: ""}).error?.issues[0]).toMatchObject({path: ["occurredAt"], message: "請選擇日期時間"});
        expect(scanReviewSchema.safeParse({...valid, amount: "1.234"}).error?.issues[0]).toMatchObject({path: ["amount"]});
        expect(scanReviewSchema.safeParse(valid).success).toBe(true);
    });

    it("builds an AI-sourced transaction input that keeps the receipt images", () => {
        expect(reviewValuesToInput({...valid, note: "  午餐  "}, ["https://example.test/receipt.png"])).toEqual({
            kind: "expense",
            amount_cents: 1250,
            account_id: domainTestState.accounts[0].id,
            category_id: null,
            merchant_id: null,
            transfer_account_id: null,
            occurred_at: "2026-09-15T04:00:00.000Z",
            payment_method: null,
            note: "午餐",
            currency: "HKD",
            source: "ai",
            image_urls: ["https://example.test/receipt.png"],
        });
    });
});

describe("multi-item preview", () => {
    const items: AiParsedItem[] = [
        {parsed: {amount_cents: 3000, kind: "expense", occurred_at: "2026-09-14T08:00:00+08:00", confidence: 0.3}, suggested_category_id: domainTestState.categories[1].id},
        {parsed: {amount_cents: 5000, kind: "expense", confidence: 0.9}},
    ];
    const multi: AiPreview = {...preview(null), parsed: {amount_cents: 3000, kind: "expense"}, parsed_items: items};

    it("reads parsed_items and falls back to a legacy single parsed", () => {
        expect(previewItems(multi)).toHaveLength(2);
        expect(previewItems(preview({amount_cents: 100, kind: "expense"}))).toHaveLength(1);
        expect(previewItems(preview(null))).toEqual([]);
    });

    it("maps each item with its own suggested category and review flags", () => {
        const values = parsedItemToReviewValues(items[0], reference);

        expect(values.amount).toBe("30.00");
        expect(values.categoryId).toBe(domainTestState.categories[1].id);
        expect(isItemLowConfidence(items[0])).toBe(true);
        expect(isItemLowConfidence(items[1])).toBe(false);
        expect(itemMissingReviewFields(items[1])).toEqual(["occurredAt", "merchant"]);
    });
});
