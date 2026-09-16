import React from "react";
import {Box, Flex, HStack, Stack, Text} from "@chakra-ui/react";
import {ArrowLeftRightIcon, TagIcon, WalletIcon} from "lucide-react";
import type {LucideIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {EntityAvatar} from "@/components/EntityAvatar";
import type {Transaction} from "@/data/types";
import {TransactionReceiptImages} from "@/features/transactions/TransactionReceiptImages";
import {sourceLabel} from "@/features/transactions/transactionsFormat";
import type {TransactionAvatarMaps, TransactionNameMaps} from "@/features/transactions/transactionsFormat";
import {toDisplayDateTime} from "@/lib/date";
import {messages} from "@/lib/i18n";
import {kindLabel, transactionAmountLabel, transactionTone} from "@/lib/transactionDisplay";

type TransactionDetailContentProps = {
    transaction: Transaction;
    names: TransactionNameMaps;
    avatars: TransactionAvatarMaps;
};

type TransactionDetailRowProps = {
    label: string;
    children?: React.ReactNode;
    /** 需要頭像等自訂內容時用；提供後會取代預設的文字包裝。 */
    value?: React.ReactNode;
    preserveLineBreaks?: boolean;
};

export const TransactionDetailRow = ({label, children, value, preserveLineBreaks = false}: TransactionDetailRowProps) => {
    return (
        <Flex
            direction={preserveLineBreaks ? "column" : "row"}
            justify={preserveLineBreaks ? undefined : "space-between"}
            align={preserveLineBreaks ? "stretch" : "flex-start"}
            gap={preserveLineBreaks ? "1" : "4"}
            px="4"
            py="2.5"
            borderBottomWidth="1px"
            borderColor="border"
            _last={{borderBottomWidth: "0"}}
        >
            <Text fontSize="sm" color="fg.muted" flexShrink="0">
                {label}
            </Text>
            {value !== undefined ? (
                value
            ) : (
                <Text
                    fontSize="sm"
                    textAlign={preserveLineBreaks ? "start" : "end"}
                    whiteSpace={preserveLineBreaks ? "pre-wrap" : undefined}
                    wordBreak={preserveLineBreaks ? "keep-all" : undefined}
                    overflowWrap={preserveLineBreaks ? "break-word" : undefined}
                    lineHeight={preserveLineBreaks ? "1.6" : undefined}
                >
                    {children}
                </Text>
            )}
        </Flex>
    );
};

/** 帳戶／分類值：右對齊的頭像加名稱。 */
const EntityValue = ({icon, color, fallbackIcon, name}: {icon: string | null; color: string | null; fallbackIcon: LucideIcon; name: string}) => (
    <HStack flex="1" minW="0" gap="2" justify="flex-end">
        <EntityAvatar size="sm" icon={icon} color={color} fallbackIcon={fallbackIcon} />
        <Text fontSize="sm" textAlign="end" truncate>
            {name}
        </Text>
    </HStack>
);

/** 交易詳情內容；desktop panel 同 mobile 詳情頁共用。 */
export const TransactionDetailContent = ({transaction, names, avatars}: TransactionDetailContentProps) => {
    const intl = useIntl();
    const accountName = names.accounts.get(transaction.account_id) ?? intl.formatMessage(messages.transactions.list.unknownAccount);
    const transferName = transaction.transfer_account_id != null ? names.accounts.get(transaction.transfer_account_id) : undefined;
    const categoryName = transaction.category_id != null ? names.categories.get(transaction.category_id) : undefined;
    const merchantName = transaction.merchant_id != null ? names.merchants.get(transaction.merchant_id) : undefined;
    const accountMeta = avatars.accounts.get(transaction.account_id);
    const transferMeta = transaction.transfer_account_id != null ? avatars.accounts.get(transaction.transfer_account_id) : undefined;
    const categoryMeta = transaction.category_id != null ? avatars.categories.get(transaction.category_id) : undefined;

    return (
        <Stack gap="4">
            <Box>
                <Text fontSize="sm" color="fg.muted">
                    {intl.formatMessage(messages.transactions.detail.amount)}
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color={transactionTone(transaction)} fontVariantNumeric="tabular-nums">
                    {transactionAmountLabel(transaction)}
                </Text>
            </Box>

            <Stack gap="0" borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
                <TransactionDetailRow label={intl.formatMessage(messages.transactions.list.kind)}>{kindLabel(transaction.kind)}</TransactionDetailRow>
                <TransactionDetailRow label={intl.formatMessage(messages.transactions.detail.occurredAt)}>{toDisplayDateTime(transaction.occurred_at)}</TransactionDetailRow>
                <TransactionDetailRow
                    label={intl.formatMessage(messages.transactions.detail.account)}
                    value={<EntityValue icon={accountMeta?.icon ?? null} color={accountMeta?.color ?? null} fallbackIcon={WalletIcon} name={accountName} />}
                />
                {transaction.kind === "transfer" ? (
                    <TransactionDetailRow
                        label={intl.formatMessage(messages.transactions.detail.transferAccount)}
                        value={
                            <EntityValue
                                icon={transferMeta?.icon ?? null}
                                color={transferMeta?.color ?? null}
                                fallbackIcon={ArrowLeftRightIcon}
                                name={transferName ?? intl.formatMessage(messages.transactions.list.unknownAccount)}
                            />
                        }
                    />
                ) : (
                    <TransactionDetailRow
                        label={intl.formatMessage(messages.transactions.detail.category)}
                        value={
                            <EntityValue
                                icon={categoryMeta?.icon ?? null}
                                color={categoryMeta?.color ?? null}
                                fallbackIcon={TagIcon}
                                name={categoryName ?? intl.formatMessage(messages.transactions.list.uncategorized)}
                            />
                        }
                    />
                )}
                {merchantName === undefined ? null : <TransactionDetailRow label={intl.formatMessage(messages.transactions.detail.merchant)}>{merchantName}</TransactionDetailRow>}
                {transaction.payment_method === null || transaction.payment_method === undefined || transaction.payment_method === "" ? null : (
                    <TransactionDetailRow label={intl.formatMessage(messages.transactions.detail.paymentMethod)}>{transaction.payment_method}</TransactionDetailRow>
                )}
                {transaction.note === null || transaction.note === undefined || transaction.note === "" ? null : (
                    <TransactionDetailRow label={intl.formatMessage(messages.transactions.detail.note)} preserveLineBreaks>
                        {transaction.note}
                    </TransactionDetailRow>
                )}
                <TransactionDetailRow label={intl.formatMessage(messages.transactions.detail.source)}>{sourceLabel(transaction.source)}</TransactionDetailRow>
                <TransactionDetailRow label={intl.formatMessage(messages.transactions.detail.createdAt)}>{toDisplayDateTime(transaction.created_at)}</TransactionDetailRow>
                <TransactionDetailRow label={intl.formatMessage(messages.transactions.detail.updatedAt)}>{toDisplayDateTime(transaction.updated_at)}</TransactionDetailRow>
            </Stack>

            <TransactionReceiptImages urls={transaction.image_urls} />
        </Stack>
    );
};
