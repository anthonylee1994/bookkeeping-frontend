import type {Account, Category, Merchant, RecurringRule, Transaction} from "../data/types";

const timestamp = "2026-09-14T08:00:00.000Z";

export const domainTestState: {accounts: Account[]; categories: Category[]; merchants: Merchant[]; transactions: Transaction[]; recurringRules: RecurringRule[]} = {
    accounts: [
        {id: "10000000-0000-4000-8000-000000000001", name: "現金", kind: "cash", currency: "HKD", initial_balance_cents: 0, balance_cents: 0, created_at: timestamp, updated_at: timestamp},
        {id: "10000000-0000-4000-8000-000000000002", name: "銀行戶口", kind: "bank", currency: "HKD", initial_balance_cents: 0, balance_cents: 0, created_at: timestamp, updated_at: timestamp},
    ],
    categories: [
        {id: "20000000-0000-4000-8000-000000000001", name: "工資", kind: "income", created_at: timestamp, updated_at: timestamp},
        {id: "20000000-0000-4000-8000-000000000002", name: "飲食", kind: "expense", created_at: timestamp, updated_at: timestamp},
    ],
    merchants: [
        {id: "30000000-0000-4000-8000-000000000001", name: "街角咖啡", default_category_id: "20000000-0000-4000-8000-000000000002", usage_count: 1, created_at: timestamp, updated_at: timestamp},
    ],
    transactions: [
        {
            id: "40000000-0000-4000-8000-000000000001",
            account_id: "10000000-0000-4000-8000-000000000001",
            category_id: "20000000-0000-4000-8000-000000000001",
            merchant_id: null,
            kind: "income",
            amount_cents: 300000,
            currency: "HKD",
            occurred_at: timestamp,
            note: "工資",
            payment_method: null,
            source: "manual",
            transfer_account_id: null,
            image_urls: [],
            created_at: timestamp,
            updated_at: timestamp,
        },
    ],
    recurringRules: [
        {
            id: "50000000-0000-4000-8000-000000000001",
            account_id: "10000000-0000-4000-8000-000000000001",
            category_id: "20000000-0000-4000-8000-000000000002",
            merchant_id: "30000000-0000-4000-8000-000000000001",
            kind: "expense",
            amount_cents: 12000,
            currency: "HKD",
            frequency: "monthly",
            interval: 1,
            start_on: "2026-09-01",
            end_on: null,
            next_run_at: "2026-10-01T00:00:00+08:00",
            day_of_month: 1,
            status: "active",
            note: "月費",
            created_at: timestamp,
            updated_at: timestamp,
        },
    ],
};
