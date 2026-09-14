import {z} from "zod";
import {apiRequest, localValidation} from "./apiRepository";
import {dashboardResponseSchema, summaryResponseSchema} from "./repositorySchemas";
import type {Dashboard, LocalResult, Summary, SummaryPeriod} from "./types";

const dateSchema = z.iso.date();

export class InsightsRepository {
    readonly #token: string;

    constructor(token: string) {
        this.#token = token;
    }

    async dashboard(date: string): Promise<LocalResult<Dashboard>> {
        if (!dateSchema.safeParse(date).success) return localValidation("Dashboard 日期無效");
        return apiRequest(this.#token, {method: "GET", url: "/api/v1/dashboard", params: {date}}, dashboardResponseSchema);
    }

    async summary(period: SummaryPeriod, date: string, page = 1, perPage = 25): Promise<LocalResult<Summary>> {
        if (!dateSchema.safeParse(date).success) return localValidation("報表日期無效");
        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(perPage) || perPage < 1 || perPage > 100) {
            return localValidation("頁碼必須大過 0，每頁數量必須係 1 至 100");
        }
        return apiRequest(this.#token, {method: "GET", url: `/api/v1/summaries/${period}`, params: {date, page, per_page: perPage}}, summaryResponseSchema);
    }
}
