import {beforeEach, describe, expect, it, vi} from "vitest";
import {act, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {createMemoryRouter, RouterProvider} from "react-router";
import type {Transaction} from "@/data/types";
import {TransactionDetailRoute} from "@/features/transactions/TransactionDetailRoute";
import {TransactionFormRoute} from "@/features/transactions/TransactionFormRoute";
import {TransactionsLayout} from "@/features/transactions/TransactionsLayout";
import {DESKTOP_QUERY} from "@/hooks/useMediaQuery";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";
import {domainTestState} from "@/test/domainFixtures";
import {renderWithIntl} from "@/test/renderWithIntl";

const getMock = vi.hoisted(() => vi.fn());
const listMock = vi.hoisted(() => vi.fn());
const accountsListMock = vi.hoisted(() => vi.fn());
const categoriesListMock = vi.hoisted(() => vi.fn());
const merchantsSearchMock = vi.hoisted(() => vi.fn());

vi.mock("@/data/transactionsRepository", () => ({
    TransactionsRepository: class {
        list = listMock;
        get = getMock;
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

function setDesktopViewport(): void {
    window.matchMedia = ((query: string) => ({
        matches: query === DESKTOP_QUERY,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
}

function renderTransactionsRoute(entry: string) {
    const router = createMemoryRouter(
        [
            {
                path: "/transactions",
                element: <TransactionsLayout />,
                children: [
                    {index: true, element: null},
                    {path: "new", element: <TransactionFormRoute />},
                    {path: ":id", element: <TransactionDetailRoute />},
                    {path: ":id/edit", element: <TransactionFormRoute />},
                ],
            },
        ],
        {initialEntries: [entry]}
    );
    renderWithIntl(<RouterProvider router={router} />);
    return router;
}

beforeEach(() => {
    getMock.mockReset();
    listMock.mockReset();
    accountsListMock.mockReset();
    categoriesListMock.mockReset();
    merchantsSearchMock.mockReset();

    getMock.mockResolvedValue({ok: true, value: expenseTransaction});
    listMock.mockResolvedValue({ok: true, value: {data: [expenseTransaction], meta}});
    accountsListMock.mockResolvedValue({ok: true, value: domainTestState.accounts});
    categoriesListMock.mockResolvedValue({ok: true, value: domainTestState.categories});
    merchantsSearchMock.mockResolvedValue({ok: true, value: domainTestState.merchants});

    useAuthStore.setState({token: "test-token", user: null, hydrated: true});
    useAppStore.getState().resetAppState();
    useAppStore.getState().setTransactions([expenseTransaction], meta);
    setDesktopViewport();
});

async function flushDrawerDismiss(): Promise<void> {
    await act(async () => {
        await new Promise<void>(resolve => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        await new Promise<void>(resolve => {
            queueMicrotask(resolve);
        });
    });
}

describe("transaction drawer navigation", () => {
    it("opens the edit drawer when 修改 is clicked from the detail drawer", async () => {
        const user = userEvent.setup();
        const router = renderTransactionsRoute(`/transactions/${expenseTransaction.id}?kind=expense`);

        await user.click(await screen.findByRole("link", {name: "修改"}));

        expect(await screen.findByText("修改交易")).toBeInTheDocument();
        await waitFor(() => expect(router.state.location.pathname).toBe(`/transactions/${expenseTransaction.id}/edit`));
        expect(router.state.location.search).toBe("?kind=expense");
        expect(await screen.findByLabelText("金額")).toBeInTheDocument();
    });

    it("does not bounce back to the list when the detail drawer unmounts for the edit route", async () => {
        const router = renderTransactionsRoute(`/transactions/${expenseTransaction.id}?kind=expense`);

        expect(await screen.findByRole("dialog")).toBeInTheDocument();
        await flushDrawerDismiss();

        await act(async () => {
            await router.navigate(`/transactions/${expenseTransaction.id}/edit?kind=expense`);
        });
        await flushDrawerDismiss();

        expect(router.state.location.pathname).toBe(`/transactions/${expenseTransaction.id}/edit`);
        expect(router.state.location.search).toBe("?kind=expense");
        expect(await screen.findByText("修改交易")).toBeInTheDocument();
    });

    it("returns to the list when the detail drawer is dismissed", async () => {
        const user = userEvent.setup();
        const router = renderTransactionsRoute(`/transactions/${expenseTransaction.id}?kind=expense`);

        const closeButton = await screen.findByRole("button", {name: "關閉"});
        await flushDrawerDismiss();
        await user.click(closeButton);

        await waitFor(() => expect(router.state.location.pathname).toBe("/transactions"));
        expect(router.state.location.search).toBe("?kind=expense");
    });
});
