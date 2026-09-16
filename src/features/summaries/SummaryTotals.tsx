import {Flex, HStack, Stack, Text} from "@chakra-ui/react";
import {ArrowLeftRightIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {SummaryTotalsGrid} from "@/components/SummaryTotalsGrid";
import type {Summary} from "@/data/types";
import {messages} from "@/lib/i18n";
import {centsToDollars} from "@/lib/money";

type SummaryTotalsProps = {
    summary: Summary;
};

/** 淨額、收入、支出三個數字，下面併埋轉帳（唔計入淨額）一行。 */
export const SummaryTotals = ({summary}: SummaryTotalsProps) => {
    const intl = useIntl();
    const {transfers} = summary;

    return (
        <Stack gap="3">
            <SummaryTotalsGrid
                netCents={summary.net_cents}
                incomeCents={summary.income_cents}
                expenseCents={summary.expense_cents}
                netLabel={intl.formatMessage(messages.summaries.net)}
                incomeLabel={intl.formatMessage(messages.summaries.income)}
                expenseLabel={intl.formatMessage(messages.summaries.expense)}
            />
            {transfers.count === 0 ? null : (
                <Flex justify="space-between" align="center" gap="3" px="1" color="fg.muted">
                    <HStack gap="2">
                        <ArrowLeftRightIcon size={16} />
                        <Text fontSize="sm">{intl.formatMessage(messages.summaries.transferTitle)}</Text>
                    </HStack>
                    <HStack gap="2" fontVariantNumeric="tabular-nums">
                        <Text fontSize="sm">{intl.formatMessage(messages.summaries.transferCount, {count: transfers.count})}</Text>
                        <Text fontSize="sm" fontWeight="medium" color="transfer">
                            {centsToDollars(transfers.total_cents)}
                        </Text>
                    </HStack>
                </Flex>
            )}
        </Stack>
    );
};
