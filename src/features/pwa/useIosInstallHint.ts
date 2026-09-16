import React from "react";
import {isStandalone, readFlag, writeFlag} from "@/features/pwa/useInstallPrompt";

export const IOS_HINT_DISMISS_KEY = "bookkeeping.pwa.iosHintDismissed";

/** 入 app 之後等一等先提，唔想一開就彈。 */
const IOS_HINT_DELAY_MS = 8000;

/** iPadOS 13+ 會報 MacIntel，要用 touch points 認。 */
function isIos(): boolean {
    if (typeof navigator === "undefined") return false;
    if (/iP(hone|ad|od)/.test(navigator.userAgent)) return true;
    return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/**
 * iOS Safari 唔支援 `beforeinstallprompt`，所以改用文字指引教用戶由分享選單加入主畫面。
 * 只喺 iOS 且未 standalone 時顯示，dismiss 過就唔再出。
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
