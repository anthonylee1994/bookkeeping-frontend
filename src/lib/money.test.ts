import {describe, expect, it} from "vitest";
import {centsToDollars, dollarsToCents, formatCompactSignedCents, formatSignedAmount, signedAmountColor, signedAmountTone} from "./money";

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

    it.each(["", "   ", "0", "0.00", "-1", "+1", "1.234", "1e3", "12,34.00", "01.00", "$1.00", "NaN"])("rejects %s", input => {
        expect(dollarsToCents(input)).toMatchObject({code: expect.any(String)});
    });

    it("rejects values larger than safe integer cents", () => {
        expect(dollarsToCents("90071992547410.00")).toMatchObject({code: "too_large"});
    });
});

describe("money formatting", () => {
    it("formats cents with the currency symbol, grouping and two decimals", () => {
        expect(centsToDollars(123450)).toBe("$1,234.50");
        expect(centsToDollars(-123450)).toBe("-$1,234.50");
    });

    it("formats income, expense and transfer signs", () => {
        expect(formatSignedAmount({cents: 12345, kind: "income"})).toBe("+$123.45");
        expect(formatSignedAmount({cents: 12345, kind: "expense"})).toBe("-$123.45");
        expect(formatSignedAmount({cents: 12345, kind: "transfer"})).toBe("$123.45");
    });

    it("maps signed cents to amount colour", () => {
        expect(signedAmountTone(-1)).toBe("expense");
        expect(signedAmountTone(0)).toBe("income");
        expect(signedAmountTone(1)).toBe("income");
    });

    it("maps signed cents to a colour token, grey for zero", () => {
        expect(signedAmountColor(-1)).toBe("expense");
        expect(signedAmountColor(0)).toBe("fg.muted");
        expect(signedAmountColor(1)).toBe("income");
    });

    it("formats compact signed cents for narrow spaces", () => {
        expect(formatCompactSignedCents(422124)).toBe("+4.22千");
        expect(formatCompactSignedCents(-880)).toBe("-8.80");
        expect(formatCompactSignedCents(0)).toBe("+0");
        expect(formatCompactSignedCents(100000)).toBe("+1千");
        expect(formatCompactSignedCents(2060000)).toBe("+2.06萬");
        expect(formatCompactSignedCents(1000000)).toBe("+1萬");
        expect(formatCompactSignedCents(-12345000000)).toBe("-1.23億");
    });

    it("rejects non-integer cents", () => {
        expect(() => centsToDollars(1.5)).toThrow(RangeError);
    });
});
