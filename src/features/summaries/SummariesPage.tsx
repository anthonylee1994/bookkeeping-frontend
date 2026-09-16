import React from "react";
import {Alert, Button, SimpleGrid, Stack} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {useSearchParams} from "react-router";
import {CategoryBreakdownChart} from "@/components/CategoryBreakdownChart";
import {LoadingIndicator} from "@/components/layout/LoadingIndicator";
import {PageHeader} from "@/components/layout/PageHeader";
import type {SummaryPeriod} from "@/data/types";
import {SummaryAccountBreakdown} from "@/features/summaries/SummaryAccountBreakdown";
import {SummaryCalendarCard} from "@/features/summaries/SummaryCalendarCard";
import {SummaryPeriodControl} from "@/features/summaries/SummaryPeriodControl";
import {SummaryPeriodNavigator} from "@/features/summaries/SummaryPeriodNavigator";
import {SummaryTotals} from "@/features/summaries/SummaryTotals";
import {SummaryTransactions} from "@/features/summaries/SummaryTransactions";
import {periodRangeLabel, shiftPeriod} from "@/features/summaries/summariesFormat";
import {useSummary} from "@/features/summaries/useSummary";
import {useDomainReference} from "@/hooks/useDomainReference";
import {todayDate} from "@/lib/date";
import {messages} from "@/lib/i18n";
import {parseSummaryParams, serializeSummaryParams} from "@/lib/searchParams";
import type {SummaryParams} from "@/lib/searchParams";

export const SummariesPage = () => {
    const intl = useIntl();
    const [searchParams, setSearchParams] = useSearchParams();

    const params = parseSummaryParams(searchParams);
    const period = params.period;
    const date = params.date ?? todayDate();
    const page = params.page ?? 1;
    const {summary, isLoading, error, reload} = useSummary(period, date, page);
    const reference = useDomainReference();

    // 換期間或日期一律由第一頁重新開始；serialize 不帶 page 就等於清除。
    const commit = (next: SummaryParams) => setSearchParams(serializeSummaryParams(next));
    const changePeriod = (nextPeriod: SummaryPeriod) => commit({period: nextPeriod, date: params.date});
    const changeDate = (nextDate: string) => commit({period, date: nextDate === "" ? undefined : nextDate});
    const shift = (amount: number) => commit({period, date: shiftPeriod(date, period, amount)});
    const changePage = (nextPage: number) => commit({period, date: params.date, page: nextPage});

    const renderBody = () => {
        if (isLoading) return <LoadingIndicator minH="24rem" />;

        if (error !== null || summary === null) {
            return (
                <Alert.Root status="error" role="alert" rounded="xl">
                    <Alert.Indicator />
                    <Alert.Title flex="1">{error?.message ?? intl.formatMessage(messages.summaries.loadFailed)}</Alert.Title>
                    <Button size="sm" variant="outline" onClick={reload}>
                        {intl.formatMessage(messages.common.retry)}
                    </Button>
                </Alert.Root>
            );
        }

        const kindName = (kind: "income" | "expense") => intl.formatMessage(kind === "income" ? messages.summaries.income : messages.summaries.expense);

        return (
            <Stack gap="5">
                <SummaryTotals summary={summary} />
                {period === "monthly" ? <SummaryCalendarCard daily={summary.daily} date={date} netCents={summary.net_cents} /> : null}
                <SimpleGrid columns={{base: 1, lg: 2}} gap="4" alignItems="start">
                    <CategoryBreakdownChart
                        breakdown={summary.by_category}
                        kind="expense"
                        title={intl.formatMessage(messages.summaries.expenseCategoryTitle)}
                        description={intl.formatMessage(messages.summaries.expenseCategoryDescription)}
                        limit={summary.by_category.length}
                        emptyMessage={intl.formatMessage(messages.summaries.noCategoryData, {kind: kindName("expense")})}
                        categories={reference.categories}
                    />
                    <CategoryBreakdownChart
                        breakdown={summary.by_category}
                        kind="income"
                        title={intl.formatMessage(messages.summaries.incomeCategoryTitle)}
                        description={intl.formatMessage(messages.summaries.incomeCategoryDescription)}
                        limit={summary.by_category.length}
                        emptyMessage={intl.formatMessage(messages.summaries.noCategoryData, {kind: kindName("income")})}
                        categories={reference.categories}
                    />
                </SimpleGrid>
                <SimpleGrid columns={{base: 1, lg: 2}} gap="4">
                    <SummaryAccountBreakdown breakdown={summary.by_account} accounts={reference.accounts} />
                    <SummaryTransactions transactions={summary.transactions} onPageChange={changePage} categories={reference.categories} />
                </SimpleGrid>
            </Stack>
        );
    };

    return (
        <React.Fragment>
            <PageHeader title={intl.formatMessage(messages.nav.summaries)} actions={<SummaryPeriodControl period={period} onChange={changePeriod} />} />
            <Stack gap="4">
                <SummaryPeriodNavigator date={date} label={periodRangeLabel(date, period)} onDateChange={changeDate} onPrevious={() => shift(-1)} onNext={() => shift(1)} />
                {renderBody()}
            </Stack>
        </React.Fragment>
    );
};
