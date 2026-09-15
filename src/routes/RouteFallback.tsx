import {Skeleton, Stack, Text} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {messages} from "@/lib/i18n";

/** Route lazy-load fallback：固定尺寸 skeleton，避免 layout jump。 */
export const RouteFallback = () => {
    const intl = useIntl();
    return (
        <Stack role="status" aria-live="polite" gap="4">
            <Skeleton h="8" w="40" rounded="lg" />
            <Skeleton h="24" w="full" rounded="xl" />
            <Skeleton h="24" w="full" rounded="xl" />
            <Text srOnly>{intl.formatMessage(messages.common.loading)}</Text>
        </Stack>
    );
};
