import React from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {createMemoryRouter, RouterProvider, useLocation} from "react-router";
import type {Transaction} from "@/data/types";
import {TransactionForm} from "@/features/transactions/TransactionForm";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";
import {useUiStore} from "@/stores/uiStore";
import {domainTestState} from "@/test/domainFixtures";
import {renderWithIntl} from "@/test/renderWithIntl";

const createMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const interpretMock = vi.hoisted(() => vi.fn());
const confirmMock = vi.hoisted(() => vi.fn());
const merchantSearchMock = vi.hoisted(() => vi.fn());
const merchantCreateMock = vi.hoisted(() => vi.fn());
const merchantUpdateMock = vi.hoisted(() => vi.fn());

vi.mock("@/data/transactionsRepository", () => ({
    TransactionsRepository: class {
        create = createMock;
        update = updateMock;
    },
}));

vi.mock("@/data/receiptsRepository", () => ({
    MAX_INTERPRET_TEXT: 500,
    ReceiptsRepository: class {
        interpret = interpretMock;
        confirm = confirmMock;
    },
}));

vi.mock("@/data/merchantsRepository", () => ({
    MerchantsRepository: class {
        search = merchantSearchMock;
        create = merchantCreateMock;
        update = merchantUpdateMock;
    },
}));

const created: Transaction = {
    ...domainTestState.transactions[0],
    id: "40000000-0000-4000-8000-000000000099",
    kind: "expense",
    amount_cents: 1250,
};

const DetailStub = () => {
    const location = useLocation();
    return <div>{`DETAIL:${location.search}`}</div>;
};

function renderForm(transaction: Transaction | null = null, initialEntry = "/transactions/new"): void {
    const router = createMemoryRouter(
        [
            {
                path: "/transactions/new",
                element: <TransactionForm transaction={transaction} accounts={domainTestState.accounts} categories={domainTestState.categories} merchants={domainTestState.merchants} />,
            },
            {path: "/transactions/:id", element: <DetailStub />},
            {path: "/transactions", element: <div>LIST</div>},
        ],
        {initialEntries: [initialEntry]}
    );
    renderWithIntl(
        <React.Fragment>
            <RouterProvider router={router} />
        </React.Fragment>
    );
}

beforeEach(() => {
    createMock.mockReset();
    updateMock.mockReset();
    interpretMock.mockReset();
    confirmMock.mockReset();
    merchantSearchMock.mockReset();
    merchantCreateMock.mockReset();
    merchantUpdateMock.mockReset();
    merchantSearchMock.mockResolvedValue({ok: true, value: domainTestState.merchants});
    useAuthStore.setState({token: "test-token", user: null, hydrated: true});
    useAppStore.getState().resetAppState();
    useUiStore.getState().resetUiState();
});

