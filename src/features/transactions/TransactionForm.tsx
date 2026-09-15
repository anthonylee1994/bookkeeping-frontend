import React from "react";
import {zodResolver} from "@hookform/resolvers/zod";
import {Alert, Box, Button, Field, HStack, Image, Input, Link as ChakraLink, NativeSelect, SimpleGrid, Stack, Text, Textarea} from "@chakra-ui/react";
import {Controller, useForm, useWatch} from "react-hook-form";
import {useIntl} from "react-intl";
import {useBeforeUnload, useBlocker, useNavigate, Link as RouterLink} from "react-router";
import {TransactionsRepository} from "@/data/transactionsRepository";
import type {Account, Category, Merchant, Transaction, TransactionKind} from "@/data/types";
import {DirtyLeaveDialog} from "@/features/transactions/DirtyLeaveDialog";
import {MerchantAutocomplete} from "@/features/transactions/MerchantAutocomplete";
import {emptyTransactionFormValues, formValuesToInput, transactionFormSchema, transactionToFormValues} from "@/features/transactions/TransactionFormModel";
import type {TransactionFormValues} from "@/features/transactions/TransactionFormModel";
import {messages} from "@/lib/i18n";
import {createId} from "@/lib/id";
import {ROUTES, transactionDetailPath} from "@/routes/paths";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";

type TransactionFormProps = {
    transaction: Transaction | null;
    accounts: Account[];
    categories: Category[];
    merchants: Merchant[];
};

const KINDS: TransactionKind[] = ["income", "expense", "transfer"];

