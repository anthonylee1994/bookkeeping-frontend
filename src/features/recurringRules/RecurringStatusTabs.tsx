import {Tabs} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import type {RecurringStatus} from "@/data/types";
import {recurringStatusLabel} from "@/features/recurringRules/recurringRuleModel";
import {messages} from "@/lib/i18n";

export const RECURRING_STATUSES: readonly RecurringStatus[] = ["active", "paused", "ended"];

type RecurringStatusTabsProps = {
    status: RecurringStatus;
    onChange: (status: RecurringStatus) => void;
};

/** 定期交易 active／paused／ended tabs。 */
export const RecurringStatusTabs = ({status, onChange}: RecurringStatusTabsProps) => {
    const intl = useIntl();

    return (
        <Tabs.Root value={status} onValueChange={details => onChange(details.value as RecurringStatus)}>
            <Tabs.List aria-label={intl.formatMessage(messages.recurring.tabsLabel)}>
                {RECURRING_STATUSES.map(value => (
                    <Tabs.Trigger key={value} value={value}>
                        {recurringStatusLabel(value)}
                    </Tabs.Trigger>
                ))}
            </Tabs.List>
        </Tabs.Root>
    );
};
