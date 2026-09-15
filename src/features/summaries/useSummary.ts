import React from "react";
import {SummariesRepository} from "@/data/summariesRepository";
import type {LocalError, Summary, SummaryPeriod} from "@/data/types";
import {DEFAULT_PER_PAGE} from "@/lib/searchParams";
import {useAuthStore} from "@/stores/authStore";

export type SummaryQuery = {
    summary: Summary | null;
    isLoading: boolean;
    error: LocalError | null;
    reload: () => void;
};

type SummaryResultState = {
    key: string;
    summary: Summary | null;
    error: LocalError | null;
};

/**
 * 取得指定期間、日期、頁數的報表。`period`／`date`／`page` 一變即清走舊數據，
 * 免得期間標題與數字對不上；`reload` 用來做錯誤重試。
 */
export function useSummary(period: SummaryPeriod, date: string, page: number): SummaryQuery {
    const token = useAuthStore(state => state.token);
    const [result, setResult] = React.useState<SummaryResultState>({key: "", summary: null, error: null});
    const [reloadToken, setReloadToken] = React.useState(0);
    const requestKey = `${token ?? ""}:${period}:${date}:${page}:${reloadToken}`;

    React.useEffect(() => {
        if (token === null) return;

        let active = true;

        void new SummariesRepository(token).get(period, date, page, DEFAULT_PER_PAGE).then(response => {
            if (!active) return;
            if (response.ok) {
                setResult({key: requestKey, summary: response.value, error: null});
            } else {
                setResult({key: requestKey, summary: null, error: response.error});
            }
        });

        return () => {
            active = false;
        };
    }, [token, period, date, page, requestKey]);

    const reload = () => setReloadToken(value => value + 1);

    const isCurrent = result.key === requestKey;
    return {
        summary: token !== null && isCurrent ? result.summary : null,
        isLoading: token !== null && !isCurrent,
        error: token !== null && isCurrent ? result.error : null,
        reload,
    };
}
