import {LogOutIcon, MenuIcon, WalletIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {IconButton} from "@/components/ui/IconButton";
import {useLogout} from "@/hooks/useLogout";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";
import {useAuthStore} from "@/stores/authStore";

type AppHeaderProps = {
    sidebarCollapsed: boolean;
    onToggleSidebar: () => void;
};

export const AppHeader = ({sidebarCollapsed, onToggleSidebar}: AppHeaderProps) => {
    const intl = useIntl();
    const username = useAuthStore(state => state.user?.username);
    const logout = useLogout();

    return (
        <header className="border-border bg-background/95 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-4 backdrop-blur">
            <IconButton
                label={intl.formatMessage(sidebarCollapsed ? messages.layout.expandSidebar : messages.layout.collapseSidebar)}
                onClick={onToggleSidebar}
                showTooltip={false}
                size="icon-sm"
                className="hidden md:inline-flex"
            >
                <MenuIcon />
            </IconButton>
            <Link to={ROUTES.dashboard} className="flex items-center gap-2 md:hidden">
                <WalletIcon aria-hidden className="text-primary size-5" />
                <span className="text-foreground font-medium">{intl.formatMessage(messages.app.name)}</span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
                {username === undefined ? null : <span className="text-muted-foreground hidden max-w-40 truncate text-sm sm:inline">{username}</span>}
                <IconButton label={intl.formatMessage(messages.auth.signOut)} onClick={logout} showTooltip size="icon-sm">
                    <LogOutIcon />
                </IconButton>
            </div>
        </header>
    );
};
