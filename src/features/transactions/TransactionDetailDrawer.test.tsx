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
const refundMock = vi.hoisted(() => vi.fn());
const duplicateMock = vi.hoisted(() => vi.fn());

vi.mock("@/data/transactionsRepository", () => ({
    TransactionsRepository: class {
        delete = deleteMock;
        get = getMock;
        refund = refundMock;
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
    refundMock.mockReset();
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

    it("shows both the original and the net amount once part of it is refunded", async () => {
        const partiallyRefunded: Transaction = {...transaction, net_amount_cents: 200000};
        useAppStore.setState({transactions: [partiallyRefunded]});
        renderDrawer(partiallyRefunded);

        expect(await screen.findByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("原始金額").parentElement).toHaveTextContent("HK$3,000.00");
        expect(screen.getByText("扣除退款後淨額").parentElement).toHaveTextContent("HK$2,000.00");
    });

    it("confirms deletion, removes the transaction and closes the drawer", async () => {
        const user = userEvent.setup();
        deleteMock.mockResolvedValue({ok: true, value: true});
        renderDrawer();

        await user.click(await screen.findByRole("button", {name: "刪除"}));
        expect(screen.getByRole("alertdialog")).toHaveTextContent("關聯退款亦會一併刪除");
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

    it("refunds up to the remaining amount and updates the original net amount", async () => {
        const user = userEvent.setup();
        const refund: Transaction = {
            ...transaction,
            id: "40000000-0000-4000-8000-0000000000r1",
            amount_cents: 50000,
            net_amount_cents: 50000,
            refund_of_id: transaction.id,
            occurred_at: "2026-09-15T04:00:00.000Z",
        };
        refundMock.mockResolvedValue({ok: true, value: refund});
        renderDrawer();

        await user.click(await screen.findByRole("button", {name: "退款"}));
        const dialog = await screen.findByRole("dialog", {name: "退款"});
        expect(within(dialog).getByText("可退款上限 HK$3,000.00")).toBeInTheDocument();

        const amount = within(dialog).getByLabelText("退款金額");
        await user.clear(amount);
        await user.type(amount, "3000.01");
        await user.click(within(dialog).getByRole("button", {name: "確認退款"}));
        expect(await within(dialog).findByText("退款金額不可超過 HK$3,000.00")).toBeInTheDocument();
        expect(refundMock).not.toHaveBeenCalled();

        await user.clear(amount);
        await user.type(amount, "500.00");
        await user.type(within(dialog).getByLabelText("備註"), "退貨");
        await user.click(within(dialog).getByRole("button", {name: "確認退款"}));

        await vi.waitFor(() => expect(refundMock).toHaveBeenCalledTimes(1));
        expect(refundMock.mock.calls[0][0]).toBe(transaction.id);
        expect(refundMock.mock.calls[0][1]).toMatchObject({amount_cents: 50000, note: "退貨"});

        const stored = useAppStore.getState().transactions;
        expect(stored[0]).toEqual(refund);
        expect(stored.find(item => item.id === transaction.id)?.net_amount_cents).toBe(250000);
        expect(await screen.findByText("扣除退款後淨額")).toBeInTheDocument();
    });

    it("disables refunding a transfer and explains why", async () => {
        const transfer: Transaction = {
            ...transaction,
            id: "40000000-0000-4000-8000-0000000000t1",
            kind: "transfer",
            category_id: null,
            transfer_account_id: domainTestState.accounts[1].id,
        };
        useAppStore.setState({transactions: [transfer]});
        renderDrawer(transfer);

        expect(await screen.findByRole("button", {name: "退款"})).toBeDisabled();
        expect(screen.getByText("轉帳不可退款")).toBeInTheDocument();
    });

    it("disables refunding once the transaction is fully refunded", async () => {
        const settled: Transaction = {...transaction, net_amount_cents: 0};
        useAppStore.setState({transactions: [settled]});
        renderDrawer(settled);

        expect(await screen.findByRole("button", {name: "退款"})).toBeDisabled();
        expect(screen.getByText("此交易已全數退款")).toBeInTheDocument();
    });
});
