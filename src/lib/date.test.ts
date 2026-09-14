import {describe, expect, it, vi} from "vitest";
import {addPeriod, endOfPeriod, nowIso, startOfPeriod, toDisplayDate, toDisplayDateTime} from "./date";

describe("Hong Kong date formatting", () => {
    it("formats across the UTC to Hong Kong day boundary", () => {
        expect(toDisplayDate("2026-01-31T15:59:59Z")).toBe("2026年1月31日");
        expect(toDisplayDate("2026-01-31T16:00:00Z")).toBe("2026年2月1日");
        expect(toDisplayDateTime("2026-01-31T16:05:00Z")).toBe("2026年2月1日 00:05");
    });

    it("returns the current instant as ISO", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-09-14T03:04:05.678Z"));
        expect(nowIso()).toBe("2026-09-14T03:04:05.678Z");
        vi.useRealTimers();
    });
});

describe("period boundaries", () => {
    it("uses Monday through Sunday for a week", () => {
        const input = "2026-09-16T12:00:00+08:00";
        expect(startOfPeriod(input, "weekly").toISOString()).toBe("2026-09-13T16:00:00.000Z");
        expect(endOfPeriod(input, "weekly").toISOString()).toBe("2026-09-20T15:59:59.999Z");
    });

    it("handles leap-month and day boundaries in Hong Kong time", () => {
        expect(startOfPeriod("2024-02-29T23:00:00+08:00", "monthly").toISOString()).toBe("2024-01-31T16:00:00.000Z");
        expect(endOfPeriod("2024-02-01T00:00:00+08:00", "monthly").toISOString()).toBe("2024-02-29T15:59:59.999Z");
        expect(endOfPeriod("2026-09-14T12:00:00+08:00", "daily").toISOString()).toBe("2026-09-14T15:59:59.999Z");
    });

    it("adds calendar periods and clamps month-end dates", () => {
        expect(addPeriod("2026-01-31T12:00:00+08:00", "daily").toISOString()).toBe("2026-01-31T16:00:00.000Z");
        expect(addPeriod("2026-01-31T12:00:00+08:00", "weekly").toISOString()).toBe("2026-02-06T16:00:00.000Z");
        expect(addPeriod("2024-01-31T12:00:00+08:00", "monthly").toISOString()).toBe("2024-02-28T16:00:00.000Z");
    });
});
