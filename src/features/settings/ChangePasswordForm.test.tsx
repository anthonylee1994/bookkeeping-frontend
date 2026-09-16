import {beforeEach, describe, expect, it, vi} from "vitest";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {ChangePasswordForm} from "@/features/settings/ChangePasswordForm";
import {renderWithIntl} from "@/test/renderWithIntl";

const changePasswordMock = vi.hoisted(() => vi.fn());

vi.mock("@/data/authRepository", async importOriginal => {
    const actual = await importOriginal<typeof import("@/data/authRepository")>();
    return {
        ...actual,
        AuthRepository: class {
            changePassword = changePasswordMock;
        },
    };
});

const user = {id: "70000000-0000-4000-8000-000000000001", username: "anthony", timezone: "Asia/Hong_Kong", currency: "HKD"};

function renderForm(): void {
    renderWithIntl(<ChangePasswordForm />);
}

async function fillForm(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    const input = userEvent.setup();
    await input.type(screen.getByLabelText("目前密碼"), currentPassword);
    await input.type(screen.getByLabelText("新密碼"), newPassword);
    await input.type(screen.getByLabelText("確認密碼"), confirmPassword);
    await input.click(screen.getByRole("button", {name: "更新密碼"}));
}

beforeEach(() => {
    localStorage.clear();
    changePasswordMock.mockReset();
});

describe("ChangePasswordForm", () => {
    it("requires a new password of at least 8 characters", async () => {
        renderForm();

        await fillForm("secret123", "short", "short");

        expect(await screen.findByText("密碼最少需要 8 個字元")).toBeInTheDocument();
        expect(changePasswordMock).not.toHaveBeenCalled();
    });

    it("requires both new passwords to match", async () => {
        renderForm();

        await fillForm("secret123", "newsecret123", "different123");

        expect(await screen.findByText("兩次密碼不一致")).toBeInTheDocument();
        expect(changePasswordMock).not.toHaveBeenCalled();
    });

    it("submits the mapped payload and reports success", async () => {
        changePasswordMock.mockResolvedValue({ok: true, value: user});
        renderForm();

        await fillForm("secret123", "newsecret123", "newsecret123");

        expect(await screen.findByText("密碼已更新")).toBeInTheDocument();
        expect(changePasswordMock).toHaveBeenCalledWith({password_challenge: "secret123", password: "newsecret123", password_confirmation: "newsecret123"});
        expect(screen.getByLabelText("目前密碼")).toHaveValue("");
        expect(screen.getByLabelText("新密碼")).toHaveValue("");
        expect(screen.getByLabelText("確認密碼")).toHaveValue("");
    });

    it("shows the backend failure and clears the form", async () => {
        changePasswordMock.mockResolvedValue({ok: false, error: {code: "validation", message: "目前密碼不正確"}});
        renderForm();

        await fillForm("wrong-password", "newsecret123", "newsecret123");

        expect(await screen.findByText("目前密碼不正確")).toBeInTheDocument();
        await waitFor(() => expect(screen.getByLabelText("目前密碼")).toHaveValue(""));
        expect(screen.queryByText("密碼已更新")).not.toBeInTheDocument();
    });
});
