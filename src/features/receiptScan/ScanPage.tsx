import React from "react";
import {Alert, Box, Button, Card, Field, Flex, HStack, Image, Input, Stack, Text} from "@chakra-ui/react";
import {ImageOffIcon, PencilIcon, RotateCcwIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {useNavigate} from "react-router";
import {LoadingIndicator} from "@/components/layout/LoadingIndicator";
import {PageHeader} from "@/components/layout/PageHeader";
import {RECEIPT_ACCEPT, ReceiptsRepository, validateReceiptFile} from "@/data/receiptsRepository";
import type {AiScanStep} from "@/data/types";
import {ScanReviewForm} from "@/features/receiptScan/ScanReviewForm";
import {useDomainReference} from "@/hooks/useDomainReference";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";
import {useAuthStore} from "@/stores/authStore";
import {useDraftStore} from "@/stores/draftStore";

type Banner = {status: "error" | "info"; message: string};
type RunPhase = "uploading" | "parsing" | null;

/** 流程：選圖／拍攝 → 上載 → 解析 → 覆核 → 入帳。 */
export const ScanPage = () => {
    const intl = useIntl();
    const navigate = useNavigate();
    const token = useAuthStore(state => state.token);
    const reference = useDomainReference();
    const draft = useDraftStore(state => state.aiScan);
    const setAiScan = useDraftStore(state => state.setAiScan);
    const [file, setFile] = React.useState<File | null>(null);
    const [objectUrl, setObjectUrl] = React.useState<string | null>(null);
    const [imageFailed, setImageFailed] = React.useState(false);
    const [banner, setBanner] = React.useState<Banner | null>(null);
    const [phase, setPhase] = React.useState<RunPhase>(null);
    // 取消／重新開始會遞增；舊 run 回來時發現 generation 唔同就唔再寫 state。
    const runRef = React.useRef(0);

    React.useEffect(() => {
        return () => {
            if (objectUrl !== null) URL.revokeObjectURL(objectUrl);
        };
    }, [objectUrl]);

    const imageSrc = objectUrl ?? draft?.imageUrl ?? null;
    const uploadedUrl = draft?.imageUrl ?? null;
    const preview = draft?.preview ?? null;

    /** Reload 之後 object URL 已失效（draftStore 會清走），冇圖就當重新開始。 */
    const step: AiScanStep = (() => {
        if (phase !== null) return "parsing";
        if (draft === null || imageSrc === null) return "idle";
        if (draft.step === "review" && preview !== null) return "review";
        if (draft.step === "failed") return "failed";
        return "selected";
    })();

    const run = async (source: File | null, alreadyUploaded: string | null) => {
        if (token === null) return;
        const generation = runRef.current + 1;
        runRef.current = generation;
        setBanner(null);
        const repository = new ReceiptsRepository(token);

        let imageUrl = alreadyUploaded;
        if (imageUrl === null) {
            if (source === null) return;
            setPhase("uploading");
            const uploaded = await repository.upload(source);
            if (runRef.current !== generation) return;
            if (!uploaded.ok) {
                setPhase(null);
                setBanner({status: "error", message: uploaded.error.message});
                setAiScan({step: "failed", imageUrl: null, preview: null});
                return;
            }
            imageUrl = uploaded.value.url;
        }

        setPhase("parsing");
        setAiScan({step: "parsing", imageUrl, preview: null});
        const parsed = await repository.parse(imageUrl);
        if (runRef.current !== generation) return;
        setPhase(null);

        if (!parsed.ok) {
            setBanner({status: "error", message: parsed.error.message});
            setAiScan({step: "failed", imageUrl, preview: null});
            return;
        }
        if (parsed.value.status === "failed") {
            setBanner({status: "error", message: parsed.value.error ?? intl.formatMessage(messages.scan.failedDescription)});
            setAiScan({step: "failed", imageUrl, preview: parsed.value});
            return;
        }
        setAiScan({step: "review", imageUrl, preview: parsed.value});
    };

    const pickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.files?.[0] ?? null;
        event.target.value = "";
        if (selected === null) return;

        const invalid = validateReceiptFile(selected);
        if (invalid !== null) {
            setBanner({status: "error", message: invalid.message});
            return;
        }

        runRef.current += 1;
        if (objectUrl !== null) URL.revokeObjectURL(objectUrl);
        setObjectUrl(URL.createObjectURL(selected));
        setImageFailed(false);
        setFile(selected);
        setAiScan({step: "selected", imageUrl: null, preview: null});
        await run(selected, null);
    };

    const cancelRun = () => {
        runRef.current += 1;
        setPhase(null);
        setBanner({status: "info", message: intl.formatMessage(messages.scan.cancelled)});
        setAiScan({step: "selected", imageUrl: uploadedUrl, preview: null});
    };

    const startOver = () => {
        runRef.current += 1;
        if (objectUrl !== null) URL.revokeObjectURL(objectUrl);
        setObjectUrl(null);
        setFile(null);
        setImageFailed(false);
        setPhase(null);
        setBanner(null);
        setAiScan(null);
    };

    const body = (() => {
        if (reference.isLoading) return <LoadingIndicator minH="24rem" />;
        if (step === "parsing") {
            return (
                <Stack gap="3" align="center">
                    <LoadingIndicator minH="10rem" />
                    <Text fontSize="sm" color="fg.muted">
                        {intl.formatMessage(phase === "uploading" ? messages.scan.uploading : messages.scan.parsing)}
                    </Text>
                    <Button type="button" variant="outline" onClick={cancelRun}>
                        {intl.formatMessage(messages.scan.cancelParse)}
                    </Button>
                </Stack>
            );
        }
        if (step === "failed") {
            return (
                <Stack gap="3">
                    <Alert.Root status="error" role="alert" rounded="lg">
                        <Alert.Indicator />
                        <Alert.Content>
                            <Alert.Title>{intl.formatMessage(messages.scan.failedTitle)}</Alert.Title>
                            <Alert.Description>{intl.formatMessage(messages.scan.failedDescription)}</Alert.Description>
                        </Alert.Content>
                    </Alert.Root>
                    <HStack gap="3" wrap="wrap">
                        <Button type="button" onClick={() => void run(file, uploadedUrl)}>
                            <RotateCcwIcon />
                            {intl.formatMessage(messages.scan.retry)}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => navigate(ROUTES.transactionNew)}>
                            <PencilIcon />
                            {intl.formatMessage(messages.scan.manualEntry)}
                        </Button>
                    </HStack>
                </Stack>
            );
        }
        if (step === "review" && preview !== null) {
            return (
                <ScanReviewForm
                    preview={preview}
                    reference={{accounts: reference.accounts, categories: reference.categories, merchants: reference.merchants}}
                    onConfirmed={startOver}
                    onStartOver={startOver}
                />
            );
        }
        if (step === "selected") {
            return (
                <HStack gap="3" wrap="wrap">
                    <Button type="button" onClick={() => void run(file, uploadedUrl)}>
                        <RotateCcwIcon />
                        {intl.formatMessage(messages.scan.retry)}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate(ROUTES.transactionNew)}>
                        <PencilIcon />
                        {intl.formatMessage(messages.scan.manualEntry)}
                    </Button>
                </HStack>
            );
        }
        return null;
    })();

    return (
        <Stack gap="5">
            <PageHeader title={intl.formatMessage(messages.scan.title)} description={intl.formatMessage(messages.scan.description)} />

            {reference.accounts.length === 0 && !reference.isLoading ? (
                <Alert.Root status="warning" rounded="lg">
                    <Alert.Indicator />
                    <Alert.Title>{intl.formatMessage(messages.scan.noAccounts)}</Alert.Title>
                </Alert.Root>
            ) : null}

            <Card.Root>
                <Card.Body>
                    <Stack gap="4">
                        <Field.Root>
                            <Field.Label>{intl.formatMessage(messages.scan.pickTitle)}</Field.Label>
                            <Input type="file" accept={RECEIPT_ACCEPT} capture="environment" p="1.5" height="auto" onChange={pickFile} />
                            <Field.HelperText>{intl.formatMessage(messages.scan.pickHint)}</Field.HelperText>
                        </Field.Root>

                        {imageSrc === null ? null : (
                            <Box>
                                {imageFailed ? (
                                    <Flex direction="column" align="center" justify="center" gap="1" h="12rem" rounded="lg" borderWidth="1px" borderColor="border" bg="bg.muted" color="fg.muted">
                                        <ImageOffIcon aria-hidden="true" />
                                        <Text fontSize="xs">{intl.formatMessage(messages.scan.imageFailed)}</Text>
                                    </Flex>
                                ) : (
                                    <Image
                                        src={imageSrc}
                                        alt={intl.formatMessage(messages.scan.imageAlt)}
                                        maxH="16rem"
                                        rounded="lg"
                                        borderWidth="1px"
                                        objectFit="contain"
                                        onError={() => setImageFailed(true)}
                                    />
                                )}
                                <Button type="button" mt="3" size="sm" variant="outline" onClick={startOver}>
                                    {intl.formatMessage(messages.scan.changeImage)}
                                </Button>
                            </Box>
                        )}
                    </Stack>
                </Card.Body>
            </Card.Root>

            {banner === null ? null : (
                <Alert.Root status={banner.status} role={banner.status === "error" ? "alert" : undefined} rounded="lg">
                    <Alert.Indicator />
                    <Alert.Title>{banner.message}</Alert.Title>
                </Alert.Root>
            )}

            {reference.error === null ? null : (
                <Alert.Root status="error" role="alert" rounded="lg">
                    <Alert.Indicator />
                    <Alert.Title>{reference.error.message}</Alert.Title>
                </Alert.Root>
            )}

            {step === "review" && preview !== null ? (
                <Card.Root>
                    <Card.Header>
                        <Card.Title>{intl.formatMessage(messages.scan.reviewTitle)}</Card.Title>
                        <Card.Description>{intl.formatMessage(messages.scan.reviewDescription)}</Card.Description>
                    </Card.Header>
                    <Card.Body>{body}</Card.Body>
                </Card.Root>
            ) : (
                body
            )}
        </Stack>
    );
};
