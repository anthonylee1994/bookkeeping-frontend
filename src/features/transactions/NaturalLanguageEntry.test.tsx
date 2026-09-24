import React from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {AiPreview} from "@/data/types";
import {NaturalLanguageEntry} from "@/features/transactions/NaturalLanguageEntry";
import {useAuthStore} from "@/stores/authStore";
import {renderWithIntl} from "@/test/renderWithIntl";

const interpretMock = vi.hoisted(() => vi.fn());

vi.mock("@/data/receiptsRepository", () => ({
    MAX_INTERPRET_TEXT: 500,
    ReceiptsRepository: class {
        interpret = interpretMock;
    },
}));

function preview(parsed: AiPreview["parsed"], overrides: Partial<AiPreview> = {}): AiPreview {
    return {
        id: "80000000-0000-4000-8000-000000000001",
        source: "text",
        image_urls: [],
        sha256: "a".repeat(64),
        status: "success",
        parsed,
        ...overrides,
    };
}

beforeEach(() => {
    interpretMock.mockReset();
    useAuthStore.setState({token: "test-token", user: null, hydrated: true});
});

describe("NaturalLanguageEntry", () => {
    it("disables the submit button until a sentence is typed", async () => {
        const user = userEvent.setup();
        renderWithIntl(
            <React.Fragment>
                <NaturalLanguageEntry onInterpreted={vi.fn()} />
            </React.Fragment>
        );

        expect(screen.getByRole("button", {name: "解讀"})).toBeDisabled();

        await user.type(screen.getByLabelText("AI 打字記帳"), "午餐 45 蚊");
        expect(screen.getByRole("button", {name: "解讀"})).toBeEnabled();
    });

    it("interprets the sentence and hands the preview to the parent", async () => {
        const user = userEvent.setup();
        const onInterpreted = vi.fn();
        const result = preview({amount_cents: 4500, kind: "expense", occurred_at: "2026-09-14T12:00:00+08:00", merchant_name: "茶餐廳", confidence: 0.9});
        interpretMock.mockResolvedValue({ok: true, value: result});
        renderWithIntl(
            <React.Fragment>
                <NaturalLanguageEntry onInterpreted={onInterpreted} />
            </React.Fragment>
        );

        await user.type(screen.getByLabelText("AI 打字記帳"), "尋日茶餐廳 45 蚊");
        await user.click(screen.getByRole("button", {name: "解讀"}));

        await waitFor(() => expect(onInterpreted).toHaveBeenCalledWith(result));
        expect(interpretMock).toHaveBeenCalledWith("尋日茶餐廳 45 蚊");
        expect(screen.getByText("AI 已預填，入帳前請自行核對。")).toBeInTheDocument();
        // 成功後清空文字欄，避免同已預填嘅表單重複。
        expect(screen.getByLabelText("AI 打字記帳")).toHaveValue("");
    });

    it("prompts batch review when the sentence splits into multiple transactions", async () => {
        const user = userEvent.setup();
        const onInterpreted = vi.fn();
        const result = preview(
            {amount_cents: 3000, kind: "expense", occurred_at: "2026-09-14T08:00:00+08:00", confidence: 0.9},
            {
                parsed_items: [
                    {parsed: {amount_cents: 3000, kind: "expense", occurred_at: "2026-09-14T08:00:00+08:00", confidence: 0.9}},
                    {parsed: {amount_cents: 5000, kind: "expense", occurred_at: "2026-09-14T12:00:00+08:00", confidence: 0.9}},
                    {parsed: {amount_cents: 2000, kind: "expense", occurred_at: "2026-09-14T18:00:00+08:00", confidence: 0.9}},
                ],
            }
        );
        interpretMock.mockResolvedValue({ok: true, value: result});
        renderWithIntl(
            <React.Fragment>
                <NaturalLanguageEntry onInterpreted={onInterpreted} />
            </React.Fragment>
        );

        await user.type(screen.getByLabelText("AI 打字記帳"), "早餐 30 午餐 50 車費 20");
        await user.click(screen.getByRole("button", {name: "解讀"}));

        await waitFor(() => expect(onInterpreted).toHaveBeenCalledWith(result));
        expect(screen.getByText("偵測到 3 筆交易，請逐筆覆核。")).toBeInTheDocument();
        expect(screen.getByLabelText("AI 打字記帳")).toHaveValue("");
    });

    it("shows a failure message when the sentence has no amount", async () => {
        const user = userEvent.setup();
        const onInterpreted = vi.fn();
        interpretMock.mockResolvedValue({ok: true, value: preview({amount_cents: null, kind: "expense", occurred_at: "2026-09-14T12:00:00+08:00"}, {status: "partial"})});
        renderWithIntl(
            <React.Fragment>
                <NaturalLanguageEntry onInterpreted={onInterpreted} />
            </React.Fragment>
        );

        await user.type(screen.getByLabelText("AI 打字記帳"), "今日天氣好好");
        await user.click(screen.getByRole("button", {name: "解讀"}));

        expect(await screen.findByText("解讀唔到，請試清楚啲或者直接手動填。")).toBeInTheDocument();
        expect(onInterpreted).not.toHaveBeenCalled();
        expect(screen.getByRole("button", {name: "重試解析"})).toBeInTheDocument();
    });

    it("surfaces repository errors and keeps the sentence for retry", async () => {
        const user = userEvent.setup();
        interpretMock.mockResolvedValue({ok: false, error: {code: "api_failed", message: "暫時無法連接服務"}});
        renderWithIntl(
            <React.Fragment>
                <NaturalLanguageEntry onInterpreted={vi.fn()} />
            </React.Fragment>
        );

        await user.type(screen.getByLabelText("AI 打字記帳"), "午餐 45 蚊");
        await user.click(screen.getByRole("button", {name: "解讀"}));

        expect(await screen.findByText("暫時無法連接服務")).toBeInTheDocument();
        expect(screen.getByLabelText("AI 打字記帳")).toHaveValue("午餐 45 蚊");
    });
});
