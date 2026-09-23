import {apiRequest} from "./apiRepository";
import {localValidation} from "./localResult";
import {summaryInsightResponseSchema, summaryResponseSchema} from "./repositorySchemas";
import {dateSchema} from "./schema";
import {formatMessage, messages} from "../lib/i18n";
import type {LocalResult, Summary, SummaryInsight, SummaryPeriod} from "./types";

const MAX_PER_PAGE = 100;

export class SummariesRepository {
    readonly #token: string;

    constructor(token: string) {
        this.#token = token;
    }

    async get(period: SummaryPeriod, date: string, page = 1, perPage = 25): Promise<LocalResult<Summary>> {
        if (!dateSchema.safeParse(date).success) return localValidation(formatMessage(messages.validation.reportDateInvalid));
        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(perPage) || perPage < 1 || perPage > MAX_PER_PAGE) {
            return localValidation(formatMessage(messages.validation.paginationInvalid, {maxPerPage: MAX_PER_PAGE}));
        }
        return apiRequest(this.#token, {method: "GET", url: `/summaries/${period}`, params: {date, page, per_page: perPage}}, summaryResponseSchema);
    }

    /**
     * AI 收支概況。後端以數據指紋做 cache，所以正常讀取唔需要特別參數；
     * `refresh` 只喺用戶按「重試」（上次失敗）時用，強制繞過 cache 重算。
     */
    async getInsight(period: SummaryPeriod, date: string, refresh = false): Promise<LocalResult<SummaryInsight>> {
        if (!dateSchema.safeParse(date).success) return localValidation(formatMessage(messages.validation.reportDateInvalid));
        const params = refresh ? {date, refresh: 1} : {date};
        return apiRequest(this.#token, {method: "GET", url: `/summaries/${period}/insight`, params}, summaryInsightResponseSchema);
    }
}
