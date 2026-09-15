export type UUID = string;
export type Currency = "HKD";
export type TransactionKind = "income" | "expense" | "transfer";
export type TransactionSource = "manual" | "recurring" | "ai" | "import";
export type AccountKind = "cash" | "bank" | "credit_card" | "e_wallet" | "other";
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type RecurringStatus = "active" | "paused" | "ended";
export type SummaryPeriod = "daily" | "weekly" | "monthly";
export type CategoryKind = "income" | "expense";

export type AuthInput = {
    username: string;
    password: string;
};

export type AccountInput = {
    name: string;
    kind: AccountKind;
    currency: Currency;
    initial_balance_cents?: number;
    icon?: string | null;
    color?: string | null;
};

export type CategoryInput = {
    name: string;
    kind: CategoryKind;
    position?: number;
    icon?: string | null;
    color?: string | null;
};

export type MerchantInput = {
    name: string;
    default_category_id?: UUID | null;
};

export type TransactionInput = {
    account_id: UUID;
    category_id?: UUID | null;
    merchant_id?: UUID | null;
    kind: TransactionKind;
    amount_cents: number;
    currency?: Currency;
    occurred_at: string;
    note?: string | null;
    payment_method?: string | null;
    source?: TransactionSource;
    transfer_account_id?: UUID | null;
    image_urls?: string[];
};

export type TransactionUpdateInput = Omit<TransactionInput, "source">;

export type RecurringRuleInput = {
    account_id: UUID;
    category_id?: UUID | null;
    merchant_id?: UUID | null;
    kind: "income" | "expense";
    amount_cents: number;
    currency?: Currency;
    frequency: RecurringFrequency;
    interval?: number;
    start_on: string;
    end_on?: string | null;
    next_run_at: string;
    day_of_week?: number | null;
    day_of_month?: number | null;
    month_of_year?: number | null;
    status?: RecurringStatus;
    note?: string | null;
};

export type User = {
    id: UUID;
    username: string;
    timezone: string;
    currency: Currency;
};

export type AuthSession = {
    token: string;
    user: User;
};

export type Account = Omit<AccountInput, "initial_balance_cents"> & {
    id: UUID;
    initial_balance_cents: number;
    created_at: string;
    updated_at: string;
    balance_cents?: number;
};

export type Category = Omit<CategoryInput, "position"> & {
    id: UUID;
    position: number;
    created_at: string;
    updated_at: string;
};

export type Merchant = MerchantInput & {
    id: UUID;
    usage_count: number;
    created_at: string;
    updated_at: string;
};

export type TransactionRow = Omit<TransactionInput, "currency" | "source" | "image_urls"> & {
    id: UUID;
    currency: Currency;
    source: TransactionSource;
    image_urls: string[];
};

export type Transaction = TransactionRow & {
    created_at: string;
    updated_at: string;
};

export type RecurringRule = Omit<RecurringRuleInput, "currency" | "interval" | "status" | "note"> & {
    id: UUID;
    currency: Currency;
    interval: number;
    status: RecurringStatus;
    note: string | null;
    created_at: string;
    updated_at: string;
};

export type RecurringRuleSummary = {
    id: UUID;
    account_id: UUID;
    category_id?: UUID | null;
    merchant_id?: UUID | null;
    kind: "income" | "expense";
    amount_cents: number;
    currency: Currency;
    frequency: RecurringFrequency;
    interval: number;
    start_on: string;
    end_on?: string | null;
    next_run_at: string;
    day_of_week?: number | null;
    day_of_month?: number | null;
    month_of_year?: number | null;
    status: RecurringStatus;
    note?: string | null;
};

export type PaginationMeta = {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
};

export type LocalErrorCode = "validation" | "unauthorized" | "not_found" | "conflict" | "conflict_already_materialized" | "in_use" | "storage_failed" | "api_failed";

export type LocalError = {
    code: LocalErrorCode;
    message: string;
    fields?: Record<string, string | string[]>;
};

export type LocalResult<T> = {ok: true; value: T} | {ok: false; error: LocalError};

export type AiParsedFields = {
    amount_cents?: number | null;
    kind?: "income" | "expense" | null;
    occurred_at?: string | null;
    merchant_name?: string | null;
    category_hint?: string | null;
    note?: string | null;
    confidence?: number | null;
};

export type AiPreview = {
    id: UUID;
    image_urls: string[];
    sha256: string;
    status: "success" | "partial" | "failed";
    parsed: AiParsedFields | null;
    raw_response?: string | null;
    error?: string | null;
    tokens_in?: number | null;
    tokens_out?: number | null;
    latency_ms?: number | null;
};

export type TransactionSortField = "occurred_at" | "amount_cents" | "created_at";
export type SortOrder = "asc" | "desc";

export type TransactionFilters = {
    from?: string;
    to?: string;
    kind?: TransactionKind;
    account_id?: UUID;
    category_id?: UUID;
    merchant_id?: UUID;
    keyword?: string;
    min_amount_cents?: number;
    max_amount_cents?: number;
    sort?: TransactionSortField;
    order?: SortOrder;
    page?: number;
    per_page?: number;
};

export type Paginated<T> = {
    data: T[];
    meta: PaginationMeta;
};

export type Range = {
    from: string;
    to: string;
};

export type CategoryBreakdown = {
    category_id: UUID | null;
    name: string | null;
    expense_cents: number;
};

export type AccountBreakdown = {
    account_id: UUID | null;
    name: string | null;
    income_cents: number;
    expense_cents: number;
};

export type AccountBalance = {
    id: UUID;
    name: string;
    currency: Currency;
    initial_balance_cents: number;
    balance_cents: number;
};

export type TransferSummary = {
    count: number;
    total_cents: number;
};

export type Summary = {
    range: Range;
    income_cents: number;
    expense_cents: number;
    net_cents: number;
    by_category: CategoryBreakdown[];
    by_account: AccountBreakdown[];
    transfers: TransferSummary;
    transactions: Paginated<TransactionRow>;
};

export type Dashboard = {
    range: Range;
    income_cents: number;
    expense_cents: number;
    net_cents: number;
    recent_transactions: TransactionRow[];
    by_category: CategoryBreakdown[];
    accounts: AccountBalance[];
    account_balances: AccountBalance[];
    upcoming_recurring: RecurringRuleSummary[];
    recurring_reminders: RecurringRuleSummary[];
};

export type ReceiptUpload = {
    url: string;
    sha256: string;
};

/* ---------- Workflow／draft state（draftStore） ---------- */

export type TransactionDraft = {
    kind: TransactionKind;
    amount: string;
    account_id: UUID | null;
    transfer_account_id: UUID | null;
    category_id: UUID | null;
    merchant_id: UUID | null;
    merchant_name: string;
    occurred_at: string;
    payment_method: string;
    note: string;
    image_urls: string[];
};

export type AiScanStep = "idle" | "selected" | "parsing" | "review" | "failed";

export type AiScanDraft = {
    step: AiScanStep;
    imageUrl: string | null;
    preview: AiPreview | null;
};
