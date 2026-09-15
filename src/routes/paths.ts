export const ROUTES = {
    login: "/login",
    register: "/register",
    dashboard: "/",
    transactions: "/transactions",
    transactionNew: "/transactions/new",
    transactionDetail: "/transactions/:id",
    transactionEdit: "/transactions/:id/edit",
    scan: "/scan",
    summaries: "/summaries",
    recurringRules: "/recurring-rules",
    settings: "/settings",
    settingsAccounts: "/settings/accounts",
    settingsCategories: "/settings/categories",
    settingsMerchants: "/settings/merchants",
} as const;

/** 交易詳情 URL；集中在此處，避免各 feature 自行組合 path。 */
export function transactionDetailPath(id: string): string {
    return `/transactions/${id}`;
}

/** 交易修改 URL；同詳情 path 一樣集中組合，避免漏 encode。 */
export function transactionEditPath(id: string): string {
    return `/transactions/${encodeURIComponent(id)}/edit`;
}
