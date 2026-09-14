import {describe, expect, it} from "vitest";
import {createFixtureState} from "./fixtures";
import {loadState, PERSISTENCE_KEY, saveState} from "./persistence";
import type {StorageAdapter} from "./persistence";

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

describe("local persistence", () => {
    it("returns null when no state has been saved", () => {
        expect(loadState(createMemoryStorage())).toEqual({ok: true, value: null});
    });

    it("round-trips a validated repository state", () => {
        const storage = createMemoryStorage();
        const state = createFixtureState(new Date("2026-09-14T08:00:00Z"));

        expect(saveState(state, storage)).toEqual({ok: true, value: true});
        expect(loadState(storage)).toEqual({ok: true, value: state});
    });

    it("normalizes malformed and inaccessible storage as storage_failed", () => {
        const malformed: StorageAdapter = {
            getItem() {
                return "not-json";
            },
            setItem() {},
        };
        const inaccessible: StorageAdapter = {
            getItem() {
                throw new DOMException("blocked");
            },
            setItem() {
                throw new DOMException("quota exceeded");
            },
        };

        expect(loadState(malformed)).toMatchObject({ok: false, error: {code: "storage_failed"}});
        expect(loadState(inaccessible)).toMatchObject({ok: false, error: {code: "storage_failed"}});
        expect(saveState(createFixtureState(), inaccessible)).toMatchObject({ok: false, error: {code: "storage_failed"}});
    });

    it("uses the versioned persistence key", () => {
        expect(PERSISTENCE_KEY).toBe("bookkeeping.v1");
    });
});
