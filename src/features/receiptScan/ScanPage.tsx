import React from "react";
import {Alert, Button, Grid, Stack} from "@chakra-ui/react";
import {ClipboardCheckIcon, PencilIcon, RotateCcwIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {useNavigate} from "react-router";
import {LoadingIndicator} from "@/components/layout/LoadingIndicator";
import {PageHeader} from "@/components/layout/PageHeader";
import {RECEIPT_ACCEPT, ReceiptsRepository, validateReceiptFile} from "@/data/receiptsRepository";
import type {AiScanStep} from "@/data/types";
import {ScanReviewPanel} from "@/features/receiptScan/ScanReviewPanel";
import {ScanStage} from "@/features/receiptScan/ScanStage";
import {useDomainReference} from "@/hooks/useDomainReference";
import {DESKTOP_QUERY, useMediaQuery} from "@/hooks/useMediaQuery";
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
    const isDesktop = useMediaQuery(DESKTOP_QUERY);
    const draft = useDraftStore(state => state.aiScan);
    const setAiScan = useDraftStore(state => state.setAiScan);
    const [file, setFile] = React.useState<File | null>(null);
    const [objectUrl, setObjectUrl] = React.useState<string | null>(null);
    const [imageFailed, setImageFailed] = React.useState(false);
    const [banner, setBanner] = React.useState<Banner | null>(null);
    const [phase, setPhase] = React.useState<RunPhase>(null);
    const [reviewOpen, setReviewOpen] = React.useState(false);
    // 取消／重新開始會遞增；舊 run 回來時發現 generation 不同就不再寫 state。
    const runRef = React.useRef(0);

    React.useEffect(() => {
        return () => {
            if (objectUrl !== null) URL.revokeObjectURL(objectUrl);
        };
    }, [objectUrl]);

    const imageSrc = objectUrl ?? draft?.imageUrl ?? null;
    const uploadedUrl = draft?.imageUrl ?? null;
    const preview = draft?.preview ?? null;

    /** Reload 之後 object URL 已失效（draftStore 會清走），沒有圖就當重新開始。 */
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
        setReviewOpen(true);
        setAiScan({step: "review", imageUrl, preview: parsed.value});
    };

    const startScan = async (selected: File | null) => {
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
        setReviewOpen(false);
        setAiScan({step: "selected", imageUrl: null, preview: null});
        await run(selected, null);
    };

    const cancelRun = () => {
        runRef.current += 1;
        setPhase(null);
        setReviewOpen(false);
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
        setReviewOpen(false);
        setAiScan(null);
    };

    const reviewPreview = step === "review" && !reference.isLoading ? preview : null;
    const showInlineReview = reviewPreview !== null && isDesktop;

    const retryActions = (
        <Stack direction={{base: "column", md: "row"}} gap="3">
            <Button type="button" w={{base: "full", md: "auto"}} onClick={() => void run(file, uploadedUrl)}>
                <RotateCcwIcon aria-hidden="true" />
                {intl.formatMessage(messages.scan.retry)}
            </Button>
            <Button type="button" variant="outline" w={{base: "full", md: "auto"}} onClick={() => navigate(ROUTES.transactionNew)}>
                <PencilIcon aria-hidden="true" />
                {intl.formatMessage(messages.scan.manualEntry)}
            </Button>
        </Stack>
    );

    const stageColumn = (
        <Stack gap="4" w="full" position={showInlineReview ? "sticky" : "static"} top={showInlineReview ? "20" : undefined}>
            <ScanStage
                phase={phase}
                imageSrc={imageSrc}
                imageFailed={imageFailed}
                accept={RECEIPT_ACCEPT}
                onFile={selected => void startScan(selected)}
                onImageError={() => setImageFailed(true)}
                onChangeImage={startOver}
                onCancel={cancelRun}
            />

            {reference.isLoading ? <LoadingIndicator minH="8rem" /> : null}

            {reference.isLoading ? null : (
                <React.Fragment>
                    {reference.accounts.length === 0 ? (
                        <Alert.Root status="warning" rounded="lg">
                            <Alert.Indicator />
                            <Alert.Title>{intl.formatMessage(messages.scan.noAccounts)}</Alert.Title>
                        </Alert.Root>
                    ) : null}

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

                    {step === "failed" ? (
                        <Stack gap="3">
                            <Alert.Root status="error" role="alert" rounded="lg">
                                <Alert.Indicator />
                                <Alert.Content>
                                    <Alert.Title>{intl.formatMessage(messages.scan.failedTitle)}</Alert.Title>
                                    <Alert.Description>{intl.formatMessage(messages.scan.failedDescription)}</Alert.Description>
                                </Alert.Content>
                            </Alert.Root>
                            {retryActions}
                        </Stack>
                    ) : null}

                    {step === "selected" ? retryActions : null}

                    {reviewPreview !== null && !isDesktop && !reviewOpen ? (
                        <Button type="button" size="lg" w="full" onClick={() => setReviewOpen(true)}>
                            <ClipboardCheckIcon aria-hidden="true" />
                            {intl.formatMessage(messages.scan.continueReview)}
                        </Button>
                    ) : null}
                </React.Fragment>
            )}
        </Stack>
    );

    return (
        <Stack gap={{base: "4", md: "6"}} w="full" maxW={showInlineReview ? "5xl" : "3xl"} mx="auto">
            <PageHeader title={intl.formatMessage(messages.scan.title)} description={intl.formatMessage(messages.scan.description)} />

            <Grid templateColumns={showInlineReview ? "minmax(0, 1fr) minmax(0, 1fr)" : "minmax(0, 1fr)"} gap={{base: "4", md: "6"}} alignItems="start">
                {stageColumn}
                {showInlineReview ? (
                    <ScanReviewPanel
                        variant="inline"
                        open
                        onOpenChange={() => undefined}
                        preview={reviewPreview}
                        reference={{accounts: reference.accounts, categories: reference.categories, merchants: reference.merchants}}
                        onConfirmed={startOver}
                        onStartOver={startOver}
                    />
                ) : null}
            </Grid>

            {reviewPreview !== null && !isDesktop ? (
                <ScanReviewPanel
                    variant="sheet"
                    open={reviewOpen}
                    onOpenChange={setReviewOpen}
                    preview={reviewPreview}
                    reference={{accounts: reference.accounts, categories: reference.categories, merchants: reference.merchants}}
                    onConfirmed={startOver}
                    onStartOver={startOver}
                />
            ) : null}
        </Stack>
    );
};
