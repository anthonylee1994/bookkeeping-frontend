import {create} from "zustand";
import {createJSONStorage, persist} from "zustand/middleware";
import type {TransactionDraft} from "../data/types";

export const DRAFT_STORAGE_KEY = "bookkeeping.drafts.v1";

export type DraftState = {
    transactionDraft: TransactionDraft | null;
    setTransactionDraft: (draft: TransactionDraft | null) => void;
    resetDrafts: () => void;
};

/** object URL／base64 preview 不可以寫入 sessionStorage：reload 後必定失效。 */
function isEphemeralUrl(value: string): boolean {
    return value.startsWith("blob:") || value.startsWith("data:");
}

function sanitizeTransactionDraft(draft: TransactionDraft | null): TransactionDraft | null {
    if (draft === null) return null;
    return {...draft, image_urls: draft.image_urls.filter(url => !isEphemeralUrl(url))};
}

function revokeDraftObjectUrls(transactionDraft: TransactionDraft | null): void {
    if (typeof URL.revokeObjectURL !== "function") return;
    for (const url of transactionDraft?.image_urls ?? []) {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    }
}

export const useDraftStore = create<DraftState>()(
    persist(
        set => ({
            transactionDraft: null,
            setTransactionDraft: transactionDraft => set({transactionDraft}),
            resetDrafts: () => {
                const {transactionDraft} = useDraftStore.getState();
                revokeDraftObjectUrls(transactionDraft);
                set({transactionDraft: null});
            },
        }),
        {
            name: DRAFT_STORAGE_KEY,
            version: 1,
            storage: createJSONStorage(() => sessionStorage),
            partialize: state => ({
                transactionDraft: sanitizeTransactionDraft(state.transactionDraft),
            }),
            merge: (persisted, current) => {
                const saved = persisted as Partial<DraftState>;
                return {
                    ...current,
                    transactionDraft: sanitizeTransactionDraft(saved.transactionDraft ?? null),
                };
            },
        }
    )
);
