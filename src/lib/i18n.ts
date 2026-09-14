/**
 * 全 app 文案集中一處。MVP 只有繁體中文（香港），冇語言切換器；
 * 將來要加語言先喺呢度擴充，唔好喺 feature 散落 hardcode 字串。
 */
export const messages = {
    app: {
        name: "簡單記帳",
        shortName: "記帳",
        description: "簡單清晰的記帳工具",
    },
    nav: {
        dashboard: "首頁",
        transactions: "交易",
        scan: "掃描",
        summaries: "報表",
        recurringRules: "定期交易",
        settings: "設定",
    },
    common: {
        create: "新增",
        save: "儲存",
        edit: "修改",
        delete: "刪除",
        cancel: "取消",
        confirm: "確認",
        close: "關閉",
        back: "返回",
        retry: "重試",
        clearFilters: "清除篩選",
        loading: "載入中…",
        emptyTitle: "暫時未有資料",
        noResults: "冇符合條件嘅結果",
    },
    errors: {
        unauthorized: "登入已失效，請重新登入",
        apiFailed: "暫時無法連接服務",
        apiFailedLogin: "暫時無法連接登入服務",
        notFound: "搵唔到指定資料",
        validation: "輸入資料無效",
        storageFailed: "無法讀取或儲存本機資料",
        conflictAlreadyMaterialized: "今日已經產生過交易",
        inUse: "資料仍然被使用，暫時不可刪除",
    },
    offline: {
        banner: "而家離線：資料只會儲存喺本機",
        stale: "資料可能未更新",
    },
    auth: {
        loginTitle: "登入",
        registerTitle: "註冊",
        username: "用戶名稱",
        password: "密碼",
        confirmPassword: "確認密碼",
        showPassword: "顯示密碼",
        hidePassword: "隱藏密碼",
        loginSubmit: "登入",
        registerSubmit: "註冊",
        genericFailure: "登入資料無效",
        signOut: "登出",
    },
} as const;

export type Messages = typeof messages;

/** 將 `{name}` 佔位換入實際值；缺少對應值就保留原本佔位，方便除錯。 */
export function formatMessage(template: string, values: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
        const value = values[key];
        return value === undefined ? `{${key}}` : String(value);
    });
}
