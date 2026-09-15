import {LoadingIndicator} from "@/components/layout/LoadingIndicator";

/** 全頁 loading：session restore 期間用，避免閃 login。 */
export const FullPageLoading = () => {
    return <LoadingIndicator minH="100dvh" size="lg" />;
};
