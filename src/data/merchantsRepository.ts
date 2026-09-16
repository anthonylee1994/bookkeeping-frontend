import {apiDelete, apiRequest} from "./apiRepository";
import {localValidation} from "./localResult";
import {merchantResponseSchema, merchantsResponseSchema} from "./repositorySchemas";
import {merchantInputSchema} from "./schema";
import {formatMessage, messages} from "../lib/i18n";
import type {LocalResult, Merchant, MerchantInput, UUID} from "./types";

export class MerchantsRepository {
    readonly #token: string;

    constructor(token: string) {
        this.#token = token;
    }

    async search(q = ""): Promise<LocalResult<Merchant[]>> {
        return apiRequest(this.#token, {method: "GET", url: "/merchants", params: q.trim() === "" ? undefined : {q: q.trim()}}, merchantsResponseSchema);
    }

    async create(input: MerchantInput): Promise<LocalResult<Merchant>> {
        const parsed = merchantInputSchema.safeParse(input);
        if (!parsed.success) return localValidation(formatMessage(messages.validation.merchantInvalid));
        return apiRequest(this.#token, {method: "POST", url: "/merchants", data: parsed.data}, merchantResponseSchema);
    }

    async update(id: UUID, input: MerchantInput): Promise<LocalResult<Merchant>> {
        const parsed = merchantInputSchema.safeParse(input);
        if (!parsed.success) return localValidation(formatMessage(messages.validation.merchantInvalid));
        return apiRequest(this.#token, {method: "PATCH", url: `/merchants/${id}`, data: parsed.data}, merchantResponseSchema);
    }

    async delete(id: UUID): Promise<LocalResult<true>> {
        return apiDelete(this.#token, `/merchants/${id}`);
    }
}
