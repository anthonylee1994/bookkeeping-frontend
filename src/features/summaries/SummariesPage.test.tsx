import {beforeEach, describe, expect, it, vi} from "vitest";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter, Route, Routes, useLocation} from "react-router";
import type {Summary, SummaryInsight, TransactionRow} from "@/data/types";
import {SummariesPage} from "@/features/summaries/SummariesPage";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";
import {domainTestState} from "@/test/domainFixtures";
import {renderWithIntl} from "@/test/renderWithIntl";

vi.mock("recharts", () => ({
    ResponsiveContainer: () => null,
    PieChart: () => null,
    Pie: () => null,
    Cell: () => null,
    Tooltip: () => null,
}));

const getMock = vi.hoisted(() => vi.fn());
const getInsightMock = vi.hoisted(() => vi.fn());

vi.mock("@/data/summariesRepository", () => ({
    SummariesRepository: class {
        get = getMock;
        getInsight = getInsightMock;
    },
}));

const ACCOUNT_ID = "10000000-0000-4000-8000-000000000001";
const CATEGORY_ID = "20000000-0000-4000-8000-000000000002";
const INCOME_CATEGORY_ID = "20000000-0000-4000-8000-000000000003";

const expenseTransaction: TransactionRow = {
    id: "40000000-0000-4000-8000-000000000001",
    account_id: ACCOUNT_ID,
    category_id: CATEGORY_ID,
    merchant_id: null,
    kind: "expense",
    amount_cents: 50000,
    currency: "HKD",
    occurred_at: "2026-09-16T04:00:00.000Z",
    note: "午餐",
    payment_method: null,
    source: "manual",
    transfer_account_id: null,
    image_urls: [],
};

const summaryFixture: Summary = {
    range: {from: "2026-09-13T16:00:00.000Z", to: "2026-09-20T15:59:59.999Z"},
    income_cents: 100000,
    expense_cents: 50000,
    net_cents: 50000,
    daily: [
        {date: "2026-09-13", net_cents: 0},
        {date: "2026-09-14", net_cents: 50000},
    ],
    by_category: [
        {category_id: CATEGORY_ID, name: "飲食", income_cents: 0, expense_cents: 50000},
        {category_id: INCOME_CATEGORY_ID, name: "薪金", income_cents: 100000, expense_cents: 0},
    ],
    by_account: [{account_id: ACCOUNT_ID, name: "現金", income_cents: 100000, expense_cents: 50000}],
    transfers: {count: 1, total_cents: 20000},
    transactions: {data: [expenseTransaction], meta: {page: 1, per_page: 25, total: 1, total_pages: 1}},
};

const paginatedSummary: Summary = {
    ...summaryFixture,
    transactions: {data: [expenseTransaction], meta: {page: 1, per_page: 25, total: 40, total_pages: 2}},
};

const insightFixture: SummaryInsight = {
    period: "monthly",
    range: summaryFixture.range,
    status: "success",
    text: "本月收入穩定，支出集中喺飲食。",
    highlights: ["飲食支出佔比最高。"],
    cached: false,
    generated_at: "2026-09-16T12:00:00+08:00",
    error: null,
};

const TransactionsStub = () => {
    const location = useLocation();
    return <div>{`TRANSACTIONS:${location.search}`}</div>;
};

function renderSummaries(entry = "/summaries?period=monthly&date=2026-09-16"): void {
    renderWithIntl(
        <MemoryRouter initialEntries={[entry]}>
            <Routes>
                <Route path="/summaries" element={<SummariesPage />} />
                <Route path="/transactions" element={<TransactionsStub />} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    getMock.mockReset();
    getInsightMock.mockReset();
    getInsightMock.mockResolvedValue({ok: true, value: insightFixture});
    useAuthStore.setState({token: "test-token", user: null, hydrated: true});
    useAppStore.setState({...domainTestState, referenceLoaded: true});
});

