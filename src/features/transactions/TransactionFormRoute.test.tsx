import React from "react";
import {describe, expect, it, vi} from "vitest";
import {screen} from "@testing-library/react";
import {TransactionFormRoute} from "@/features/transactions/TransactionFormRoute";
import {renderWithIntl} from "@/test/renderWithIntl";

vi.mock("@/features/transactions/TransactionFormPage", () => ({
    TransactionFormPage: () => <div>TRANSACTION FORM</div>,
}));

describe("TransactionFormRoute", () => {
    it("renders the transaction form drawer", () => {
        renderWithIntl(
            <React.Fragment>
                <TransactionFormRoute />
            </React.Fragment>
        );

        expect(screen.getByText("TRANSACTION FORM")).toBeInTheDocument();
    });
});
