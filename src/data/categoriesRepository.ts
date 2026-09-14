import {apiDelete, apiRequest, localValidation} from "./apiRepository";
import {categoriesResponseSchema, categoryResponseSchema} from "./repositorySchemas";
import {categoryInputSchema} from "./schema";
import type {Category, CategoryInput, CategoryKind, LocalResult, UUID} from "./types";

export class CategoriesRepository {
    readonly #token: string;

    constructor(token: string) {
        this.#token = token;
    }

    async list(kind?: CategoryKind): Promise<LocalResult<Category[]>> {
        return apiRequest(this.#token, {method: "GET", url: "/api/v1/categories", params: kind === undefined ? undefined : {kind}}, categoriesResponseSchema);
    }

    async create(input: CategoryInput): Promise<LocalResult<Category>> {
        const parsed = categoryInputSchema.safeParse(input);
        if (!parsed.success) return localValidation("分類資料無效");
        return apiRequest(this.#token, {method: "POST", url: "/api/v1/categories", data: parsed.data}, categoryResponseSchema);
    }

    async update(id: UUID, input: CategoryInput): Promise<LocalResult<Category>> {
        const parsed = categoryInputSchema.safeParse(input);
        if (!parsed.success) return localValidation("分類資料無效");
        return apiRequest(this.#token, {method: "PATCH", url: `/api/v1/categories/${id}`, data: parsed.data}, categoryResponseSchema);
    }

    async delete(id: UUID): Promise<LocalResult<true>> {
        return apiDelete(this.#token, `/api/v1/categories/${id}`);
    }
}
