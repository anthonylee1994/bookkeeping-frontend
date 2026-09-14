import {afterEach, describe, expect, it, vi} from "vitest";
import {apiClient} from "./apiRepository";
import {SummariesRepository} from "./summariesRepository";

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

describe("SummariesRepository", () => {
    it("forwards summary period and pagination without calculating transfer totals locally", async () => {
        const response = summaryResponse();
        const request = vi.spyOn(apiClient, "request").mockResolvedValue({data: response});

        expect(await new SummariesRepository(TOKEN).get("monthly", "2026-09-14", 2, 10)).toEqual({ok: true, value: response});
        expect(request).toHaveBeenCalledWith(expect.objectContaining({method: "GET", url: "/api/v1/summaries/monthly", params: {date: "2026-09-14", page: 2, per_page: 10}}));
    });

    it("rejects invalid dates and pagination before requesting", async () => {
        const request = vi.spyOn(apiClient, "request");
        const repository = new SummariesRepository(TOKEN);

        expect(await repository.get("weekly", "14/09/2026")).toMatchObject({ok: false, error: {code: "validation"}});
        expect(await repository.get("weekly", "2026-09-14", 0, 101)).toMatchObject({ok: false, error: {code: "validation"}});
        expect(request).not.toHaveBeenCalled();
    });
});
