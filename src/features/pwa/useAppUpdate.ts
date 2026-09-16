import React from "react";

/** 長開嘅 SPA 唔會 reload，所以定時主動查新版本。 */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const SW_URL = "/sw.js";

export type AppUpdateState = {
    /** Service worker 有新版本等緊生效。 */
    needRefresh: boolean;
    /** App shell 已 cache，可以離線用。 */
    offlineReady: boolean;
    applyUpdate: () => void;
    dismissUpdate: () => void;
    dismissOfflineReady: () => void;
};

/**
 * 自己註冊 service worker（唔用 `virtual:pwa-register`，免得拉入 workbox-window 依賴）。
 * `registerType: "prompt"` 之下新版本唔會自動 reload，一律由 UI 提示、用戶自己撳
 * 「重新載入」，所以唔會打斷填緊嘅 form。開發／測試環境（非 PROD）完全 no-op。
 */
export function useAppUpdate(): AppUpdateState {
    const [needRefresh, setNeedRefresh] = React.useState(false);
    const [offlineReady, setOfflineReady] = React.useState(false);
    const registrationRef = React.useRef<ServiceWorkerRegistration | null>(null);
    const reloadingRef = React.useRef(false);

    React.useEffect(() => {
        if (!import.meta.env.PROD || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

        let disposed = false;
        let interval: ReturnType<typeof setInterval> | null = null;
        let removeUpdateFound: (() => void) | null = null;

        const track = (registration: ServiceWorkerRegistration): void => {
            registrationRef.current = registration;

            // 頁面載入時已經有 waiting 版本（之前裝落但未 activate）。
            if (registration.waiting !== null && navigator.serviceWorker.controller !== null) {
                setNeedRefresh(true);
            }

            const onUpdateFound = (): void => {
                const installing = registration.installing;
                if (installing === null) return;
                installing.addEventListener("statechange", () => {
                    if (installing.state !== "installed") return;
                    // 有 controller = 更新；冇 = 首次安裝，只係提示可離線用。
                    if (navigator.serviceWorker.controller !== null) setNeedRefresh(true);
                    else setOfflineReady(true);
                });
            };
            registration.addEventListener("updatefound", onUpdateFound);
            removeUpdateFound = () => registration.removeEventListener("updatefound", onUpdateFound);
        };

        const onControllerChange = (): void => {
            // 只有用戶撳「重新載入」觸發 skipWaiting 時才 reload，避免無故清走頁面狀態。
            if (reloadingRef.current) window.location.reload();
        };
        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

        navigator.serviceWorker
            .register(SW_URL, {scope: "/"})
            .then(registration => {
                if (disposed) return;
                track(registration);
                interval = setInterval(() => void registration.update(), UPDATE_CHECK_INTERVAL_MS);
            })
            .catch(() => {
                // 註冊失敗唔影響 app 本身運作。
            });

        return () => {
            disposed = true;
            navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
            removeUpdateFound?.();
            if (interval !== null) clearInterval(interval);
        };
    }, []);

    const applyUpdate = React.useCallback(() => {
        const waiting = registrationRef.current?.waiting ?? null;
        reloadingRef.current = true;
        if (waiting === null) {
            window.location.reload();
            return;
        }
        waiting.postMessage({type: "SKIP_WAITING"});
    }, []);

    const dismissUpdate = React.useCallback(() => setNeedRefresh(false), []);
    const dismissOfflineReady = React.useCallback(() => setOfflineReady(false), []);

    return {needRefresh, offlineReady, applyUpdate, dismissUpdate, dismissOfflineReady};
}
