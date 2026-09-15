import React from "react";
import {Box, CloseButton, Dialog, Flex, Image, Portal, Text} from "@chakra-ui/react";
import {ImageOffIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {messages} from "@/lib/i18n";

type TransactionReceiptImagesProps = {
    urls: string[];
};

const FallbackTile = ({label, boxSize}: {label: string; boxSize: string}) => {
    return (
        <Flex direction="column" align="center" justify="center" gap="1" boxSize={boxSize} rounded="lg" borderWidth="1px" borderColor="border" bg="bg.muted" color="fg.muted" px="2">
            <ImageOffIcon aria-hidden="true" />
            <Text fontSize="xs" textAlign="center">
                {label}
            </Text>
        </Flex>
    );
};

/** 單據圖：可放大查看；載入失敗轉 fallback，唔會重複重試。 */
export const TransactionReceiptImages = ({urls}: TransactionReceiptImagesProps) => {
    const intl = useIntl();
    const [failedUrls, setFailedUrls] = React.useState<string[]>([]);
    const [activeUrl, setActiveUrl] = React.useState<string | null>(null);
    const failedLabel = intl.formatMessage(messages.transactions.detail.imageFailed);

    if (urls.length === 0) return null;

    const markFailed = (url: string) => setFailedUrls(current => (current.includes(url) ? current : [...current, url]));
    const activeIndex = activeUrl === null ? -1 : urls.indexOf(activeUrl);

    return (
        <Box>
            <Text fontSize="sm" color="fg.muted" mb="2">
                {intl.formatMessage(messages.transactions.detail.images)}
            </Text>
            <Flex gap="2" wrap="wrap">
                {urls.map((url, index) =>
                    failedUrls.includes(url) ? (
                        <FallbackTile key={url} label={failedLabel} boxSize="20" />
                    ) : (
                        <Box key={url} asChild rounded="lg" overflow="hidden" borderWidth="1px" borderColor="border">
                            <button type="button" aria-label={intl.formatMessage(messages.transactions.detail.imageOpen, {index: index + 1})} onClick={() => setActiveUrl(url)}>
                                <Image src={url} alt={intl.formatMessage(messages.transactions.detail.imageAlt, {index: index + 1})} boxSize="20" objectFit="cover" onError={() => markFailed(url)} />
                            </button>
                        </Box>
                    )
                )}
            </Flex>

            <Dialog.Root open={activeUrl !== null} size="lg" onOpenChange={event => (!event.open ? setActiveUrl(null) : undefined)}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>{intl.formatMessage(messages.transactions.detail.images)}</Dialog.Title>
                                <Dialog.CloseTrigger asChild>
                                    <CloseButton aria-label={intl.formatMessage(messages.common.close)} />
                                </Dialog.CloseTrigger>
                            </Dialog.Header>
                            <Dialog.Body pb="6">
                                {activeUrl === null ? null : failedUrls.includes(activeUrl) ? (
                                    <FallbackTile label={failedLabel} boxSize="40" />
                                ) : (
                                    <Image
                                        src={activeUrl}
                                        alt={intl.formatMessage(messages.transactions.detail.imageAlt, {index: activeIndex + 1})}
                                        maxH="70dvh"
                                        mx="auto"
                                        objectFit="contain"
                                        onError={() => markFailed(activeUrl)}
                                    />
                                )}
                            </Dialog.Body>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </Box>
    );
};
