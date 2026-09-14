import {describe, expect, it} from "vitest";
import {formatMessage, messages} from "./i18n";

describe("i18n messages", () => {
    it("interpolates placeholder values", () => {
        expect(formatMessage("刪除 {name}？", {name: "咖啡"})).toBe("刪除 咖啡？");
        expect(formatMessage("共 {count} 項", {count: 3})).toBe("共 3 項");
    });

    it("keeps unknown placeholders for debugging", () => {
        expect(formatMessage("{missing}", {})).toBe("{missing}");
    });

    it("centralizes the shared error copy used by the data layer", () => {
        expect(messages.errors.unauthorized).toBe("登入已失效，請重新登入");
        expect(messages.errors.apiFailed).toBe("暫時無法連接服務");
    });
});
