import {afterEach, describe, expect, it, vi} from "vitest";
import {apiClient} from "./apiRepository";
import {SummariesRepository} from "./summariesRepository";

const TOKEN = "api-token";

function summaryResponse() {
    return {
        range: {from: "2026-08-31T16:00:00.000Z", to: "2026-09-30T15:59:59.999Z"},
        income_cents: 0,
        expense_cents: 0,
        net_cents: 0,
        daily: [{date: "2026-09-14", net_cents: 0}],
        by_category: [],
        by_account: [],
        transfers: {count: 1, total_cents: 20000},
        transactions: {data: [], meta: {page: 1, per_page: 25, total: 0, total_pages: 0}},
    };
}

function insightResponse() {
    return {
        period: "monthly",
        range: {from: "2026-08-31T16:00:00.000Z", to: "2026-09-30T15:59:59.999Z"},
        status: "success",
        text: "2026年9月收入 HK$1,000.00。",
        highlights: ["支出集中喺飲食。"],
        cached: false,
        generated_at: "2026-09-16T12:00:00+08:00",
        error: null,
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
        expect(request).toHaveBeenCalledWith(expect.objectContaining({method: "GET", url: "/summaries/monthly", params: {date: "2026-09-14", page: 2, per_page: 10}}));
    });

    it("rejects invalid dates and pagination before requesting", async () => {
        const request = vi.spyOn(apiClient, "request");
        const repository = new SummariesRepository(TOKEN);

        expect(await repository.get("weekly", "14/09/2026")).toMatchObject({ok: false, error: {code: "validation"}});
        expect(await repository.get("weekly", "2026-09-14", 0, 101)).toMatchObject({ok: false, error: {code: "validation"}});
        expect(request).not.toHaveBeenCalled();
    });

    it("requests the AI insight and can force a refresh", async () => {
        const request = vi.spyOn(apiClient, "request").mockResolvedValue({data: insightResponse()});
        const repository = new SummariesRepository(TOKEN);

        expect(await repository.getInsight("monthly", "2026-09-14")).toEqual({ok: true, value: insightResponse()});
        expect(request).toHaveBeenLastCalledWith(expect.objectContaining({method: "GET", url: "/summaries/monthly/insight", params: {date: "2026-09-14"}}));

        await repository.getInsight("monthly", "2026-09-14", true);
        expect(request).toHaveBeenLastCalledWith(expect.objectContaining({url: "/summaries/monthly/insight", params: {date: "2026-09-14", refresh: 1}}));
    });

    it("rejects an invalid insight date before requesting", async () => {
        const request = vi.spyOn(apiClient, "request");

        expect(await new SummariesRepository(TOKEN).getInsight("daily", "nope")).toMatchObject({ok: false, error: {code: "validation"}});
        expect(request).not.toHaveBeenCalled();
    });
});
