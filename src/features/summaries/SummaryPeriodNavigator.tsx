import {Flex, HStack, IconButton, Input, Text} from "@chakra-ui/react";
import {ChevronLeftIcon, ChevronRightIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {messages} from "@/lib/i18n";

type SummaryPeriodNavigatorProps = {
    date: string;
    label: string;
    onDateChange: (date: string) => void;
    onPrevious: () => void;
    onNext: () => void;
};

/** 上一期／下一期按鈕夾住期間標題，右邊配合日期 picker。 */
export const SummaryPeriodNavigator = ({date, label, onDateChange, onPrevious, onNext}: SummaryPeriodNavigatorProps) => {
    const intl = useIntl();
    const previousLabel = intl.formatMessage(messages.summaries.previousPeriod);
    const nextLabel = intl.formatMessage(messages.summaries.nextPeriod);

    return (
        <Flex direction={{base: "column", md: "row"}} align={{base: "stretch", md: "center"}} justify="space-between" gap="3">
            <HStack flex={{md: "1"}} minW="0" gap="1" bg="bg.panel" borderWidth="1px" borderColor="border" rounded="lg" p="1" shadow="xs">
                <IconButton aria-label={previousLabel} title={previousLabel} onClick={onPrevious} variant="ghost" size="sm">
                    <ChevronLeftIcon />
                </IconButton>
                <Text flex="1" minW="0" px="2" textAlign="center" fontSize={{base: "xs", sm: "sm"}} fontWeight="semibold" lineHeight="short" aria-live="polite">
                    {label}
                </Text>
                <IconButton aria-label={nextLabel} title={nextLabel} onClick={onNext} variant="ghost" size="sm">
                    <ChevronRightIcon />
                </IconButton>
            </HStack>
            <Input type="date" value={date} w={{base: "full", md: "auto"}} aria-label={intl.formatMessage(messages.summaries.dateLabel)} onChange={event => onDateChange(event.target.value)} />
        </Flex>
    );
};
