import {createIntl, createIntlCache} from "react-intl";
import type {IntlShape, MessageDescriptor, PrimitiveType} from "react-intl";

/**
 * 顯示語言。MVP 只有繁體中文（香港），冇語言切換器；
 * 將來加語言先喺呢度擴充，唔好喺 feature 散落 hardcode 字串。
 */
export const DEFAULT_LOCALE = "zh-HK";

/**
 * 全 app 文案集中一處，每個 leaf 都係 react-intl 嘅 MessageDescriptor。
 * `id` 用嚟做 catalog key／翻譯 lookup，`defaultMessage` 係繁中預設文案。
 */
export const messages = {
    app: {
        name: {id: "app.name", defaultMessage: "簡單記帳"},
        shortName: {id: "app.shortName", defaultMessage: "記帳"},
        description: {id: "app.description", defaultMessage: "簡單清晰的記帳工具"},
    },
    nav: {
        dashboard: {id: "nav.dashboard", defaultMessage: "首頁"},
        transactions: {id: "nav.transactions", defaultMessage: "交易"},
        scan: {id: "nav.scan", defaultMessage: "掃描"},
        summaries: {id: "nav.summaries", defaultMessage: "報表"},
        recurringRules: {id: "nav.recurringRules", defaultMessage: "定期交易"},
        settings: {id: "nav.settings", defaultMessage: "設定"},
    },
    common: {
        create: {id: "common.create", defaultMessage: "新增"},
        save: {id: "common.save", defaultMessage: "儲存"},
        edit: {id: "common.edit", defaultMessage: "修改"},
        delete: {id: "common.delete", defaultMessage: "刪除"},
        cancel: {id: "common.cancel", defaultMessage: "取消"},
        confirm: {id: "common.confirm", defaultMessage: "確認"},
        close: {id: "common.close", defaultMessage: "關閉"},
        back: {id: "common.back", defaultMessage: "返回"},
        retry: {id: "common.retry", defaultMessage: "重試"},
        clearFilters: {id: "common.clearFilters", defaultMessage: "清除篩選"},
        loading: {id: "common.loading", defaultMessage: "載入中…"},
        emptyTitle: {id: "common.emptyTitle", defaultMessage: "暫時未有資料"},
        noResults: {id: "common.noResults", defaultMessage: "冇符合條件嘅結果"},
    },
    errors: {
        unauthorized: {id: "errors.unauthorized", defaultMessage: "登入已失效，請重新登入"},
        apiFailed: {id: "errors.apiFailed", defaultMessage: "暫時無法連接服務"},
        apiFailedLogin: {id: "errors.apiFailedLogin", defaultMessage: "暫時無法連接登入服務"},
        notFound: {id: "errors.notFound", defaultMessage: "搵唔到指定資料"},
        validation: {id: "errors.validation", defaultMessage: "輸入資料無效"},
        storageFailed: {id: "errors.storageFailed", defaultMessage: "無法讀取或儲存本機資料"},
        conflictAlreadyMaterialized: {id: "errors.conflictAlreadyMaterialized", defaultMessage: "今日已經產生過交易"},
        inUse: {id: "errors.inUse", defaultMessage: "資料仍然被使用，暫時不可刪除"},
    },
    validation: {
        accountInvalid: {id: "validation.accountInvalid", defaultMessage: "帳戶資料無效"},
        categoryInvalid: {id: "validation.categoryInvalid", defaultMessage: "分類資料無效"},
        merchantInvalid: {id: "validation.merchantInvalid", defaultMessage: "商戶資料無效"},
        transactionInvalid: {id: "validation.transactionInvalid", defaultMessage: "交易資料無效"},
        refundInvalid: {id: "validation.refundInvalid", defaultMessage: "退款資料無效"},
        recurringInvalid: {id: "validation.recurringInvalid", defaultMessage: "定期交易資料無效"},
        reportDateInvalid: {id: "validation.reportDateInvalid", defaultMessage: "報表日期無效"},
        dashboardDateInvalid: {id: "validation.dashboardDateInvalid", defaultMessage: "Dashboard 日期無效"},
        paginationInvalid: {id: "validation.paginationInvalid", defaultMessage: "頁碼必須大過 0，每頁數量必須係 1 至 {maxPerPage}"},
        idempotencyKeyInvalid: {id: "validation.idempotencyKeyInvalid", defaultMessage: "Idempotency key 無效"},
        aiLogIdInvalid: {id: "validation.aiLogIdInvalid", defaultMessage: "AI log id 無效"},
        receiptImageUrlInvalid: {id: "validation.receiptImageUrlInvalid", defaultMessage: "單據圖片網址無效"},
        receiptTypeUnsupported: {id: "validation.receiptTypeUnsupported", defaultMessage: "只支援 JPEG、PNG 或 WebP 圖片"},
        receiptTooLarge: {id: "validation.receiptTooLarge", defaultMessage: "圖片不可大過 10 MiB"},
        loginInvalid: {id: "validation.loginInvalid", defaultMessage: "請輸入有效登入資料"},
        tokenInvalid: {id: "validation.tokenInvalid", defaultMessage: "Token 無效"},
        authStorageFailed: {id: "validation.authStorageFailed", defaultMessage: "無法儲存登入資料"},
        transferAccountRequired: {id: "validation.transferAccountRequired", defaultMessage: "轉帳必須選擇轉入帳戶"},
        transferSameAccount: {id: "validation.transferSameAccount", defaultMessage: "轉出同轉入帳戶不可相同"},
        transferCategoryNotAllowed: {id: "validation.transferCategoryNotAllowed", defaultMessage: "轉帳不可設定分類"},
        transferMerchantNotAllowed: {id: "validation.transferMerchantNotAllowed", defaultMessage: "轉帳不可設定商戶"},
        transferAccountNotAllowed: {id: "validation.transferAccountNotAllowed", defaultMessage: "收入或支出不可設定轉入帳戶"},
        weeklyNeedsDayOfWeek: {id: "validation.weeklyNeedsDayOfWeek", defaultMessage: "每週定期交易必須選擇星期"},
        monthlyNeedsDayOfMonth: {id: "validation.monthlyNeedsDayOfMonth", defaultMessage: "定期交易必須選擇日期"},
        yearlyNeedsMonthOfYear: {id: "validation.yearlyNeedsMonthOfYear", defaultMessage: "每年定期交易必須選擇月份"},
        responseFormatInvalid: {id: "validation.responseFormatInvalid", defaultMessage: "服務回應格式無效"},
        amountInvalidFormat: {id: "validation.amountInvalidFormat", defaultMessage: "請輸入有效金額，最多兩位小數"},
        amountTooLarge: {id: "validation.amountTooLarge", defaultMessage: "金額太大"},
        amountNotPositive: {id: "validation.amountNotPositive", defaultMessage: "金額必須大過零"},
    },
    fields: {
        required: {id: "fields.required", defaultMessage: "必填"},
        transferSameAsSource: {id: "fields.transferSameAsSource", defaultMessage: "不可與轉出帳戶相同"},
        transferNotApplicable: {id: "fields.transferNotApplicable", defaultMessage: "轉帳不適用"},
        incomeExpenseNotApplicable: {id: "fields.incomeExpenseNotApplicable", defaultMessage: "收入或支出不適用"},
        fileTypeUnsupported: {id: "fields.fileTypeUnsupported", defaultMessage: "檔案類型不支援"},
        fileTooLarge: {id: "fields.fileTooLarge", defaultMessage: "檔案太大"},
        usernameRequired: {id: "fields.usernameRequired", defaultMessage: "用戶名稱為必填"},
        passwordTooShort: {id: "fields.passwordTooShort", defaultMessage: "密碼最少需要 8 個字元"},
    },
    runtime: {
        invalidDate: {id: "runtime.invalidDate", defaultMessage: "無效日期"},
        isoFormatRequired: {id: "runtime.isoFormatRequired", defaultMessage: "日期必須使用 YYYY-MM-DD 格式"},
        positiveInteger: {id: "runtime.positiveInteger", defaultMessage: "{name} 必須係正整數"},
        periodAmountInteger: {id: "runtime.periodAmountInteger", defaultMessage: "period amount 必須係整數"},
        dayOfWeekRange: {id: "runtime.dayOfWeekRange", defaultMessage: "day_of_week 必須係 0 至 6"},
        dayOfMonthRange: {id: "runtime.dayOfMonthRange", defaultMessage: "day_of_month 必須係 1 至 31"},
        monthOfYearRange: {id: "runtime.monthOfYearRange", defaultMessage: "month_of_year 必須係 1 至 12"},
        centsNotSafeInteger: {id: "runtime.centsNotSafeInteger", defaultMessage: "金額必須係安全整數 cents"},
    },
    offline: {
        banner: {id: "offline.banner", defaultMessage: "而家離線：資料只會儲存喺本機"},
        stale: {id: "offline.stale", defaultMessage: "資料可能未更新"},
    },
    auth: {
        loginTitle: {id: "auth.loginTitle", defaultMessage: "登入"},
        registerTitle: {id: "auth.registerTitle", defaultMessage: "註冊"},
        username: {id: "auth.username", defaultMessage: "用戶名稱"},
        password: {id: "auth.password", defaultMessage: "密碼"},
        confirmPassword: {id: "auth.confirmPassword", defaultMessage: "確認密碼"},
        showPassword: {id: "auth.showPassword", defaultMessage: "顯示密碼"},
        hidePassword: {id: "auth.hidePassword", defaultMessage: "隱藏密碼"},
        loginSubmit: {id: "auth.loginSubmit", defaultMessage: "登入"},
        registerSubmit: {id: "auth.registerSubmit", defaultMessage: "註冊"},
        genericFailure: {id: "auth.genericFailure", defaultMessage: "登入資料無效"},
        signOut: {id: "auth.signOut", defaultMessage: "登出"},
    },
    transactions: {
        refundSuffix: {id: "transactions.refundSuffix", defaultMessage: "退款"},
    },
    pagination: {
        label: {id: "pagination.label", defaultMessage: "分頁"},
        previous: {id: "pagination.previous", defaultMessage: "上一頁"},
        next: {id: "pagination.next", defaultMessage: "下一頁"},
        morePages: {id: "pagination.morePages", defaultMessage: "更多頁數"},
        goToPrevious: {id: "pagination.goToPrevious", defaultMessage: "去上一頁"},
        goToNext: {id: "pagination.goToNext", defaultMessage: "去下一頁"},
    },
} as const;

