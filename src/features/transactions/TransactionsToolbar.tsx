import React from "react";
import type {ReactNode} from "react";
import {Button, ButtonGroup, CloseButton, Flex, Input, InputGroup} from "@chakra-ui/react";
import {SearchIcon} from "lucide-react";
import {useIntl} from "react-intl";
import type {QuickRange} from "@/features/transactions/transactionQuickRanges";
import {messages} from "@/lib/i18n";

type TransactionsToolbarProps = {
    keyword: string;
    range: QuickRange;
    onSearch: (keyword: string) => void;
    onRangeChange: (range: QuickRange) => void;
    /** 進階篩選的觸發按鈕；由 TransactionFiltersPanel 自己提供，因為 popover 要同 trigger 貼住。 */
    filterControl: ReactNode;
};

const RANGE_OPTIONS: readonly {value: QuickRange; label: keyof typeof messages.transactions.toolbar}[] = [
    {value: "all", label: "rangeAll"},
    {value: "this_month", label: "rangeThisMonth"},
    {value: "last_month", label: "rangeLastMonth"},
    {value: "last_30", label: "rangeLast30"},
];

/** 搜尋 + 快捷日期範圍 + 進階篩選入口。搜尋在按 Enter 或失焦時才送出，避免每個字都打 API。 */
export const TransactionsToolbar = ({keyword, range, onSearch, onRangeChange, filterControl}: TransactionsToolbarProps) => {
    const intl = useIntl();
    const [draft, setDraft] = React.useState(keyword);
    const [prevKeyword, setPrevKeyword] = React.useState(keyword);

    if (prevKeyword !== keyword) {
        setPrevKeyword(keyword);
        setDraft(keyword);
    }

    const commit = () => {
        if (draft.trim() !== keyword) onSearch(draft.trim());
    };

    return (
        <Flex wrap="wrap" align="center" gap="2">
            <InputGroup
                flex="1"
                minW="3xs"
                startElement={<SearchIcon size={16} />}
                endElement={
                    draft === "" ? undefined : (
                        <CloseButton
                            aria-label={intl.formatMessage(messages.transactions.toolbar.clearSearch)}
                            size="xs"
                            variant="plain"
                            me="-1"
                            onClick={() => {
                                setDraft("");
                                onSearch("");
                            }}
                        />
                    )
                }
            >
                <Input
                    aria-label={intl.formatMessage(messages.transactions.toolbar.searchLabel)}
                    placeholder={intl.formatMessage(messages.transactions.filters.keywordPlaceholder)}
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                    onBlur={commit}
                    onKeyDown={event => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            commit();
                        }
                    }}
                />
            </InputGroup>

            <ButtonGroup size="sm" variant="outline" attached display={{base: "none", md: "inline-flex"}}>
                {RANGE_OPTIONS.map(option => (
                    <Button
                        key={option.value}
                        onClick={() => onRangeChange(option.value)}
                        aria-pressed={range === option.value}
                        bg={range === option.value ? "brand.active" : undefined}
                        color={range === option.value ? "brand.activeFg" : undefined}
                        fontWeight={range === option.value ? "semibold" : "medium"}
                    >
                        {intl.formatMessage(messages.transactions.toolbar[option.label])}
                    </Button>
                ))}
            </ButtonGroup>

            {filterControl}
        </Flex>
    );
};
