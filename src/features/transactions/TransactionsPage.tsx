import {useIntl} from "react-intl";
import {PageHeader} from "@/components/layout/PageHeader";
import {messages} from "@/lib/i18n";

/** Step 12 會實作交易列表；Step 9 只需要 route 目標存在。 */
export const TransactionsPage = () => {
    const intl = useIntl();
    return <PageHeader title={intl.formatMessage(messages.nav.transactions)} />;
};
