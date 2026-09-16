import {Card, CloseButton, Drawer, Portal, Stack} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import type {AiPreview} from "@/data/types";
import {ScanReviewForm} from "@/features/receiptScan/ScanReviewForm";
import type {ScanReference} from "@/features/receiptScan/scanModel";
import {messages} from "@/lib/i18n";

type ScanReviewPanelProps = {
    variant: "inline" | "sheet";
    open: boolean;
    onOpenChange: (open: boolean) => void;
    preview: AiPreview;
    reference: ScanReference;
    onConfirmed: () => void;
    onStartOver: () => void;
};

/**
 * 覆核結果的容器：desktop 用頁內卡片，mobile 用由底部升起的 sheet，
 * 內容一律是同一份 ScanReviewForm，行為保持一致。
 */
export const ScanReviewPanel = ({variant, open, onOpenChange, preview, reference, onConfirmed, onStartOver}: ScanReviewPanelProps) => {
    const intl = useIntl();
    const title = intl.formatMessage(messages.scan.reviewTitle);
    const description = intl.formatMessage(messages.scan.reviewDescription);
    const form = <ScanReviewForm preview={preview} reference={reference} variant={variant} onConfirmed={onConfirmed} onStartOver={onStartOver} />;

    if (variant === "inline") {
        return (
            <Card.Root as="section" rounded="xl" borderColor="border" shadow="xs">
                <Card.Header gap="1" px={{base: "4", md: "6"}} pt={{base: "4", md: "6"}}>
                    <Card.Title fontSize="md">{title}</Card.Title>
                    <Card.Description>{description}</Card.Description>
                </Card.Header>
                <Card.Body pt="3" px={{base: "4", md: "6"}} pb={{base: "4", md: "6"}}>
                    {form}
                </Card.Body>
            </Card.Root>
        );
    }

    return (
        <Drawer.Root open={open} placement="bottom" size="full" onOpenChange={event => onOpenChange(event.open)}>
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content h="auto" maxH="94dvh" roundedTop="2xl">
                        <Drawer.Header>
                            <Stack gap="0.5" flex="1" minW="0">
                                <Drawer.Title>{title}</Drawer.Title>
                                <Drawer.Description>{description}</Drawer.Description>
                            </Stack>
                            <Drawer.CloseTrigger asChild>
                                <CloseButton aria-label={intl.formatMessage(messages.common.close)} />
                            </Drawer.CloseTrigger>
                        </Drawer.Header>
                        {/* Sheet 底部留白交由 form 內的 sticky footer 自行處理，令白色底伸延到最底，避免內容由罅隙透出。 */}
                        <Drawer.Body pb="0">{form}</Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
};
