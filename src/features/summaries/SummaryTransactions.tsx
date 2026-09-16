import React from "react";
import {Box, Button, Flex, HStack, Stack, Text} from "@chakra-ui/react";
import {ArrowLeftRightIcon, ReceiptTextIcon, TagIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {CardEmptyState} from "@/components/CardEmptyState";
import {EntityAvatar} from "@/components/EntityAvatar";
import {SectionCard} from "@/components/layout/SectionCard";
import type {Category, Paginated, TransactionRow} from "@/data/types";
import {toDisplayDate} from "@/lib/date";
import {messages} from "@/lib/i18n";
import {transactionDisplayAmount, transactionTitle, transactionTone} from "@/lib/transactionDisplay";
import {transactionDetailPath} from "@/routes/paths";

type SummaryTransactionsProps = {
    transactions: Paginated<TransactionRow>;
    onPageChange: (page: number) => void;
    /** 分類參考資料（含 color／icon）；交易 payload 只有 category_id。 */
    categories: Category[];
};

/** 期內交易（只包括收入及支出；轉帳另有獨立卡片）。 */
export const SummaryTransactions = ({transactions, onPageChange, categories}: SummaryTransactionsProps) => {
    const intl = useIntl();
    const {page, total_pages: totalPages} = transactions.meta;
    const categoryById = React.useMemo(() => new Map(categories.map(category => [category.id, category])), [categories]);

    return (
        <SectionCard title={intl.formatMessage(messages.summaries.transactionsTitle)} description={intl.formatMessage(messages.summaries.transactionsDescription)}>
            {transactions.data.length === 0 ? (
                <CardEmptyState icon={<ReceiptTextIcon />} message={intl.formatMessage(messages.summaries.noTransactions)} />
            ) : (
                <Flex direction="column" gap="3">
                    <Stack gap="1">
                        {transactions.data.map(transaction => {
                            const isTransfer = transaction.kind === "transfer";
                            const category = transaction.category_id != null ? categoryById.get(transaction.category_id) : undefined;
                            return (
                                <Box key={transaction.id} asChild rounded="lg" px="3" py="2.5" transition="background 150ms ease" _hover={{bg: "bg.subtle"}}>
                                    <Link to={transactionDetailPath(transaction.id)}>
                                        <Flex justify="space-between" align="center" gap="3">
                                            <EntityAvatar
                                                size="sm"
                                                icon={isTransfer ? null : (category?.icon ?? null)}
                                                color={isTransfer ? "transfer" : (category?.color ?? null)}
                                                fallbackIcon={isTransfer ? ArrowLeftRightIcon : TagIcon}
                                            />
                                            <Box minW="0" flex="1">
                                                <Text fontSize="sm" fontWeight="medium" truncate>
                                                    {transactionTitle(transaction)}
                                                </Text>
                                                <Text fontSize="xs" color="fg.muted">
                                                    {toDisplayDate(transaction.occurred_at)}
                                                </Text>
                                            </Box>
                                            <Text fontSize="sm" fontWeight="semibold" color={transactionTone(transaction)} flexShrink="0" whiteSpace="nowrap" fontVariantNumeric="tabular-nums">
                                                {transactionDisplayAmount(transaction)}
                                            </Text>
                                        </Flex>
                                    </Link>
                                </Box>
                            );
                        })}
                    </Stack>

                    {totalPages <= 1 ? null : (
                        <HStack justify="flex-end" gap="3">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                                {intl.formatMessage(messages.pagination.previous)}
                            </Button>
                            <Text fontSize="sm" color="fg.muted" fontVariantNumeric="tabular-nums">
                                {intl.formatMessage(messages.pagination.pageOf, {page, total: totalPages})}
                            </Text>
                            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                                {intl.formatMessage(messages.pagination.next)}
                            </Button>
                        </HStack>
                    )}
                </Flex>
            )}
        </SectionCard>
    );
};
