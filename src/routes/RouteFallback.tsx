import {LoadingIndicator} from "@/components/layout/LoadingIndicator";

/** Route lazy-load fallback。 */
export const RouteFallback = () => {
    return <LoadingIndicator minH="24rem" />;
};
