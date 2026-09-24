import React from "react";
import {zodResolver} from "@hookform/resolvers/zod";
import {Alert, Badge, Button, CloseButton, Drawer, Field, HStack, Input, NativeSelect, Portal, SimpleGrid, Stack, Textarea} from "@chakra-ui/react";
import {Trash2Icon} from "lucide-react";
import {Controller, useFieldArray, useForm, useWatch} from "react-hook-form";
import type {Control, FieldErrors, UseFormRegister, UseFormSetValue} from "react-hook-form";
import {useIntl} from "react-intl";
import {z} from "zod";
import {DrawerActions} from "@/components/layout/DrawerActions";
import {DrawerBody} from "@/components/layout/DrawerBody";
import {MerchantsRepository} from "@/data/merchantsRepository";
import {ReceiptsRepository} from "@/data/receiptsRepository";
import type {AiParsedItem, AiPreview, Merchant} from "@/data/types";
import {isItemLowConfidence, parsedItemToReviewValues, previewItems, reviewValuesToInput, scanReviewSchema, suggestedMerchantNameForItem} from "@/features/receiptScan/scanModel";
import type {ScanReference, ScanReviewValues} from "@/features/receiptScan/scanModel";
import {MerchantAutocomplete} from "@/features/transactions/MerchantAutocomplete";
import {DESKTOP_QUERY, useMediaQuery} from "@/hooks/useMediaQuery";
import {messages} from "@/lib/i18n";
import {createId} from "@/lib/id";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";

const batchFormSchema = z.object({items: z.array(scanReviewSchema).min(1)});
type BatchFormValues = z.infer<typeof batchFormSchema>;

const KINDS: ScanReviewValues["kind"][] = ["income", "expense"];

type AiBatchReviewDrawerProps = {
    open: boolean;
    preview: AiPreview | null;
    reference: ScanReference;
    onClose: () => void;
    onConfirmed: () => void;
};

/**
 * `/ai/interpret` 拆出多筆交易時嘅覆核 drawer：每筆一張卡，可逐筆改／刪，
 * 確認時逐筆經 `/ai/confirm` 入帳，共用同一條 import log 但各自一條 idempotency key。
 */
