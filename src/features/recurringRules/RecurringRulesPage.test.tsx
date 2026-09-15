import React from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {createMemoryRouter, RouterProvider} from "react-router";
import type {RecurringRule, TransactionRow} from "@/data/types";
import {RecurringRulesPage} from "@/features/recurringRules/RecurringRulesPage";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";
import {domainTestState} from "@/test/domainFixtures";
import {renderWithIntl} from "@/test/renderWithIntl";

const listMock = vi.hoisted(() => vi.fn());
const createMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const deleteMock = vi.hoisted(() => vi.fn());
const pauseMock = vi.hoisted(() => vi.fn());
const resumeMock = vi.hoisted(() => vi.fn());
const runNowMock = vi.hoisted(() => vi.fn());
const skipNextMock = vi.hoisted(() => vi.fn());
const merchantsSearchMock = vi.hoisted(() => vi.fn());

vi.mock("@/data/recurringRulesRepository", () => ({
    RecurringRulesRepository: class {
        list = listMock;
        create = createMock;
        update = updateMock;
        delete = deleteMock;
        pause = pauseMock;
        resume = resumeMock;
        runNow = runNowMock;
        skipNext = skipNextMock;
    },
}));

vi.mock("@/data/merchantsRepository", () => ({
    MerchantsRepository: class {
        search = merchantsSearchMock;
        create = vi.fn();
    },
}));

const activeRule: RecurringRule = domainTestState.recurringRules[0];
const pausedRule: RecurringRule = {...activeRule, id: "50000000-0000-4000-8000-000000000002", status: "paused", note: "健身會籍"};

const createdTransaction: TransactionRow = {
    id: "40000000-0000-4000-8000-000000000099",
    account_id: activeRule.account_id,
    category_id: activeRule.category_id,
    merchant_id: activeRule.merchant_id,
    kind: "expense",
    amount_cents: 12000,
    currency: "HKD",
    occurred_at: "2026-09-15T04:00:00.000Z",
    note: "月費",
    payment_method: null,
    source: "recurring",
    transfer_account_id: null,
    image_urls: [],
};

function renderRecurringPage(entry = "/recurring-rules"): void {
    const router = createMemoryRouter(
        [
            {path: "/recurring-rules", element: <RecurringRulesPage />},
            {path: "/transactions/:id", element: <div>交易詳情</div>},
        ],
        {initialEntries: [entry]}
    );
    renderWithIntl(
        <React.Fragment>
            <RouterProvider router={router} />
        </React.Fragment>
    );
}

beforeEach(() => {
    listMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
    pauseMock.mockReset();
    resumeMock.mockReset();
    runNowMock.mockReset();
    skipNextMock.mockReset();
    merchantsSearchMock.mockReset();

    listMock.mockResolvedValue({ok: true, value: [activeRule]});
    createMock.mockResolvedValue({ok: true, value: activeRule});
    updateMock.mockResolvedValue({ok: true, value: activeRule});
    deleteMock.mockResolvedValue({ok: true, value: true});
    pauseMock.mockResolvedValue({ok: true, value: {...activeRule, status: "paused"}});
    resumeMock.mockResolvedValue({ok: true, value: activeRule});
    runNowMock.mockResolvedValue({ok: true, value: createdTransaction});
    skipNextMock.mockResolvedValue({ok: true, value: activeRule});
    merchantsSearchMock.mockResolvedValue({ok: true, value: domainTestState.merchants});

    useAuthStore.setState({token: "test-token", user: null, hydrated: true});
    useAppStore.setState({
        accounts: domainTestState.accounts,
        categories: domainTestState.categories,
        merchants: domainTestState.merchants,
        referenceLoaded: true,
    });
});

