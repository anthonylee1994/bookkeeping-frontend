import {z} from "zod";
import type {RecurringFrequency, RecurringRule, RecurringRuleInput, RecurringStatus} from "@/data/types";
import {formatMessage, messages} from "@/lib/i18n";
import {dollarsToCents} from "@/lib/money";
import {nextRunAt} from "@/lib/schedule";
import type {NextRunRule} from "@/lib/schedule";
import {todayDate} from "@/lib/date";

export type RecurringRuleFormValues = {
    kind: "income" | "expense";
    amount: string;
    accountId: string;
    categoryId: string;
    merchantId: string;
    note: string;
    frequency: RecurringFrequency;
    interval: string;
    dayOfWeek: string;
    dayOfMonth: string;
    monthOfYear: string;
    startOn: string;
    endOn: string;
    status: RecurringStatus;
};

export const recurringRuleFormSchema = z
    .object({
        kind: z.enum(["income", "expense"]),
        amount: z.string().min(1, messages.fields.amountRequired.defaultMessage),
        accountId: z.string().min(1, messages.fields.accountRequired.defaultMessage),
        categoryId: z.string(),
        merchantId: z.string(),
        note: z.string(),
        frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
        interval: z.string(),
        dayOfWeek: z.string(),
        dayOfMonth: z.string(),
        monthOfYear: z.string(),
        startOn: z.string().min(1, messages.recurring.startRequired.defaultMessage),
        endOn: z.string(),
        status: z.enum(["active", "paused", "ended"]),
    })
    .superRefine((values, context) => {
        const amount = dollarsToCents(values.amount);
        if (typeof amount !== "number") context.addIssue({code: "custom", path: ["amount"], message: amount.message});

        if (!/^\d+$/.test(values.interval) || Number(values.interval) < 1) {
            context.addIssue({code: "custom", path: ["interval"], message: formatMessage(messages.validation.recurringIntervalInvalid)});
        }
        if (values.frequency === "weekly" && values.dayOfWeek === "") {
            context.addIssue({code: "custom", path: ["dayOfWeek"], message: formatMessage(messages.validation.weeklyNeedsDayOfWeek)});
        }
        if ((values.frequency === "monthly" || values.frequency === "yearly") && values.dayOfMonth === "") {
            context.addIssue({code: "custom", path: ["dayOfMonth"], message: formatMessage(messages.validation.monthlyNeedsDayOfMonth)});
        }
        if (values.frequency === "yearly" && values.monthOfYear === "") {
            context.addIssue({code: "custom", path: ["monthOfYear"], message: formatMessage(messages.validation.yearlyNeedsMonthOfYear)});
        }
        if (values.endOn !== "" && values.startOn !== "" && values.endOn < values.startOn) {
            context.addIssue({code: "custom", path: ["endOn"], message: formatMessage(messages.validation.recurringEndBeforeStart)});
        }
    });

/** 香港今日嘅星期、月、日（供表單預設值用）。 */
function hongKongTodayParts(): {weekday: number; month: number; day: number} {
    const [year, month, day] = todayDate().split("-").map(Number);
    return {weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(), month, day};
}

export function emptyRecurringRuleFormValues(accountId = ""): RecurringRuleFormValues {
    const today = hongKongTodayParts();
    return {
        kind: "expense",
        amount: "",
        accountId,
        categoryId: "",
        merchantId: "",
        note: "",
        frequency: "monthly",
        interval: "1",
        dayOfWeek: String(today.weekday),
        dayOfMonth: String(today.day),
        monthOfYear: String(today.month),
        startOn: todayDate(),
        endOn: "",
        status: "active",
    };
}

export function recurringRuleToFormValues(rule: RecurringRule): RecurringRuleFormValues {
    return {
        kind: rule.kind,
        amount: (rule.amount_cents / 100).toFixed(2),
        accountId: rule.account_id,
        categoryId: rule.category_id ?? "",
        merchantId: rule.merchant_id ?? "",
        note: rule.note ?? "",
        frequency: rule.frequency,
        interval: String(rule.interval),
        dayOfWeek: rule.day_of_week == null ? "" : String(rule.day_of_week),
        dayOfMonth: rule.day_of_month == null ? "" : String(rule.day_of_month),
        monthOfYear: rule.month_of_year == null ? "" : String(rule.month_of_year),
        startOn: rule.start_on,
        endOn: rule.end_on ?? "",
        status: rule.status,
    };
}

/** 由表單值砌出 schedule；只保留跟目前頻率相關嘅欄位，其餘一律 null。 */
function formValuesToSchedule(values: RecurringRuleFormValues): NextRunRule {
    const interval = Number(values.interval);
    return {
        start_on: values.startOn,
        frequency: values.frequency,
        interval: Number.isInteger(interval) && interval >= 1 ? interval : 1,
        day_of_week: values.frequency === "weekly" ? Number(values.dayOfWeek) : undefined,
        day_of_month: values.frequency === "monthly" || values.frequency === "yearly" ? Number(values.dayOfMonth) : undefined,
        month_of_year: values.frequency === "yearly" ? Number(values.monthOfYear) : undefined,
        end_on: values.endOn === "" ? null : values.endOn,
    };
}

