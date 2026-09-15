import React from "react";
import type {ReactNode} from "react";
import {Badge, Box, Flex, HStack, Icon, Text} from "@chakra-ui/react";
import {ArrowLeftRightIcon, ChevronRightIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import type {Transaction} from "@/data/types";
import {describeTransaction, groupTransactionsByDate} from "@/features/transactions/transactionsFormat";
import type {TransactionNameMaps} from "@/features/transactions/transactionsFormat";
import {toDisplayDate} from "@/lib/date";
import {messages} from "@/lib/i18n";
import {centsToDollars} from "@/lib/money";
import {transactionDetailPath} from "@/routes/paths";

type TransactionListProps = {
    transactions: Transaction[];
    names: TransactionNameMaps;
    /** 只有按日期排序時分組才有意義。 */
    grouped: boolean;
};

/**
 * Mobile 交易列表：按日期分組，組內用分隔線而唔係逐張卡，
 * 咁同樣高度可以多睇幾行，掃描亦更容易。
 */
export const TransactionList = ({transactions, names, grouped}: TransactionListProps) => {
    const intl = useIntl();

    const renderRow = (transaction: Transaction) => {
        const view = describeTransaction(transaction, names);
        return (
            <Box as="li" key={transaction.id} listStyleType="none" _notLast={{borderBottomWidth: "1px", borderColor: "border"}}>
                <Flex asChild align="center" justify="space-between" gap="3" px="4" py="3" transition="background 150ms ease" _hover={{bg: "brand.active/40"}} _active={{bg: "brand.active/60"}}>
                    <Link to={transactionDetailPath(transaction.id)}>
                        <Box minW="0" flex="1">
                            <HStack gap="1.5">
                                {transaction.kind === "transfer" ? (
                                    <Icon size="xs" color="transfer" aria-label={intl.formatMessage(messages.transactions.transfer)}>
                                        <ArrowLeftRightIcon />
                                    </Icon>
                                ) : null}
                                <Text fontWeight="medium" truncate>
                                    {view.primary}
                                </Text>
                                {view.refund ? (
                                    <Badge colorPalette="amber" variant="subtle" rounded="full" flexShrink="0">
                                        {intl.formatMessage(messages.transactions.list.refund)}
                                    </Badge>
                                ) : null}
                            </HStack>
                            <Text fontSize="xs" color="fg.muted" truncate>
                                {[view.category, view.account, view.secondary].filter(value => value !== null).join(" · ")}
                            </Text>
                        </Box>
                        <HStack gap="1" flexShrink="0">
                            <Text fontWeight="semibold" color={view.tone} whiteSpace="nowrap" fontVariantNumeric="tabular-nums">
                                {view.amount}
                            </Text>
                            <Icon size="sm" color="fg.subtle" aria-hidden>
                                <ChevronRightIcon />
                            </Icon>
                        </HStack>
                    </Link>
                </Flex>
            </Box>
        );
    };

    const rowList = (rows: Transaction[]) => (
        <Box as="ul" listStyleType="none" p="0" m="0">
            {rows.map(renderRow)}
        </Box>
    );

    const panel = (children: ReactNode, key?: string) => (
        <Box key={key} bg="bg.panel" borderWidth="1px" borderColor="border" rounded="xl" overflow="hidden">
            {children}
        </Box>
    );

    if (!grouped) return panel(rowList(transactions));

    // 全部組放喺同一塊 panel，日期做 section header。
    // 逐組獨立 panel 會令每日只得一筆時，每筆交易佔雙倍高度。
    // 唔用 sticky：panel 要 overflow hidden 做圓角，而 overflow 會令 sticky 相對錯位。
    return panel(
        groupTransactionsByDate(transactions).map(group => (
            <React.Fragment key={group.date}>
                <Flex justify="space-between" align="baseline" px="4" py="2" bg="bg.subtle" borderBottomWidth="1px" borderColor="border">
                    <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                        {toDisplayDate(group.date)}
                    </Text>
                    <Text fontSize="xs" color="fg.muted" fontVariantNumeric="tabular-nums">
                        {`${group.netCents < 0 ? "" : "+"}${centsToDollars(group.netCents)}`}
                    </Text>
                </Flex>
                {rowList(group.transactions as Transaction[])}
            </React.Fragment>
        ))
    );
};
