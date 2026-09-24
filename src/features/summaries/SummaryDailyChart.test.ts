import {describe, expect, it} from "vitest";
import {dailyChartData} from "./SummaryDailyChart";

describe("dailyChartData", () => {
    it("fills the full month, including zero days, but leaves future days empty", () => {
        const days = dailyChartData([{date: "2026-09-14", net_cents: -12345}], "2026-09-16", "monthly", "2026-09-16");

        expect(days).toHaveLength(30);
        expect(days[0]).toEqual({date: "2026-09-01", amount: 0});
        expect(days[13]).toEqual({date: "2026-09-14", amount: -12345});
        expect(days[15]).toEqual({date: "2026-09-16", amount: 0});
        expect(days[16]).toEqual({date: "2026-09-17", amount: null});
    });

    it("handles weeks crossing a month boundary", () => {
        const days = dailyChartData([], "2026-10-01", "weekly", "2026-10-04");

        expect(days.map(day => day.date)).toEqual(["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    });
});
