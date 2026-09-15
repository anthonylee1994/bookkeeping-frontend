import {Toast} from "@/components/ui/Toast";
import {useUiStore} from "@/stores/uiStore";

/** 讀 uiStore toast queue 並以 live region 公佈。 */
export const Toaster = () => {
    const toasts = useUiStore(state => state.toasts);
    const dismissToast = useUiStore(state => state.dismissToast);

    return (
        <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4">
            {toasts.map(toast => (
                <Toast key={toast.id} kind={toast.kind} message={toast.message} onDismiss={() => dismissToast(toast.id)} />
            ))}
        </div>
    );
};
