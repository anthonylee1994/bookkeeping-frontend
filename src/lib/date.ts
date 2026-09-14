import {HONG_KONG_OFFSET_MS, addCalendarDays, addCalendarMonths, daysInMonth, parseDate, toHongKongCalendar, toHongKongInstant} from "./calendar";
import type {DateInput} from "./calendar";
import type {SummaryPeriod} from "../data/types";

export const HONG_KONG_TIME_ZONE = "Asia/Hong_Kong";

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
