import React from "react";
import {TransactionsRepository} from "@/data/transactionsRepository";
import type {LocalError, Paginated, Transaction, TransactionFilters} from "@/data/types";
import {serializeTransactionFilters} from "@/lib/searchParams";
import {useAuthStore} from "@/stores/authStore";

export type TransactionsQuery = {
    page: Paginated<Transaction> | null;
    isLoading: boolean;
    error: LocalError | null;
    reload: () => void;
};

/** 依 URL filter 抓取交易分頁；filter 一變即重新抓取，`reload` 用於錯誤重試。 */
export function useTransactions(filters: TransactionFilters): TransactionsQuery {
    const token = useAuthStore(state => state.token);
    const [page, setPage] = React.useState<Paginated<Transaction> | null>(null);
    const [isLoading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<LocalError | null>(null);
    const [reloadToken, setReloadToken] = React.useState(0);
    const filtersKey = serializeTransactionFilters(filters).toString();

    React.useEffect(() => {
        if (token === null) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPage(null);
            setLoading(false);
            return;
        }

        let active = true;
        setLoading(true);
        setError(null);

        void new TransactionsRepository(token).list(filters).then(result => {
            if (!active) return;
            if (result.ok) {
                setPage(result.value);
            } else {
                setError(result.error);
            }
            setLoading(false);
        });

        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, filtersKey, reloadToken]);

    const reload = () => setReloadToken(value => value + 1);

    return {page, isLoading, error, reload};
}
