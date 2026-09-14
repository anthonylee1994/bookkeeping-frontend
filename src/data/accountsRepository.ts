import {accountInputSchema} from "./schema";
import {accountResponseSchema, accountsResponseSchema} from "./repositorySchemas";
import {apiDelete, apiRequest, localValidation} from "./apiRepository";
import type {Account, AccountInput, LocalResult, UUID} from "./types";

export class AccountsRepository {
    readonly #token: string;

    constructor(token: string) {
        this.#token = token;
    }

    async list(): Promise<LocalResult<Account[]>> {
        return apiRequest(this.#token, {method: "GET", url: "/api/v1/accounts"}, accountsResponseSchema);
    }

    async create(input: AccountInput): Promise<LocalResult<Account>> {
        const parsed = accountInputSchema.safeParse({...input, currency: "HKD"});
        if (!parsed.success) return localValidation("帳戶資料無效");
        return apiRequest(this.#token, {method: "POST", url: "/api/v1/accounts", data: parsed.data}, accountResponseSchema);
    }

    async update(id: UUID, input: AccountInput): Promise<LocalResult<Account>> {
        const parsed = accountInputSchema.safeParse({...input, currency: "HKD"});
        if (!parsed.success) return localValidation("帳戶資料無效");
        return apiRequest(this.#token, {method: "PATCH", url: `/api/v1/accounts/${id}`, data: parsed.data}, accountResponseSchema);
    }

    async delete(id: UUID): Promise<LocalResult<true>> {
        return apiDelete(this.#token, `/api/v1/accounts/${id}`);
    }
}
