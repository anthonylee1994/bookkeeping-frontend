import React from "react";
import {SummariesRepository} from "@/data/summariesRepository";
import type {LocalError, SummaryInsight, SummaryPeriod} from "@/data/types";
import {useAuthStore} from "@/stores/authStore";

export type SummaryInsightQuery = {
    insight: SummaryInsight | null;
    isLoading: boolean;
    error: LocalError | null;
    reload: () => void;
};

type InsightResultState = {
    key: string;
    insight: SummaryInsight | null;
    error: LocalError | null;
};

/**
 * 取得指定期間的 AI 收支概況。後端用數據指紋做 cache，所以只要 `invalidationKey`
 * （由 summary 的 aggregate 派生）冇變就唔會重新叫 AI；`reload` 會用 `refresh` 強制重算。
 * `enabled` 為 false（例如期間冇交易）時完全唔會發出請求。
 */
export function useSummaryInsight(period: SummaryPeriod, date: string, enabled: boolean, invalidationKey: string): SummaryInsightQuery {
    const token = useAuthStore(state => state.token);
    const [result, setResult] = React.useState<InsightResultState>({key: "", insight: null, error: null});
    const [reloadToken, setReloadToken] = React.useState(0);
    const refreshRef = React.useRef(false);
    const requestKey = `${token ?? ""}:${period}:${date}:${invalidationKey}:${reloadToken}`;

    React.useEffect(() => {
        if (token === null || !enabled) return;

        let active = true;
        const refresh = refreshRef.current;
        refreshRef.current = false;

        void new SummariesRepository(token).getInsight(period, date, refresh).then(response => {
            if (!active) return;
            if (response.ok) {
                setResult({key: requestKey, insight: response.value, error: null});
            } else {
                setResult({key: requestKey, insight: null, error: response.error});
            }
        });

        return () => {
            active = false;
        };
    }, [token, period, date, enabled, invalidationKey, reloadToken, requestKey]);

    const reload = () => {
        refreshRef.current = true;
        setReloadToken(value => value + 1);
    };

    const isCurrent = result.key === requestKey;
    return {
        insight: token !== null && enabled && isCurrent ? result.insight : null,
        isLoading: token !== null && enabled && !isCurrent,
        error: token !== null && enabled && isCurrent ? result.error : null,
        reload,
    };
}
