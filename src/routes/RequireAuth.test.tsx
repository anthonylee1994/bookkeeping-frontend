import {beforeEach, describe, expect, it} from "vitest";
import {screen} from "@testing-library/react";
import {MemoryRouter, Route, Routes, useLocation} from "react-router";
import {RequireAuth} from "@/routes/RequireAuth";
import {RedirectIfAuthenticated} from "@/routes/RedirectIfAuthenticated";
import {formatMessage, messages} from "@/lib/i18n";
import {useAuthStore} from "@/stores/authStore";
import {renderWithIntl} from "@/test/renderWithIntl";

const LocationProbe = () => {
    const location = useLocation();
    return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
};

beforeEach(() => {
    useAuthStore.setState({token: null, user: null, hydrated: false});
});

describe("RequireAuth", () => {
    it("redirects unauthenticated visitors to login with returnTo", () => {
        useAuthStore.setState({hydrated: true, token: null});

        renderWithIntl(
            <MemoryRouter initialEntries={["/transactions?kind=expense"]}>
                <Routes>
                    <Route element={<RequireAuth />}>
                        <Route path="/transactions" element={<div>TRANSACTIONS</div>} />
                    </Route>
                    <Route path="/login" element={<LocationProbe />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId("location")).toHaveTextContent("/login?returnTo=%2Ftransactions%3Fkind%3Dexpense");
        expect(screen.queryByText("TRANSACTIONS")).not.toBeInTheDocument();
    });

    it("shows full-page loading instead of login before hydration completes", () => {
        useAuthStore.setState({hydrated: false, token: null});

        renderWithIntl(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route element={<RequireAuth />}>
                        <Route path="/" element={<div>DASHBOARD</div>} />
                    </Route>
                    <Route path="/login" element={<LocationProbe />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText(formatMessage(messages.common.loading))).toBeInTheDocument();
        expect(screen.queryByTestId("location")).not.toBeInTheDocument();
        expect(screen.queryByText("DASHBOARD")).not.toBeInTheDocument();
    });

    it("renders the private route when a token is present without flashing login", () => {
        useAuthStore.setState({hydrated: true, token: "stored-token", user: null});

        renderWithIntl(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route element={<RequireAuth />}>
                        <Route path="/" element={<div>DASHBOARD</div>} />
                    </Route>
                    <Route path="/login" element={<LocationProbe />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("DASHBOARD")).toBeInTheDocument();
        expect(screen.queryByTestId("location")).not.toBeInTheDocument();
    });
});

describe("RedirectIfAuthenticated", () => {
    it("sends an authenticated visitor from /login back to the dashboard", () => {
        useAuthStore.setState({hydrated: true, token: "stored-token", user: null});

        renderWithIntl(
            <MemoryRouter initialEntries={["/login"]}>
                <Routes>
                    <Route element={<RedirectIfAuthenticated />}>
                        <Route path="/login" element={<div>LOGIN</div>} />
                    </Route>
                    <Route path="/" element={<LocationProbe />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId("location")).toHaveTextContent("/");
        expect(screen.queryByText("LOGIN")).not.toBeInTheDocument();
    });

    it("keeps the login page for signed-out visitors", () => {
        useAuthStore.setState({hydrated: true, token: null});

        renderWithIntl(
            <MemoryRouter initialEntries={["/login"]}>
                <Routes>
                    <Route element={<RedirectIfAuthenticated />}>
                        <Route path="/login" element={<div>LOGIN</div>} />
                    </Route>
                    <Route path="/" element={<LocationProbe />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("LOGIN")).toBeInTheDocument();
    });
});
