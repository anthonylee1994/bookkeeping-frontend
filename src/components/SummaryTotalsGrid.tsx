import {Box, SimpleGrid, Text} from "@chakra-ui/react";
import {centsToDollars, formatSignedAmount, signedAmountColor} from "@/lib/money";

type SummaryTotalsGridProps = {
    netCents: number;
    incomeCents: number;
    expenseCents: number;
    netLabel: string;
    incomeLabel: string;
    expenseLabel: string;
};

type SummaryTile = {
    key: string;
    label: string;
    value: string;
    color: string;
    wide?: boolean;
};

/**
 * 淨額／收入／支出三個數字卡。Mobile 用緊湊 2-column：淨額橫跨兩格，收入與支出各佔一格；
 * 三個數字使用同一字級，令三格外觀一致。
 */
export const SummaryTotalsGrid = ({netCents, incomeCents, expenseCents, netLabel, incomeLabel, expenseLabel}: SummaryTotalsGridProps) => {
    const tiles: SummaryTile[] = [
        {
            key: "net",
            label: netLabel,
            value: formatSignedAmount({cents: Math.abs(netCents), kind: netCents >= 0 ? "income" : "expense"}),
            color: signedAmountColor(netCents),
            wide: true,
        },
        {key: "income", label: incomeLabel, value: `+${centsToDollars(incomeCents)}`, color: signedAmountColor(incomeCents)},
        {key: "expense", label: expenseLabel, value: `-${centsToDollars(expenseCents)}`, color: signedAmountColor(-expenseCents)},
    ];

    return (
        <SimpleGrid columns={{base: 2, md: 3}} gap="3">
            {tiles.map(tile => (
                <Box
                    key={tile.key}
                    minW="0"
                    gridColumn={tile.wide === true ? {base: "span 2", md: "auto"} : undefined}
                    bg="bg.panel"
                    borderWidth="1px"
                    borderColor="border"
                    rounded="xl"
                    p={{base: "3", sm: "4"}}
                    shadow="xs"
                >
                    <Text fontSize="sm" color="fg.muted">
                        {tile.label}
                    </Text>
                    <Text mt="1" fontSize={{base: "xl", md: "2xl"}} lineHeight="1.2" fontWeight="bold" color={tile.color} fontVariantNumeric="tabular-nums" whiteSpace="nowrap">
                        {tile.value}
                    </Text>
                </Box>
            ))}
        </SimpleGrid>
    );
};
