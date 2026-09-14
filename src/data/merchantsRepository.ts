import {apiDelete, apiRequest} from "./apiRepository";
import {localValidation} from "./localResult";
import {merchantResponseSchema, merchantsResponseSchema} from "./repositorySchemas";
import {merchantInputSchema} from "./schema";
import type {LocalResult, Merchant, MerchantInput, UUID} from "./types";

export class MerchantsRepository {
    readonly #token: string;

    constructor(token: string) {
        this.#token = token;
    }

    async search(q = ""): Promise<LocalResult<Merchant[]>> {
        return apiRequest(this.#token, {method: "GET", url: "/api/v1/merchants", params: q.trim() === "" ? undefined : {q: q.trim()}}, merchantsResponseSchema);
    }

    async create(input: MerchantInput): Promise<LocalResult<Merchant>> {
        const parsed = merchantInputSchema.safeParse(input);
        if (!parsed.success) return localValidation("商戶資料無效");
        return apiRequest(this.#token, {method: "POST", url: "/api/v1/merchants", data: parsed.data}, merchantResponseSchema);
    }

    async delete(id: UUID): Promise<LocalResult<true>> {
        return apiDelete(this.#token, `/api/v1/merchants/${id}`);
    }
}
