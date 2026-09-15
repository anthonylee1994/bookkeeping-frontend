import {describe, expect, it} from "vitest";
import {DEFAULT_LOCALE, formatMessage, intlMessages, messages} from "./i18n";

describe("i18n messages", () => {
    it("interpolates placeholder values", () => {
        expect(formatMessage({id: "test.delete", defaultMessage: "刪除 {name}？"}, {name: "咖啡"})).toBe("刪除 咖啡？");
        expect(formatMessage({id: "test.count", defaultMessage: "共 {count} 項"}, {count: 3})).toBe("共 3 項");
    });

    it("falls back to the descriptor default message when an id is missing from the catalog", () => {
        expect(formatMessage({id: "missing.id", defaultMessage: "臨時文案"})).toBe("臨時文案");
    });

    it("flattens grouped descriptors into the IntlProvider catalog", () => {
        expect(DEFAULT_LOCALE).toBe("zh-HK");
        expect(intlMessages["errors.unauthorized"]).toBe("登入已失效，請重新登入");
        expect(intlMessages[messages.errors.apiFailed.id]).toBe("暫時無法連接服務");
    });
});
