import React from "react";
import {Badge, Box, Button, Flex, HStack, Stack, Text, Wrap} from "@chakra-ui/react";
import {PauseIcon, PencilIcon, PlayIcon, SkipForwardIcon, Trash2Icon, ZapIcon} from "lucide-react";
import {useIntl} from "react-intl";
import type {RecurringRule} from "@/data/types";
import {describeRecurringSchedule, recurringStatusLabel} from "@/features/recurringRules/recurringRuleModel";
import {messages} from "@/lib/i18n";
import {toDisplayDate} from "@/lib/date";
import {formatSignedAmount} from "@/lib/money";

export type RecurringRuleNameMaps = {
    accounts: Map<string, string>;
    categories: Map<string, string>;
    merchants: Map<string, string>;
};

type RecurringRuleListProps = {
    rules: RecurringRule[];
    names: RecurringRuleNameMaps;
    onEdit: (rule: RecurringRule) => void;
    onPause: (rule: RecurringRule) => void;
    onResume: (rule: RecurringRule) => void;
    onRunNow: (rule: RecurringRule) => void;
    onSkipNext: (rule: RecurringRule) => void;
    onDelete: (rule: RecurringRule) => void;
};

const STATUS_PALETTE: Record<RecurringRule["status"], string> = {active: "green", paused: "orange", ended: "gray"};

/** 定期交易清單；每張卡顯示排程、下次執行、帳戶／分類／商戶同可用動作。 */
export const RecurringRuleList = ({rules, names, onEdit, onPause, onResume, onRunNow, onSkipNext, onDelete}: RecurringRuleListProps) => {
    const intl = useIntl();

    return (
        <Stack gap="3">
            {rules.map(rule => {
                const accountName = names.accounts.get(rule.account_id);
                const categoryName = rule.category_id == null ? null : names.categories.get(rule.category_id);
                const merchantName = rule.merchant_id == null ? null : names.merchants.get(rule.merchant_id);

                return (
                    <Box key={rule.id} borderWidth="1px" borderColor="border" bg="bg.panel" rounded="xl" shadow="xs" p="4">
                        <Flex justify="space-between" align="flex-start" gap="3">
                            <Box minW="0">
                                <HStack gap="2" mb="1" wrap="wrap">
                                    <Badge colorPalette={STATUS_PALETTE[rule.status]} size="sm">
                                        {recurringStatusLabel(rule.status)}
                                    </Badge>
                                    <Text fontSize="sm" fontWeight="medium" truncate>
                                        {rule.note ?? intl.formatMessage(rule.kind === "income" ? messages.transactions.income : messages.transactions.expense)}
                                    </Text>
                                </HStack>
                                <Text fontSize="sm" color="fg.muted">
                                    {describeRecurringSchedule(rule)}
                                </Text>
                                <Text fontSize="xs" color="fg.muted" mt="0.5">
                                    {intl.formatMessage(messages.recurring.nextRun)}：{toDisplayDate(rule.next_run_at)}
                                </Text>
                                <Wrap gap="3" mt="2" fontSize="xs" color="fg.muted">
                                    {accountName === undefined ? null : <Text>{accountName}</Text>}
                                    {categoryName === undefined ? null : <Text>{categoryName}</Text>}
                                    {merchantName === undefined ? null : <Text>{merchantName}</Text>}
                                </Wrap>
                            </Box>
                            <Text fontSize="sm" fontWeight="semibold" color={rule.kind} flexShrink="0" whiteSpace="nowrap" fontVariantNumeric="tabular-nums">
                                {formatSignedAmount({cents: rule.amount_cents, kind: rule.kind})}
                            </Text>
                        </Flex>

                        <HStack gap="2" mt="3" wrap="wrap">
                            {rule.status === "active" ? (
                                <React.Fragment>
                                    <Button type="button" size="sm" variant="outline" onClick={() => onPause(rule)}>
                                        <PauseIcon />
                                        {intl.formatMessage(messages.recurring.pause)}
                                    </Button>
                                    <Button type="button" size="sm" variant="outline" onClick={() => onRunNow(rule)}>
                                        <ZapIcon />
                                        {intl.formatMessage(messages.recurring.runNow)}
                                    </Button>
                                    <Button type="button" size="sm" variant="outline" onClick={() => onSkipNext(rule)}>
                                        <SkipForwardIcon />
                                        {intl.formatMessage(messages.recurring.skipNext)}
                                    </Button>
                                </React.Fragment>
                            ) : null}
                            {rule.status === "paused" ? (
                                <Button type="button" size="sm" variant="outline" onClick={() => onResume(rule)}>
                                    <PlayIcon />
                                    {intl.formatMessage(messages.recurring.resume)}
                                </Button>
                            ) : null}
                            <Button type="button" size="sm" variant="outline" onClick={() => onEdit(rule)}>
                                <PencilIcon />
                                {intl.formatMessage(messages.common.edit)}
                            </Button>
                            <Button type="button" size="sm" variant="outline" colorPalette="red" onClick={() => onDelete(rule)}>
                                <Trash2Icon />
                                {intl.formatMessage(messages.common.delete)}
                            </Button>
                        </HStack>
                    </Box>
                );
            })}
        </Stack>
    );
};
