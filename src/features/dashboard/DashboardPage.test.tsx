import {beforeEach, describe, expect, it, vi} from "vitest";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter, Route, Routes} from "react-router";
import type {Dashboard, LocalResult, TransactionRow} from "@/data/types";
import {DashboardPage} from "@/features/dashboard/DashboardPage";
import {useAuthStore} from "@/stores/authStore";
import {renderWithIntl} from "@/test/renderWithIntl";

vi.mock("recharts", () => ({
    ResponsiveContainer: () => null,
    PieChart: () => null,
    Pie: () => null,
    Cell: () => null,
    Tooltip: () => null,
}));

const getMock = vi.hoisted(() => vi.fn());

vi.mock("@/data/dashboardRepository", () => ({
    DashboardRepository: class {
        get = getMock;
    },
}));

const ACCOUNT_ID = "10000000-0000-4000-8000-000000000001";
const SAVINGS_ID = "10000000-0000-4000-8000-000000000002";
const CATEGORY_ID = "20000000-0000-4000-8000-000000000002";

const expenseTransaction: TransactionRow = {
    id: "40000000-0000-4000-8000-000000000001",
    account_id: ACCOUNT_ID,
    category_id: CATEGORY_ID,
    merchant_id: null,
    kind: "expense",
    amount_cents: 50000,
    currency: "HKD",
    occurred_at: "2026-09-10T04:00:00.000Z",
    note: "午餐",
    payment_method: null,
    source: "manual",
    transfer_account_id: null,
    image_urls: [],
    refund_of_id: null,
    net_amount_cents: 50000,
};

const transferTransaction: TransactionRow = {
    ...expenseTransaction,
    id: "40000000-0000-4000-8000-000000000002",
    kind: "transfer",
    amount_cents: 20000,
    category_id: null,
    note: "轉去銀行",
    transfer_account_id: SAVINGS_ID,
    net_amount_cents: 20000,
};

const accountBalance = {id: ACCOUNT_ID, name: "現金", currency: "HKD" as const, initial_balance_cents: 0, balance_cents: 50000};

const dashboardFixture: Dashboard = {
    range: {from: "2026-08-31T16:00:00.000Z", to: "2026-09-30T15:59:59.999Z"},
    income_cents: 100000,
    expense_cents: 50000,
    refund_cents: 0,
    net_expense_cents: 50000,
    net_cents: 50000,
    recent_transactions: [expenseTransaction, transferTransaction],
    by_category: [{category_id: CATEGORY_ID, name: "飲食", expense_cents: 50000, refund_cents: 0}],
    accounts: [accountBalance],
    account_balances: [accountBalance],
    upcoming_recurring: [],
    recurring_reminders: [],
};

const emptyDashboard: Dashboard = {
    ...dashboardFixture,
    income_cents: 0,
    expense_cents: 0,
    refund_cents: 0,
    net_expense_cents: 0,
    net_cents: 0,
    recent_transactions: [],
    by_category: [],
    accounts: [],
    account_balances: [],
};

function renderDashboard(entry = "/?date=2026-09-14"): void {
    renderWithIntl(
        <MemoryRouter initialEntries={[entry]}>
            <Routes>
                <Route path="/" element={<DashboardPage />} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    getMock.mockReset();
    useAuthStore.setState({token: "test-token", user: null, hydrated: true});
});

describe("DashboardPage", () => {
    it("shows a skeleton, then the monthly content", async () => {
        let resolveDashboard: (value: LocalResult<Dashboard>) => void = () => undefined;
        getMock.mockReturnValue(
            new Promise<LocalResult<Dashboard>>(resolve => {
                resolveDashboard = resolve;
            })
        );

        renderDashboard();
        await waitFor(() => expect(getMock).toHaveBeenCalledWith("2026-09-14"));
        expect(screen.queryByText("本月淨額")).not.toBeInTheDocument();

        resolveDashboard({ok: true, value: dashboardFixture});

        expect(await screen.findByText("本月淨額")).toBeInTheDocument();
    });

    it("renders summary, category table, accounts and recent transactions", async () => {
        getMock.mockResolvedValue({ok: true, value: dashboardFixture});
        renderDashboard();

        expect(await screen.findByText("本月淨額")).toBeInTheDocument();
        expect(screen.getByText("+HK$1,000.00")).toBeInTheDocument();
        expect(screen.getAllByText("-HK$500.00").length).toBeGreaterThan(0);
        expect(screen.getByText("+HK$500.00")).toBeInTheDocument();
        expect(await screen.findByText("飲食")).toBeInTheDocument();
        expect(screen.getByText("100%")).toBeInTheDocument();
        expect(screen.getByText("現金")).toBeInTheDocument();
        expect(screen.getByText("午餐")).toBeInTheDocument();
    });

    it("keeps transfers out of the income and expense totals", async () => {
        getMock.mockResolvedValue({ok: true, value: dashboardFixture});
        renderDashboard();

        expect(await screen.findByText("轉去銀行")).toBeInTheDocument();
        expect(screen.getByText("+HK$1,000.00")).toBeInTheDocument();
        expect(screen.getAllByText("-HK$500.00").length).toBeGreaterThan(0);
        expect(screen.getByText("HK$200.00")).toBeInTheDocument();
    });

    it("shows the first-transaction empty state when there is no data", async () => {
        getMock.mockResolvedValue({ok: true, value: emptyDashboard});
        renderDashboard();

        expect(await screen.findByText("仲未有任何交易")).toBeInTheDocument();
        expect(screen.getByRole("link", {name: /新增第一筆交易/})).toBeInTheDocument();
    });

    it("changes the month query and refetches", async () => {
        const user = userEvent.setup();
        getMock.mockResolvedValue({ok: true, value: dashboardFixture});
        renderDashboard();

        await screen.findByText("本月淨額");
        expect(getMock).toHaveBeenCalledWith("2026-09-14");

        await user.click(screen.getByRole("button", {name: "下個月"}));

        await waitFor(() => expect(getMock).toHaveBeenCalledWith("2026-10-14"));
        expect(screen.getByText("2026年10月")).toBeInTheDocument();
    });

    it("shows an error and retries on demand", async () => {
        const user = userEvent.setup();
        getMock.mockResolvedValueOnce({ok: false, error: {code: "api_failed", message: "載入失敗"}});
        getMock.mockResolvedValueOnce({ok: true, value: dashboardFixture});
        renderDashboard();

        expect(await screen.findByText("載入失敗")).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "重試"}));

        expect(await screen.findByText("本月淨額")).toBeInTheDocument();
    });
});
