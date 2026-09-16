import {Box, Button, Center, Flex, Stack, Text} from "@chakra-ui/react";
import {ArrowDownLeftIcon, ArrowLeftRightIcon, ArrowUpRightIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import type {TransactionRow} from "@/data/types";
import {SectionCard} from "@/components/layout/SectionCard";
import {toDisplayDate} from "@/lib/date";
import {messages} from "@/lib/i18n";
import {transactionDisplayAmount, transactionTitle, transactionTone} from "@/lib/transactionDisplay";
import {ROUTES, transactionDetailPath} from "@/routes/paths";

type RecentTransactionsCardProps = {
    transactions: TransactionRow[];
};

/** 交易種類對應的箭頭圖示：收入入帳、支出出帳、轉帳搬錢。 */
function kindIcon(kind: TransactionRow["kind"]) {
    if (kind === "income") return ArrowDownLeftIcon;
    if (kind === "expense") return ArrowUpRightIcon;
    return ArrowLeftRightIcon;
}

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
                    {transactions.map(transaction => {
                        const tone = transactionTone(transaction);
                        const KindIcon = kindIcon(transaction.kind);
                        return (
                            <Box key={transaction.id} asChild rounded="lg" px="3" py="2.5" transition="background 150ms ease" _hover={{bg: "bg.subtle"}}>
                                <Link to={transactionDetailPath(transaction.id)}>
                                    <Flex justify="space-between" align="center" gap="3">
                                        <Center boxSize="8" rounded="lg" bg="bg.subtle" color={tone} flexShrink="0" aria-hidden="true">
                                            <KindIcon size={16} />
                                        </Center>
                                        <Box minW="0" flex="1">
                                            <Text fontSize="sm" fontWeight="medium" truncate>
                                                {transactionTitle(transaction)}
                                            </Text>
                                            <Text fontSize="xs" color="fg.muted">
                                                {toDisplayDate(transaction.occurred_at)}
                                            </Text>
                                        </Box>
                                        <Text fontSize="sm" fontWeight="semibold" color={tone} flexShrink="0" whiteSpace="nowrap" fontVariantNumeric="tabular-nums">
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
