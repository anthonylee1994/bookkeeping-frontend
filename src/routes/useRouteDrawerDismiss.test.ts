import {describe, expect, it} from "vitest";
import {shouldDismissRouteDrawer} from "@/routes/useRouteDrawerDismiss";

describe("shouldDismissRouteDrawer", () => {
    it("honours dismiss while the live URL is still this drawer", () => {
        expect(shouldDismissRouteDrawer("/transactions/abc", "/transactions/abc")).toBe(true);
    });

    it("ignores dismiss after the router has already moved to the edit URL", () => {
        expect(shouldDismissRouteDrawer("/transactions/abc", "/transactions/abc/edit")).toBe(false);
    });

    it("ignores dismiss after the router has already left the transactions tree", () => {
        expect(shouldDismissRouteDrawer("/transactions/abc", "/")).toBe(false);
    });

    it("honours dismiss when there is no data router live path (MemoryRouter)", () => {
        expect(shouldDismissRouteDrawer("/transactions/abc", undefined)).toBe(true);
    });
});
