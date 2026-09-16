import React from "react";
import {createBrowserRouter, RouterProvider} from "react-router";
import {FullPageLoading} from "@/components/layout/FullPageLoading";
import {PwaBanners} from "@/features/pwa/PwaBanners";
import {AppRoutes} from "@/routes/AppRoutes";
import {useSessionBootstrap} from "@/routes/useSessionBootstrap";

const AppContent = () => {
    const sessionStatus = useSessionBootstrap();

    return (
        <React.Fragment>
            {sessionStatus === "loading" ? <FullPageLoading /> : <AppRoutes />}
            <PwaBanners />
        </React.Fragment>
    );
};

const router = createBrowserRouter([{path: "*", element: <AppContent />}]);

export const App = () => <RouterProvider router={router} />;
