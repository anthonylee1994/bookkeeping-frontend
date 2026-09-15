import {Box, Flex, Table, Text} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {Cell, Pie, PieChart, ResponsiveContainer, Tooltip} from "recharts";
import {SectionCard} from "@/components/layout/SectionCard";
import type {CategoryBreakdown} from "@/data/types";
import {formatShare, rankCategories} from "@/lib/categoryBreakdown";
import type {CategoryBreakdownKind} from "@/lib/categoryBreakdown";
import {messages} from "@/lib/i18n";
import {centsToDollars} from "@/lib/money";

type CategoryBreakdownChartProps = {
    breakdown: CategoryBreakdown[];
    kind: CategoryBreakdownKind;
    title: string;
    description: string;
    /** 每種分類最多顯示幾個；唔填即 5 個。 */
    limit?: number;
    /** 冇資料時嘅文案。 */
    emptyMessage: string;
};

/**
 * 單一種類（收入或支出）嘅分類 donut chart。Recharts 內建 accessibility layer，
 * 圖表可以用鍵盤 focus 再用方向鍵移動 tooltip；旁邊同時提供完整資料表。
 * 收入同支出各自一張卡，唔用 tab 切換。
 */
export const CategoryBreakdownChart = ({breakdown, kind, title, description, limit, emptyMessage}: CategoryBreakdownChartProps) => {
    const intl = useIntl();
    const slices = rankCategories(breakdown, kind, {limit, uncategorizedLabel: intl.formatMessage(messages.common.uncategorized)});

    return (
        <SectionCard title={title} description={description}>
            {slices.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                    {emptyMessage}
                </Text>
            ) : (
                <Flex direction={{base: "column", md: "row"}} gap="4" align="center">
                    <Box w={{base: "full", md: "12rem"}} h="12rem" flexShrink="0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={slices} dataKey="cents" nameKey="name" innerRadius="58%" outerRadius="92%" paddingAngle={2} stroke="none">
                                    {slices.map(slice => (
                                        <Cell key={slice.id} fill={slice.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={value => centsToDollars(Number(value))} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                    <Table.Root size="sm" w="full">
                        <Table.Caption captionSide="bottom" color="fg.muted" mt={2}>
                            {intl.formatMessage(messages.common.chartCaption)}
                        </Table.Caption>
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeader>{intl.formatMessage(messages.common.columnCategory)}</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="end">{intl.formatMessage(messages.common.columnAmount)}</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="end">{intl.formatMessage(messages.common.columnShare)}</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {slices.map(slice => (
                                <Table.Row key={slice.id}>
                                    <Table.Cell>
                                        <Flex align="center" gap="2">
                                            <Box boxSize="2.5" rounded="full" bg={slice.color} flexShrink="0" />
                                            <Text truncate>{slice.name}</Text>
                                        </Flex>
                                    </Table.Cell>
                                    <Table.Cell textAlign="end" whiteSpace="nowrap" fontVariantNumeric="tabular-nums">
                                        {centsToDollars(slice.cents)}
                                    </Table.Cell>
                                    <Table.Cell textAlign="end" color="fg.muted" whiteSpace="nowrap" fontVariantNumeric="tabular-nums">
                                        {formatShare(slice.share)}
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                </Flex>
            )}
        </SectionCard>
    );
};
