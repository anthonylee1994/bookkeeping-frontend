import React from "react";
import {TransactionFormPage} from "@/features/transactions/TransactionFormPage";

/** 新增／修改交易：列表由 `TransactionsLayout` 保留做背景，這裡只負責 responsive drawer。 */
export const TransactionFormRoute = () => {
    return (
        <React.Fragment>
            <TransactionFormPage />
        </React.Fragment>
    );
};
