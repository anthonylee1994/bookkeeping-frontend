import {afterEach, describe, expect, it, vi} from "vitest";
import {domainTestState} from "../test/domainFixtures";
import {apiClient} from "./apiRepository";
import {CategoriesRepository} from "./categoriesRepository";

const TOKEN = "api-token";
const category = domainTestState.categories[0];

afterEach(() => {
    vi.restoreAllMocks();
});

describe("CategoriesRepository", () => {
    it("lists categories with an optional kind filter", async () => {
        const request = vi.spyOn(apiClient, "request").mockResolvedValue({data: {categories: domainTestState.categories}});

        expect(await new CategoriesRepository(TOKEN).list("income")).toEqual({ok: true, value: domainTestState.categories});
        expect(request).toHaveBeenCalledWith(expect.objectContaining({method: "GET", url: "/categories", params: {kind: "income"}}));
    });

    it("creates and updates categories through their API endpoints", async () => {
        const request = vi.spyOn(apiClient, "request").mockResolvedValueOnce({data: {category}}).mockResolvedValueOnce({data: category});
        const repository = new CategoriesRepository(TOKEN);

        expect(await repository.create({name: "工資", kind: "income"})).toMatchObject({ok: true});
        expect(await repository.update(category.id, {name: "薪金", kind: "income"})).toMatchObject({ok: true});
        expect(request.mock.calls.map(call => [call[0].method, call[0].url])).toEqual([
            ["POST", "/categories"],
            ["PATCH", `/categories/${category.id}`],
        ]);
    });

    it("deletes a category", async () => {
        const request = vi.spyOn(apiClient, "request").mockResolvedValue({data: null});

        expect(await new CategoriesRepository(TOKEN).delete(category.id)).toEqual({ok: true, value: true});
        expect(request).toHaveBeenCalledWith(expect.objectContaining({method: "DELETE", url: `/categories/${category.id}`}));
    });

    it("rejects invalid category input locally", async () => {
        const request = vi.spyOn(apiClient, "request");

        expect(await new CategoriesRepository(TOKEN).create({name: " ", kind: "income"})).toMatchObject({ok: false, error: {code: "validation"}});
        expect(request).not.toHaveBeenCalled();
    });
});
