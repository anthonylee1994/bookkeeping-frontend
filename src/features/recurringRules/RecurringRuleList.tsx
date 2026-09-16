import React from "react";
import {Badge, Box, Button, Flex, HStack, Stack, Text, Wrap} from "@chakra-ui/react";
import {ArrowDownLeftIcon, ArrowUpRightIcon, CalendarClockIcon, PauseIcon, PencilIcon, PlayIcon, SkipForwardIcon, StoreIcon, TagIcon, Trash2Icon, WalletIcon, ZapIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {EntityAvatar} from "@/components/EntityAvatar";
import type {Account, Category, RecurringRule} from "@/data/types";
import {describeRecurringSchedule, recurringStatusLabel} from "@/features/recurringRules/recurringRuleModel";
import {messages} from "@/lib/i18n";
import {toDisplayDate} from "@/lib/date";
import {formatSignedAmount} from "@/lib/money";
import type {LucideIcon} from "lucide-react";

export type RecurringRuleNameMaps = {
    accounts: Map<string, string>;
    categories: Map<string, string>;
    merchants: Map<string, string>;
};

type RecurringRuleListProps = {
    rules: RecurringRule[];
    names: RecurringRuleNameMaps;
    /** 帳戶／分類參考資料，用來顯示頭像（color + icon）。 */
    accounts: Account[];
    categories: Category[];
    onEdit: (rule: RecurringRule) => void;
    onPause: (rule: RecurringRule) => void;
    onResume: (rule: RecurringRule) => void;
    onRunNow: (rule: RecurringRule) => void;
    onSkipNext: (rule: RecurringRule) => void;
    onDelete: (rule: RecurringRule) => void;
};

const STATUS_PALETTE: Record<RecurringRule["status"], string> = {active: "green", paused: "orange", ended: "gray"};

/** Footer 動作：mobile 每行兩個（各佔半行），desktop 依內容自動寬度。 */
const ACTION_WIDTH = {base: "calc(50% - 0.25rem)", md: "auto"};

/** 定期交易清單；每張卡顯示排程、下次執行、帳戶／分類／商戶同可用動作。 */
export const RecurringRuleList = ({rules, names, accounts, categories, onEdit, onPause, onResume, onRunNow, onSkipNext, onDelete}: RecurringRuleListProps) => {
    const intl = useIntl();
    const accountById = React.useMemo(() => new Map(accounts.map(account => [account.id, account])), [accounts]);
    const categoryById = React.useMemo(() => new Map(categories.map(category => [category.id, category])), [categories]);

    const renderChip = (key: string, icon: string | null, color: string | null, fallbackIcon: LucideIcon, label: string) => (
        <HStack key={key} gap="1.5" minW="0" maxW="full" bg="bg.subtle" rounded="full" ps="1" pe="2.5" py="1">
            <EntityAvatar size="xs" icon={icon} color={color} fallbackIcon={fallbackIcon} />
            <Text fontSize="xs" color="fg.muted" truncate>
                {label}
            </Text>
        </HStack>
    );

    return (
        <Stack gap="3">
            {rules.map(rule => {
                const account = accountById.get(rule.account_id);
                const category = rule.category_id == null ? undefined : categoryById.get(rule.category_id);
                const accountName = names.accounts.get(rule.account_id);
                const categoryName = rule.category_id == null ? null : names.categories.get(rule.category_id);
                const merchantName = rule.merchant_id == null ? null : names.merchants.get(rule.merchant_id);
                const title = rule.note ?? intl.formatMessage(rule.kind === "income" ? messages.transactions.income : messages.transactions.expense);
                const KindIcon = rule.kind === "income" ? ArrowDownLeftIcon : ArrowUpRightIcon;

                return (
                    <Box key={rule.id} borderWidth="1px" borderColor="border" bg="bg.panel" rounded="xl" shadow="xs" overflow="hidden">
                        <Stack gap="3" p="4">
                            <Flex gap="3" align="flex-start">
                                <EntityAvatar size="md" icon={category?.icon ?? null} color={category?.color ?? null} fallbackIcon={KindIcon} />
                                <Box minW="0" flex="1">
                                    <Flex justify="space-between" align="baseline" gap="3">
                                        <Text fontWeight="semibold" truncate>
                                            {title}
                                        </Text>
                                        <Text fontSize="sm" fontWeight="semibold" color={rule.kind} flexShrink="0" whiteSpace="nowrap" fontVariantNumeric="tabular-nums">
                                            {formatSignedAmount({cents: rule.amount_cents, kind: rule.kind})}
                                        </Text>
                                    </Flex>
                                    <HStack gap="2" mt="1.5" minW="0">
                                        <Badge colorPalette={STATUS_PALETTE[rule.status]} size="sm">
                                            {recurringStatusLabel(rule.status)}
                                        </Badge>
                                        <Text fontSize="xs" color="fg.muted" truncate>
                                            {describeRecurringSchedule(rule)}
                                        </Text>
                                    </HStack>
                                </Box>
                            </Flex>

                            <Stack gap="2">
                                <HStack gap="2" fontSize="xs" color="fg.muted">
                                    <CalendarClockIcon size={14} aria-hidden="true" />
                                    <Text>
                                        {intl.formatMessage(messages.recurring.nextRun)}：{toDisplayDate(rule.next_run_at)}
                                    </Text>
                                </HStack>
                                <Wrap gap="2">
                                    {accountName === undefined ? null : renderChip("account", account?.icon ?? null, account?.color ?? null, WalletIcon, accountName)}
                                    {categoryName == null ? null : renderChip("category", category?.icon ?? null, category?.color ?? null, TagIcon, categoryName)}
                                    {merchantName == null ? null : renderChip("merchant", null, null, StoreIcon, merchantName)}
                                </Wrap>
                            </Stack>
                        </Stack>

                        <Flex gap="2" wrap="wrap" align="center" px="3" py="3" borderTopWidth="1px" borderColor="border" bg="bg.subtle">
                            {rule.status === "active" ? (
                                <React.Fragment>
                                    <Button type="button" size="sm" variant="solid" w={ACTION_WIDTH} onClick={() => onRunNow(rule)}>
                                        <ZapIcon />
                                        {intl.formatMessage(messages.recurring.runNow)}
                                    </Button>
                                    <Button type="button" size="sm" variant="outline" w={ACTION_WIDTH} onClick={() => onPause(rule)}>
                                        <PauseIcon />
                                        {intl.formatMessage(messages.recurring.pause)}
                                    </Button>
                                    <Button type="button" size="sm" variant="outline" w={ACTION_WIDTH} onClick={() => onSkipNext(rule)}>
                                        <SkipForwardIcon />
                                        {intl.formatMessage(messages.recurring.skipNext)}
                                    </Button>
                                </React.Fragment>
                            ) : null}
                            {rule.status === "paused" ? (
                                <Button type="button" size="sm" variant="solid" w={ACTION_WIDTH} onClick={() => onResume(rule)}>
                                    <PlayIcon />
                                    {intl.formatMessage(messages.recurring.resume)}
                                </Button>
                            ) : null}
                            <Button type="button" size="sm" variant="outline" w={ACTION_WIDTH} ms={{base: "0", md: "auto"}} onClick={() => onEdit(rule)}>
                                <PencilIcon />
                                {intl.formatMessage(messages.common.edit)}
                            </Button>
                            <Button type="button" size="sm" variant="outline" colorPalette="red" w={{base: "full", md: "auto"}} onClick={() => onDelete(rule)}>
                                <Trash2Icon />
                                {intl.formatMessage(messages.common.delete)}
                            </Button>
                        </Flex>
                    </Box>
                );
            })}
        </Stack>
    );
};
