import {z} from "zod";

const uuid = z.string().uuid();
const currency = z.literal("HKD");
const dateTime = z.iso.datetime({offset: true});
const date = z.iso.date();
const nullableUuid = uuid.nullable();

export const authInputSchema = z.object({
    username: z.string().trim().min(1),
    password: z.string().min(8),
});

export const accountInputSchema = z.object({
    name: z.string().trim().min(1),
    kind: z.enum(["cash", "bank", "credit_card", "e_wallet", "other"]),
    currency,
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
    default_category_id: nullableUuid.optional(),
});

export const transactionInputSchema = z.object({
    account_id: uuid,
    category_id: nullableUuid.optional(),
    merchant_id: nullableUuid.optional(),
    kind: z.enum(["income", "expense", "transfer"]),
    amount_cents: z.number().int().min(1),
    currency: currency.default("HKD"),
    occurred_at: dateTime,
    note: z.string().nullable().optional(),
    payment_method: z.string().nullable().optional(),
    source: z.enum(["manual", "recurring", "ai", "import"]).default("manual"),
    transfer_account_id: nullableUuid.optional(),
    image_urls: z.array(z.string().url()).default([]),
});

export const recurringRuleInputSchema = z.object({
    account_id: uuid,
    category_id: nullableUuid.optional(),
    merchant_id: nullableUuid.optional(),
    kind: z.enum(["income", "expense"]),
    amount_cents: z.number().int().min(1),
    currency: currency.default("HKD"),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    interval: z.number().int().min(1).default(1),
    start_on: date,
    end_on: date.nullable().optional(),
    next_run_at: dateTime,
    day_of_week: z.number().int().min(0).max(6).optional(),
    day_of_month: z.number().int().min(1).max(31).optional(),
    month_of_year: z.number().int().min(1).max(12).optional(),
    status: z.enum(["active", "paused", "ended"]).default("active"),
    note: z.string().nullable().optional(),
});

export const userSchema = z.object({id: uuid, username: z.string().min(1), created_at: dateTime});
export const accountSchema = accountInputSchema.extend({
    id: uuid,
    created_at: dateTime,
    updated_at: dateTime,
    balance_cents: z.number().int(),
});
export const categorySchema = categoryInputSchema.extend({id: uuid, created_at: dateTime, updated_at: dateTime});
export const merchantSchema = merchantInputSchema.extend({
    id: uuid,
    usage_count: z.number().int().min(0),
    created_at: dateTime,
    updated_at: dateTime,
});
export const transactionSchema = transactionInputSchema.extend({
    id: uuid,
    refund_of_id: nullableUuid,
    net_amount_cents: z.number().int(),
    created_at: dateTime,
    updated_at: dateTime,
});
export const recurringRuleSchema = recurringRuleInputSchema.extend({
    id: uuid,
    status: z.enum(["active", "paused", "ended"]),
    note: z.string().nullable(),
    created_at: dateTime,
    updated_at: dateTime,
});

export const paginationMetaSchema = z.object({
    page: z.number().int().min(1),
    per_page: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    total_pages: z.number().int().min(0),
});

export const localErrorSchema = z.object({
    code: z.enum(["validation", "unauthorized", "not_found", "conflict_already_materialized", "in_use", "storage_failed"]),
    message: z.string(),
    fields: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
});

export const aiParsedFieldsSchema = z.object({
    amount_cents: z.number().int().positive().nullable().optional(),
    currency: currency.nullable().optional(),
    occurred_at: dateTime.nullable().optional(),
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

export type AuthInputSchema = z.infer<typeof authInputSchema>;
export type AccountInputSchema = z.infer<typeof accountInputSchema>;
export type CategoryInputSchema = z.infer<typeof categoryInputSchema>;
export type MerchantInputSchema = z.infer<typeof merchantInputSchema>;
export type TransactionInputSchema = z.infer<typeof transactionInputSchema>;
export type RecurringRuleInputSchema = z.infer<typeof recurringRuleInputSchema>;
