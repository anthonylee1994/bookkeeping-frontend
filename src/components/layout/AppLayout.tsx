import React from "react";
import {Outlet} from "react-router";
import {AddTransactionFab} from "@/components/layout/AddTransactionFab";
import {AppHeader} from "@/components/layout/AppHeader";
import {BottomNav} from "@/components/layout/BottomNav";
import {OfflineBanner} from "@/components/layout/OfflineBanner";
import {SidebarNav} from "@/components/layout/SidebarNav";
import {DESKTOP_QUERY, useMediaQuery} from "@/hooks/useMediaQuery";
import {RouteErrorBoundary} from "@/routes/RouteErrorBoundary";
import {cn} from "@/lib/utils";

/** App shell：mobile header + bottom nav；tablet／desktop 左側 sidebar。 */
export const AppLayout = () => {
    const isDesktop = useMediaQuery(DESKTOP_QUERY);
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(!isDesktop);

    React.useEffect(() => {
        setSidebarCollapsed(!isDesktop);
    }, [isDesktop]);

    const toggleSidebar = () => {
        setSidebarCollapsed(collapsed => !collapsed);
    };

    return (
        <div className="bg-background min-h-dvh">
            <SidebarNav collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
            <div className={cn("flex min-h-dvh flex-col", sidebarCollapsed ? "md:pl-16" : "md:pl-60")}>
                <AppHeader sidebarCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />
                <OfflineBanner />
                <main id="main" className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-4 pb-24 md:pb-8">
                    <RouteErrorBoundary>
                        <Outlet />
                    </RouteErrorBoundary>
                </main>
                <BottomNav />
                <AddTransactionFab />
            </div>
        </div>
    );
};
