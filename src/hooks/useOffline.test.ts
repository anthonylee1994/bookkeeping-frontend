// @vitest-environment jsdom

import {act, renderHook} from "@testing-library/react";
import {beforeEach, describe, expect, it} from "vitest";
import {useUiStore} from "../stores/uiStore";
import {useOffline} from "./useOffline";

function setNavigatorOnline(value: boolean): void {
    Object.defineProperty(window.navigator, "onLine", {configurable: true, value});
}

beforeEach(() => {
    useUiStore.getState().resetUiState();
    setNavigatorOnline(true);
});

describe("useOffline", () => {
    it("reflects the current network state on mount", () => {
        setNavigatorOnline(false);

        const {result, unmount} = renderHook(() => useOffline());

        expect(result.current).toBe(true);
        unmount();
    });

    it("updates when the browser goes offline and back online", () => {
        const {result, unmount} = renderHook(() => useOffline());
        expect(result.current).toBe(false);

        act(() => {
            setNavigatorOnline(false);
            window.dispatchEvent(new Event("offline"));
        });
        expect(result.current).toBe(true);

        act(() => {
            setNavigatorOnline(true);
            window.dispatchEvent(new Event("online"));
        });
        expect(result.current).toBe(false);

        unmount();
    });

    it("stops updating after the last subscriber unmounts", () => {
        const {unmount} = renderHook(() => useOffline());

        setNavigatorOnline(false);
        unmount();
        window.dispatchEvent(new Event("offline"));

        expect(useUiStore.getState().isOffline).toBe(false);
    });
});
