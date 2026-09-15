import {Center, HStack, Spinner, Text} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {messages} from "@/lib/i18n";

/** 全頁 loading：session restore 期間用，避免閃 login。 */
export const FullPageLoading = () => {
    const intl = useIntl();
    return (
        <Center role="status" aria-live="polite" minH="100dvh" color="fg.muted">
            <HStack gap="2">
                <Spinner size="sm" />
                <Text>{intl.formatMessage(messages.common.loading)}</Text>
            </HStack>
        </Center>
    );
};
