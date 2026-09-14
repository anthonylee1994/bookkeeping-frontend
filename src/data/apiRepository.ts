import axios from "axios";
import type {AxiosRequestConfig} from "axios";
import type {ZodType} from "zod";
import {normalizeApiError} from "./apiError";
import {localApiFailure, localFailure, localSuccess, localUnauthorized} from "./localResult";
import type {LocalResult} from "./types";

/** 全 app 共用嘅 axios instance：baseURL、將來的 interceptors／timeout 都集中喺呢度。 */
export const apiClient = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL ?? ""}/api/v1`,
});

const INVALID_RESPONSE_MESSAGE = "服務回應格式無效";

/** Backend 所有成功回應都包喺 `{data: ...}`；分頁再加 `meta`，所以有 `meta` 就唔拆。 */
function unwrapEnvelope(body: unknown): unknown {
    if (body !== null && typeof body === "object" && "data" in body && !("meta" in body)) {
        return (body as {data: unknown}).data;
    }
    return body;
}

/** 加 Bearer token；token 係空白就回 null，由 caller 轉做 unauthorized。 */
function authorizedConfig(token: string, config: AxiosRequestConfig): AxiosRequestConfig | null {
    if (token.trim() === "") return null;
    return {...config, headers: {...config.headers, Authorization: `Bearer ${token}`}};
}

async function request<T>(config: AxiosRequestConfig, schema: ZodType<T>): Promise<LocalResult<T>> {
    try {
        const response = await apiClient.request(config);
        const parsed = schema.safeParse(unwrapEnvelope(response.data));
        return parsed.success ? localSuccess(parsed.data) : localApiFailure<T>(INVALID_RESPONSE_MESSAGE);
    } catch (error) {
        return localFailure<T>(normalizeApiError(error));
    }
}

export function publicApiRequest<T>(config: AxiosRequestConfig, schema: ZodType<T>): Promise<LocalResult<T>> {
    return request(config, schema);
}

export function apiRequest<T>(token: string, config: AxiosRequestConfig, schema: ZodType<T>): Promise<LocalResult<T>> {
    const authorized = authorizedConfig(token, config);
    if (authorized === null) return Promise.resolve(localUnauthorized<T>());
    return request(authorized, schema);
}

export async function apiDelete(token: string, path: string): Promise<LocalResult<true>> {
    const authorized = authorizedConfig(token, {method: "DELETE", url: path});
    if (authorized === null) return localUnauthorized<true>();
    try {
        await apiClient.request(authorized);
        return localSuccess(true);
    } catch (error) {
        return localFailure<true>(normalizeApiError(error));
    }
}
