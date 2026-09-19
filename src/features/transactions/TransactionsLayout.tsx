import React from "react";
import {Outlet} from "react-router";
import {TransactionsPage} from "@/features/transactions/TransactionsPage";

export {TransactionDetailRoute} from "@/features/transactions/TransactionDetailRoute";
export {TransactionFormRoute} from "@/features/transactions/TransactionFormRoute";

/**
 * `/transactions` 子樹的 layout：交易列表永遠 mount 住，detail／form drawer 由 child route 經 `Outlet` 疊上，
 * 咁樣開 drawer 同閂 drawer 都唔會重新抓取列表，只有交易 mutation（經 `transactionsRevision`）先會刷新。
 */
export const TransactionsLayout = () => {
    return (
        <React.Fragment>
            <TransactionsPage />
            <Outlet />
        </React.Fragment>
    );
};
