import {useIntl} from "react-intl";
import {PageHeader} from "@/components/layout/PageHeader";
import {messages} from "@/lib/i18n";

/** Step 17 會實作定期交易；Step 9 只需要 route 目標存在。 */
export const RecurringRulesPage = () => {
    const intl = useIntl();
    return <PageHeader title={intl.formatMessage(messages.nav.recurringRules)} />;
};
