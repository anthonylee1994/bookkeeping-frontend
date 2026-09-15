import {useIntl} from "react-intl";
import {PageHeader} from "@/components/layout/PageHeader";
import {messages} from "@/lib/i18n";

/** Step 15 會實作 AI 單據流程；Step 9 只需要 route 目標存在。 */
export const ScanPage = () => {
    const intl = useIntl();
    return <PageHeader title={intl.formatMessage(messages.nav.scan)} />;
};
