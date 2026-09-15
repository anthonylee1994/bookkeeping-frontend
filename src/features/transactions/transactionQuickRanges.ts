import {addMonthsToDate, todayDate} from "@/lib/date";
import type {TransactionFilters} from "@/data/types";

export type QuickRange = "all" | "this_month" | "last_month" | "last_30";

/** 由快捷選項算出日期範圍；`all` 代表清空 from／to。 */
export function quickRangeToFilters(range: QuickRange): Pick<TransactionFilters, "from" | "to"> {
    if (range === "all") return {from: undefined, to: undefined};

    const today = todayDate();
    if (range === "last_30") {
        const from = new Date(`${today}T00:00:00.000Z`);
        from.setUTCDate(from.getUTCDate() - 29);
        return {from: from.toISOString().slice(0, 10), to: today};
    }

    const anchor = range === "this_month" ? today : addMonthsToDate(today, -1);
    const month = anchor.slice(0, 7);
    const lastDay = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0));
    return {from: `${month}-01`, to: lastDay.toISOString().slice(0, 10)};
}

/** 反推目前 filter 對應哪個快捷選項，沒有對上就當作自訂（`null`）。 */
export function matchQuickRange(filters: TransactionFilters): QuickRange | null {
    if (filters.from === undefined && filters.to === undefined) return "all";
    for (const range of ["this_month", "last_month", "last_30"] as const) {
        const candidate = quickRangeToFilters(range);
        if (candidate.from === filters.from && candidate.to === filters.to) return range;
    }
    return null;
}
