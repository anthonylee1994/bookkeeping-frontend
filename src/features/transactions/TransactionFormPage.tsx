import {useIntl} from "react-intl";
import {PageHeader} from "@/components/layout/PageHeader";
import {messages} from "@/lib/i18n";

/** Step 13 會實作新增／修改交易；Step 9 只需要 route 目標存在。 */
export const TransactionFormPage = () => {
    const intl = useIntl();
    return <PageHeader title={intl.formatMessage(messages.common.create)} />;
};
