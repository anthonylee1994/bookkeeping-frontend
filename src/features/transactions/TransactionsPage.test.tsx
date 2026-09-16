import React from "react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter, Route, Routes, useLocation} from "react-router";
import type {Transaction} from "@/data/types";
import {TransactionsPage} from "@/features/transactions/TransactionsPage";
import {DESKTOP_QUERY} from "@/hooks/useMediaQuery";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";
import {domainTestState} from "@/test/domainFixtures";
import {renderWithIntl} from "@/test/renderWithIntl";

const listMock = vi.hoisted(() => vi.fn());
const accountsListMock = vi.hoisted(() => vi.fn());
const categoriesListMock = vi.hoisted(() => vi.fn());
const merchantsSearchMock = vi.hoisted(() => vi.fn());

vi.mock("@/data/transactionsRepository", () => ({
    TransactionsRepository: class {
        list = listMock;
    },
}));
vi.mock("@/data/accountsRepository", () => ({
    AccountsRepository: class {
        list = accountsListMock;
    },
}));
vi.mock("@/data/categoriesRepository", () => ({
    CategoriesRepository: class {
        list = categoriesListMock;
    },
}));
vi.mock("@/data/merchantsRepository", () => ({
    MerchantsRepository: class {
        search = merchantsSearchMock;
    },
}));

const account = domainTestState.accounts[0];
const category = domainTestState.categories[1];
const merchant = domainTestState.merchants[0];

const expenseTransaction: Transaction = {
    id: "40000000-0000-4000-8000-000000000010",
    account_id: account.id,
    category_id: category.id,
    merchant_id: merchant.id,
    kind: "expense",
    amount_cents: 1200,
    currency: "HKD",
    occurred_at: "2026-09-10T04:00:00.000Z",
    note: "早餐",
    payment_method: null,
    source: "manual",
    transfer_account_id: null,
    image_urls: [],
    created_at: "2026-09-10T04:00:00.000Z",
    updated_at: "2026-09-10T04:00:00.000Z",
};

const meta = {page: 1, per_page: 25, total: 1, total_pages: 1};

function setDesktopViewport(desktop: boolean): void {
    window.matchMedia = ((query: string) => ({
        matches: desktop && query === DESKTOP_QUERY,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
}

const LocationProbe = () => {
    const location = useLocation();
    return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
};

function renderTransactions(entry = "/transactions"): void {
    renderWithIntl(
        <MemoryRouter initialEntries={[entry]}>
            <Routes>
                <Route
                    path="/transactions"
                    element={
                        <React.Fragment>
                            <TransactionsPage />
                            <LocationProbe />
                        </React.Fragment>
                    }
                />
                <Route
                    path="/transactions/:id"
                    element={
                        <React.Fragment>
                            <div>DETAIL</div>
                            <LocationProbe />
                        </React.Fragment>
                    }
                />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    listMock.mockReset();
    accountsListMock.mockReset();
    categoriesListMock.mockReset();
    merchantsSearchMock.mockReset();

    listMock.mockResolvedValue({ok: true, value: {data: [expenseTransaction], meta}});
    accountsListMock.mockResolvedValue({ok: true, value: domainTestState.accounts});
    categoriesListMock.mockResolvedValue({ok: true, value: domainTestState.categories});
    merchantsSearchMock.mockResolvedValue({ok: true, value: domainTestState.merchants});

    useAuthStore.setState({token: "test-token", user: null, hydrated: true});
    useAppStore.getState().resetAppState();
    setDesktopViewport(false);
});

afterEach(() => {
    setDesktopViewport(false);
});

describe("TransactionsPage", () => {
    it("restores filters from the URL and forwards them to the repository", async () => {
        renderTransactions("/transactions?kind=expense&page=2&per_page=50&sort=amount_cents&order=asc");

        expect(await screen.findByText(/早餐/)).toBeInTheDocument();
        expect(listMock).toHaveBeenCalledWith(expect.objectContaining({kind: "expense", page: 2, per_page: 50, sort: "amount_cents", order: "asc"}));
    });

    it("searches from the toolbar and writes the keyword back to the URL", async () => {
        const user = userEvent.setup();
        renderTransactions();

        await screen.findByText(/早餐/);

        await user.type(screen.getByRole("textbox", {name: "搜尋交易"}), "咖啡{Enter}");

        await waitFor(() => expect(listMock).toHaveBeenLastCalledWith(expect.objectContaining({keyword: "咖啡", page: 1})));
        expect(screen.getByTestId("location")).toHaveTextContent("q=");
    });

    it("applies a quick date range from the segmented control", async () => {
        const user = userEvent.setup();
        renderTransactions();

        await screen.findByText(/早餐/);

        await user.click(screen.getByRole("button", {name: "本月"}));

        await waitFor(() => {
            const lastCall = listMock.mock.calls.at(-1)?.[0] as Record<string, unknown>;
            expect(typeof lastCall.from).toBe("string");
            expect(typeof lastCall.to).toBe("string");
            expect(lastCall.page).toBe(1);
        });
        expect(screen.getByTestId("location")).toHaveTextContent("from=");
    });

    it("applies an advanced filter from the drawer and writes it back to the URL", async () => {
        const user = userEvent.setup();
        renderTransactions();

        await screen.findByText(/早餐/);

        await user.click(screen.getByRole("button", {name: /篩選/}));
        await user.selectOptions(await screen.findByLabelText("類型"), "income");
        await user.click(screen.getByRole("button", {name: "套用篩選"}));

        await waitFor(() => expect(listMock).toHaveBeenLastCalledWith(expect.objectContaining({kind: "income", page: 1})));
        expect(screen.getByTestId("location")).toHaveTextContent("kind=income");
    });

    it("removes a single filter from its chip", async () => {
        const user = userEvent.setup();
        renderTransactions("/transactions?kind=expense&q=咖啡");

        await screen.findByText(/早餐/);

        await user.click(screen.getByRole("button", {name: "移除篩選：支出"}));

        await waitFor(() => {
            const lastCall = listMock.mock.calls.at(-1)?.[0] as Record<string, unknown>;
            expect(lastCall.kind).toBeUndefined();
            expect(lastCall.keyword).toBe("咖啡");
        });
    });

    it("offers to clear filters when a filtered search has no results", async () => {
        const user = userEvent.setup();
        listMock.mockResolvedValue({ok: true, value: {data: [], meta: {page: 1, per_page: 25, total: 0, total_pages: 0}}});
        renderTransactions("/transactions?kind=expense");

        expect(await screen.findByText("沒有符合條件的結果")).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "清除篩選"}));

        await waitFor(() => {
            const lastCall = listMock.mock.calls.at(-1)?.[0] as Record<string, unknown>;
            expect(lastCall.kind).toBeUndefined();
        });
    });

    it("shows the empty state when there are no transactions", async () => {
        listMock.mockResolvedValue({ok: true, value: {data: [], meta: {page: 1, per_page: 25, total: 0, total_pages: 0}}});
        renderTransactions();

        expect(await screen.findByText("尚未有任何交易")).toBeInTheDocument();
        expect(screen.getByRole("link", {name: "新增第一筆交易"})).toBeInTheDocument();
    });

    it("uses the canonical detail path on desktop", async () => {
        const user = userEvent.setup();
        setDesktopViewport(true);
        renderTransactions();

        const row = (await screen.findByText(/早餐/)).closest("tr");
        if (row === null) throw new Error("找不到交易列");
        await user.click(row);

        expect(await screen.findByText("DETAIL")).toBeInTheDocument();
        expect(screen.getByTestId("location")).toHaveTextContent(`/transactions/${expenseTransaction.id}`);
    });
});
