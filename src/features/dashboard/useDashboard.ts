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

type DashboardResultState = {
    key: string;
    dashboard: Dashboard | null;
    error: LocalError | null;
};

/**
 * 取得指定月份的 dashboard 資料。`date` 一變（換月）即清走舊數據，
 * 免得月份標題與數字對不上；`reload` 用來做錯誤重試。
 */
export function useDashboard(date: string): DashboardQuery {
    const token = useAuthStore(state => state.token);
    const [result, setResult] = React.useState<DashboardResultState>({key: "", dashboard: null, error: null});
    const [reloadToken, setReloadToken] = React.useState(0);
    const requestKey = `${token ?? ""}:${date}:${reloadToken}`;

    React.useEffect(() => {
        if (token === null) return;

        let active = true;

        void new DashboardRepository(token).get(date).then(result => {
            if (!active) return;
            if (result.ok) {
                setResult({key: requestKey, dashboard: result.value, error: null});
            } else {
                setResult({key: requestKey, dashboard: null, error: result.error});
            }
        });

        return () => {
            active = false;
        };
    }, [token, date, requestKey]);

    const reload = () => setReloadToken(value => value + 1);

    const isCurrent = result.key === requestKey;
    return {
        dashboard: token !== null && isCurrent ? result.dashboard : null,
        isLoading: token !== null && !isCurrent,
        error: token !== null && isCurrent ? result.error : null,
        reload,
    };
}
