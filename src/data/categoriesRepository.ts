import {apiDelete, apiRequest} from "./apiRepository";
import {localSuccess, localValidation} from "./localResult";
import {categoriesResponseSchema, categoryResponseSchema} from "./repositorySchemas";
import {categoryInputSchema} from "./schema";
import type {Category, CategoryInput, CategoryKind, LocalResult, UUID} from "./types";

function parseCategoryInput(input: CategoryInput): LocalResult<CategoryInput> {
    const parsed = categoryInputSchema.safeParse(input);
    return parsed.success ? localSuccess(parsed.data) : localValidation("分類資料無效");
}

export class CategoriesRepository {
    readonly #token: string;

    constructor(token: string) {
        this.#token = token;
    }

    async list(kind?: CategoryKind): Promise<LocalResult<Category[]>> {
        return apiRequest(this.#token, {method: "GET", url: "/categories", params: kind === undefined ? undefined : {kind}}, categoriesResponseSchema);
    }

    async create(input: CategoryInput): Promise<LocalResult<Category>> {
        const parsed = parseCategoryInput(input);
        if (!parsed.ok) return parsed;
        return apiRequest(this.#token, {method: "POST", url: "/categories", data: parsed.value}, categoryResponseSchema);
    }

    async update(id: UUID, input: CategoryInput): Promise<LocalResult<Category>> {
        const parsed = parseCategoryInput(input);
        if (!parsed.ok) return parsed;
        return apiRequest(this.#token, {method: "PATCH", url: `/categories/${id}`, data: parsed.value}, categoryResponseSchema);
    }

    async delete(id: UUID): Promise<LocalResult<true>> {
        return apiDelete(this.#token, `/categories/${id}`);
    }
}
