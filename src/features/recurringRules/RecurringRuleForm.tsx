import React from "react";
import {zodResolver} from "@hookform/resolvers/zod";
import {Alert, Button, Field, HStack, Input, NativeSelect, SimpleGrid, Stack, Textarea} from "@chakra-ui/react";
import {Controller, useForm, useWatch} from "react-hook-form";
import {useIntl} from "react-intl";
import {useBeforeUnload, useBlocker} from "react-router";
import {DrawerActions} from "@/components/layout/DrawerActions";
import {MerchantsRepository} from "@/data/merchantsRepository";
import {RecurringRulesRepository} from "@/data/recurringRulesRepository";
import type {Account, Category, Merchant, RecurringRule} from "@/data/types";
import {DirtyLeaveDialog} from "@/features/transactions/DirtyLeaveDialog";
import {MerchantAutocomplete} from "@/features/transactions/MerchantAutocomplete";
import {emptyRecurringRuleFormValues, formValuesToInput, RECURRING_WEEKDAY_MESSAGES, recurringRuleFormSchema, recurringRuleToFormValues} from "@/features/recurringRules/recurringRuleModel";
import type {RecurringRuleFormValues} from "@/features/recurringRules/recurringRuleModel";
import {formatMessage, messages} from "@/lib/i18n";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";

type RecurringRuleFormProps = {
    rule: RecurringRule | null;
    accounts: Account[];
    categories: Category[];
    merchants: Merchant[];
    onSaved: (rule: RecurringRule) => void;
    onCancel: () => void;
    onDirtyChange: (isDirty: boolean) => void;
};

const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;
const MONTHS = Array.from({length: 12}, (_, index) => index + 1);
const DAYS = Array.from({length: 31}, (_, index) => index + 1);

