import {ChevronLeftIcon, ChevronRightIcon, WalletIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link, NavLink} from "react-router";
import {NAV_ITEMS} from "@/components/layout/navItems";
import {IconButton} from "@/components/ui/IconButton";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";
import {cn} from "@/lib/utils";

type SidebarNavProps = {
    collapsed: boolean;
    onToggle: () => void;
};

/** Tablet／desktop 左側 navigation；tablet 可以收起。 */
export const SidebarNav = ({collapsed, onToggle}: SidebarNavProps) => {
    const intl = useIntl();

    return (
        <aside className={cn("border-border bg-card fixed inset-y-0 left-0 z-40 hidden flex-col border-r md:flex", collapsed ? "w-16" : "w-60")}>
            <div className="border-border flex h-14 items-center gap-2 border-b px-3">
                <Link to={ROUTES.dashboard} className="flex min-w-0 items-center gap-2">
                    <WalletIcon aria-hidden className="text-primary size-5 shrink-0" />
                    <span className={cn("text-foreground truncate font-medium", collapsed && "sr-only")}>{intl.formatMessage(messages.app.name)}</span>
                </Link>
                <IconButton label={intl.formatMessage(collapsed ? messages.layout.expandSidebar : messages.layout.collapseSidebar)} onClick={onToggle} showTooltip size="icon-sm" className="ml-auto">
                    {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </IconButton>
            </div>
            <nav aria-label={intl.formatMessage(messages.layout.primaryNav)} className="flex-1 space-y-1 overflow-y-auto p-2">
                {NAV_ITEMS.map(item => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === ROUTES.dashboard}
                            className={({isActive}) =>
                                cn(
                                    "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )
                            }
                        >
                            <Icon aria-hidden className="size-5 shrink-0" />
                            <span className={cn("truncate", collapsed && "sr-only")}>{intl.formatMessage(item.label)}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
};
