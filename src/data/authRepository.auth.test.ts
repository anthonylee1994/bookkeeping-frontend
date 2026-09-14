import axios from "axios";
import {describe, expect, it, vi} from "vitest";
import type {StorageAdapter} from "./persistence";
import {AUTH_FAILURE_MESSAGE, openAuthRepository} from "./authRepository";

function createMemoryStorage(): StorageAdapter {
    return {getItem: () => null, setItem: () => undefined};
}

function repository() {
    const opened = openAuthRepository({storage: createMemoryStorage(), now: new Date("2026-09-14T08:00:00Z")});
    if (!opened.ok) throw new Error(opened.error.message);
    return opened.value;
}

describe("AuthRepository auth API client", () => {
    it("posts a trimmed username to register and returns the API session", async () => {
        vi.spyOn(axios, "post").mockResolvedValueOnce({
            data: {access_token: "api-token", user: {id: "70000000-0000-4000-8000-000000000001", username: "Anthony", created_at: "2026-09-14T08:00:00.000Z"}},
        });
        const result = await repository().register({username: "  Anthony  ", password: "correct horse"});

        expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/register", {username: "Anthony", password: "correct horse"});
        expect(result).toMatchObject({ok: true, value: {token: "api-token", user: {username: "Anthony"}}});
        vi.restoreAllMocks();
    });

    it("validates local input before making an API call", async () => {
        const post = vi.spyOn(axios, "post");
        expect(await repository().register({username: "   ", password: "12345678"})).toMatchObject({ok: false, error: {code: "validation"}});
        expect(post).not.toHaveBeenCalled();
        vi.restoreAllMocks();
    });

    it("normalizes duplicate/register validation and login failures without leaking account existence", async () => {
        vi.spyOn(axios, "post").mockRejectedValue({response: {status: 422}});
        expect(await repository().register({username: "Anthony", password: "correct horse"})).toMatchObject({ok: false, error: {code: "validation"}});

        vi.mocked(axios.post).mockRejectedValue({response: {status: 401}});
        const missing = await repository().login({username: "Nobody", password: "correct horse"});
        const wrong = await repository().login({username: "Anthony", password: "wrong password"});
        expect(missing).toEqual({ok: false, error: {code: "unauthorized", message: AUTH_FAILURE_MESSAGE}});
        expect(wrong).toEqual(missing);
        vi.restoreAllMocks();
    });

    it("sends bearer token to getMe and maps unknown failures", async () => {
        vi.spyOn(axios, "get").mockResolvedValueOnce({data: {id: "70000000-0000-4000-8000-000000000001", username: "Anthony", created_at: "2026-09-14T08:00:00.000Z"}});
        const result = await repository().getMe("api-token");
        expect(axios.get).toHaveBeenCalledWith("/api/v1/me", {headers: {Authorization: "Bearer api-token"}});
        expect(result).toMatchObject({ok: true, value: {username: "Anthony"}});

        vi.mocked(axios.get).mockRejectedValue({response: {status: 500}});
        expect(await repository().getMe("api-token")).toMatchObject({ok: false, error: {code: "api_failed"}});
        vi.restoreAllMocks();
    });
});
