import {WifiOffIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Banner} from "@/components/ui/Banner";
import {useOffline} from "@/hooks/useOffline";
import {messages} from "@/lib/i18n";

/** 低干擾 offline banner。 */
export const OfflineBanner = () => {
    const isOffline = useOffline();
    const intl = useIntl();

    if (!isOffline) {
        return null;
    }

    return (
        <div className="px-4 pt-3">
            <Banner variant="warning" icon={<WifiOffIcon />}>
                {intl.formatMessage(messages.offline.banner)}
            </Banner>
        </div>
    );
};
