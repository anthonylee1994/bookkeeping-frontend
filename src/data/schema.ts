import {z} from "zod";

/* ---------- 共用 primitive：input schema、entity schema、API response schema 都重用這批 ---------- */

export const uuidSchema = z.string().uuid();
export const currencySchema = z.literal("HKD");
export const dateTimeSchema = z.iso.datetime({offset: true});
export const dateSchema = z.iso.date();
export const nullableUuidSchema = uuidSchema.nullable();
export const imageUrlSchema = z.union([z.string().url(), z.string().regex(/^\/(?!\/)/)]);

/**
 * Response 專用嘅 cents schema。後端回傳嘅金額有機會超出 JS safe integer，
 * 而 zod v4 嘅 `.int()` 會封頂喺 `Number.MAX_SAFE_INTEGER`，用咗會令成個 response
 * parse 失敗，所以讀取 response 嘅金額欄位一律用呢個，唔加 `.int()`。
 */
export const responseCentsSchema = z.number();

/* ---------- Input schema（對 swagger *Input payload） ---------- */

export const authInputSchema = z.object({
    username: z.string().trim().min(1),
    password: z.string().min(8),
});

export const changePasswordInputSchema = z
    .object({
        password_challenge: z.string().min(1),
        password: z.string().min(8),
        password_confirmation: z.string().min(1),
    })
    .refine(value => value.password === value.password_confirmation);

export const accountInputSchema = z.object({
    name: z.string().trim().min(1),
    kind: z.enum(["cash", "bank", "credit_card", "e_wallet", "other"]),
    currency: currencySchema,
    initial_balance_cents: z.number().int().default(0),
    icon: z.string().trim().nullish(),
    color: z.string().trim().nullish(),
});

export const categoryInputSchema = z.object({
    name: z.string().trim().min(1),
    kind: z.enum(["income", "expense"]),
    icon: z.string().trim().nullish(),
    color: z.string().trim().nullish(),
});

export const merchantInputSchema = z.object({
    name: z.string().trim().min(1),
    default_category_id: nullableUuidSchema.optional(),
});

export const transactionInputSchema = z.object({
    account_id: uuidSchema,
    category_id: nullableUuidSchema.optional(),
    merchant_id: nullableUuidSchema.optional(),
    kind: z.enum(["income", "expense", "transfer"]),
    amount_cents: z.number().int().min(1),
    currency: currencySchema.default("HKD"),
    occurred_at: dateTimeSchema,
    note: z.string().nullable().optional(),
    payment_method: z.string().nullable().optional(),
    source: z.enum(["manual", "recurring", "ai", "import"]).default("manual"),
    transfer_account_id: nullableUuidSchema.optional(),
    image_urls: z.array(imageUrlSchema).default([]),
});

/** Update 不可以改 `source`。 */
export const transactionUpdateInputSchema = transactionInputSchema.omit({source: true});

export const recurringRuleInputSchema = z.object({
    account_id: uuidSchema,
    category_id: nullableUuidSchema.optional(),
    merchant_id: nullableUuidSchema.optional(),
    kind: z.enum(["income", "expense"]),
    amount_cents: z.number().int().min(1),
    currency: currencySchema.default("HKD"),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    interval: z.number().int().min(1).default(1),
    start_on: dateSchema,
    end_on: dateSchema.nullable().optional(),
    next_run_at: dateTimeSchema,
    day_of_week: z.number().int().min(0).max(6).nullish(),
    day_of_month: z.number().int().min(1).max(31).nullish(),
    month_of_year: z.number().int().min(1).max(12).nullish(),
    status: z.enum(["active", "paused", "ended"]).default("active"),
    note: z.string().nullable().optional(),
});

/* ---------- Entity schema（input + id／timestamps／derived fields） ---------- */

export const userSchema = z.object({id: uuidSchema, username: z.string().min(1), timezone: z.string().min(1), currency: currencySchema});

export const accountSchema = accountInputSchema.extend({
    id: uuidSchema,
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema,
    initial_balance_cents: responseCentsSchema,
    balance_cents: responseCentsSchema.optional(),
});

export const categorySchema = categoryInputSchema.extend({id: uuidSchema, created_at: dateTimeSchema, updated_at: dateTimeSchema});

export const merchantSchema = merchantInputSchema.extend({
    id: uuidSchema,
    usage_count: z.number().int().min(0),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema,
});

export const transactionRowSchema = transactionInputSchema.extend({
    id: uuidSchema,
    amount_cents: responseCentsSchema,
});

export const transactionSchema = transactionRowSchema.extend({
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema,
});

export const recurringRuleSchema = recurringRuleInputSchema.extend({
    id: uuidSchema,
    amount_cents: responseCentsSchema,
    status: z.enum(["active", "paused", "ended"]),
    note: z.string().nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema,
});

export const paginationMetaSchema = z.object({
    page: z.number().int().min(1),
    per_page: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    total_pages: z.number().int().min(0),
});

/* ---------- AI preview ---------- */

export const aiParsedFieldsSchema = z.object({
    amount_cents: responseCentsSchema.positive().nullish(),
    kind: z.enum(["income", "expense"]).nullish(),
    occurred_at: z.string().nullish(),
    merchant_name: z.string().nullish(),
    category_hint: z.string().nullish(),
    note: z.string().nullish(),
    confidence: z.number().nullish(),
});

export const aiParsedItemSchema = z.object({
    parsed: aiParsedFieldsSchema,
    suggested_category_id: uuidSchema.nullish(),
});

export const aiPreviewSchema = z.object({
    id: uuidSchema,
    source: z.enum(["receipt", "text"]).optional(),
    image_urls: z.array(imageUrlSchema),
    sha256: z.string(),
    status: z.enum(["success", "partial", "failed"]),
    parsed: aiParsedFieldsSchema.nullable(),
    suggested_category_id: uuidSchema.nullish(),
    parsed_items: z.array(aiParsedItemSchema).default([]),
    raw_response: z.string().nullish(),
    error: z.string().nullish(),
    tokens_in: z.number().nullish(),
    tokens_out: z.number().nullish(),
    latency_ms: z.number().nullish(),
});

export const aiQueryFiltersSchema = z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    kind: z.enum(["income", "expense", "transfer"]).optional(),
    account_id: uuidSchema.optional(),
    category_id: uuidSchema.optional(),
    merchant_id: uuidSchema.optional(),
    q: z.string().optional(),
    min: responseCentsSchema.nonnegative().optional(),
    max: responseCentsSchema.nonnegative().optional(),
});

export const aiQuerySchema = z.object({
    status: z.enum(["success", "partial"]),
    filters: aiQueryFiltersSchema.nullable(),
    explanation: z.string().nullish(),
    error: z.string().nullish(),
    tokens_in: z.number().nullish(),
    tokens_out: z.number().nullish(),
    latency_ms: z.number().nullish(),
});

export const categorySuggestionSchema = z.object({
    status: z.enum(["success", "partial"]),
    category_id: uuidSchema.nullable(),
    category_name: z.string().nullable(),
    confidence: z.number().nullable(),
    error: z.string().nullish(),
    tokens_in: z.number().nullish(),
    tokens_out: z.number().nullish(),
    latency_ms: z.number().nullish(),
});

export const summaryInsightSchema = z.object({
    period: z.enum(["daily", "weekly", "monthly"]),
    range: z.object({from: z.string(), to: z.string()}),
    status: z.enum(["success", "failed", "empty"]),
    text: z.string().nullable(),
    highlights: z.array(z.string()).default([]),
    cached: z.boolean(),
    generated_at: dateTimeSchema.nullable(),
    error: z.string().nullable(),
});
