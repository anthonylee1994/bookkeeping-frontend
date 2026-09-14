import {afterEach, describe, expect, it, vi} from "vitest";
import {domainTestState} from "../test/domainFixtures";
import {apiClient} from "./apiRepository";
import {DashboardRepository} from "./dashboardRepository";

const TOKEN = "api-token";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("DashboardRepository", () => {
    it("requests dashboard data for the selected date", async () => {
        const response = {
            from: "2026-08-31T16:00:00.000Z",
            to: "2026-09-30T15:59:59.999Z",
            income_cents: 300000,
            expense_cents: 120000,
            refund_cents: 1500,
            net_cents: 181500,
            top_expense_categories: [],
            account_balances: domainTestState.accounts,
            upcoming_recurring_rules: domainTestState.recurringRules,
            recent_transactions: domainTestState.transactions,
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
