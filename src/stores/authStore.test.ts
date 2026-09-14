// @vitest-environment jsdom

import {beforeEach, describe, expect, it} from "vitest";
import type {User} from "../data/types";
import {AUTH_STORAGE_KEY, hydrateAuthStore, subscribeToAuthStorageEvents, useAuthStore} from "./authStore";

const user: User = {
    id: "70000000-0000-4000-8000-000000000001",
    username: "Anthony",
    timezone: "Asia/Hong_Kong",
    currency: "HKD",
};
const token = "opaque.api.token";

beforeEach(() => {
    useAuthStore.setState({token: null, user: null, hydrated: false});
    localStorage.clear();
});

describe("auth store", () => {
    it("starts unauthenticated and unhydrated", () => {
        expect(useAuthStore.getState()).toMatchObject({token: null, user: null, hydrated: false});
    });

    it("sets a session, persists only its token and clears it on logout", () => {
        useAuthStore.getState().setSession(token, user);
        expect(useAuthStore.getState()).toMatchObject({token, user});
        expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBe(token);

        useAuthStore.getState().clearSession();
        expect(useAuthStore.getState()).toMatchObject({token: null, user: null});
        expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    });

    it("hydrates a stored token and leaves user restoration to getMe", async () => {
        localStorage.setItem(AUTH_STORAGE_KEY, token);

        await hydrateAuthStore();

        expect(useAuthStore.getState()).toMatchObject({token, user: null, hydrated: true});
    });

    it("fails closed when the stored token is blank", async () => {
        localStorage.setItem(AUTH_STORAGE_KEY, "   ");

        await hydrateAuthStore();

        expect(useAuthStore.getState()).toMatchObject({token: null, user: null, hydrated: true});
    });

    it("clears the session when another tab logs out", () => {
        useAuthStore.getState().setSession(token, user);
        const unsubscribe = subscribeToAuthStorageEvents();

        window.dispatchEvent(new StorageEvent("storage", {key: AUTH_STORAGE_KEY, newValue: null}));

        expect(useAuthStore.getState()).toMatchObject({token: null, user: null});
        unsubscribe();
    });

    it("hydrates a new token from another tab without copying user data", () => {
        useAuthStore.getState().setSession(token, user);
        const unsubscribe = subscribeToAuthStorageEvents();

        window.dispatchEvent(new StorageEvent("storage", {key: AUTH_STORAGE_KEY, newValue: "other-tab-token"}));
        expect(useAuthStore.getState()).toMatchObject({token: "other-tab-token", user: null});
        unsubscribe();
    });
});
