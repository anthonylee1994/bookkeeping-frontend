import React from "react";
import {TransactionsRepository} from "@/data/transactionsRepository";
import type {LocalError, Paginated, Transaction, TransactionFilters} from "@/data/types";
import {serializeTransactionFilters} from "@/lib/searchParams";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";

export type TransactionsQuery = {
    page: Paginated<Transaction> | null;
    isLoading: boolean;
    error: LocalError | null;
    reload: () => void;
};

type TransactionsResult = {
    key: string;
    page: Paginated<Transaction> | null;
    error: LocalError | null;
};

/**
 * 依 URL filter 抓取交易分頁；filter 一變即重新抓取，`reload` 用於錯誤重試。
 * `transactionsRevision` 於交易 mutation 後加一，令列表（在 drawer route 之間保持 mount）重新抓取。
 */
export function useTransactions(filters: TransactionFilters): TransactionsQuery {
    const token = useAuthStore(state => state.token);
    const revision = useAppStore(state => state.transactionsRevision);
    const [result, setResult] = React.useState<TransactionsResult | null>(null);
    const [reloadToken, setReloadToken] = React.useState(0);
    const filtersKey = serializeTransactionFilters(filters).toString();
    const requestKey = `${token ?? ""}:${filtersKey}:${reloadToken}:${revision}`;
    // Effect 只依賴序列化後的 filtersKey，用 ref 讀取最新 filter 內容，避免每次 render 都重新抓取。
    const filtersRef = React.useRef(filters);

    React.useEffect(() => {
        filtersRef.current = filters;
    });

    React.useEffect(() => {
        if (token === null) return;

        let active = true;

        void new TransactionsRepository(token).list(filtersRef.current).then(response => {
            if (!active) return;
            if (response.ok) {
                setResult({key: requestKey, page: response.value, error: null});
            } else {
                setResult({key: requestKey, page: null, error: response.error});
            }
        });

        return () => {
            active = false;
        };
    }, [token, requestKey]);

    const reload = () => setReloadToken(value => value + 1);

    const current = token !== null && result !== null && result.key === requestKey ? result : null;
    return {
        page: current?.page ?? null,
        isLoading: token !== null && current === null,
        error: current?.error ?? null,
        reload,
    };
}
