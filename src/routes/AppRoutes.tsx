import React from "react";
import {Route, Routes} from "react-router";
import {AppLayout} from "@/components/layout/AppLayout";
import {PublicLayout} from "@/components/layout/PublicLayout";
import {LoginPage} from "@/features/auth/LoginPage";
import {RegisterPage} from "@/features/auth/RegisterPage";
import {DashboardPage} from "@/features/dashboard/DashboardPage";
import {LazyRoute} from "@/routes/LazyRoute";
import {NotFoundPage} from "@/routes/NotFoundPage";
import {RedirectIfAuthenticated} from "@/routes/RedirectIfAuthenticated";
import {RequireAuth} from "@/routes/RequireAuth";
import {ROUTES} from "@/routes/paths";

const TransactionsPage = React.lazy(() => import("@/features/transactions/TransactionsPage").then(module => ({default: module.TransactionsPage})));
const TransactionDetailRoute = React.lazy(() => import("@/features/transactions/TransactionDetailRoute").then(module => ({default: module.TransactionDetailRoute})));
const TransactionFormRoute = React.lazy(() => import("@/features/transactions/TransactionFormRoute").then(module => ({default: module.TransactionFormRoute})));
const ScanPage = React.lazy(() => import("@/features/receiptScan/ScanPage").then(module => ({default: module.ScanPage})));
const SummariesPage = React.lazy(() => import("@/features/summaries/SummariesPage").then(module => ({default: module.SummariesPage})));
const RecurringRulesPage = React.lazy(() => import("@/features/recurringRules/RecurringRulesPage").then(module => ({default: module.RecurringRulesPage})));
const SettingsPage = React.lazy(() => import("@/features/settings/SettingsPage").then(module => ({default: module.SettingsPage})));
const AccountsPage = React.lazy(() => import("@/features/settings/AccountsPage").then(module => ({default: module.AccountsPage})));
const CategoriesPage = React.lazy(() => import("@/features/settings/CategoriesPage").then(module => ({default: module.CategoriesPage})));
const MerchantsPage = React.lazy(() => import("@/features/settings/MerchantsPage").then(module => ({default: module.MerchantsPage})));

export const AppRoutes = () => {
    return (
        <Routes>
            <Route element={<RedirectIfAuthenticated />}>
                <Route element={<PublicLayout />}>
                    <Route path={ROUTES.login} element={<LoginPage />} />
                    <Route path={ROUTES.register} element={<RegisterPage />} />
                </Route>
            </Route>

            <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route
                        path={ROUTES.transactions}
                        element={
                            <LazyRoute>
                                <TransactionsPage />
                            </LazyRoute>
                        }
                    />
                    <Route
                        path={ROUTES.transactionNew}
                        element={
                            <LazyRoute>
                                <TransactionFormRoute />
                            </LazyRoute>
                        }
                    />
                    <Route
                        path={ROUTES.transactionDetail}
                        element={
                            <LazyRoute>
                                <TransactionDetailRoute />
                            </LazyRoute>
                        }
                    />
                    <Route
                        path={ROUTES.transactionEdit}
                        element={
                            <LazyRoute>
                                <TransactionFormRoute />
                            </LazyRoute>
                        }
                    />
                    <Route
                        path={ROUTES.scan}
                        element={
                            <LazyRoute>
                                <ScanPage />
                            </LazyRoute>
                        }
                    />
                    <Route
                        path={ROUTES.summaries}
                        element={
                            <LazyRoute>
                                <SummariesPage />
                            </LazyRoute>
                        }
                    />
                    <Route
                        path={ROUTES.recurringRules}
                        element={
                            <LazyRoute>
                                <RecurringRulesPage />
                            </LazyRoute>
                        }
                    />
                    <Route
                        path={ROUTES.settings}
                        element={
                            <LazyRoute>
                                <SettingsPage />
                            </LazyRoute>
                        }
                    />
                    <Route
                        path={ROUTES.settingsAccounts}
                        element={
                            <LazyRoute>
                                <AccountsPage />
                            </LazyRoute>
                        }
                    />
                    <Route
                        path={ROUTES.settingsCategories}
                        element={
                            <LazyRoute>
                                <CategoriesPage />
                            </LazyRoute>
                        }
                    />
                    <Route
                        path={ROUTES.settingsMerchants}
                        element={
                            <LazyRoute>
                                <MerchantsPage />
                            </LazyRoute>
                        }
                    />
                </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};