describe("RecurringRulesPage", () => {
    it("lists active rules with schedule, amount and related names", async () => {
        renderRecurringPage();

        expect(await screen.findByText("月費")).toBeInTheDocument();
        expect(screen.getByText("每月 1 日")).toBeInTheDocument();
        expect(screen.getByText("-HK$120.00")).toBeInTheDocument();
        expect(screen.getByText("現金")).toBeInTheDocument();
        expect(screen.getByText("飲食")).toBeInTheDocument();
        expect(screen.getByText("街角咖啡")).toBeInTheDocument();
        expect(listMock).toHaveBeenCalledWith("active");
    });

    it("switches tabs and fetches the selected status", async () => {
        const user = userEvent.setup();
        renderRecurringPage();

        await screen.findByText("月費");
        listMock.mockResolvedValue({ok: true, value: [pausedRule]});
        await user.click(screen.getByRole("tab", {name: "已暫停"}));

        await waitFor(() => expect(listMock).toHaveBeenLastCalledWith("paused"));
        expect(await screen.findByText("健身會籍")).toBeInTheDocument();
    });

    it("pauses an active rule and reloads", async () => {
        const user = userEvent.setup();
        renderRecurringPage();

        await screen.findByText("月費");
        await user.click(screen.getByRole("button", {name: "暫停"}));

        await waitFor(() => expect(pauseMock).toHaveBeenCalledWith(activeRule.id));
        await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2));
    });

    it("resumes a paused rule", async () => {
        const user = userEvent.setup();
        listMock.mockResolvedValue({ok: true, value: [pausedRule]});
        renderRecurringPage("/recurring-rules?status=paused");

        await screen.findByText("健身會籍");
        await user.click(screen.getByRole("button", {name: "恢復"}));

        await waitFor(() => expect(resumeMock).toHaveBeenCalledWith(pausedRule.id));
    });

    it("runs a rule now after confirmation and links to the created transaction", async () => {
        const user = userEvent.setup();
        renderRecurringPage();

        await screen.findByText("月費");
        await user.click(screen.getByRole("button", {name: "立即執行"}));

        const dialog = await screen.findByRole("alertdialog");
        await user.click(within(dialog).getByRole("button", {name: "確認"}));

        await waitFor(() => expect(runNowMock).toHaveBeenCalledWith(activeRule.id));
        expect(await screen.findByText("已產生交易")).toBeInTheDocument();
        expect(screen.getByRole("link", {name: "查看交易"})).toHaveAttribute("href", `/transactions/${createdTransaction.id}`);
    });

    it("shows the already-materialized message when today's transaction exists", async () => {
        const user = userEvent.setup();
        runNowMock.mockResolvedValue({ok: false, error: {code: "conflict_already_materialized", message: "今日已經產生過交易"}});
        renderRecurringPage();

        await screen.findByText("月費");
        await user.click(screen.getByRole("button", {name: "立即執行"}));
        const dialog = await screen.findByRole("alertdialog");
        await user.click(within(dialog).getByRole("button", {name: "確認"}));

        expect(await screen.findByText("今日已經產生過交易")).toBeInTheDocument();
    });

    it("skips the next occurrence after listing the skipped date", async () => {
        const user = userEvent.setup();
        renderRecurringPage();

        await screen.findByText("月費");
        await user.click(screen.getByRole("button", {name: "跳過下次"}));

        const dialog = await screen.findByRole("alertdialog");
        expect(within(dialog).getByText(/2026年10月1日/)).toBeInTheDocument();
        await user.click(within(dialog).getByRole("button", {name: "確認"}));

        await waitFor(() => expect(skipNextMock).toHaveBeenCalledWith(activeRule.id));
    });

    it("deletes the rule after confirming that generated transactions are kept", async () => {
        const user = userEvent.setup();
        renderRecurringPage();

        await screen.findByText("月費");
        await user.click(screen.getByRole("button", {name: "刪除"}));

        const dialog = await screen.findByRole("alertdialog");
        expect(within(dialog).getByText("只會刪除呢條規則，已產生嘅交易會保留。")).toBeInTheDocument();
        await user.click(within(dialog).getByRole("button", {name: "刪除"}));

        await waitFor(() => expect(deleteMock).toHaveBeenCalledWith(activeRule.id));
    });

    it("shows an empty state with a create action", async () => {
        listMock.mockResolvedValue({ok: true, value: []});
        renderRecurringPage();

        expect(await screen.findByText("沒有進行中嘅定期交易")).toBeInTheDocument();
        expect(screen.getAllByRole("button", {name: /新增定期交易/}).length).toBeGreaterThan(0);
    });

    it("creates a rule from the drawer form", async () => {
        const user = userEvent.setup();
        renderRecurringPage();

        await screen.findByText("月費");
        await user.click(screen.getByRole("button", {name: "新增定期交易"}));

        const amountInput = await screen.findByLabelText("金額");
        await user.type(amountInput, "88.50");
        await user.click(screen.getByRole("button", {name: "新增"}));

        await waitFor(() => expect(createMock).toHaveBeenCalledWith(expect.objectContaining({amount_cents: 8850, kind: "expense", frequency: "monthly"})));
        await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2));
    });
});
