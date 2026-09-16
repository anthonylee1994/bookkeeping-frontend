import {formatMessage, messages} from "../lib/i18n";
import {apiRequest, publicApiRequest} from "./apiRepository";
import {localStorageFailure, localSuccess, localUnauthorized, localValidation} from "./localResult";
import {authResponseSchema, userResponseSchema} from "./repositorySchemas";
import {authInputSchema, changePasswordInputSchema} from "./schema";
import type {AuthInput, AuthSession, ChangePasswordInput, LocalResult, User} from "./types";

export const AUTH_TOKEN_STORAGE_KEY = "bookkeeping.auth.token";
export const AUTH_FAILURE_MESSAGE = formatMessage(messages.auth.genericFailure);

export type AuthTokenStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const AUTH_INPUT_FIELDS = {username: formatMessage(messages.fields.usernameRequired), password: formatMessage(messages.fields.passwordTooShort)};

function browserStorage(): AuthTokenStorage {
    return globalThis.localStorage;
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
        const response = await publicApiRequest({method: "POST", url: path, data: input}, authResponseSchema);
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
        return apiRequest(token, {method: "GET", url: "/me"}, userResponseSchema);
    }

    async changePassword(input: ChangePasswordInput): Promise<LocalResult<User>> {
        const parsed = changePasswordInputSchema.safeParse(input);
        if (!parsed.success) return localValidation(formatMessage(messages.validation.changePasswordInvalid));
        return apiRequest(getStoredAuthToken(this.#storage) ?? "", {method: "PATCH", url: "/me/password", data: parsed.data}, userResponseSchema);
    }

    logout(): void {
        clearStoredAuthToken(this.#storage);
    }
}
