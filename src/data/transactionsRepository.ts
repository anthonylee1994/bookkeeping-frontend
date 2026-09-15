import {apiDelete, apiRequest} from "./apiRepository";
import {localSuccess, localValidation} from "./localResult";
import {paginatedTransactionsResponseSchema, transactionResponseSchema} from "./repositorySchemas";
import {transactionInputSchema, transactionUpdateInputSchema, uuidSchema} from "./schema";
import {formatMessage, messages} from "../lib/i18n";
import type {LocalResult, Paginated, Transaction, TransactionFilters, TransactionInput, TransactionUpdateInput, UUID} from "./types";

function validateKindFields(input: TransactionInput | TransactionUpdateInput): LocalResult<true> {
    if (input.kind === "transfer") {
        if (input.transfer_account_id === undefined || input.transfer_account_id === null)
            return localValidation(formatMessage(messages.validation.transferAccountRequired), {transfer_account_id: formatMessage(messages.fields.required)});
        if (input.transfer_account_id === input.account_id)
            return localValidation(formatMessage(messages.validation.transferSameAccount), {transfer_account_id: formatMessage(messages.fields.transferSameAsSource)});
        if (input.category_id !== undefined && input.category_id !== null)
            return localValidation(formatMessage(messages.validation.transferCategoryNotAllowed), {category_id: formatMessage(messages.fields.transferNotApplicable)});
        if (input.merchant_id !== undefined && input.merchant_id !== null)
            return localValidation(formatMessage(messages.validation.transferMerchantNotAllowed), {merchant_id: formatMessage(messages.fields.transferNotApplicable)});
    } else if (input.transfer_account_id !== undefined && input.transfer_account_id !== null) {
        return localValidation(formatMessage(messages.validation.transferAccountNotAllowed), {transfer_account_id: formatMessage(messages.fields.incomeExpenseNotApplicable)});
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
        if (!uuidSchema.safeParse(idempotencyKey).success) return localValidation(formatMessage(messages.validation.idempotencyKeyInvalid));
        const parsed = transactionInputSchema.safeParse({...input, currency: "HKD"});
        if (!parsed.success) return localValidation(formatMessage(messages.validation.transactionInvalid));
        const kindFields = validateKindFields(parsed.data);
        if (!kindFields.ok) return kindFields;
        return apiRequest(this.#token, {method: "POST", url: "/transactions", data: parsed.data, headers: {"Idempotency-Key": idempotencyKey}}, transactionResponseSchema);
    }

    async update(id: UUID, input: TransactionUpdateInput): Promise<LocalResult<Transaction>> {
        const parsed = transactionUpdateInputSchema.safeParse({...input, currency: "HKD"});
        if (!parsed.success) return localValidation(formatMessage(messages.validation.transactionInvalid));
        const kindFields = validateKindFields(parsed.data);
        if (!kindFields.ok) return kindFields;
        return apiRequest(this.#token, {method: "PATCH", url: `/transactions/${id}`, data: parsed.data}, transactionResponseSchema);
    }

    async delete(id: UUID): Promise<LocalResult<true>> {
        return apiDelete(this.#token, `/transactions/${id}`);
    }

    async duplicate(id: UUID): Promise<LocalResult<Transaction>> {
        return apiRequest(this.#token, {method: "POST", url: `/transactions/${id}/duplicate`}, transactionResponseSchema);
    }
}
