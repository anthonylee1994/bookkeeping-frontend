export const HONG_KONG_OFFSET_MS = 8 * 60 * 60 * 1000;

export type DateInput = Date | string | number;

export type CalendarDate = {
    year: number;
    month: number;
    day: number;
};

export function parseDate(input: DateInput): Date {
    const value = input instanceof Date ? new Date(input.getTime()) : new Date(input);
    if (Number.isNaN(value.getTime())) {
        throw new RangeError("無效日期");
    }
    return value;
}

export function parseCalendarDate(input: string): CalendarDate {
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

export function toHongKongCalendar(input: DateInput): CalendarDate {
    const shifted = new Date(parseDate(input).getTime() + HONG_KONG_OFFSET_MS);
    return {year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate()};
}

export function toHongKongInstant({year, month, day}: CalendarDate, endOfDay = false): Date {
    const time = Date.UTC(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
    return new Date(time - HONG_KONG_OFFSET_MS);
}

export function daysInMonth(year: number, month: number): number {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addCalendarDays(date: CalendarDate, amount: number): CalendarDate {
    const result = new Date(Date.UTC(date.year, date.month - 1, date.day + amount));
    return {year: result.getUTCFullYear(), month: result.getUTCMonth() + 1, day: result.getUTCDate()};
}

export function addCalendarMonths(date: CalendarDate, amount: number, preferredDay = date.day): CalendarDate {
    const monthIndex = date.year * 12 + date.month - 1 + amount;
    const year = Math.floor(monthIndex / 12);
    const month = (((monthIndex % 12) + 12) % 12) + 1;
    return {year, month, day: Math.min(preferredDay, daysInMonth(year, month))};
}

export function compareCalendarDates(left: CalendarDate, right: CalendarDate): number {
    return Date.UTC(left.year, left.month - 1, left.day) - Date.UTC(right.year, right.month - 1, right.day);
}

export function assertPositiveInteger(value: number, name: string): void {
    if (!Number.isInteger(value) || value < 1) {
        throw new RangeError(`${name} 必須係正整數`);
    }
}
