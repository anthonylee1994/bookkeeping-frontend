import {formatMessage, messages} from "../lib/i18n";
import {apiRequest, publicApiRequest} from "./apiRepository";
import {localApiFailure, localStorageFailure, localSuccess, localUnauthorized, localValidation} from "./localResult";
import {authResponseSchema, userResponseSchema} from "./repositorySchemas";
import {authInputSchema} from "./schema";
import type {AuthInput, AuthSession, LocalResult, User} from "./types";

export const AUTH_TOKEN_STORAGE_KEY = "bookkeeping.auth.token";
export const AUTH_FAILURE_MESSAGE = formatMessage(messages.auth.genericFailure);

export type AuthTokenStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const AUTH_INPUT_FIELDS = {username: formatMessage(messages.fields.usernameRequired), password: formatMessage(messages.fields.passwordTooShort)};

function browserStorage(): AuthTokenStorage {
    return globalThis.localStorage;
}

function normalizeAuthResult<T>(result: LocalResult<T>): LocalResult<T> {
    if (result.ok) return result;
    if (result.error.code === "unauthorized") return localUnauthorized(AUTH_FAILURE_MESSAGE);
    if (result.error.code === "validation") return localValidation(formatMessage(messages.validation.loginInvalid));
    if (result.error.code === "api_failed") return localApiFailure(formatMessage(messages.errors.apiFailedLogin));
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
    if (token.trim() === "") return localValidation(formatMessage(messages.validation.tokenInvalid));
    try {
        (storage ?? browserStorage()).setItem(AUTH_TOKEN_STORAGE_KEY, token);
        return localSuccess(true);
    } catch {
        return localStorageFailure(formatMessage(messages.validation.authStorageFailed));
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
        if (!parsed.success) return localValidation(formatMessage(messages.validation.loginInvalid), AUTH_INPUT_FIELDS);
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
