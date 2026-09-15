import {beforeEach, describe, expect, it} from "vitest";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {Toaster} from "@/components/ui/Toaster";
import {useUiStore} from "@/stores/uiStore";
import {renderWithIntl} from "@/test/renderWithIntl";

beforeEach(() => {
    useUiStore.setState({toasts: []});
});

describe("Toaster", () => {
    it("announces queued toasts in a polite live region", () => {
        useUiStore.setState({toasts: [{id: "1", kind: "success", message: "已儲存"}]});
        renderWithIntl(<Toaster />);

        const message = screen.getByText("已儲存");
        expect(message.closest("[aria-live='polite']")).not.toBeNull();
    });

    it("marks blocking errors with role=alert", () => {
        useUiStore.setState({toasts: [{id: "1", kind: "error", message: "儲存失敗"}]});
        renderWithIntl(<Toaster />);

        const message = screen.getByText("儲存失敗");
        expect(message.closest("[role='alert']")).not.toBeNull();
    });

    it("removes a toast when dismissed", async () => {
        const user = userEvent.setup();
        useUiStore.setState({toasts: [{id: "1", kind: "info", message: "提示"}]});
        renderWithIntl(<Toaster />);

        await user.click(screen.getByRole("button", {name: "關閉"}));

        await waitFor(() => expect(screen.queryByText("提示")).not.toBeInTheDocument());
    });
});
