import React from "react";
import {UNSAFE_DataRouterContext} from "react-router";

type DrawerOpenChangeDetails = {
    open: boolean;
};

/**
 * 路由控制嘅 drawer：只有仍然停喺呢條 URL 先當用戶關閉。
 * 跳去 sibling（詳情 → 修改）會 unmount drawer，Zag 可能再 fire `onOpenChange(false)`，
 * 唔可以跟住 `navigate` 返列表。
 */
export function shouldDismissRouteDrawer(renderedPathname: string, livePathname: string | undefined): boolean {
    return livePathname === undefined || livePathname === renderedPathname;
}

/**
 * Drawer `onOpenChange`：忽略 unmount／sibling navigation，以及 mount 後第一、兩幀嘅 click-through。
 */
export function useRouteDrawerDismiss(renderedPathname: string, dismiss: () => void): (event: DrawerOpenChangeDetails) => void {
    const dataRouter = React.useContext(UNSAFE_DataRouterContext);
    const readyRef = React.useRef(false);
    const dismissRef = React.useRef(dismiss);
    const pathRef = React.useRef(renderedPathname);
    dismissRef.current = dismiss;
    pathRef.current = renderedPathname;

    React.useEffect(() => {
        readyRef.current = false;
        let inner = 0;
        const outer = window.requestAnimationFrame(() => {
            inner = window.requestAnimationFrame(() => {
                readyRef.current = true;
            });
        });
        return () => {
            window.cancelAnimationFrame(outer);
            window.cancelAnimationFrame(inner);
        };
    }, [renderedPathname]);

    return (event: DrawerOpenChangeDetails) => {
        if (event.open) return;
        const pathWhenOpen = pathRef.current;
        queueMicrotask(() => {
            if (!readyRef.current) return;
            const livePathname = dataRouter?.router.state.location.pathname;
            if (!shouldDismissRouteDrawer(pathWhenOpen, livePathname)) return;
            dismissRef.current();
        });
    };
}
