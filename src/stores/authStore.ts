import {create} from "zustand";
import {AUTH_TOKEN_STORAGE_KEY, clearStoredAuthToken, getStoredAuthToken, storeAuthToken} from "../data/authRepository";
import type {User} from "../data/types";

export const AUTH_STORAGE_KEY = AUTH_TOKEN_STORAGE_KEY;

export type AuthState = {
    token: string | null;
    user: User | null;
    hydrated: boolean;
    setSession: (token: string, user: User) => void;
    clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(() => ({
    token: null,
    user: null,
    hydrated: false,
    setSession(token, user) {
        useAuthStore.setState({token, user});
        storeAuthToken(token);
    },
    clearSession() {
        useAuthStore.setState({token: null, user: null});
        clearStoredAuthToken();
    },
}));

export async function hydrateAuthStore(): Promise<void> {
    useAuthStore.setState({token: getStoredAuthToken(), user: null, hydrated: true});
}

export function subscribeToAuthStorageEvents(): () => void {
    const listener = (event: StorageEvent): void => {
        if (event.key !== AUTH_STORAGE_KEY) {
            return;
        }
        if (event.newValue === null) {
            useAuthStore.setState({token: null, user: null});
            return;
        }
        const token = event.newValue.trim();
        useAuthStore.setState({token: token === "" ? null : token, user: null});
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
}
