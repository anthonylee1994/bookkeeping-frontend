import {useUiStore} from "../stores/uiStore";
import type {Toast, ToastKind} from "../stores/uiStore";

export type ToastApi = {
    toasts: Toast[];
    pushToast: (toast: {kind: ToastKind; message: string}) => string;
    dismissToast: (id: string) => void;
};

/** 讀寫 uiStore toast queue 嘅共用入口，令 component 唔使直接摸 store。 */
export function useToast(): ToastApi {
    const toasts = useUiStore(state => state.toasts);
    const pushToast = useUiStore(state => state.pushToast);
    const dismissToast = useUiStore(state => state.dismissToast);

    return {toasts, pushToast, dismissToast};
}
