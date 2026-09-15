import {describe, expect, it, vi} from "vitest";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {Dialog, DialogContent, DialogTitle, DialogTrigger} from "@/components/ui/Dialog";
import {renderWithIntl} from "@/test/renderWithIntl";

describe("Dialog", () => {
    it("closes on Escape and returns focus to the trigger", async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();

        renderWithIntl(
            <Dialog onOpenChange={onOpenChange}>
                <DialogTrigger>開啟</DialogTrigger>
                <DialogContent>
                    <DialogTitle>標題</DialogTitle>
                </DialogContent>
            </Dialog>
        );

        const trigger = screen.getByRole("button", {name: "開啟"});
        await user.click(trigger);
        expect(await screen.findByRole("dialog")).toBeInTheDocument();

        await user.keyboard("{Escape}");

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(onOpenChange).toHaveBeenCalledWith(false);
        await waitFor(() => expect(trigger).toHaveFocus());
    });
});
