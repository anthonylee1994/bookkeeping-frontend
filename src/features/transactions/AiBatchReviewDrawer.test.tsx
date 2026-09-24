import React from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {Mock} from "vitest";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {AiPreview} from "@/data/types";
import {AiBatchReviewDrawer} from "@/features/transactions/AiBatchReviewDrawer";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";
import {domainTestState} from "@/test/domainFixtures";
import {renderWithIntl} from "@/test/renderWithIntl";

const confirmMock = vi.hoisted(() => vi.fn());
const merchantSearchMock = vi.hoisted(() => vi.fn());
const merchantCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/data/receiptsRepository", async importOriginal => {
    const actual = await importOriginal<typeof import("@/data/receiptsRepository")>();
    return {
        ...actual,
        ReceiptsRepository: class {
            confirm = confirmMock;
        },
    };
});

vi.mock("@/data/merchantsRepository", () => ({
    MerchantsRepository: class {
        search = merchantSearchMock;
        create = merchantCreateMock;
    },
}));

const IMPORT_LOG_ID = "80000000-0000-4000-8000-000000000011";

const batchPreview: AiPreview = {
    id: IMPORT_LOG_ID,
    source: "text",
    image_urls: [],
    sha256: "a".repeat(64),
    status: "success",
    parsed: {amount_cents: 3000, kind: "expense", occurred_at: "2026-09-14T08:00:00+08:00"},
    parsed_items: [
        {parsed: {amount_cents: 3000, kind: "expense", occurred_at: "2026-09-14T08:00:00+08:00", merchant_name: "茶餐廳", confidence: 0.9}},
        {parsed: {amount_cents: 5000, kind: "expense", occurred_at: "2026-09-14T12:00:00+08:00", confidence: 0.9}},
    ],
};

const reference = {accounts: domainTestState.accounts, categories: domainTestState.categories, merchants: domainTestState.merchants};

let onCloseMock: Mock<() => void>;
let onConfirmedMock: Mock<() => void>;

function renderDrawer(preview: AiPreview | null = batchPreview): void {
    renderWithIntl(
        <React.Fragment>
            <AiBatchReviewDrawer open={preview !== null} preview={preview} reference={reference} onClose={onCloseMock} onConfirmed={onConfirmedMock} />
        </React.Fragment>
    );
}

beforeEach(() => {
    useAuthStore.setState({token: "test-token", user: null, hydrated: true});
    useAppStore.setState({...domainTestState, referenceLoaded: true});
    onCloseMock = vi.fn<() => void>();
    onConfirmedMock = vi.fn<() => void>();
    confirmMock.mockReset().mockResolvedValue({ok: true, value: {...domainTestState.transactions[0], id: "40000000-0000-4000-8000-0000000000b1"}});
    merchantSearchMock.mockReset().mockResolvedValue({ok: true, value: domainTestState.merchants});
    merchantCreateMock.mockReset();
});

describe("AiBatchReviewDrawer", () => {
    it("renders one editable card per parsed transaction", () => {
        renderDrawer();

        expect(screen.getByText("AI 拆單覆核")).toBeInTheDocument();
        expect(screen.getByText("以下 2 筆交易由一句話拆出，可逐筆修改或刪除；入帳前請自行核對。")).toBeInTheDocument();
        expect(screen.getByText("第 1 筆")).toBeInTheDocument();
        expect(screen.getByText("第 2 筆")).toBeInTheDocument();
        expect(screen.getAllByLabelText("金額").map(input => (input as HTMLInputElement).value)).toEqual(["30.00", "50.00"]);
    });

    it("lets the user delete a row before confirming", async () => {
        const user = userEvent.setup();
        renderDrawer();

        await user.click(screen.getAllByRole("button", {name: "刪除這筆"})[0]);
        expect(screen.queryByText("第 2 筆")).not.toBeInTheDocument();
        expect(screen.getByRole("button", {name: "全部入帳（1）"})).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "全部入帳（1）"}));

        await waitFor(() => expect(confirmMock).toHaveBeenCalledTimes(1));
        expect(confirmMock.mock.calls[0][0]).toMatchObject({amount_cents: 5000, source: "ai", image_urls: []});
    });

    it("confirms every row with the same log id and a distinct idempotency key", async () => {
        const user = userEvent.setup();
        renderDrawer();

        await user.click(screen.getByRole("button", {name: "全部入帳（2）"}));

        await waitFor(() => expect(confirmMock).toHaveBeenCalledTimes(2));
        expect(confirmMock.mock.calls.map(call => call[1])).toEqual([IMPORT_LOG_ID, IMPORT_LOG_ID]);
        expect(confirmMock.mock.calls[0][2]).not.toBe(confirmMock.mock.calls[1][2]);
        expect(confirmMock.mock.calls[0][0]).toMatchObject({amount_cents: 3000});
        expect(confirmMock.mock.calls[1][0]).toMatchObject({amount_cents: 5000});
        await waitFor(() => expect(onConfirmedMock).toHaveBeenCalledTimes(1));
    });

    it("keeps the drawer on a failure and reuses the same idempotency key on retry", async () => {
        const user = userEvent.setup();
        confirmMock.mockReset();
        confirmMock.mockResolvedValueOnce({ok: false, error: {code: "api_failed", message: "暫時無法連接服務"}});
        confirmMock.mockResolvedValue({ok: true, value: {...domainTestState.transactions[0], id: "40000000-0000-4000-8000-0000000000b2"}});
        renderDrawer();

        await user.click(screen.getByRole("button", {name: "全部入帳（2）"}));
        expect(await screen.findByText("暫時無法連接服務")).toBeInTheDocument();
        expect(confirmMock).toHaveBeenCalledTimes(1);
        expect(onConfirmedMock).not.toHaveBeenCalled();

        await user.click(screen.getByRole("button", {name: "全部入帳（2）"}));
        await waitFor(() => expect(confirmMock).toHaveBeenCalledTimes(3));
        expect(confirmMock.mock.calls[1][2]).toBe(confirmMock.mock.calls[0][2]);
        expect(confirmMock.mock.calls[1][2]).not.toBe(confirmMock.mock.calls[2][2]);
        await waitFor(() => expect(onConfirmedMock).toHaveBeenCalledTimes(1));
    });

    it("calls onClose when the review is dismissed", async () => {
        const user = userEvent.setup();
        renderDrawer();

        const dialog = screen.getByRole("dialog");
        await user.click(dialog.querySelector("button[aria-label='關閉']") as HTMLButtonElement);

        expect(onCloseMock).toHaveBeenCalledTimes(1);
        expect(confirmMock).not.toHaveBeenCalled();
    });
});
