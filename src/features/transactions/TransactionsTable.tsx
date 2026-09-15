import {Badge, Box, HStack, Icon, Table, Text} from "@chakra-ui/react";
import {ArrowDownIcon, ArrowUpIcon, ArrowLeftRightIcon} from "lucide-react";
import {useIntl} from "react-intl";
import type {SortOrder, Transaction, TransactionSortField} from "@/data/types";
import {describeTransaction} from "@/features/transactions/transactionsFormat";
import type {TransactionNameMaps} from "@/features/transactions/transactionsFormat";
import {toDisplayDate} from "@/lib/date";
import {messages} from "@/lib/i18n";

type TransactionsTableProps = {
    transactions: Transaction[];
    names: TransactionNameMaps;
    sort: TransactionSortField;
    order: SortOrder;
    onSelect: (transaction: Transaction) => void;
    onSortChange: (sort: TransactionSortField, order: SortOrder) => void;
};

type SortableColumn = {
    field: TransactionSortField;
    label: string;
    align?: "end";
};

/**
 * Desktop 交易表格：表頭可排序，整行可點擊或用鍵盤開啟詳情。
 * 冇做日期分組——表格本身已經有日期欄，再加分組行等於每筆交易佔兩行。
 */
export const TransactionsTable = ({transactions, names, sort, order, onSelect, onSortChange}: TransactionsTableProps) => {
    const intl = useIntl();

    const sortableColumns: SortableColumn[] = [
        {field: "occurred_at", label: intl.formatMessage(messages.transactions.list.date)},
        {field: "amount_cents", label: intl.formatMessage(messages.transactions.list.amount), align: "end"},
    ];

    const renderSortableHeader = (column: SortableColumn) => {
        const isActive = sort === column.field;
        const nextOrder: SortOrder = isActive && order === "desc" ? "asc" : "desc";
        return (
            <Table.ColumnHeader
                key={column.field}
                textAlign={column.align}
                cursor="pointer"
                userSelect="none"
                aria-sort={isActive ? (order === "desc" ? "descending" : "ascending") : "none"}
                _hover={{color: "brand.fg"}}
                onClick={() => onSortChange(column.field, nextOrder)}
            >
                <HStack gap="1" justify={column.align === "end" ? "flex-end" : "flex-start"} as="span">
                    <Text as="span">{column.label}</Text>
                    <Icon size="xs" opacity={isActive ? 1 : 0.25} aria-hidden>
                        {isActive && order === "asc" ? <ArrowUpIcon /> : <ArrowDownIcon />}
                    </Icon>
                </HStack>
            </Table.ColumnHeader>
        );
    };

    const renderRows = (rows: Transaction[]) =>
        rows.map(transaction => {
            const view = describeTransaction(transaction, names);
            const select = () => onSelect(transaction);
            return (
                <Table.Row
                    key={transaction.id}
                    cursor="pointer"
                    tabIndex={0}
                    _hover={{bg: "brand.active/40"}}
                    _focusVisible={{outlineWidth: "2px", outlineColor: "brand.focusRing", outlineOffset: "-2px"}}
                    onClick={select}
                    onKeyDown={event => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            select();
                        }
                    }}
                >
                    <Table.Cell whiteSpace="nowrap" color="fg.muted" fontVariantNumeric="tabular-nums">
                        {toDisplayDate(transaction.occurred_at)}
                    </Table.Cell>
                    <Table.Cell maxW="sm">
                        <HStack gap="2">
                            {transaction.kind === "transfer" ? (
                                <Icon size="sm" color="transfer" aria-label={intl.formatMessage(messages.transactions.transfer)}>
                                    <ArrowLeftRightIcon />
                                </Icon>
                            ) : null}
                            <Text fontWeight="medium" truncate>
                                {view.primary}
                            </Text>
                            {view.refund ? (
                                <Badge colorPalette="amber" variant="subtle" rounded="full">
                                    {intl.formatMessage(messages.transactions.list.refund)}
                                </Badge>
                            ) : null}
                        </HStack>
                        {view.secondary === null ? null : (
                            <Text fontSize="xs" color="fg.muted" truncate>
                                {view.secondary}
                            </Text>
                        )}
                    </Table.Cell>
                    <Table.Cell color="fg.muted">{view.category}</Table.Cell>
                    <Table.Cell color="fg.muted">{view.account}</Table.Cell>
                    <Table.Cell textAlign="end" fontWeight="semibold" color={view.tone} whiteSpace="nowrap" fontVariantNumeric="tabular-nums">
                        {view.amount}
                    </Table.Cell>
                </Table.Row>
            );
        });

    return (
        <Box bg="bg.panel" borderWidth="1px" borderColor="border" rounded="xl" overflow="hidden">
            <Table.Root size="sm" interactive>
                <Table.Header>
                    <Table.Row bg="bg.subtle">
                        {renderSortableHeader(sortableColumns[0])}
                        <Table.ColumnHeader>{intl.formatMessage(messages.transactions.list.merchant)}</Table.ColumnHeader>
                        <Table.ColumnHeader>{intl.formatMessage(messages.transactions.list.category)}</Table.ColumnHeader>
                        <Table.ColumnHeader>{intl.formatMessage(messages.transactions.list.account)}</Table.ColumnHeader>
                        {renderSortableHeader(sortableColumns[1])}
                    </Table.Row>
                </Table.Header>
                <Table.Body>{renderRows(transactions)}</Table.Body>
            </Table.Root>
        </Box>
    );
};
