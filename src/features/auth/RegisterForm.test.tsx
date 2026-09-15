import {beforeEach, describe, expect, it, vi} from "vitest";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter, Route, Routes} from "react-router";
import {RegisterForm} from "@/features/auth/RegisterForm";
import {useAuthStore} from "@/stores/authStore";
import {useUiStore} from "@/stores/uiStore";
import {renderWithIntl} from "@/test/renderWithIntl";
import type {AuthSession} from "@/data/types";

const registerMock = vi.hoisted(() => vi.fn());

vi.mock("@/data/authRepository", async importOriginal => {
    const actual = await importOriginal<typeof import("@/data/authRepository")>();
    return {
        ...actual,
        AuthRepository: class {
            register = registerMock;
        },
    };
});

const session: AuthSession = {
    token: "token-1",
    user: {id: "70000000-0000-4000-8000-000000000001", username: "anthony", timezone: "Asia/Hong_Kong", currency: "HKD"},
};

function renderRegister(returnTo: string | null): void {
    renderWithIntl(
        <MemoryRouter initialEntries={["/register"]}>
            <Routes>
                <Route path="/register" element={<RegisterForm returnTo={returnTo} />} />
                <Route path="/" element={<div>HOME</div>} />
                <Route path="/transactions" element={<div>TRANSACTIONS</div>} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    localStorage.clear();
    registerMock.mockReset();
    useAuthStore.setState({token: null, user: null, hydrated: false});
    useUiStore.setState({toasts: []});
});

describe("RegisterForm", () => {
    it("requires at least 8 password characters", async () => {
        const user = userEvent.setup();
        renderRegister(null);

        await user.type(screen.getByLabelText("用戶名稱"), "anthony");
        await user.type(screen.getByLabelText("密碼"), "short");
        await user.type(screen.getByLabelText("確認密碼"), "short");
        await user.click(screen.getByRole("button", {name: "註冊"}));

        expect(await screen.findByText("密碼最少需要 8 個字元")).toBeInTheDocument();
        expect(registerMock).not.toHaveBeenCalled();
    });

    it("requires both passwords to match", async () => {
        const user = userEvent.setup();
        renderRegister(null);

        await user.type(screen.getByLabelText("用戶名稱"), "anthony");
        await user.type(screen.getByLabelText("密碼"), "secret123");
        await user.type(screen.getByLabelText("確認密碼"), "secret456");
        await user.click(screen.getByRole("button", {name: "註冊"}));

        expect(await screen.findByText("兩次密碼唔一致")).toBeInTheDocument();
        expect(registerMock).not.toHaveBeenCalled();
    });

    it("registers, starts the session and redirects to returnTo", async () => {
        const user = userEvent.setup();
        registerMock.mockResolvedValue({ok: true, value: session});
        renderRegister("/transactions");

        await user.type(screen.getByLabelText("用戶名稱"), "anthony");
        await user.type(screen.getByLabelText("密碼"), "secret123");
        await user.type(screen.getByLabelText("確認密碼"), "secret123");
        await user.click(screen.getByRole("button", {name: "註冊"}));

        await waitFor(() => expect(screen.getByText("TRANSACTIONS")).toBeInTheDocument());
        expect(registerMock).toHaveBeenCalledWith({username: "anthony", password: "secret123"});
        expect(useAuthStore.getState()).toMatchObject({token: "token-1", user: session.user});
    });

    it("shows a generic failure when registration is rejected", async () => {
        const user = userEvent.setup();
        registerMock.mockResolvedValue({ok: false, error: {code: "validation", message: "用戶名稱或密碼錯誤"}});
        renderRegister(null);

        await user.type(screen.getByLabelText("用戶名稱"), "anthony");
        await user.type(screen.getByLabelText("密碼"), "secret123");
        await user.type(screen.getByLabelText("確認密碼"), "secret123");
        await user.click(screen.getByRole("button", {name: "註冊"}));

        expect(await screen.findByText("用戶名稱或密碼錯誤")).toBeInTheDocument();
        expect(useAuthStore.getState().token).toBeNull();
    });
});
