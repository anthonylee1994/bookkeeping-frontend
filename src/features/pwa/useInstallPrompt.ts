import React from "react";
import {useUiStore} from "@/stores/uiStore";

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{outcome: "accepted" | "dismissed"; platform: string}>;
};

export const INSTALL_DISMISS_KEY = "bookkeeping.pwa.installDismissed";

/** 待用戶有互動後再稍等才顯示，避免一進入 app 即騷擾用戶。 */
const ENGAGEMENT_DELAY_MS = 20_000;

function readFlag(key: string): boolean {
    if (typeof localStorage === "undefined") return false;
    try {
        return localStorage.getItem(key) === "1";
    } catch {
        return false;
    }
}

function writeFlag(key: string): void {
    try {
        localStorage.setItem(key, "1");
    } catch {
        // storage 不可用亦無妨，最多下次再詢問一次。
    }
}

export {readFlag, writeFlag};

/** 已是 standalone（已加到主畫面）則無需再提示安裝。 */
export function isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    const iosStandalone = (window.navigator as Navigator & {standalone?: boolean}).standalone === true;
    return iosStandalone || window.matchMedia?.("(display-mode: standalone)").matches === true;
}

export type InstallPromptState = {
    /** 可以顯示安裝提示（已收到 beforeinstallprompt、已過冷卻時間、未 dismiss）。 */
    canInstall: boolean;
    install: () => void;
    dismiss: () => void;
};

/**
 * `beforeinstallprompt` 只在 Chromium 系出現，且需用戶有互動才視為「engaged」，
 * 之後再等 `ENGAGEMENT_DELAY_MS` 才顯示一次；曾 dismiss 便永遠不再詢問（記錄於 localStorage）。
 */
export function useInstallPrompt(): InstallPromptState {
    const setInstallPrompt = useUiStore(state => state.setInstallPrompt);
    const [event, setEvent] = React.useState<BeforeInstallPromptEvent | null>(null);
    const [engaged, setEngaged] = React.useState(false);
    const [ready, setReady] = React.useState(false);

    React.useEffect(() => {
        if (typeof window === "undefined" || readFlag(INSTALL_DISMISS_KEY) || isStandalone()) return;

        const onBeforeInstall = (raw: Event): void => {
            raw.preventDefault();
            setEvent(raw as BeforeInstallPromptEvent);
        };
        const onInstalled = (): void => {
            setEvent(null);
            setInstallPrompt("installed");
        };

        window.addEventListener("beforeinstallprompt", onBeforeInstall);
        window.addEventListener("appinstalled", onInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstall);
            window.removeEventListener("appinstalled", onInstalled);
        };
    }, [setInstallPrompt]);

    React.useEffect(() => {
        if (event === null || engaged) return;
        const onInteract = (): void => setEngaged(true);
        window.addEventListener("pointerdown", onInteract, {once: true});
        window.addEventListener("keydown", onInteract, {once: true});
        return () => {
            window.removeEventListener("pointerdown", onInteract);
            window.removeEventListener("keydown", onInteract);
        };
    }, [event, engaged]);

    React.useEffect(() => {
        if (!engaged) return;
        const timer = setTimeout(() => setReady(true), ENGAGEMENT_DELAY_MS);
        return () => clearTimeout(timer);
    }, [engaged]);

    const canInstall = event !== null && ready;

    React.useEffect(() => {
        if (canInstall) setInstallPrompt("available");
    }, [canInstall, setInstallPrompt]);

    const dismiss = () => {
        setEvent(null);
        writeFlag(INSTALL_DISMISS_KEY);
        setInstallPrompt("dismissed");
    };

    const install = () => {
        const current = event;
        if (current === null) return;
        setEvent(null);
        void current
            .prompt()
            .then(() => current.userChoice)
            .then(choice => {
                if (choice.outcome === "accepted") {
                    setInstallPrompt("installed");
                    return;
                }
                writeFlag(INSTALL_DISMISS_KEY);
                setInstallPrompt("dismissed");
            });
    };

    return {canInstall, install, dismiss};
}
