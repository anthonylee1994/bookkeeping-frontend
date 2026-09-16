import React from "react";
import {Box, Flex, SimpleGrid, Stack, Text} from "@chakra-ui/react";
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
        <SectionCard title={intl.formatMessage(messages.summaries.calendarTitle)}>
            <Stack gap="4">
                <Flex direction="column" gap="1">
                    <Text fontSize="sm" color="fg.muted">
                        {intl.formatMessage(messages.summaries.calendarNetLabel)}
                    </Text>
                    <Text fontSize={{base: "2xl", md: "3xl"}} fontWeight="bold" color={netColor} fontVariantNumeric="tabular-nums">
                        {formatSignedAmount({cents: netCents, kind: netTone})}
                    </Text>
                </Flex>

                <Box overflowX="auto">
                    <SimpleGrid columns={7} gap={{base: "1", md: "2"}} minW={{base: "21rem", md: "100%"}}>
                        {WEEKDAY_MESSAGES.map((message, index) => (
                            <Text key={index} textAlign="center" fontSize="xs" color="fg.muted">
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
                                    gap="0.5"
                                    align="center"
                                    py="1"
                                    rounded="md"
                                    bg={background}
                                    aria-label={intl.formatMessage(messages.summaries.calendarDayLabel, {
                                        date: toDisplayDate(iso),
                                        amount: formatSignedAmount({cents: net, kind: amountTone}),
                                    })}
                                >
                                    <React.Fragment>
                                        <Text fontSize="sm" fontWeight="medium" fontVariantNumeric="tabular-nums">
                                            {day}
                                        </Text>
                                        <Text fontSize={{base: "2xs", md: "xs"}} color={textColor} fontVariantNumeric="tabular-nums" whiteSpace="nowrap">
                                            {isFuture ? "\u00A0" : formatCompactSignedCents(net)}
                                        </Text>
                                    </React.Fragment>
                                </Stack>
                            );
                        })}
                    </SimpleGrid>
                </Box>
            </Stack>
        </SectionCard>
    );
};
