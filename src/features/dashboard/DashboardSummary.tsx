import {useIntl} from "react-intl";
import {SummaryTotalsGrid} from "@/components/SummaryTotalsGrid";
import type {Dashboard} from "@/data/types";
import {messages} from "@/lib/i18n";

type DashboardSummaryProps = {
    dashboard: Dashboard;
};

/** 本月淨額、收入、支出三個數字。 */
export const DashboardSummary = ({dashboard}: DashboardSummaryProps) => {
    const intl = useIntl();

    return (
        <SummaryTotalsGrid
            netCents={dashboard.net_cents}
            incomeCents={dashboard.income_cents}
            expenseCents={dashboard.expense_cents}
            netLabel={intl.formatMessage(messages.dashboard.net)}
            incomeLabel={intl.formatMessage(messages.dashboard.income)}
            expenseLabel={intl.formatMessage(messages.dashboard.expense)}
        />
    );
};
