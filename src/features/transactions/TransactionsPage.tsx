import React from "react";
import {Alert, Box, Button, EmptyState, Flex, HStack, NativeSelect, Stack, Text, VStack} from "@chakra-ui/react";
import {FileQuestionIcon, PlusIcon, ScanLineIcon, WalletIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link, useNavigate, useSearchParams} from "react-router";
import {LoadingIndicator} from "@/components/layout/LoadingIndicator";
import {PageHeader} from "@/components/layout/PageHeader";
import type {SortOrder, Transaction, TransactionFilters, TransactionSortField} from "@/data/types";
import {useScan} from "@/features/receiptScan/ScanProvider";
import {TransactionFilterChips} from "@/features/transactions/TransactionFilterChips";
import {TransactionFiltersPanel} from "@/features/transactions/TransactionFiltersPanel";
import {TransactionList} from "@/features/transactions/TransactionList";
import {TransactionsSummaryBar} from "@/features/transactions/TransactionsSummaryBar";
import {TransactionsTable} from "@/features/transactions/TransactionsTable";
import {matchQuickRange, quickRangeToFilters} from "@/features/transactions/transactionQuickRanges";
import type {QuickRange} from "@/features/transactions/transactionQuickRanges";
import {TransactionsToolbar} from "@/features/transactions/TransactionsToolbar";
import {buildTransactionAvatarMaps, countActiveFilters, describeActiveFilters, summarisePage} from "@/features/transactions/transactionsFormat";
import type {TransactionAvatarMaps, TransactionNameMaps} from "@/features/transactions/transactionsFormat";
import {useTransactions} from "@/features/transactions/useTransactions";
import {DESKTOP_QUERY, useMediaQuery} from "@/hooks/useMediaQuery";
import {useDomainReference} from "@/hooks/useDomainReference";
import {messages} from "@/lib/i18n";
import {DEFAULT_PER_PAGE, parseTransactionFilters, serializeTransactionFilters} from "@/lib/searchParams";
import {transactionDetailPath, transactionNewPath} from "@/routes/paths";

const DEFAULT_SORT: TransactionSortField = "occurred_at";
const DEFAULT_ORDER: SortOrder = "desc";
const PER_PAGE_OPTIONS = [25, 50, 100];

