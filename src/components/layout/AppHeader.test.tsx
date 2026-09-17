import React from "react";
import {describe, expect, it} from "vitest";
import {screen} from "@testing-library/react";
import {createMemoryRouter, RouterProvider} from "react-router";
import {AppHeader} from "@/components/layout/AppHeader";
import {renderWithIntl} from "@/test/renderWithIntl";

function renderHeader(entry = "/"): void {
    const router = createMemoryRouter([{path: "*", element: <AppHeader sidebarCollapsed={false} onToggleSidebar={() => undefined} />}], {initialEntries: [entry]});
    renderWithIntl(
        <React.Fragment>
            <RouterProvider router={router} />
        </React.Fragment>
    );
}

describe("AppHeader", () => {
    it("exposes a recurring-rules entry point for mobile", () => {
        renderHeader();

        const recurringLink = screen.getByRole("link", {name: "定期交易"});
        expect(recurringLink).toHaveAttribute("href", "/recurring-rules");
        expect(screen.getByRole("button", {name: "掃描"})).toBeInTheDocument();
    });
});
