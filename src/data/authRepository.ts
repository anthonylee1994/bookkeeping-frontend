import axios from "axios";
import type {AxiosError} from "axios";
import {z} from "zod";
import {authInputSchema, userSchema} from "./schema";
import type {AuthInput, AuthSession, LocalResult, User} from "./types";

export const AUTH_TOKEN_STORAGE_KEY = "bookkeeping.auth.token";
export const AUTH_FAILURE_MESSAGE = "登入資料無效";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";
const authResponseSchema = z
    .object({
        token: z.string().min(1).optional(),
        access_token: z.string().min(1).optional(),
        user: userSchema,
    })
    .transform(value => ({token: value.token ?? value.access_token, user: value.user}))
    .refine((value): value is AuthSession => value.token !== undefined, {message: "Token is required"});

export type AuthTokenStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserStorage(): AuthTokenStorage {
    return globalThis.localStorage;
}

function normalizeAuthError(error: unknown): LocalResult<never> {
    const status = (error as AxiosError).response?.status;
    if (status === 401) return {ok: false, error: {code: "unauthorized", message: AUTH_FAILURE_MESSAGE}};
    if (status === 422 || status === 400) return {ok: false, error: {code: "validation", message: "請輸入有效登入資料"}};
    return {ok: false, error: {code: "api_failed", message: "暫時無法連接登入服務"}};
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
        try {
            const response = await axios.post(`${apiBaseUrl}${path}`, input);
            const parsed = authResponseSchema.safeParse(response.data);
            if (!parsed.success) return {ok: false, error: {code: "api_failed", message: "登入回應格式無效"}};
            const stored = storeAuthToken(parsed.data.token, this.#storage);
            return stored.ok ? {ok: true, value: parsed.data} : stored;
        } catch (error) {
            return normalizeAuthError(error);
        }
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
        try {
            const response = await axios.get(`${apiBaseUrl}/api/v1/me`, {headers: {Authorization: `Bearer ${token}`}});
            const payload = z.union([userSchema, z.object({user: userSchema}).transform(value => value.user)]).safeParse(response.data);
            return payload.success ? {ok: true, value: payload.data} : {ok: false, error: {code: "api_failed", message: "登入回應格式無效"}};
        } catch (error) {
            return normalizeAuthError(error);
        }
    }

    logout(): void {
        clearStoredAuthToken(this.#storage);
    }
}
