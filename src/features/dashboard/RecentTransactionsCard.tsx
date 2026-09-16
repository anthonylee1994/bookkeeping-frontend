import React from "react";
import {Box, Button, Flex, Stack, Text} from "@chakra-ui/react";
import {ArrowLeftRightIcon, TagIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {EntityAvatar} from "@/components/EntityAvatar";
import {SectionCard} from "@/components/layout/SectionCard";
import type {Category, TransactionRow} from "@/data/types";
import {toDisplayDate} from "@/lib/date";
import {messages} from "@/lib/i18n";
import {transactionDisplayAmount, transactionTitle, transactionTone} from "@/lib/transactionDisplay";
import {ROUTES, transactionDetailPath} from "@/routes/paths";

type RecentTransactionsCardProps = {
    transactions: TransactionRow[];
    /** 分類參考資料（含 color／icon）；交易 payload 只有 category_id。 */
    categories: Category[];
};

/** 最近交易；每行連去交易詳情。 */
export const RecentTransactionsCard = ({transactions, categories}: RecentTransactionsCardProps) => {
    const intl = useIntl();
    const categoryById = React.useMemo(() => new Map(categories.map(category => [category.id, category])), [categories]);

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
                    {transactions.map(transaction => {
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
            )}
        </SectionCard>
    );
};
