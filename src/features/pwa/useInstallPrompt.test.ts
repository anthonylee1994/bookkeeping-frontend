// @vitest-environment jsdom

import {act, renderHook} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {INSTALL_DISMISS_KEY, useInstallPrompt} from "@/features/pwa/useInstallPrompt";
import {useUiStore} from "@/stores/uiStore";

type FakeInstallEvent = Event & {
    prompt: ReturnType<typeof vi.fn>;
    userChoice: Promise<{outcome: "accepted" | "dismissed"; platform: string}>;
};

function installEvent(outcome: "accepted" | "dismissed" = "accepted"): FakeInstallEvent {
    const event = new Event("beforeinstallprompt") as FakeInstallEvent;
    event.prompt = vi.fn().mockResolvedValue(undefined);
    event.userChoice = Promise.resolve({outcome, platform: "web"});
    return event;
}

beforeEach(() => {
    localStorage.clear();
    useUiStore.getState().resetUiState();
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("useInstallPrompt", () => {
    it("waits for an interaction and a cooldown before offering install", () => {
        const {result} = renderHook(() => useInstallPrompt());
        expect(result.current.canInstall).toBe(false);

        act(() => {
            window.dispatchEvent(installEvent());
        });
        expect(result.current.canInstall).toBe(false);

        act(() => {
            window.dispatchEvent(new Event("pointerdown"));
        });
        expect(result.current.canInstall).toBe(false);

        act(() => {
            vi.advanceTimersByTime(20_000);
        });
        expect(result.current.canInstall).toBe(true);
        expect(useUiStore.getState().installPrompt).toBe("available");
    });

    it("remembers a dismissal so it never nags again", () => {
        const first = renderHook(() => useInstallPrompt());
        act(() => {
            window.dispatchEvent(installEvent());
        });
        act(() => {
            window.dispatchEvent(new Event("pointerdown"));
        });
        act(() => {
            vi.advanceTimersByTime(20_000);
        });
        expect(first.result.current.canInstall).toBe(true);

        act(() => {
            first.result.current.dismiss();
        });
        expect(localStorage.getItem(INSTALL_DISMISS_KEY)).toBe("1");
        expect(useUiStore.getState().installPrompt).toBe("dismissed");
        first.unmount();

        const second = renderHook(() => useInstallPrompt());
        act(() => {
            window.dispatchEvent(installEvent());
        });
        act(() => {
            window.dispatchEvent(new Event("pointerdown"));
        });
        act(() => {
            vi.advanceTimersByTime(20_000);
        });
        expect(second.result.current.canInstall).toBe(false);
    });

    it("triggers the native prompt on install", async () => {
        const event = installEvent("accepted");
        const {result} = renderHook(() => useInstallPrompt());
        act(() => {
            window.dispatchEvent(event);
        });
        act(() => {
            window.dispatchEvent(new Event("pointerdown"));
        });
        act(() => {
            vi.advanceTimersByTime(20_000);
        });

        await act(async () => {
            result.current.install();
        });

        expect(event.prompt).toHaveBeenCalledTimes(1);
        expect(useUiStore.getState().installPrompt).toBe("installed");
    });
});
