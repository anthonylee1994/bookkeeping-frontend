import {describe, expect, it} from "vitest";
import type {Summary} from "@/data/types";
import {periodRange, periodRangeLabel, periodLabel, shiftPeriod, summaryInsightKey} from "@/features/summaries/summariesFormat";

function summary(overrides: Partial<Summary> = {}): Summary {
    return {
        range: {from: "2026-09-01T00:00:00+08:00", to: "2026-09-30T23:59:59+08:00"},
        income_cents: 100_000,
        expense_cents: 40_000,
        net_cents: 60_000,
        daily: [],
        by_category: [],
        by_account: [],
        transfers: {count: 0, total_cents: 0},
        transactions: {data: [], meta: {page: 1, per_page: 25, total: 2, total_pages: 1}},
        ...overrides,
    };
}

describe("summariesFormat", () => {
    it("labels each period in Chinese", () => {
        expect(periodLabel("daily")).toBe("日");
        expect(periodLabel("weekly")).toBe("週");
        expect(periodLabel("monthly")).toBe("月");
    });

    it("keys the AI insight on aggregates and row count, not pagination", () => {
        const base = summaryInsightKey(summary());
        expect(summaryInsightKey(summary())).toBe(base);
        expect(summaryInsightKey(summary({transactions: {data: [], meta: {page: 2, per_page: 25, total: 2, total_pages: 1}}}))).toBe(base);
        expect(summaryInsightKey(summary({expense_cents: 40_001}))).not.toBe(base);
        expect(summaryInsightKey(summary({transactions: {data: [], meta: {page: 1, per_page: 25, total: 3, total_pages: 1}}}))).not.toBe(base);
    });

    it("keeps the week range Monday to Sunday for any anchor day", () => {
        expect(periodRange("2026-09-16", "weekly")).toEqual({from: "2026-09-14", to: "2026-09-20"});

        const label = periodRangeLabel("2026-09-16", "weekly");
        expect(label).toContain("2026年9月14日");
        expect(label).toContain("星期一");
        expect(label).toContain("2026年9月20日");
        expect(label).toContain("星期日");
    });

    it("uses a single day for daily and the whole month for monthly", () => {
        expect(periodRange("2026-09-16", "daily")).toEqual({from: "2026-09-16", to: "2026-09-16"});
        expect(periodRangeLabel("2026-09-16", "daily")).toBe("2026年9月16日");

        expect(periodRange("2026-09-16", "monthly")).toEqual({from: "2026-09-01", to: "2026-09-30"});
        expect(periodRangeLabel("2026-09-16", "monthly")).toContain("9月");
    });

    it("shifts by whole periods and keeps the same anchor weekday", () => {
        expect(shiftPeriod("2026-09-16", "weekly", -1)).toBe("2026-09-09");
        expect(shiftPeriod("2026-09-16", "weekly", 1)).toBe("2026-09-23");
        expect(shiftPeriod("2026-09-16", "daily", -1)).toBe("2026-09-15");
        expect(shiftPeriod("2026-09-30", "monthly", 1)).toBe("2026-10-30");
    });
});
