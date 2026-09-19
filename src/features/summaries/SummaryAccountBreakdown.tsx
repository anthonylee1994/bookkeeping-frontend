import React from "react";
import {HStack, Table, Text} from "@chakra-ui/react";
import {LandmarkIcon, WalletIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {useNavigate} from "react-router";
import {CardEmptyState} from "@/components/CardEmptyState";
import {EntityAvatar} from "@/components/EntityAvatar";
import {SectionCard} from "@/components/layout/SectionCard";
import type {Account, AccountBreakdown} from "@/data/types";
import {messages} from "@/lib/i18n";
import {centsToDollars} from "@/lib/money";
import {serializeTransactionFilters} from "@/lib/searchParams";
import {ROUTES} from "@/routes/paths";

type SummaryAccountBreakdownProps = {
    breakdown: AccountBreakdown[];
    /** 帳戶參考資料（含 color／icon）；breakdown payload 沒有。 */
    accounts: Account[];
};

/** 帳戶分佈表：期間內每個帳戶的收入同支出。 */
export const SummaryAccountBreakdown = ({breakdown, accounts}: SummaryAccountBreakdownProps) => {
    const intl = useIntl();
    const navigate = useNavigate();
    const accountById = React.useMemo(() => new Map(accounts.map(account => [account.id, account])), [accounts]);
    const rows = [...breakdown].sort((left, right) => right.income_cents + right.expense_cents - (left.income_cents + left.expense_cents));

    // 未知帳戶冇對應嘅 account_id，無法 filter，所以只有真實帳戶先可以點入交易頁。
    const openAccount = (accountId: string | null) => {
        if (accountId === null) return;
        const search = serializeTransactionFilters({account_id: accountId}).toString();
        navigate(`${ROUTES.transactions}?${search}`);
    };

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
                        {rows.map(row => {
                            const account = row.account_id != null ? accountById.get(row.account_id) : undefined;
                            const isClickable = row.account_id !== null;
                            return (
                                <Table.Row
                                    key={row.account_id ?? "unknown"}
                                    cursor={isClickable ? "pointer" : "default"}
                                    tabIndex={isClickable ? 0 : undefined}
                                    _hover={isClickable ? {bg: "bg.subtle"} : undefined}
                                    _focusVisible={{outlineWidth: "2px", outlineColor: "brand.focusRing", outlineOffset: "-2px"}}
                                    onClick={() => openAccount(row.account_id)}
                                    onKeyDown={event => {
                                        if (!isClickable) return;
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            openAccount(row.account_id);
                                        }
                                    }}
                                >
                                    <Table.Cell>
                                        <HStack gap="2">
                                            <EntityAvatar size="sm" icon={account?.icon ?? null} color={account?.color ?? null} fallbackIcon={WalletIcon} />
                                            <Text truncate>{row.name ?? intl.formatMessage(messages.transactions.list.unknownAccount)}</Text>
                                        </HStack>
                                    </Table.Cell>
                                    <Table.Cell textAlign="end" color="income" whiteSpace="nowrap" fontVariantNumeric="tabular-nums">
                                        {centsToDollars(row.income_cents)}
                                    </Table.Cell>
                                    <Table.Cell textAlign="end" color="expense" whiteSpace="nowrap" fontVariantNumeric="tabular-nums">
                                        {centsToDollars(row.expense_cents)}
                                    </Table.Cell>
                                </Table.Row>
                            );
                        })}
                    </Table.Body>
                </Table.Root>
            )}
        </SectionCard>
    );
};
