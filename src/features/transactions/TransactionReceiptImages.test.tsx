import React from "react";
import {describe, expect, it} from "vitest";
import {fireEvent, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {TransactionReceiptImages} from "@/features/transactions/TransactionReceiptImages";
import {renderWithIntl} from "@/test/renderWithIntl";

const urls = ["https://example.test/receipt-1.jpg", "https://example.test/receipt-2.jpg"];

describe("TransactionReceiptImages", () => {
    it("renders nothing without images", () => {
        const {container} = renderWithIntl(
            <React.Fragment>
                <TransactionReceiptImages urls={[]} />
            </React.Fragment>
        );

        expect(container).toBeEmptyDOMElement();
    });

    it("opens a receipt in a lightbox", async () => {
        const user = userEvent.setup();
        renderWithIntl(
            <React.Fragment>
                <TransactionReceiptImages urls={urls} />
            </React.Fragment>
        );

        await user.click(screen.getByRole("button", {name: "放大單據圖片 2"}));

        const dialog = await screen.findByRole("dialog");
        expect(within(dialog).getByAltText("單據圖片 2")).toHaveAttribute("src", urls[1]);

        await user.click(within(dialog).getByRole("button", {name: "關閉"}));
        expect(within(dialog).queryByAltText("單據圖片 2")).not.toBeInTheDocument();
    });

    it("falls back once an image fails and does not keep retrying it", () => {
        renderWithIntl(
            <React.Fragment>
                <TransactionReceiptImages urls={urls} />
            </React.Fragment>
        );

        fireEvent.error(screen.getByAltText("單據圖片 1"));

        expect(screen.getByText("圖片無法載入")).toBeInTheDocument();
        expect(screen.queryByAltText("單據圖片 1")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", {name: "放大單據圖片 1"})).not.toBeInTheDocument();
        expect(screen.getByRole("button", {name: "放大單據圖片 2"})).toBeInTheDocument();
    });
});
