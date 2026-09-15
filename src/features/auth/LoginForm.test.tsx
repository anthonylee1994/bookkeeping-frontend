import {beforeEach, describe, expect, it, vi} from "vitest";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter, Route, Routes} from "react-router";
import {LoginForm} from "@/features/auth/LoginForm";
import {useAuthStore} from "@/stores/authStore";
import {useUiStore} from "@/stores/uiStore";
import {renderWithIntl} from "@/test/renderWithIntl";
import type {AuthSession} from "@/data/types";

const loginMock = vi.hoisted(() => vi.fn());

vi.mock("@/data/authRepository", async importOriginal => {
    const actual = await importOriginal<typeof import("@/data/authRepository")>();
    return {
        ...actual,
        AuthRepository: class {
            login = loginMock;
        },
    };
});

const session: AuthSession = {
    token: "token-1",
    user: {id: "70000000-0000-4000-8000-000000000001", username: "anthony", timezone: "Asia/Hong_Kong", currency: "HKD"},
};

function renderLogin(returnTo: string | null): void {
    renderWithIntl(
        <MemoryRouter initialEntries={["/login"]}>
            <Routes>
                <Route path="/login" element={<LoginForm returnTo={returnTo} />} />
                <Route path="/" element={<div>HOME</div>} />
                <Route path="/transactions" element={<div>TRANSACTIONS</div>} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    localStorage.clear();
    loginMock.mockReset();
    useAuthStore.setState({token: null, user: null, hydrated: false});
    useUiStore.setState({toasts: []});
});

describe("LoginForm", () => {
    it("shows field errors and skips the request when the form is empty", async () => {
        const user = userEvent.setup();
        renderLogin(null);

        await user.click(screen.getByRole("button", {name: "登入"}));

        expect(await screen.findByText("用戶名稱為必填")).toBeInTheDocument();
        expect(screen.getByText("請輸入密碼")).toBeInTheDocument();
        expect(loginMock).not.toHaveBeenCalled();
    });

    it("signs in and redirects to returnTo", async () => {
        const user = userEvent.setup();
        loginMock.mockResolvedValue({ok: true, value: session});
        renderLogin("/transactions");

        await user.type(screen.getByLabelText("用戶名稱"), "anthony");
        await user.type(screen.getByLabelText("密碼"), "secret123");
        await user.click(screen.getByRole("button", {name: "登入"}));

        await waitFor(() => expect(screen.getByText("TRANSACTIONS")).toBeInTheDocument());
        expect(loginMock).toHaveBeenCalledWith({username: "anthony", password: "secret123"});
        expect(useAuthStore.getState()).toMatchObject({token: "token-1", user: session.user});
    });

    it("falls back to the dashboard when there is no returnTo", async () => {
        const user = userEvent.setup();
        loginMock.mockResolvedValue({ok: true, value: session});
        renderLogin(null);

        await user.type(screen.getByLabelText("用戶名稱"), "anthony");
        await user.type(screen.getByLabelText("密碼"), "secret123");
        await user.click(screen.getByRole("button", {name: "登入"}));

        await waitFor(() => expect(screen.getByText("HOME")).toBeInTheDocument());
    });

    it("shows a generic failure without starting a session", async () => {
        const user = userEvent.setup();
        loginMock.mockResolvedValue({ok: false, error: {code: "unauthorized", message: "使用者名稱或密碼不正確"}});
        renderLogin(null);

        await user.type(screen.getByLabelText("用戶名稱"), "nobody");
        await user.type(screen.getByLabelText("密碼"), "wrongpass");
        await user.click(screen.getByRole("button", {name: "登入"}));

        expect(await screen.findByText("使用者名稱或密碼不正確")).toBeInTheDocument();
        expect(useAuthStore.getState().token).toBeNull();
        expect(screen.queryByText("HOME")).not.toBeInTheDocument();
        expect(screen.getByLabelText("用戶名稱")).toHaveValue("");
        expect(screen.getByLabelText("密碼")).toHaveValue("");
    });

    it("toggles password visibility", async () => {
        const user = userEvent.setup();
        renderLogin(null);

        const password = screen.getByLabelText("密碼");
        expect(password).toHaveAttribute("type", "password");

        await user.click(screen.getByRole("button", {name: "顯示密碼"}));
        expect(password).toHaveAttribute("type", "text");
        expect(screen.getByRole("button", {name: "隱藏密碼"})).toBeInTheDocument();
    });
});
