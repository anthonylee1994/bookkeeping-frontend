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
    icon?: string;
    color?: string;
};

export type CategoryInput = {
    name: string;
    kind: CategoryKind;
    position?: number;
    icon?: string;
    color?: string;
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
    day_of_week?: number;
    day_of_month?: number;
    month_of_year?: number;
    status?: RecurringStatus;
    note?: string | null;
};

export type User = {
    id: UUID;
    username: string;
    created_at: string;
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
    balance_cents: number;
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

export type Transaction = Omit<TransactionInput, "currency" | "source" | "image_urls"> & {
    id: UUID;
    currency: Currency;
    source: TransactionSource;
    image_urls: string[];
    refund_of_id: UUID | null;
    net_amount_cents: number;
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

export type PaginationMeta = {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
};

export type LocalErrorCode = "validation" | "unauthorized" | "not_found" | "conflict_already_materialized" | "in_use" | "storage_failed" | "api_failed";

export type LocalError = {
    code: LocalErrorCode;
    message: string;
    fields?: Record<string, string | string[]>;
};

export type LocalResult<T> = {ok: true; value: T} | {ok: false; error: LocalError};

export type AiParsedFields = {
    amount_cents?: number | null;
    currency?: Currency | null;
    occurred_at?: string | null;
    merchant_name?: string | null;
    category_name?: string | null;
    payment_method?: string | null;
    note?: string | null;
};

export type AiPreview = {
    confidence: number;
    parsed: AiParsedFields;
    missing_fields: string[];
    low_confidence_fields: string[];
    image_url?: string;
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

export type AmountDistribution = {
    id: UUID | null;
    name: string;
    amount_cents: number;
};

export type TransferSummary = {
    count: number;
    amount_cents: number;
};

export type Summary = {
    period: SummaryPeriod;
    from: string;
    to: string;
    income_cents: number;
    expense_cents: number;
    refund_cents: number;
    net_cents: number;
    category_distribution: AmountDistribution[];
    account_distribution: AmountDistribution[];
    transfers: TransferSummary;
    transactions: Paginated<Transaction>;
};

export type Dashboard = {
    from: string;
    to: string;
    income_cents: number;
    expense_cents: number;
    refund_cents: number;
    net_cents: number;
    top_expense_categories: AmountDistribution[];
    account_balances: Account[];
    upcoming_recurring_rules: RecurringRule[];
    recent_transactions: Transaction[];
};

export type RefundInput = {
    amount_cents: number;
    occurred_at: string;
    note?: string | null;
};

export type ReceiptUpload = {
    image_url: string;
    sha256: string;
};

export type SkipNextResult = {
    rule: RecurringRule;
    skipped_date: string;
};
