import React from "react";
import type {ReactNode} from "react";
import {Button, ButtonGroup, CloseButton, Flex, Input, InputGroup} from "@chakra-ui/react";
import {SearchIcon} from "lucide-react";
import {useIntl} from "react-intl";
import type {TransactionFilters} from "@/data/types";
import {messages} from "@/lib/i18n";
import {addMonthsToDate, todayDate} from "@/lib/date";

export type QuickRange = "all" | "this_month" | "last_month" | "last_30";

type TransactionsToolbarProps = {
    keyword: string;
    range: QuickRange;
    onSearch: (keyword: string) => void;
    onRangeChange: (range: QuickRange) => void;
    /** 進階篩選的觸發按鈕；由 TransactionFiltersPanel 自己提供，因為 popover 要同 trigger 貼住。 */
    filterControl: ReactNode;
};

/** 由快捷選項算出日期範圍；`all` 代表清空 from／to。 */
export function quickRangeToFilters(range: QuickRange): Pick<TransactionFilters, "from" | "to"> {
    if (range === "all") return {from: undefined, to: undefined};

    const today = todayDate();
    if (range === "last_30") {
        const from = new Date(`${today}T00:00:00.000Z`);
        from.setUTCDate(from.getUTCDate() - 29);
        return {from: from.toISOString().slice(0, 10), to: today};
    }

    const anchor = range === "this_month" ? today : addMonthsToDate(today, -1);
    const month = anchor.slice(0, 7);
    const lastDay = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0));
    return {from: `${month}-01`, to: lastDay.toISOString().slice(0, 10)};
}

/** 反推目前 filter 對應邊個快捷選項，冇對上就當自訂（`null`）。 */
export function matchQuickRange(filters: TransactionFilters): QuickRange | null {
    if (filters.from === undefined && filters.to === undefined) return "all";
    for (const range of ["this_month", "last_month", "last_30"] as const) {
        const candidate = quickRangeToFilters(range);
        if (candidate.from === filters.from && candidate.to === filters.to) return range;
    }
    return null;
}

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

    React.useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraft(keyword);
    }, [keyword]);

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
