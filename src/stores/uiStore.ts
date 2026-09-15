import {create} from "zustand";

export type InstallPromptStatus = "unavailable" | "available" | "dismissed" | "installed";

const EMPTY_UI_STATE = {
    isMobileNavOpen: false,
    activeDialog: null as string | null,
    isOffline: false,
    installPrompt: "unavailable" as InstallPromptStatus,
};

/** 純 UI state，不 persist；reload 後由預設值重新開始。 */
export type UiState = typeof EMPTY_UI_STATE & {
    setMobileNavOpen: (open: boolean) => void;
    setActiveDialog: (dialog: string | null) => void;
    setOffline: (offline: boolean) => void;
    setInstallPrompt: (status: InstallPromptStatus) => void;
    resetUiState: () => void;
};

export const useUiStore = create<UiState>()(set => ({
    ...EMPTY_UI_STATE,
    setMobileNavOpen: isMobileNavOpen => set({isMobileNavOpen}),
    setActiveDialog: activeDialog => set({activeDialog}),
    setOffline: isOffline => set({isOffline}),
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
