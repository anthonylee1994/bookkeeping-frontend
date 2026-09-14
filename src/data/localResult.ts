import type {LocalError, LocalErrorCode, LocalResult} from "./types";

/** 未登入／token 失效時嘅統一文案，API layer 同 auth layer 共用。 */
export const UNAUTHORIZED_MESSAGE = "登入已失效，請重新登入";
/** 網絡或非預期錯誤嘅統一文案。 */
export const API_FAILURE_MESSAGE = "暫時無法連接服務";

/** Repository 只回 LocalResult、唔 throw；呢個 module 集中所有 result／error 建構，避免每個 repository 自己砌 object literal。 */
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

export function localUnauthorized<T>(message = UNAUTHORIZED_MESSAGE): LocalResult<T> {
    return localFailure<T>(localError("unauthorized", message));
}

export function localApiFailure<T>(message = API_FAILURE_MESSAGE): LocalResult<T> {
    return localFailure<T>(localError("api_failed", message));
}

export function localStorageFailure<T>(message = "無法讀取或儲存本機資料"): LocalResult<T> {
    return localFailure<T>(localError("storage_failed", message));
}
