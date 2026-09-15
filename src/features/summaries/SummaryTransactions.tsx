import {Box, Button, Flex, HStack, Stack, Text} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {SectionCard} from "@/components/layout/SectionCard";
import type {Paginated, TransactionRow} from "@/data/types";
import {toDisplayDate} from "@/lib/date";
import {messages} from "@/lib/i18n";
import {transactionDisplayAmount, transactionTitle, transactionTone} from "@/lib/transactionDisplay";
import {transactionDetailPath} from "@/routes/paths";

type SummaryTransactionsProps = {
    transactions: Paginated<TransactionRow>;
    onPageChange: (page: number) => void;
};

/** 期內交易（只包括收入及支出；轉帳另有獨立卡片）。 */
export const SummaryTransactions = ({transactions, onPageChange}: SummaryTransactionsProps) => {
    const intl = useIntl();
    const {page, total_pages: totalPages} = transactions.meta;

    return (
        <SectionCard title={intl.formatMessage(messages.summaries.transactionsTitle)} description={intl.formatMessage(messages.summaries.transactionsDescription)}>
            {transactions.data.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                    {intl.formatMessage(messages.summaries.noTransactions)}
                </Text>
            ) : (
                <Flex direction="column" gap="3">
                    <Stack gap="1">
                        {transactions.data.map(transaction => (
                            <Box key={transaction.id} asChild rounded="lg" px="3" py="2.5" transition="background 150ms ease" _hover={{bg: "bg.subtle"}}>
                                <Link to={transactionDetailPath(transaction.id)}>
                                    <Flex justify="space-between" align="center" gap="3">
                                        <Box minW="0">
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
                        ))}
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