export const RecurringRuleForm = ({rule, accounts, categories, merchants, onSaved, onCancel, onDirtyChange}: RecurringRuleFormProps) => {
    const intl = useIntl();
    const token = useAuthStore(state => state.token);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [createdMerchant, setCreatedMerchant] = React.useState<Merchant | null>(null);
    const {control, register, handleSubmit, formState, setValue} = useForm<RecurringRuleFormValues>({
        resolver: zodResolver(recurringRuleFormSchema),
        defaultValues: rule === null ? emptyRecurringRuleFormValues(accounts[0]?.id ?? "") : recurringRuleToFormValues(rule),
    });

    const kind = useWatch({control, name: "kind"});
    const frequency = useWatch({control, name: "frequency"});
    const categoryId = useWatch({control, name: "categoryId"});
    const merchantId = useWatch({control, name: "merchantId"});
    const filteredCategories = categories.filter(category => category.kind === kind);

    React.useEffect(() => {
        if (token === null || createdMerchant === null || merchantId !== createdMerchant.id || categoryId === "") return;
        if (createdMerchant.default_category_id === categoryId) return;
        const updated: Merchant = {...createdMerchant, default_category_id: categoryId};
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCreatedMerchant(updated);
        useAppStore.getState().setMerchants(useAppStore.getState().merchants.map(merchant => (merchant.id === updated.id ? updated : merchant)));
        void new MerchantsRepository(token).update(updated.id, {name: updated.name, default_category_id: categoryId});
    }, [categoryId, createdMerchant, merchantId, token]);

    const shouldBlockNavigation = formState.isDirty && !formState.isSubmitting;
    const blocker = useBlocker(shouldBlockNavigation);
    useBeforeUnload(event => {
        if (!shouldBlockNavigation) return;
        event.preventDefault();
        event.returnValue = "";
    });

    React.useEffect(() => {
        onDirtyChange(formState.isDirty);
    }, [formState.isDirty, onDirtyChange]);

    const selectKind = (nextKind: "income" | "expense") => {
        setValue("kind", nextKind, {shouldDirty: true, shouldValidate: true});
        setValue("categoryId", "", {shouldDirty: true});
    };

    const selectMerchant = (merchant: Merchant | null) => {
        setValue("merchantId", merchant?.id ?? "", {shouldDirty: true, shouldValidate: true});
        const defaultCategoryId = merchant?.default_category_id ?? null;
        if (defaultCategoryId === null) return;
        const defaultCategory = categories.find(category => category.id === defaultCategoryId && category.kind === kind);
        if (defaultCategory === undefined) return;
        setValue("categoryId", defaultCategory.id, {shouldDirty: true, shouldValidate: true});
    };

    const submit = handleSubmit(async values => {
        if (token === null) return;
        setSubmitError(null);
        try {
            const input = formValuesToInput(values, rule ?? undefined);
            const repository = new RecurringRulesRepository(token);
            const result = rule === null ? await repository.create(input) : await repository.update(rule.id, input);
            if (!result.ok) {
                setSubmitError(result.error.message);
                return;
            }
            onSaved(result.value);
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : formatMessage(messages.validation.recurringInvalid));
        }
    });

    return (
        <React.Fragment>
            <form onSubmit={submit} noValidate>
                <Stack gap="5">
                    <Field.Root>
                        <Field.Label>{intl.formatMessage(messages.transactions.form.kind)}</Field.Label>
                        <HStack role="group" aria-label={intl.formatMessage(messages.transactions.form.kind)} gap="1" bg="gray.200" _dark={{bg: "gray.700"}} p="1" rounded="lg" width="full">
                            {(["income", "expense"] as const).map(value => (
                                <Button
                                    key={value}
                                    type="button"
                                    flex="1"
                                    variant={kind === value ? "solid" : "ghost"}
                                    colorPalette={kind === value ? "brand" : undefined}
                                    color={kind === value ? undefined : "fg"}
                                    _hover={kind === value ? undefined : {bg: "gray.300", _dark: {bg: "gray.600"}}}
                                    aria-pressed={kind === value}
                                    onClick={() => selectKind(value)}
                                >
                                    {intl.formatMessage(value === "income" ? messages.transactions.income : messages.transactions.expense)}
                                </Button>
                            ))}
                        </HStack>
                    </Field.Root>

                    <Field.Root required invalid={formState.errors.amount !== undefined}>
                        <Field.Label>{intl.formatMessage(messages.transactions.form.amount)}</Field.Label>
                        <Input inputMode="decimal" placeholder={intl.formatMessage(messages.transactions.form.amountPlaceholder)} {...register("amount")} />
                        {formState.errors.amount === undefined ? null : <Field.ErrorText>{formState.errors.amount.message}</Field.ErrorText>}
                    </Field.Root>

                    <Field.Root required invalid={formState.errors.accountId !== undefined}>
                        <Field.Label>{intl.formatMessage(messages.transactions.form.account)}</Field.Label>
                        <NativeSelect.Root>
                            <NativeSelect.Field {...register("accountId")}>
                                <option value="">{intl.formatMessage(messages.transactions.form.selectAccount)}</option>
                                {accounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.name}
                                    </option>
                                ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                        {formState.errors.accountId === undefined ? null : <Field.ErrorText>{formState.errors.accountId.message}</Field.ErrorText>}
                    </Field.Root>

                    <SimpleGrid columns={{base: 1, md: 2}} gap="4">
                        <Controller
                            name="merchantId"
                            control={control}
                            render={({field, fieldState}) => (
                                <MerchantAutocomplete merchants={merchants} value={field.value} onChange={selectMerchant} onCreated={setCreatedMerchant} error={fieldState.error?.message} />
                            )}
                        />

                        <Field.Root>
                            <Field.Label>{intl.formatMessage(messages.transactions.form.category)}</Field.Label>
                            <NativeSelect.Root>
                                <NativeSelect.Field {...register("categoryId")}>
                                    <option value="">{intl.formatMessage(messages.transactions.form.noCategory)}</option>
                                    {filteredCategories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                        </Field.Root>
                    </SimpleGrid>

                    <SimpleGrid columns={{base: 1, md: 2}} gap="4">
                        <Field.Root required>
                            <Field.Label>{intl.formatMessage(messages.recurring.frequencyLabel)}</Field.Label>
                            <NativeSelect.Root>
                                <NativeSelect.Field {...register("frequency")}>
                                    {FREQUENCIES.map(value => (
                                        <option key={value} value={value}>
                                            {intl.formatMessage(
                                                value === "daily"
                                                    ? messages.recurring.frequencyDaily
                                                    : value === "weekly"
                                                      ? messages.recurring.frequencyWeekly
                                                      : value === "monthly"
                                                        ? messages.recurring.frequencyMonthly
                                                        : messages.recurring.frequencyYearly
                                            )}
                                        </option>
                                    ))}
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                        </Field.Root>

                        <Field.Root required invalid={formState.errors.interval !== undefined}>
                            <Field.Label>{intl.formatMessage(messages.recurring.interval)}</Field.Label>
                            <Input inputMode="numeric" {...register("interval")} />
                            {formState.errors.interval === undefined ? (
                                <Field.HelperText>{intl.formatMessage(messages.recurring.intervalHint)}</Field.HelperText>
                            ) : (
                                <Field.ErrorText>{formState.errors.interval.message}</Field.ErrorText>
                            )}
                        </Field.Root>
                    </SimpleGrid>

                    {frequency === "weekly" ? (
                        <Field.Root required invalid={formState.errors.dayOfWeek !== undefined}>
                            <Field.Label>{intl.formatMessage(messages.recurring.dayOfWeek)}</Field.Label>
                            <NativeSelect.Root>
                                <NativeSelect.Field {...register("dayOfWeek")}>
                                    {RECURRING_WEEKDAY_MESSAGES.map((descriptor, index) => (
                                        <option key={descriptor.id} value={index}>
                                            {intl.formatMessage(descriptor)}
                                        </option>
                                    ))}
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                            {formState.errors.dayOfWeek === undefined ? null : <Field.ErrorText>{formState.errors.dayOfWeek.message}</Field.ErrorText>}
                        </Field.Root>
                    ) : null}

                    {frequency === "monthly" || frequency === "yearly" ? (
                        <SimpleGrid columns={{base: 1, md: frequency === "yearly" ? 2 : 1}} gap="4">
                            {frequency === "yearly" ? (
                                <Field.Root required invalid={formState.errors.monthOfYear !== undefined}>
                                    <Field.Label>{intl.formatMessage(messages.recurring.monthOfYear)}</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field {...register("monthOfYear")}>
                                            {MONTHS.map(month => (
                                                <option key={month} value={month}>
                                                    {`${month} 月`}
                                                </option>
                                            ))}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                    {formState.errors.monthOfYear === undefined ? null : <Field.ErrorText>{formState.errors.monthOfYear.message}</Field.ErrorText>}
                                </Field.Root>
                            ) : null}

                            <Field.Root required invalid={formState.errors.dayOfMonth !== undefined}>
                                <Field.Label>{intl.formatMessage(messages.recurring.dayOfMonth)}</Field.Label>
                                <NativeSelect.Root>
                                    <NativeSelect.Field {...register("dayOfMonth")}>
                                        {DAYS.map(day => (
                                            <option key={day} value={day}>
                                                {`${day} 日`}
                                            </option>
                                        ))}
                                    </NativeSelect.Field>
                                    <NativeSelect.Indicator />
                                </NativeSelect.Root>
                                {formState.errors.dayOfMonth === undefined ? null : <Field.ErrorText>{formState.errors.dayOfMonth.message}</Field.ErrorText>}
                            </Field.Root>
                        </SimpleGrid>
                    ) : null}

                    <SimpleGrid columns={{base: 1, md: 2}} gap="4">
                        <Field.Root required invalid={formState.errors.startOn !== undefined}>
                            <Field.Label>{intl.formatMessage(messages.recurring.startOn)}</Field.Label>
                            <Input type="date" {...register("startOn")} />
                            {formState.errors.startOn === undefined ? null : <Field.ErrorText>{formState.errors.startOn.message}</Field.ErrorText>}
                        </Field.Root>

                        <Field.Root invalid={formState.errors.endOn !== undefined}>
                            <Field.Label>{intl.formatMessage(messages.recurring.endOnOptional)}</Field.Label>
                            <Input type="date" {...register("endOn")} />
                            {formState.errors.endOn === undefined ? null : <Field.ErrorText>{formState.errors.endOn.message}</Field.ErrorText>}
                        </Field.Root>
                    </SimpleGrid>

                    <Field.Root>
                        <Field.Label>{intl.formatMessage(messages.transactions.form.note)}</Field.Label>
                        <Textarea rows={3} {...register("note")} />
                    </Field.Root>

                    {submitError === null ? null : (
                        <Alert.Root status="error" role="alert" rounded="lg">
                            <Alert.Indicator />
                            <Alert.Title>{submitError}</Alert.Title>
                        </Alert.Root>
                    )}

                    <DrawerActions py="2">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            {intl.formatMessage(messages.common.cancel)}
                        </Button>
                        <Button type="submit" loading={formState.isSubmitting} disabled={accounts.length === 0}>
                            {intl.formatMessage(rule === null ? messages.common.create : messages.common.save)}
                        </Button>
                    </DrawerActions>
                </Stack>
            </form>
            <DirtyLeaveDialog blocker={blocker} />
        </React.Fragment>
    );
};
