import {create} from "zustand";
import {createJSONStorage, persist} from "zustand/middleware";
import type {AiScanDraft, TransactionDraft} from "../data/types";

export const DRAFT_STORAGE_KEY = "bookkeeping.drafts.v1";

export type DraftState = {
    transactionDraft: TransactionDraft | null;
    aiScan: AiScanDraft | null;
    setTransactionDraft: (draft: TransactionDraft | null) => void;
    setAiScan: (draft: AiScanDraft | null) => void;
    resetDrafts: () => void;
};

/** object URL／base64 preview 唔可以寫入 sessionStorage：reload 後一定失效。 */
function isEphemeralUrl(value: string): boolean {
    return value.startsWith("blob:") || value.startsWith("data:");
}

function sanitizeTransactionDraft(draft: TransactionDraft | null): TransactionDraft | null {
    if (draft === null) return null;
    return {...draft, image_urls: draft.image_urls.filter(url => !isEphemeralUrl(url))};
}

function sanitizeAiScan(aiScan: AiScanDraft | null): AiScanDraft | null {
    if (aiScan === null) return null;
    return aiScan.imageUrl !== null && isEphemeralUrl(aiScan.imageUrl) ? {...aiScan, imageUrl: null} : aiScan;
}

export function revokeDraftObjectUrls(transactionDraft: TransactionDraft | null, aiScan: AiScanDraft | null): void {
    if (typeof URL.revokeObjectURL !== "function") return;
    const urls = [...(transactionDraft?.image_urls ?? [])];
    if (aiScan?.imageUrl != null) urls.push(aiScan.imageUrl);
    for (const url of urls) {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    }
}

export const useDraftStore = create<DraftState>()(
    persist(
        set => ({
            transactionDraft: null,
            aiScan: null,
            setTransactionDraft: transactionDraft => set({transactionDraft}),
            setAiScan: aiScan => set({aiScan}),
            resetDrafts: () => {
                const {transactionDraft, aiScan} = useDraftStore.getState();
                revokeDraftObjectUrls(transactionDraft, aiScan);
                set({transactionDraft: null, aiScan: null});
            },
        }),
        {
            name: DRAFT_STORAGE_KEY,
            version: 1,
            storage: createJSONStorage(() => sessionStorage),
            partialize: state => ({
                transactionDraft: sanitizeTransactionDraft(state.transactionDraft),
                aiScan: sanitizeAiScan(state.aiScan),
            }),
            merge: (persisted, current) => {
                const saved = persisted as Partial<DraftState>;
                return {
                    ...current,
                    transactionDraft: sanitizeTransactionDraft(saved.transactionDraft ?? null),
                    aiScan: sanitizeAiScan(saved.aiScan ?? null),
                };
            },
        }
    )
);
