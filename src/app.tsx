import React from "react";
import {BrowserRouter} from "react-router";
import {FullPageLoading} from "@/components/layout/FullPageLoading";
import {Toaster} from "@/components/layout/Toaster";
import {AppRoutes} from "@/routes/AppRoutes";
import {useSessionBootstrap} from "@/routes/useSessionBootstrap";

export const App = () => {
    const sessionStatus = useSessionBootstrap();

    return (
        <BrowserRouter>
            <React.Fragment>
                {sessionStatus === "loading" ? <FullPageLoading /> : <AppRoutes />}
                <Toaster />
            </React.Fragment>
        </BrowserRouter>
    );
};
