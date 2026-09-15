import "@testing-library/jest-dom/vitest";
import {afterEach, vi} from "vitest";
import {cleanup} from "@testing-library/react";

afterEach(() => {
    cleanup();
});

if (typeof window !== "undefined") {
    const browser = window as unknown as {
        matchMedia?: typeof window.matchMedia;
        ResizeObserver?: unknown;
        PointerEvent?: unknown;
    };

    if (!browser.matchMedia) {
        browser.matchMedia = (query: string): MediaQueryList =>
            ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            }) as unknown as MediaQueryList;
    }

    if (!browser.ResizeObserver) {
        class ResizeObserverStub {
            observe = vi.fn();
            unobserve = vi.fn();
            disconnect = vi.fn();
        }
        browser.ResizeObserver = ResizeObserverStub;
    }

    if (!browser.PointerEvent) {
        browser.PointerEvent = MouseEvent;
    }

    if (!Element.prototype.scrollIntoView) {
        Element.prototype.scrollIntoView = vi.fn();
    }

    if (!Element.prototype.hasPointerCapture) {
        Element.prototype.hasPointerCapture = () => false;
    }

    if (!Element.prototype.setPointerCapture) {
        Element.prototype.setPointerCapture = () => undefined;
    }

    if (!Element.prototype.releasePointerCapture) {
        Element.prototype.releasePointerCapture = () => undefined;
    }
}
