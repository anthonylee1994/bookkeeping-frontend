import React from "react";

/** 長時間開啟的 SPA 不會 reload，因此定時主動檢查新版本。 */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const SW_URL = "/sw.js";

export type AppUpdateState = {
    /** Service worker 有新版本等待生效。 */
    needRefresh: boolean;
    /** App shell 已 cache，可以離線使用。 */
    offlineReady: boolean;
    applyUpdate: () => void;
    dismissUpdate: () => void;
    dismissOfflineReady: () => void;
};

/**
 * 自行註冊 service worker（不使用 `virtual:pwa-register`，以免引入 workbox-window 依賴）。
 * `registerType: "prompt"` 之下新版本不會自動 reload，一律由 UI 提示、用戶自行按下
 * 「重新載入」，因此不會打斷正在填寫的 form。開發／測試環境（非 PROD）完全 no-op。
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
                    // 有 controller = 更新；沒有 = 首次安裝，僅提示可離線使用。
                    if (navigator.serviceWorker.controller !== null) setNeedRefresh(true);
                    else setOfflineReady(true);
                });
            };
            registration.addEventListener("updatefound", onUpdateFound);
            removeUpdateFound = () => registration.removeEventListener("updatefound", onUpdateFound);
        };

        const onControllerChange = (): void => {
            // 只有用戶按下「重新載入」觸發 skipWaiting 時才 reload，避免無故清除頁面狀態。
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
                // 註冊失敗不影響 app 本身運作。
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
