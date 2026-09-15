import {useIntl} from "react-intl";
import {PageHeader} from "@/components/layout/PageHeader";
import {messages} from "@/lib/i18n";

/** Step 10 會換成真正註冊表單；Step 9 只需要 route 目標存在。 */
export const RegisterPage = () => {
    const intl = useIntl();
    return <PageHeader title={intl.formatMessage(messages.auth.registerTitle)} />;
};
