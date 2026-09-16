import React from "react";
import {Box, Button, Center, Flex, Image, Input, Spinner, Stack, Text} from "@chakra-ui/react";
import {CameraIcon, ImageOffIcon, ImagePlusIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {messages} from "@/lib/i18n";

export type ScanPhase = "uploading" | "parsing" | null;

type ScanStageProps = {
    phase: ScanPhase;
    imageSrc: string | null;
    imageFailed: boolean;
    accept: string;
    onFile: (file: File | null) => void;
    onImageError: () => void;
    onChangeImage: () => void;
    onCancel: () => void;
};

function dragHasFiles(event: React.DragEvent): boolean {
    return event.dataTransfer.types.includes("Files");
}

/**
 * AI 單據的 camera-first 主體：未有圖時是一大片拍攝／拖放區，
 * 有圖之後變成預覽，解析期間蓋上可取消的掃描遮罩。Mobile 先，desktop 只是放大。
 */
export const ScanStage = ({phase, imageSrc, imageFailed, accept, onFile, onImageError, onChangeImage, onCancel}: ScanStageProps) => {
    const intl = useIntl();
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = React.useState(false);

    const pickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.files?.[0] ?? null;
        event.target.value = "";
        onFile(selected);
    };

    const onDragEnter = (event: React.DragEvent) => {
        if (!dragHasFiles(event)) return;
        event.preventDefault();
        setDragging(true);
    };

    const onDragOver = (event: React.DragEvent) => {
        if (!dragHasFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setDragging(true);
    };

    const onDragLeave = (event: React.DragEvent) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setDragging(false);
    };

    const onDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setDragging(false);
        onFile(event.dataTransfer.files?.[0] ?? null);
    };

    if (imageSrc === null) {
        return (
            <Box position="relative">
                <Input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    capture="environment"
                    aria-label={intl.formatMessage(messages.scan.pickTitle)}
                    position="absolute"
                    boxSize="1px"
                    opacity={0}
                    overflow="hidden"
                    tabIndex={-1}
                    onChange={pickFile}
                />
                <Button
                    type="button"
                    variant="outline"
                    w="full"
                    h="auto"
                    minH={{base: "15rem", sm: "17rem", md: "20rem"}}
                    px="6"
                    py="10"
                    rounded="2xl"
                    borderWidth="2px"
                    borderStyle="dashed"
                    borderColor={dragging ? "brand.solid" : "border.emphasized"}
                    bg={dragging ? "brand.subtle" : "bg.panel"}
                    _hover={{bg: "brand.subtle", borderColor: "brand.solid"}}
                    onClick={() => inputRef.current?.click()}
                    onDragEnter={onDragEnter}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                >
                    <Stack align="center" gap="4">
                        <Center boxSize={{base: "16", md: "20"}} rounded="full" bg="brand.muted" color="brand.fg" transition="transform 150ms ease">
                            <CameraIcon size={32} aria-hidden="true" />
                        </Center>
                        <Stack gap="1" align="center">
                            <Text fontWeight="semibold" fontSize={{base: "lg", md: "xl"}}>
                                {intl.formatMessage(dragging ? messages.scan.dropHere : messages.scan.pickAction)}
                            </Text>
                            <Text fontSize="sm" color="fg.muted" maxW="xs">
                                {intl.formatMessage(messages.scan.pickHint)}
                            </Text>
                        </Stack>
                    </Stack>
                </Button>
            </Box>
        );
    }

    return (
        <Box position="relative" rounded="2xl" overflow="hidden" borderWidth="1px" borderColor="border" bg="bg.subtle">
            {imageFailed ? (
                <Flex direction="column" align="center" justify="center" gap="2" minH={{base: "15rem", md: "20rem"}} px="6" color="fg.muted" textAlign="center">
                    <ImageOffIcon aria-hidden="true" />
                    <Text fontSize="sm">{intl.formatMessage(messages.scan.imageFailed)}</Text>
                </Flex>
            ) : (
                <Image
                    src={imageSrc}
                    alt={intl.formatMessage(messages.scan.imageAlt)}
                    display="block"
                    w="full"
                    minH={{base: "12rem", md: "18rem"}}
                    maxH={{base: "58dvh", md: "26rem"}}
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
