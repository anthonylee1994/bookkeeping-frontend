import {apiDelete, apiRequest} from "./apiRepository";
import {localSuccess, localValidation} from "./localResult";
import {recurringRuleResponseSchema, recurringRulesResponseSchema, skipNextResponseSchema, transactionResponseSchema} from "./repositorySchemas";
import {recurringRuleInputSchema} from "./schema";
import type {LocalResult, RecurringRule, RecurringRuleInput, RecurringStatus, SkipNextResult, Transaction, UUID} from "./types";

function validateSchedule(input: RecurringRuleInput): LocalResult<true> {
    if (input.frequency === "weekly" && input.day_of_week === undefined) return localValidation("每週定期交易必須選擇星期", {day_of_week: "必填"});
    if ((input.frequency === "monthly" || input.frequency === "yearly") && input.day_of_month === undefined) {
        return localValidation("定期交易必須選擇日期", {day_of_month: "必填"});
    }
    if (input.frequency === "yearly" && input.month_of_year === undefined) return localValidation("每年定期交易必須選擇月份", {month_of_year: "必填"});
    return localSuccess(true);
}

function parseRecurringRuleInput(input: RecurringRuleInput): LocalResult<RecurringRuleInput> {
    const schedule = validateSchedule(input);
    if (!schedule.ok) return schedule;
    const parsed = recurringRuleInputSchema.safeParse({...input, currency: "HKD"});
    return parsed.success ? localSuccess(parsed.data) : localValidation("定期交易資料無效");
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

    async runNow(id: UUID): Promise<LocalResult<Transaction>> {
        return apiRequest(this.#token, {method: "POST", url: `/recurring_rules/${id}/run_now`}, transactionResponseSchema);
    }

    async skipNext(id: UUID): Promise<LocalResult<SkipNextResult>> {
        return apiRequest(this.#token, {method: "POST", url: `/recurring_rules/${id}/skip_next`}, skipNextResponseSchema);
    }
}
