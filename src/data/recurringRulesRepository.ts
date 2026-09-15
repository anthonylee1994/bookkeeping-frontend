import {apiDelete, apiRequest} from "./apiRepository";
import {localSuccess, localValidation} from "./localResult";
import {recurringRuleResponseSchema, recurringRulesResponseSchema, transactionRowResponseSchema} from "./repositorySchemas";
import {recurringRuleInputSchema} from "./schema";
import {formatMessage, messages} from "../lib/i18n";
import type {LocalResult, RecurringRule, RecurringRuleInput, RecurringStatus, TransactionRow, UUID} from "./types";

function validateSchedule(input: RecurringRuleInput): LocalResult<true> {
    if (input.frequency === "weekly" && input.day_of_week == null)
        return localValidation(formatMessage(messages.validation.weeklyNeedsDayOfWeek), {day_of_week: formatMessage(messages.fields.required)});
    if ((input.frequency === "monthly" || input.frequency === "yearly") && input.day_of_month == null) {
        return localValidation(formatMessage(messages.validation.monthlyNeedsDayOfMonth), {day_of_month: formatMessage(messages.fields.required)});
    }
    if (input.frequency === "yearly" && input.month_of_year == null)
        return localValidation(formatMessage(messages.validation.yearlyNeedsMonthOfYear), {month_of_year: formatMessage(messages.fields.required)});
    return localSuccess(true);
}

function parseRecurringRuleInput(input: RecurringRuleInput): LocalResult<RecurringRuleInput> {
    const schedule = validateSchedule(input);
    if (!schedule.ok) return schedule;
    const parsed = recurringRuleInputSchema.safeParse({...input, currency: "HKD"});
    return parsed.success ? localSuccess(parsed.data) : localValidation(formatMessage(messages.validation.recurringInvalid));
}

export class RecurringRulesRepository {
    readonly #token: string;

    constructor(token: string) {
        this.#token = token;
    }

    async list(status?: RecurringStatus): Promise<LocalResult<RecurringRule[]>> {
        return apiRequest(this.#token, {method: "GET", url: "/recurring_rules", params: status === undefined ? undefined : {status}}, recurringRulesResponseSchema);
    }

    async create(input: RecurringRuleInput): Promise<LocalResult<RecurringRule>> {
        const parsed = parseRecurringRuleInput(input);
        if (!parsed.ok) return parsed;
        return apiRequest(this.#token, {method: "POST", url: "/recurring_rules", data: parsed.value}, recurringRuleResponseSchema);
    }

    async update(id: UUID, input: RecurringRuleInput): Promise<LocalResult<RecurringRule>> {
        const parsed = parseRecurringRuleInput(input);
        if (!parsed.ok) return parsed;
        return apiRequest(this.#token, {method: "PATCH", url: `/recurring_rules/${id}`, data: parsed.value}, recurringRuleResponseSchema);
    }

    async delete(id: UUID): Promise<LocalResult<true>> {
        return apiDelete(this.#token, `/recurring_rules/${id}`);
    }

    async pause(id: UUID): Promise<LocalResult<RecurringRule>> {
        return apiRequest(this.#token, {method: "POST", url: `/recurring_rules/${id}/pause`}, recurringRuleResponseSchema);
    }

    async resume(id: UUID): Promise<LocalResult<RecurringRule>> {
        return apiRequest(this.#token, {method: "POST", url: `/recurring_rules/${id}/resume`}, recurringRuleResponseSchema);
    }

    async runNow(id: UUID): Promise<LocalResult<TransactionRow>> {
        return apiRequest(this.#token, {method: "POST", url: `/recurring_rules/${id}/run_now`}, transactionRowResponseSchema);
    }

    async skipNext(id: UUID): Promise<LocalResult<RecurringRule>> {
        return apiRequest(this.#token, {method: "POST", url: `/recurring_rules/${id}/skip_next`}, recurringRuleResponseSchema);
    }
}
