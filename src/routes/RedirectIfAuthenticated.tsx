import {Navigate, Outlet} from "react-router";
import {FullPageLoading} from "@/components/layout/FullPageLoading";
import {ROUTES} from "@/routes/paths";
import {useAuthStore} from "@/stores/authStore";

/** 公開 route guard：已登入就唔應該再見到 login／register。 */
export const RedirectIfAuthenticated = () => {
    const hydrated = useAuthStore(state => state.hydrated);
    const token = useAuthStore(state => state.token);

    if (!hydrated) {
        return <FullPageLoading />;
    }

    if (token !== null) {
        return <Navigate to={ROUTES.dashboard} replace />;
    }

    return <Outlet />;
};
