import {act, renderHook, waitFor} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {useDomainReference} from "@/hooks/useDomainReference";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";

const accountsListMock = vi.hoisted(() => vi.fn());
const categoriesListMock = vi.hoisted(() => vi.fn());
const merchantsSearchMock = vi.hoisted(() => vi.fn());

vi.mock("@/data/accountsRepository", () => ({
    AccountsRepository: class {
        list = accountsListMock;
    },
}));

vi.mock("@/data/categoriesRepository", () => ({
    CategoriesRepository: class {
        list = categoriesListMock;
    },
}));

vi.mock("@/data/merchantsRepository", () => ({
    MerchantsRepository: class {
        search = merchantsSearchMock;
    },
}));

function neverResolves(): Promise<never> {
    return new Promise(() => undefined);
}

beforeEach(() => {
    accountsListMock.mockReset().mockReturnValue(neverResolves());
    categoriesListMock.mockReset().mockReturnValue(neverResolves());
    merchantsSearchMock.mockReset().mockReturnValue(neverResolves());
    useAuthStore.setState({token: "test-token", user: null, hydrated: true});
    useAppStore.getState().resetAppState();
});

describe("useDomainReference", () => {
    it("stops showing loading when another consumer finishes loading shared reference data", async () => {
        const {result} = renderHook(() => useDomainReference());
        await waitFor(() => expect(result.current.isLoading).toBe(true));

        act(() => useAppStore.getState().setReferenceLoaded(true));

        expect(result.current.isLoading).toBe(false);
    });
});
