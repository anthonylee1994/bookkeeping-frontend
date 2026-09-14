import {z} from "zod";

/* ---------- 共用 primitive：input schema、entity schema、API response schema 都重用呢批 ---------- */

export const uuidSchema = z.string().uuid();
export const currencySchema = z.literal("HKD");
export const dateTimeSchema = z.iso.datetime({offset: true});
export const dateSchema = z.iso.date();
export const nullableUuidSchema = uuidSchema.nullable();
export const imageUrlSchema = z.union([z.string().url(), z.string().regex(/^\/(?!\/)/)]);

/* ---------- Input schema（對 swagger *Input payload） ---------- */

export const authInputSchema = z.object({
    username: z.string().trim().min(1),
    password: z.string().min(8),
});

export const accountInputSchema = z.object({
    name: z.string().trim().min(1),
    kind: z.enum(["cash", "bank", "credit_card", "e_wallet", "other"]),
    currency: currencySchema,
    initial_balance_cents: z.number().int().default(0),
    icon: z.string().trim().optional(),
    color: z.string().trim().optional(),
});

export const categoryInputSchema = z.object({
    name: z.string().trim().min(1),
    kind: z.enum(["income", "expense"]),
    position: z.number().int().default(0),
    icon: z.string().trim().optional(),
    color: z.string().trim().optional(),
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

/** Update 唔可以改 `source`。 */
export const transactionUpdateInputSchema = transactionInputSchema.omit({source: true});

export const refundInputSchema = z.object({
    amount_cents: z.number().int().min(1),
    occurred_at: dateTimeSchema,
    note: z.string().nullable().optional(),
});

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
    day_of_week: z.number().int().min(0).max(6).optional(),
    day_of_month: z.number().int().min(1).max(31).optional(),
    month_of_year: z.number().int().min(1).max(12).optional(),
    status: z.enum(["active", "paused", "ended"]).default("active"),
    note: z.string().nullable().optional(),
});

/* ---------- Entity schema（input + id／timestamps／derived fields） ---------- */

export const userSchema = z.object({id: uuidSchema, username: z.string().min(1), created_at: dateTimeSchema});

export const accountSchema = accountInputSchema.extend({
    id: uuidSchema,
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema,
    balance_cents: z.number().int(),
});

export const categorySchema = categoryInputSchema.extend({id: uuidSchema, created_at: dateTimeSchema, updated_at: dateTimeSchema});

export const merchantSchema = merchantInputSchema.extend({
    id: uuidSchema,
    usage_count: z.number().int().min(0),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema,
});

export const transactionSchema = transactionInputSchema.extend({
    id: uuidSchema,
    refund_of_id: nullableUuidSchema,
    net_amount_cents: z.number().int(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema,
});

export const recurringRuleSchema = recurringRuleInputSchema.extend({
    id: uuidSchema,
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
    amount_cents: z.number().int().positive().nullable().optional(),
    currency: currencySchema.nullable().optional(),
    occurred_at: dateTimeSchema.nullable().optional(),
    merchant_name: z.string().nullable().optional(),
    category_name: z.string().nullable().optional(),
    payment_method: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
});

export const aiPreviewSchema = z.object({
    confidence: z.number().min(0).max(1),
    parsed: aiParsedFieldsSchema,
    missing_fields: z.array(z.string()),
    low_confidence_fields: z.array(z.string()),
    image_url: z.string().url().optional(),
});
