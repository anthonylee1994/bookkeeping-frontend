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
            toasts: [],
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

    it("queues and dismisses toasts", () => {
        const first = useUiStore.getState().pushToast({kind: "success", message: "已儲存"});
        const second = useUiStore.getState().pushToast({kind: "error", message: "儲存失敗"});

        expect(useUiStore.getState().toasts).toEqual([
            {id: first, kind: "success", message: "已儲存"},
            {id: second, kind: "error", message: "儲存失敗"},
        ]);

        useUiStore.getState().dismissToast(first);

        expect(useUiStore.getState().toasts).toEqual([{id: second, kind: "error", message: "儲存失敗"}]);
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
        state.pushToast({kind: "info", message: "提示"});
        state.setInstallPrompt("available");

        state.resetUiState();

        expect(useUiStore.getState()).toMatchObject({
            isMobileNavOpen: false,
            activeDialog: null,
            isOffline: false,
            toasts: [],
            installPrompt: "unavailable",
        });
    });

    it("records install prompt status without re-prompting after dismissal", () => {
        useUiStore.getState().setInstallPrompt("dismissed");

        expect(useUiStore.getState().installPrompt).toBe("dismissed");
    });
});
