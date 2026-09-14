import {z} from "zod";
import {createFixtureState} from "./fixtures";
import {loadState, saveState} from "./persistence";
import type {RepositoryState, StorageAdapter} from "./persistence";
import type {LocalResult, UUID} from "./types";

const uuidSchema = z.string().uuid();

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