export const AiBatchReviewDrawer = ({open, preview, reference, onClose, onConfirmed}: AiBatchReviewDrawerProps) => {
    const intl = useIntl();
    const isDesktop = useMediaQuery(DESKTOP_QUERY);
    const count = preview === null ? 0 : previewItems(preview).length;

    return (
        <Drawer.Root
            open={open}
            placement={isDesktop ? "end" : "bottom"}
            size={isDesktop ? "lg" : "full"}
            onOpenChange={event => {
                if (!event.open) onClose();
            }}
        >
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content h={isDesktop ? "full" : "auto"} maxH={isDesktop ? undefined : "94dvh"} roundedTop={isDesktop ? undefined : "2xl"}>
                        <Drawer.Header>
                            <Stack gap="0.5" flex="1" minW="0">
                                <Drawer.Title>{intl.formatMessage(messages.batch.reviewTitle)}</Drawer.Title>
                                <Drawer.Description>{intl.formatMessage(messages.batch.reviewDescription, {count})}</Drawer.Description>
                            </Stack>
                            <Drawer.CloseTrigger asChild>
                                <CloseButton aria-label={intl.formatMessage(messages.common.close)} />
                            </Drawer.CloseTrigger>
                        </Drawer.Header>
                        <DrawerBody>{preview === null ? null : <AiBatchReviewForm key={preview.id} preview={preview} reference={reference} onClose={onClose} onConfirmed={onConfirmed} />}</DrawerBody>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
};

type AiBatchReviewFormProps = {
    preview: AiPreview;
    reference: ScanReference;
    onClose: () => void;
    onConfirmed: () => void;
};

const AiBatchReviewForm = ({preview, reference, onClose, onConfirmed}: AiBatchReviewFormProps) => {
    const intl = useIntl();
    const token = useAuthStore(state => state.token);
    const items = previewItems(preview);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [createdMerchants, setCreatedMerchants] = React.useState<Merchant[]>([]);
    // 每筆一條 key：submit 失敗再試，已成功嘅交易唔會重複入帳。
    const [idempotencyKeys, setIdempotencyKeys] = React.useState<string[]>(() => items.map(() => createId()));
    const {control, register, handleSubmit, getValues, setValue, formState} = useForm<BatchFormValues>({
        resolver: zodResolver(batchFormSchema),
        defaultValues: {items: items.map(item => parsedItemToReviewValues(item, reference))},
    });
    const {fields, remove} = useFieldArray({control, name: "items"});
    const lowConfidence = items.some(isItemLowConfidence);

    const removeRow = (index: number) => {
        remove(index);
        setIdempotencyKeys(keys => keys.filter((_, position) => position !== index));
    };

    const persistDefaultCategory = (index: number, categoryId: string) => {
        if (token === null || categoryId === "") return;
        const merchantId = getValues(`items.${index}.merchantId`);
        const created = createdMerchants.find(merchant => merchant.id === merchantId);
        if (created === undefined || created.default_category_id === categoryId) return;
        const updated: Merchant = {...created, default_category_id: categoryId};
        setCreatedMerchants(previous => previous.map(merchant => (merchant.id === updated.id ? updated : merchant)));
        useAppStore.getState().setMerchants(useAppStore.getState().merchants.map(merchant => (merchant.id === updated.id ? updated : merchant)));
        void new MerchantsRepository(token).update(updated.id, {name: updated.name, default_category_id: categoryId});
    };

    const selectMerchant = (index: number, merchant: Merchant | null) => {
        setValue(`items.${index}.merchantId`, merchant?.id ?? "", {shouldValidate: true});
        const defaultCategoryId = merchant?.default_category_id ?? null;
        if (defaultCategoryId === null) return;
        const kind = getValues(`items.${index}.kind`);
        const defaultCategory = reference.categories.find(category => category.id === defaultCategoryId && category.kind === kind);
        if (defaultCategory === undefined) return;
        setValue(`items.${index}.categoryId`, defaultCategory.id, {shouldValidate: true});
    };

    const submit = handleSubmit(async values => {
        if (token === null) return;
        setSubmitError(null);
        const repository = new ReceiptsRepository(token);
        for (let index = 0; index < values.items.length; index += 1) {
            const input = reviewValuesToInput(values.items[index], []);
            const result = await repository.confirm(input, preview.id, idempotencyKeys[index] ?? createId());
            if (!result.ok) {
                // 已經入帳嘅前面幾筆靠同一條 idempotency key 唔會重複；保留 drawer 等用戶重試。
                setSubmitError(result.error.message);
                return;
            }
        }
        useAppStore.getState().bumpTransactionsRevision();
        onConfirmed();
    });

    return (
        <form onSubmit={submit} noValidate>
            <Stack gap="5">
                {reference.accounts.length > 0 ? null : (
                    <Alert.Root status="warning" role="alert" rounded="lg">
                        <Alert.Indicator />
                        <Alert.Title>{intl.formatMessage(messages.scan.noAccounts)}</Alert.Title>
                    </Alert.Root>
                )}

                {lowConfidence ? (
                    <Alert.Root status="info" rounded="lg">
                        <Alert.Indicator />
                        <Alert.Title>{intl.formatMessage(messages.batch.lowConfidence)}</Alert.Title>
                    </Alert.Root>
                ) : null}

                {fields.map((field, index) => (
                    <AiBatchReviewRow
                        key={field.id}
                        index={index}
                        previewItem={items[index]}
                        control={control}
                        register={register}
                        setValue={setValue}
                        reference={reference}
                        errors={formState.errors.items?.[index]}
                        canRemove={fields.length > 1}
                        onRemove={() => removeRow(index)}
                        onSelectMerchant={selectMerchant}
                        onCreatedMerchant={merchant => setCreatedMerchants(previous => [...previous.filter(item => item.id !== merchant.id), merchant])}
                        onPersistDefaultCategory={persistDefaultCategory}
                    />
                ))}

                {fields.length === 0 ? (
                    <Alert.Root status="warning" role="alert" rounded="lg">
                        <Alert.Indicator />
                        <Alert.Title>{intl.formatMessage(messages.batch.empty)}</Alert.Title>
                    </Alert.Root>
                ) : null}

                {submitError === null ? null : (
                    <Alert.Root status="error" role="alert" rounded="lg">
                        <Alert.Indicator />
                        <Alert.Title>{submitError}</Alert.Title>
                    </Alert.Root>
                )}

                <DrawerActions pt="2">
                    <Button type="button" variant="outline" onClick={onClose}>
                        {intl.formatMessage(messages.common.close)}
                    </Button>
                    <Button type="submit" loading={formState.isSubmitting} disabled={reference.accounts.length === 0 || fields.length === 0}>
                        {intl.formatMessage(messages.batch.confirmAll, {count: fields.length})}
                    </Button>
                </DrawerActions>
            </Stack>
        </form>
    );
};

type AiBatchReviewRowProps = {
    index: number;
    previewItem: AiParsedItem | undefined;
    control: Control<BatchFormValues>;
    register: UseFormRegister<BatchFormValues>;
    setValue: UseFormSetValue<BatchFormValues>;
    reference: ScanReference;
    errors: FieldErrors<ScanReviewValues> | undefined;
    canRemove: boolean;
    onRemove: () => void;
    onSelectMerchant: (index: number, merchant: Merchant | null) => void;
    onCreatedMerchant: (merchant: Merchant) => void;
    onPersistDefaultCategory: (index: number, categoryId: string) => void;
};

const AiBatchReviewRow = ({
    index,
    previewItem,
    control,
    register,
    setValue,
    reference,
    errors,
    canRemove,
    onRemove,
    onSelectMerchant,
    onCreatedMerchant,
    onPersistDefaultCategory,
}: AiBatchReviewRowProps) => {
    const intl = useIntl();
    const kind = useWatch({control, name: `items.${index}.kind`});
    const amount = useWatch({control, name: `items.${index}.amount`});
    const occurredAt = useWatch({control, name: `items.${index}.occurredAt`});
    const merchantId = useWatch({control, name: `items.${index}.merchantId`});
    const filteredCategories = reference.categories.filter(category => category.kind === kind);
    const needsReview = (value: string | undefined) => value === undefined || value.trim() === "";
    const reviewBadge = (needed: boolean) =>
        needed ? (
            <Badge colorPalette="orange" size="sm">
                {intl.formatMessage(messages.scan.needsReview)}
            </Badge>
        ) : null;

    return (
        <Stack gap="4" borderWidth="1px" borderColor="gray.300" rounded="lg" p="3" bg="gray.100">
            <HStack justify="space-between">
                <Badge colorPalette="gray" bg="gray.300" size="sm">
                    {intl.formatMessage(messages.batch.rowTitle, {index: index + 1})}
                </Badge>
                <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    colorPalette="gray"
                    _hover={{bg: "gray.300", color: "gray.700"}}
                    disabled={!canRemove}
                    aria-label={intl.formatMessage(messages.batch.remove, {index: index + 1})}
                    onClick={onRemove}
                >
                    <Trash2Icon aria-hidden="true" />
                    {intl.formatMessage(messages.batch.remove, {index: index + 1})}
                </Button>
            </HStack>

            <Field.Root>
                <Field.Label>{intl.formatMessage(messages.transactions.form.kind)}</Field.Label>
                <HStack role="group" aria-label={intl.formatMessage(messages.transactions.form.kind)} gap="1" bg="gray.200" p="1" rounded="lg" width="full">
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
                            onClick={() => {
                                setValue(`items.${index}.kind`, value, {shouldValidate: true});
                                setValue(`items.${index}.categoryId`, "");
                            }}
                        >
                            {intl.formatMessage(value === "income" ? messages.transactions.income : messages.transactions.expense)}
                        </Button>
                    ))}
                </HStack>
            </Field.Root>

            <SimpleGrid columns={{base: 1, md: 2}} gap="4">
                <Field.Root required invalid={errors?.amount !== undefined}>
                    <Field.Label>
                        {intl.formatMessage(messages.transactions.form.amount)}
                        {reviewBadge(needsReview(amount))}
                    </Field.Label>
                    <Input inputMode="decimal" placeholder={intl.formatMessage(messages.transactions.form.amountPlaceholder)} {...register(`items.${index}.amount`)} />
                    {errors?.amount === undefined ? null : <Field.ErrorText>{errors.amount.message}</Field.ErrorText>}
                </Field.Root>

                <Field.Root required invalid={errors?.occurredAt !== undefined}>
                    <Field.Label>
                        {intl.formatMessage(messages.transactions.form.occurredAt)}
                        {reviewBadge(needsReview(occurredAt))}
                    </Field.Label>
                    <Input type="datetime-local" {...register(`items.${index}.occurredAt`)} />
                    {errors?.occurredAt === undefined ? null : <Field.ErrorText>{errors.occurredAt.message}</Field.ErrorText>}
                </Field.Root>
            </SimpleGrid>

            <SimpleGrid columns={{base: 1, md: 2}} gap="4">
                <Controller
                    name={`items.${index}.merchantId`}
                    control={control}
                    render={({field, fieldState}) => (
                        <MerchantAutocomplete
                            merchants={reference.merchants}
                            value={field.value}
                            defaultQuery={previewItem === undefined ? "" : suggestedMerchantNameForItem(previewItem)}
                            onChange={merchant => onSelectMerchant(index, merchant)}
                            onCreated={onCreatedMerchant}
                            badge={reviewBadge(needsReview(merchantId))}
                            error={fieldState.error?.message}
                        />
                    )}
                />

                <Field.Root invalid={errors?.categoryId !== undefined}>
                    <Field.Label>{intl.formatMessage(messages.transactions.form.category)}</Field.Label>
                    <NativeSelect.Root>
                        <NativeSelect.Field {...register(`items.${index}.categoryId`, {onChange: event => onPersistDefaultCategory(index, event.target.value)})}>
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

            <Field.Root>
                <Field.Label>{intl.formatMessage(messages.transactions.form.note)}</Field.Label>
                <Textarea rows={2} {...register(`items.${index}.note`)} />
            </Field.Root>
        </Stack>
    );
};
