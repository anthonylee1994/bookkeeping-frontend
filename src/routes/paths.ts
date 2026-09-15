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

/** 交易詳情 URL；集中喺度，避免各 feature 自己砌 path。 */
export function transactionDetailPath(id: string): string {
    return `/transactions/${id}`;
}
