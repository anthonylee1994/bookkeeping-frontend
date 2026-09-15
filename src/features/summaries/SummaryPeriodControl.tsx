import {Button, HStack} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import type {SummaryPeriod} from "@/data/types";
import {periodLabel, SUMMARY_PERIODS} from "@/features/summaries/summariesFormat";
import {messages} from "@/lib/i18n";

type SummaryPeriodControlProps = {
    period: SummaryPeriod;
    onChange: (period: SummaryPeriod) => void;
};

/** 日／週／月 segmented control。 */
export const SummaryPeriodControl = ({period, onChange}: SummaryPeriodControlProps) => {
    const intl = useIntl();

    return (
        <HStack role="group" aria-label={intl.formatMessage(messages.summaries.periodLabel)} gap="1" bg="gray.200" _dark={{bg: "gray.700"}} p="1" rounded="lg">
            {SUMMARY_PERIODS.map(value => (
                <Button
                    key={value}
                    type="button"
                    variant={period === value ? "solid" : "ghost"}
                    colorPalette={period === value ? "brand" : undefined}
                    color={period === value ? undefined : "fg"}
                    _hover={period === value ? undefined : {bg: "gray.300", _dark: {bg: "gray.600"}}}
                    aria-pressed={period === value}
                    onClick={() => onChange(value)}
                >
                    {periodLabel(value)}
                </Button>
            ))}
        </HStack>
    );
};
