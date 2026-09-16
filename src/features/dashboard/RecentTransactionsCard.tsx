import {Box, Button, Flex, Stack, Text} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {TransactionKindIcon} from "@/components/TransactionKindIcon";
import {SectionCard} from "@/components/layout/SectionCard";
import type {TransactionRow} from "@/data/types";
import {toDisplayDate} from "@/lib/date";
import {messages} from "@/lib/i18n";
import {transactionDisplayAmount, transactionTitle, transactionTone} from "@/lib/transactionDisplay";
import {ROUTES, transactionDetailPath} from "@/routes/paths";

type RecentTransactionsCardProps = {
    transactions: TransactionRow[];
};

/** 最近交易；每行連去交易詳情。 */
export const RecentTransactionsCard = ({transactions}: RecentTransactionsCardProps) => {
    const intl = useIntl();

    return (
        <SectionCard
            title={intl.formatMessage(messages.dashboard.recentTitle)}
            action={
                <Button asChild variant="ghost" size="sm">
                    <Link to={ROUTES.transactions}>{intl.formatMessage(messages.dashboard.viewAll)}</Link>
                </Button>
            }
        >
            {transactions.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                    {intl.formatMessage(messages.dashboard.noRecent)}
                </Text>
            ) : (
                <Stack gap="1">
                    {transactions.map(transaction => (
                        <Box key={transaction.id} asChild rounded="lg" px="3" py="2.5" transition="background 150ms ease" _hover={{bg: "bg.subtle"}}>
                            <Link to={transactionDetailPath(transaction.id)}>
                                <Flex justify="space-between" align="center" gap="3">
                                    <TransactionKindIcon kind={transaction.kind} color={transactionTone(transaction)} />
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
                    ))}
                </Stack>
            )}
        </SectionCard>
    );
};
