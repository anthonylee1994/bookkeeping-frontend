import {apiDelete, apiRequest} from "./apiRepository";
import {localSuccess, localValidation} from "./localResult";
import {paginatedTransactionsResponseSchema, transactionResponseSchema} from "./repositorySchemas";
import {refundInputSchema, transactionInputSchema, transactionUpdateInputSchema, uuidSchema} from "./schema";
import type {LocalResult, Paginated, RefundInput, Transaction, TransactionFilters, TransactionInput, TransactionUpdateInput, UUID} from "./types";

function validateKindFields(input: TransactionInput | TransactionUpdateInput): LocalResult<true> {
    if (input.kind === "transfer") {
        if (input.transfer_account_id === undefined || input.transfer_account_id === null) return localValidation("轉帳必須選擇轉入帳戶", {transfer_account_id: "必填"});
        if (input.transfer_account_id === input.account_id) return localValidation("轉出同轉入帳戶不可相同", {transfer_account_id: "不可與轉出帳戶相同"});
        if (input.category_id !== undefined && input.category_id !== null) return localValidation("轉帳不可設定分類", {category_id: "轉帳不適用"});
        if (input.merchant_id !== undefined && input.merchant_id !== null) return localValidation("轉帳不可設定商戶", {merchant_id: "轉帳不適用"});
    } else if (input.transfer_account_id !== undefined && input.transfer_account_id !== null) {
        return localValidation("收入或支出不可設定轉入帳戶", {transfer_account_id: "收入或支出不適用"});
    }
    return localSuccess(true);
}

export class TransactionsRepository {
    readonly #token: string;

    constructor(token: string) {
        this.#token = token;
    }

    async list(filters: TransactionFilters = {}): Promise<LocalResult<Paginated<Transaction>>> {
        const {keyword, min_amount_cents, max_amount_cents, sort, order, ...params} = filters;
        const query: Record<string, unknown> = {...params};
        if (keyword !== undefined && keyword !== "") query.q = keyword;
        if (min_amount_cents !== undefined) query.min_amount = min_amount_cents;
        if (max_amount_cents !== undefined) query.max_amount = max_amount_cents;
        if (sort !== undefined) query.sort = order === "desc" ? `-${sort}` : sort;
        return apiRequest(this.#token, {method: "GET", url: "/transactions", params: query}, paginatedTransactionsResponseSchema);
    }

    async get(id: UUID): Promise<LocalResult<Transaction>> {
        return apiRequest(this.#token, {method: "GET", url: `/transactions/${id}`}, transactionResponseSchema);
    }

    async create(input: TransactionInput, idempotencyKey: UUID): Promise<LocalResult<Transaction>> {
        if (!uuidSchema.safeParse(idempotencyKey).success) return localValidation("Idempotency key 無效");
        const parsed = transactionInputSchema.safeParse({...input, currency: "HKD"});
        if (!parsed.success) return localValidation("交易資料無效");
        const kindFields = validateKindFields(parsed.data);
        if (!kindFields.ok) return kindFields;
        return apiRequest(this.#token, {method: "POST", url: "/transactions", data: parsed.data, headers: {"Idempotency-Key": idempotencyKey}}, transactionResponseSchema);
    }

    async update(id: UUID, input: TransactionUpdateInput): Promise<LocalResult<Transaction>> {
        const parsed = transactionUpdateInputSchema.safeParse({...input, currency: "HKD"});
        if (!parsed.success) return localValidation("交易資料無效");
        const kindFields = validateKindFields(parsed.data);
        if (!kindFields.ok) return kindFields;
        return apiRequest(this.#token, {method: "PATCH", url: `/transactions/${id}`, data: parsed.data}, transactionResponseSchema);
    }

    async delete(id: UUID): Promise<LocalResult<true>> {
        return apiDelete(this.#token, `/transactions/${id}`);
    }

    async refund(id: UUID, input: RefundInput): Promise<LocalResult<Transaction>> {
        const parsed = refundInputSchema.safeParse(input);
        if (!parsed.success) return localValidation("退款資料無效");
        return apiRequest(this.#token, {method: "POST", url: `/transactions/${id}/refund`, data: parsed.data}, transactionResponseSchema);
    }

    async duplicate(id: UUID): Promise<LocalResult<Transaction>> {
        return apiRequest(this.#token, {method: "POST", url: `/transactions/${id}/duplicate`}, transactionResponseSchema);
    }
}
