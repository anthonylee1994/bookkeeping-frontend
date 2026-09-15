import {ChartPieIcon, HomeIcon, RepeatIcon, ScanLineIcon, SettingsIcon, WalletIcon} from "lucide-react";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";
import type {MessageDescriptor} from "react-intl";
import type {LucideIcon} from "lucide-react";

export type NavItem = {
    to: string;
    label: MessageDescriptor;
    icon: LucideIcon;
    showOnMobile: boolean;
};

export const NAV_ITEMS: readonly NavItem[] = [
    {to: ROUTES.dashboard, label: messages.nav.dashboard, icon: HomeIcon, showOnMobile: true},
    {to: ROUTES.transactions, label: messages.nav.transactions, icon: WalletIcon, showOnMobile: true},
    {to: ROUTES.scan, label: messages.nav.scan, icon: ScanLineIcon, showOnMobile: true},
    {to: ROUTES.summaries, label: messages.nav.summaries, icon: ChartPieIcon, showOnMobile: true},
    {to: ROUTES.recurringRules, label: messages.nav.recurringRules, icon: RepeatIcon, showOnMobile: false},
    {to: ROUTES.settings, label: messages.nav.settings, icon: SettingsIcon, showOnMobile: true},
];

export const MOBILE_NAV_ITEMS: readonly NavItem[] = NAV_ITEMS.filter(item => item.showOnMobile);
