import {describe, expect, it} from "vitest";
import {centsToDollars, dollarsToCents, formatSignedAmount, signedAmountTone} from "./money";

describe("dollarsToCents", () => {
    it.each([
        ["1", 100],
        ["1.2", 120],
        ["1.23", 123],
        ["1,234.50", 123450],
        [" 12.34 ", 1234],
        ["0.01", 1],
    ])("converts %s to integer cents", (input, expected) => {
        expect(dollarsToCents(input)).toBe(expected);
    });

    it.each(["", "   ", "0", "0.00", "-1", "+1", "1.234", "1e3", "12,34.00", "01.00", "HK$1.00", "NaN"])("rejects %s", input => {
        expect(dollarsToCents(input)).toMatchObject({code: expect.any(String)});
    });

    it("rejects values larger than safe integer cents", () => {
        expect(dollarsToCents("90071992547410.00")).toMatchObject({code: "too_large"});
    });
});

describe("money formatting", () => {
    it("formats cents with the HKD symbol, grouping and two decimals", () => {
        expect(centsToDollars(123450)).toBe("HK$1,234.50");
        expect(centsToDollars(-123450)).toBe("-HK$1,234.50");
    });

    it("formats income, expense, transfer and refund signs", () => {
        expect(formatSignedAmount({cents: 12345, kind: "income"})).toBe("+HK$123.45");
        expect(formatSignedAmount({cents: 12345, kind: "expense"})).toBe("-HK$123.45");
        expect(formatSignedAmount({cents: 12345, kind: "transfer"})).toBe("HK$123.45");
        expect(formatSignedAmount({cents: 12345, kind: "expense", isRefund: true})).toBe("+HK$123.45 退款");
    });

    it("maps signed cents to amount colour", () => {
        expect(signedAmountTone(-1)).toBe("expense");
        expect(signedAmountTone(0)).toBe("income");
        expect(signedAmountTone(1)).toBe("income");
    });

    it("rejects non-integer cents", () => {
        expect(() => centsToDollars(1.5)).toThrow(RangeError);
    });
});
