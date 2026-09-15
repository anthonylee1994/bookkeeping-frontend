import {useIntl} from "react-intl";
import {PageHeader} from "@/components/layout/PageHeader";
import {messages} from "@/lib/i18n";

/** Step 18 會實作分類設定；Step 9 只需要 route 目標存在。 */
export const CategoriesPage = () => {
    const intl = useIntl();
    return <PageHeader title={intl.formatMessage(messages.nav.categories)} />;
};
