import React from "react";
import {describe, expect, it, vi} from "vitest";
import {screen} from "@testing-library/react";
import {TransactionDetailRoute} from "@/features/transactions/TransactionDetailRoute";
import {renderWithIntl} from "@/test/renderWithIntl";

vi.mock("@/features/transactions/TransactionsPage", () => ({
    TransactionsPage: () => <div>TRANSACTION LIST</div>,
}));

vi.mock("@/features/transactions/TransactionDetailDrawer", () => ({
    TransactionDetailDrawer: () => <div>TRANSACTION DETAIL DRAWER</div>,
}));

describe("TransactionDetailRoute", () => {
    it("keeps the transaction list behind the detail drawer", () => {
        renderWithIntl(
            <React.Fragment>
                <TransactionDetailRoute />
            </React.Fragment>
        );

        expect(screen.getByText("TRANSACTION LIST")).toBeInTheDocument();
        expect(screen.getByText("TRANSACTION DETAIL DRAWER")).toBeInTheDocument();
    });
});
