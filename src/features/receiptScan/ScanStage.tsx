import {Box, Button, Flex, Image, Spinner, Stack, Text} from "@chakra-ui/react";
import {ImageOffIcon, ImagePlusIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {messages} from "@/lib/i18n";

export type ScanPhase = "uploading" | "parsing" | null;

type ScanStageProps = {
    phase: ScanPhase;
    imageSrc: string;
    imageFailed: boolean;
    onChangeImage: () => void;
    onCancel: () => void;
    onImageError: () => void;
};

/**
 * 單據相片預覽：解析期間蓋上可取消的掃描遮罩，其餘時間提供換相片入口。
 * 未有圖時不會出現，因為 scan 一 click 就已經彈出相機／上載。
 */
export const ScanStage = ({phase, imageSrc, imageFailed, onChangeImage, onCancel, onImageError}: ScanStageProps) => {
    const intl = useIntl();

    return (
        <Box position="relative" rounded="2xl" overflow="hidden" borderWidth="1px" borderColor="border" bg="bg.subtle">
            {imageFailed ? (
                <Flex direction="column" align="center" justify="center" gap="2" minH={{base: "12rem", md: "16rem"}} px="6" color="fg.muted" textAlign="center">
                    <ImageOffIcon aria-hidden="true" />
                    <Text fontSize="sm">{intl.formatMessage(messages.scan.imageFailed)}</Text>
                </Flex>
            ) : (
                <Image
                    src={imageSrc}
                    alt={intl.formatMessage(messages.scan.imageAlt)}
                    display="block"
                    w="full"
                    minH={{base: "10rem", md: "14rem"}}
                    maxH={{base: "38dvh", md: "20rem"}}
                    objectFit="contain"
                    bg="bg.subtle"
                    onError={onImageError}
                />
            )}

            {phase === null ? (
                <Button type="button" size="sm" variant="surface" position="absolute" top="3" right="3" shadow="sm" onClick={onChangeImage}>
                    <ImagePlusIcon aria-hidden="true" />
                    <Box as="span" display={{base: "none", sm: "inline"}}>
                        {intl.formatMessage(messages.scan.changeImage)}
                    </Box>
                </Button>
            ) : (
                <Flex position="absolute" inset="0" direction="column" align="center" justify="center" px="6" bg="blackAlpha.700" color="white" textAlign="center">
                    <Box position="absolute" inset="0" overflow="hidden" pointerEvents="none" aria-hidden="true">
                        <Box position="absolute" insetX="4" h="2px" rounded="full" bg="brand.300" boxShadow="0 0 18px 2px rgba(52, 211, 153, 0.8)" animation="scan-sweep 2.4s ease-in-out infinite" />
                    </Box>
                    <Stack position="relative" align="center" gap="4">
                        <Spinner size="xl" color="white" />
                        <Stack gap="1">
                            <Text fontWeight="semibold">{intl.formatMessage(phase === "uploading" ? messages.scan.uploading : messages.scan.parsing)}</Text>
                            {phase === "uploading" ? null : (
                                <Text fontSize="xs" color="whiteAlpha.800">
                                    {intl.formatMessage(messages.scan.parsingHint)}
                                </Text>
                            )}
                        </Stack>
                        <Button type="button" size="sm" variant="surface" colorPalette="gray" onClick={onCancel}>
                            {intl.formatMessage(messages.scan.cancelParse)}
                        </Button>
                    </Stack>
                </Flex>
            )}
        </Box>
    );
};
