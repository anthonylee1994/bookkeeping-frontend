import React from "react";
import {RecurringRulesRepository} from "@/data/recurringRulesRepository";
import type {LocalError, RecurringRule, RecurringStatus} from "@/data/types";
import {useAuthStore} from "@/stores/authStore";

export type RecurringRulesQuery = {
    rules: RecurringRule[];
    isLoading: boolean;
    error: LocalError | null;
    reload: () => void;
};

type RecurringRulesResult = {
    key: string;
    rules: RecurringRule[];
    error: LocalError | null;
};

/**
 * 依狀態 tab 取得定期交易清單。狀態或 reload token 一變即清走舊數據，
 * 免得上一個 tab 嘅規則殘留喺新 tab；`reload` 用於動作完成後重新抓取同錯誤重試。
 */
export function useRecurringRules(status: RecurringStatus): RecurringRulesQuery {
    const token = useAuthStore(state => state.token);
    const [result, setResult] = React.useState<RecurringRulesResult>({key: "", rules: [], error: null});
    const [reloadToken, setReloadToken] = React.useState(0);
    const requestKey = `${token ?? ""}:${status}:${reloadToken}`;

    React.useEffect(() => {
        if (token === null) return;

        let active = true;

        void new RecurringRulesRepository(token).list(status).then(response => {
            if (!active) return;
            if (response.ok) {
                setResult({key: requestKey, rules: response.value, error: null});
            } else {
                setResult({key: requestKey, rules: [], error: response.error});
            }
        });

        return () => {
            active = false;
        };
    }, [token, status, requestKey]);

    const reload = () => setReloadToken(value => value + 1);

    const isCurrent = result.key === requestKey;
    return {
        rules: token !== null && isCurrent ? result.rules : [],
        isLoading: token !== null && !isCurrent,
        error: token !== null && isCurrent ? result.error : null,
        reload,
    };
}
