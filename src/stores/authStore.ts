import {create} from "zustand";
import {z} from "zod";
import type {User} from "../data/types";

export const AUTH_STORAGE_KEY = "bookkeeping.auth.v1";

const persistedAuthSchema = z.object({
    state: z.object({token: z.string().min(1).nullable(), user: z.object({id: z.string().uuid(), username: z.string().min(1), created_at: z.string()}).nullable()}),
    version: z.number().int().nonnegative(),
});

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
        persistAuthState(token, user);
    },
    clearSession() {
        useAuthStore.setState({token: null, user: null});
        globalThis.localStorage?.removeItem(AUTH_STORAGE_KEY);
    },
}));

export async function hydrateAuthStore(): Promise<void> {
    let token: string | null = null;
    let user: User | null = null;
    try {
        const raw = globalThis.localStorage?.getItem(AUTH_STORAGE_KEY);
        if (raw !== null && raw !== undefined) {
            const parsed = persistedAuthSchema.safeParse(JSON.parse(raw));
            if (parsed.success) {
                token = parsed.data.state.token;
                user = parsed.data.state.user;
            }
        }
    } catch {
        token = null;
        user = null;
    }
    useAuthStore.setState({token, user, hydrated: true});
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
        let parsedData: z.infer<typeof persistedAuthSchema> | null = null;
        try {
            const result = persistedAuthSchema.safeParse(JSON.parse(event.newValue));
            if (result.success) {
                parsedData = result.data;
            }
        } catch {
            parsedData = null;
        }
        if (parsedData === null || parsedData.state.token === null) {
            useAuthStore.setState({token: null, user: null});
        }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
}

function persistAuthState(token: string, user: User): void {
    globalThis.localStorage?.setItem(AUTH_STORAGE_KEY, JSON.stringify({state: {token, user}, version: 1}));
}
