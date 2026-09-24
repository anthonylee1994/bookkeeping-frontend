import React from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {screen} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router";
import type {AiPreview} from "@/data/types";
import {TransactionsLayout} from "@/features/transactions/TransactionsLayout";
import {useAppStore} from "@/stores/appStore";
import {useUiStore} from "@/stores/uiStore";
import {domainTestState} from "@/test/domainFixtures";
import {renderWithIntl} from "@/test/renderWithIntl";

vi.mock("@/features/transactions/TransactionsPage", () => ({
    TransactionsPage: () => <div>TRANSACTION LIST</div>,
}));

const DetailDrawer = () => <div>TRANSACTION DETAIL DRAWER</div>;
const NewForm = () => <div>NEW TRANSACTION FORM</div>;

const batchPreview: AiPreview = {
    id: "80000000-0000-4000-8000-000000000001",
    source: "text",
    image_urls: [],
    sha256: "a".repeat(64),
    status: "success",
    parsed: {amount_cents: 1000, kind: "expense"},
    parsed_items: [{parsed: {amount_cents: 1000, kind: "expense"}}],
};

function renderLayout(entry: string): void {
    renderWithIntl(
        <React.Fragment>
            <MemoryRouter initialEntries={[entry]}>
                <Routes>
                    <Route path="/transactions" element={<TransactionsLayout />}>
                        <Route index element={null} />
                        <Route path="new" element={<NewForm />} />
                        <Route path=":id" element={<DetailDrawer />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        </React.Fragment>
    );
}

beforeEach(() => {
    useUiStore.getState().resetUiState();
    useAppStore.setState({...domainTestState, referenceLoaded: true});
});

describe("TransactionsLayout", () => {
    it("keeps the transaction list mounted on the list route", () => {
        renderLayout("/transactions");

        expect(screen.getByText("TRANSACTION LIST")).toBeInTheDocument();
    });

    it("keeps the transaction list mounted behind the detail drawer", () => {
        renderLayout("/transactions/abc");

        expect(screen.getByText("TRANSACTION LIST")).toBeInTheDocument();
        expect(screen.getByText("TRANSACTION DETAIL DRAWER")).toBeInTheDocument();
    });

    it("waits for the new-transaction drawer to leave before opening the batch drawer", () => {
        useUiStore.getState().openAiBatch(batchPreview);
        renderLayout("/transactions/new");

        // 仍然停喺新增交易 route：覆核 drawer 唔可以開，否則兩層交接會撞。
        expect(screen.getByText("NEW TRANSACTION FORM")).toBeInTheDocument();
        expect(screen.queryByText("AI 拆單覆核")).not.toBeInTheDocument();
    });

    it("opens the batch drawer once the new-transaction drawer is gone", async () => {
        useUiStore.getState().openAiBatch(batchPreview);
        renderLayout("/transactions");

        expect(await screen.findByText("AI 拆單覆核")).toBeInTheDocument();
        expect(screen.getByText("TRANSACTION LIST")).toBeInTheDocument();
    });
});
