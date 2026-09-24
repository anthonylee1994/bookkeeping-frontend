import React from "react";
import {Box, Flex, Text, VisuallyHidden} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {SectionCard} from "@/components/layout/SectionCard";
import type {DailyBreakdown, SummaryPeriod} from "@/data/types";
import {periodRange} from "@/features/summaries/summariesFormat";
import {addCalendarDays, parseCalendarDate} from "@/lib/calendar";
import {todayDate} from "@/lib/date";
import {messages} from "@/lib/i18n";
import {centsToDollars, formatSignedAmount, signedAmountColor, signedAmountTone} from "@/lib/money";

type SummaryDailyChartProps = {
    daily: DailyBreakdown[];
    date: string;
    period: Exclude<SummaryPeriod, "daily">;
    netCents: number;
};

type ChartDay = {date: string; amount: number | null};

function isoDay(year: number, month: number, day: number): string {
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function dailyChartData(daily: DailyBreakdown[], date: string, period: Exclude<SummaryPeriod, "daily">, today = todayDate()): ChartDay[] {
    const {from, to} = periodRange(date, period);
    const amounts = new Map(daily.map(entry => [entry.date, entry.net_cents]));
    const days: ChartDay[] = [];
    let current = parseCalendarDate(from);

    while (true) {
        const key = isoDay(current.year, current.month, current.day);
        days.push({date: key, amount: key > today ? null : (amounts.get(key) ?? 0)});
        if (key === to) break;
        current = addCalendarDays(current, 1);
    }

    return days;
}

export const SummaryDailyChart = ({daily, date, period, netCents}: SummaryDailyChartProps) => {
    const chartId = React.useId();
    const intl = useIntl();
    const data = dailyChartData(daily, date, period);
    const ticks = data.filter((_, index) => index === 0 || index === data.length - 1 || (period === "monthly" && index % 7 === 0)).map(day => day.date);
    const formatDay = (value: string) => `${Number(value.slice(5, 7))}/${Number(value.slice(8, 10))}`;
    const formatAmount = (value: number) => intl.formatNumber(value / 100, {notation: "compact", maximumFractionDigits: 1});

    return (
        <SectionCard title={intl.formatMessage(messages.summaries.dailyChartTitle)}>
            <Flex align="baseline" gap="2" mb="3">
                <Text fontSize="sm" color="fg.muted">
                    {intl.formatMessage(messages.summaries.dailyChartTotal)}
                </Text>
                <Text fontSize="lg" fontWeight="semibold" color={signedAmountColor(netCents)} fontVariantNumeric="tabular-nums">
                    {formatSignedAmount({cents: netCents, kind: signedAmountTone(netCents)})}
                </Text>
            </Flex>
            <Box h={{base: "13rem", md: "17rem"}} role="img" aria-labelledby={chartId}>
                <VisuallyHidden id={chartId}>{intl.formatMessage(messages.summaries.dailyChartTitle)}</VisuallyHidden>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{top: 8, right: 8, bottom: 0, left: 0}} accessibilityLayer>
                        <CartesianGrid vertical={false} stroke="var(--chakra-colors-border)" />
                        <XAxis dataKey="date" ticks={ticks} tickFormatter={formatDay} tickLine={false} axisLine={false} tick={{fill: "var(--chakra-colors-fg-muted)", fontSize: 12}} />
                        <YAxis tickFormatter={formatAmount} tickLine={false} axisLine={false} width={48} tick={{fill: "var(--chakra-colors-fg-muted)", fontSize: 12}} />
                        <Tooltip labelFormatter={label => String(label)} formatter={value => centsToDollars(Number(value))} />
                        <Bar dataKey="amount" name={intl.formatMessage(messages.summaries.dailyChartTotal)} maxBarSize={32} radius={[3, 3, 0, 0]}>
                            {data.map(day => (
                                <Cell key={day.date} fill={day.amount !== null && day.amount < 0 ? "var(--chakra-colors-expense)" : "var(--chakra-colors-income)"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>
            <VisuallyHidden as="table">
                <caption>{intl.formatMessage(messages.summaries.dailyChartTitle)}</caption>
                <thead>
                    <tr>
                        <th>{intl.formatMessage(messages.summaries.dateLabel)}</th>
                        <th>{intl.formatMessage(messages.summaries.dailyChartTotal)}</th>
                    </tr>
                </thead>
                <tbody>
                    {data
                        .filter(day => day.amount !== null)
                        .map(day => (
                            <tr key={day.date}>
                                <td>{day.date}</td>
                                <td>{centsToDollars(day.amount!)}</td>
                            </tr>
                        ))}
                </tbody>
            </VisuallyHidden>
        </SectionCard>
    );
};
