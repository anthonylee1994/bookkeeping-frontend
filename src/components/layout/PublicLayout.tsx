import {Outlet} from "react-router";

/** 登入／註冊用嘅公開 layout：置中窄欄。 */
export const PublicLayout = () => {
    return (
        <main className="flex min-h-dvh items-center justify-center px-4 py-10">
            <div className="w-full max-w-sm">
                <Outlet />
            </div>
        </main>
    );
};
