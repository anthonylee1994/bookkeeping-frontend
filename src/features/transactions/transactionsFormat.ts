import type {Account, Category, TransactionFilters, TransactionKind, TransactionRow, TransactionSource} from "@/data/types";
import {formatMessage, messages} from "@/lib/i18n";
import {centsToDollars} from "@/lib/money";
import {kindLabel, transactionDisplayAmount, transactionTitle, transactionTone} from "@/lib/transactionDisplay";
import type {TransactionTone} from "@/lib/transactionDisplay";

export type TransactionNameMaps = {
    accounts: Map<string, string>;
    categories: Map<string, string>;
    merchants: Map<string, string>;
};

export type TransactionAvatarMeta = {
    icon: string | null;
    color: string | null;
};

/** 列表／表格顯示頭像用；只保留 icon 同 color，名稱由 TransactionNameMaps 提供。 */
export type TransactionAvatarMaps = {
    accounts: Map<string, TransactionAvatarMeta>;
    categories: Map<string, TransactionAvatarMeta>;
};

export function buildTransactionAvatarMaps(accounts: Account[], categories: Category[]): TransactionAvatarMaps {
    return {
        accounts: new Map(accounts.map(account => [account.id, {icon: account.icon ?? null, color: account.color ?? null}])),
        categories: new Map(categories.map(category => [category.id, {icon: category.icon ?? null, color: category.color ?? null}])),
    };
}

export type TransactionRowView = {
    primary: string;
    secondary: string | null;
    category: string;
    account: string;
    kind: string;
    amount: string;
    tone: TransactionTone;
};

export type TransactionFilterDraft = {
    from: string;
    to: string;
    kind: string;
    accountId: string;
    categoryId: string;
    merchantId: string;
    keyword: string;
    min: string;
    max: string;
};

export const EMPTY_FILTER_DRAFT: TransactionFilterDraft = {
    from: "",
    to: "",
    kind: "",
    accountId: "",
    categoryId: "",
    merchantId: "",
    keyword: "",
    min: "",
    max: "",
};

/** 將 URL filter 轉成表單草稿；金額由 cents 轉回元。 */
export function toFilterDraft(filters: TransactionFilters): TransactionFilterDraft {
    return {
        from: filters.from ?? "",
        to: filters.to ?? "",
        kind: filters.kind ?? "",
        accountId: filters.account_id ?? "",
        categoryId: filters.category_id ?? "",
        merchantId: filters.merchant_id ?? "",
        keyword: filters.keyword ?? "",
        min: filters.min_amount_cents === undefined ? "" : String(filters.min_amount_cents / 100),
        max: filters.max_amount_cents === undefined ? "" : String(filters.max_amount_cents / 100),
    };
}

/** 將表單草稿轉回 URL filter；空白欄位一律略去，令 URL 保持精簡。 */
export function toTransactionFilters(draft: TransactionFilterDraft): TransactionFilters {
    const filters: TransactionFilters = {};
    if (draft.from !== "") filters.from = draft.from;
    if (draft.to !== "") filters.to = draft.to;
    if (draft.kind !== "") filters.kind = draft.kind as TransactionKind;
    if (draft.accountId !== "") filters.account_id = draft.accountId;
    if (draft.categoryId !== "") filters.category_id = draft.categoryId;
    if (draft.merchantId !== "") filters.merchant_id = draft.merchantId;
    if (draft.keyword.trim() !== "") filters.keyword = draft.keyword.trim();

    const min = parseAmountInput(draft.min);
    if (min !== null) filters.min_amount_cents = min;
    const max = parseAmountInput(draft.max);
    if (max !== null) filters.max_amount_cents = max;

    return filters;
}

export function countActiveFilters(filters: TransactionFilters): number {
    let count = 0;
    if (filters.from !== undefined) count += 1;
    if (filters.to !== undefined) count += 1;
    if (filters.kind !== undefined) count += 1;
    if (filters.account_id !== undefined) count += 1;
    if (filters.category_id !== undefined) count += 1;
    if (filters.merchant_id !== undefined) count += 1;
    if (filters.keyword !== undefined) count += 1;
    if (filters.min_amount_cents !== undefined) count += 1;
    if (filters.max_amount_cents !== undefined) count += 1;
    return count;
}

/** 將一筆交易整理成列表／表格要顯示的欄位（名稱由參考資料 map 解析）。 */
export function describeTransaction(transaction: TransactionRow, names: TransactionNameMaps): TransactionRowView {
    const merchantName = transaction.merchant_id != null ? names.merchants.get(transaction.merchant_id) : undefined;
    const categoryName = transaction.category_id != null ? names.categories.get(transaction.category_id) : undefined;
    const accountName = names.accounts.get(transaction.account_id);
    const transferName = transaction.transfer_account_id != null ? names.accounts.get(transaction.transfer_account_id) : undefined;

    let secondary = transactionSecondaryLabel(transaction, merchantName);
    if (secondary === null && transaction.kind === "transfer" && transferName !== undefined) {
        secondary = formatMessage(messages.transactions.list.transferTo, {name: transferName});
    }

    return {
        primary: transactionPrimaryLabel(transaction, merchantName, categoryName),
        secondary,
        category: transaction.kind === "transfer" ? formatMessage(messages.transactions.transfer) : (categoryName ?? formatMessage(messages.transactions.list.uncategorized)),
        account: accountName ?? formatMessage(messages.transactions.list.unknownAccount),
        kind: kindLabel(transaction.kind),
        amount: transactionDisplayAmount(transaction),
        tone: transactionTone(transaction),
    };
}

