import {HStack, IconButton, Text} from "@chakra-ui/react";
import {ChevronLeftIcon, ChevronRightIcon} from "lucide-react";

type MonthNavigatorProps = {
    label: string;
    previousLabel: string;
    nextLabel: string;
    onPrevious: () => void;
    onNext: () => void;
};

/** Dashboard 月份切換：上／下月按鈕夾住當前月份標題。Mobile 撐滿一行。 */
export const MonthNavigator = ({label, previousLabel, nextLabel, onPrevious, onNext}: MonthNavigatorProps) => {
    return (
        <HStack w={{base: "full", md: "auto"}} gap="1" bg="bg.panel" borderWidth="1px" borderColor="border" rounded="lg" p="1" shadow="xs">
            <IconButton aria-label={previousLabel} title={previousLabel} onClick={onPrevious} variant="ghost" size="sm">
                <ChevronLeftIcon />
            </IconButton>
            <Text flex="1" minW={{base: "5.5rem", md: "7rem"}} textAlign="center" fontSize="sm" fontWeight="semibold" aria-live="polite">
                {label}
            </Text>
            <IconButton aria-label={nextLabel} title={nextLabel} onClick={onNext} variant="ghost" size="sm">
                <ChevronRightIcon />
            </IconButton>
        </HStack>
    );
};
