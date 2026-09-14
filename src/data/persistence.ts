import {z} from "zod";
import {accountSchema, categorySchema, merchantSchema, recurringRuleSchema, transactionSchema} from "./schema";
import type {LocalError, LocalResult} from "./types";

export const PERSISTENCE_KEY = "bookkeeping.v1";
export const PERSISTENCE_VERSION = 1;

export type StorageAdapter = Pick<Storage, "getItem" | "setItem">;

export const repositoryStateSchema = z.object({
    version: z.literal(PERSISTENCE_VERSION),
    accounts: z.array(accountSchema).default([]),
    categories: z.array(categorySchema).default([]),
    merchants: z.array(merchantSchema).default([]),
    transactions: z.array(transactionSchema).default([]),
    recurringRules: z.array(recurringRuleSchema).default([]),
    idempotencyKeys: z.record(z.string().uuid(), z.string().uuid()).default({}),
});

export type RepositoryState = z.infer<typeof repositoryStateSchema>;

function storageError(message: string): LocalError {
    return {code: "storage_failed", message};
}

function browserStorage(): StorageAdapter {
    return globalThis.localStorage;
}

export function loadState(storage?: StorageAdapter): LocalResult<RepositoryState | null> {
    try {
        const serialized = (storage ?? browserStorage()).getItem(PERSISTENCE_KEY);
        if (serialized === null) {
            return {ok: true, value: null};
        }

        const state = repositoryStateSchema.safeParse(JSON.parse(serialized));
        if (!state.success) {
            return {ok: false, error: storageError("已儲存嘅本地資料格式無效")};
        }
        return {ok: true, value: state.data};
    } catch {
        return {ok: false, error: storageError("無法讀取本地資料")};
    }
}

export function saveState(state: RepositoryState, storage?: StorageAdapter): LocalResult<true> {
    const validated = repositoryStateSchema.safeParse(state);
    if (!validated.success) {
        return {ok: false, error: storageError("無法儲存格式無效嘅本地資料")};
    }

    try {
        (storage ?? browserStorage()).setItem(PERSISTENCE_KEY, JSON.stringify(validated.data));
        return {ok: true, value: true};
    } catch {
        return {ok: false, error: storageError("無法儲存本地資料")};
    }
}
