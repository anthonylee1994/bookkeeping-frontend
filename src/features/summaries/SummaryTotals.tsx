import {useIntl} from "react-intl";
import {SummaryTotalsGrid} from "@/components/SummaryTotalsGrid";
import type {Summary} from "@/data/types";
import {messages} from "@/lib/i18n";

type SummaryTotalsProps = {
    summary: Summary;
};

/** 淨額、收入、支出三個數字。 */
export const SummaryTotals = ({summary}: SummaryTotalsProps) => {
    const intl = useIntl();

    return (
        <SummaryTotalsGrid
            netCents={summary.net_cents}
            incomeCents={summary.income_cents}
            expenseCents={summary.expense_cents}
            netLabel={intl.formatMessage(messages.summaries.net)}
            incomeLabel={intl.formatMessage(messages.summaries.income)}
            expenseLabel={intl.formatMessage(messages.summaries.expense)}
        />
    );
};
