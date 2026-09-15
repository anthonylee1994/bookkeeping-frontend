import {Center, ProgressCircle, Text} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {messages} from "@/lib/i18n";
import type {ProgressCircleRootProps} from "@chakra-ui/react";

type LoadingIndicatorProps = {
    /** 預留高度，令載入完成後不會跳動；跟隨被取代的內容大約高度去設。 */
    minH?: string | Record<string, string>;
    size?: ProgressCircleRootProps["size"];
};

/**
 * 全 app 共用的載入指示：不定進度的 progress circle。
 * `value={null}` 就是 Chakra 的 indeterminate 模式。
 */
export const LoadingIndicator = ({minH = "16rem", size = "md"}: LoadingIndicatorProps) => {
    const intl = useIntl();

    return (
        <Center role="status" aria-live="polite" minH={minH} py="8" color="brand.fg">
            <ProgressCircle.Root value={null} size={size}>
                <ProgressCircle.Circle>
                    <ProgressCircle.Track />
                    <ProgressCircle.Range strokeLinecap="round" />
                </ProgressCircle.Circle>
            </ProgressCircle.Root>
            <Text srOnly>{intl.formatMessage(messages.common.loading)}</Text>
        </Center>
    );
};
