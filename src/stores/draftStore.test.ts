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
    useDraftStore.setState({transactionDraft: null, aiScan: null});
    sessionStorage.clear();
    useAuthStore.getState().clearSession();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("draft store", () => {
    it("starts with no draft", () => {
        expect(useDraftStore.getState()).toMatchObject({transactionDraft: null, aiScan: null});
    });

    it("keeps a transaction draft and an ai scan draft", () => {
        const draft = buildDraft();
        useDraftStore.getState().setTransactionDraft(draft);
        useDraftStore.getState().setAiScan({step: "review", imageUrl: "https://cdn.example/receipt.jpg", preview: null});

        expect(useDraftStore.getState().transactionDraft).toEqual(draft);
        expect(useDraftStore.getState().aiScan).toMatchObject({step: "review", imageUrl: "https://cdn.example/receipt.jpg"});
    });

    it("persists only the serializable draft fields", () => {
        const draft = buildDraft({image_urls: ["https://cdn.example/receipt.jpg"]});
        useDraftStore.getState().setTransactionDraft(draft);
        useDraftStore.getState().setAiScan({step: "review", imageUrl: "https://cdn.example/receipt.jpg", preview: null});

        const saved = persistedDraft().state as {transactionDraft: TransactionDraft; aiScan: {step: string; imageUrl: string}};
        expect(saved.transactionDraft).toEqual(draft);
        expect(saved.aiScan).toEqual({step: "review", imageUrl: "https://cdn.example/receipt.jpg", preview: null});
    });

    it("never writes File, Blob or object URL into sessionStorage", () => {
        useDraftStore.getState().setTransactionDraft(buildDraft({image_urls: ["blob:http://localhost/preview-1"]}));
        useDraftStore.getState().setAiScan({step: "selected", imageUrl: "blob:http://localhost/preview-2", preview: null});

        const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY) ?? "";
        expect(raw).not.toContain("blob:");
        expect(raw).not.toContain("File");

        const saved = persistedDraft().state as {transactionDraft: {image_urls: string[]}; aiScan: {imageUrl: string | null}};
        expect(saved.transactionDraft.image_urls).toEqual([]);
        expect(saved.aiScan.imageUrl).toBeNull();

        expect(useDraftStore.getState().transactionDraft?.image_urls).toEqual(["blob:http://localhost/preview-1"]);
    });

    it("revokes object URLs and clears drafts on reset", () => {
        const revoke = vi.fn();
        Object.defineProperty(URL, "revokeObjectURL", {configurable: true, writable: true, value: revoke});
        useDraftStore.getState().setTransactionDraft(buildDraft({image_urls: ["blob:http://localhost/preview-1", "https://cdn.example/receipt.jpg"]}));
        useDraftStore.getState().setAiScan({step: "selected", imageUrl: "blob:http://localhost/preview-2", preview: null});

        useDraftStore.getState().resetDrafts();

        expect(revoke).toHaveBeenCalledWith("blob:http://localhost/preview-1");
        expect(revoke).toHaveBeenCalledWith("blob:http://localhost/preview-2");
        expect(revoke).not.toHaveBeenCalledWith("https://cdn.example/receipt.jpg");
        expect(useDraftStore.getState()).toMatchObject({transactionDraft: null, aiScan: null});
    });

    it("clears auth session, drafts and image previews on logout cleanup", () => {
        const revoke = vi.fn();
        Object.defineProperty(URL, "revokeObjectURL", {configurable: true, writable: true, value: revoke});
        useAuthStore.getState().setSession("opaque.api.token", user);
        useDraftStore.getState().setAiScan({step: "selected", imageUrl: "blob:http://localhost/preview", preview: null});

        useAuthStore.getState().clearSession();
        useDraftStore.getState().resetDrafts();

        expect(useAuthStore.getState()).toMatchObject({token: null, user: null});
        expect(useDraftStore.getState()).toMatchObject({transactionDraft: null, aiScan: null});
        expect(revoke).toHaveBeenCalledWith("blob:http://localhost/preview");
    });
});
