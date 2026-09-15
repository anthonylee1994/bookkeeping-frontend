import {Flex, Text} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import type {TransferSummary} from "@/data/types";
import {SectionCard} from "@/components/layout/SectionCard";
import {messages} from "@/lib/i18n";
import {centsToDollars} from "@/lib/money";

type TransferSummaryCardProps = {
    transfers: TransferSummary;
};

/** 轉帳獨立一卡，明文講清楚唔計入收入／支出／淨額。 */
export const TransferSummaryCard = ({transfers}: TransferSummaryCardProps) => {
    const intl = useIntl();

    return (
        <SectionCard title={intl.formatMessage(messages.summaries.transferTitle)} description={intl.formatMessage(messages.summaries.transferHint)}>
            {transfers.count === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                    {intl.formatMessage(messages.summaries.noTransfers)}
                </Text>
            ) : (
                <Flex justify="space-between" align="center" gap="3">
                    <Text fontSize="sm" color="fg.muted">
                        {intl.formatMessage(messages.summaries.transferCount, {count: transfers.count})}
                    </Text>
                    <Text fontSize={{base: "lg", md: "xl"}} fontWeight="bold" color="transfer" flexShrink="0" whiteSpace="nowrap" fontVariantNumeric="tabular-nums">
                        {centsToDollars(transfers.total_cents)}
                    </Text>
                </Flex>
            )}
        </SectionCard>
    );
};
