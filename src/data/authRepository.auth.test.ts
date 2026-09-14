import axios from "axios";
import {afterEach, describe, expect, it, vi} from "vitest";
import {AUTH_FAILURE_MESSAGE, AUTH_TOKEN_STORAGE_KEY, AuthRepository} from "./authRepository";
import type {AuthTokenStorage} from "./authRepository";

const user = {id: "70000000-0000-4000-8000-000000000001", username: "Anthony", created_at: "2026-09-14T08:00:00.000Z"};

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
        vi.spyOn(axios, "post").mockResolvedValue({data: {access_token: "api-token", user}});

        const result = await new AuthRepository(storage).register({username: "  Anthony  ", password: "correct horse"});

        expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/register", {username: "Anthony", password: "correct horse"});
        expect(result).toEqual({ok: true, value: {token: "api-token", user}});
        expect(storage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe("api-token");
    });

    it("logs in through the backend and clears the token on logout", async () => {
        const storage = createMemoryStorage();
        vi.spyOn(axios, "post").mockResolvedValue({data: {token: "api-token", user}});
        const repository = new AuthRepository(storage);

        expect(await repository.login({username: "Anthony", password: "correct horse"})).toMatchObject({ok: true});
        expect(storage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe("api-token");
        repository.logout();
        expect(storage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    });

    it("validates input before making an API call", async () => {
        const post = vi.spyOn(axios, "post");

        expect(await new AuthRepository(createMemoryStorage()).register({username: "   ", password: "12345678"})).toMatchObject({ok: false, error: {code: "validation"}});
        expect(post).not.toHaveBeenCalled();
    });

    it("does not reveal whether a username exists when login fails", async () => {
        vi.spyOn(axios, "post").mockRejectedValue({response: {status: 401}});
        const repository = new AuthRepository(createMemoryStorage());

        const missing = await repository.login({username: "Nobody", password: "correct horse"});
        const wrong = await repository.login({username: "Anthony", password: "wrong password"});
        expect(missing).toEqual({ok: false, error: {code: "unauthorized", message: AUTH_FAILURE_MESSAGE}});
        expect(wrong).toEqual(missing);
    });

    it("uses the stored token for getMe", async () => {
        const storage = createMemoryStorage();
        storage.setItem(AUTH_TOKEN_STORAGE_KEY, "stored-token");
        vi.spyOn(axios, "get").mockResolvedValue({data: {user}});

        expect(await new AuthRepository(storage).getMe()).toEqual({ok: true, value: user});
        expect(axios.get).toHaveBeenCalledWith("/api/v1/me", {headers: {Authorization: "Bearer stored-token"}});
    });
});
