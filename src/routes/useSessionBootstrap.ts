import React from "react";
import {AuthRepository} from "@/data/authRepository";
import {hydrateAuthStore, subscribeToAuthStorageEvents, useAuthStore} from "@/stores/authStore";

export type SessionStatus = "loading" | "ready";

/**
 * App 啟動時還原本機 session：
 * 1. 由 localStorage 讀 token（hydrate）
 * 2. token 有效就 `getMe` 補回 user
 * 3. 只在 unauthorized 才清 session，其他錯誤保留 token（避免 offline reload 被登出）
 *
 * 此段完成前不會 render routes，所以不會閃現 login page。
 */
export function useSessionBootstrap(): SessionStatus {
    const [status, setStatus] = React.useState<SessionStatus>("loading");

    React.useEffect(() => {
        let cancelled = false;

        async function bootstrap(): Promise<void> {
            await hydrateAuthStore();
            if (cancelled) return;

            const {token, user} = useAuthStore.getState();
            if (token !== null && user === null) {
                const result = await new AuthRepository().getMe(token);
                if (cancelled) return;
                if (result.ok) {
                    useAuthStore.getState().setSession(token, result.value);
                } else if (result.error.code === "unauthorized") {
                    useAuthStore.getState().clearSession();
                }
            }

            if (!cancelled) setStatus("ready");
        }

        void bootstrap();
        const unsubscribe = subscribeToAuthStorageEvents();

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, []);

    return status;
}
