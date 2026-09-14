import {afterEach, describe, expect, it, vi} from "vitest";
import {domainTestState} from "../test/domainFixtures";
import {apiClient} from "./apiRepository";
import {DashboardRepository} from "./dashboardRepository";

const TOKEN = "api-token";
const account = domainTestState.accounts[0];
const transaction = domainTestState.transactions[0];
const rule = domainTestState.recurringRules[0];

const accountBalance = {id: account.id, name: account.name, currency: "HKD" as const, initial_balance_cents: account.initial_balance_cents, balance_cents: 300000};
const transactionRow = {
    id: transaction.id,
    account_id: transaction.account_id,
    category_id: transaction.category_id,
    merchant_id: transaction.merchant_id,
    kind: transaction.kind,
    amount_cents: transaction.amount_cents,
    currency: transaction.currency,
    occurred_at: transaction.occurred_at,
    note: transaction.note,
    payment_method: transaction.payment_method,
    source: transaction.source,
    transfer_account_id: transaction.transfer_account_id,
    image_urls: transaction.image_urls,
    refund_of_id: transaction.refund_of_id,
    net_amount_cents: transaction.net_amount_cents,
};
const ruleSummary = {
    id: rule.id,
    account_id: rule.account_id,
    category_id: rule.category_id,
    merchant_id: rule.merchant_id,
    kind: rule.kind,
    amount_cents: rule.amount_cents,
    currency: rule.currency,
    frequency: rule.frequency,
    interval: rule.interval,
    start_on: rule.start_on,
    end_on: rule.end_on,
    next_run_at: rule.next_run_at,
    day_of_month: rule.day_of_month,
    status: rule.status,
    note: rule.note,
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe("DashboardRepository", () => {
    it("requests dashboard data for the selected date", async () => {
        const response = {
            range: {from: "2026-08-31T16:00:00.000Z", to: "2026-09-30T15:59:59.999Z"},
            income_cents: 300000,
            expense_cents: 120000,
            refund_cents: 1500,
            net_expense_cents: 118500,
            net_cents: 181500,
            recent_transactions: [transactionRow],
            by_category: [],
            accounts: [accountBalance],
            account_balances: [accountBalance],
            upcoming_recurring: [ruleSummary],
            recurring_reminders: [ruleSummary],
        };
        const request = vi.spyOn(apiClient, "request").mockResolvedValue({data: response});

        expect(await new DashboardRepository(TOKEN).get("2026-09-14")).toEqual({ok: true, value: response});
        expect(request).toHaveBeenCalledWith(expect.objectContaining({method: "GET", url: "/dashboard", params: {date: "2026-09-14"}}));
    });

    it("rejects invalid dates before requesting", async () => {
        const request = vi.spyOn(apiClient, "request");

        expect(await new DashboardRepository(TOKEN).get("14/09/2026")).toMatchObject({ok: false, error: {code: "validation"}});
        expect(request).not.toHaveBeenCalled();
    });
});
