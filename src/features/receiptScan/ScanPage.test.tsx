import React from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {fireEvent, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {createMemoryRouter, RouterProvider} from "react-router";
import {ScanPage} from "@/features/receiptScan/ScanPage";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";
import {useDraftStore} from "@/stores/draftStore";
import {domainTestState} from "@/test/domainFixtures";
import {renderWithIntl} from "@/test/renderWithIntl";
import type {AiPreview} from "@/data/types";

const uploadMock = vi.hoisted(() => vi.fn());
const parseMock = vi.hoisted(() => vi.fn());
const confirmMock = vi.hoisted(() => vi.fn());
const merchantSearchMock = vi.hoisted(() => vi.fn());
const merchantCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/data/receiptsRepository", async importOriginal => {
    const actual = await importOriginal<typeof import("@/data/receiptsRepository")>();
    return {
        ...actual,
        ReceiptsRepository: class {
            upload = uploadMock;
            parse = parseMock;
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

const IMPORT_LOG_ID = "80000000-0000-4000-8000-000000000001";
const RECEIPT_URL = "https://example.test/receipt.png";

const successPreview: AiPreview = {
    id: IMPORT_LOG_ID,
    image_urls: [RECEIPT_URL],
    sha256: "a".repeat(64),
    status: "success",
    parsed: {amount_cents: 1250, kind: "expense", occurred_at: "2026-09-14T16:00:00+08:00", merchant_name: "街角咖啡", confidence: 0.92},
};

function receiptFile(name = "receipt.png", type = "image/png"): File {
    return new File(["receipt-bytes"], name, {type});
}

function renderScanPage(): void {
    const router = createMemoryRouter(
        [
            {path: "/scan", element: <ScanPage />},
            {path: "/transactions/new", element: <div>MANUAL FORM</div>},
            {path: "/transactions/:id", element: <div>TRANSACTION DETAIL</div>},
        ],
        {initialEntries: ["/scan"]}
    );
    renderWithIntl(
        <React.Fragment>
            <RouterProvider router={router} />
        </React.Fragment>
    );
}

beforeEach(() => {
    useAuthStore.setState({token: "test-token", user: null, hydrated: true});
    useAppStore.setState({...domainTestState, referenceLoaded: true});
    useDraftStore.setState({transactionDraft: null, aiScan: null});
    uploadMock.mockReset().mockResolvedValue({ok: true, value: {url: RECEIPT_URL, sha256: "a".repeat(64)}});
    parseMock.mockReset().mockResolvedValue({ok: true, value: successPreview});
    confirmMock.mockReset();
    merchantSearchMock.mockReset().mockResolvedValue({ok: true, value: domainTestState.merchants});
    merchantCreateMock.mockReset();
});

describe("ScanPage", () => {
    it("rejects an unsupported file type locally without uploading it", async () => {
        renderScanPage();

        // 瀏覽器的 accept filter 不是保證，所以直接派一個不合規的檔案落去試 guard。
        fireEvent.change(screen.getByLabelText("選擇單據相片"), {target: {files: [receiptFile("note.txt", "text/plain")]}});

        expect(await screen.findByRole("alert")).toHaveTextContent("只支援 JPEG、PNG 或 WebP 圖片");
        expect(uploadMock).not.toHaveBeenCalled();
    });

    it("rejects a receipt over 10 MiB locally without uploading it", async () => {
        const user = userEvent.setup();
        renderScanPage();

        await user.upload(screen.getByLabelText("選擇單據相片"), new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", {type: "image/png"}));

        expect(await screen.findByRole("alert")).toHaveTextContent("圖片不可大於 10 MiB");
        expect(uploadMock).not.toHaveBeenCalled();
    });

    it("accepts a receipt dropped onto the picker", async () => {
        renderScanPage();

        fireEvent.drop(screen.getByRole("button", {name: /選擇或拍攝單據/}), {dataTransfer: {files: [receiptFile()]}});

        expect(await screen.findByText("覆核解析結果")).toBeInTheDocument();
        expect(uploadMock).toHaveBeenCalledTimes(1);
        expect(parseMock).toHaveBeenCalledWith(RECEIPT_URL);
    });

    it("uploads, parses and prefills the review form", async () => {
        const user = userEvent.setup();
        renderScanPage();

        await user.upload(screen.getByLabelText("選擇單據相片"), receiptFile());

        expect(await screen.findByText("覆核解析結果")).toBeInTheDocument();
        expect(uploadMock).toHaveBeenCalledTimes(1);
        expect(parseMock).toHaveBeenCalledWith(RECEIPT_URL);
        expect(screen.getByLabelText("金額")).toHaveValue("12.50");
        expect(screen.getByLabelText("日期時間")).toHaveValue("2026-09-14T16:00");
        expect(screen.getByLabelText("商戶")).toHaveValue("街角咖啡");
        // Preview 用本地 object URL，不會等上載完才看到。
        expect(screen.getByAltText("單據預覽").getAttribute("src")).toMatch(/^blob:/);
        expect(screen.queryByText("需覆核")).not.toBeInTheDocument();
    });

    it("marks low confidence and unreadable fields for review", async () => {
        const user = userEvent.setup();
        parseMock.mockResolvedValue({ok: true, value: {...successPreview, status: "partial", parsed: {amount_cents: 1250, confidence: 0.3}}});
        renderScanPage();

        await user.upload(screen.getByLabelText("選擇單據相片"), receiptFile());

        expect(await screen.findByText("解析信心度只有 30%，請逐項核對。")).toBeInTheDocument();
        expect(screen.getByText("部分欄位未能辨識，已標示為需覆核。")).toBeInTheDocument();
        expect(screen.getAllByText("需覆核")).toHaveLength(3);
    });

    it("keeps the image on a parse failure and can retry without re-uploading", async () => {
        const user = userEvent.setup();
        parseMock.mockResolvedValueOnce({ok: false, error: {code: "api_failed", message: "暫時無法連接服務"}});
        renderScanPage();

        await user.upload(screen.getByLabelText("選擇單據相片"), receiptFile());

        expect(await screen.findByText("單據解析失敗")).toBeInTheDocument();
        expect(screen.getByAltText("單據預覽")).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "重試解析"}));

        expect(await screen.findByText("覆核解析結果")).toBeInTheDocument();
        expect(uploadMock).toHaveBeenCalledTimes(1);
        expect(parseMock).toHaveBeenCalledTimes(2);
    });

    it("offers manual entry when the parse keeps failing", async () => {
        const user = userEvent.setup();
        parseMock.mockResolvedValue({ok: true, value: {...successPreview, status: "failed", parsed: null, error: "看不清這張單"}});
        renderScanPage();

        await user.upload(screen.getByLabelText("選擇單據相片"), receiptFile());
        expect(await screen.findByText("單據解析失敗")).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "改為手動入帳"}));
        expect(await screen.findByText("MANUAL FORM")).toBeInTheDocument();
    });

    it("cancels an in-flight parse and keeps the selected image", async () => {
        const user = userEvent.setup();
        parseMock.mockReturnValue(new Promise(() => undefined));
        renderScanPage();

        await user.upload(screen.getByLabelText("選擇單據相片"), receiptFile());

        await user.click(await screen.findByRole("button", {name: "取消解析"}));

        expect(await screen.findByText("已取消解析，可以重新解析或改為手動入帳。")).toBeInTheDocument();
        expect(screen.getByAltText("單據預覽")).toBeInTheDocument();
        expect(screen.queryByText("覆核解析結果")).not.toBeInTheDocument();
        expect(screen.getByRole("button", {name: "重試解析"})).toBeInTheDocument();
    });

    it("confirms the reviewed transaction with the import log id and an idempotency key", async () => {
        const user = userEvent.setup();
        confirmMock.mockResolvedValue({ok: true, value: {...domainTestState.transactions[0], id: "40000000-0000-4000-8000-0000000000a1"}});
        renderScanPage();

        await user.upload(screen.getByLabelText("選擇單據相片"), receiptFile());
        await screen.findByText("覆核解析結果");

        await user.click(screen.getByRole("button", {name: "確認入帳"}));

        await waitFor(() => expect(confirmMock).toHaveBeenCalledTimes(1));
        const [input, importLogId, idempotencyKey] = confirmMock.mock.calls[0];
        expect(input).toMatchObject({
            kind: "expense",
            amount_cents: 1250,
            account_id: domainTestState.accounts[0].id,
            source: "ai",
            image_urls: [RECEIPT_URL],
        });
        expect(importLogId).toBe(IMPORT_LOG_ID);
        expect(idempotencyKey).toMatch(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i);
        expect(await screen.findByText("TRANSACTION DETAIL")).toBeInTheDocument();
        expect(useDraftStore.getState().aiScan).toBeNull();
    });

    it("keeps the draft on a confirm failure so the same idempotency key is reused", async () => {
        const user = userEvent.setup();
        confirmMock.mockResolvedValueOnce({ok: false, error: {code: "api_failed", message: "暫時無法連接服務"}});
        confirmMock.mockResolvedValueOnce({ok: true, value: {...domainTestState.transactions[0], id: "40000000-0000-4000-8000-0000000000a2"}});
        renderScanPage();

        await user.upload(screen.getByLabelText("選擇單據相片"), receiptFile());
        await screen.findByText("覆核解析結果");

        await user.click(screen.getByRole("button", {name: "確認入帳"}));
        expect(await screen.findByText("暫時無法連接服務")).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "確認入帳"}));
        await waitFor(() => expect(confirmMock).toHaveBeenCalledTimes(2));
        expect(confirmMock.mock.calls[0][2]).toBe(confirmMock.mock.calls[1][2]);
    });

    it("starts from the picker again when a reloaded draft lost its object URL", () => {
        useDraftStore.setState({transactionDraft: null, aiScan: {step: "review", imageUrl: null, preview: successPreview}});
        renderScanPage();

        expect(screen.getByLabelText("選擇單據相片")).toBeInTheDocument();
        expect(screen.queryByText("覆核解析結果")).not.toBeInTheDocument();
        expect(screen.queryByAltText("單據預覽")).not.toBeInTheDocument();
    });
});
