import React from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {AiQuerySearch} from "@/features/transactions/AiQuerySearch";
import {useAuthStore} from "@/stores/authStore";
import {renderWithIntl} from "@/test/renderWithIntl";

const queryMock = vi.hoisted(() => vi.fn());

vi.mock("@/data/receiptsRepository", () => ({
    MAX_QUERY_TEXT: 500,
    ReceiptsRepository: class {
        query = queryMock;
    },
}));

beforeEach(() => {
    queryMock.mockReset();
    useAuthStore.setState({token: "test-token", user: null, hydrated: true});
});

describe("AiQuerySearch", () => {
    it("keeps the panel closed until opened and disables an empty submit", async () => {
        const user = userEvent.setup();
        renderWithIntl(
            <React.Fragment>
                <AiQuerySearch onApply={vi.fn()} />
            </React.Fragment>
        );

        expect(screen.queryByLabelText("AI 搜尋交易")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "AI 搜尋"}));
        expect(screen.getByRole("button", {name: "搜尋"})).toBeDisabled();

        await user.type(screen.getByLabelText("AI 搜尋交易"), "上月支出");
        expect(screen.getByRole("button", {name: "搜尋"})).toBeEnabled();
    });

    it("maps a successful answer to filters and hands them to the parent", async () => {
        const user = userEvent.setup();
        const onApply = vi.fn();
        queryMock.mockResolvedValue({ok: true, value: {status: "success", filters: {from: "2026-08-01", to: "2026-08-31", kind: "expense"}, explanation: "上月支出"}});
        renderWithIntl(
            <React.Fragment>
                <AiQuerySearch onApply={onApply} />
            </React.Fragment>
        );

        await user.click(screen.getByRole("button", {name: "AI 搜尋"}));
        await user.type(screen.getByLabelText("AI 搜尋交易"), "上月支出");
        await user.click(screen.getByRole("button", {name: "搜尋"}));

        await waitFor(() => expect(onApply).toHaveBeenCalledWith({from: "2026-08-01", to: "2026-08-31", kind: "expense"}, "上月支出"));
        expect(queryMock).toHaveBeenCalledWith("上月支出");
        expect(screen.getByText("已套用：上月支出")).toBeInTheDocument();
        expect(screen.getByLabelText("AI 搜尋交易")).toHaveValue("");
    });

    it("clears the applied message when the panel is collapsed", async () => {
        const user = userEvent.setup();
        queryMock.mockResolvedValue({ok: true, value: {status: "success", filters: {q: "Starbucks"}, explanation: "Starbucks"}});
        renderWithIntl(
            <React.Fragment>
                <AiQuerySearch onApply={vi.fn()} />
            </React.Fragment>
        );

        await user.click(screen.getByRole("button", {name: "AI 搜尋"}));
        await user.type(screen.getByLabelText("AI 搜尋交易"), "Starbucks");
        await user.click(screen.getByRole("button", {name: "搜尋"}));
        expect(await screen.findByText("已套用：Starbucks")).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "收起 AI 搜尋"}));
        expect(screen.queryByText("已套用：Starbucks")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "AI 搜尋"}));
        expect(screen.queryByText("已套用：Starbucks")).not.toBeInTheDocument();
    });

    it("shows a failure and keeps the sentence when no filter is understood", async () => {
        const user = userEvent.setup();
        const onApply = vi.fn();
        queryMock.mockResolvedValue({ok: true, value: {status: "partial", filters: null, explanation: null}});
        renderWithIntl(
            <React.Fragment>
                <AiQuerySearch onApply={onApply} />
            </React.Fragment>
        );

        await user.click(screen.getByRole("button", {name: "AI 搜尋"}));
        await user.type(screen.getByLabelText("AI 搜尋交易"), "今日天氣好好");
        await user.click(screen.getByRole("button", {name: "搜尋"}));

        expect(await screen.findByText("AI 解讀唔到查詢條件，請試清楚啲或者用返上面嘅篩選。")).toBeInTheDocument();
        expect(onApply).not.toHaveBeenCalled();
        expect(screen.getByLabelText("AI 搜尋交易")).toHaveValue("今日天氣好好");
        expect(screen.getByRole("button", {name: "重試"})).toBeInTheDocument();
    });

    it("surfaces repository errors and keeps the sentence for retry", async () => {
        const user = userEvent.setup();
        queryMock.mockResolvedValue({ok: false, error: {code: "api_failed", message: "暫時無法連接服務"}});
        renderWithIntl(
            <React.Fragment>
                <AiQuerySearch onApply={vi.fn()} />
            </React.Fragment>
        );

        await user.click(screen.getByRole("button", {name: "AI 搜尋"}));
        await user.type(screen.getByLabelText("AI 搜尋交易"), "上月支出");
        await user.click(screen.getByRole("button", {name: "搜尋"}));

        expect(await screen.findByText("暫時無法連接服務")).toBeInTheDocument();
        expect(screen.getByLabelText("AI 搜尋交易")).toHaveValue("上月支出");
    });
});
