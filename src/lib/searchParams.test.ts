import {describe, expect, it} from "vitest";
import type {TransactionFilters} from "../data/types";
import {parseRecurringStatus, parseReturnTo, parseSummaryParams, parseTransactionFilters, serializeRecurringStatus, serializeSummaryParams, serializeTransactionFilters} from "./searchParams";

const accountId = "10000000-0000-4000-8000-000000000001";
const categoryId = "20000000-0000-4000-8000-000000000002";
const merchantId = "30000000-0000-4000-8000-000000000001";

describe("transaction filter search params", () => {
    const filters: TransactionFilters = {
        from: "2026-09-01",
        to: "2026-09-30",
        kind: "expense",
        account_id: accountId,
        category_id: categoryId,
        merchant_id: merchantId,
        keyword: "咖啡",
        min_amount_cents: 1000,
        max_amount_cents: 50000,
        sort: "occurred_at",
        order: "desc",
        page: 2,
        per_page: 50,
    };

    it("round-trips every filter field", () => {
        const serialized = serializeTransactionFilters(filters);
        expect(serialized.get("q")).toBe("咖啡");
        expect(serialized.get("min")).toBe("1000");
        expect(serialized.get("max")).toBe("50000");
        expect(parseTransactionFilters(serialized)).toEqual(filters);
    });

    it("parses from a raw query string", () => {
        expect(parseTransactionFilters(`kind=income&page=3&q=%E5%B7%A5%E8%B3%87`)).toEqual({kind: "income", page: 3, keyword: "工資"});
    });

    it("drops invalid enum, uuid, date and number values", () => {
        const parsed = parseTransactionFilters(`kind=refund&account_id=not-a-uuid&from=2026-13-40&min=-5&page=0&per_page=999&sort=unknown&order=up`);
        expect(parsed).toEqual({});
    });

    it("ignores blank values", () => {
        expect(parseTransactionFilters("q=&kind=&page=")).toEqual({});
    });

    it("serializes an empty filter without query noise", () => {
        expect(serializeTransactionFilters({}).toString()).toBe("");
    });
});

describe("summary search params", () => {
    it("round-trips period, date and page", () => {
        const params = {period: "weekly", date: "2026-09-16", page: 4} as const;
        expect(parseSummaryParams(serializeSummaryParams(params))).toEqual(params);
    });

    it("defaults to monthly when period is missing or invalid", () => {
        expect(parseSummaryParams("")).toEqual({period: "monthly"});
        expect(parseSummaryParams("period=yearly")).toEqual({period: "monthly"});
    });

    it("drops invalid date and page", () => {
        expect(parseSummaryParams("period=daily&date=2026-02-30&page=-1")).toEqual({period: "daily"});
    });
});

describe("recurring status search params", () => {
    it("round-trips a valid status", () => {
        expect(parseRecurringStatus(serializeRecurringStatus("paused"))).toBe("paused");
    });

    it("defaults to active and drops invalid status values", () => {
        expect(parseRecurringStatus("")).toBe("active");
        expect(parseRecurringStatus("status=archived")).toBe("active");
    });
});

describe("returnTo validation", () => {
    it("accepts same-origin absolute paths", () => {
        expect(parseReturnTo("/transactions?kind=expense")).toBe("/transactions?kind=expense");
        expect(parseReturnTo("  /settings  ")).toBe("/settings");
    });

    it("rejects open redirect attempts and unsafe input", () => {
        expect(parseReturnTo("//evil.example")).toBeNull();
        expect(parseReturnTo("https://evil.example")).toBeNull();
        expect(parseReturnTo("javascript:alert(1)")).toBeNull();
        expect(parseReturnTo("/\\evil.example")).toBeNull();
        expect(parseReturnTo("relative/path")).toBeNull();
        expect(parseReturnTo("")).toBeNull();
        expect(parseReturnTo(null)).toBeNull();
        expect(parseReturnTo("/ok\u0000")).toBeNull();
    });
});
