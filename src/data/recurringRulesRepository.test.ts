import {afterEach, describe, expect, it, vi} from "vitest";
import {domainTestState} from "../test/domainFixtures";
import {apiClient} from "./apiRepository";
import {RecurringRulesRepository} from "./recurringRulesRepository";

const TOKEN = "api-token";
const rule = domainTestState.recurringRules[0];

function recurringInput() {
    return {
        account_id: rule.account_id,
        category_id: rule.category_id,
        merchant_id: rule.merchant_id,
        kind: rule.kind,
        amount_cents: rule.amount_cents,
        currency: "HKD" as const,
        frequency: rule.frequency,
        interval: rule.interval,
        start_on: rule.start_on,
        end_on: rule.end_on,
        next_run_at: rule.next_run_at,
        day_of_week: rule.day_of_week,
        day_of_month: rule.day_of_month,
        month_of_year: rule.month_of_year,
        status: rule.status,
        note: rule.note,
    };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("RecurringRulesRepository", () => {
    it("lists, creates, updates and deletes recurring rules", async () => {
        const request = vi
            .spyOn(apiClient, "request")
            .mockResolvedValueOnce({data: {recurring_rules: domainTestState.recurringRules}})
            .mockResolvedValueOnce({data: rule})
            .mockResolvedValueOnce({data: {recurring_rule: rule}})
            .mockResolvedValueOnce({data: null});
        const repository = new RecurringRulesRepository(TOKEN);

        expect(await repository.list("active")).toMatchObject({ok: true});
        expect(await repository.create(recurringInput())).toMatchObject({ok: true});
        expect(await repository.update(rule.id, recurringInput())).toMatchObject({ok: true});
        expect(await repository.delete(rule.id)).toEqual({ok: true, value: true});
        expect(request.mock.calls.map(call => [call[0].method, call[0].url])).toEqual([
            ["GET", "/recurring_rules"],
            ["POST", "/recurring_rules"],
            ["PATCH", `/recurring_rules/${rule.id}`],
            ["DELETE", `/recurring_rules/${rule.id}`],
        ]);
    });

    it("calls pause, resume and skip-next action endpoints", async () => {
        const request = vi
            .spyOn(apiClient, "request")
            .mockResolvedValueOnce({data: rule})
            .mockResolvedValueOnce({data: {recurring_rule: rule}})
            .mockResolvedValueOnce({data: rule});
        const repository = new RecurringRulesRepository(TOKEN);

        expect(await repository.pause(rule.id)).toMatchObject({ok: true});
        expect(await repository.resume(rule.id)).toMatchObject({ok: true});
        expect(await repository.skipNext(rule.id)).toEqual({ok: true, value: rule});
        expect(request.mock.calls.map(call => call[0].url)).toEqual([`/recurring_rules/${rule.id}/pause`, `/recurring_rules/${rule.id}/resume`, `/recurring_rules/${rule.id}/skip_next`]);
    });

    it("maps run-now already-materialized conflicts", async () => {
        vi.spyOn(apiClient, "request").mockRejectedValue({response: {status: 409, data: {code: "already_materialized"}}});

        expect(await new RecurringRulesRepository(TOKEN).runNow(rule.id)).toEqual({ok: false, error: {code: "conflict_already_materialized", message: "今日已經產生過交易"}});
    });

    it("validates frequency-specific schedule fields locally", async () => {
        const request = vi.spyOn(apiClient, "request");
        const repository = new RecurringRulesRepository(TOKEN);

        expect(await repository.create({...recurringInput(), frequency: "weekly", day_of_week: undefined})).toMatchObject({ok: false, error: {code: "validation"}});
        expect(await repository.create({...recurringInput(), frequency: "yearly", month_of_year: undefined})).toMatchObject({ok: false, error: {code: "validation"}});
        expect(request).not.toHaveBeenCalled();
    });
});
