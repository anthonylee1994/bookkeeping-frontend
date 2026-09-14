import {describe, expect, it} from "vitest";
import {validate as validateUuid, version as uuidVersion} from "uuid";
import {createId} from "./id";

describe("createId", () => {
    it("creates unique UUID v4 identifiers", () => {
        const first = createId();
        const second = createId();

        expect(validateUuid(first)).toBe(true);
        expect(uuidVersion(first)).toBe(4);
        expect(second).not.toBe(first);
    });
});
