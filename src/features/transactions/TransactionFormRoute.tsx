import React from "react";
import {TransactionFormPage} from "@/features/transactions/TransactionFormPage";
import {TransactionsPage} from "@/features/transactions/TransactionsPage";

/** 所有 viewport 都保留交易列表做背景，再由 responsive drawer 顯示表單。 */
export const TransactionFormRoute = () => {
    return (
        <React.Fragment>
            <TransactionsPage />
            <TransactionFormPage />
        </React.Fragment>
    );
};
