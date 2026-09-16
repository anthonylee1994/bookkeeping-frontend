import React from "react";
import {Box, Flex, Table, Text} from "@chakra-ui/react";
import {TagIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Cell, Pie, PieChart, ResponsiveContainer, Tooltip} from "recharts";
import {EntityAvatar} from "@/components/EntityAvatar";
import {SectionCard} from "@/components/layout/SectionCard";
import type {Category, CategoryBreakdown} from "@/data/types";
import {formatShare, rankCategories} from "@/lib/categoryBreakdown";
import type {CategoryBreakdownKind} from "@/lib/categoryBreakdown";
import {isLightColor} from "@/lib/colors";
import {messages} from "@/lib/i18n";
import {centsToDollars} from "@/lib/money";

type CategoryBreakdownChartProps = {
    breakdown: CategoryBreakdown[];
    kind: CategoryBreakdownKind;
    title: string;
    description: string;
    /** 每種分類最多顯示幾個；不填即 5 個。 */
    limit?: number;
    /** 沒有資料時的文案。 */
    emptyMessage: string;
    /** 分類參考資料（含 color／icon）；有提供即用分類自己的顏色，否則用預設色序。 */
    categories?: Category[];
};

/**
 * 單一種類（收入或支出）的分類 donut chart。Recharts 內建 accessibility layer，
 * 圖表可以用鍵盤 focus 再用方向鍵移動 tooltip；旁邊同時提供完整資料表。
 * 收入與支出各自一張卡，不用 tab 切換。
 */
export const CategoryBreakdownChart = ({breakdown, kind, title, description, limit, emptyMessage, categories}: CategoryBreakdownChartProps) => {
    const intl = useIntl();
    const categoryById = React.useMemo(() => new Map((categories ?? []).map(category => [category.id, category])), [categories]);

    // 太淺的分類色在白色底上做 donut 幾乎睇唔到，所以退回預設色序，並令頭像用同一個色。
    const colorOf = (categoryId: string | null): string | null => {
        if (categoryId === null) return null;
        const color = categoryById.get(categoryId)?.color ?? null;
        return color === null || isLightColor(color) ? null : color;
    };

    const slices = rankCategories(breakdown, kind, {limit, uncategorizedLabel: intl.formatMessage(messages.common.uncategorized), colorOf});

    return (
        <SectionCard title={title} description={description}>
            {slices.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                    {emptyMessage}
                </Text>
            ) : (
                <Flex direction={{base: "column", md: "row"}} gap="4" align="center">
                    <Box w={{base: "full", md: "12rem"}} h={{base: "10rem", md: "12rem"}} flexShrink="0">
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
                        <Table.Caption captionSide="bottom" color="fg.muted" mt={2} fontSize="xs">
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
                                            <EntityAvatar size="xs" icon={categoryById.get(slice.id)?.icon ?? null} color={slice.color} fallbackIcon={TagIcon} />
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
