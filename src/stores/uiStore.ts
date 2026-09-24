import {create} from "zustand";
import type {AiPreview} from "../data/types";

export type InstallPromptStatus = "unavailable" | "available" | "dismissed" | "installed";

const EMPTY_UI_STATE = {
    isMobileNavOpen: false,
    activeDialog: null as string | null,
    isOffline: false,
    installPrompt: "unavailable" as InstallPromptStatus,
    /** AI 打字記帳拆單嘅待覆核 preview；喺列表 layout 層開 drawer，唔 persist。 */
    pendingAiBatch: null as AiPreview | null,
};

/** 純 UI state，不 persist；reload 後由預設值重新開始。 */
export type UiState = typeof EMPTY_UI_STATE & {
    setMobileNavOpen: (open: boolean) => void;
    setActiveDialog: (dialog: string | null) => void;
    setOffline: (offline: boolean) => void;
    setInstallPrompt: (status: InstallPromptStatus) => void;
    openAiBatch: (preview: AiPreview) => void;
    closeAiBatch: () => void;
    resetUiState: () => void;
};

export const useUiStore = create<UiState>()(set => ({
    ...EMPTY_UI_STATE,
    setMobileNavOpen: isMobileNavOpen => set({isMobileNavOpen}),
    setActiveDialog: activeDialog => set({activeDialog}),
    setOffline: isOffline => set({isOffline}),
    setInstallPrompt: installPrompt => set({installPrompt}),
    openAiBatch: pendingAiBatch => set({pendingAiBatch}),
    closeAiBatch: () => set({pendingAiBatch: null}),
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