export const TransactionsPage = () => {
    const intl = useIntl();
    const navigate = useNavigate();
    const {startScan} = useScan();
    const isDesktop = useMediaQuery(DESKTOP_QUERY);
    const [searchParams, setSearchParams] = useSearchParams();
    const reference = useDomainReference();

    const filters = parseTransactionFilters(searchParams);
    const sort = filters.sort ?? DEFAULT_SORT;
    const order = filters.order ?? DEFAULT_ORDER;
    const perPage = filters.per_page ?? DEFAULT_PER_PAGE;
    const queryFilters: TransactionFilters = {...filters, sort, order, per_page: perPage, page: filters.page ?? 1};
    const {page, isLoading, error, reload} = useTransactions(queryFilters);

    const names: TransactionNameMaps = {
        accounts: React.useMemo(() => new Map(reference.accounts.map(account => [account.id, account.name])), [reference.accounts]),
        categories: React.useMemo(() => new Map(reference.categories.map(category => [category.id, category.name])), [reference.categories]),
        merchants: React.useMemo(() => new Map(reference.merchants.map(merchant => [merchant.id, merchant.name])), [reference.merchants]),
    };

    const avatars: TransactionAvatarMaps = React.useMemo(() => buildTransactionAvatarMaps(reference.accounts, reference.categories), [reference.accounts, reference.categories]);

    const commit = (next: TransactionFilters) => {
        setSearchParams(serializeTransactionFilters(next));
    };

    /** 改變條件一律返回第一頁，否則會停在一個不存在的頁數。 */
    const commitFromFirstPage = (next: TransactionFilters) => {
        commit({...next, page: undefined});
    };

    const applyFilters = (next: TransactionFilters) => {
        commitFromFirstPage({...next, sort: filters.sort, order: filters.order, per_page: filters.per_page});
    };

    const search = (keyword: string) => {
        commitFromFirstPage({...filters, keyword: keyword === "" ? undefined : keyword});
    };

    const changeRange = (range: QuickRange) => {
        commitFromFirstPage({...filters, ...quickRangeToFilters(range)});
    };

    const removeFilter = (key: keyof TransactionFilters) => {
        commitFromFirstPage({...filters, [key]: undefined});
    };

    const changeSort = (nextSort: TransactionSortField, nextOrder: SortOrder) => {
        commitFromFirstPage({...filters, sort: nextSort, order: nextOrder});
    };

    const changePerPage = (next: number) => {
        commitFromFirstPage({...filters, per_page: next});
    };

    const changePage = (nextPage: number) => {
        commit({...filters, page: nextPage});
        document.getElementById("transaction-list-top")?.scrollIntoView({block: "start"});
    };

    const openTransaction = (transaction: Transaction) => {
        navigate(transactionDetailPath(transaction.id, searchParams.toString()));
    };
    const activeFilterCount = countActiveFilters(filters);
    const chips = describeActiveFilters(filters, names);
    /** Mobile list 沒有日期欄，靠分組顯示日期；但只有按日期排序時分組才有意義。 */
    const grouped = sort === "occurred_at";

    const renderBody = () => {
        if (isLoading) return <LoadingIndicator minH="24rem" />;

        if (error !== null) {
            return (
                <Alert.Root status="error" role="alert" rounded="xl">
                    <Alert.Indicator />
                    <Alert.Title flex="1">{error.message}</Alert.Title>
                    <Button size="sm" variant="outline" onClick={reload}>
                        {intl.formatMessage(messages.common.retry)}
                    </Button>
                </Alert.Root>
            );
        }

        if (page === null) return null;

        if (page.meta.total === 0) {
            return (
                <EmptyState.Root bg="bg.panel" borderWidth="1px" borderColor="border" rounded="xl" py="12">
                    <EmptyState.Content>
                        <EmptyState.Indicator>{activeFilterCount > 0 ? <FileQuestionIcon /> : <WalletIcon />}</EmptyState.Indicator>
                        <VStack gap="1" textAlign="center">
                            <EmptyState.Title>{intl.formatMessage(activeFilterCount > 0 ? messages.common.noResults : messages.transactions.list.emptyTitle)}</EmptyState.Title>
                            <Text fontSize="sm" color="fg.muted">
                                {intl.formatMessage(messages.transactions.list.emptyDescription)}
                            </Text>
                        </VStack>
                        {activeFilterCount > 0 ? (
                            <Button variant="outline" onClick={() => commit({})}>
                                {intl.formatMessage(messages.common.clearFilters)}
                            </Button>
                        ) : (
                            <Button asChild>
                                <Link to={transactionNewPath(searchParams.toString())}>
                                    <PlusIcon />
                                    {intl.formatMessage(messages.transactions.list.emptyAction)}
                                </Link>
                            </Button>
                        )}
                    </EmptyState.Content>
                </EmptyState.Root>
            );
        }

        const currentPage = page.meta.page;
        const totalPages = page.meta.total_pages;

        return (
            <Stack gap="3">
                <TransactionsSummaryBar total={page.meta.total} totals={summarisePage(page.data)} />
                {isDesktop ? (
                    <TransactionsTable transactions={page.data} names={names} avatars={avatars} sort={sort} order={order} onSelect={openTransaction} onSortChange={changeSort} />
                ) : (
                    <TransactionList transactions={page.data} names={names} avatars={avatars} grouped={grouped} search={searchParams.toString()} />
                )}

                <Flex wrap="wrap" align="center" justify="space-between" gap="3" pt="1">
                    <NativeSelect.Root size="sm" w="auto" display={{base: "none", md: "inline-flex"}}>
                        <NativeSelect.Field aria-label={intl.formatMessage(messages.transactions.sort.perPage)} value={String(perPage)} onChange={event => changePerPage(Number(event.target.value))}>
                            {PER_PAGE_OPTIONS.map(option => (
                                <option key={option} value={option}>
                                    {`${intl.formatMessage(messages.transactions.sort.perPage)} ${option}`}
                                </option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>

                    {totalPages <= 1 ? (
                        <Box />
                    ) : (
                        <HStack gap="3" ms="auto">
                            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => changePage(currentPage - 1)}>
                                {intl.formatMessage(messages.pagination.previous)}
                            </Button>
                            <Text fontSize="sm" color="fg.muted" fontVariantNumeric="tabular-nums">
                                {intl.formatMessage(messages.pagination.pageOf, {page: currentPage, total: totalPages})}
                            </Text>
                            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => changePage(currentPage + 1)}>
                                {intl.formatMessage(messages.pagination.next)}
                            </Button>
                        </HStack>
                    )}
                </Flex>
            </Stack>
        );
    };

    return (
        <React.Fragment>
            <PageHeader
                title={intl.formatMessage(messages.nav.transactions)}
                actions={
                    // Mobile 已經有 header 掃描 icon 及 FAB，不要再放多一粒同樣動作的 button 佔位。
                    <HStack gap="2" display={{base: "none", md: "inline-flex"}}>
                        <Button variant="outline" onClick={startScan}>
                            <ScanLineIcon />
                            {intl.formatMessage(messages.dashboard.scanReceipt)}
                        </Button>
                        <Button asChild>
                            <Link to={transactionNewPath(searchParams.toString())}>
                                <PlusIcon />
                                {intl.formatMessage(messages.transactions.newTitle)}
                            </Link>
                        </Button>
                    </HStack>
                }
            />
            <Stack gap="3">
                <TransactionsToolbar
                    keyword={filters.keyword ?? ""}
                    range={matchQuickRange(filters) ?? "all"}
                    onSearch={search}
                    onRangeChange={changeRange}
                    filterControl={
                        <TransactionFiltersPanel
                            filters={filters}
                            activeCount={activeFilterCount}
                            accounts={reference.accounts}
                            categories={reference.categories}
                            merchants={reference.merchants}
                            onApply={applyFilters}
                            onReset={() => commit({})}
                        />
                    }
                />
                <TransactionFilterChips chips={chips} onRemove={removeFilter} onClearAll={() => commit({})} />
                <Box id="transaction-list-top" />
                {renderBody()}
            </Stack>
        </React.Fragment>
    );
};
