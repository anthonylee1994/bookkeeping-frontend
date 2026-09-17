import {matchPath, useLocation} from "react-router";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";
import type {MessageDescriptor} from "react-intl";

export type RouteMeta = {
    /** App bar 顯示的標題。 */
    title: MessageDescriptor;
    /** Root（tab bar 直達）的頁不顯示返回按鈕。 */
    isRoot: boolean;
};

type RouteMetaEntry = RouteMeta & {path: string};

const ROUTE_META: readonly RouteMetaEntry[] = [
    {path: ROUTES.dashboard, title: messages.nav.dashboard, isRoot: true},
    {path: ROUTES.transactions, title: messages.nav.transactions, isRoot: true},
    {path: ROUTES.transactionNew, title: messages.transactions.newTitle, isRoot: false},
    {path: ROUTES.transactionEdit, title: messages.transactions.editTitle, isRoot: false},
    {path: ROUTES.transactionDetail, title: messages.transactions.detailTitle, isRoot: false},
    {path: ROUTES.summaries, title: messages.nav.summaries, isRoot: true},
    {path: ROUTES.recurringRules, title: messages.nav.recurringRules, isRoot: false},
    {path: ROUTES.settings, title: messages.nav.settings, isRoot: true},
    {path: ROUTES.settingsAccounts, title: messages.nav.accounts, isRoot: false},
    {path: ROUTES.settingsCategories, title: messages.nav.categories, isRoot: false},
    {path: ROUTES.settingsMerchants, title: messages.nav.merchants, isRoot: false},
    {path: ROUTES.settingsPassword, title: messages.settings.changePassword, isRoot: false},
];

const FALLBACK_META: RouteMeta = {title: messages.app.name, isRoot: true};

/** 由目前 pathname 推導 app bar 標題及是否 root 頁，供 mobile app shell 使用。 */
export function useRouteMeta(): RouteMeta {
    const {pathname} = useLocation();
    const entry = ROUTE_META.find(candidate => matchPath({path: candidate.path, end: true}, pathname) !== null);
    if (entry === undefined) return FALLBACK_META;
    return {title: entry.title, isRoot: entry.isRoot};
}
