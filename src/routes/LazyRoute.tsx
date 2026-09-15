import React from "react";
import {RouteFallback} from "@/routes/RouteFallback";

type LazyRouteProps = {
    children: React.ReactNode;
};

/** 包住 React.lazy route，suspense fallback 用固定尺寸 skeleton。 */
export const LazyRoute = ({children}: LazyRouteProps) => {
    return <React.Suspense fallback={<RouteFallback />}>{children}</React.Suspense>;
};
