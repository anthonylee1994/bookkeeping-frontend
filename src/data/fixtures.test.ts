import {describe, expect, it} from "vitest";
import {createFixtureState} from "./fixtures";
import {repositoryStateSchema} from "./persistence";

describe("createFixtureState", () => {
    it("creates schema-valid dashboard and filter demo data", () => {
        const state = createFixtureState(new Date("2026-09-14T08:00:00Z"));

        expect(repositoryStateSchema.safeParse(state).success).toBe(true);
        expect(state.accounts.some(account => account.kind === "cash")).toBe(true);
        expect(state.categories.some(category => category.kind === "income")).toBe(true);
        expect(state.categories.some(category => category.kind === "expense")).toBe(true);
        expect(state.transactions).toHaveLength(14);
        expect(state.transactions.some(transaction => transaction.kind === "transfer")).toBe(true);
        expect(state.transactions.some(transaction => transaction.refund_of_id !== null)).toBe(true);
        expect(state.recurringRules.map(rule => rule.status)).toEqual(["active", "paused"]);
    });
});
