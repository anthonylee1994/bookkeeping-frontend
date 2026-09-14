import React from "react";
import {subscribeToNetworkStatus, useUiStore} from "../stores/uiStore";

let activeSubscribers = 0;
let stopNetworkSubscription: (() => void) | null = null;

/** 讀 uiStore 嘅 isOffline；第一個訂閱者負責接駁 online／offline 事件，最後一個離開先拆。 */
export function useOffline(): boolean {
    const isOffline = useUiStore(state => state.isOffline);

    React.useEffect(() => {
        activeSubscribers += 1;
        if (activeSubscribers === 1) stopNetworkSubscription = subscribeToNetworkStatus();
        return () => {
            activeSubscribers -= 1;
            if (activeSubscribers === 0 && stopNetworkSubscription !== null) {
                stopNetworkSubscription();
                stopNetworkSubscription = null;
            }
        };
    }, []);

    return isOffline;
}
