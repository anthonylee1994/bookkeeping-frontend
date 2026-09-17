import {formatMessage, messages} from "./i18n";
import type {TransactionKind} from "../data/types";

export type MoneyErrorCode = "invalid_format" | "not_positive" | "too_large";

export type MoneyError = {
    code: MoneyErrorCode;
    message: string;
};

type SignedAmountOptions = {
    cents: number;
    kind: TransactionKind;
};

const MAX_SAFE_DOLLARS = Math.floor(Number.MAX_SAFE_INTEGER / 100);

function moneyError(code: MoneyErrorCode, message: string): MoneyError {
    return {code, message};
}

function assertValidCents(cents: number): void {
    if (!Number.isSafeInteger(cents)) {
        throw new RangeError(formatMessage(messages.runtime.centsNotSafeInteger));
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
        return moneyError("invalid_format", formatMessage(messages.validation.amountInvalidFormat));
    }

    const normalized = value.replaceAll(",", "");
    const [dollarPart, decimalPart = ""] = normalized.split(".");
    const dollars = Number(dollarPart);

    if (!Number.isSafeInteger(dollars) || dollars > MAX_SAFE_DOLLARS) {
        return moneyError("too_large", formatMessage(messages.validation.amountTooLarge));
    }

    const cents = dollars * 100 + Number(decimalPart.padEnd(2, "0"));
    if (!Number.isSafeInteger(cents)) {
        return moneyError("too_large", formatMessage(messages.validation.amountTooLarge));
    }
    if (cents === 0) {
        return moneyError("not_positive", formatMessage(messages.validation.amountNotPositive));
    }

    return cents;
}

export function centsToDollars(cents: number): string {
    assertValidCents(cents);

    const sign = cents < 0 ? "-" : "";
    const absoluteCents = Math.abs(cents);
    return `${sign}$${groupedDollars(absoluteCents)}.${String(absoluteCents % 100).padStart(2, "0")}`;
}

/** 已帶正負號的金額顏色：負數紅、非負數綠。 */
export function signedAmountTone(cents: number): "income" | "expense" {
    return cents < 0 ? "expense" : "income";
}

/** 正負金額的顏色 token：$0 用灰色，正數 income，負數 expense。 */
export function signedAmountColor(cents: number): string {
    if (cents === 0) return "fg.muted";
    return cents > 0 ? "income" : "expense";
}

export function formatSignedAmount({cents, kind}: SignedAmountOptions): string {
    assertValidCents(cents);

    const amount = centsToDollars(Math.abs(cents));
    if (kind === "income") {
        return `+${amount}`;
    }
    if (kind === "expense") {
        return `-${amount}`;
    }
    return amount;
}

const THOUSAND = 1_000;
const TEN_THOUSAND = 10_000;
const HUNDRED_MILLION = 100_000_000;

function trimWholeCents(formatted: string): string {
    return formatted.endsWith(".00") ? formatted.slice(0, -3) : formatted;
}

function scaledUnit(value: number): string {
    return trimWholeCents(value.toFixed(2));
}

/** 日曆等窄位用：省略貨幣符號，1,000 以上轉「千／萬／億」，永遠帶正負號；整數唔顯示 .00。 */
export function formatCompactSignedCents(cents: number): string {
    assertValidCents(cents);

    const sign = cents < 0 ? "-" : "+";
    const dollars = Math.abs(cents) / 100;
    if (dollars >= HUNDRED_MILLION) return `${sign}${scaledUnit(dollars / HUNDRED_MILLION)}億`;
    if (dollars >= TEN_THOUSAND) return `${sign}${scaledUnit(dollars / TEN_THOUSAND)}萬`;
    if (dollars >= THOUSAND) return `${sign}${scaledUnit(dollars / THOUSAND)}千`;
    return `${sign}${trimWholeCents(dollars.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2}))}`;
}
