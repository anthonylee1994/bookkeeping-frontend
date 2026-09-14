import {afterEach, describe, expect, it, vi} from "vitest";
import {apiClient} from "./apiRepository";
import {AUTH_FAILURE_MESSAGE, AUTH_TOKEN_STORAGE_KEY, AuthRepository} from "./authRepository";
import type {AuthTokenStorage} from "./authRepository";

const user = {id: "70000000-0000-4000-8000-000000000001", username: "Anthony", timezone: "Asia/Hong_Kong", currency: "HKD"};

function createMemoryStorage(): AuthTokenStorage {
    const values = new Map<string, string>();
    return {
        getItem(key) {
            return values.get(key) ?? null;
        },
        setItem(key, value) {
            values.set(key, value);
        },
        removeItem(key) {
            values.delete(key);
        },
    };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("AuthRepository API client", () => {
    it("registers through the backend and stores only the returned token", async () => {
        const storage = createMemoryStorage();
        const request = vi.spyOn(apiClient, "request").mockResolvedValue({data: {access_token: "api-token", user}});

        const result = await new AuthRepository(storage).register({username: "  Anthony  ", password: "correct horse"});

        expect(request).toHaveBeenCalledWith(expect.objectContaining({method: "POST", url: "/auth/register", data: {username: "Anthony", password: "correct horse"}}));
        expect(result).toEqual({ok: true, value: {token: "api-token", user}});
        expect(storage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe("api-token");
    });

    it("logs in through the backend and clears the token on logout", async () => {
        const storage = createMemoryStorage();
        vi.spyOn(apiClient, "request").mockResolvedValue({data: {token: "api-token", user}});
        const repository = new AuthRepository(storage);

        expect(await repository.login({username: "Anthony", password: "correct horse"})).toMatchObject({ok: true});
        expect(storage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe("api-token");
        repository.logout();
        expect(storage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    });

    it("validates input before making an API call", async () => {
        const request = vi.spyOn(apiClient, "request");

        expect(await new AuthRepository(createMemoryStorage()).register({username: "   ", password: "12345678"})).toMatchObject({ok: false, error: {code: "validation"}});
        expect(request).not.toHaveBeenCalled();
    });

    it("does not reveal whether a username exists when login fails", async () => {
        vi.spyOn(apiClient, "request").mockRejectedValue({response: {status: 401}});
        const repository = new AuthRepository(createMemoryStorage());

        const missing = await repository.login({username: "Nobody", password: "correct horse"});
        const wrong = await repository.login({username: "Anthony", password: "wrong password"});
        expect(missing).toEqual({ok: false, error: {code: "unauthorized", message: AUTH_FAILURE_MESSAGE}});
        expect(wrong).toEqual(missing);
    });

    it("uses the stored token for getMe", async () => {
        const storage = createMemoryStorage();
        storage.setItem(AUTH_TOKEN_STORAGE_KEY, "stored-token");
        const request = vi.spyOn(apiClient, "request").mockResolvedValue({data: {user}});

        expect(await new AuthRepository(storage).getMe()).toEqual({ok: true, value: user});
        expect(request).toHaveBeenCalledWith(expect.objectContaining({method: "GET", url: "/me", headers: expect.objectContaining({Authorization: "Bearer stored-token"})}));
    });
});
