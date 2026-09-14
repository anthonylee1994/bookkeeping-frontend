import {describe, expect, it} from "vitest";
import {nextRunAt} from "./schedule";

describe("nextRunAt", () => {
    it("calculates daily and interval schedules from the start date", () => {
        expect(nextRunAt({start_on: "2026-09-14", frequency: "daily", interval: 2}, "2026-09-17T12:00:00+08:00")).toBe("2026-09-18T00:00:00+08:00");
    });

    it("uses the selected weekday and Monday-to-Sunday calendar semantics", () => {
        expect(nextRunAt({start_on: "2026-09-15", frequency: "weekly", interval: 2, day_of_week: 1})).toBe("2026-09-21T00:00:00+08:00");
        expect(nextRunAt({start_on: "2026-09-15", frequency: "weekly", interval: 2, day_of_week: 1}, "2026-09-22")).toBe("2026-10-05T00:00:00+08:00");
    });

    it("clamps monthly and yearly dates at month end", () => {
        expect(nextRunAt({start_on: "2026-01-31", frequency: "monthly", day_of_month: 31}, "2026-02-01")).toBe("2026-02-28T00:00:00+08:00");
        expect(nextRunAt({start_on: "2023-03-01", frequency: "yearly", month_of_year: 2, day_of_month: 29}, "2024-01-01")).toBe("2024-02-29T00:00:00+08:00");
    });

    it("returns null after end_on", () => {
        expect(nextRunAt({start_on: "2026-09-01", end_on: "2026-09-15", frequency: "weekly", day_of_week: 1}, "2026-09-15")).toBeNull();
    });
});
