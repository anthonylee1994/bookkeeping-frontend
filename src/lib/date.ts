import {addCalendarDays, addCalendarMonths, daysInMonth, parseDate, toHongKongCalendar, toHongKongInstant} from "./calendar";
import type {DateInput} from "./calendar";
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
