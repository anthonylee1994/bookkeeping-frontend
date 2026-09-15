import {BrowserRouter} from "react-router";
import {FullPageLoading} from "@/components/layout/FullPageLoading";
import {Toaster} from "@/components/ui/Toaster";
import {TooltipProvider} from "@/components/ui/Tooltip";
import {AppRoutes} from "@/routes/AppRoutes";
import {useSessionBootstrap} from "@/routes/useSessionBootstrap";

export const App = () => {
    const sessionStatus = useSessionBootstrap();

    return (
        <BrowserRouter>
            <TooltipProvider>
                {sessionStatus === "loading" ? <FullPageLoading /> : <AppRoutes />}
                <Toaster />
            </TooltipProvider>
        </BrowserRouter>
    );
};
