import {useIntl} from "react-intl";
import {NavLink} from "react-router";
import {MOBILE_NAV_ITEMS} from "@/components/layout/navItems";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";
import {cn} from "@/lib/utils";

/** Mobile 底部 5-item navigation（掃描置中相機 icon）。 */
export const BottomNav = () => {
    const intl = useIntl();

    return (
        <nav aria-label={intl.formatMessage(messages.layout.primaryNav)} className="border-border bg-card fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] md:hidden">
            <ul className="mx-auto grid max-w-lg grid-cols-5">
                {MOBILE_NAV_ITEMS.map(item => {
                    const Icon = item.icon;
                    return (
                        <li key={item.to}>
                            <NavLink
                                to={item.to}
                                end={item.to === ROUTES.dashboard}
                                className={({isActive}) =>
                                    cn(
                                        "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-medium transition-colors",
                                        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                    )
                                }
                            >
                                <Icon aria-hidden className="size-5" />
                                <span className="truncate">{intl.formatMessage(item.label)}</span>
                            </NavLink>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};
