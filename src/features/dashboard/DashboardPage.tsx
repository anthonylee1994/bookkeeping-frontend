import React from "react";
import {Alert, Button, SimpleGrid, Skeleton, Stack} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {useSearchParams} from "react-router";
import {PageHeader} from "@/components/layout/PageHeader";
import {dateSchema} from "@/data/schema";
import {AccountBalancesCard} from "@/features/dashboard/AccountBalancesCard";
import {DashboardEmptyState} from "@/features/dashboard/DashboardEmptyState";
import {DashboardQuickActions} from "@/features/dashboard/DashboardQuickActions";
import {DashboardSkeleton} from "@/features/dashboard/DashboardSkeleton";
import {DashboardSummary} from "@/features/dashboard/DashboardSummary";
import {MonthNavigator} from "@/features/dashboard/MonthNavigator";
import {RecentTransactionsCard} from "@/features/dashboard/RecentTransactionsCard";
import {UpcomingRecurringCard} from "@/features/dashboard/UpcomingRecurringCard";
import {useDashboard} from "@/features/dashboard/useDashboard";
import {addMonthsToDate, toDisplayMonth, toIsoDate, todayDate} from "@/lib/date";
import {messages} from "@/lib/i18n";

/** Chart 連 recharts 一齊 code-split，唔想拖大儀表板 critical bundle。 */
const CategorySpendingChart = React.lazy(() => import("@/features/dashboard/CategorySpendingChart").then(module => ({default: module.CategorySpendingChart})));

const RECENT_TRANSACTION_LIMIT = 10;

/** URL 上嘅 `date` 有校驗；無填或格式錯就當今日（即當月）。 */
function resolveDashboardDate(value: string | null): string {
    if (value !== null && dateSchema.safeParse(value).success) return value;
    return todayDate();
}

export const DashboardPage = () => {
    const intl = useIntl();
    const [searchParams, setSearchParams] = useSearchParams();
    const date = resolveDashboardDate(searchParams.get("date"));
    const {dashboard, isLoading, error, reload} = useDashboard(date);

    const changeMonth = (amount: number) => {
        setSearchParams(previous => {
            const next = new URLSearchParams(previous);
            next.set("date", addMonthsToDate(date, amount));
            return next;
        });
    };

    const renderBody = () => {
        if (isLoading) return <DashboardSkeleton />;

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

        return (
            <Stack gap="5">
                <DashboardSummary dashboard={dashboard} />
                <DashboardQuickActions />
                <React.Suspense fallback={<Skeleton h={{base: "26rem", md: "18rem"}} rounded="xl" />}>
                    <CategorySpendingChart breakdown={dashboard.by_category} />
                </React.Suspense>
                <SimpleGrid columns={{base: 1, lg: 2}} gap="4">
                    <AccountBalancesCard balances={balances} from={toIsoDate(dashboard.range.from)} to={toIsoDate(dashboard.range.to)} />
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
