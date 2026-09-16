import {addCalendarDays, addCalendarMonths, compareCalendarDates, daysInMonth, parseCalendarDate, parseDate, toHongKongCalendar, toHongKongInstant} from "./calendar";
import type {CalendarDate, DateInput} from "./calendar";
import {formatMessage, intl, messages} from "./i18n";
import type {SummaryPeriod} from "../data/types";

export const HONG_KONG_TIME_ZONE = "Asia/Hong_Kong";

const DISPLAY_DATE_OPTIONS = {year: "numeric", month: "long", day: "numeric", timeZone: HONG_KONG_TIME_ZONE} as const;

export function nowIso(): string {
    return new Date().toISOString();
}

export function toDisplayDate(input: DateInput): string {
    return intl.formatDate(parseDate(input), DISPLAY_DATE_OPTIONS);
}

export function toDisplayDateTime(input: DateInput): string {
    return intl.formatDate(parseDate(input), {...DISPLAY_DATE_OPTIONS, hour: "2-digit", minute: "2-digit", hour12: false});
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
        throw new RangeError(formatMessage(messages.runtime.periodAmountInteger));
    }
    const date = toHongKongCalendar(input);
    if (period === "monthly") {
        return toHongKongInstant(addCalendarMonths(date, amount));
    }
    return toHongKongInstant(addCalendarDays(date, amount * (period === "weekly" ? 7 : 1)));
}

/** 香港時區的今日，格式 `YYYY-MM-DD`。 */
export function todayDate(): string {
    return toIsoDate(new Date());
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 目標日期距離香港「今日」的分日數；正數代表未來。 */
export function daysFromToday(input: DateInput): number {
    return Math.round(compareCalendarDates(toHongKongCalendar(input), toHongKongCalendar(new Date())) / MS_PER_DAY);
}

/** 將任何 datetime 轉為香港時區的 `YYYY-MM-DD`（供 URL filter 使用）。 */
export function toIsoDate(input: DateInput): string {
    return formatCalendarDate(toHongKongCalendar(input));
}

/** 以香港日曆加減月份，回 `YYYY-MM-DD`；月底會 clamp 到目標月份最後一日。 */
export function addMonthsToDate(date: string, amount: number): string {
    return formatCalendarDate(addCalendarMonths(parseCalendarDate(date), amount));
}

/** 顯示月份標題，例如 `2026年9月`。 */
export function toDisplayMonth(input: DateInput): string {
    return intl.formatDate(parseDate(input), {year: "numeric", month: "long", timeZone: HONG_KONG_TIME_ZONE});
}

function formatCalendarDate({year, month, day}: CalendarDate): string {
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
