// @vitest-environment jsdom

import {beforeEach, describe, expect, it} from "vitest";
import {subscribeToNetworkStatus, useUiStore} from "./uiStore";

function setNavigatorOnline(value: boolean): void {
    Object.defineProperty(window.navigator, "onLine", {configurable: true, value});
}

beforeEach(() => {
    useUiStore.getState().resetUiState();
    setNavigatorOnline(true);
});

describe("ui store", () => {
    it("starts with nav closed, no dialog, online and prompt-free", () => {
        expect(useUiStore.getState()).toMatchObject({
            isMobileNavOpen: false,
            activeDialog: null,
            isOffline: false,
            installPrompt: "unavailable",
        });
    });

    it("toggles the mobile nav and active dialog", () => {
        const state = useUiStore.getState();
        state.setMobileNavOpen(true);
        state.setActiveDialog("transaction-detail");

        expect(useUiStore.getState()).toMatchObject({isMobileNavOpen: true, activeDialog: "transaction-detail"});

        state.setMobileNavOpen(false);
        state.setActiveDialog(null);

        expect(useUiStore.getState()).toMatchObject({isMobileNavOpen: false, activeDialog: null});
    });

    it("tracks offline state from browser network events", () => {
        const unsubscribe = subscribeToNetworkStatus();

        setNavigatorOnline(false);
        window.dispatchEvent(new Event("offline"));
        expect(useUiStore.getState().isOffline).toBe(true);

        setNavigatorOnline(true);
        window.dispatchEvent(new Event("online"));
        expect(useUiStore.getState().isOffline).toBe(false);

        unsubscribe();
    });

    it("stops updating after unsubscribe", () => {
        const unsubscribe = subscribeToNetworkStatus();
        unsubscribe();

        setNavigatorOnline(false);
        window.dispatchEvent(new Event("offline"));

        expect(useUiStore.getState().isOffline).toBe(false);
    });

    it("resets every ui slice", () => {
        const state = useUiStore.getState();
        state.setMobileNavOpen(true);
        state.setActiveDialog("confirm");
        state.setOffline(true);
        state.setInstallPrompt("available");
        state.openAiBatch({id: "80000000-0000-4000-8000-000000000001", image_urls: [], sha256: "a".repeat(64), status: "success", parsed: null});

        state.resetUiState();

        expect(useUiStore.getState()).toMatchObject({
            isMobileNavOpen: false,
            activeDialog: null,
            isOffline: false,
            installPrompt: "unavailable",
            pendingAiBatch: null,
        });
    });

    it("tracks the pending AI batch preview", () => {
        const preview = {id: "80000000-0000-4000-8000-000000000001", image_urls: [], sha256: "a".repeat(64), status: "success" as const, parsed: null};

        useUiStore.getState().openAiBatch(preview);
        expect(useUiStore.getState().pendingAiBatch).toEqual(preview);

        useUiStore.getState().closeAiBatch();
        expect(useUiStore.getState().pendingAiBatch).toBeNull();
    });

    it("records install prompt status without re-prompting after dismissal", () => {
        useUiStore.getState().setInstallPrompt("dismissed");

        expect(useUiStore.getState().installPrompt).toBe("dismissed");
    });
});
