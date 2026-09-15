import {Loader2Icon} from "lucide-react";
import {useIntl} from "react-intl";
import {messages} from "@/lib/i18n";

/** 全頁 loading：session restore 期間用，避免閃 login。 */
export const FullPageLoading = () => {
    const intl = useIntl();
    return (
        <div role="status" aria-live="polite" className="text-muted-foreground flex min-h-dvh items-center justify-center gap-2">
            <Loader2Icon aria-hidden className="size-5 animate-spin" />
            <span>{intl.formatMessage(messages.common.loading)}</span>
        </div>
    );
};
