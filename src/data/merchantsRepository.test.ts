import axios from "axios";
import {afterEach, describe, expect, it, vi} from "vitest";
import {domainTestState} from "../test/domainFixtures";
import {MerchantsRepository} from "./merchantsRepository";

const TOKEN = "api-token";
const merchant = domainTestState.merchants[0];

afterEach(() => {
    vi.restoreAllMocks();
});

describe("MerchantsRepository", () => {
    it("trims search text and accepts wrapped merchant lists", async () => {
        const request = vi.spyOn(axios, "request").mockResolvedValue({data: {merchants: domainTestState.merchants}});

        expect(await new MerchantsRepository(TOKEN).search("  咖啡  ")).toEqual({ok: true, value: domainTestState.merchants});
        expect(request).toHaveBeenCalledWith(expect.objectContaining({method: "GET", url: "/api/v1/merchants", params: {q: "咖啡"}}));
    });

    it("creates a merchant with an optional default category", async () => {
        const request = vi.spyOn(axios, "request").mockResolvedValue({data: {merchant}});

        expect(await new MerchantsRepository(TOKEN).create({name: merchant.name, default_category_id: merchant.default_category_id})).toMatchObject({ok: true});
        expect(request).toHaveBeenCalledWith(expect.objectContaining({method: "POST", url: "/api/v1/merchants", data: expect.objectContaining({name: merchant.name})}));
    });

    it("deletes a merchant and rejects blank names locally", async () => {
        const request = vi.spyOn(axios, "request").mockResolvedValueOnce({data: null});
        const repository = new MerchantsRepository(TOKEN);

        expect(await repository.delete(merchant.id)).toEqual({ok: true, value: true});
        expect(await repository.create({name: " "})).toMatchObject({ok: false, error: {code: "validation"}});
        expect(request).toHaveBeenCalledTimes(1);
        expect(request).toHaveBeenCalledWith(expect.objectContaining({method: "DELETE", url: `/api/v1/merchants/${merchant.id}`}));
    });
});
