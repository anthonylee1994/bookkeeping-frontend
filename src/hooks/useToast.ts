import {useUiStore} from "../stores/uiStore";
import type {Toast, ToastKind} from "../stores/uiStore";

export type ToastApi = {
    toasts: Toast[];
    pushToast: (toast: {kind: ToastKind; message: string}) => string;
    dismissToast: (id: string) => void;
};

/** 讀寫 uiStore toast queue 的共用入口，讓 component 不必直接接觸 store。 */
export function useToast(): ToastApi {
    const toasts = useUiStore(state => state.toasts);
    const pushToast = useUiStore(state => state.pushToast);
    const dismissToast = useUiStore(state => state.dismissToast);

    return {toasts, pushToast, dismissToast};
}
