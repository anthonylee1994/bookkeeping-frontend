import React from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter, Route, Routes} from "react-router";
import {TransactionDetailDrawer} from "@/features/transactions/TransactionDetailDrawer";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";
import {domainTestState} from "@/test/domainFixtures";
import {renderWithIntl} from "@/test/renderWithIntl";

const transaction = domainTestState.transactions[0];
const deleteMock = vi.hoisted(() => vi.fn());
const getMock = vi.hoisted(() => vi.fn());

vi.mock("@/data/transactionsRepository", () => ({
    TransactionsRepository: class {
        delete = deleteMock;
        get = getMock;
    },
}));

beforeEach(() => {
    useAuthStore.setState({token: "test-token", user: null, hydrated: true});
    useAppStore.setState({...domainTestState, referenceLoaded: true});
    deleteMock.mockReset();
    getMock.mockReset().mockResolvedValue({ok: true, value: transaction});
});

describe("TransactionDetailDrawer", () => {
    it("renders transaction details and edit action in a drawer", async () => {
        renderWithIntl(
            <React.Fragment>
                <MemoryRouter initialEntries={[`/transactions/${transaction.id}`]}>
                    <Routes>
                        <Route path="/transactions/:id" element={<TransactionDetailDrawer />} />
                    </Routes>
                </MemoryRouter>
            </React.Fragment>
        );

        expect(await screen.findByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("+HK$3,000.00")).toBeInTheDocument();
        expect(screen.getAllByText("工資")).toHaveLength(2);
        expect(screen.getByRole("link", {name: "修改"})).toHaveAttribute("href", `/transactions/${transaction.id}/edit`);
        expect(screen.getByRole("button", {name: "刪除"})).toBeInTheDocument();
    });

    it("confirms deletion, removes the transaction and closes the drawer", async () => {
        const user = userEvent.setup();
        deleteMock.mockResolvedValue({ok: true, value: true});
        renderWithIntl(
            <React.Fragment>
                <MemoryRouter initialEntries={[`/transactions/${transaction.id}`]}>
                    <Routes>
                        <Route path="/transactions/:id" element={<TransactionDetailDrawer />} />
                        <Route path="/transactions" element={<div>TRANSACTION LIST</div>} />
                    </Routes>
                </MemoryRouter>
            </React.Fragment>
        );

        await user.click(await screen.findByRole("button", {name: "刪除"}));
        expect(screen.getByRole("alertdialog")).toHaveTextContent("關聯退款亦會一併刪除");
        await user.click(within(screen.getByRole("alertdialog")).getByRole("button", {name: "刪除"}));

        expect(await screen.findByText("TRANSACTION LIST")).toBeInTheDocument();
        expect(deleteMock).toHaveBeenCalledWith(transaction.id);
        expect(useAppStore.getState().transactions).not.toContainEqual(transaction);
    });
});
