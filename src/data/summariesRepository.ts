import {apiRequest} from "./apiRepository";
import {localValidation} from "./localResult";
import {summaryResponseSchema} from "./repositorySchemas";
import {dateSchema} from "./schema";
import type {LocalResult, Summary, SummaryPeriod} from "./types";

const MAX_PER_PAGE = 100;

export class SummariesRepository {
    readonly #token: string;

    constructor(token: string) {
        this.#token = token;
    }

    async get(period: SummaryPeriod, date: string, page = 1, perPage = 25): Promise<LocalResult<Summary>> {
        if (!dateSchema.safeParse(date).success) return localValidation("報表日期無效");
        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(perPage) || perPage < 1 || perPage > MAX_PER_PAGE) {
            return localValidation(`頁碼必須大過 0，每頁數量必須係 1 至 ${MAX_PER_PAGE}`);
        }
        return apiRequest(this.#token, {method: "GET", url: `/summaries/${period}`, params: {date, page, per_page: perPage}}, summaryResponseSchema);
    }
}
