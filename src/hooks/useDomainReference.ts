import React from "react";
import {AccountsRepository} from "@/data/accountsRepository";
import {CategoriesRepository} from "@/data/categoriesRepository";
import {MerchantsRepository} from "@/data/merchantsRepository";
import type {Account, Category, LocalError, Merchant} from "@/data/types";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";

export type DomainReference = {
    accounts: Account[];
    categories: Category[];
    merchants: Merchant[];
    isLoading: boolean;
    error: LocalError | null;
    reload: () => void;
};

type DomainReferenceResult = {
    key: string;
    error: LocalError | null;
};

/**
 * Accounts／categories／merchants 參考資料；成功載入後寫入 appStore 並標記 `referenceLoaded`，
 * 之後其他 feature mount 時就不用重複抓取。失敗保留舊資料，可透過 `reload` 重試。
 */
export function useDomainReference(): DomainReference {
    const token = useAuthStore(state => state.token);
    const accounts = useAppStore(state => state.accounts);
    const categories = useAppStore(state => state.categories);
    const merchants = useAppStore(state => state.merchants);
    const referenceLoaded = useAppStore(state => state.referenceLoaded);
    const [result, setResult] = React.useState<DomainReferenceResult | null>(null);
    const [reloadToken, setReloadToken] = React.useState(0);
    const requestKey = `${token ?? ""}:${reloadToken}`;

    React.useEffect(() => {
        if (token === null || referenceLoaded) return;

        let active = true;

        void Promise.all([new AccountsRepository(token).list(), new CategoriesRepository(token).list(), new MerchantsRepository(token).search("")]).then(
            ([accountsResult, categoriesResult, merchantsResult]) => {
                if (!active) return;

                const store = useAppStore.getState();
                if (accountsResult.ok) store.setAccounts(accountsResult.value);
                if (categoriesResult.ok) store.setCategories(categoriesResult.value);
                if (merchantsResult.ok) store.setMerchants(merchantsResult.value);

                const failure = [accountsResult, categoriesResult, merchantsResult].find(result => !result.ok);
                if (failure === undefined) {
                    store.setReferenceLoaded(true);
                    setResult({key: requestKey, error: null});
                } else {
                    setResult({key: requestKey, error: failure.error});
                }
            }
        );

        return () => {
            active = false;
        };
    }, [token, referenceLoaded, requestKey]);

    const reload = () => setReloadToken(value => value + 1);

    // 多個 consumer 同時 mount 時，其中一個完成便會將 shared referenceLoaded 設為 true。
    // 另一個 request 會被 cleanup；此時必須以 shared 狀態收斂 loading，否則會永久停在 skeleton。
    const isCurrent = result !== null && result.key === requestKey;
    return {
        accounts,
        categories,
        merchants,
        isLoading: token !== null && !referenceLoaded && !isCurrent,
        error: isCurrent ? result.error : null,
        reload,
    };
}
