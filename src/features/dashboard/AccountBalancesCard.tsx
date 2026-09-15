import {Box, Flex, SimpleGrid, Text} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import type {AccountBalance} from "@/data/types";
import {SectionCard} from "@/components/layout/SectionCard";
import {messages} from "@/lib/i18n";
import {centsToDollars} from "@/lib/money";
import {serializeTransactionFilters} from "@/lib/searchParams";
import {ROUTES} from "@/routes/paths";

type AccountBalancesCardProps = {
    balances: AccountBalance[];
    from: string;
    to: string;
};

/** 帳戶餘額列表；每行連去已按帳戶 + 當月範圍 filter 的交易頁。 */
export const AccountBalancesCard = ({balances, from, to}: AccountBalancesCardProps) => {
    const intl = useIntl();

    return (
        <SectionCard title={intl.formatMessage(messages.dashboard.accountBalancesTitle)}>
            <SimpleGrid columns={{base: 1, sm: 2}} gap="2">
                {balances.map(balance => {
                    const search = serializeTransactionFilters({account_id: balance.id, from, to}).toString();
                    return (
                        <Box key={balance.id} asChild rounded="lg" borderWidth="1px" borderColor="border" px="3" py="2.5" transition="background 150ms ease" _hover={{bg: "bg.subtle"}}>
                            <Link to={`${ROUTES.transactions}?${search}`}>
                                <Flex justify="space-between" align="center" gap="3">
                                    <Text fontSize="sm" truncate>
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
