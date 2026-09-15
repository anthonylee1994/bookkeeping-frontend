import React from "react";
import {TransactionDetailDrawer} from "@/features/transactions/TransactionDetailDrawer";
import {TransactionsPage} from "@/features/transactions/TransactionsPage";

/** 詳情 URL 只控制 drawer；交易列表永遠保留做遮罩後背景。 */
export const TransactionDetailRoute = () => {
    return (
        <React.Fragment>
            <TransactionsPage />
            <TransactionDetailDrawer />
        </React.Fragment>
    );
};
