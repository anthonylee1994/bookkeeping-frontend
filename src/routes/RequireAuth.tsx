import {Navigate, Outlet, useLocation} from "react-router";
import {FullPageLoading} from "@/components/layout/FullPageLoading";
import {ROUTES} from "@/routes/paths";
import {useAuthStore} from "@/stores/authStore";

/** 私有 route guard：未登入去 `/login?returnTo=`；未 hydrate 完就全頁 loading。 */
export const RequireAuth = () => {
    const hydrated = useAuthStore(state => state.hydrated);
    const token = useAuthStore(state => state.token);
    const location = useLocation();

    if (!hydrated) {
        return <FullPageLoading />;
    }

    if (token === null) {
        const returnTo = `${location.pathname}${location.search}`;
        return <Navigate to={`${ROUTES.login}?returnTo=${encodeURIComponent(returnTo)}`} replace />;
    }

    return <Outlet />;
};
