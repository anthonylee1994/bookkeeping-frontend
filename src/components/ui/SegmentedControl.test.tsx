import {describe, expect, it, vi} from "vitest";
import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {SegmentedControl} from "@/components/ui/SegmentedControl";
import {renderWithIntl} from "@/test/renderWithIntl";

const OPTIONS = [
    {value: "income", label: "收入"},
    {value: "expense", label: "支出"},
    {value: "transfer", label: "轉帳"},
] as const;

describe("SegmentedControl", () => {
    it("exposes radiogroup semantics with the selected option checked", () => {
        renderWithIntl(<SegmentedControl label="類型" value="expense" options={OPTIONS} onValueChange={() => undefined} />);

        expect(screen.getByRole("radiogroup", {name: "類型"})).toBeInTheDocument();
        expect(screen.getByRole("radio", {name: "支出"})).toHaveAttribute("aria-checked", "true");
        expect(screen.getByRole("radio", {name: "收入"})).toHaveAttribute("aria-checked", "false");
    });

    it("reports the next value when another segment is picked", async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();

        renderWithIntl(<SegmentedControl label="類型" value="expense" options={OPTIONS} onValueChange={onValueChange} />);

        await user.click(screen.getByRole("radio", {name: "收入"}));
        expect(onValueChange).toHaveBeenCalledWith("income");
    });
});