/** 編輯時若排程冇改，保留原本 `next_run_at`，免得重算成過去日期而觸發重複入帳。 */
function hasScheduleChanged(rule: RecurringRule, schedule: NextRunRule): boolean {
    return (
        rule.frequency !== schedule.frequency ||
        rule.interval !== (schedule.interval ?? 1) ||
        rule.start_on !== schedule.start_on ||
        (rule.end_on ?? null) !== (schedule.end_on ?? null) ||
        (rule.day_of_week ?? null) !== (schedule.day_of_week ?? null) ||
        (rule.day_of_month ?? null) !== (schedule.day_of_month ?? null) ||
        (rule.month_of_year ?? null) !== (schedule.month_of_year ?? null)
    );
}

export function formValuesToInput(values: RecurringRuleFormValues, existing?: RecurringRule): RecurringRuleInput {
    const amount = dollarsToCents(values.amount);
    if (typeof amount !== "number") throw new Error(amount.message);

    const schedule = formValuesToSchedule(values);
    const nextRun = existing !== undefined && !hasScheduleChanged(existing, schedule) ? existing.next_run_at : nextRunAt(schedule);
    if (nextRun === null) throw new Error(formatMessage(messages.validation.recurringNextRunInvalid));

    return {
        account_id: values.accountId,
        category_id: values.categoryId === "" ? null : values.categoryId,
        merchant_id: values.merchantId === "" ? null : values.merchantId,
        kind: values.kind,
        amount_cents: amount,
        currency: "HKD",
        frequency: values.frequency,
        interval: schedule.interval,
        start_on: values.startOn,
        end_on: schedule.end_on,
        next_run_at: nextRun,
        day_of_week: schedule.day_of_week ?? null,
        day_of_month: schedule.day_of_month ?? null,
        month_of_year: schedule.month_of_year ?? null,
        status: values.status,
        note: values.note.trim() === "" ? null : values.note.trim(),
    };
}

export function recurringStatusLabel(status: RecurringStatus): string {
    if (status === "active") return formatMessage(messages.recurring.statusActive);
    if (status === "paused") return formatMessage(messages.recurring.statusPaused);
    return formatMessage(messages.recurring.statusEnded);
}

export function frequencyLabel(frequency: RecurringFrequency): string {
    if (frequency === "daily") return formatMessage(messages.recurring.frequencyDaily);
    if (frequency === "weekly") return formatMessage(messages.recurring.frequencyWeekly);
    if (frequency === "monthly") return formatMessage(messages.recurring.frequencyMonthly);
    return formatMessage(messages.recurring.frequencyYearly);
}

export const RECURRING_WEEKDAY_MESSAGES = [
    messages.recurring.weekdaySun,
    messages.recurring.weekdayMon,
    messages.recurring.weekdayTue,
    messages.recurring.weekdayWed,
    messages.recurring.weekdayThu,
    messages.recurring.weekdayFri,
    messages.recurring.weekdaySat,
] as const;

export function weekdayLabel(dayOfWeek: number): string {
    const descriptor = RECURRING_WEEKDAY_MESSAGES[dayOfWeek];
    return descriptor === undefined ? formatMessage(messages.recurring.onWeekday, {day: String(dayOfWeek)}) : formatMessage(descriptor);
}

/** 將頻率、間隔同相關日期欄位砌成一句可讀的排程描述。 */
export function describeRecurringSchedule(rule: Pick<RecurringRule, "frequency" | "interval" | "day_of_week" | "day_of_month" | "month_of_year">): string {
    const interval = rule.interval;
    const base =
        interval === 1
            ? frequencyLabel(rule.frequency)
            : rule.frequency === "daily"
              ? formatMessage(messages.recurring.everyNDays, {count: interval})
              : rule.frequency === "weekly"
                ? formatMessage(messages.recurring.everyNWeeks, {count: interval})
                : rule.frequency === "monthly"
                  ? formatMessage(messages.recurring.everyNMonths, {count: interval})
                  : formatMessage(messages.recurring.everyNYears, {count: interval});

    if (rule.frequency === "weekly" && rule.day_of_week != null) return `${base} ${weekdayLabel(rule.day_of_week)}`;
    if (rule.frequency === "monthly" && rule.day_of_month != null) return `${base} ${rule.day_of_month} 日`;
    if (rule.frequency === "yearly" && rule.month_of_year != null && rule.day_of_month != null) {
        return `${base} ${rule.month_of_year} 月 ${rule.day_of_month} 日`;
    }
    return base;
}
