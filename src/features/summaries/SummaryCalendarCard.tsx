import {Box, SimpleGrid, Stack, Text} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {SectionCard} from "@/components/layout/SectionCard";
import type {DailyBreakdown} from "@/data/types";
import {daysInMonth, parseCalendarDate} from "@/lib/calendar";
import {todayDate, toDisplayDate} from "@/lib/date";
import {messages} from "@/lib/i18n";
import {formatCompactSignedCents, formatSignedAmount, signedAmountColor, signedAmountTone} from "@/lib/money";

type SummaryCalendarCardProps = {
    daily: DailyBreakdown[];
    date: string;
    netCents: number;
};

const WEEKDAY_MESSAGES = [
    messages.summaries.calendarWeekdaySun,
    messages.summaries.calendarWeekdayMon,
    messages.summaries.calendarWeekdayTue,
    messages.summaries.calendarWeekdayWed,
    messages.summaries.calendarWeekdayThu,
    messages.summaries.calendarWeekdayFri,
    messages.summaries.calendarWeekdaySat,
] as const;

function pad2(value: number): string {
    return String(value).padStart(2, "0");
}

function dayKey(year: number, month: number, day: number): string {
    return `${String(year).padStart(4, "0")}-${pad2(month)}-${pad2(day)}`;
}

/** 月報專用：逐日淨收支日曆。 */
export const SummaryCalendarCard = ({daily, date, netCents}: SummaryCalendarCardProps) => {
    const intl = useIntl();
    const {year, month} = parseCalendarDate(date);
    const totalDays = daysInMonth(year, month);
    const leadingBlanks = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    const today = todayDate();
    const byDate = new Map(daily.map(entry => [entry.date, entry]));

    const cells: (number | null)[] = [];
    for (let blank = 0; blank < leadingBlanks; blank += 1) cells.push(null);
    for (let day = 1; day <= totalDays; day += 1) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);

    const netTone = signedAmountTone(netCents);
    const netColor = signedAmountColor(netCents);

    return (
        <SectionCard
            title={intl.formatMessage(messages.summaries.calendarTitle)}
            action={
                <Stack gap="0" align="flex-end">
                    <Text fontSize="2xs" color="fg.muted">
                        {intl.formatMessage(messages.summaries.calendarNetLabel)}
                    </Text>
                    <Text fontSize={{base: "md", md: "lg"}} fontWeight="bold" color={netColor} fontVariantNumeric="tabular-nums" whiteSpace="nowrap">
                        {formatSignedAmount({cents: netCents, kind: netTone})}
                    </Text>
                </Stack>
            }
        >
            <Box overflowX="auto">
                <SimpleGrid columns={7} gap={{base: "0.5", md: "1"}} minW={{base: "19rem", md: "100%"}}>
                    {WEEKDAY_MESSAGES.map((message, index) => (
                        <Text key={index} textAlign="center" fontSize={{base: "xs", md: "sm"}} color="fg.muted" pb="1.5">
                            {intl.formatMessage(message)}
                        </Text>
                    ))}

                    {cells.map((day, index) => {
                        if (day === null) return <Box key={`blank-${index}`} />;

                        const iso = dayKey(year, month, day);
                        const net = byDate.get(iso)?.net_cents ?? 0;
                        const amountTone = signedAmountTone(net);
                        const textColor = signedAmountColor(net);
                        const isFuture = iso > today;
                        const background = iso === today ? "gray.100" : undefined;

                        return (
                            <Stack
                                key={iso}
                                role="group"
                                gap={{base: "0.5", md: "1"}}
                                align="center"
                                justify="center"
                                minH={{base: "3rem", md: "3.75rem"}}
                                rounded="md"
                                bg={background}
                                aria-label={intl.formatMessage(messages.summaries.calendarDayLabel, {
                                    date: toDisplayDate(iso),
                                    amount: formatSignedAmount({cents: net, kind: amountTone}),
                                })}
                            >
                                <Text fontSize={{base: "sm", md: "md"}} fontWeight="medium" fontVariantNumeric="tabular-nums" lineHeight="1.1">
                                    {day}
                                </Text>
                                <Text fontSize={{base: "2xs", md: "xs"}} color={textColor} fontVariantNumeric="tabular-nums" whiteSpace="nowrap" lineHeight="1.1">
                                    {isFuture ? "\u00A0" : formatCompactSignedCents(net)}
                                </Text>
                            </Stack>
                        );
                    })}
                </SimpleGrid>
            </Box>
        </SectionCard>
    );
};
