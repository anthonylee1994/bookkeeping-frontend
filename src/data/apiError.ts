import type {AxiosError} from "axios";
import {formatMessage, messages} from "../lib/i18n";
import {API_FAILURE_MESSAGE, UNAUTHORIZED_MESSAGE, localError} from "./localResult";
import type {LocalError, LocalErrorCode} from "./types";

type ErrorPayload = {
    code?: unknown;
    message?: unknown;
    details?: unknown;
    fields?: unknown;
    errors?: unknown;
};

/** Backend `code` → 前端 `LocalErrorCode`。 */
const SERVER_CODE_MAP: Record<string, LocalErrorCode> = {
    unauthorized: "unauthorized",
    invalid_credentials: "unauthorized",
    not_found: "not_found",
    validation_error: "validation",
    account_in_use: "in_use",
    already_materialized: "conflict_already_materialized",
    conflict_already_materialized: "conflict_already_materialized",
    idempotency_conflict: "conflict",
    upstream_error: "api_failed",
};

const FALLBACK_MESSAGE: Record<LocalErrorCode, string> = {
    validation: formatMessage(messages.errors.validation),
    unauthorized: UNAUTHORIZED_MESSAGE,
    not_found: formatMessage(messages.errors.notFound),
    conflict: formatMessage(messages.errors.conflict),
    conflict_already_materialized: formatMessage(messages.errors.conflictAlreadyMaterialized),
    in_use: formatMessage(messages.errors.inUse),
    storage_failed: formatMessage(messages.errors.storageFailed),
    api_failed: API_FAILURE_MESSAGE,
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

/** Backend 錯誤格式為 `{error: {code, message, details?}}`；同時兼容 flat body。 */
function errorPayload(error: AxiosError): ErrorPayload {
    const data = error.response?.data;
    if (!isRecord(data)) return {};
    return isRecord(data.error) ? data.error : data;
}

function codeFromStatus(status: number | undefined): LocalErrorCode {
    if (status === 401 || status === 403) return "unauthorized";
    if (status === 404) return "not_found";
    if (status === 409) return "in_use";
    if (status === 422 || status === 400) return "validation";
    return "api_failed";
}

/** 將 axios error 收窄成 UI 可處理的 `LocalError`，優先採用 backend 的 code／message／details。 */
export function normalizeApiError(error: unknown): LocalError {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const payload = errorPayload(axiosError);
    const serverCode = typeof payload.code === "string" ? payload.code : undefined;
    const serverMessage = typeof payload.message === "string" ? payload.message : undefined;
    const fields = stringFields(payload.details ?? payload.fields ?? payload.errors);

    const code = (serverCode === undefined ? undefined : SERVER_CODE_MAP[serverCode]) ?? codeFromStatus(status);
    return localError(code, serverMessage ?? FALLBACK_MESSAGE[code], fields);
}
