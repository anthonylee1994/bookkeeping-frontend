import {Button, Wrap} from "@chakra-ui/react";
import {XIcon} from "lucide-react";
import {useIntl} from "react-intl";
import type {TransactionFilters} from "@/data/types";
import type {ActiveFilterChip} from "@/features/transactions/transactionsFormat";
import {messages} from "@/lib/i18n";

type TransactionFilterChipsProps = {
    chips: ActiveFilterChip[];
    onRemove: (key: keyof TransactionFilters) => void;
    onClearAll: () => void;
};

/** 生效中的篩選，逐個可移除；比起淨係顯示一個數字，用戶睇得出實際條件。 */
export const TransactionFilterChips = ({chips, onRemove, onClearAll}: TransactionFilterChipsProps) => {
    const intl = useIntl();

    if (chips.length === 0) return null;

    return (
        <Wrap gap="2" align="center">
            {chips.map(chip => (
                <Button
                    key={chip.key}
                    aria-label={intl.formatMessage(messages.transactions.toolbar.removeFilter, {label: chip.label})}
                    size="xs"
                    variant="subtle"
                    rounded="full"
                    bg="brand.active"
                    color="brand.activeFg"
                    onClick={() => onRemove(chip.key)}
                >
                    {chip.label}
                    <XIcon />
                </Button>
            ))}
            {chips.length < 2 ? null : (
                <Button size="xs" variant="ghost" rounded="full" color="fg.muted" onClick={onClearAll}>
                    {intl.formatMessage(messages.transactions.toolbar.clearAll)}
                </Button>
            )}
        </Wrap>
    );
};
