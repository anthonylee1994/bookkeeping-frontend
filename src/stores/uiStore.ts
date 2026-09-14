import {create} from "zustand";
import {createId} from "../lib/id";

export type ToastKind = "success" | "error" | "info";

export type Toast = {
    id: string;
    kind: ToastKind;
    message: string;
};

export type InstallPromptStatus = "unavailable" | "available" | "dismissed" | "installed";

const EMPTY_UI_STATE = {
    isMobileNavOpen: false,
    activeDialog: null as string | null,
    isOffline: false,
    toasts: [] as Toast[],
    installPrompt: "unavailable" as InstallPromptStatus,
};

/** 純 UI state，唔 persist；reload 後由預設值重來。 */
export type UiState = typeof EMPTY_UI_STATE & {
    setMobileNavOpen: (open: boolean) => void;
    setActiveDialog: (dialog: string | null) => void;
    setOffline: (offline: boolean) => void;
    pushToast: (toast: Omit<Toast, "id">) => string;
    dismissToast: (id: string) => void;
    setInstallPrompt: (status: InstallPromptStatus) => void;
    resetUiState: () => void;
};

export const useUiStore = create<UiState>()(set => ({
    ...EMPTY_UI_STATE,
    setMobileNavOpen: isMobileNavOpen => set({isMobileNavOpen}),
    setActiveDialog: activeDialog => set({activeDialog}),
    setOffline: isOffline => set({isOffline}),
    pushToast: toast => {
        const id = createId();
        set(state => ({toasts: [...state.toasts, {id, ...toast}]}));
        return id;
    },
    dismissToast: id => set(state => ({toasts: state.toasts.filter(item => item.id !== id)})),
    setInstallPrompt: installPrompt => set({installPrompt}),
    resetUiState: () => set({...EMPTY_UI_STATE}),
}));

/** 以 `navigator.onLine` 同步 isOffline，並監聽 online／offline 事件；回傳 unsubscribe。 */
export function subscribeToNetworkStatus(): () => void {
    const update = (): void => useUiStore.getState().setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
        window.removeEventListener("online", update);
        window.removeEventListener("offline", update);
    };
}
