import {XIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {IconButton} from "@/components/ui/IconButton";
import {messages} from "@/lib/i18n";
import {cn} from "@/lib/utils";
import type {ToastKind} from "@/stores/uiStore";

const TONE_CLASS: Record<ToastKind, string> = {
    success: "border-income/40",
    error: "border-expense/50",
    info: "border-border",
};

type ToastProps = {
    kind: ToastKind;
    message: string;
    onDismiss: () => void;
};

/** 單個 toast item；error 用 `role="alert"`，其餘 `role="status"`。 */
export const Toast = ({kind, message, onDismiss}: ToastProps) => {
    const intl = useIntl();
    return (
        <div role={kind === "error" ? "alert" : "status"} className={cn("bg-card pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-md border px-3 py-2 shadow-lg", TONE_CLASS[kind])}>
            <span className="text-card-foreground min-w-0 flex-1 text-sm">{message}</span>
            <IconButton label={intl.formatMessage(messages.common.close)} size="icon-xs" showTooltip={false} onClick={onDismiss}>
                <XIcon />
            </IconButton>
        </div>
    );
};