export const TransactionForm = ({transaction, accounts, categories, merchants}: TransactionFormProps) => {
    const intl = useIntl();
    const navigate = useNavigate();
    const token = useAuthStore(state => state.token);
    const [idempotencyKey] = React.useState(createId);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const {control, register, handleSubmit, reset, setValue, formState} = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionFormSchema),
        defaultValues:
            transaction === null
                ? {
                      ...emptyTransactionFormValues(),
                      accountId: accounts[0]?.id ?? "",
                  }
                : transactionToFormValues(transaction),
    });

    const kind = useWatch({control, name: "kind"});
    const accountId = useWatch({control, name: "accountId"});
    const categoryId = useWatch({control, name: "categoryId"});
    const merchantId = useWatch({control, name: "merchantId"});
    const selectedMerchant = merchants.find(merchant => merchant.id === merchantId) ?? null;
    const suggestedCategory =
        selectedMerchant?.default_category_id === undefined || selectedMerchant.default_category_id === null
            ? null
            : (categories.find(category => category.id === selectedMerchant.default_category_id && category.kind === kind) ?? null);
    const filteredCategories = categories.filter(category => category.kind === kind);

    const shouldBlockNavigation = formState.isDirty && !formState.isSubmitting;
    const blocker = useBlocker(shouldBlockNavigation);
    useBeforeUnload(event => {
        if (!shouldBlockNavigation) return;
        event.preventDefault();
        event.returnValue = "";
    });

    const selectKind = (nextKind: TransactionKind) => {
        setValue("kind", nextKind, {shouldDirty: true, shouldValidate: true});
        if (nextKind === "transfer") {
            setValue("categoryId", "", {shouldDirty: true});
            setValue("merchantId", "", {shouldDirty: true});
        } else {
            setValue("transferAccountId", "", {shouldDirty: true});
        }
    };

    const selectMerchant = (merchant: Merchant | null) => {
        setValue("merchantId", merchant?.id ?? "", {shouldDirty: true, shouldValidate: true});
    };

    const submit = handleSubmit(async values => {
        if (token === null) return;
        setSubmitError(null);
        const repository = new TransactionsRepository(token);
        const input = formValuesToInput(values, transaction?.image_urls ?? []);
        const result = transaction === null ? await repository.create(input, idempotencyKey) : await repository.update(transaction.id, input);
        if (!result.ok) {
            setSubmitError(result.error.message);
            return;
        }

        const current = useAppStore.getState().transactions;
        const next = transaction === null ? [result.value, ...current] : current.map(item => (item.id === result.value.id ? result.value : item));
        useAppStore.getState().setTransactions(next, useAppStore.getState().transactionsMeta);
        reset(transactionToFormValues(result.value));
        navigate(transactionDetailPath(result.value.id), {replace: true});
    });

    const cancel = () => navigate(transaction === null ? ROUTES.transactions : transactionDetailPath(transaction.id));
    const kindLabel = (value: TransactionKind) =>
        intl.formatMessage(value === "income" ? messages.transactions.income : value === "expense" ? messages.transactions.expense : messages.transactions.transfer);

    return (
        <React.Fragment>
            <form onSubmit={submit} noValidate>
                <Stack gap="5">
                    {accounts.length > 0 ? null : (
                        <Alert.Root status="warning" role="alert" rounded="lg">
                            <Alert.Indicator />
                            <Alert.Title flex="1">{intl.formatMessage(messages.transactions.form.noAccounts)}</Alert.Title>
                            <Button asChild type="button" size="sm" variant="outline">
                                <RouterLink to={ROUTES.settingsAccounts}>{intl.formatMessage(messages.transactions.form.goToAccounts)}</RouterLink>
                            </Button>
                        </Alert.Root>
                    )}

                    <Field.Root>
                        <Field.Label>{intl.formatMessage(messages.transactions.form.kind)}</Field.Label>
                        <HStack role="group" aria-label={intl.formatMessage(messages.transactions.form.kind)} gap="1" bg="gray.200" _dark={{bg: "gray.700"}} p="1" rounded="lg" width="full">
                            {KINDS.map(value => (
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
                                    {kindLabel(value)}
                                </Button>
                            ))}
                        </HStack>
                    </Field.Root>

                    <Field.Root required invalid={formState.errors.amount !== undefined}>
                        <Field.Label>{intl.formatMessage(messages.transactions.form.amount)}</Field.Label>
                        <Input autoFocus inputMode="decimal" placeholder={intl.formatMessage(messages.transactions.form.amountPlaceholder)} {...register("amount")} />
                        {formState.errors.amount === undefined ? null : <Field.ErrorText>{formState.errors.amount.message}</Field.ErrorText>}
                    </Field.Root>

                    <SimpleGrid columns={{base: 1, md: kind === "transfer" ? 2 : 1}} gap="4">
                        <Field.Root required invalid={formState.errors.accountId !== undefined}>
                            <Field.Label>{intl.formatMessage(kind === "transfer" ? messages.transactions.form.transferFrom : messages.transactions.form.account)}</Field.Label>
                            <NativeSelect.Root>
                                <NativeSelect.Field disabled={accounts.length === 0} {...register("accountId")}>
                                    <option value="">{intl.formatMessage(accounts.length === 0 ? messages.transactions.form.noAccounts : messages.transactions.form.selectAccount)}</option>
                                    {accounts.map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.name}
                                        </option>
                                    ))}
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                            {formState.errors.accountId === undefined ? null : <Field.ErrorText>{formState.errors.accountId.message}</Field.ErrorText>}
                            {accounts.length === 0 ? (
                                <Text fontSize="sm" mt="1">
                                    <ChakraLink asChild color="brand.fg">
                                        <RouterLink to={ROUTES.settingsAccounts}>{intl.formatMessage(messages.transactions.form.goToAccounts)}</RouterLink>
                                    </ChakraLink>
                                </Text>
                            ) : null}
                        </Field.Root>

                        {kind !== "transfer" ? null : (
                            <Field.Root required invalid={formState.errors.transferAccountId !== undefined}>
                                <Field.Label>{intl.formatMessage(messages.transactions.form.transferTo)}</Field.Label>
                                <NativeSelect.Root>
                                    <NativeSelect.Field {...register("transferAccountId")}>
                                        <option value="">{intl.formatMessage(messages.transactions.form.selectAccount)}</option>
                                        {accounts.map(account => (
                                            <option key={account.id} value={account.id} disabled={account.id === accountId}>
                                                {account.name}
                                            </option>
                                        ))}
                                    </NativeSelect.Field>
                                    <NativeSelect.Indicator />
                                </NativeSelect.Root>
                                {formState.errors.transferAccountId === undefined ? null : <Field.ErrorText>{formState.errors.transferAccountId.message}</Field.ErrorText>}
                            </Field.Root>
                        )}
                    </SimpleGrid>

                    {kind === "transfer" ? null : (
                        <React.Fragment>
                            <Field.Root invalid={formState.errors.categoryId !== undefined}>
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

                            <Controller
                                name="merchantId"
                                control={control}
                                render={({field, fieldState}) => <MerchantAutocomplete merchants={merchants} value={field.value} onChange={selectMerchant} error={fieldState.error?.message} />}
                            />

                            {suggestedCategory === null || suggestedCategory.id === categoryId ? null : (
                                <Alert.Root status="info" rounded="lg">
                                    <Alert.Indicator />
                                    <Alert.Title flex="1">{intl.formatMessage(messages.transactions.form.categorySuggestion, {name: suggestedCategory.name})}</Alert.Title>
                                    <Button type="button" size="sm" variant="outline" onClick={() => setValue("categoryId", suggestedCategory.id, {shouldDirty: true})}>
                                        {intl.formatMessage(messages.transactions.form.applySuggestion)}
                                    </Button>
                                </Alert.Root>
                            )}
                        </React.Fragment>
                    )}

                    <SimpleGrid columns={{base: 1, md: 2}} gap="4">
                        <Field.Root required invalid={formState.errors.occurredAt !== undefined}>
                            <Field.Label>{intl.formatMessage(messages.transactions.form.occurredAt)}</Field.Label>
                            <Input type="datetime-local" {...register("occurredAt")} />
                            {formState.errors.occurredAt === undefined ? null : <Field.ErrorText>{formState.errors.occurredAt.message}</Field.ErrorText>}
                        </Field.Root>
                        <Field.Root>
                            <Field.Label>{intl.formatMessage(messages.transactions.form.paymentMethod)}</Field.Label>
                            <Input placeholder={intl.formatMessage(messages.transactions.form.paymentMethodPlaceholder)} {...register("paymentMethod")} />
                        </Field.Root>
                    </SimpleGrid>

                    <Field.Root>
                        <Field.Label>{intl.formatMessage(messages.transactions.form.note)}</Field.Label>
                        <Textarea rows={3} {...register("note")} />
                    </Field.Root>

                    {transaction === null || transaction.image_urls.length === 0 ? null : (
                        <Box>
                            <Text fontSize="sm" fontWeight="medium" mb="2">
                                {intl.formatMessage(messages.transactions.form.images)}
                            </Text>
                            <HStack gap="2" overflowX="auto">
                                {transaction.image_urls.map(url => (
                                    <Image key={url} src={url} alt="單據" boxSize="20" objectFit="cover" rounded="lg" borderWidth="1px" />
                                ))}
                            </HStack>
                        </Box>
                    )}

                    {submitError === null ? null : (
                        <Alert.Root status="error" role="alert" rounded="lg">
                            <Alert.Indicator />
                            <Alert.Title>{submitError}</Alert.Title>
                        </Alert.Root>
                    )}

                    <HStack justify="flex-end" gap="3" py="2">
                        <Button type="button" variant="outline" onClick={cancel}>
                            {intl.formatMessage(messages.common.cancel)}
                        </Button>
                        <Button type="submit" loading={formState.isSubmitting} disabled={accounts.length === 0}>
                            {intl.formatMessage(transaction === null ? messages.common.create : messages.common.save)}
                        </Button>
                    </HStack>
                </Stack>
            </form>
            <DirtyLeaveDialog blocker={blocker} />
        </React.Fragment>
    );
};
