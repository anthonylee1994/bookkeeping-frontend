import {dateSchema, uuidSchema} from "../data/schema";
import type {RecurringStatus, SortOrder, SummaryPeriod, TransactionFilters, TransactionKind, TransactionSortField} from "../data/types";

const TRANSACTION_KINDS: readonly TransactionKind[] = ["income", "expense", "transfer"];
const TRANSACTION_SORT_FIELDS: readonly TransactionSortField[] = ["occurred_at", "amount_cents", "created_at"];
const SORT_ORDERS: readonly SortOrder[] = ["asc", "desc"];
const SUMMARY_PERIODS: readonly SummaryPeriod[] = ["daily", "weekly", "monthly"];
const RECURRING_STATUSES: readonly RecurringStatus[] = ["active", "paused", "ended"];

export const DEFAULT_PER_PAGE = 25;
export const MAX_PER_PAGE = 100;

export const DEFAULT_SUMMARY_PERIOD: SummaryPeriod = "monthly";
export const DEFAULT_RECURRING_STATUS: RecurringStatus = "active";

export type SummaryParams = {
    period: SummaryPeriod;
    date?: string;
    page?: number;
};

/* ---------- 內部 parse primitive ---------- */

function asSearchParams(input: URLSearchParams | string): URLSearchParams {
    return typeof input === "string" ? new URLSearchParams(input) : input;
}

function readValue(search: URLSearchParams, key: string): string | undefined {
    const value = search.get(key)?.trim();
    return value === undefined || value === "" ? undefined : value;
}

function readEnum<T extends string>(search: URLSearchParams, key: string, allowed: readonly T[]): T | undefined {
    const value = readValue(search, key);
    return value !== undefined && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function readUuid(search: URLSearchParams, key: string): string | undefined {
    const value = readValue(search, key);
    return value !== undefined && uuidSchema.safeParse(value).success ? value : undefined;
}

function readDate(search: URLSearchParams, key: string): string | undefined {
    const value = readValue(search, key);
    return value !== undefined && dateSchema.safeParse(value).success ? value : undefined;
}

function readInteger(search: URLSearchParams, key: string, min: number, max: number): number | undefined {
    const value = readValue(search, key);
    if (value === undefined || !/^\d+$/.test(value)) return undefined;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max ? parsed : undefined;
}

/* ---------- 內部 serialize primitive ---------- */

function appendValue(search: URLSearchParams, key: string, value: string | number | undefined): void {
    if (value === undefined || value === "") return;
    search.set(key, String(value));
}

/* ---------- Transactions filter ---------- */

/** 由 URL query 還原 transaction filter；任何無效值一律當作未填，不 throw。 */
export function parseTransactionFilters(input: URLSearchParams | string): TransactionFilters {
    const search = asSearchParams(input);
    const filters: TransactionFilters = {};

    const from = readDate(search, "from");
    if (from !== undefined) filters.from = from;
    const to = readDate(search, "to");
    if (to !== undefined) filters.to = to;
    const kind = readEnum(search, "kind", TRANSACTION_KINDS);
    if (kind !== undefined) filters.kind = kind;
    const accountId = readUuid(search, "account_id");
    if (accountId !== undefined) filters.account_id = accountId;
    const categoryId = readUuid(search, "category_id");
    if (categoryId !== undefined) filters.category_id = categoryId;
    const merchantId = readUuid(search, "merchant_id");
    if (merchantId !== undefined) filters.merchant_id = merchantId;
    const keyword = readValue(search, "q");
    if (keyword !== undefined) filters.keyword = keyword;
    const min = readInteger(search, "min", 0, Number.MAX_SAFE_INTEGER);
    if (min !== undefined) filters.min_amount_cents = min;
    const max = readInteger(search, "max", 0, Number.MAX_SAFE_INTEGER);
    if (max !== undefined) filters.max_amount_cents = max;
    const sort = readEnum(search, "sort", TRANSACTION_SORT_FIELDS);
    if (sort !== undefined) filters.sort = sort;
    const order = readEnum(search, "order", SORT_ORDERS);
    if (order !== undefined) filters.order = order;
    const page = readInteger(search, "page", 1, Number.MAX_SAFE_INTEGER);
    if (page !== undefined) filters.page = page;
    const perPage = readInteger(search, "per_page", 1, MAX_PER_PAGE);
    if (perPage !== undefined) filters.per_page = perPage;

    return filters;
}

/** 將 transaction filter 寫成 URL query；`keyword`／`min_amount_cents`／`max_amount_cents` 對應 URL 上的 `q`／`min`／`max`。 */
export function serializeTransactionFilters(filters: TransactionFilters): URLSearchParams {
    const search = new URLSearchParams();
    appendValue(search, "from", filters.from);
    appendValue(search, "to", filters.to);
    appendValue(search, "kind", filters.kind);
    appendValue(search, "account_id", filters.account_id);
    appendValue(search, "category_id", filters.category_id);
    appendValue(search, "merchant_id", filters.merchant_id);
    appendValue(search, "q", filters.keyword);
    appendValue(search, "min", filters.min_amount_cents);
    appendValue(search, "max", filters.max_amount_cents);
    appendValue(search, "sort", filters.sort);
    appendValue(search, "order", filters.order);
    appendValue(search, "page", filters.page);
    appendValue(search, "per_page", filters.per_page);
    return search;
}

/* ---------- Summary ---------- */

/** 由 URL query 還原 summary state；period 無效就回預設 `monthly`。 */
export function parseSummaryParams(input: URLSearchParams | string): SummaryParams {
    const search = asSearchParams(input);
    const params: SummaryParams = {period: readEnum(search, "period", SUMMARY_PERIODS) ?? DEFAULT_SUMMARY_PERIOD};

    const date = readDate(search, "date");
    if (date !== undefined) params.date = date;
    const page = readInteger(search, "page", 1, Number.MAX_SAFE_INTEGER);
    if (page !== undefined) params.page = page;

    return params;
}

export function serializeSummaryParams(params: SummaryParams): URLSearchParams {
    const search = new URLSearchParams();
    search.set("period", params.period);
    appendValue(search, "date", params.date);
    appendValue(search, "page", params.page);
    return search;
}

/* ---------- Recurring rules 狀態 tab ---------- */

/** 由 URL query 還原定期交易狀態 tab；無效值回預設 `active`。 */
export function parseRecurringStatus(input: URLSearchParams | string): RecurringStatus {
    return readEnum(asSearchParams(input), "status", RECURRING_STATUSES) ?? DEFAULT_RECURRING_STATUS;
}

export function serializeRecurringStatus(status: RecurringStatus): URLSearchParams {
    return new URLSearchParams({status});
}

/* ---------- returnTo（防 open redirect） ---------- */

// eslint-disable-next-line no-control-regex
const UNSAFE_PATH_PATTERN = /[\u0000-\u001f\\]/;
const PROTOCOL_PATTERN = /^[a-z][a-z\d+.-]*:/i;

/** 只接受站內 path：`/` 開頭、不可以 `//`（protocol-relative）、不可以有 scheme 或控制字元。 */
export function parseReturnTo(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const path = value.trim();
    if (path === "" || !path.startsWith("/") || path.startsWith("//")) return null;
    if (UNSAFE_PATH_PATTERN.test(path)) return null;
    if (PROTOCOL_PATTERN.test(path)) return null;
    return path;
}
