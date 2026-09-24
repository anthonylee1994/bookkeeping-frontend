import React from "react";
import {Outlet, useLocation} from "react-router";
import {AiBatchReviewDrawer} from "@/features/transactions/AiBatchReviewDrawer";
import {TransactionsPage} from "@/features/transactions/TransactionsPage";
import {useDomainReference} from "@/hooks/useDomainReference";
import {ROUTES} from "@/routes/paths";
import {useUiStore} from "@/stores/uiStore";

export {TransactionDetailRoute} from "@/features/transactions/TransactionDetailRoute";
export {TransactionFormRoute} from "@/features/transactions/TransactionFormRoute";

/**
 * `/transactions` 子樹的 layout：交易列表永遠 mount 住，detail／form drawer 由 child route 經 `Outlet` 疊上，
 * 咁樣開 drawer 同閂 drawer 都唔會重新抓取列表，只有交易 mutation（經 `transactionsRevision`）先會刷新。
 *
 * AI 打字記帳拆單嘅覆核 drawer 亦掛喺呢層：多筆時新增交易 drawer 會先閂（導航返列表），
 * 覆核 drawer 等到唔再停喺新增交易 route 先開，避免兩層 drawer 同一 commit 交接時 focus 被搶。
 */
export const TransactionsLayout = () => {
    const reference = useDomainReference();
    const location = useLocation();
    const pendingAiBatch = useUiStore(state => state.pendingAiBatch);
    const closeAiBatch = useUiStore(state => state.closeAiBatch);
    const [isBatchOpen, setBatchOpen] = React.useState(false);

    React.useEffect(() => {
        if (pendingAiBatch === null) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setBatchOpen(false);
            return;
        }
        // 仲停喺新增交易 route：等 creation drawer 落畫，下一個 commit 先開覆核 drawer。
        if (location.pathname === ROUTES.transactionNew) return;
        setBatchOpen(true);
    }, [pendingAiBatch, location.pathname]);

    // 離開交易子樹時清走未覆核嘅拆單，避免下次返嚟無端彈 drawer。
    React.useEffect(() => () => closeAiBatch(), [closeAiBatch]);

    return (
        <React.Fragment>
            <TransactionsPage />
            <Outlet />
            <AiBatchReviewDrawer
                open={isBatchOpen && pendingAiBatch !== null}
                preview={pendingAiBatch}
                reference={{accounts: reference.accounts, categories: reference.categories, merchants: reference.merchants}}
                onClose={closeAiBatch}
                onConfirmed={closeAiBatch}
            />
        </React.Fragment>
    );
};
