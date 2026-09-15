import {describe, expect, it} from "vitest";
import type {TransactionRow} from "@/data/types";
import {domainTestState} from "@/test/domainFixtures";
import {transactionTone} from "./transactionDisplay";

const base: TransactionRow = domainTestState.transactions[0];

describe("transactionTone", () => {
    it("colours income green and expense red", () => {
        expect(transactionTone({...base, kind: "income"})).toBe("income");
        expect(transactionTone({...base, kind: "expense", category_id: domainTestState.categories[1].id})).toBe("expense");
    });

    it("keeps unsigned transfers on the transfer tone", () => {
        expect(transactionTone({...base, kind: "transfer", category_id: null, transfer_account_id: domainTestState.accounts[1].id})).toBe("transfer");
    });

    it("colours refunds green because they display as a positive amount", () => {
        expect(transactionTone({...base, kind: "expense", refund_of_id: base.id})).toBe("income");
        expect(transactionTone({...base, kind: "income", refund_of_id: base.id})).toBe("income");
    });
});
