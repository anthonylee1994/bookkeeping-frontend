export const ROUTES = {
    login: "/login",
    register: "/register",
    dashboard: "/",
    transactions: "/transactions",
    transactionNew: "/transactions/new",
    transactionDetail: "/transactions/:id",
    transactionEdit: "/transactions/:id/edit",
    summaries: "/summaries",
    recurringRules: "/recurring-rules",
    settings: "/settings",
    settingsAccounts: "/settings/accounts",
    settingsCategories: "/settings/categories",
    settingsMerchants: "/settings/merchants",
    settingsPassword: "/settings/password",
} as const;

/** 將 search string（可帶或不帶 `?`）接上 path；空字串即原樣返回。 */
function withSearch(path: string, search: string): string {
    if (search === "" || search === "?") return path;
    return `${path}${search.startsWith("?") ? search : `?${search}`}`;
}

/** 交易列表 URL；帶 search 即保留 filter。 */
export function transactionsPath(search = ""): string {
    return withSearch(ROUTES.transactions, search);
}

/** 新增交易 URL；帶 search 即返列表時仍保留 filter。 */
export function transactionNewPath(search = ""): string {
    return withSearch(ROUTES.transactionNew, search);
}

/** 交易詳情 URL；集中在此處，避免各 feature 自行組合 path。`search` 用嚟保留列表 filter。 */
export function transactionDetailPath(id: string, search = ""): string {
    return withSearch(`/transactions/${id}`, search);
}

/** 交易修改 URL；同詳情 path 一樣集中組合，避免漏 encode。`search` 用嚟保留列表 filter。 */
export function transactionEditPath(id: string, search = ""): string {
    return withSearch(`/transactions/${encodeURIComponent(id)}/edit`, search);
}
