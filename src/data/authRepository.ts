import {apiRequest, publicApiRequest} from "./apiRepository";
import {localApiFailure, localStorageFailure, localSuccess, localUnauthorized, localValidation} from "./localResult";
import {authResponseSchema, userResponseSchema} from "./repositorySchemas";
import {authInputSchema} from "./schema";
import type {AuthInput, AuthSession, LocalResult, User} from "./types";

export const AUTH_TOKEN_STORAGE_KEY = "bookkeeping.auth.token";
export const AUTH_FAILURE_MESSAGE = "登入資料無效";

export type AuthTokenStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const AUTH_INPUT_FIELDS = {username: "用戶名稱為必填", password: "密碼最少需要 8 個字元"};

function browserStorage(): AuthTokenStorage {
    return globalThis.localStorage;
}

function normalizeAuthResult<T>(result: LocalResult<T>): LocalResult<T> {
    if (result.ok) return result;
    if (result.error.code === "unauthorized") return localUnauthorized(AUTH_FAILURE_MESSAGE);
    if (result.error.code === "validation") return localValidation("請輸入有效登入資料");
    if (result.error.code === "api_failed") return localApiFailure("暫時無法連接登入服務");
    return result;
}

export function getStoredAuthToken(storage?: AuthTokenStorage): string | null {
    try {
        const token = (storage ?? browserStorage()).getItem(AUTH_TOKEN_STORAGE_KEY);
        return token === null || token.trim() === "" ? null : token;
    } catch {
        return null;
    }
}

export function storeAuthToken(token: string, storage?: AuthTokenStorage): LocalResult<true> {
    if (token.trim() === "") return localValidation("Token 無效");
    try {
        (storage ?? browserStorage()).setItem(AUTH_TOKEN_STORAGE_KEY, token);
        return localSuccess(true);
    } catch {
        return localStorageFailure("無法儲存登入資料");
    }
}

export function clearStoredAuthToken(storage?: AuthTokenStorage): void {
    try {
        (storage ?? browserStorage()).removeItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {
        // Logout still clears in-memory auth state when browser storage is unavailable.
    }
}

export class AuthRepository {
    readonly #storage: AuthTokenStorage | undefined;

    constructor(storage?: AuthTokenStorage) {
        this.#storage = storage;
    }

    async #requestSession(path: string, input: AuthInput): Promise<LocalResult<AuthSession>> {
        const response = normalizeAuthResult(await publicApiRequest({method: "POST", url: path, data: input}, authResponseSchema));
        if (!response.ok) return response;
        const stored = storeAuthToken(response.value.token, this.#storage);
        return stored.ok ? response : stored;
    }

    async register(input: AuthInput): Promise<LocalResult<AuthSession>> {
        const parsed = authInputSchema.safeParse(input);
        if (!parsed.success) return localValidation("請輸入有效登入資料", AUTH_INPUT_FIELDS);
        return this.#requestSession("/auth/register", parsed.data);
    }

    async login(input: AuthInput): Promise<LocalResult<AuthSession>> {
        const parsed = authInputSchema.safeParse(input);
        if (!parsed.success) return localUnauthorized(AUTH_FAILURE_MESSAGE);
        return this.#requestSession("/auth/login", parsed.data);
    }

    async getMe(token = getStoredAuthToken(this.#storage)): Promise<LocalResult<User>> {
        if (token === null || token.trim() === "") return localUnauthorized(AUTH_FAILURE_MESSAGE);
        return normalizeAuthResult(await apiRequest(token, {method: "GET", url: "/me"}, userResponseSchema));
    }

    logout(): void {
        clearStoredAuthToken(this.#storage);
    }
}
