import axios from "axios";
import type {AxiosError, AxiosRequestConfig} from "axios";
import type {ZodType} from "zod";
import type {LocalError, LocalResult} from "./types";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";

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

function normalizeApiError(error: unknown): LocalError {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const payload = errorPayload(axiosError);
    const serverMessage = typeof payload.message === "string" ? payload.message : undefined;
    const serverCode = typeof payload.code === "string" ? payload.code : undefined;

    if (status === 401 || status === 403) return {code: "unauthorized", message: "登入已失效，請重新登入"};
    if (status === 404) return {code: "not_found", message: serverMessage ?? "搵唔到指定資料"};
    if (status === 409 && (serverCode === "already_materialized" || serverCode === "conflict_already_materialized")) {
        return {code: "conflict_already_materialized", message: serverMessage ?? "今日已經產生過交易"};
    }
    if (status === 409) return {code: "in_use", message: serverMessage ?? "資料仍然被使用，暫時不可刪除"};
    if (status === 422 || status === 400) {
        return {code: "validation", message: serverMessage ?? "輸入資料無效", fields: stringFields(payload.fields ?? payload.errors)};
    }
    return {code: "api_failed", message: serverMessage ?? "暫時無法連接服務"};
}

function authorizedConfig(token: string, config: AxiosRequestConfig): AxiosRequestConfig | null {
    if (token.trim() === "") return null;
    return {
        ...config,
        baseURL: apiBaseUrl,
        headers: {...config.headers, Authorization: `Bearer ${token}`},
    };
}

export function localValidation<T>(message: string, fields?: LocalError["fields"]): LocalResult<T> {
    return {ok: false, error: {code: "validation", message, ...(fields === undefined ? {} : {fields})}};
}

export async function apiRequest<T>(token: string, config: AxiosRequestConfig, schema: ZodType<T>): Promise<LocalResult<T>> {
    const authorized = authorizedConfig(token, config);
    if (authorized === null) return {ok: false, error: {code: "unauthorized", message: "登入已失效，請重新登入"}};
    try {
        const response = await axios.request(authorized);
        const parsed = schema.safeParse(response.data);
        return parsed.success ? {ok: true, value: parsed.data} : {ok: false, error: {code: "api_failed", message: "服務回應格式無效"}};
    } catch (error) {
        return {ok: false, error: normalizeApiError(error)};
    }
}

export async function apiDelete(token: string, path: string): Promise<LocalResult<true>> {
    const authorized = authorizedConfig(token, {method: "DELETE", url: path});
    if (authorized === null) return {ok: false, error: {code: "unauthorized", message: "登入已失效，請重新登入"}};
    try {
        await axios.request(authorized);
        return {ok: true, value: true};
    } catch (error) {
        return {ok: false, error: normalizeApiError(error)};
    }
}
