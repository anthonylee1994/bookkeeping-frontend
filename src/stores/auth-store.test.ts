// @vitest-environment jsdom

import {beforeEach, describe, expect, it} from "vitest";
import type {User} from "../data/types";
import {AUTH_STORAGE_KEY, hydrateAuthStore, subscribeToAuthStorageEvents, useAuthStore} from "./auth-store";

const user: User = {
    id: "70000000-0000-4000-8000-000000000001",
    username: "Anthony",
    created_at: "2026-09-14T08:00:00.000Z",
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

    it("sets, persists and clears a minimal session", () => {
        useAuthStore.getState().setSession(token, user);
        expect(useAuthStore.getState()).toMatchObject({token, user});
        expect(localStorage.getItem(AUTH_STORAGE_KEY)).toContain(token);

        useAuthStore.getState().clearSession();
        expect(useAuthStore.getState()).toMatchObject({token: null, user: null});
        expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    });

    it("hydrates a valid persisted session without persisting extra fields", async () => {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({state: {token, user, password: "must-not-survive"}, version: 0}));

        await hydrateAuthStore();

        expect(useAuthStore.getState()).toMatchObject({token, user, hydrated: true});
        useAuthStore.getState().setSession(token, user);
        expect(localStorage.getItem(AUTH_STORAGE_KEY)).not.toContain("password");
    });

    it("fails closed when persisted session data is malformed", async () => {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({state: {token: "", user}, version: 1}));

        await hydrateAuthStore();

        expect(useAuthStore.getState()).toMatchObject({token: null, user: null, hydrated: true});
    });

    it("clears the session when another tab logs out", () => {
        useAuthStore.getState().setSession(token, user);
        const unsubscribe = subscribeToAuthStorageEvents();

        window.dispatchEvent(new StorageEvent("storage", {key: AUTH_STORAGE_KEY, newValue: JSON.stringify({state: {token: null, user: null}, version: 1})}));

        expect(useAuthStore.getState()).toMatchObject({token: null, user: null});
        unsubscribe();
    });

    it("fails closed for malformed cross-tab session data", () => {
        useAuthStore.getState().setSession(token, user);
        const unsubscribe = subscribeToAuthStorageEvents();

        expect(() => window.dispatchEvent(new StorageEvent("storage", {key: AUTH_STORAGE_KEY, newValue: "not-json"}))).not.toThrow();
        expect(useAuthStore.getState()).toMatchObject({token: null, user: null});
        unsubscribe();
    });
});
