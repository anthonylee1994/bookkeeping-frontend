import {useNavigate} from "react-router";
import {ROUTES} from "@/routes/paths";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";
import {useDraftStore} from "@/stores/draftStore";

/** 原子 logout：清 session、draft（連 object URL）、domain mirror，再去 login。 */
export function useLogout(): () => void {
    const navigate = useNavigate();

    return () => {
        useAuthStore.getState().clearSession();
        useDraftStore.getState().resetDrafts();
        useAppStore.getState().resetAppState();
        navigate(ROUTES.login, {replace: true});
    };
}
