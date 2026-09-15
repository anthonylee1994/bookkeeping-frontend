import {apiDelete, apiRequest} from "./apiRepository";
import {localSuccess, localValidation} from "./localResult";
import {accountResponseSchema, accountsResponseSchema} from "./repositorySchemas";
import {accountInputSchema} from "./schema";
import {formatMessage, messages} from "../lib/i18n";
import type {Account, AccountInput, LocalResult, UUID} from "./types";

function parseAccountInput(input: AccountInput): LocalResult<AccountInput> {
    const parsed = accountInputSchema.safeParse({...input, currency: "HKD"});
    return parsed.success ? localSuccess(parsed.data) : localValidation(formatMessage(messages.validation.accountInvalid));
}

export class AccountsRepository {
    readonly #token: string;

    constructor(token: string) {
        this.#token = token;
    }

    async list(): Promise<LocalResult<Account[]>> {
        return apiRequest(this.#token, {method: "GET", url: "/accounts"}, accountsResponseSchema);
    }

    async create(input: AccountInput): Promise<LocalResult<Account>> {
        const parsed = parseAccountInput(input);
        if (!parsed.ok) return parsed;
        return apiRequest(this.#token, {method: "POST", url: "/accounts", data: parsed.value}, accountResponseSchema);
    }

    async update(id: UUID, input: AccountInput): Promise<LocalResult<Account>> {
        const parsed = parseAccountInput(input);
        if (!parsed.ok) return parsed;
        return apiRequest(this.#token, {method: "PATCH", url: `/accounts/${id}`, data: parsed.value}, accountResponseSchema);
    }

    async delete(id: UUID): Promise<LocalResult<true>> {
        return apiDelete(this.#token, `/accounts/${id}`);
    }
}
