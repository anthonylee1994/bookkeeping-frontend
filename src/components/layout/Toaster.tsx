import {Alert, CloseButton, Stack} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {messages} from "@/lib/i18n";
import type {ToastKind} from "@/stores/uiStore";
import {useUiStore} from "@/stores/uiStore";

const STATUS_BY_KIND: Record<ToastKind, "success" | "error" | "info"> = {
    success: "success",
    error: "error",
    info: "info",
};

/**
 * 讀 uiStore toast queue 並以 live region 公佈；視覺用 Chakra Alert。
 * Mobile 要避開底部 tab bar，所以下邊距要預留 tab bar 高度 + safe area。
 */
export const Toaster = () => {
    const intl = useIntl();
    const toasts = useUiStore(state => state.toasts);
    const dismissToast = useUiStore(state => state.dismissToast);

    return (
        <Stack
            aria-live="polite"
            aria-atomic="false"
            position="fixed"
            insetX="0"
            bottom="0"
            zIndex="50"
            align="center"
            gap="2"
            p="4"
            pb={{base: "calc(6rem + env(safe-area-inset-bottom))", md: "4"}}
            pointerEvents="none"
        >
            {toasts.map(toast => (
                <Alert.Root
                    key={toast.id}
                    role={toast.kind === "error" ? "alert" : "status"}
                    status={STATUS_BY_KIND[toast.kind]}
                    variant="solid"
                    rounded="xl"
                    shadow="lg"
                    w="full"
                    maxW="md"
                    pointerEvents="auto"
                >
                    <Alert.Indicator />
                    <Alert.Title flex="1">{toast.message}</Alert.Title>
                    <CloseButton aria-label={intl.formatMessage(messages.common.close)} size="sm" variant="plain" onClick={() => dismissToast(toast.id)} />
                </Alert.Root>
            ))}
        </Stack>
    );
};
