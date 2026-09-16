import React from "react";
import {Box, Button, Flex, Stack, Text} from "@chakra-ui/react";
import {TagIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {EntityAvatar} from "@/components/EntityAvatar";
import {SectionCard} from "@/components/layout/SectionCard";
import type {Category, RecurringRuleSummary} from "@/data/types";
import {daysFromToday, toDisplayDate} from "@/lib/date";
import {kindLabel} from "@/lib/transactionDisplay";
import {messages} from "@/lib/i18n";
import {formatSignedAmount} from "@/lib/money";
import {ROUTES} from "@/routes/paths";

type UpcomingRecurringCardProps = {
    rules: RecurringRuleSummary[];
    /** 分類參考資料（含 color／icon）；rule payload 只有 category_id。 */
    categories: Category[];
};

/** 未來 7 日會產生的定期交易。 */
export const UpcomingRecurringCard = ({rules, categories}: UpcomingRecurringCardProps) => {
    const intl = useIntl();
    const categoryById = React.useMemo(() => new Map(categories.map(category => [category.id, category])), [categories]);

    /** 7 日內的執行日改用「今日／聽日／N 日後」，比死板日期更有時間感。 */
    const whenLabel = (nextRunAt: string): string => {
        const days = daysFromToday(nextRunAt);
        if (days === 0) return intl.formatMessage(messages.dashboard.upcomingToday);
        if (days === 1) return intl.formatMessage(messages.dashboard.upcomingTomorrow);
        if (days > 1) return intl.formatMessage(messages.dashboard.upcomingInDays, {days});
        return toDisplayDate(nextRunAt);
    };

    return (
        <SectionCard
            title={intl.formatMessage(messages.dashboard.upcomingTitle)}
            action={
                <Button asChild variant="ghost" size="sm">
                    <Link to={ROUTES.recurringRules}>{intl.formatMessage(messages.dashboard.viewAll)}</Link>
                </Button>
            }
        >
            {rules.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                    {intl.formatMessage(messages.dashboard.noUpcoming)}
                </Text>
            ) : (
                <Stack gap="2">
                    {rules.map(rule => {
                        const category = rule.category_id != null ? categoryById.get(rule.category_id) : undefined;
                        return (
                            <Flex key={rule.id} align="center" gap="3" rounded="lg" borderWidth="1px" borderColor="border" px="3" py="2.5">
                                <EntityAvatar size="sm" icon={category?.icon ?? null} color={category?.color ?? rule.kind} fallbackIcon={TagIcon} />
                                <Box minW="0" flex="1">
                                    <Text fontSize="sm" fontWeight="medium" truncate>
                                        {rule.note ?? kindLabel(rule.kind)}
                                    </Text>
                                    <Text fontSize="xs" color="fg.muted">
                                        {whenLabel(rule.next_run_at)}
                                    </Text>
                                </Box>
                                <Text fontSize="sm" fontWeight="semibold" color={rule.kind} flexShrink="0" whiteSpace="nowrap" fontVariantNumeric="tabular-nums">
                                    {formatSignedAmount({cents: rule.amount_cents, kind: rule.kind})}
                                </Text>
                            </Flex>
                        );
                    })}
                </Stack>
            )}
        </SectionCard>
    );
};
