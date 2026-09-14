import {z} from "zod";
import {accountSchema, aiPreviewSchema, categorySchema, merchantSchema, paginationMetaSchema, recurringRuleSchema, transactionSchema} from "./schema";

function listResponseSchema<T extends z.ZodType>(key: string, itemSchema: T) {
    const items = z.array(itemSchema);
    return z.union([items, z.object({[key]: items})]).transform(value => (Array.isArray(value) ? value : value[key]));
}

export const accountsResponseSchema = listResponseSchema("accounts", accountSchema);
export const accountResponseSchema = z.union([accountSchema, z.object({account: accountSchema}).transform(value => value.account)]);
export const categoriesResponseSchema = listResponseSchema("categories", categorySchema);
export const categoryResponseSchema = z.union([categorySchema, z.object({category: categorySchema}).transform(value => value.category)]);
export const merchantsResponseSchema = listResponseSchema("merchants", merchantSchema);
export const merchantResponseSchema = z.union([merchantSchema, z.object({merchant: merchantSchema}).transform(value => value.merchant)]);
export const transactionResponseSchema = z.union([transactionSchema, z.object({transaction: transactionSchema}).transform(value => value.transaction)]);
export const recurringRulesResponseSchema = listResponseSchema("recurring_rules", recurringRuleSchema);
export const recurringRuleResponseSchema = z.union([recurringRuleSchema, z.object({recurring_rule: recurringRuleSchema}).transform(value => value.recurring_rule)]);
export const aiResponseSchema = z.union([aiPreviewSchema, z.object({preview: aiPreviewSchema}).transform(value => value.preview)]);

export const paginatedTransactionsResponseSchema = z
    .union([
        z.object({data: z.array(transactionSchema), meta: paginationMetaSchema}),
        z.object({transactions: z.array(transactionSchema), meta: paginationMetaSchema}).transform(value => ({data: value.transactions, meta: value.meta})),
    ])
    .transform(value => value);

const amountDistributionSchema = z.object({id: z.string().uuid().nullable(), name: z.string(), amount_cents: z.number().int()});
const transferSummarySchema = z.object({count: z.number().int().min(0), amount_cents: z.number().int()});

export const summaryResponseSchema = z.object({
    period: z.enum(["daily", "weekly", "monthly"]),
    from: z.string(),
    to: z.string(),
    income_cents: z.number().int(),
    expense_cents: z.number().int(),
    refund_cents: z.number().int(),
    net_cents: z.number().int(),
    category_distribution: z.array(amountDistributionSchema),
    account_distribution: z.array(amountDistributionSchema),
    transfers: transferSummarySchema,
    transactions: paginatedTransactionsResponseSchema,
});

export const dashboardResponseSchema = z.object({
    from: z.string(),
    to: z.string(),
    income_cents: z.number().int(),
    expense_cents: z.number().int(),
    refund_cents: z.number().int(),
    net_cents: z.number().int(),
    top_expense_categories: z.array(amountDistributionSchema),
    account_balances: z.array(accountSchema),
    upcoming_recurring_rules: z.array(recurringRuleSchema),
    recent_transactions: z.array(transactionSchema),
});

export const receiptUploadResponseSchema = z.object({image_url: z.string().min(1), sha256: z.string().regex(/^[a-f\d]{64}$/i)});
export const skipNextResponseSchema = z.object({rule: recurringRuleSchema, skipped_date: z.string()});
