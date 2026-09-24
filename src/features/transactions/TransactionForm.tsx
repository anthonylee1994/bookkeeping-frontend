import React from "react";
import {zodResolver} from "@hookform/resolvers/zod";
import {Alert, Badge, Box, Button, Field, HStack, Image, Input, Link as ChakraLink, NativeSelect, SimpleGrid, Stack, Text, Textarea} from "@chakra-ui/react";
import {Controller, useForm, useWatch} from "react-hook-form";
import {useIntl} from "react-intl";
import {useBeforeUnload, useBlocker, useLocation, useNavigate, Link as RouterLink} from "react-router";
import {DrawerActions} from "@/components/layout/DrawerActions";
import {MerchantsRepository} from "@/data/merchantsRepository";
import {ReceiptsRepository} from "@/data/receiptsRepository";
import {TransactionsRepository} from "@/data/transactionsRepository";
import type {Account, AiPreview, Category, Merchant, Transaction, TransactionKind} from "@/data/types";
import {previewItems, previewToReviewValues, suggestedMerchantName} from "@/features/receiptScan/scanModel";
import {DirtyLeaveDialog} from "@/features/transactions/DirtyLeaveDialog";
import {MerchantAutocomplete} from "@/features/transactions/MerchantAutocomplete";
import {NaturalLanguageEntry} from "@/features/transactions/NaturalLanguageEntry";
import {emptyTransactionFormValues, formValuesToInput, transactionFormSchema, transactionToFormValues} from "@/features/transactions/TransactionFormModel";
import type {TransactionFormValues} from "@/features/transactions/TransactionFormModel";
import {messages} from "@/lib/i18n";
import {createId} from "@/lib/id";
import {ROUTES, transactionDetailPath, transactionsPath} from "@/routes/paths";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";
import {useUiStore} from "@/stores/uiStore";

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
    const location = useLocation();
    const token = useAuthStore(state => state.token);
    const [idempotencyKey] = React.useState(createId);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [createdMerchant, setCreatedMerchant] = React.useState<Merchant | null>(null);
    // 經 AI 打字記帳預填時記住 import log id；入帳會改行 `/ai/confirm` 保留 ai 來源。
    const [aiLogId, setAiLogId] = React.useState<string | null>(null);
    // AI 讀到嘅商戶名：對唔上現有商戶時帶入 autocomplete，讓用戶一按建立。
    // `interpretSeq` 每次解讀遞增，用作 key 迫 autocomplete remount 以食到新 query。
    const [suggestedMerchant, setSuggestedMerchant] = React.useState("");
    const [interpretSeq, setInterpretSeq] = React.useState(0);
    // AI 自動分類建議：由商戶／備註失焦觸發；`merchantName` 記錄 autocomplete 最新文字（可能未對應現有商戶）。
    const [merchantName, setMerchantName] = React.useState(() => (transaction?.merchant_id ? (merchants.find(merchant => merchant.id === transaction.merchant_id)?.name ?? "") : ""));
    const [aiCategoryId, setAiCategoryId] = React.useState<string | null>(null);
    const [isSuggestingCategory, setSuggestingCategory] = React.useState(false);
    const [categorySuggestionError, setCategorySuggestionError] = React.useState<string | null>(null);
    const suggestionSeqRef = React.useRef(0);
    const {control, getValues, register, handleSubmit, reset, setValue, formState} = useForm<TransactionFormValues>({
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
    const filteredCategories = categories.filter(category => category.kind === kind);

    React.useEffect(() => {
        if (token === null || createdMerchant === null || merchantId !== createdMerchant.id || categoryId === "") return;
        // AI 建議唔會自動寫入做商戶預設分類；要用戶自己改／揀過先會記低。
        if (aiCategoryId !== null && aiCategoryId === categoryId) return;
        if (createdMerchant.default_category_id === categoryId) return;
        const updated: Merchant = {...createdMerchant, default_category_id: categoryId};
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCreatedMerchant(updated);
        useAppStore.getState().setMerchants(useAppStore.getState().merchants.map(merchant => (merchant.id === updated.id ? updated : merchant)));
        void new MerchantsRepository(token).update(updated.id, {name: updated.name, default_category_id: categoryId});
    }, [aiCategoryId, categoryId, createdMerchant, merchantId, token]);

    const shouldBlockNavigation = formState.isDirty && !formState.isSubmitting;
    const blocker = useBlocker(shouldBlockNavigation);
    useBeforeUnload(event => {
        if (!shouldBlockNavigation) return;
        event.preventDefault();
        event.returnValue = "";
    });

    const selectKind = (nextKind: TransactionKind) => {
        setValue("kind", nextKind, {shouldDirty: true, shouldValidate: true});
        suggestionSeqRef.current += 1;
        setAiCategoryId(null);
        setCategorySuggestionError(null);
        setSuggestingCategory(false);
        if (nextKind === "transfer") {
            setValue("categoryId", "", {shouldDirty: true});
            setValue("merchantId", "", {shouldDirty: true});
        } else {
            setValue("transferAccountId", "", {shouldDirty: true});
        }
    };

    const selectMerchant = (merchant: Merchant | null) => {
        setValue("merchantId", merchant?.id ?? "", {shouldDirty: true, shouldValidate: true});
        const defaultCategoryId = merchant?.default_category_id ?? null;
        const defaultCategory = defaultCategoryId === null ? undefined : categories.find(category => category.id === defaultCategoryId && category.kind === kind);
        if (aiCategoryId !== null) {
            // 商戶一改，上一個 AI 建議就唔再適用：有 deterministic default 就換返，否則清空分類。
            suggestionSeqRef.current += 1;
            setAiCategoryId(null);
            setCategorySuggestionError(null);
            setSuggestingCategory(false);
            setValue("categoryId", defaultCategory?.id ?? "", {shouldDirty: true, shouldValidate: true});
            return;
        }
        if (defaultCategory === undefined) return;
        setValue("categoryId", defaultCategory.id, {shouldDirty: true, shouldValidate: true});
    };

    /**
     * 商戶／備註失焦：商戶冇預設分類、分類欄又空白時，問 AI 拎分類建議。
     * 純建議（用戶可覆寫）；失敗只顯示 inline 重試，唔阻塞其他欄位。
     */
    const requestCategorySuggestion = async () => {
        if (token === null) return;
        const values = getValues();
        if (values.kind === "transfer" || values.categoryId !== "") return;
        const name = merchantName.trim();
        if (name === "" && values.note.trim() === "") return;
        const generation = suggestionSeqRef.current + 1;
        suggestionSeqRef.current = generation;
        setSuggestingCategory(true);
        setCategorySuggestionError(null);
        const result = await new ReceiptsRepository(token).suggestCategory({kind: values.kind, merchantName: name, note: values.note});
        if (suggestionSeqRef.current !== generation) return;
        setSuggestingCategory(false);
        if (!result.ok) {
            setCategorySuggestionError(result.error.message);
            return;
        }
        const current = getValues();
        // AI 揀唔到、或期間用戶已經轉 type／揀咗分類，就唔覆蓋。
        if (result.value.category_id === null || current.kind !== values.kind || current.categoryId !== "") return;
        setValue("categoryId", result.value.category_id, {shouldDirty: true, shouldValidate: true});
        setAiCategoryId(result.value.category_id);
    };

    /** AI 打字記帳成功：單筆映射落現有表單；多筆閂新增交易 drawer、返列表開批量覆核 drawer。 */
    const applyInterpretation = (preview: AiPreview) => {
        if (previewItems(preview).length > 1) {
            useUiStore.getState().openAiBatch(preview);
            navigate(transactionsPath(location.search));
            return;
        }
        const review = previewToReviewValues(preview, {accounts, categories, merchants});
        reset({
            kind: review.kind,
            amount: review.amount,
            accountId: review.accountId,
            transferAccountId: "",
            categoryId: review.categoryId,
            merchantId: review.merchantId,
            occurredAt: review.occurredAt,
            paymentMethod: "",
            note: review.note,
        });
        setAiLogId(preview.id);
        setSuggestedMerchant(suggestedMerchantName(preview));
        setMerchantName(suggestedMerchantName(preview));
        setInterpretSeq(sequence => sequence + 1);
        suggestionSeqRef.current += 1;
        setAiCategoryId(null);
        setCategorySuggestionError(null);
        setSuggestingCategory(false);
    };

    /** 入帳 / 修改成功後清走 AI 分類建議狀態，避免殘留喺下一個表單；失效 in-flight 請求由 onSubmit 做。 */
    const clearCategorySuggestion = () => {
        setAiCategoryId(null);
        setCategorySuggestionError(null);
        setSuggestingCategory(false);
    };

    const submit = handleSubmit(async values => {
        if (token === null) return;
        setSubmitError(null);
        const repository = new TransactionsRepository(token);
        const input = formValuesToInput(values, transaction?.image_urls ?? []);

        if (transaction !== null) {
            const result = await repository.update(transaction.id, input);
            if (!result.ok) {
                setSubmitError(result.error.message);
                return;
            }
            const next = useAppStore.getState().transactions.map(item => (item.id === result.value.id ? result.value : item));
            useAppStore.getState().setTransactions(next, useAppStore.getState().transactionsMeta);
            useAppStore.getState().bumpTransactionsRevision();
            reset(transactionToFormValues(result.value));
            clearCategorySuggestion();
            // 修改保留原本 filter。
            navigate(transactionDetailPath(result.value.id, location.search), {replace: true});
            return;
        }

        // 由 AI 打字記帳預填：入帳行 `/ai/confirm`，保留 ai_import_log 關聯同 `source = ai`。
        if (aiLogId !== null) {
            const result = await new ReceiptsRepository(token).confirm(input, aiLogId, idempotencyKey);
            if (!result.ok) {
                setSubmitError(result.error.message);
                return;
            }
            useAppStore.getState().bumpTransactionsRevision();
            navigate(transactionDetailPath(result.value.id, ""), {replace: true});
            return;
        }

        const result = await repository.create(input, idempotencyKey);
        if (!result.ok) {
            setSubmitError(result.error.message);
            return;
        }
        useAppStore.getState().setTransactions([result.value, ...useAppStore.getState().transactions], useAppStore.getState().transactionsMeta);
        // 列表仍在背景 mount，bump revision 令佢即刻重新抓取，唔使等 route remount。
        useAppStore.getState().bumpTransactionsRevision();
        reset(transactionToFormValues(result.value));
        clearCategorySuggestion();
        // 新增成功後清空 search，令背後列表清走 filter 並返回第一頁。
        navigate(transactionDetailPath(result.value.id, ""), {replace: true});
    });

    const noteRegistration = register("note");
    const categoryRegistration = register("categoryId");
    const cancel = () => navigate(transaction === null ? transactionsPath(location.search) : transactionDetailPath(transaction.id, location.search));
    const kindLabel = (value: TransactionKind) =>
        intl.formatMessage(value === "income" ? messages.transactions.income : value === "expense" ? messages.transactions.expense : messages.transactions.transfer);

    return (
        <React.Fragment>
            <form
                onSubmit={event => {
                    // 送出即令任何 in-flight AI 分類建議失效（ref 只喺 event handler 掂）。
                    suggestionSeqRef.current += 1;
                    void submit(event);
                }}
                noValidate
            >
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

                    {transaction === null && accounts.length > 0 ? <NaturalLanguageEntry onInterpreted={applyInterpretation} /> : null}

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
                            <SimpleGrid columns={{base: 1, md: 2}} gap="4">
                                <Controller
                                    name="merchantId"
                                    control={control}
                                    render={({field, fieldState}) => (
                                        <MerchantAutocomplete
                                            key={interpretSeq}
                                            merchants={merchants}
                                            value={field.value}
                                            defaultQuery={suggestedMerchant}
                                            onChange={selectMerchant}
                                            onCreated={setCreatedMerchant}
                                            onQueryChange={setMerchantName}
                                            onBlur={() => void requestCategorySuggestion()}
                                            error={fieldState.error?.message}
                                        />
                                    )}
                                />

                                <Field.Root invalid={formState.errors.categoryId !== undefined}>
                                    <HStack gap="2">
                                        <Field.Label>{intl.formatMessage(messages.transactions.form.category)}</Field.Label>
                                        {aiCategoryId === null ? null : (
                                            <Badge colorPalette="blue" variant="subtle">
                                                {intl.formatMessage(messages.transactions.form.aiCategoryBadge)}
                                            </Badge>
                                        )}
                                    </HStack>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field
                                            {...categoryRegistration}
                                            onChange={event => {
                                                void categoryRegistration.onChange(event);
                                                setAiCategoryId(null);
                                                setCategorySuggestionError(null);
                                            }}
                                        >
                                            <option value="">{intl.formatMessage(messages.transactions.form.noCategory)}</option>
                                            {filteredCategories.map(category => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                    {isSuggestingCategory ? (
                                        <Text fontSize="sm" color="fg.muted" mt="1" aria-live="polite">
                                            {intl.formatMessage(messages.transactions.form.aiCategorySuggesting)}
                                        </Text>
                                    ) : null}
                                    {categorySuggestionError === null ? null : (
                                        <HStack gap="1" mt="1">
                                            <Text fontSize="sm" color="fg.muted">
                                                {intl.formatMessage(messages.transactions.form.aiCategoryFailed)}
                                            </Text>
                                            <Button type="button" size="xs" variant="ghost" colorPalette="blue" onClick={() => void requestCategorySuggestion()}>
                                                {intl.formatMessage(messages.common.retry)}
                                            </Button>
                                        </HStack>
                                    )}
                                </Field.Root>
                            </SimpleGrid>
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
                        <Textarea
                            rows={3}
                            {...noteRegistration}
                            onBlur={event => {
                                void noteRegistration.onBlur(event);
                                void requestCategorySuggestion();
                            }}
                        />
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

                    <DrawerActions py="2">
                        <Button type="button" variant="outline" onClick={cancel}>
                            {intl.formatMessage(messages.common.cancel)}
                        </Button>
                        <Button type="submit" loading={formState.isSubmitting} disabled={accounts.length === 0}>
                            {intl.formatMessage(transaction === null ? messages.common.create : messages.common.save)}
                        </Button>
                    </DrawerActions>
                </Stack>
            </form>
            <DirtyLeaveDialog blocker={blocker} />
        </React.Fragment>
    );
};
