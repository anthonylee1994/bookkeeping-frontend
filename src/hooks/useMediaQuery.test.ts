// @vitest-environment jsdom

import {act, renderHook} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";
import {useMediaQuery} from "./useMediaQuery";

type Listener = (event: MediaQueryListEvent) => void;

function installMatchMedia(initialMatches: boolean): {setMatches: (next: boolean) => void} {
    const listeners = new Set<Listener>();
    const media = {
        matches: initialMatches,
        media: "",
        onchange: null,
        addEventListener: (_type: string, listener: Listener) => listeners.add(listener),
        removeEventListener: (_type: string, listener: Listener) => listeners.delete(listener),
    };
    window.matchMedia = vi.fn(() => media as unknown as MediaQueryList) as unknown as typeof window.matchMedia;
    return {
        setMatches(next: boolean) {
            media.matches = next;
            for (const listener of listeners) listener({matches: next} as MediaQueryListEvent);
        },
    };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useMediaQuery", () => {
    it("reads the initial match state", () => {
        installMatchMedia(true);

        const {result, unmount} = renderHook(() => useMediaQuery("(min-width: 768px)"));

        expect(result.current).toBe(true);
        unmount();
    });

    it("updates when the media query changes", () => {
        const media = installMatchMedia(false);

        const {result, unmount} = renderHook(() => useMediaQuery("(min-width: 768px)"));
        expect(result.current).toBe(false);

        act(() => media.setMatches(true));
        expect(result.current).toBe(true);

        act(() => media.setMatches(false));
        expect(result.current).toBe(false);

        unmount();
    });
});
