import axios from "axios";
import {afterEach, describe, expect, it, vi} from "vitest";
import {domainTestState} from "../test/domainFixtures";
import {InsightsRepository} from "./insightsRepository";

const TOKEN = "api-token";

function summaryResponse() {
    return {
        period: "monthly" as const,
        from: "2026-08-31T16:00:00.000Z",
        to: "2026-09-30T15:59:59.999Z",
        income_cents: 0,
        expense_cents: 0,
        refund_cents: 0,
        net_cents: 0,
        category_distribution: [],
        account_distribution: [],
        transfers: {count: 1, amount_cents: 20000},
        transactions: {data: [], meta: {page: 1, per_page: 25, total: 0, total_pages: 0}},
    };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("InsightsRepository", () => {
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
        const request = vi.spyOn(axios, "request").mockResolvedValue({data: response});

        expect(await new InsightsRepository(TOKEN).dashboard("2026-09-14")).toEqual({ok: true, value: response});
        expect(request).toHaveBeenCalledWith(expect.objectContaining({method: "GET", url: "/api/v1/dashboard", params: {date: "2026-09-14"}}));
    });

    it("forwards summary period and pagination without calculating transfer totals locally", async () => {
        const response = summaryResponse();
        const request = vi.spyOn(axios, "request").mockResolvedValue({data: response});

        expect(await new InsightsRepository(TOKEN).summary("monthly", "2026-09-14", 2, 10)).toEqual({ok: true, value: response});
        expect(request).toHaveBeenCalledWith(expect.objectContaining({method: "GET", url: "/api/v1/summaries/monthly", params: {date: "2026-09-14", page: 2, per_page: 10}}));
    });

    it("rejects invalid dates and pagination before requesting", async () => {
        const request = vi.spyOn(axios, "request");
        const repository = new InsightsRepository(TOKEN);

        expect(await repository.dashboard("14/09/2026")).toMatchObject({ok: false, error: {code: "validation"}});
        expect(await repository.summary("weekly", "2026-09-14", 0, 101)).toMatchObject({ok: false, error: {code: "validation"}});
        expect(request).not.toHaveBeenCalled();
    });
});