describe("TransactionForm", () => {
    it("selects the first account by default for a new transaction", () => {
        renderForm();

        expect(screen.getByLabelText("帳戶")).toHaveValue(domainTestState.accounts[0].id);
    });

    it("switches income and expense fields and filters categories by kind", async () => {
        const user = userEvent.setup();
        renderForm();

        expect(screen.getByLabelText("分類")).toBeInTheDocument();
        expect(screen.getByLabelText("商戶")).toBeInTheDocument();
        expect(within(screen.getByLabelText("分類")).getByRole("option", {name: "飲食"})).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "收入"}));

        expect(within(screen.getByLabelText("分類")).getByRole("option", {name: "工資"})).toBeInTheDocument();
        expect(within(screen.getByLabelText("分類")).queryByRole("option", {name: "飲食"})).not.toBeInTheDocument();
    });

    it("shows transfer accounts only and validates the destination", async () => {
        const user = userEvent.setup();
        renderForm();

        await user.click(screen.getByRole("button", {name: "轉帳"}));

        expect(screen.queryByLabelText("分類")).not.toBeInTheDocument();
        expect(screen.queryByLabelText("商戶")).not.toBeInTheDocument();
        expect(screen.getByLabelText("轉出帳戶")).toBeInTheDocument();
        expect(screen.getByLabelText("轉入帳戶")).toBeInTheDocument();

        await user.type(screen.getByLabelText("金額"), "100");
        await user.selectOptions(screen.getByLabelText("轉出帳戶"), domainTestState.accounts[0].id);
        await user.click(screen.getByRole("button", {name: "新增"}));

        expect(await screen.findByText("請選擇轉入帳戶")).toBeInTheDocument();
        expect(createMock).not.toHaveBeenCalled();
    });

    it("validates the required amount without calling the repository", async () => {
        const user = userEvent.setup();
        renderForm();

        await user.click(screen.getByRole("button", {name: "新增"}));

        expect(await screen.findByText("請輸入金額")).toBeInTheDocument();
        expect(screen.getByLabelText("帳戶")).toHaveValue(domainTestState.accounts[0].id);
        expect(createMock).not.toHaveBeenCalled();
    });

    it("creates an expense with cents and a stable idempotency key", async () => {
        const user = userEvent.setup();
        createMock.mockResolvedValue({ok: true, value: created});
        renderForm();

        await user.type(screen.getByLabelText("金額"), "12.50");
        await user.selectOptions(screen.getByLabelText("帳戶"), domainTestState.accounts[0].id);
        await user.click(screen.getByRole("button", {name: "新增"}));

        await waitFor(() => expect(screen.getByText("DETAIL:")).toBeInTheDocument());
        expect(createMock).toHaveBeenCalledWith(expect.objectContaining({kind: "expense", amount_cents: 1250, account_id: domainTestState.accounts[0].id}), expect.stringMatching(/^[0-9a-f-]{36}$/));
        expect(createMock.mock.calls[0][0]).not.toHaveProperty("source");
        expect(useAppStore.getState().transactions[0]).toEqual(created);
    });

    it("prefills from AI text and confirms through /ai/confirm", async () => {
        const user = userEvent.setup();
        const preview = {
            id: "80000000-0000-4000-8000-000000000001",
            source: "text" as const,
            image_urls: [],
            sha256: "a".repeat(64),
            status: "success" as const,
            parsed: {amount_cents: 1250, kind: "expense" as const, occurred_at: "2026-09-14T12:00:00+08:00", merchant_name: "街角咖啡", confidence: 0.9},
        };
        interpretMock.mockResolvedValue({ok: true, value: preview});
        confirmMock.mockResolvedValue({ok: true, value: created});
        renderForm();

        await user.type(screen.getByLabelText("AI 打字記帳"), "街角咖啡 12.5");
        await user.click(screen.getByRole("button", {name: "解讀"}));

        await waitFor(() => expect(screen.getByLabelText("金額")).toHaveValue("12.50"));
        await user.click(screen.getByRole("button", {name: "新增"}));

        await waitFor(() => expect(screen.getByText("DETAIL:")).toBeInTheDocument());
        expect(confirmMock).toHaveBeenCalledWith(expect.objectContaining({amount_cents: 1250, kind: "expense"}), preview.id, expect.stringMatching(/^[0-9a-f-]{36}$/));
        expect(createMock).not.toHaveBeenCalled();
    });

    it("hands a multi-transaction interpretation to the list-level batch drawer", async () => {
        const user = userEvent.setup();
        const preview = {
            id: "80000000-0000-4000-8000-000000000010",
            source: "text" as const,
            image_urls: [],
            sha256: "a".repeat(64),
            status: "success" as const,
            parsed: {amount_cents: 3000, kind: "expense" as const, occurred_at: "2026-09-14T08:00:00+08:00", confidence: 0.9},
            parsed_items: [
                {parsed: {amount_cents: 3000, kind: "expense" as const, occurred_at: "2026-09-14T08:00:00+08:00", confidence: 0.9}},
                {parsed: {amount_cents: 5000, kind: "expense" as const, occurred_at: "2026-09-14T12:00:00+08:00", confidence: 0.9}},
            ],
        };
        interpretMock.mockResolvedValue({ok: true, value: preview});
        confirmMock.mockResolvedValue({ok: true, value: created});
        renderForm();

        await user.type(screen.getByLabelText("AI 打字記帳"), "早餐 30 午餐 50");
        await user.click(screen.getByRole("button", {name: "解讀"}));

        // 多筆：閂新增交易 drawer（返列表），並交俾列表層嘅批量覆核 drawer；唔預填表單、唔即時入帳。
        expect(await screen.findByText("LIST")).toBeInTheDocument();
        expect(useUiStore.getState().pendingAiBatch?.id).toBe(preview.id);
        expect(confirmMock).not.toHaveBeenCalled();
    });

    it("seeds the merchant autocomplete with an unmatched AI merchant name", async () => {
        const user = userEvent.setup();
        const preview = {
            id: "80000000-0000-4000-8000-000000000002",
            source: "text" as const,
            image_urls: [],
            sha256: "a".repeat(64),
            status: "success" as const,
            parsed: {amount_cents: 1000, kind: "expense" as const, occurred_at: "2026-09-14T12:00:00+08:00", merchant_name: "食咗杯", confidence: 0.9},
        };
        interpretMock.mockResolvedValue({ok: true, value: preview});
        renderForm();

        await user.type(screen.getByLabelText("AI 打字記帳"), "食咗杯 10 蚊");
        await user.click(screen.getByRole("button", {name: "解讀"}));

        await waitFor(() => expect(screen.getByLabelText("商戶")).toHaveValue("食咗杯"));
        expect(screen.getByRole("button", {name: "新增商戶「食咗杯」"})).toBeInTheDocument();
    });

    it("clears the list filters and returns to the first page after creating", async () => {
        const user = userEvent.setup();
        createMock.mockResolvedValue({ok: true, value: created});
        renderForm(null, "/transactions/new?keyword=%E5%92%96%E5%95%A1&page=3");

        await user.type(screen.getByLabelText("金額"), "12.50");
        await user.click(screen.getByRole("button", {name: "新增"}));

        await waitFor(() => expect(screen.getByText("DETAIL:")).toBeInTheDocument());
    });

    it("applies a merchant default category when the merchant is selected", async () => {
        const user = userEvent.setup();
        renderForm();

        expect(screen.getByLabelText("分類")).toHaveValue("");

        await user.type(screen.getByLabelText("商戶"), "街角咖啡");

        await waitFor(() => expect(screen.getByLabelText("分類")).toHaveValue(domainTestState.categories[1].id));
    });

    it("creates a new merchant inline and selects it", async () => {
        const user = userEvent.setup();
        const merchant = {...domainTestState.merchants[0], id: "30000000-0000-4000-8000-000000000099", name: "新商戶", default_category_id: null};
        merchantCreateMock.mockResolvedValue({ok: true, value: merchant});
        renderForm();

        await user.type(screen.getByLabelText("商戶"), merchant.name);
        await user.click(screen.getByRole("button", {name: `新增商戶「${merchant.name}」`}));

        expect(merchantCreateMock).toHaveBeenCalledWith({name: merchant.name});
        expect(screen.getByLabelText("商戶")).toHaveValue(merchant.name);
        expect(useAppStore.getState().merchants).toContainEqual(merchant);
    });

    it("saves the picked category as the new merchant's default", async () => {
        const user = userEvent.setup();
        const merchant = {...domainTestState.merchants[0], id: "30000000-0000-4000-8000-000000000099", name: "新商戶", default_category_id: null};
        merchantCreateMock.mockResolvedValue({ok: true, value: merchant});
        merchantUpdateMock.mockResolvedValue({ok: true, value: {...merchant, default_category_id: domainTestState.categories[1].id}});
        renderForm();

        await user.type(screen.getByLabelText("商戶"), merchant.name);
        await user.click(screen.getByRole("button", {name: `新增商戶「${merchant.name}」`}));
        await user.selectOptions(screen.getByLabelText("分類"), domainTestState.categories[1].id);

        await waitFor(() => expect(merchantUpdateMock).toHaveBeenCalledWith(merchant.id, {name: merchant.name, default_category_id: domainTestState.categories[1].id}));
    });

    it("warns before cancelling a dirty form", async () => {
        const user = userEvent.setup();
        renderForm();

        await user.type(screen.getByLabelText("金額"), "12");
        await user.click(screen.getByRole("button", {name: "取消"}));

        expect(await screen.findByRole("alertdialog")).toHaveTextContent("放棄未儲存內容？");
        await user.click(screen.getByRole("button", {name: "繼續編輯"}));
        expect(screen.getByLabelText("金額")).toHaveValue("12");
    });

    it("updates without sending source", async () => {
        const user = userEvent.setup();
        const edited = {...domainTestState.transactions[0], note: "已修改"};
        updateMock.mockResolvedValue({ok: true, value: edited});
        renderForm(domainTestState.transactions[0], "/transactions/new?keyword=%E5%92%96%E5%95%A1");

        await user.clear(screen.getByLabelText("備註"));
        await user.type(screen.getByLabelText("備註"), "已修改");
        await user.click(screen.getByRole("button", {name: "儲存"}));

        await waitFor(() => expect(screen.getByText("DETAIL:?keyword=%E5%92%96%E5%95%A1")).toBeInTheDocument());
        const input = updateMock.mock.calls[0][1] as Record<string, unknown>;
        expect(input).not.toHaveProperty("source");
        expect(input.note).toBe("已修改");
    });
});
