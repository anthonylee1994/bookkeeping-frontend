import {describe, expect, it} from "vitest";
import type {RecurringRule} from "@/data/types";
import {
    describeRecurringSchedule,
    emptyRecurringRuleFormValues,
    formValuesToInput,
    recurringRuleFormSchema,
    recurringRuleToFormValues,
    weekdayLabel,
} from "@/features/recurringRules/recurringRuleModel";
import type {RecurringRuleFormValues} from "@/features/recurringRules/recurringRuleModel";
import {domainTestState} from "@/test/domainFixtures";

function formValues(overrides: Partial<RecurringRuleFormValues> = {}): RecurringRuleFormValues {
    return {
        ...emptyRecurringRuleFormValues(domainTestState.accounts[0].id),
        amount: "120.00",
        ...overrides,
    };
}

describe("recurringRuleFormSchema", () => {
    it("requires the frequency-specific day fields", () => {
        expect(recurringRuleFormSchema.safeParse(formValues({frequency: "weekly", dayOfWeek: ""})).success).toBe(false);
        expect(recurringRuleFormSchema.safeParse(formValues({frequency: "monthly", dayOfMonth: ""})).success).toBe(false);
        expect(recurringRuleFormSchema.safeParse(formValues({frequency: "yearly", monthOfYear: ""})).success).toBe(false);
        expect(recurringRuleFormSchema.safeParse(formValues({frequency: "weekly", dayOfWeek: "1"})).success).toBe(true);
    });

    it("rejects invalid amounts, intervals and end dates before start", () => {
        expect(recurringRuleFormSchema.safeParse(formValues({amount: "0"})).success).toBe(false);
        expect(recurringRuleFormSchema.safeParse(formValues({interval: "0"})).success).toBe(false);
        expect(recurringRuleFormSchema.safeParse(formValues({interval: "1.5"})).success).toBe(false);
        expect(recurringRuleFormSchema.safeParse(formValues({startOn: "2026-09-10", endOn: "2026-09-01"})).success).toBe(false);
    });
});

describe("formValuesToInput", () => {
    it("computes the Hong Kong next run from the start date and clears unrelated day fields", () => {
        const input = formValuesToInput(formValues({frequency: "weekly", interval: "2", dayOfWeek: "1", startOn: "2026-09-15"}));

        expect(input).toMatchObject({
            kind: "expense",
            amount_cents: 12000,
            currency: "HKD",
            frequency: "weekly",
            interval: 2,
            start_on: "2026-09-15",
            next_run_at: "2026-09-21T00:00:00+08:00",
            day_of_week: 1,
            day_of_month: null,
            month_of_year: null,
        });
    });

    it("keeps the existing next run when the schedule is unchanged, and recomputes when it changes", () => {
        const rule: RecurringRule = domainTestState.recurringRules[0];
        const unchanged = formValuesToInput(recurringRuleToFormValues(rule), rule);
        expect(unchanged.next_run_at).toBe(rule.next_run_at);

        const changed = formValuesToInput({...recurringRuleToFormValues(rule), interval: "2"}, rule);
        expect(changed.next_run_at).not.toBe(rule.next_run_at);
    });

    it("throws when the end date is before the first run", () => {
        expect(() => formValuesToInput(formValues({frequency: "weekly", dayOfWeek: "1", startOn: "2026-09-15", endOn: "2026-09-15"}))).toThrow();
    });
});

describe("describeRecurringSchedule", () => {
    it("describes interval and day fields for each frequency", () => {
        expect(describeRecurringSchedule({frequency: "daily", interval: 1})).toBe("每日");
        expect(describeRecurringSchedule({frequency: "daily", interval: 3})).toBe("每 3 日");
        expect(describeRecurringSchedule({frequency: "weekly", interval: 1, day_of_week: 3})).toBe("每週 星期三");
        expect(describeRecurringSchedule({frequency: "monthly", interval: 2, day_of_month: 1})).toBe("每 2 個月 1 日");
        expect(describeRecurringSchedule({frequency: "yearly", interval: 1, month_of_year: 2, day_of_month: 29})).toBe("每年 2 月 29 日");
    });

    it("labels weekdays 0 to 6", () => {
        expect(weekdayLabel(0)).toBe("星期日");
        expect(weekdayLabel(6)).toBe("星期六");
    });
});
