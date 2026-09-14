import type {TransactionKind} from "../data/types";

export type MoneyErrorCode = "invalid_format" | "not_positive" | "too_large";

export type MoneyError = {
    code: MoneyErrorCode;
    message: string;
};

type SignedAmountOptions = {
    cents: number;
    kind: TransactionKind;
    isRefund?: boolean;
};

const MAX_SAFE_DOLLARS = Math.floor(Number.MAX_SAFE_INTEGER / 100);

function moneyError(code: MoneyErrorCode, message: string): MoneyError {
    return {code, message};
}

function assertValidCents(cents: number): void {
    if (!Number.isSafeInteger(cents)) {
        throw new RangeError("金額必須係安全整數 cents");
    }
}

function groupedDollars(cents: number): string {
    const dollars = Math.floor(cents / 100);
    return dollars.toLocaleString("en-US", {maximumFractionDigits: 0, useGrouping: true});
}

export function dollarsToCents(input: string): number | MoneyError {
    const value = input.trim();
    const match = /^(?:0|[1-9]\d{0,2}(?:,\d{3})*|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value);

    if (match === null) {
        return moneyError("invalid_format", "請輸入有效金額，最多兩位小數");
    }

    const normalized = value.replaceAll(",", "");
    const [dollarPart, decimalPart = ""] = normalized.split(".");
    const dollars = Number(dollarPart);

    if (!Number.isSafeInteger(dollars) || dollars > MAX_SAFE_DOLLARS) {
        return moneyError("too_large", "金額太大");
    }

    const cents = dollars * 100 + Number(decimalPart.padEnd(2, "0"));
    if (!Number.isSafeInteger(cents)) {
        return moneyError("too_large", "金額太大");
    }
    if (cents === 0) {
        return moneyError("not_positive", "金額必須大過零");
    }

    return cents;
}

export function centsToDollars(cents: number): string {
    assertValidCents(cents);

    const sign = cents < 0 ? "-" : "";
    const absoluteCents = Math.abs(cents);
    return `${sign}HK$${groupedDollars(absoluteCents)}.${String(absoluteCents % 100).padStart(2, "0")}`;
}

export function formatSignedAmount({cents, kind, isRefund = false}: SignedAmountOptions): string {
    assertValidCents(cents);

    const amount = centsToDollars(Math.abs(cents));
    if (isRefund) {
        return `+${amount} 退款`;
    }
    if (kind === "income") {
        return `+${amount}`;
    }
    if (kind === "expense") {
        return `-${amount}`;
    }
    return amount;
}
