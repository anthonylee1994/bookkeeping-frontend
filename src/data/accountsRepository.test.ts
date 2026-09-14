import {afterEach, describe, expect, it, vi} from "vitest";
import {domainTestState} from "../test/domainFixtures";
import {AccountsRepository} from "./accountsRepository";
import {apiClient} from "./apiRepository";

const TOKEN = "api-token";
const account = domainTestState.accounts[0];

afterEach(() => {
    vi.restoreAllMocks();
});

describe("AccountsRepository", () => {
    it("lists accounts with bearer auth and accepts wrapped responses", async () => {
        const request = vi.spyOn(apiClient, "request").mockResolvedValue({data: {accounts: domainTestState.accounts}});

        expect(await new AccountsRepository(TOKEN).list()).toEqual({ok: true, value: domainTestState.accounts});
        expect(request).toHaveBeenCalledWith(expect.objectContaining({method: "GET", url: "/accounts", headers: expect.objectContaining({Authorization: `Bearer ${TOKEN}`})}));
    });

    it("creates and updates accounts with normalized HKD values", async () => {
        const request = vi.spyOn(apiClient, "request").mockResolvedValueOnce({data: {account}}).mockResolvedValueOnce({data: account});
        const repository = new AccountsRepository(TOKEN);

        expect(await repository.create({name: "現金", kind: "cash", currency: "HKD"})).toMatchObject({ok: true});
        expect(await repository.update(account.id, {name: "銀包", kind: "cash", currency: "HKD", initial_balance_cents: 5000})).toMatchObject({ok: true});
        expect(request.mock.calls.map(call => call[0])).toEqual([
            expect.objectContaining({method: "POST", url: "/accounts", data: expect.objectContaining({currency: "HKD", initial_balance_cents: 0})}),
            expect.objectContaining({method: "PATCH", url: `/accounts/${account.id}`, data: expect.objectContaining({initial_balance_cents: 5000})}),
        ]);
    });

    it("maps in-use delete conflicts", async () => {
        vi.spyOn(apiClient, "request").mockRejectedValue({response: {status: 409, data: {message: "帳戶仍被交易使用"}}});

        expect(await new AccountsRepository(TOKEN).delete(account.id)).toEqual({ok: false, error: {code: "in_use", message: "帳戶仍被交易使用"}});
    });

    it("rejects invalid input and missing auth without making requests", async () => {
        const request = vi.spyOn(apiClient, "request");

        expect(await new AccountsRepository(TOKEN).create({name: "", kind: "cash", currency: "HKD"})).toMatchObject({ok: false, error: {code: "validation"}});
        expect(await new AccountsRepository(" ").list()).toMatchObject({ok: false, error: {code: "unauthorized"}});
        expect(request).not.toHaveBeenCalled();
    });
});
