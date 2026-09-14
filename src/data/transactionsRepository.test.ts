import axios from "axios";
import {afterEach, describe, expect, it, vi} from "vitest";
import {domainTestState} from "../test/domainFixtures";
import {TransactionsRepository} from "./transactionsRepository";
import type {TransactionInput} from "./types";

const TOKEN = "api-token";
const IDEMPOTENCY_KEY = "60000000-0000-4000-8000-000000000001";
const account = domainTestState.accounts[0];
const targetAccount = domainTestState.accounts[1];
const expenseCategory = domainTestState.categories[1];
const transaction = domainTestState.transactions[0];

function expenseInput(): TransactionInput {
    return {
        account_id: account.id,
        category_id: expenseCategory.id,
        merchant_id: null,
        kind: "expense",
        amount_cents: 1200,
        occurred_at: "2026-09-14T16:00:00+08:00",
        note: "午餐",
        payment_method: "現金",
        transfer_account_id: null,
        image_urls: [],
    };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("TransactionsRepository", () => {
    it("forwards filters, sorting and pagination", async () => {
        const request = vi.spyOn(axios, "request").mockResolvedValue({data: {transactions: [transaction], meta: {page: 2, per_page: 10, total: 11, total_pages: 2}}});

        const result = await new TransactionsRepository(TOKEN).list({
            from: "2026-09-01",
            to: "2026-09-30",
            kind: "expense",
            account_id: account.id,
            category_id: expenseCategory.id,
            merchant_id: domainTestState.merchants[0].id,
            keyword: "咖啡",
            min_amount_cents: 100,
            max_amount_cents: 5000,
            sort: "amount_cents",
            order: "asc",
            page: 2,
            per_page: 10,
        });

        expect(result).toMatchObject({ok: true, value: {meta: {page: 2, per_page: 10}}});
        expect(request).toHaveBeenCalledWith(
            expect.objectContaining({url: "/api/v1/transactions", params: expect.objectContaining({q: "咖啡", sort: "amount_cents", order: "asc", page: 2, per_page: 10})})
        );
    });

    it("gets, duplicates and deletes a transaction", async () => {
        const request = vi.spyOn(axios, "request").mockResolvedValueOnce({data: transaction}).mockResolvedValueOnce({data: {transaction}}).mockResolvedValueOnce({data: null});
        const repository = new TransactionsRepository(TOKEN);

        expect(await repository.get(transaction.id)).toMatchObject({ok: true});
        expect(await repository.duplicate(transaction.id)).toMatchObject({ok: true});
        expect(await repository.delete(transaction.id)).toEqual({ok: true, value: true});
        expect(request.mock.calls.map(call => [call[0].method, call[0].url])).toEqual([
            ["GET", `/api/v1/transactions/${transaction.id}`],
            ["POST", `/api/v1/transactions/${transaction.id}/duplicate`],
            ["DELETE", `/api/v1/transactions/${transaction.id}`],
        ]);
    });

    it("creates idempotently and keeps source out of updates", async () => {
        const request = vi.spyOn(axios, "request").mockResolvedValue({data: {transaction}});
        const repository = new TransactionsRepository(TOKEN);

        expect(await repository.create(expenseInput(), IDEMPOTENCY_KEY)).toMatchObject({ok: true});
        expect(request.mock.calls[0]?.[0].headers).toMatchObject({"Idempotency-Key": IDEMPOTENCY_KEY});
        await repository.update(transaction.id, expenseInput());
        expect(request.mock.calls[1]?.[0].data).not.toHaveProperty("source");
    });

    it("validates transfer account and hidden fields before requesting", async () => {
        const request = vi.spyOn(axios, "request");
        const repository = new TransactionsRepository(TOKEN);

        expect(await repository.create({...expenseInput(), kind: "transfer", category_id: null, transfer_account_id: account.id}, IDEMPOTENCY_KEY)).toMatchObject({
            ok: false,
            error: {code: "validation"},
        });
        expect(await repository.create({...expenseInput(), kind: "transfer", category_id: expenseCategory.id, transfer_account_id: targetAccount.id}, IDEMPOTENCY_KEY)).toMatchObject({
            ok: false,
            error: {code: "validation"},
        });
        expect(request).not.toHaveBeenCalled();
    });

    it("posts refunds and exposes the backend refund cap error", async () => {
        const request = vi.spyOn(axios, "request").mockRejectedValue({response: {status: 422, data: {message: "退款金額超過可退款上限", fields: {amount_cents: ["最多可退 7000"]}}}});

        expect(await new TransactionsRepository(TOKEN).refund(transaction.id, {amount_cents: 7001, occurred_at: "2026-09-14T16:00:00+08:00"})).toEqual({
            ok: false,
            error: {code: "validation", message: "退款金額超過可退款上限", fields: {amount_cents: ["最多可退 7000"]}},
        });
        expect(request).toHaveBeenCalledWith(expect.objectContaining({method: "POST", url: `/api/v1/transactions/${transaction.id}/refund`}));
    });
});
