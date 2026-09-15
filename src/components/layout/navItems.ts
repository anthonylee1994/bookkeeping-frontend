import {ChartPieIcon, HomeIcon, RepeatIcon, ScanLineIcon, SettingsIcon, WalletIcon} from "lucide-react";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";
import type {MessageDescriptor} from "react-intl";
import type {LucideIcon} from "lucide-react";

export type NavItem = {
    to: string;
    label: MessageDescriptor;
    icon: LucideIcon;
    /** 係咪出現喺 mobile 底部 tab bar（tab bar 只放最多 4 個，中間留位畀 FAB）。 */
    showInTabBar: boolean;
};

export const NAV_ITEMS: readonly NavItem[] = [
    {to: ROUTES.dashboard, label: messages.nav.dashboard, icon: HomeIcon, showInTabBar: true},
    {to: ROUTES.transactions, label: messages.nav.transactions, icon: WalletIcon, showInTabBar: true},
    {to: ROUTES.scan, label: messages.nav.scan, icon: ScanLineIcon, showInTabBar: false},
    {to: ROUTES.summaries, label: messages.nav.summaries, icon: ChartPieIcon, showInTabBar: true},
    {to: ROUTES.recurringRules, label: messages.nav.recurringRules, icon: RepeatIcon, showInTabBar: false},
    {to: ROUTES.settings, label: messages.nav.settings, icon: SettingsIcon, showInTabBar: true},
];

/** Mobile tab bar 用嘅 4 個 item；中間 FAB 由 MobileTabBar 自己插入。 */
export const TAB_NAV_ITEMS: readonly NavItem[] = NAV_ITEMS.filter(item => item.showInTabBar);
