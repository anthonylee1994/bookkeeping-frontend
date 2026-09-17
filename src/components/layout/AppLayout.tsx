import React from "react";
import {Box, Container, Flex} from "@chakra-ui/react";
import {Outlet, useLocation} from "react-router";
import {AppHeader} from "@/components/layout/AppHeader";
import {MobileTabBar} from "@/components/layout/MobileTabBar";
import {OfflineBanner} from "@/components/layout/OfflineBanner";
import {SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH, SidebarNav} from "@/components/layout/SidebarNav";
import {ScanProvider} from "@/features/receiptScan/ScanProvider";
import {DESKTOP_QUERY, useMediaQuery} from "@/hooks/useMediaQuery";
import {RouteErrorBoundary} from "@/routes/RouteErrorBoundary";

/**
 * App shell 採用 mobile-app 模式：mobile 是 app bar + 底部 floating tab bar，
 * tablet／desktop 換成左側 sidebar rail，內容永遠置中於 container 之內。
 */
export const AppLayout = () => {
    const isDesktop = useMediaQuery(DESKTOP_QUERY);
    const location = useLocation();
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(!isDesktop);
    const [prevIsDesktop, setPrevIsDesktop] = React.useState(isDesktop);

    if (prevIsDesktop !== isDesktop) {
        setPrevIsDesktop(isDesktop);
        setSidebarCollapsed(!isDesktop);
    }

    const toggleSidebar = () => {
        setSidebarCollapsed(collapsed => !collapsed);
    };

    return (
        <ScanProvider>
            <Box bg="bg" minH="100dvh">
                <SidebarNav collapsed={sidebarCollapsed} />
                <Flex direction="column" minH="100dvh" transition="padding 200ms ease" pl={{base: 0, md: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH}}>
                    <AppHeader sidebarCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />
                    <OfflineBanner />
                    <Container
                        as="main"
                        id="main"
                        key={location.pathname}
                        maxW="7xl"
                        flex="1"
                        px={{base: 4, md: 6}}
                        pt={{base: 4, md: 6}}
                        pb={{base: 28, md: 10}}
                        animation="page-enter 220ms cubic-bezier(0.32, 0.72, 0, 1) both"
                    >
                        <RouteErrorBoundary>
                            <Outlet />
                        </RouteErrorBoundary>
                    </Container>
                    <MobileTabBar />
                </Flex>
            </Box>
        </ScanProvider>
    );
};
