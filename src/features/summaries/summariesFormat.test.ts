import {describe, expect, it} from "vitest";
import {periodRange, periodRangeLabel, periodLabel, shiftPeriod} from "@/features/summaries/summariesFormat";

describe("summariesFormat", () => {
    it("labels each period in Chinese", () => {
        expect(periodLabel("daily")).toBe("日");
        expect(periodLabel("weekly")).toBe("週");
        expect(periodLabel("monthly")).toBe("月");
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
