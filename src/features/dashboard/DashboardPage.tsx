import {useIntl} from "react-intl";
import {PageHeader} from "@/components/layout/PageHeader";
import {messages} from "@/lib/i18n";

/** Step 11 會實作 Dashboard；Step 9 只需要 route 目標存在。 */
export const DashboardPage = () => {
    const intl = useIntl();
    return <PageHeader title={intl.formatMessage(messages.nav.dashboard)} />;
};
