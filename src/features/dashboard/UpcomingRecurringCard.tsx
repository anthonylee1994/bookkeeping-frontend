import {Box, Button, Flex, Stack, Text} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import type {RecurringRuleSummary} from "@/data/types";
import {DashboardSection} from "@/features/dashboard/DashboardSection";
import {toDisplayDate} from "@/lib/date";
import {kindLabel} from "@/lib/transactionDisplay";
import {messages} from "@/lib/i18n";
import {formatSignedAmount} from "@/lib/money";
import {ROUTES} from "@/routes/paths";

type UpcomingRecurringCardProps = {
    rules: RecurringRuleSummary[];
};

/** 未來 7 日會產生的定期交易。 */
export const UpcomingRecurringCard = ({rules}: UpcomingRecurringCardProps) => {
    const intl = useIntl();

    return (
        <DashboardSection
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
                    {rules.map(rule => (
                        <Flex key={rule.id} justify="space-between" align="center" gap="3" rounded="lg" borderWidth="1px" borderColor="border" px="3" py="2.5">
                            <Box minW="0">
                                <Text fontSize="sm" fontWeight="medium" truncate>
                                    {rule.note ?? kindLabel(rule.kind)}
                                </Text>
                                <Text fontSize="xs" color="fg.muted">
                                    {toDisplayDate(rule.next_run_at)}
                                </Text>
                            </Box>
                            <Text fontSize="sm" fontWeight="semibold" color={rule.kind} fontVariantNumeric="tabular-nums">
                                {formatSignedAmount({cents: rule.amount_cents, kind: rule.kind})}
                            </Text>
                        </Flex>
                    ))}
                </Stack>
            )}
        </DashboardSection>
    );
};
