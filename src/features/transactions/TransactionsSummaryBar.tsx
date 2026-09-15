import {Flex, HStack, Separator, Text} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import type {PageTotals} from "@/features/transactions/transactionsFormat";
import {messages} from "@/lib/i18n";
import {centsToDollars, signedAmountTone} from "@/lib/money";

type TransactionsSummaryBarProps = {
    total: number;
    totals: PageTotals;
};

/**
 * 結果筆數 + 本頁收支合計。
 * 刻意標明「本頁」：API 一次只回一頁，加總全部結果會是錯誤資訊。
 */
export const TransactionsSummaryBar = ({total, totals}: TransactionsSummaryBarProps) => {
    const intl = useIntl();

    return (
        <Flex wrap="wrap" align="center" justify="space-between" gap="3" px="1">
            <Text fontSize="sm" color="fg.muted">
                {intl.formatMessage(messages.transactions.list.resultsCount, {count: total})}
            </Text>
            {/* 窄螢幕只顯示淨額，收入／支出明細留給有空間的 desktop，不要逼到疊字。 */}
            <HStack gap="3" fontSize="sm" fontVariantNumeric="tabular-nums" separator={<Separator orientation="vertical" h="4" />}>
                <HStack gap="3" display={{base: "none", md: "flex"}} separator={<Separator orientation="vertical" h="4" />}>
                    <Text color="fg.muted">{intl.formatMessage(messages.transactions.toolbar.pageTotal)}</Text>
                    <HStack gap="1.5">
                        <Text color="fg.muted">{intl.formatMessage(messages.transactions.income)}</Text>
                        <Text color="income" fontWeight="medium">
                            {`+${centsToDollars(totals.incomeCents)}`}
                        </Text>
                    </HStack>
                    <HStack gap="1.5">
                        <Text color="fg.muted">{intl.formatMessage(messages.transactions.expense)}</Text>
                        <Text color="expense" fontWeight="medium">
                            {`-${centsToDollars(totals.expenseCents)}`}
                        </Text>
                    </HStack>
                </HStack>
                <Text fontWeight="semibold" color={signedAmountTone(totals.netCents)}>
                    {`${totals.netCents < 0 ? "" : "+"}${centsToDollars(totals.netCents)}`}
                </Text>
            </HStack>
        </Flex>
    );
};
