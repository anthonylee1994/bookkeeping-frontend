// @vitest-environment jsdom

import {act, renderHook} from "@testing-library/react";
import {beforeEach, describe, expect, it} from "vitest";
import {useUiStore} from "../stores/uiStore";
import {useToast} from "./useToast";

beforeEach(() => {
    useUiStore.getState().resetUiState();
});

describe("useToast", () => {
    it("starts without toasts", () => {
        const {result, unmount} = renderHook(() => useToast());

        expect(result.current.toasts).toEqual([]);
        unmount();
    });

    it("pushes and dismisses toasts through the ui store", () => {
        const {result, unmount} = renderHook(() => useToast());

        let id = "";
        act(() => {
            id = result.current.pushToast({kind: "success", message: "已儲存"});
        });
        expect(result.current.toasts).toEqual([{id, kind: "success", message: "已儲存"}]);

        act(() => result.current.dismissToast(id));
        expect(result.current.toasts).toEqual([]);

        unmount();
    });
});
