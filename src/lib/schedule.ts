import {addCalendarDays, addCalendarMonths, assertPositiveInteger, compareCalendarDates, daysInMonth, parseCalendarDate, toHongKongCalendar} from "./calendar";
import type {CalendarDate, DateInput} from "./calendar";
import type {RecurringFrequency} from "../data/types";

export type NextRunRule = {
    start_on: string;
    frequency: RecurringFrequency;
    interval?: number;
    day_of_week?: number;
    day_of_month?: number;
    month_of_year?: number;
    end_on?: string | null;
};

function formatHongKongIso(date: CalendarDate): string {
    const year = String(date.year).padStart(4, "0");
    const month = String(date.month).padStart(2, "0");
    const day = String(date.day).padStart(2, "0");
    return `${year}-${month}-${day}T00:00:00+08:00`;
}

function firstWeeklyRun(start: CalendarDate, dayOfWeek: number): CalendarDate {
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        throw new RangeError("day_of_week 必須係 0 至 6");
    }
    const startDayOfWeek = new Date(Date.UTC(start.year, start.month - 1, start.day)).getUTCDay();
    return addCalendarDays(start, (dayOfWeek - startDayOfWeek + 7) % 7);
}

function firstMonthlyRun(start: CalendarDate, dayOfMonth: number): CalendarDate {
    assertPositiveInteger(dayOfMonth, "day_of_month");
    if (dayOfMonth > 31) {
        throw new RangeError("day_of_month 必須係 1 至 31");
    }
    const candidate = {...start, day: Math.min(dayOfMonth, daysInMonth(start.year, start.month))};
    return compareCalendarDates(candidate, start) >= 0 ? candidate : addCalendarMonths(start, 1, dayOfMonth);
}

function firstYearlyRun(start: CalendarDate, monthOfYear: number, dayOfMonth: number): CalendarDate {
    if (!Number.isInteger(monthOfYear) || monthOfYear < 1 || monthOfYear > 12) {
        throw new RangeError("month_of_year 必須係 1 至 12");
    }
    assertPositiveInteger(dayOfMonth, "day_of_month");
    if (dayOfMonth > 31) {
        throw new RangeError("day_of_month 必須係 1 至 31");
    }
    const candidate = {year: start.year, month: monthOfYear, day: Math.min(dayOfMonth, daysInMonth(start.year, monthOfYear))};
    if (compareCalendarDates(candidate, start) >= 0) {
        return candidate;
    }
    return {year: start.year + 1, month: monthOfYear, day: Math.min(dayOfMonth, daysInMonth(start.year + 1, monthOfYear))};
}

function firstRun(rule: NextRunRule, start: CalendarDate): CalendarDate {
    if (rule.frequency === "daily") {
        return start;
    }
    if (rule.frequency === "weekly") {
        return firstWeeklyRun(start, rule.day_of_week ?? new Date(Date.UTC(start.year, start.month - 1, start.day)).getUTCDay());
    }
    if (rule.frequency === "monthly") {
        return firstMonthlyRun(start, rule.day_of_month ?? start.day);
    }
    return firstYearlyRun(start, rule.month_of_year ?? start.month, rule.day_of_month ?? start.day);
}

function advanceRun(date: CalendarDate, rule: NextRunRule, interval: number): CalendarDate {
    if (rule.frequency === "daily") {
        return addCalendarDays(date, interval);
    }
    if (rule.frequency === "weekly") {
        return addCalendarDays(date, interval * 7);
    }
    if (rule.frequency === "monthly") {
        return addCalendarMonths(date, interval, rule.day_of_month ?? date.day);
    }

    const year = date.year + interval;
    const month = rule.month_of_year ?? date.month;
    const day = rule.day_of_month ?? date.day;
    return {year, month, day: Math.min(day, daysInMonth(year, month))};
}

export function nextRunAt(rule: NextRunRule, from: DateInput = rule.start_on): string | null {
    const interval = rule.interval ?? 1;
    assertPositiveInteger(interval, "interval");

    const start = parseCalendarDate(rule.start_on);
    const threshold = toHongKongCalendar(from);
    let candidate = firstRun(rule, start);
    while (compareCalendarDates(candidate, threshold) < 0) {
        candidate = advanceRun(candidate, rule, interval);
    }

    if (rule.end_on !== undefined && rule.end_on !== null && compareCalendarDates(candidate, parseCalendarDate(rule.end_on)) > 0) {
        return null;
    }
    return formatHongKongIso(candidate);
}
