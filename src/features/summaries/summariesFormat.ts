import type {SummaryPeriod} from "@/data/types";
import {addPeriod, endOfPeriod, startOfPeriod, toDisplayDate, toDisplayMonth, toIsoDate} from "@/lib/date";
import {formatMessage, messages} from "@/lib/i18n";

export const SUMMARY_PERIODS: readonly SummaryPeriod[] = ["daily", "weekly", "monthly"];

export function periodLabel(period: SummaryPeriod): string {
    if (period === "daily") return formatMessage(messages.summaries.periodDaily);
    if (period === "weekly") return formatMessage(messages.summaries.periodWeekly);
    return formatMessage(messages.summaries.periodMonthly);
}

/** 期間首尾（香港時區 `YYYY-MM-DD`）；週報以星期一為第一日。 */
export function periodRange(date: string, period: SummaryPeriod): {from: string; to: string} {
    return {from: toIsoDate(startOfPeriod(date, period)), to: toIsoDate(endOfPeriod(date, period))};
}

/** 期間標題；週報明文寫出「星期一至星期日」，不靠用戶自己數。 */
export function periodRangeLabel(date: string, period: SummaryPeriod): string {
    if (period === "monthly") return toDisplayMonth(date);

    const {from, to} = periodRange(date, period);
    if (period === "daily") return toDisplayDate(from);

    return `${toDisplayDate(from)}（${formatMessage(messages.summaries.weekStart)}）– ${toDisplayDate(to)}（${formatMessage(messages.summaries.weekEnd)}）`;
}

/** 依期間加減，回香港時區 `YYYY-MM-DD`。 */
export function shiftPeriod(date: string, period: SummaryPeriod, amount: number): string {
    return toIsoDate(addPeriod(date, period, amount));
}