describe("SummariesPage", () => {
    it("renders income, expense and net, keeps transfers separate, and lists the period transactions", async () => {
        getMock.mockResolvedValue({ok: true, value: summaryFixture});
        renderSummaries();

        expect(await screen.findByText("淨額")).toBeInTheDocument();
        expect(screen.getByText("+$1,000.00")).toBeInTheDocument();
        expect(screen.getAllByText("-$500.00").length).toBeGreaterThan(0);
        expect(screen.getAllByText("+$500.00").length).toBeGreaterThan(0);

        expect(screen.getByText("1 筆轉帳")).toBeInTheDocument();
        expect(screen.getByText("$200.00")).toBeInTheDocument();

        expect(screen.getByText("飲食")).toBeInTheDocument();
        expect(screen.getAllByText("100%")).toHaveLength(2);
        expect(screen.getByText("現金")).toBeInTheDocument();
        expect(screen.getByText("午餐")).toBeInTheDocument();
    });

    it("opens the filtered transactions list when an account row is selected", async () => {
        const user = userEvent.setup();
        getMock.mockResolvedValue({ok: true, value: summaryFixture});
        renderSummaries();

        await user.click(await screen.findByText("現金"));

        expect(screen.getByText(`TRANSACTIONS:?account_id=${ACCOUNT_ID}`)).toBeInTheDocument();
    });

    it("shows separate expense and income category cards", async () => {
        getMock.mockResolvedValue({ok: true, value: summaryFixture});
        renderSummaries();

        expect(await screen.findByText("支出分類")).toBeInTheDocument();
        expect(screen.getByText("收入分類")).toBeInTheDocument();
        expect(screen.getByText("飲食")).toBeInTheDocument();
        expect(screen.getByText("薪金")).toBeInTheDocument();
    });

    it("shows the week range as Monday to Sunday", async () => {
        getMock.mockResolvedValue({ok: true, value: summaryFixture});
        renderSummaries("/summaries?period=weekly&date=2026-09-16");

        await waitFor(() => expect(getMock).toHaveBeenCalledWith("weekly", "2026-09-16", 1, 25));

        expect(screen.getByText(/星期一/)).toBeInTheDocument();
        expect(screen.getByText(/星期日/)).toBeInTheDocument();
        expect(screen.getByText(/2026年9月14日/)).toBeInTheDocument();
        expect(screen.getByText(/2026年9月20日/)).toBeInTheDocument();
    });

    it("switches period from the first page and refetches", async () => {
        const user = userEvent.setup();
        getMock.mockResolvedValue({ok: true, value: summaryFixture});
        renderSummaries("/summaries?period=monthly&date=2026-09-16&page=2");

        await waitFor(() => expect(getMock).toHaveBeenCalledWith("monthly", "2026-09-16", 2, 25));

        await user.click(screen.getByRole("button", {name: "週"}));

        await waitFor(() => expect(getMock).toHaveBeenCalledWith("weekly", "2026-09-16", 1, 25));
    });

    it("moves to the next period by shifting the anchor date", async () => {
        const user = userEvent.setup();
        getMock.mockResolvedValue({ok: true, value: summaryFixture});
        renderSummaries("/summaries?period=weekly&date=2026-09-16");

        await waitFor(() => expect(getMock).toHaveBeenCalledWith("weekly", "2026-09-16", 1, 25));

        await user.click(screen.getByRole("button", {name: "下一期"}));

        await waitFor(() => expect(getMock).toHaveBeenCalledWith("weekly", "2026-09-23", 1, 25));
        expect(screen.getByText(/2026年9月21日/)).toBeInTheDocument();
    });

    it("paginates the period transactions", async () => {
        const user = userEvent.setup();
        getMock.mockResolvedValue({ok: true, value: paginatedSummary});
        renderSummaries();

        await screen.findByText("午餐");
        expect(screen.getByText("第 1 / 2 頁")).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "下一頁"}));

        await waitFor(() => expect(getMock).toHaveBeenCalledWith("monthly", "2026-09-16", 2, 25));
    });

    it("shows the daily calendar for monthly periods only", async () => {
        getMock.mockResolvedValue({ok: true, value: summaryFixture});
        renderSummaries();

        expect(await screen.findByText("收支日曆")).toBeInTheDocument();
        expect(screen.getByLabelText(/2026年9月14日：淨收支/)).toBeInTheDocument();
    });

    it("opens the daily summary when a calendar day is selected", async () => {
        const user = userEvent.setup();
        getMock.mockResolvedValue({ok: true, value: summaryFixture});
        renderSummaries();

        await user.click(await screen.findByRole("button", {name: /2026年9月14日：淨收支/}));

        await waitFor(() => expect(getMock).toHaveBeenCalledWith("daily", "2026-09-14", 1, 25));
    });

    it("hides the daily calendar for weekly periods", async () => {
        getMock.mockResolvedValue({ok: true, value: summaryFixture});
        renderSummaries("/summaries?period=weekly&date=2026-09-16");

        await waitFor(() => expect(getMock).toHaveBeenCalledWith("weekly", "2026-09-16", 1, 25));

        expect(screen.queryByText("收支日曆")).not.toBeInTheDocument();
    });

    it("shows an error and retries on demand", async () => {
        const user = userEvent.setup();
        getMock.mockResolvedValueOnce({ok: false, error: {code: "api_failed", message: "載入失敗"}});
        getMock.mockResolvedValueOnce({ok: true, value: summaryFixture});
        renderSummaries();

        expect(await screen.findByText("載入失敗")).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "重試"}));

        expect(await screen.findByText("淨額")).toBeInTheDocument();
    });

    it("shows the AI insight and retries with refresh after a failure", async () => {
        const user = userEvent.setup();
        getMock.mockResolvedValue({ok: true, value: summaryFixture});
        getInsightMock.mockResolvedValueOnce({ok: true, value: {...insightFixture, status: "failed", text: null, error: "bad"}});
        getInsightMock.mockResolvedValueOnce({ok: true, value: insightFixture});
        renderSummaries();

        expect(await screen.findByText("暫時未能生成 AI 收支概況")).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "重試"}));

        expect(await screen.findByText("本月收入穩定，支出集中喺飲食。")).toBeInTheDocument();
        expect(screen.getByText("飲食支出佔比最高。")).toBeInTheDocument();
        expect(getInsightMock).toHaveBeenLastCalledWith("monthly", "2026-09-16", true);
    });

    it("does not request an insight when the period has no transactions", async () => {
        getMock.mockResolvedValue({ok: true, value: {...summaryFixture, transactions: {data: [], meta: {page: 1, per_page: 25, total: 0, total_pages: 0}}}});
        renderSummaries();

        await screen.findByText("淨額");
        expect(screen.queryByText("AI 收支概況")).not.toBeInTheDocument();
        expect(getInsightMock).not.toHaveBeenCalled();
    });

    it("does not show or request the AI insight for daily periods", async () => {
        getMock.mockResolvedValue({ok: true, value: summaryFixture});
        renderSummaries("/summaries?period=daily&date=2026-09-16");

        await waitFor(() => expect(getMock).toHaveBeenCalledWith("daily", "2026-09-16", 1, 25));

        expect(screen.queryByText("AI 收支概況")).not.toBeInTheDocument();
        expect(getInsightMock).not.toHaveBeenCalled();
    });
});
