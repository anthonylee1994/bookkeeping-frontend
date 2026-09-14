import {apiRequest} from "./apiRepository";
import {localValidation} from "./localResult";
import {dashboardResponseSchema} from "./repositorySchemas";
import {dateSchema} from "./schema";
import type {Dashboard, LocalResult} from "./types";

export class DashboardRepository {
    readonly #token: string;

    constructor(token: string) {
        this.#token = token;
    }

    async get(date: string): Promise<LocalResult<Dashboard>> {
        if (!dateSchema.safeParse(date).success) return localValidation("Dashboard 日期無效");
        return apiRequest(this.#token, {method: "GET", url: "/dashboard", params: {date}}, dashboardResponseSchema);
    }
}
