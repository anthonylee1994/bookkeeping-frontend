import {formatMessage, messages} from "../lib/i18n";
import type {LocalError, LocalErrorCode, LocalResult} from "./types";

/** 未登入／token 失效時的統一文案，API layer 與 auth layer 共用。 */
export const UNAUTHORIZED_MESSAGE = formatMessage(messages.errors.unauthorized);
/** 網絡或非預期錯誤的統一文案。 */
export const API_FAILURE_MESSAGE = formatMessage(messages.errors.apiFailed);

/** Repository 只回 LocalResult、不 throw；此 module 集中所有 result／error 建構，避免每個 repository 自行組合 object literal。 */
export function localError(code: LocalErrorCode, message: string, fields?: LocalError["fields"]): LocalError {
    return fields === undefined ? {code, message} : {code, message, fields};
}

export function localSuccess<T>(value: T): LocalResult<T> {
    return {ok: true, value};
}

export function localFailure<T>(error: LocalError): LocalResult<T> {
    return {ok: false, error};
}

export function localValidation<T>(message: string, fields?: LocalError["fields"]): LocalResult<T> {
    return localFailure<T>(localError("validation", message, fields));
}

export function localUnauthorized<T>(message: string = UNAUTHORIZED_MESSAGE): LocalResult<T> {
    return localFailure<T>(localError("unauthorized", message));
}

export function localApiFailure<T>(message: string = API_FAILURE_MESSAGE): LocalResult<T> {
    return localFailure<T>(localError("api_failed", message));
}

export function localStorageFailure<T>(message: string = formatMessage(messages.errors.storageFailed)): LocalResult<T> {
    return localFailure<T>(localError("storage_failed", message));
}
