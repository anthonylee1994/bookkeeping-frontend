import {Alert, Button, CloseButton, Drawer, Portal, Stack} from "@chakra-ui/react";
import {PencilIcon, RotateCcwIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {DrawerBody} from "@/components/layout/DrawerBody";
import type {AiPreview} from "@/data/types";
import {ScanReviewForm} from "@/features/receiptScan/ScanReviewForm";
import {ScanStage} from "@/features/receiptScan/ScanStage";
import type {ScanPhase} from "@/features/receiptScan/ScanStage";
import type {ScanReference} from "@/features/receiptScan/scanModel";
import {DESKTOP_QUERY, useMediaQuery} from "@/hooks/useMediaQuery";
import {messages} from "@/lib/i18n";

export type ScanBanner = {status: "error" | "info"; message: string};

type ScanDrawerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    phase: ScanPhase;
    imageSrc: string | null;
    imageFailed: boolean;
    banner: ScanBanner | null;
    preview: AiPreview | null;
    canRetry: boolean;
    reference: ScanReference;
    onImageError: () => void;
    onChangeImage: () => void;
    onCancel: () => void;
    onRetry: () => void;
    onManualEntry: () => void;
    onConfirmed: () => void;
    onStartOver: () => void;
};

/**
 * 單據掃描的統一容器：上載／解析期間顯示可取消的進度，完成後在同一 drawer
 * 內切換成覆核表單。Mobile 由底部升起，desktop 由右側滑入。
 */
export const ScanDrawer = ({
    open,
    onOpenChange,
    phase,
    imageSrc,
    imageFailed,
    banner,
    preview,
    canRetry,
    reference,
    onImageError,
    onChangeImage,
    onCancel,
    onRetry,
    onManualEntry,
    onConfirmed,
    onStartOver,
}: ScanDrawerProps) => {
    const intl = useIntl();
    const isDesktop = useMediaQuery(DESKTOP_QUERY);
    const isReview = preview !== null;
    const title = intl.formatMessage(isReview ? messages.scan.reviewTitle : messages.scan.title);
    const description = isReview ? intl.formatMessage(messages.scan.reviewDescription) : phase === null ? null : intl.formatMessage(messages.scan.parsingHint);

    const body = (
        <Stack gap="4">
            {imageSrc === null ? null : <ScanStage phase={phase} imageSrc={imageSrc} imageFailed={imageFailed} onChangeImage={onChangeImage} onCancel={onCancel} onImageError={onImageError} />}

            {isReview ? (
                <ScanReviewForm preview={preview} reference={reference} onConfirmed={onConfirmed} onStartOver={onStartOver} />
            ) : (
                <Stack gap="4">
                    {banner === null ? null : (
                        <Alert.Root status={banner.status} role={banner.status === "error" ? "alert" : undefined} rounded="lg">
                            <Alert.Indicator />
                            <Alert.Title>{banner.message}</Alert.Title>
                        </Alert.Root>
                    )}

                    {phase !== null ? null : (
                        <Stack direction={{base: "column", md: "row"}} justify={{md: "flex-end"}} gap="3">
                            {canRetry ? (
                                <Button type="button" w={{base: "full", md: "auto"}} onClick={onRetry}>
                                    <RotateCcwIcon aria-hidden="true" />
                                    {intl.formatMessage(messages.scan.retry)}
                                </Button>
                            ) : null}
                            <Button type="button" variant="outline" w={{base: "full", md: "auto"}} onClick={onChangeImage}>
                                {intl.formatMessage(messages.scan.changeImage)}
                            </Button>
                            <Button type="button" variant="ghost" w={{base: "full", md: "auto"}} onClick={onManualEntry}>
                                <PencilIcon aria-hidden="true" />
                                {intl.formatMessage(messages.scan.manualEntry)}
                            </Button>
                        </Stack>
                    )}
                </Stack>
            )}
        </Stack>
    );

    return (
        <Drawer.Root open={open} placement={isDesktop ? "end" : "bottom"} size={isDesktop ? "lg" : "full"} onOpenChange={event => onOpenChange(event.open)}>
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content h={isDesktop ? "full" : "auto"} maxH={isDesktop ? undefined : "94dvh"} roundedTop={isDesktop ? undefined : "2xl"}>
                        <Drawer.Header>
                            <Stack gap="0.5" flex="1" minW="0">
                                <Drawer.Title>{title}</Drawer.Title>
                                {description === null ? null : <Drawer.Description>{description}</Drawer.Description>}
                            </Stack>
                            <Drawer.CloseTrigger asChild>
                                <CloseButton aria-label={intl.formatMessage(messages.common.close)} />
                            </Drawer.CloseTrigger>
                        </Drawer.Header>
                        <DrawerBody>{body}</DrawerBody>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
};
