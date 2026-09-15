import {describe, expect, it} from "vitest";
import {render, screen} from "@testing-library/react";
import {Amount} from "@/components/ui/Amount";

describe("Amount", () => {
    it("prefixes income with a plus and applies the income tone", () => {
        render(<Amount cents={12345} kind="income" />);
        const amount = screen.getByText("+HK$123.45");
        expect(amount).toHaveClass("text-income");
    });

    it("prefixes expense with a minus and applies the expense tone", () => {
        render(<Amount cents={12345} kind="expense" />);
        const amount = screen.getByText("-HK$123.45");
        expect(amount).toHaveClass("text-expense");
    });

    it("labels refunds with text and the refund tone", () => {
        render(<Amount cents={12345} kind="expense" isRefund />);
        const amount = screen.getByText("+HK$123.45 退款");
        expect(amount).toHaveClass("text-refund");
    });

    it("does not add a sign for transfers", () => {
        render(<Amount cents={12345} kind="transfer" />);
        const amount = screen.getByText("HK$123.45");
        expect(amount).toHaveClass("text-transfer");
    });
});
