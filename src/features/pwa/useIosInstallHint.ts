import React from "react";
import {isStandalone, readFlag, writeFlag} from "@/features/pwa/useInstallPrompt";

export const IOS_HINT_DISMISS_KEY = "bookkeeping.pwa.iosHintDismissed";

/** 進入 app 後稍等才提示，避免一開啟即彈出。 */
const IOS_HINT_DELAY_MS = 8000;

/** iPadOS 13+ 會報 MacIntel，要用 touch points 認。 */
function isIos(): boolean {
    if (typeof navigator === "undefined") return false;
    if (/iP(hone|ad|od)/.test(navigator.userAgent)) return true;
    return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/**
 * iOS Safari 不支援 `beforeinstallprompt`，因此改用文字指引教用戶由分享選單加入主畫面。
 * 只在 iOS 且未 standalone 時顯示，曾 dismiss 便不再出現。
 */
export function useIosInstallHint(): {visible: boolean; dismiss: () => void} {
    const [dismissed, setDismissed] = React.useState(() => readFlag(IOS_HINT_DISMISS_KEY));
    const [ready, setReady] = React.useState(false);

    React.useEffect(() => {
        if (dismissed || !isIos() || isStandalone()) return;
        const timer = setTimeout(() => setReady(true), IOS_HINT_DELAY_MS);
        return () => clearTimeout(timer);
    }, [dismissed]);

    const dismiss = () => {
        writeFlag(IOS_HINT_DISMISS_KEY);
        setDismissed(true);
    };

    return {visible: !dismissed && ready, dismiss};
}
