import {create} from "zustand";
import type {Account, Category, LocalError, Merchant, PaginationMeta, RecurringRule, Transaction} from "../data/types";

/** 空白 domain mirror；initial state 同 reset 共用同一形狀，避免兩處走音。 */
const EMPTY_APP_STATE = {
    accounts: [] as Account[],
    categories: [] as Category[],
    merchants: [] as Merchant[],
    transactions: [] as Transaction[],
    transactionsMeta: null as PaginationMeta | null,
    recurringRules: [] as RecurringRule[],
    isLoading: false,
    error: null as LocalError | null,
};

export type AppDomainState = typeof EMPTY_APP_STATE;

/**
 * Domain memory mirror。Repository 先寫入來源（API），feature hook 收到結果再 setState。
 * Store 唔自己 cache／persist domain，避免同 repository 出現雙重 source of truth。
 */
export type AppState = AppDomainState & {
    setAccounts: (accounts: Account[]) => void;
    setCategories: (categories: Category[]) => void;
    setMerchants: (merchants: Merchant[]) => void;
    setTransactions: (transactions: Transaction[], meta?: PaginationMeta | null) => void;
    setRecurringRules: (rules: RecurringRule[]) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: LocalError | null) => void;
    resetAppState: () => void;
};

export const useAppStore = create<AppState>()(set => ({
    ...EMPTY_APP_STATE,
    setAccounts: accounts => set({accounts}),
    setCategories: categories => set({categories}),
    setMerchants: merchants => set({merchants}),
    setTransactions: (transactions, meta) => set({transactions, transactionsMeta: meta ?? null}),
    setRecurringRules: recurringRules => set({recurringRules}),
    setLoading: isLoading => set({isLoading}),
    setError: error => set({error}),
    resetAppState: () => set({...EMPTY_APP_STATE}),
}));
