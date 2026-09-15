import {useIntl} from "react-intl";
import {Skeleton} from "@/components/ui/Skeleton";
import {messages} from "@/lib/i18n";

/** Route lazy-load fallback：固定尺寸 skeleton，避免 layout jump。 */
export const RouteFallback = () => {
    const intl = useIntl();
    return (
        <div role="status" aria-live="polite" className="flex flex-col gap-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <span className="sr-only">{intl.formatMessage(messages.common.loading)}</span>
        </div>
    );
};
