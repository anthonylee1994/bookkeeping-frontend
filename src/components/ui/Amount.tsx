import React from "react";
import {formatSignedAmount} from "@/lib/money";
import {cn} from "@/lib/utils";
import type {TransactionKind} from "@/data/types";

type AmountProps = React.ComponentProps<"span"> & {
    cents: number;
    kind: TransactionKind;
    isRefund?: boolean;
};

const TONE_CLASS: Record<TransactionKind, string> = {
    income: "text-income",
    expense: "text-expense",
    transfer: "text-transfer",
};

/** 金額顯示：`HK$1,234.50`，收入／支出／退款同時帶正負號或「退款」文字。 */
export const Amount = ({cents, kind, isRefund = false, className, ...props}: AmountProps) => {
    return (
        <span data-kind={kind} className={cn("font-medium whitespace-nowrap tabular-nums", isRefund ? "text-refund" : TONE_CLASS[kind], className)} {...props}>
            {formatSignedAmount({cents, kind, isRefund})}
        </span>
    );
};
