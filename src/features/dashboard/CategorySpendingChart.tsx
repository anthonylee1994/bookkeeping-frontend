import {Box, Flex, Table, Text} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {Cell, Pie, PieChart, ResponsiveContainer, Tooltip} from "recharts";
import type {CategoryBreakdown} from "@/data/types";
import {DashboardSection} from "@/features/dashboard/DashboardSection";
import {formatShare, rankExpenseCategories} from "@/features/dashboard/dashboardFormat";
import {messages} from "@/lib/i18n";
import {centsToDollars} from "@/lib/money";

type CategorySpendingChartProps = {
    breakdown: CategoryBreakdown[];
};

/**
 * 支出分類 donut chart。圖表本身對 screen reader 隱藏，數據由旁邊的
 * table 提供（同時作為 legend）：色點、分類、實際金額、佔比。
 */
export const CategorySpendingChart = ({breakdown}: CategorySpendingChartProps) => {
    const intl = useIntl();
    const slices = rankExpenseCategories(breakdown);

    return (
        <DashboardSection title={intl.formatMessage(messages.dashboard.categoryTitle)} description={intl.formatMessage(messages.dashboard.categoryDescription)}>
            {slices.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                    {intl.formatMessage(messages.dashboard.noCategoryData)}
                </Text>
            ) : (
                <Flex direction={{base: "column", md: "row"}} gap="5" align="center">
                    <Box w={{base: "full", md: "13rem"}} h="13rem" flexShrink="0" aria-hidden="true">
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
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeader>{intl.formatMessage(messages.dashboard.columnCategory)}</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="end">{intl.formatMessage(messages.dashboard.columnAmount)}</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="end">{intl.formatMessage(messages.dashboard.columnShare)}</Table.ColumnHeader>
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
                                    <Table.Cell textAlign="end" fontVariantNumeric="tabular-nums">
                                        {centsToDollars(slice.cents)}
                                    </Table.Cell>
                                    <Table.Cell textAlign="end" color="fg.muted" fontVariantNumeric="tabular-nums">
                                        {formatShare(slice.share)}
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                </Flex>
            )}
        </DashboardSection>
    );
};
