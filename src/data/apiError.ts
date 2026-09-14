import type {AxiosError} from "axios";
import {API_FAILURE_MESSAGE, UNAUTHORIZED_MESSAGE, localError} from "./localResult";
import type {LocalError} from "./types";

type ErrorPayload = {
    code?: unknown;
    message?: unknown;
    fields?: unknown;
    errors?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringFields(value: unknown): LocalError["fields"] | undefined {
    if (!isRecord(value)) return undefined;
    const entries = Object.entries(value).filter((entry): entry is [string, string | string[]] => {
        const field = entry[1];
        return typeof field === "string" || (Array.isArray(field) && field.every(item => typeof item === "string"));
    });
    return entries.length === 0 ? undefined : Object.fromEntries(entries);
}

function errorPayload(error: AxiosError): ErrorPayload {
    return isRecord(error.response?.data) ? error.response.data : {};
}

/** 將 axios error 收窄成 UI 識處理嘅 LocalError；唔會 leak 原始 response body。 */
export function normalizeApiError(error: unknown): LocalError {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const payload = errorPayload(axiosError);
    const serverMessage = typeof payload.message === "string" ? payload.message : undefined;
    const serverCode = typeof payload.code === "string" ? payload.code : undefined;

    if (status === 401 || status === 403) return localError("unauthorized", UNAUTHORIZED_MESSAGE);
    if (status === 404) return localError("not_found", serverMessage ?? "搵唔到指定資料");
    if (status === 409 && (serverCode === "already_materialized" || serverCode === "conflict_already_materialized")) {
        return localError("conflict_already_materialized", serverMessage ?? "今日已經產生過交易");
    }
    if (status === 409) return localError("in_use", serverMessage ?? "資料仍然被使用，暫時不可刪除");
    if (status === 422 || status === 400) return localError("validation", serverMessage ?? "輸入資料無效", stringFields(payload.fields ?? payload.errors));
    return localError("api_failed", serverMessage ?? API_FAILURE_MESSAGE);
}
