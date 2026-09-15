import {useIntl} from "react-intl";
import {PageHeader} from "@/components/layout/PageHeader";
import {messages} from "@/lib/i18n";

/** Step 14 會實作交易詳情；Step 9 只需要 route 目標存在。 */
export const TransactionDetailPage = () => {
    const intl = useIntl();
    return <PageHeader title={intl.formatMessage(messages.nav.transactions)} />;
};
