import React from "react";
import {Box, Button, Center, CloseButton, Flex, Stack, Text} from "@chakra-ui/react";
import {CheckCircleIcon, DownloadIcon, RefreshCwIcon, ShareIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {useAppUpdate} from "@/features/pwa/useAppUpdate";
import {useInstallPrompt} from "@/features/pwa/useInstallPrompt";
import {useIosInstallHint} from "@/features/pwa/useIosInstallHint";
import {messages} from "@/lib/i18n";

type BannerContent = {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: {label: string; onClick: () => void};
    onDismiss: () => void;
};

/**
 * 全 app 共用的 PWA 提示：一次只顯示一個，優先次序為
 * 新版本 → 安裝 → iOS 加入主畫面 → 已可離線。
 * 固定於底部（mobile 位於 tab bar 之上），不會阻擋頁面主體。
 */
export const PwaBanners = () => {
    const intl = useIntl();
    const update = useAppUpdate();
    const install = useInstallPrompt();
    const ios = useIosInstallHint();

    const banner: BannerContent | null = (() => {
        if (update.needRefresh) {
            return {
                icon: <RefreshCwIcon size={20} />,
                title: intl.formatMessage(messages.pwa.updateTitle),
                description: intl.formatMessage(messages.pwa.updateDescription),
                action: {label: intl.formatMessage(messages.pwa.updateAction), onClick: update.applyUpdate},
                onDismiss: update.dismissUpdate,
            };
        }
        if (install.canInstall) {
            return {
                icon: <DownloadIcon size={20} />,
                title: intl.formatMessage(messages.pwa.installTitle),
                description: intl.formatMessage(messages.pwa.installDescription),
                action: {label: intl.formatMessage(messages.pwa.installAction), onClick: install.install},
                onDismiss: install.dismiss,
            };
        }
        if (ios.visible) {
            return {
                icon: <ShareIcon size={20} />,
                title: intl.formatMessage(messages.pwa.iosTitle),
                description: intl.formatMessage(messages.pwa.iosDescription),
                onDismiss: ios.dismiss,
            };
        }
        if (update.offlineReady) {
            return {
                icon: <CheckCircleIcon size={20} />,
                title: intl.formatMessage(messages.pwa.offlineReady),
                description: intl.formatMessage(messages.pwa.offlineReadyDescription),
                onDismiss: update.dismissOfflineReady,
            };
        }
        return null;
    })();

    if (banner === null) return null;

    return (
        <Box position="fixed" insetX="0" bottom={{base: "20", md: "6"}} zIndex="toast" px="3" pointerEvents="none">
            <Box maxW="md" mx="auto" bg="bg.panel" borderWidth="1px" borderColor="border" rounded="xl" shadow="lg" p="4" pointerEvents="auto">
                <Flex gap="3" align="flex-start">
                    <Center boxSize="10" rounded="lg" bg="brand.muted" color="brand.fg" flexShrink="0" aria-hidden="true">
                        {banner.icon}
                    </Center>
                    <Stack gap="1" flex="1" minW="0">
                        <Text fontWeight="semibold" fontSize="sm">
                            {banner.title}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                            {banner.description}
                        </Text>
                        {banner.action === undefined ? null : (
                            <Button size="sm" mt="2" alignSelf="flex-start" onClick={banner.action.onClick}>
                                {banner.action.label}
                            </Button>
                        )}
                    </Stack>
                    <CloseButton aria-label={intl.formatMessage(messages.pwa.dismiss)} size="sm" onClick={banner.onDismiss} />
                </Flex>
            </Box>
        </Box>
    );
};
