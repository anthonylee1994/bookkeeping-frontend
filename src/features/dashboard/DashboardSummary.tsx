import {Box, SimpleGrid, Text} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import type {Dashboard} from "@/data/types";
import {messages} from "@/lib/i18n";
import {centsToDollars, formatSignedAmount} from "@/lib/money";

type DashboardSummaryProps = {
    dashboard: Dashboard;
};

type SummaryTile = {
    label: string;
    value: string;
    tone: "income" | "expense";
};

/** 本月淨額、收入、支出、退款四個數字。淨額用正負號同顏色同時表達。 */
export const DashboardSummary = ({dashboard}: DashboardSummaryProps) => {
    const intl = useIntl();

    const tiles: SummaryTile[] = [
        {
            label: intl.formatMessage(messages.dashboard.net),
            value: formatSignedAmount({cents: Math.abs(dashboard.net_cents), kind: dashboard.net_cents >= 0 ? "income" : "expense"}),
            tone: dashboard.net_cents >= 0 ? "income" : "expense",
        },
        {label: intl.formatMessage(messages.dashboard.income), value: `+${centsToDollars(dashboard.income_cents)}`, tone: "income"},
        {label: intl.formatMessage(messages.dashboard.expense), value: `-${centsToDollars(dashboard.expense_cents)}`, tone: "expense"},
        {label: intl.formatMessage(messages.dashboard.refund), value: `+${centsToDollars(dashboard.refund_cents)}`, tone: "income"},
    ];

    return (
        <SimpleGrid columns={{base: 2, md: 4}} gap="3">
            {tiles.map(tile => (
                <Box key={tile.label} bg="bg.panel" borderWidth="1px" borderColor="border" rounded="xl" p="4" shadow="xs">
                    <Text fontSize="sm" color="fg.muted">
                        {tile.label}
                    </Text>
                    <Text mt="1" fontSize={{base: "lg", md: "xl"}} fontWeight="bold" color={tile.tone} fontVariantNumeric="tabular-nums">
                        {tile.value}
                    </Text>
                </Box>
            ))}
        </SimpleGrid>
    );
};
