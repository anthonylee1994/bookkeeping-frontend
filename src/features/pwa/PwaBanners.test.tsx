import {beforeEach, describe, expect, it, vi} from "vitest";
import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {PwaBanners} from "@/features/pwa/PwaBanners";
import {renderWithIntl} from "@/test/renderWithIntl";

const updateMock = vi.hoisted(() => ({
    needRefresh: false,
    offlineReady: false,
    applyUpdate: vi.fn(),
    dismissUpdate: vi.fn(),
    dismissOfflineReady: vi.fn(),
}));
const installMock = vi.hoisted(() => ({canInstall: false, install: vi.fn(), dismiss: vi.fn()}));
const iosMock = vi.hoisted(() => ({visible: false, dismiss: vi.fn()}));

vi.mock("@/features/pwa/useAppUpdate", () => ({useAppUpdate: () => updateMock}));
vi.mock("@/features/pwa/useInstallPrompt", () => ({useInstallPrompt: () => installMock}));
vi.mock("@/features/pwa/useIosInstallHint", () => ({useIosInstallHint: () => iosMock}));

beforeEach(() => {
    updateMock.needRefresh = false;
    updateMock.offlineReady = false;
    updateMock.applyUpdate.mockReset();
    updateMock.dismissUpdate.mockReset();
    updateMock.dismissOfflineReady.mockReset();
    installMock.canInstall = false;
    installMock.install.mockReset();
    installMock.dismiss.mockReset();
    iosMock.visible = false;
    iosMock.dismiss.mockReset();
});

describe("PwaBanners", () => {
    it("renders nothing when there is no prompt", () => {
        const {container} = renderWithIntl(<PwaBanners />);
        expect(container).toBeEmptyDOMElement();
    });

    it("offers a reload when a new version is ready and never auto-reloads", async () => {
        const user = userEvent.setup();
        updateMock.needRefresh = true;
        renderWithIntl(<PwaBanners />);

        expect(screen.getByText("有新版本")).toBeInTheDocument();
        await user.click(screen.getByRole("button", {name: "重新載入"}));
        expect(updateMock.applyUpdate).toHaveBeenCalledTimes(1);
    });

    it("prioritises the update prompt over the install prompt", () => {
        updateMock.needRefresh = true;
        installMock.canInstall = true;
        renderWithIntl(<PwaBanners />);

        expect(screen.getByText("有新版本")).toBeInTheDocument();
        expect(screen.queryByText("安裝「簡單記帳」")).not.toBeInTheDocument();
    });

    it("shows the install prompt and remembers dismissal", async () => {
        const user = userEvent.setup();
        installMock.canInstall = true;
        renderWithIntl(<PwaBanners />);

        expect(screen.getByText("安裝「簡單記帳」")).toBeInTheDocument();
        await user.click(screen.getByRole("button", {name: "安裝"}));
        expect(installMock.install).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole("button", {name: "不用了"}));
        expect(installMock.dismiss).toHaveBeenCalledTimes(1);
    });
});
