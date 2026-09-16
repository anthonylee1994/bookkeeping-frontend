// @vitest-environment jsdom

import {act, renderHook} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {useAppUpdate} from "@/features/pwa/useAppUpdate";

describe("useAppUpdate", () => {
    it("does not register anything outside production builds", () => {
        const {result} = renderHook(() => useAppUpdate());

        expect(result.current.needRefresh).toBe(false);
        expect(result.current.offlineReady).toBe(false);
    });

    it("lets the user dismiss the prompts without reloading", () => {
        const {result} = renderHook(() => useAppUpdate());

        act(() => {
            result.current.dismissUpdate();
            result.current.dismissOfflineReady();
        });

        expect(result.current.needRefresh).toBe(false);
        expect(result.current.offlineReady).toBe(false);
    });
});
