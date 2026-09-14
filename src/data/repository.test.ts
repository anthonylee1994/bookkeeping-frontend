import {describe, expect, it} from "vitest";
import {PERSISTENCE_KEY} from "./persistence";
import type {StorageAdapter} from "./persistence";
import {openRepository} from "./repository";

function createMemoryStorage(): StorageAdapter {
    const values = new Map<string, string>();
    return {
        getItem(key) {
            return values.get(key) ?? null;
        },
        setItem(key, value) {
            values.set(key, value);
        },
    };
}

describe("LocalRepository", () => {
    const idempotencyKey = "60000000-0000-4000-8000-000000000001";

    it("seeds an empty store and reloads the saved snapshot", () => {
        const storage = createMemoryStorage();
        const first = openRepository({storage, now: new Date("2026-09-14T08:00:00Z")});
        expect(first.ok).toBe(true);
        if (!first.ok) {
            return;
        }

        const second = openRepository({storage, now: new Date("2030-01-01T00:00:00Z")});
        expect(second.ok).toBe(true);
        if (!second.ok) {
            return;
        }
        expect(second.value.getState()).toEqual(first.value.getState());
    });

    it("returns the original transaction for a repeated idempotency key", () => {
        const storage = createMemoryStorage();
        const opened = openRepository({storage, now: new Date("2026-09-14T08:00:00Z")});
        if (!opened.ok) {
            throw new Error(opened.error.message);
        }
        const [firstTransaction, secondTransaction] = opened.value.getState().transactions;

        expect(opened.value.rememberTransactionIdempotency(idempotencyKey, firstTransaction.id)).toEqual({ok: true, value: firstTransaction.id});
        expect(opened.value.rememberTransactionIdempotency(idempotencyKey, secondTransaction.id)).toEqual({ok: true, value: firstTransaction.id});
        expect(opened.value.getTransactionIdForIdempotencyKey(idempotencyKey)).toBe(firstTransaction.id);
        expect(storage.getItem(PERSISTENCE_KEY)).toContain(idempotencyKey);
    });

    it("does not commit memory state when persistence fails", () => {
        let writeCount = 0;
        const storage: StorageAdapter = {
            getItem() {
                return null;
            },
            setItem() {
                writeCount += 1;
                if (writeCount > 1) {
                    throw new DOMException("quota exceeded");
                }
            },
        };
        const opened = openRepository({storage, now: new Date("2026-09-14T08:00:00Z")});
        if (!opened.ok) {
            throw new Error(opened.error.message);
        }
        const transaction = opened.value.getState().transactions[0];

        expect(opened.value.rememberTransactionIdempotency(idempotencyKey, transaction.id)).toMatchObject({ok: false, error: {code: "storage_failed"}});
        expect(opened.value.getTransactionIdForIdempotencyKey(idempotencyKey)).toBeNull();
    });
});
