import {z} from "zod";
import {
    accountSchema,
    aiPreviewSchema,
    categorySchema,
    categorySuggestionSchema,
    merchantSchema,
    paginationMetaSchema,
    recurringRuleInputSchema,
    recurringRuleSchema,
    responseCentsSchema,
    summaryInsightSchema,
    transactionRowSchema,
    transactionSchema,
    userSchema,
    uuidSchema,
} from "./schema";
import type {AuthSession} from "./types";

/* ---------- Envelope helper：backend 有時回裸 array／object，有時回 keyed envelope ---------- */

/** `[...]` 或 `{<key>: [...]}` → `[...]` */
export function listResponseSchema<Item>(key: string, itemSchema: z.ZodType<Item>) {
    const items = z.array(itemSchema);
    return z.union([items, z.object({[key]: items}).transform(value => value[key])]);
}

/** `<item>` 或 `{<key>: <item>}` → `<item>` */
export function itemResponseSchema<Item>(key: string, itemSchema: z.ZodType<Item>) {
    return z.union([itemSchema, z.object({[key]: itemSchema}).transform(value => value[key])]);
}

/* ---------- Auth ---------- */

export const authResponseSchema = z
    .object({
        token: z.string().min(1).optional(),
        access_token: z.string().min(1).optional(),
        user: userSchema,
    })
    .transform(value => ({token: value.token ?? value.access_token, user: value.user}))
    .refine((value): value is AuthSession => value.token !== undefined, {message: "Token is required"});

export const userResponseSchema = itemResponseSchema("user", userSchema);

/* ---------- Domain entity ---------- */

export const accountsResponseSchema = listResponseSchema("accounts", accountSchema);
export const accountResponseSchema = itemResponseSchema("account", accountSchema);

export const categoriesResponseSchema = listResponseSchema("categories", categorySchema);
export const categoryResponseSchema = itemResponseSchema("category", categorySchema);

export const merchantsResponseSchema = listResponseSchema("merchants", merchantSchema);
export const merchantResponseSchema = itemResponseSchema("merchant", merchantSchema);

export const transactionResponseSchema = itemResponseSchema("transaction", transactionSchema);
export const transactionRowResponseSchema = itemResponseSchema("transaction", transactionRowSchema);

export const recurringRulesResponseSchema = listResponseSchema("recurring_rules", recurringRuleSchema);
export const recurringRuleResponseSchema = itemResponseSchema("recurring_rule", recurringRuleSchema);

export const aiResponseSchema = itemResponseSchema("preview", aiPreviewSchema);

export const categorySuggestionResponseSchema = categorySuggestionSchema;

export const paginatedTransactionsResponseSchema = z.union([
    z.object({data: z.array(transactionSchema), meta: paginationMetaSchema}),
    z.object({transactions: z.array(transactionSchema), meta: paginationMetaSchema}).transform(value => ({data: value.transactions, meta: value.meta})),
]);

export const paginatedTransactionRowsResponseSchema = z.union([
    z.object({data: z.array(transactionRowSchema), meta: paginationMetaSchema}),
    z.object({transactions: z.array(transactionRowSchema), meta: paginationMetaSchema}).transform(value => ({data: value.transactions, meta: value.meta})),
]);

/* ---------- Dashboard／summary ---------- */

const rangeSchema = z.object({from: z.string(), to: z.string()});
const dailyBreakdownSchema = z.object({
    date: z.iso.date(),
    net_cents: responseCentsSchema,
});
const categoryBreakdownSchema = z.object({
    category_id: uuidSchema.nullable(),
    name: z.string().nullable(),
    income_cents: responseCentsSchema.default(0),
    expense_cents: responseCentsSchema,
});
const accountBreakdownSchema = z.object({
    account_id: uuidSchema.nullable(),
    name: z.string().nullable(),
    income_cents: responseCentsSchema,
    expense_cents: responseCentsSchema,
});
const accountBalanceSchema = z.object({
    id: uuidSchema,
    name: z.string(),
    currency: z.literal("HKD"),
    initial_balance_cents: responseCentsSchema,
    balance_cents: responseCentsSchema,
});
const transferSummarySchema = z.object({count: z.number().int().min(0), total_cents: responseCentsSchema});
const recurringRuleSummarySchema = recurringRuleInputSchema.extend({id: uuidSchema, amount_cents: responseCentsSchema});

export const summaryResponseSchema = z.object({
    range: rangeSchema,
    income_cents: responseCentsSchema,
    expense_cents: responseCentsSchema,
    net_cents: responseCentsSchema,
    daily: z.array(dailyBreakdownSchema).default([]),
    by_category: z.array(categoryBreakdownSchema),
    by_account: z.array(accountBreakdownSchema),
    transfers: transferSummarySchema,
    transactions: paginatedTransactionRowsResponseSchema,
});

export const summaryInsightResponseSchema = summaryInsightSchema;

export const dashboardResponseSchema = z.object({
    range: rangeSchema,
    income_cents: responseCentsSchema,
    expense_cents: responseCentsSchema,
    net_cents: responseCentsSchema,
    recent_transactions: z.array(transactionRowSchema),
    by_category: z.array(categoryBreakdownSchema),
    accounts: z.array(accountBalanceSchema),
    account_balances: z.array(accountBalanceSchema),
    upcoming_recurring: z.array(recurringRuleSummarySchema),
    recurring_reminders: z.array(recurringRuleSummarySchema),
});

/* ---------- Receipt／recurring action ---------- */

export const receiptUploadResponseSchema = z.object({url: z.string().min(1), sha256: z.string().regex(/^[a-f\d]{64}$/i)});
