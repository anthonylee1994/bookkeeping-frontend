import React from "react";
import {Box, Flex, Separator, SimpleGrid, Text} from "@chakra-ui/react";
import {WalletIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {EntityAvatar} from "@/components/EntityAvatar";
import {SectionCard} from "@/components/layout/SectionCard";
import type {Account, AccountBalance} from "@/data/types";
import {messages} from "@/lib/i18n";
import {centsToDollars, signedAmountColor} from "@/lib/money";
import {serializeTransactionFilters} from "@/lib/searchParams";
import {ROUTES} from "@/routes/paths";

type AccountBalancesCardProps = {
    balances: AccountBalance[];
    /** 帳戶參考資料（含 color／icon）；dashboard payload 沒有，由 reference 補上。 */
    accounts: Account[];
    from: string;
    to: string;
};

/** 帳戶餘額列表；每行連去已按帳戶 + 當月範圍 filter 的交易頁。 */
export const AccountBalancesCard = ({balances, accounts, from, to}: AccountBalancesCardProps) => {
    const intl = useIntl();
    const accountById = React.useMemo(() => new Map(accounts.map(account => [account.id, account])), [accounts]);
    const totalCents = balances.reduce((sum, balance) => sum + balance.balance_cents, 0);

    return (
        <SectionCard title={intl.formatMessage(messages.dashboard.accountBalancesTitle)}>
            <Flex justify="space-between" align="baseline" gap="3">
                <Text fontSize="sm" color="fg.muted">
                    {intl.formatMessage(messages.dashboard.totalBalance)}
                </Text>
                <Text fontSize="lg" fontWeight="bold" color={signedAmountColor(totalCents)} fontVariantNumeric="tabular-nums" whiteSpace="nowrap">
                    {centsToDollars(totalCents)}
                </Text>
            </Flex>
            <Separator />
            <SimpleGrid columns={{base: 1, sm: 2}} gap="2">
                {balances.map(balance => {
                    const account = accountById.get(balance.id);
                    const search = serializeTransactionFilters({account_id: balance.id, from, to}).toString();
                    return (
                        <Box key={balance.id} asChild rounded="lg" borderWidth="1px" borderColor="border" px="3" py="2.5" transition="background 150ms ease" _hover={{bg: "bg.subtle"}}>
                            <Link to={`${ROUTES.transactions}?${search}`}>
                                <Flex align="center" gap="3">
                                    <EntityAvatar size="sm" icon={account?.icon ?? null} color={account?.color ?? null} fallbackIcon={WalletIcon} />
                                    <Text fontSize="sm" truncate flex="1" minW="0">
                                        {balance.name}
                                    </Text>
                                    <Text fontSize="sm" fontWeight="semibold" color={balance.balance_cents < 0 ? "expense" : "fg"} flexShrink="0" whiteSpace="nowrap" fontVariantNumeric="tabular-nums">
                                        {centsToDollars(balance.balance_cents)}
                                    </Text>
                                </Flex>
                            </Link>
                        </Box>
                    );
                })}
            </SimpleGrid>
        </SectionCard>
    );
};
