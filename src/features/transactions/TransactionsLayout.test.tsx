import React from "react";
import {describe, expect, it, vi} from "vitest";
import {screen} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router";
import {TransactionsLayout} from "@/features/transactions/TransactionsLayout";
import {renderWithIntl} from "@/test/renderWithIntl";

vi.mock("@/features/transactions/TransactionsPage", () => ({
    TransactionsPage: () => <div>TRANSACTION LIST</div>,
}));

const DetailDrawer = () => <div>TRANSACTION DETAIL DRAWER</div>;

function renderLayout(entry: string): void {
    renderWithIntl(
        <React.Fragment>
            <MemoryRouter initialEntries={[entry]}>
                <Routes>
                    <Route path="/transactions" element={<TransactionsLayout />}>
                        <Route index element={null} />
                        <Route path=":id" element={<DetailDrawer />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        </React.Fragment>
    );
}

describe("TransactionsLayout", () => {
    it("keeps the transaction list mounted on the list route", () => {
        renderLayout("/transactions");

        expect(screen.getByText("TRANSACTION LIST")).toBeInTheDocument();
    });

    it("keeps the transaction list mounted behind the detail drawer", () => {
        renderLayout("/transactions/abc");

        expect(screen.getByText("TRANSACTION LIST")).toBeInTheDocument();
        expect(screen.getByText("TRANSACTION DETAIL DRAWER")).toBeInTheDocument();
    });
});
