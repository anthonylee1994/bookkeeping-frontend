import {Alert, Box} from "@chakra-ui/react";
import {WifiOffIcon} from "lucide-react";
import {useIntl} from "react-intl";
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
        <Box px="4" pt="3">
            <Alert.Root status="warning" role="status" rounded="lg">
                <Alert.Indicator>
                    <WifiOffIcon />
                </Alert.Indicator>
                <Alert.Title>{intl.formatMessage(messages.offline.banner)}</Alert.Title>
            </Alert.Root>
        </Box>
    );
};
