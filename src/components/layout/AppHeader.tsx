import {Box, Center, Flex, Heading, Icon, IconButton} from "@chakra-ui/react";
import {ArrowLeftIcon, LogOutIcon, PanelLeftIcon, RepeatIcon, ScanLineIcon, WalletIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link, useNavigate} from "react-router";
import {useRouteMeta} from "@/components/layout/useRouteMeta";
import {useLogout} from "@/hooks/useLogout";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";

type AppHeaderProps = {
    sidebarCollapsed: boolean;
    onToggleSidebar: () => void;
};

/**
 * Mobile 作為 native app bar（返回按鈕／置中標題／右側動作），
 * desktop 作為 sidebar 上方的工具列。兩者共用同一個 sticky blur 樣式。
 */
export const AppHeader = ({sidebarCollapsed, onToggleSidebar}: AppHeaderProps) => {
    const intl = useIntl();
    const navigate = useNavigate();
    const logout = useLogout();
    const {title, isRoot} = useRouteMeta();

    const goBack = () => {
        if (window.history.length > 1) {
            void navigate(-1);
            return;
        }
        void navigate(ROUTES.dashboard);
    };

    const sidebarLabel = intl.formatMessage(sidebarCollapsed ? messages.layout.expandSidebar : messages.layout.collapseSidebar);
    const scanLabel = intl.formatMessage(messages.nav.scan);
    const recurringLabel = intl.formatMessage(messages.nav.recurringRules);
    const signOutLabel = intl.formatMessage(messages.auth.signOut);

    return (
        <Box as="header" position="sticky" top="0" zIndex="30" bg="bg/80" backdropFilter="blur(16px)">
            <Flex h={{base: 14, md: 16}} maxW="7xl" mx="auto" px={{base: 2, md: 4}} align="center" gap="1" borderBottomWidth="1px" borderColor="border">
                <Flex flexShrink="0" w={{base: 14, md: "auto"}} justify="flex-start">
                    <IconButton aria-label={sidebarLabel} onClick={onToggleSidebar} variant="ghost" size="sm" display={{base: "none", md: "inline-flex"}}>
                        <PanelLeftIcon />
                    </IconButton>
                    {isRoot ? (
                        <Center asChild w="11" h="11" color="brand.fg" display={{base: "flex", md: "none"}}>
                            <Link to={ROUTES.dashboard} aria-label={intl.formatMessage(messages.app.name)}>
                                <Icon size="lg">
                                    <WalletIcon />
                                </Icon>
                            </Link>
                        </Center>
                    ) : (
                        <IconButton aria-label={intl.formatMessage(messages.layout.back)} onClick={goBack} variant="ghost" size="sm" display={{base: "inline-flex", md: "none"}}>
                            <ArrowLeftIcon />
                        </IconButton>
                    )}
                </Flex>

                {/* Mobile 用 app bar 作為標題；desktop 標題交還給頁面內的 PageHeader。 */}
                <Box flex="1" minW="0">
                    <Heading as="h2" size="md" textAlign="center" truncate display={{base: "block", md: "none"}}>
                        {intl.formatMessage(title)}
                    </Heading>
                </Box>

                <Flex gap="1" align="center" justify="flex-end" flexShrink="0">
                    {/* Mobile 冇 sidebar，定期交易喺底下 tab bar 又冇位，所以收喺 header。 */}
                    <IconButton asChild aria-label={recurringLabel} title={recurringLabel} variant="ghost" size="sm" display={{base: "inline-flex", md: "none"}}>
                        <Link to={ROUTES.recurringRules}>
                            <RepeatIcon />
                        </Link>
                    </IconButton>
                    <IconButton asChild aria-label={scanLabel} title={scanLabel} variant="ghost" size="sm">
                        <Link to={ROUTES.scan}>
                            <ScanLineIcon />
                        </Link>
                    </IconButton>
                    <IconButton aria-label={signOutLabel} title={signOutLabel} onClick={logout} variant="ghost" size="sm">
                        <LogOutIcon />
                    </IconButton>
                </Flex>
            </Flex>
        </Box>
    );
};
