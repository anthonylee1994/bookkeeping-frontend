import React from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter, Route, Routes, useLocation} from "react-router";
import {TransactionDetailDrawer} from "@/features/transactions/TransactionDetailDrawer";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";
import {domainTestState} from "@/test/domainFixtures";
import {renderWithIntl} from "@/test/renderWithIntl";
import type {Transaction} from "@/data/types";

const transaction = domainTestState.transactions[0];
const deleteMock = vi.hoisted(() => vi.fn());
const getMock = vi.hoisted(() => vi.fn());
const duplicateMock = vi.hoisted(() => vi.fn());

vi.mock("@/data/transactionsRepository", () => ({
    TransactionsRepository: class {
        delete = deleteMock;
        get = getMock;
        duplicate = duplicateMock;
    },
}));

const LocationProbe = () => {
    const location = useLocation();
    return <div data-testid="location">{location.pathname}</div>;
};

function renderDrawer(current: Transaction = transaction) {
    return renderWithIntl(
        <React.Fragment>
            <MemoryRouter initialEntries={[`/transactions/${current.id}`]}>
                <Routes>
                    <Route
                        path="/transactions/:id"
                        element={
                            <React.Fragment>
                                <TransactionDetailDrawer />
                                <LocationProbe />
                            </React.Fragment>
                        }
                    />
                    <Route path="/transactions" element={<div>TRANSACTION LIST</div>} />
                </Routes>
            </MemoryRouter>
        </React.Fragment>
    );
}

beforeEach(() => {
    useAuthStore.setState({token: "test-token", user: null, hydrated: true});
    useAppStore.setState({...domainTestState, referenceLoaded: true});
    deleteMock.mockReset();
    duplicateMock.mockReset();
    getMock.mockReset().mockResolvedValue({ok: true, value: transaction});
});

describe("TransactionDetailDrawer", () => {
    it("renders transaction details and edit action in a drawer", async () => {
        renderDrawer();

        expect(await screen.findByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("+HK$3,000.00")).toBeInTheDocument();
        expect(screen.getAllByText("工資")).toHaveLength(2);
        expect(screen.getByRole("link", {name: "修改"})).toHaveAttribute("href", `/transactions/${transaction.id}/edit`);
        expect(screen.getByRole("button", {name: "刪除"})).toBeInTheDocument();
    });

    it("confirms deletion, removes the transaction and closes the drawer", async () => {
        const user = userEvent.setup();
        deleteMock.mockResolvedValue({ok: true, value: true});
        renderDrawer();

        await user.click(await screen.findByRole("button", {name: "刪除"}));
        expect(screen.getByRole("alertdialog")).toHaveTextContent("此操作無法復原");
        await user.click(within(screen.getByRole("alertdialog")).getByRole("button", {name: "刪除"}));

        expect(await screen.findByText("TRANSACTION LIST")).toBeInTheDocument();
        expect(deleteMock).toHaveBeenCalledWith(transaction.id);
        expect(useAppStore.getState().transactions).not.toContainEqual(transaction);
    });

    it("duplicates the transaction and opens the new detail", async () => {
        const user = userEvent.setup();
        const copy: Transaction = {...transaction, id: "40000000-0000-4000-8000-0000000000c1", occurred_at: "2026-09-15T02:00:00.000Z"};
        duplicateMock.mockResolvedValue({ok: true, value: copy});
        renderDrawer();

        await user.click(await screen.findByRole("button", {name: "複製"}));

        expect(duplicateMock).toHaveBeenCalledWith(transaction.id);
        expect(await screen.findByTestId("location")).toHaveTextContent(`/transactions/${copy.id}`);
        expect(useAppStore.getState().transactions[0]).toEqual(copy);
    });

    it("shows the duplicate failure without navigating away", async () => {
        const user = userEvent.setup();
        duplicateMock.mockResolvedValue({ok: false, error: {code: "conflict", message: "操作衝突，請重新載入再試"}});
        renderDrawer();

        await user.click(await screen.findByRole("button", {name: "複製"}));

        expect(await screen.findByRole("alert")).toHaveTextContent("操作衝突，請重新載入再試");
        expect(screen.getByTestId("location")).toHaveTextContent(`/transactions/${transaction.id}`);
    });
});
