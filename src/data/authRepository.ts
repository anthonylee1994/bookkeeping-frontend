import {z} from "zod";
import {apiRequest, publicApiRequest} from "./apiRepository";
import {authInputSchema, userSchema} from "./schema";
import type {AuthInput, AuthSession, LocalResult, User} from "./types";

export const AUTH_TOKEN_STORAGE_KEY = "bookkeeping.auth.token";
export const AUTH_FAILURE_MESSAGE = "登入資料無效";

const authResponseSchema = z
    .object({
        token: z.string().min(1).optional(),
        access_token: z.string().min(1).optional(),
        user: userSchema,
    })
    .transform(value => ({token: value.token ?? value.access_token, user: value.user}))
    .refine((value): value is AuthSession => value.token !== undefined, {message: "Token is required"});
const userResponseSchema = z.union([userSchema, z.object({user: userSchema}).transform(value => value.user)]);

export type AuthTokenStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserStorage(): AuthTokenStorage {
    return globalThis.localStorage;
}

function normalizeAuthResult<T>(result: LocalResult<T>): LocalResult<T> {
    if (result.ok) return result;
    if (result.error.code === "unauthorized") return {ok: false, error: {code: "unauthorized", message: AUTH_FAILURE_MESSAGE}};
    if (result.error.code === "validation") return {ok: false, error: {code: "validation", message: "請輸入有效登入資料"}};
    if (result.error.code === "api_failed") return {ok: false, error: {code: "api_failed", message: "暫時無法連接登入服務"}};
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
    if (token.trim() === "") return {ok: false, error: {code: "validation", message: "Token 無效"}};
    try {
        (storage ?? browserStorage()).setItem(AUTH_TOKEN_STORAGE_KEY, token);
        return {ok: true, value: true};
    } catch {
        return {ok: false, error: {code: "storage_failed", message: "無法儲存登入資料"}};
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
        if (!parsed.success) {
            return {ok: false, error: {code: "validation", message: "請輸入有效登入資料", fields: {username: "用戶名稱為必填", password: "密碼最少需要 8 個字元"}}};
        }
        return this.#requestSession("/api/v1/auth/register", parsed.data);
    }

    async login(input: AuthInput): Promise<LocalResult<AuthSession>> {
        const parsed = authInputSchema.safeParse(input);
        if (!parsed.success) return {ok: false, error: {code: "unauthorized", message: AUTH_FAILURE_MESSAGE}};
        return this.#requestSession("/api/v1/auth/login", parsed.data);
    }

    async getMe(token = getStoredAuthToken(this.#storage)): Promise<LocalResult<User>> {
        if (token === null || token.trim() === "") return {ok: false, error: {code: "unauthorized", message: AUTH_FAILURE_MESSAGE}};
        return normalizeAuthResult(await apiRequest(token, {method: "GET", url: "/api/v1/me"}, userResponseSchema));
    }

    logout(): void {
        clearStoredAuthToken(this.#storage);
    }
}
