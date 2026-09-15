import {apiRequest} from "./apiRepository";
import {localValidation} from "./localResult";
import {dashboardResponseSchema} from "./repositorySchemas";
import {dateSchema} from "./schema";
import {formatMessage, messages} from "../lib/i18n";
import type {Dashboard, LocalResult} from "./types";

export class DashboardRepository {
    readonly #token: string;

    constructor(token: string) {
        this.#token = token;
    }

    async get(date: string): Promise<LocalResult<Dashboard>> {
        if (!dateSchema.safeParse(date).success) return localValidation(formatMessage(messages.validation.dashboardDateInvalid));
        return apiRequest(this.#token, {method: "GET", url: "/dashboard", params: {date}}, dashboardResponseSchema);
    }
}
