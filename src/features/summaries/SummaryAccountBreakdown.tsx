import {Table, Text} from "@chakra-ui/react";
import {LandmarkIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {CardEmptyState} from "@/components/CardEmptyState";
import {SectionCard} from "@/components/layout/SectionCard";
import type {AccountBreakdown} from "@/data/types";
import {messages} from "@/lib/i18n";
import {centsToDollars} from "@/lib/money";

type SummaryAccountBreakdownProps = {
    accounts: AccountBreakdown[];
};

/** 帳戶分佈表：期間內每個帳戶的收入同支出。 */
export const SummaryAccountBreakdown = ({accounts}: SummaryAccountBreakdownProps) => {
    const intl = useIntl();
    const rows = [...accounts].sort((left, right) => right.income_cents + right.expense_cents - (left.income_cents + left.expense_cents));

    return (
        <SectionCard title={intl.formatMessage(messages.summaries.accountTitle)} description={intl.formatMessage(messages.summaries.accountDescription)}>
            {rows.length === 0 ? (
                <CardEmptyState icon={<LandmarkIcon />} message={intl.formatMessage(messages.summaries.noAccountData)} />
            ) : (
                <Table.Root size="sm">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader>{intl.formatMessage(messages.summaries.columnAccount)}</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="end">{intl.formatMessage(messages.summaries.columnIncome)}</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="end">{intl.formatMessage(messages.summaries.columnExpense)}</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {rows.map(account => (
                            <Table.Row key={account.account_id ?? "unknown"}>
                                <Table.Cell>
                                    <Text truncate>{account.name ?? intl.formatMessage(messages.transactions.list.unknownAccount)}</Text>
                                </Table.Cell>
                                <Table.Cell textAlign="end" color="income" whiteSpace="nowrap" fontVariantNumeric="tabular-nums">
                                    {centsToDollars(account.income_cents)}
                                </Table.Cell>
                                <Table.Cell textAlign="end" color="expense" whiteSpace="nowrap" fontVariantNumeric="tabular-nums">
                                    {centsToDollars(account.expense_cents)}
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            )}
        </SectionCard>
    );
};
