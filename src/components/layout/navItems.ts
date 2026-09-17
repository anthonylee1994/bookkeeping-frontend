import {ChartPieIcon, HomeIcon, RepeatIcon, ScanLineIcon, SettingsIcon, WalletIcon} from "lucide-react";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";
import type {MessageDescriptor} from "react-intl";
import type {LucideIcon} from "lucide-react";

type NavItemBase = {
    label: MessageDescriptor;
    icon: LucideIcon;
    /** 是否出現於 mobile 底部 tab bar（tab bar 只放最多 4 個，中間留位給 FAB）。 */
    showInTabBar: boolean;
};

export type NavLinkItem = NavItemBase & {kind: "link"; to: string};
/** 掃描不再是頁面，而是一個「一 click 開相機／上載」的動作。 */
export type NavScanItem = NavItemBase & {kind: "scan"};
export type NavItem = NavLinkItem | NavScanItem;

export const NAV_ITEMS: readonly NavItem[] = [
    {kind: "link", to: ROUTES.dashboard, label: messages.nav.dashboard, icon: HomeIcon, showInTabBar: true},
    {kind: "link", to: ROUTES.transactions, label: messages.nav.transactions, icon: WalletIcon, showInTabBar: true},
    {kind: "scan", label: messages.nav.scan, icon: ScanLineIcon, showInTabBar: false},
    {kind: "link", to: ROUTES.summaries, label: messages.nav.summaries, icon: ChartPieIcon, showInTabBar: true},
    {kind: "link", to: ROUTES.recurringRules, label: messages.nav.recurringRules, icon: RepeatIcon, showInTabBar: false},
    {kind: "link", to: ROUTES.settings, label: messages.nav.settings, icon: SettingsIcon, showInTabBar: true},
];

/** Mobile tab bar 用的 4 個 item；中間 FAB 由 MobileTabBar 自行插入。 */
export const TAB_NAV_ITEMS: readonly NavLinkItem[] = NAV_ITEMS.filter((item): item is NavLinkItem => item.kind === "link" && item.showInTabBar);
