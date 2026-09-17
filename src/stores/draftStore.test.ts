// @vitest-environment jsdom

import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {TransactionDraft, User} from "../data/types";
import {useAuthStore} from "./authStore";
import {DRAFT_STORAGE_KEY, useDraftStore} from "./draftStore";

const user: User = {
    id: "70000000-0000-4000-8000-000000000001",
    username: "Anthony",
    timezone: "Asia/Hong_Kong",
    currency: "HKD",
};

function buildDraft(overrides: Partial<TransactionDraft> = {}): TransactionDraft {
    return {
        kind: "expense",
        amount: "12.50",
        account_id: "10000000-0000-4000-8000-000000000001",
        transfer_account_id: null,
        category_id: "20000000-0000-4000-8000-000000000002",
        merchant_id: null,
        merchant_name: "",
        occurred_at: "2026-09-14T08:00:00+08:00",
        payment_method: "",
        note: "",
        image_urls: [],
        ...overrides,
    };
}

function persistedDraft(): Record<string, unknown> {
    return JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY) ?? "{}") as Record<string, unknown>;
}

beforeEach(() => {
    useDraftStore.setState({transactionDraft: null});
    sessionStorage.clear();
    useAuthStore.getState().clearSession();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("draft store", () => {
    it("starts with no draft", () => {
        expect(useDraftStore.getState()).toMatchObject({transactionDraft: null});
    });

    it("keeps a transaction draft", () => {
        const draft = buildDraft();
        useDraftStore.getState().setTransactionDraft(draft);

        expect(useDraftStore.getState().transactionDraft).toEqual(draft);
    });

    it("persists only the serializable draft fields", () => {
        const draft = buildDraft({image_urls: ["https://cdn.example/receipt.jpg"]});
        useDraftStore.getState().setTransactionDraft(draft);

        const saved = persistedDraft().state as {transactionDraft: TransactionDraft};
        expect(saved.transactionDraft).toEqual(draft);
    });

    it("never writes File, Blob or object URL into sessionStorage", () => {
        useDraftStore.getState().setTransactionDraft(buildDraft({image_urls: ["blob:http://localhost/preview-1"]}));

        const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY) ?? "";
        expect(raw).not.toContain("blob:");
        expect(raw).not.toContain("File");

        const saved = persistedDraft().state as {transactionDraft: {image_urls: string[]}};
        expect(saved.transactionDraft.image_urls).toEqual([]);

        expect(useDraftStore.getState().transactionDraft?.image_urls).toEqual(["blob:http://localhost/preview-1"]);
    });

    it("revokes object URLs and clears drafts on reset", () => {
        const revoke = vi.fn();
        Object.defineProperty(URL, "revokeObjectURL", {configurable: true, writable: true, value: revoke});
        useDraftStore.getState().setTransactionDraft(buildDraft({image_urls: ["blob:http://localhost/preview-1", "https://cdn.example/receipt.jpg"]}));

        useDraftStore.getState().resetDrafts();

        expect(revoke).toHaveBeenCalledWith("blob:http://localhost/preview-1");
        expect(revoke).not.toHaveBeenCalledWith("https://cdn.example/receipt.jpg");
        expect(useDraftStore.getState()).toMatchObject({transactionDraft: null});
    });

    it("clears auth session, drafts and image previews on logout cleanup", () => {
        const revoke = vi.fn();
        Object.defineProperty(URL, "revokeObjectURL", {configurable: true, writable: true, value: revoke});
        useAuthStore.getState().setSession("opaque.api.token", user);
        useDraftStore.getState().setTransactionDraft(buildDraft({image_urls: ["blob:http://localhost/preview"]}));

        useAuthStore.getState().clearSession();
        useDraftStore.getState().resetDrafts();

        expect(useAuthStore.getState()).toMatchObject({token: null, user: null});
        expect(useDraftStore.getState()).toMatchObject({transactionDraft: null});
        expect(revoke).toHaveBeenCalledWith("blob:http://localhost/preview");
    });
});
