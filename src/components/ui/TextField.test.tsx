import {describe, expect, it} from "vitest";
import {screen} from "@testing-library/react";
import {TextField} from "@/components/ui/TextField";
import {renderWithIntl} from "@/test/renderWithIntl";

describe("TextField", () => {
    it("associates the label with the input", () => {
        renderWithIntl(<TextField label="用戶名稱" />);
        expect(screen.getByLabelText("用戶名稱")).toBeInTheDocument();
    });

    it("links the error message through aria-describedby and marks the field invalid", () => {
        renderWithIntl(<TextField label="用戶名稱" error="必填" />);

        const input = screen.getByLabelText("用戶名稱");
        const error = screen.getByRole("alert");

        expect(error).toHaveTextContent("必填");
        expect(input).toHaveAttribute("aria-invalid", "true");
        expect(input).toHaveAttribute("aria-describedby", error.id);
    });

    it("uses hint text when there is no error", () => {
        renderWithIntl(<TextField label="金額" hint="最多兩位小數" />);

        const input = screen.getByLabelText("金額");
        const hint = screen.getByText("最多兩位小數");

        expect(input).toHaveAttribute("aria-describedby", hint.id);
        expect(input).not.toHaveAttribute("aria-invalid");
    });
});
