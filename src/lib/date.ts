import type {RecurringFrequency, SummaryPeriod} from "../data/types";

const HONG_KONG_OFFSET_MS = 8 * 60 * 60 * 1000;

type DateInput = Date | string | number;

type CalendarDate = {
    year: number;
    month: number;
    day: number;
};

export type NextRunRule = {
    start_on: string;
    frequency: RecurringFrequency;
    interval?: number;
    day_of_week?: number;
    day_of_month?: number;
    month_of_year?: number;
    end_on?: string | null;
};

function parseDate(input: DateInput): Date {
    const value = input instanceof Date ? new Date(input.getTime()) : new Date(input);
    if (Number.isNaN(value.getTime())) {
        throw new RangeError("無效日期");
    }
    return value;
}

function parseCalendarDate(input: string): CalendarDate {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
    if (match === null) {
        throw new RangeError("日期必須使用 YYYY-MM-DD 格式");
    }

    const result = {year: Number(match[1]), month: Number(match[2]), day: Number(match[3])};
    const test = new Date(Date.UTC(result.year, result.month - 1, result.day));
    if (test.getUTCFullYear() !== result.year || test.getUTCMonth() !== result.month - 1 || test.getUTCDate() !== result.day) {
        throw new RangeError("無效日期");
    }
    return result;
}

function toHongKongCalendar(input: DateInput): CalendarDate {
    const shifted = new Date(parseDate(input).getTime() + HONG_KONG_OFFSET_MS);
    return {year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate()};
}

function toHongKongInstant({year, month, day}: CalendarDate, endOfDay = false): Date {
    const time = Date.UTC(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
    return new Date(time - HONG_KONG_OFFSET_MS);
}

function daysInMonth(year: number, month: number): number {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addCalendarDays(date: CalendarDate, amount: number): CalendarDate {
    const result = new Date(Date.UTC(date.year, date.month - 1, date.day + amount));
    return {year: result.getUTCFullYear(), month: result.getUTCMonth() + 1, day: result.getUTCDate()};
}

function addCalendarMonths(date: CalendarDate, amount: number, preferredDay = date.day): CalendarDate {
    const monthIndex = date.year * 12 + date.month - 1 + amount;
    const year = Math.floor(monthIndex / 12);
    const month = (((monthIndex % 12) + 12) % 12) + 1;
    return {year, month, day: Math.min(preferredDay, daysInMonth(year, month))};
}

function compareCalendarDates(left: CalendarDate, right: CalendarDate): number {
    return Date.UTC(left.year, left.month - 1, left.day) - Date.UTC(right.year, right.month - 1, right.day);
}

function assertPositiveInteger(value: number, name: string): void {
    if (!Number.isInteger(value) || value < 1) {
        throw new RangeError(`${name} 必須係正整數`);
    }
}

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

export function nowIso(): string {
    return new Date().toISOString();
}

export function toDisplayDate(input: DateInput): string {
    const {year, month, day} = toHongKongCalendar(input);
    return `${year}年${month}月${day}日`;
}

export function toDisplayDateTime(input: DateInput): string {
    const shifted = new Date(parseDate(input).getTime() + HONG_KONG_OFFSET_MS);
    const date = `${shifted.getUTCFullYear()}年${shifted.getUTCMonth() + 1}月${shifted.getUTCDate()}日`;
    const time = `${String(shifted.getUTCHours()).padStart(2, "0")}:${String(shifted.getUTCMinutes()).padStart(2, "0")}`;
    return `${date} ${time}`;
}

export function startOfPeriod(input: DateInput, period: SummaryPeriod): Date {
    const date = toHongKongCalendar(input);
    if (period === "weekly") {
        const dayOfWeek = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
        return toHongKongInstant(addCalendarDays(date, -(dayOfWeek === 0 ? 6 : dayOfWeek - 1)));
    }
    if (period === "monthly") {
        return toHongKongInstant({...date, day: 1});
    }
    return toHongKongInstant(date);
}

export function endOfPeriod(input: DateInput, period: SummaryPeriod): Date {
    const start = toHongKongCalendar(startOfPeriod(input, period));
    if (period === "weekly") {
        return toHongKongInstant(addCalendarDays(start, 6), true);
    }
    if (period === "monthly") {
        return toHongKongInstant({...start, day: daysInMonth(start.year, start.month)}, true);
    }
    return toHongKongInstant(start, true);
}

export function addPeriod(input: DateInput, period: SummaryPeriod, amount = 1): Date {
    if (!Number.isInteger(amount)) {
        throw new RangeError("period amount 必須係整數");
    }
    const date = toHongKongCalendar(input);
    if (period === "monthly") {
        return toHongKongInstant(addCalendarMonths(date, amount));
    }
    return toHongKongInstant(addCalendarDays(date, amount * (period === "weekly" ? 7 : 1)));
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

export const HONG_KONG_TIME_ZONE = "Asia/Hong_Kong";
