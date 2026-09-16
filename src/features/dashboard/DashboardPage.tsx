import React from "react";
import {Alert, Button, SimpleGrid, Stack} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {useSearchParams} from "react-router";
import {LoadingIndicator} from "@/components/layout/LoadingIndicator";
import {PageHeader} from "@/components/layout/PageHeader";
import {dateSchema} from "@/data/schema";
import {AccountBalancesCard} from "@/features/dashboard/AccountBalancesCard";
import {DashboardEmptyState} from "@/features/dashboard/DashboardEmptyState";
import {DashboardQuickActions} from "@/features/dashboard/DashboardQuickActions";
import {DashboardSummary} from "@/features/dashboard/DashboardSummary";
import {MonthNavigator} from "@/features/dashboard/MonthNavigator";
import {RecentTransactionsCard} from "@/features/dashboard/RecentTransactionsCard";
import {UpcomingRecurringCard} from "@/features/dashboard/UpcomingRecurringCard";
import {useDashboard} from "@/features/dashboard/useDashboard";
import {useDomainReference} from "@/hooks/useDomainReference";
import {addMonthsToDate, toDisplayMonth, toIsoDate, todayDate} from "@/lib/date";
import {messages} from "@/lib/i18n";

/** Chart 連 recharts 一併 code-split，不想拖大儀表板 critical bundle。 */
const CategoryBreakdownChart = React.lazy(() => import("@/components/CategoryBreakdownChart").then(module => ({default: module.CategoryBreakdownChart})));

const RECENT_TRANSACTION_LIMIT = 10;

/** URL 上的 `date` 有校驗；未填或格式錯誤即當作今日（即當月）。 */
function resolveDashboardDate(value: string | null): string {
    if (value !== null && dateSchema.safeParse(value).success) return value;
    return todayDate();
}

export const DashboardPage = () => {
    const intl = useIntl();
    const [searchParams, setSearchParams] = useSearchParams();
    const date = resolveDashboardDate(searchParams.get("date"));
    const {dashboard, isLoading, error, reload} = useDashboard(date);
    const reference = useDomainReference();

    const changeMonth = (amount: number) => {
        setSearchParams(previous => {
            const next = new URLSearchParams(previous);
            next.set("date", addMonthsToDate(date, amount));
            return next;
        });
    };

    const renderBody = () => {
        if (isLoading) return <LoadingIndicator minH="24rem" />;

        if (error !== null || dashboard === null) {
            return (
                <Alert.Root status="error" role="alert" rounded="xl">
                    <Alert.Indicator />
                    <Alert.Title flex="1">{error?.message ?? intl.formatMessage(messages.dashboard.loadFailed)}</Alert.Title>
                    <Button size="sm" variant="outline" onClick={reload}>
                        {intl.formatMessage(messages.common.retry)}
                    </Button>
                </Alert.Root>
            );
        }

        const isEmpty = dashboard.recent_transactions.length === 0 && dashboard.by_category.length === 0;
        if (isEmpty) {
            return (
                <Stack gap="5">
                    <DashboardSummary dashboard={dashboard} />
                    <DashboardQuickActions />
                    <DashboardEmptyState />
                </Stack>
            );
        }

        const balances = dashboard.account_balances.length > 0 ? dashboard.account_balances : dashboard.accounts;
        const upcoming = dashboard.upcoming_recurring.length > 0 ? dashboard.upcoming_recurring : dashboard.recurring_reminders;
        const kindName = (kind: "income" | "expense") => intl.formatMessage(kind === "income" ? messages.transactions.income : messages.transactions.expense);

        return (
            <Stack gap="5">
                <DashboardSummary dashboard={dashboard} />
                <DashboardQuickActions />
                <SimpleGrid columns={{base: 1, lg: 2}} gap="4">
                    <React.Suspense fallback={<LoadingIndicator minH={{base: "26rem", md: "18rem"}} />}>
                        <CategoryBreakdownChart
                            breakdown={dashboard.by_category}
                            kind="expense"
                            title={intl.formatMessage(messages.dashboard.expenseCategoryTitle)}
                            description={intl.formatMessage(messages.dashboard.expenseCategoryDescription)}
                            emptyMessage={intl.formatMessage(messages.dashboard.noCategoryData, {kind: kindName("expense")})}
                            categories={reference.categories}
                        />
                    </React.Suspense>
                    <React.Suspense fallback={<LoadingIndicator minH={{base: "26rem", md: "18rem"}} />}>
                        <CategoryBreakdownChart
                            breakdown={dashboard.by_category}
                            kind="income"
                            title={intl.formatMessage(messages.dashboard.incomeCategoryTitle)}
                            description={intl.formatMessage(messages.dashboard.incomeCategoryDescription)}
                            emptyMessage={intl.formatMessage(messages.dashboard.noCategoryData, {kind: kindName("income")})}
                            categories={reference.categories}
                        />
                    </React.Suspense>
                </SimpleGrid>
                <SimpleGrid columns={{base: 1, lg: 2}} gap="4">
                    <AccountBalancesCard balances={balances} accounts={reference.accounts} from={toIsoDate(dashboard.range.from)} to={toIsoDate(dashboard.range.to)} />
                    <UpcomingRecurringCard rules={upcoming} />
                </SimpleGrid>
                <RecentTransactionsCard transactions={dashboard.recent_transactions.slice(0, RECENT_TRANSACTION_LIMIT)} />
            </Stack>
        );
    };

    return (
        <React.Fragment>
            <PageHeader
                title={intl.formatMessage(messages.nav.dashboard)}
                actionsFullWidth
                actions={
                    <MonthNavigator
                        label={toDisplayMonth(date)}
                        previousLabel={intl.formatMessage(messages.dashboard.previousMonth)}
                        nextLabel={intl.formatMessage(messages.dashboard.nextMonth)}
                        onPrevious={() => changeMonth(-1)}
                        onNext={() => changeMonth(1)}
                    />
                }
            />
            {renderBody()}
        </React.Fragment>
    );
};
