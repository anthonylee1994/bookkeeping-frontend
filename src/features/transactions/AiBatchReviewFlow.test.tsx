import React from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {createMemoryRouter, RouterProvider} from "react-router";
import {TransactionsLayout, TransactionFormRoute} from "@/features/transactions/TransactionsLayout";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";
import {useUiStore} from "@/stores/uiStore";
import {domainTestState} from "@/test/domainFixtures";
import {renderWithIntl} from "@/test/renderWithIntl";

const interpretMock = vi.hoisted(() => vi.fn());
const confirmMock = vi.hoisted(() => vi.fn());
const merchantSearchMock = vi.hoisted(() => vi.fn());
const merchantCreateMock = vi.hoisted(() => vi.fn());
const merchantUpdateMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/transactions/TransactionsPage", () => ({
    TransactionsPage: () => <div>TRANSACTION LIST</div>,
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

vi.mock("@/data/transactionsRepository", () => ({
    TransactionsRepository: class {
        create = vi.fn();
        update = vi.fn();
    },
}));

const multiPreview = {
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

function renderFlow(): void {
    const router = createMemoryRouter(
        [
            {
                path: "/transactions",
                element: <TransactionsLayout />,
                children: [
                    {index: true, element: null},
                    {path: "new", element: <TransactionFormRoute />},
                ],
            },
        ],
        {initialEntries: ["/transactions/new"]}
    );
    renderWithIntl(
        <React.Fragment>
            <RouterProvider router={router} />
        </React.Fragment>
    );
}

beforeEach(() => {
    useAuthStore.setState({token: "test-token", user: null, hydrated: true});
    useAppStore.setState({...domainTestState, referenceLoaded: true, transactionsRevision: 0});
    useUiStore.getState().resetUiState();
    interpretMock.mockReset().mockResolvedValue({ok: true, value: multiPreview});
    confirmMock.mockReset().mockResolvedValue({ok: true, value: {...domainTestState.transactions[0], id: "40000000-0000-4000-8000-0000000000c1"}});
    merchantSearchMock.mockReset().mockResolvedValue({ok: true, value: domainTestState.merchants});
    merchantCreateMock.mockReset();
    merchantUpdateMock.mockReset();
});

describe("AI batch review flow", () => {
    it("closes the new-transaction drawer and opens the batch drawer on the list", async () => {
        const user = userEvent.setup();
        renderFlow();
        expect(await screen.findByText("新增交易")).toBeInTheDocument();

        await user.type(screen.getByLabelText("AI 打字記帳"), "早餐 30 午餐 50");
        await user.click(screen.getByRole("button", {name: "解讀"}));

        // 新增交易 drawer 閂咗，列表層開批量覆核 drawer。
        await waitFor(() => expect(screen.queryByText("新增交易")).not.toBeInTheDocument());
        const dialog = await screen.findByRole("dialog", {name: /AI 拆單覆核/});
        expect(
            within(dialog)
                .getAllByLabelText("金額")
                .map(input => (input as HTMLInputElement).value)
        ).toEqual(["30.00", "50.00"]);

        await user.click(screen.getByRole("button", {name: "全部入帳（2）"}));

        await waitFor(() => expect(confirmMock).toHaveBeenCalledTimes(2));
        expect(confirmMock.mock.calls.map(call => call[1])).toEqual([multiPreview.id, multiPreview.id]);
        await waitFor(() => expect(screen.queryByText("AI 拆單覆核")).not.toBeInTheDocument());
        expect(useAppStore.getState().transactionsRevision).toBeGreaterThan(0);
        expect(useUiStore.getState().pendingAiBatch).toBeNull();
    });

    it("dismisses the batch drawer without confirming", async () => {
        const user = userEvent.setup();
        renderFlow();

        await user.type(screen.getByLabelText("AI 打字記帳"), "早餐 30 午餐 50");
        await user.click(screen.getByRole("button", {name: "解讀"}));

        const dialog = await screen.findByRole("dialog", {name: /AI 拆單覆核/});
        await user.click(within(dialog).getAllByRole("button", {name: "關閉"})[0]);

        await waitFor(() => expect(screen.queryByText("AI 拆單覆核")).not.toBeInTheDocument());
        expect(confirmMock).not.toHaveBeenCalled();
        expect(useUiStore.getState().pendingAiBatch).toBeNull();
    });
});
