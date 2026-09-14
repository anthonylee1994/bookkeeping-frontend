// @vitest-environment jsdom

import {act, renderHook} from "@testing-library/react";
import {beforeEach, describe, expect, it} from "vitest";
import {domainTestState} from "../test/domainFixtures";
import {useAppStore} from "./appStore";

beforeEach(() => {
    useAppStore.getState().resetAppState();
});

describe("app store", () => {
    it("starts with empty domain slices", () => {
        expect(useAppStore.getState()).toMatchObject({
            accounts: [],
            categories: [],
            merchants: [],
            transactions: [],
            transactionsMeta: null,
            recurringRules: [],
            isLoading: false,
            error: null,
        });
    });

    it("mirrors repository results into each slice", () => {
        const state = useAppStore.getState();
        state.setAccounts(domainTestState.accounts);
        state.setCategories(domainTestState.categories);
        state.setMerchants(domainTestState.merchants);
        state.setRecurringRules(domainTestState.recurringRules);
        state.setTransactions(domainTestState.transactions, {page: 1, per_page: 25, total: 1, total_pages: 1});

        expect(useAppStore.getState()).toMatchObject({
            accounts: domainTestState.accounts,
            categories: domainTestState.categories,
            merchants: domainTestState.merchants,
            recurringRules: domainTestState.recurringRules,
            transactions: domainTestState.transactions,
            transactionsMeta: {page: 1, per_page: 25, total: 1, total_pages: 1},
        });
    });

    it("clears pagination meta when transactions are set without it", () => {
        const state = useAppStore.getState();
        state.setTransactions(domainTestState.transactions, {page: 1, per_page: 25, total: 1, total_pages: 1});
        state.setTransactions(domainTestState.transactions);

        expect(useAppStore.getState().transactionsMeta).toBeNull();
    });

    it("only re-renders a selector when its own slice changes", () => {
        let renders = 0;
        const {result} = renderHook(() => {
            renders += 1;
            return useAppStore(state => state.transactions);
        });
        const rendersAfterMount = renders;

        act(() => useAppStore.getState().setCategories(domainTestState.categories));
        expect(renders).toBe(rendersAfterMount);
        expect(result.current).toEqual([]);

        act(() => useAppStore.getState().setTransactions(domainTestState.transactions));
        expect(renders).toBeGreaterThan(rendersAfterMount);
        expect(result.current).toEqual(domainTestState.transactions);
    });

    it("resets every slice and status back to empty", () => {
        const state = useAppStore.getState();
        state.setAccounts(domainTestState.accounts);
        state.setTransactions(domainTestState.transactions);
        state.setLoading(true);
        state.setError({code: "api_failed", message: "暫時無法連接服務"});

        state.resetAppState();

        expect(useAppStore.getState()).toMatchObject({
            accounts: [],
            transactions: [],
            transactionsMeta: null,
            isLoading: false,
            error: null,
        });
    });
});
