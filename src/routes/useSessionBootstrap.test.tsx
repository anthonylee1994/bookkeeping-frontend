import {beforeEach, describe, expect, it, vi} from "vitest";
import {renderHook, waitFor} from "@testing-library/react";
import {AUTH_TOKEN_STORAGE_KEY} from "@/data/authRepository";
import {useSessionBootstrap} from "@/routes/useSessionBootstrap";
import {useAuthStore} from "@/stores/authStore";
import type {User} from "@/data/types";

const getMe = vi.hoisted(() => vi.fn());

vi.mock("@/data/authRepository", async importOriginal => {
    const actual = await importOriginal<typeof import("@/data/authRepository")>();
    return {
        ...actual,
        AuthRepository: class {
            getMe = getMe;
        },
    };
});

const user: User = {
    id: "70000000-0000-4000-8000-000000000001",
    username: "Anthony",
    timezone: "Asia/Hong_Kong",
    currency: "HKD",
};

beforeEach(() => {
    localStorage.clear();
    getMe.mockReset();
    useAuthStore.setState({token: null, user: null, hydrated: false});
});

describe("useSessionBootstrap", () => {
    it("restores a stored token and its user before reporting ready", async () => {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "stored-token");
        getMe.mockResolvedValue({ok: true, value: user});

        const {result} = renderHook(() => useSessionBootstrap());
        expect(result.current).toBe("loading");

        await waitFor(() => expect(result.current).toBe("ready"));
        expect(getMe).toHaveBeenCalledWith("stored-token");
        expect(useAuthStore.getState()).toMatchObject({token: "stored-token", user});
    });

    it("clears an invalid stored token instead of keeping a broken session", async () => {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "stale-token");
        getMe.mockResolvedValue({ok: false, error: {code: "unauthorized", message: "登入已失效"}});

        const {result} = renderHook(() => useSessionBootstrap());
        await waitFor(() => expect(result.current).toBe("ready"));
        expect(useAuthStore.getState()).toMatchObject({token: null, user: null});
    });

    it("reports ready without calling getMe when there is no stored token", async () => {
        const {result} = renderHook(() => useSessionBootstrap());
        await waitFor(() => expect(result.current).toBe("ready"));
        expect(getMe).not.toHaveBeenCalled();
        expect(useAuthStore.getState().hydrated).toBe(true);
    });
});
