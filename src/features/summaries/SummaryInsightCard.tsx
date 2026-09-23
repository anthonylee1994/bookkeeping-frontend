import {Box, Button, Card, Flex, HStack, Skeleton, Stack, Text} from "@chakra-ui/react";
import {SparklesIcon} from "lucide-react";
import {useIntl} from "react-intl";
import type {Summary, SummaryPeriod} from "@/data/types";
import {summaryInsightKey} from "@/features/summaries/summariesFormat";
import {useSummaryInsight} from "@/features/summaries/useSummaryInsight";
import {messages} from "@/lib/i18n";

type SummaryInsightCardProps = {
    summary: Summary;
    period: SummaryPeriod;
    date: string;
};

/**
 * AI 收支概況卡。用淡藍底（`ai.*` semantic token）同其他白色報表卡區分，
 * 令用戶一眼睇到呢段係 AI 生成、只供參考。只喺期間有收入／支出交易時出現；
 * 失敗時顯示可重試嘅提示，永遠唔會遮住上面 deterministic 嘅數字。
 */
export const SummaryInsightCard = ({summary, period, date}: SummaryInsightCardProps) => {
    const intl = useIntl();
    const enabled = summary.transactions.meta.total > 0;
    const {insight, isLoading, error, reload} = useSummaryInsight(period, date, enabled, summaryInsightKey(summary));

    if (!enabled || insight?.status === "empty") return null;

    const retry = (
        <Button size="sm" variant="outline" onClick={reload} flexShrink="0">
            {intl.formatMessage(messages.common.retry)}
        </Button>
    );

    const renderBody = () => {
        if (isLoading) {
            return (
                <Stack gap="2" aria-hidden="true">
                    <Skeleton h="4" bgColor="blue.200" />
                    <Skeleton h="4" bgColor="blue.200" />
                    <Skeleton h="4" w="60%" bgColor="blue.200" />
                </Stack>
            );
        }

        if (error !== null) {
            return (
                <Flex justify="space-between" align="center" gap="3" color="fg.muted">
                    <Text fontSize="sm">{error.message}</Text>
                    {retry}
                </Flex>
            );
        }

        if (insight === null) return null;

        if (insight.status === "failed" || insight.text === null) {
            return (
                <Flex justify="space-between" align="center" gap="3" color="fg.muted">
                    <Text fontSize="sm">{intl.formatMessage(messages.summaries.insightFailed)}</Text>
                    {retry}
                </Flex>
            );
        }

        return (
            <Stack gap="3">
                <Text>{insight.text}</Text>
                {insight.highlights.length === 0 ? null : (
                    <Stack as="ul" listStyleType="none" gap="2.5" m="0" p="0">
                        {insight.highlights.map((item, index) => (
                            <Box as="li" key={`${index}-${item}`} bg="bg.panel" borderLeftWidth="3px" borderColor="ai.fg" px="4" py="3" shadow="sm">
                                <Text fontSize="md" color="fg" lineHeight="tall">
                                    {item}
                                </Text>
                            </Box>
                        ))}
                    </Stack>
                )}
                <Text fontSize="sm" color="fg.subtle" mt={2}>
                    {intl.formatMessage(messages.summaries.insightDisclaimer)}
                </Text>
            </Stack>
        );
    };

    return (
        <Card.Root as="section" rounded="xl" bg="ai.bg" borderWidth="1px" borderColor="ai.border" shadow="xs">
            <Card.Header gap="1" px={{base: "4", md: "6"}} pt={{base: "4", md: "6"}}>
                <HStack gap="2" align="flex-start" minH="9">
                    <Box color="ai.fg" flexShrink="0" pt="0.5">
                        <SparklesIcon size={18} />
                    </Box>
                    <Box minW="0">
                        <Card.Title fontSize="md" color="ai.fg">
                            {intl.formatMessage(messages.summaries.insightTitle)}
                        </Card.Title>
                    </Box>
                </HStack>
            </Card.Header>
            <Card.Body flex="1" pt="0" px={{base: "4", md: "6"}} pb={{base: "4", md: "6"}} gap="3">
                <Box aria-live="polite" aria-busy={isLoading}>
                    {renderBody()}
                </Box>
            </Card.Body>
        </Card.Root>
    );
};
