import {z} from "zod";
import axios from "axios";
import type {AxiosError} from "axios";
import {createFixtureState} from "./fixtures";
import {loadState, saveState} from "./persistence";
import {authInputSchema} from "./schema";
import type {RepositoryState, StorageAdapter} from "./persistence";
import type {AuthInput, AuthSession, LocalResult, User, UUID} from "./types";

const uuidSchema = z.string().uuid();
export const AUTH_FAILURE_MESSAGE = "登入資料無效";
const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";
const authResponseSchema = z.object({
    token: z.string().min(1).optional(),
    access_token: z.string().min(1).optional(),
    user: z.object({id: z.string().uuid(), username: z.string().min(1), created_at: z.string()}).optional(),
});

function normalizeAuthError(error: unknown): LocalResult<never> {
    const status = (error as AxiosError).response?.status;
    if (status === 401) {
        return {ok: false, error: {code: "unauthorized", message: AUTH_FAILURE_MESSAGE}};
    }
    if (status === 422) {
        return {ok: false, error: {code: "validation", message: "請輸入有效登入資料"}};
    }
    return {ok: false, error: {code: "api_failed", message: "暫時無法連接登入服務"}};
}

async function requestAuthSession(path: string, input: AuthInput): Promise<LocalResult<AuthSession>> {
    try {
        const response = await axios.post(`${apiBaseUrl}${path}`, input);
        const parsed = authResponseSchema.safeParse(response.data);
        if (!parsed.success || parsed.data.user === undefined || (parsed.data.token === undefined && parsed.data.access_token === undefined)) {
            return {ok: false, error: {code: "api_failed", message: "登入回應格式無效"}};
        }
        return {ok: true, value: {token: parsed.data.token ?? parsed.data.access_token ?? "", user: parsed.data.user}};
    } catch (error) {
        return normalizeAuthError(error);
    }
}

export type RepositoryOptions = {
    storage?: StorageAdapter;
    now?: Date;
};

export class LocalRepository {
    readonly #storage: StorageAdapter | undefined;
    #state: RepositoryState;

    private constructor(state: RepositoryState, storage?: StorageAdapter) {
        this.#state = state;
        this.#storage = storage;
    }

    static open(options: RepositoryOptions = {}): LocalResult<LocalRepository> {
        const loaded = loadState(options.storage);
        if (!loaded.ok) {
            return loaded;
        }

        if (loaded.value !== null) {
            return {ok: true, value: new LocalRepository(loaded.value, options.storage)};
        }

        const fixtures = createFixtureState(options.now);
        const saved = saveState(fixtures, options.storage);
        if (!saved.ok) {
            return saved;
        }
        return {ok: true, value: new LocalRepository(fixtures, options.storage)};
    }

    getState(): RepositoryState {
        return structuredClone(this.#state);
    }

    async register(input: AuthInput): Promise<LocalResult<AuthSession>> {
        const parsed = authInputSchema.safeParse(input);
        if (!parsed.success) {
            return {ok: false, error: {code: "validation", message: "請輸入有效登入資料", fields: {username: "用戶名稱為必填", password: "密碼最少需要 8 個字元"}}};
        }
        return requestAuthSession("/api/v1/auth/register", parsed.data);
    }

    async login(input: AuthInput): Promise<LocalResult<AuthSession>> {
        const parsed = authInputSchema.safeParse(input);
        if (!parsed.success) {
            return {ok: false, error: {code: "unauthorized", message: AUTH_FAILURE_MESSAGE}};
        }
        return requestAuthSession("/api/v1/auth/login", parsed.data);
    }

    async getMe(token: string): Promise<LocalResult<User>> {
        if (token.trim() === "") {
            return {ok: false, error: {code: "unauthorized", message: AUTH_FAILURE_MESSAGE}};
        }
        try {
            const response = await axios.get(`${apiBaseUrl}/api/v1/me`, {headers: {Authorization: `Bearer ${token}`}});
            const userSchema = z.object({id: z.string().uuid(), username: z.string().min(1), created_at: z.string()});
            const payload = z.union([userSchema, z.object({user: userSchema}).transform(value => value.user)]).safeParse(response.data);
            return payload.success ? {ok: true, value: payload.data} : {ok: false, error: {code: "api_failed", message: "登入回應格式無效"}};
        } catch (error) {
            return normalizeAuthError(error);
        }
    }

    getTransactionIdForIdempotencyKey(key: string): UUID | null {
        return this.#state.idempotencyKeys[key] ?? null;
    }

    rememberTransactionIdempotency(key: string, transactionId: UUID): LocalResult<UUID> {
        if (!uuidSchema.safeParse(key).success || !this.#state.transactions.some(transaction => transaction.id === transactionId)) {
            return {ok: false, error: {code: "validation", message: "Idempotency key 或交易 ID 無效"}};
        }

        const existing = this.#state.idempotencyKeys[key];
        if (existing !== undefined) {
            return {ok: true, value: existing};
        }

        const nextState = structuredClone(this.#state);
        nextState.idempotencyKeys[key] = transactionId;
        const saved = saveState(nextState, this.#storage);
        if (!saved.ok) {
            return saved;
        }
        this.#state = nextState;
        return {ok: true, value: transactionId};
    }
}

export function openRepository(options: RepositoryOptions = {}): LocalResult<LocalRepository> {
    return LocalRepository.open(options);
}
