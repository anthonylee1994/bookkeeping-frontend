import React from "react";
import {DashboardRepository} from "@/data/dashboardRepository";
import type {Dashboard, LocalError} from "@/data/types";
import {useAuthStore} from "@/stores/authStore";

export type DashboardQuery = {
    dashboard: Dashboard | null;
    isLoading: boolean;
    error: LocalError | null;
    reload: () => void;
};

/**
 * 攞指定月份嘅 dashboard 資料。`date` 一變（換月）就清走舊數據，
 * 免得月份標題同數字對唔上；`reload` 用嚟做錯誤重試。
 */
export function useDashboard(date: string): DashboardQuery {
    const token = useAuthStore(state => state.token);
    const [dashboard, setDashboard] = React.useState<Dashboard | null>(null);
    const [isLoading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<LocalError | null>(null);
    const [reloadToken, setReloadToken] = React.useState(0);

    React.useEffect(() => {
        if (token === null) {
            setDashboard(null);
            setLoading(false);
            return;
        }

        let active = true;
        setDashboard(null);
        setError(null);
        setLoading(true);

        void new DashboardRepository(token).get(date).then(result => {
            if (!active) return;
            if (result.ok) {
                setDashboard(result.value);
            } else {
                setError(result.error);
            }
            setLoading(false);
        });

        return () => {
            active = false;
        };
    }, [token, date, reloadToken]);

    const reload = () => setReloadToken(value => value + 1);

    return {dashboard, isLoading, error, reload};
}
