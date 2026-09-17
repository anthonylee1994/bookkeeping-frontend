import React from "react";
import {Input} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {useNavigate} from "react-router";
import {RECEIPT_ACCEPT, ReceiptsRepository, validateReceiptFile} from "@/data/receiptsRepository";
import type {AiPreview} from "@/data/types";
import type {ScanBanner} from "@/features/receiptScan/ScanDrawer";
import {ScanDrawer} from "@/features/receiptScan/ScanDrawer";
import type {ScanPhase} from "@/features/receiptScan/ScanStage";
import {useDomainReference} from "@/hooks/useDomainReference";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";
import {useAuthStore} from "@/stores/authStore";

type ScanContextValue = {
    /** 直接打開相機／上載選單；成功選圖後自動上載、解析並彈出覆核 drawer。 */
    startScan: () => void;
};

const ScanContext = React.createContext<ScanContextValue>({startScan: () => undefined});

/** 任何位置都可以取得 scan 觸發器；未包 `ScanProvider` 時為 no-op。 */
export function useScan(): ScanContextValue {
    return React.useContext(ScanContext);
}

/**
 * 全 app 共用的單據掃描流程。將隱藏的 file input 及覆核 drawer 掛在 app shell，
 * 令 header／sidebar／dashboard／交易頁的 scan button 都只需一 click 就開始。
 */
export const ScanProvider = ({children}: {children: React.ReactNode}) => {
    const intl = useIntl();
    const navigate = useNavigate();
    const token = useAuthStore(state => state.token);
    const reference = useDomainReference();
    const inputRef = React.useRef<HTMLInputElement>(null);
    // 取消／重新開始會遞增；舊 run 回來時發現 generation 不同就不再寫 state。
    const runRef = React.useRef(0);
    const [open, setOpen] = React.useState(false);
    const [objectUrl, setObjectUrl] = React.useState<string | null>(null);
    const [file, setFile] = React.useState<File | null>(null);
    const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(null);
    const [imageFailed, setImageFailed] = React.useState(false);
    const [banner, setBanner] = React.useState<ScanBanner | null>(null);
    const [phase, setPhase] = React.useState<ScanPhase>(null);
    const [preview, setPreview] = React.useState<AiPreview | null>(null);

    React.useEffect(() => {
        return () => {
            if (objectUrl !== null) URL.revokeObjectURL(objectUrl);
        };
    }, [objectUrl]);

    const contextValue = React.useMemo<ScanContextValue>(() => ({startScan: () => inputRef.current?.click()}), []);

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
                return;
            }
            imageUrl = uploaded.value.url;
        }

        setUploadedUrl(imageUrl);
        setPhase("parsing");
        const parsed = await repository.parse(imageUrl);
        if (runRef.current !== generation) return;
        setPhase(null);

        if (!parsed.ok) {
            setBanner({status: "error", message: parsed.error.message});
            return;
        }
        if (parsed.value.status === "failed") {
            setBanner({status: "error", message: parsed.value.error ?? intl.formatMessage(messages.scan.failedDescription)});
            return;
        }
        setPreview(parsed.value);
    };

    const reset = () => {
        runRef.current += 1;
        setObjectUrl(null);
        setFile(null);
        setUploadedUrl(null);
        setImageFailed(false);
        setBanner(null);
        setPhase(null);
        setPreview(null);
        setOpen(false);
    };

    const beginScan = async (selected: File) => {
        runRef.current += 1;
        setObjectUrl(URL.createObjectURL(selected));
        setFile(selected);
        setUploadedUrl(null);
        setImageFailed(false);
        setPhase(null);
        setPreview(null);
        setBanner(null);
        setOpen(true);

        const invalid = validateReceiptFile(selected);
        if (invalid !== null) {
            setBanner({status: "error", message: invalid.message});
            return;
        }
        await run(selected, null);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.files?.[0] ?? null;
        event.target.value = "";
        if (selected === null) return;
        void beginScan(selected);
    };

    const cancelRun = () => {
        runRef.current += 1;
        setPhase(null);
        setBanner({status: "info", message: intl.formatMessage(messages.scan.cancelled)});
    };

    /** 重新開始／換一張相片：清空當前 session 並立即再開相機／上載。 */
    const restart = () => {
        reset();
        inputRef.current?.click();
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) reset();
    };

    const manualEntry = () => {
        reset();
        navigate(ROUTES.transactionNew);
    };

    const canRetry = file !== null && validateReceiptFile(file) === null;

    return (
        <ScanContext.Provider value={contextValue}>
            <Input
                ref={inputRef}
                type="file"
                accept={RECEIPT_ACCEPT}
                aria-label={intl.formatMessage(messages.scan.pickTitle)}
                position="absolute"
                boxSize="1px"
                opacity={0}
                overflow="hidden"
                tabIndex={-1}
                onChange={handleInputChange}
            />
            {children}
            <ScanDrawer
                open={open}
                onOpenChange={handleOpenChange}
                phase={phase}
                imageSrc={objectUrl}
                imageFailed={imageFailed}
                banner={banner}
                preview={preview}
                canRetry={canRetry}
                reference={{accounts: reference.accounts, categories: reference.categories, merchants: reference.merchants}}
                onImageError={() => setImageFailed(true)}
                onChangeImage={restart}
                onCancel={cancelRun}
                onRetry={() => void run(file, uploadedUrl)}
                onManualEntry={manualEntry}
                onConfirmed={reset}
                onStartOver={restart}
            />
        </ScanContext.Provider>
    );
};
