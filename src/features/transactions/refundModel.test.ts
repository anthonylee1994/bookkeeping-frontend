import {describe, expect, it} from "vitest";
import {defaultRefundFormValues, refundAvailability, refundFormSchema, refundFormValuesToInput} from "@/features/transactions/refundModel";
import {domainTestState} from "@/test/domainFixtures";
import type {Transaction} from "@/data/types";

const base = domainTestState.transactions[0];

function transaction(overrides: Partial<Transaction>): Transaction {
    return {...base, ...overrides};
}

describe("refundAvailability", () => {
    it("allows refunding up to the original amount minus refunds already made", () => {
        expect(refundAvailability(transaction({amount_cents: 10000, net_amount_cents: 7000}))).toEqual({allowed: true, remainingCents: 7000, reason: null});
    });

    it("blocks refunds for transfers", () => {
        expect(refundAvailability(transaction({kind: "transfer", transfer_account_id: domainTestState.accounts[1].id}))).toEqual({
            allowed: false,
            remainingCents: 0,
            reason: "轉帳不可退款",
        });
    });

    it("blocks refunding a refund record", () => {
        expect(refundAvailability(transaction({refund_of_id: base.id}))).toEqual({allowed: false, remainingCents: 0, reason: "退款記錄不可再退款"});
    });

    it("blocks refunds once the transaction is fully refunded", () => {
        expect(refundAvailability(transaction({amount_cents: 10000, net_amount_cents: 0}))).toEqual({allowed: false, remainingCents: 0, reason: "此交易已全數退款"});
    });
});

describe("refundFormSchema", () => {
    const schema = refundFormSchema(7000);

    it("rejects an amount above the remaining cap", () => {
        const result = schema.safeParse({amount: "70.01", occurredAt: "2026-09-15T12:00", note: ""});
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]).toMatchObject({path: ["amount"], message: "退款金額不可超過 HK$70.00"});
    });

    it("accepts an amount at the cap", () => {
        expect(schema.safeParse({amount: "70.00", occurredAt: "2026-09-15T12:00", note: ""}).success).toBe(true);
    });

    it("rejects a non-positive or malformed amount", () => {
        expect(schema.safeParse({amount: "0", occurredAt: "2026-09-15T12:00", note: ""}).error?.issues[0].message).toBe("金額必須大於零");
        expect(schema.safeParse({amount: "1.234", occurredAt: "2026-09-15T12:00", note: ""}).error?.issues[0].message).toBe("請輸入有效金額，最多兩位小數");
    });

    it("requires an occurred at value", () => {
        expect(schema.safeParse({amount: "10.00", occurredAt: "", note: ""}).error?.issues[0]).toMatchObject({path: ["occurredAt"], message: "請選擇日期時間"});
    });
});

describe("refund form values", () => {
    it("defaults to refunding the full remaining amount", () => {
        expect(defaultRefundFormValues(7000).amount).toBe("70.00");
        expect(defaultRefundFormValues(7000).occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it("converts dollars to cents and treats a Hong Kong local time as the instant", () => {
        expect(refundFormValuesToInput({amount: "12.34", occurredAt: "2026-09-15T12:00", note: "  退貨  "})).toEqual({
            amount_cents: 1234,
            occurred_at: "2026-09-15T04:00:00.000Z",
            note: "退貨",
        });
    });

    it("drops a blank note", () => {
        expect(refundFormValuesToInput({amount: "1.00", occurredAt: "2026-09-15T12:00", note: "   "}).note).toBeNull();
    });
});
