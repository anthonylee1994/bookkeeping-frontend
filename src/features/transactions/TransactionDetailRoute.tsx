import React from "react";
import {TransactionDetailDrawer} from "@/features/transactions/TransactionDetailDrawer";

/** 詳情 URL 只控制 drawer；交易列表由 `TransactionsLayout` 保留做遮罩後背景。 */
export const TransactionDetailRoute = () => {
    return (
        <React.Fragment>
            <TransactionDetailDrawer />
        </React.Fragment>
    );
};