export type Messages = typeof messages;

function isMessageDescriptor(value: unknown): value is MessageDescriptor {
    return typeof value === "object" && value !== null && typeof (value as MessageDescriptor).id === "string";
}

/** 將 nested descriptor tree 攤平成 react-intl Provider 要嘅 `{id: defaultMessage}` catalog。 */
function flattenMessages(tree: Record<string, unknown>, prefix = ""): Record<string, string> {
    const catalog: Record<string, string> = {};
    for (const [key, value] of Object.entries(tree)) {
        const fallbackId = prefix === "" ? key : `${prefix}.${key}`;
        if (isMessageDescriptor(value)) {
            const id = value.id ?? fallbackId;
            catalog[id] = typeof value.defaultMessage === "string" ? value.defaultMessage : id;
        } else if (typeof value === "object" && value !== null) {
            Object.assign(catalog, flattenMessages(value as Record<string, unknown>, fallbackId));
        }
    }
    return catalog;
}

export const intlMessages: Record<string, string> = flattenMessages(messages);

const intlCache = createIntlCache();
export const intl: IntlShape = createIntl({locale: DEFAULT_LOCALE, defaultLocale: DEFAULT_LOCALE, messages: intlMessages}, intlCache);

/** 非 React context（例如 data layer）用嘅格式化入口；component 內請用 `useIntl()`。 */
export function formatMessage(descriptor: MessageDescriptor, values?: Record<string, PrimitiveType>): string {
    return intl.formatMessage(descriptor, values);
}
