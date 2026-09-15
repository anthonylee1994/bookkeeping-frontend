import {PlusIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";

/** 新增交易 FAB；mobile 放喺 bottom nav 上方。 */
export const AddTransactionFab = () => {
    const intl = useIntl();
    const label = intl.formatMessage(messages.layout.addTransaction);

    return (
        <Link
            to={ROUTES.transactionNew}
            aria-label={label}
            title={label}
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring/50 fixed right-4 bottom-20 z-30 inline-flex size-14 items-center justify-center rounded-full shadow-lg transition-colors focus-visible:ring-3 focus-visible:outline-none md:right-6 md:bottom-6"
        >
            <PlusIcon aria-hidden className="size-6" />
        </Link>
    );
};