export type TransactionDateGroup = {
    /** ISO 日期（YYYY-MM-DD），同時做 React key。 */
    date: string;
    transactions: TransactionRow[];
    /** 當日淨額：收入為正、支出為負，轉帳不影響淨額。 */
    netCents: number;
};

export type PageTotals = {
    incomeCents: number;
    expenseCents: number;
    netCents: number;
};

/** 單筆交易對淨額的影響；轉帳只是搬錢，不計。 */
function netEffectCents(transaction: TransactionRow): number {
    if (transaction.kind === "transfer") return 0;
    return transaction.kind === "income" ? transaction.amount_cents : -transaction.amount_cents;
}

/**
 * 依 occurred_at 的日期分組，保留原有次序（API 已排序）。
 * 只有按日期排序時分組才有意義，所以由呼叫端決定用不用。
 */
export function groupTransactionsByDate(transactions: TransactionRow[]): TransactionDateGroup[] {
    const groups: TransactionDateGroup[] = [];
    for (const transaction of transactions) {
        const date = transaction.occurred_at.slice(0, 10);
        const last = groups.at(-1);
        if (last !== undefined && last.date === date) {
            last.transactions.push(transaction);
            last.netCents += netEffectCents(transaction);
            continue;
        }
        groups.push({date, transactions: [transaction], netCents: netEffectCents(transaction)});
    }
    return groups;
}

/** 本頁合計。API 只回當頁資料，所以此數字是「本頁」而非全部符合條件的交易。 */
export function summarisePage(transactions: TransactionRow[]): PageTotals {
    let incomeCents = 0;
    let expenseCents = 0;
    for (const transaction of transactions) {
        const effect = netEffectCents(transaction);
        if (effect > 0) incomeCents += effect;
        else expenseCents += -effect;
    }
    return {incomeCents, expenseCents, netCents: incomeCents - expenseCents};
}

export type ActiveFilterChip = {
    /** 對應 TransactionFilters 的 key，移除時清掉它。 */
    key: keyof TransactionFilters;
    label: string;
};

/** 將生效中的 filter 轉成可逐個移除的 chip；名稱由參考資料 map 解析。 */
export function describeActiveFilters(filters: TransactionFilters, names: TransactionNameMaps): ActiveFilterChip[] {
    const chips: ActiveFilterChip[] = [];
    const push = (key: keyof TransactionFilters, label: string) => chips.push({key, label});

    if (filters.keyword !== undefined) push("keyword", `「${filters.keyword}」`);
    if (filters.from !== undefined) push("from", `${formatMessage(messages.transactions.filters.from)} ${filters.from}`);
    if (filters.to !== undefined) push("to", `${formatMessage(messages.transactions.filters.to)} ${filters.to}`);
    if (filters.kind !== undefined) push("kind", kindLabel(filters.kind));
    if (filters.account_id !== undefined) push("account_id", names.accounts.get(filters.account_id) ?? formatMessage(messages.transactions.list.unknownAccount));
    if (filters.category_id !== undefined) push("category_id", names.categories.get(filters.category_id) ?? formatMessage(messages.transactions.list.uncategorized));
    if (filters.merchant_id !== undefined) push("merchant_id", names.merchants.get(filters.merchant_id) ?? formatMessage(messages.transactions.filters.merchant));
    if (filters.min_amount_cents !== undefined) push("min_amount_cents", `≥ ${centsToDollars(filters.min_amount_cents)}`);
    if (filters.max_amount_cents !== undefined) push("max_amount_cents", `≤ ${centsToDollars(filters.max_amount_cents)}`);

    return chips;
}

export function sourceLabel(source: TransactionSource): string {
    if (source === "recurring") return formatMessage(messages.transactions.detail.sourceRecurring);
    if (source === "ai") return formatMessage(messages.transactions.detail.sourceAi);
    if (source === "import") return formatMessage(messages.transactions.detail.sourceImport);
    return formatMessage(messages.transactions.detail.sourceManual);
}

function transactionPrimaryLabel(transaction: TransactionRow, merchantName: string | undefined, categoryName: string | undefined): string {
    if (merchantName !== undefined && merchantName !== "") return merchantName;
    return transactionTitle(transaction, categoryName);
}

function transactionSecondaryLabel(transaction: TransactionRow, merchantName: string | undefined): string | null {
    const note = transaction.note?.trim();
    if (note !== undefined && note !== "" && merchantName !== undefined && merchantName !== "") return note;
    return null;
}

function parseAmountInput(value: string): number | null {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return Math.round(parsed * 100);
}
