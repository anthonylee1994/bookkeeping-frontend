import React from "react";
import {zodResolver} from "@hookform/resolvers/zod";
import {Alert, Badge, Button, Field, HStack, Input, Link as ChakraLink, NativeSelect, SimpleGrid, Stack, Text, Textarea} from "@chakra-ui/react";
import {Controller, useForm, useWatch} from "react-hook-form";
import {useIntl} from "react-intl";
import {useNavigate, Link as RouterLink} from "react-router";
import {ReceiptsRepository} from "@/data/receiptsRepository";
import type {AiPreview, Merchant} from "@/data/types";
import {confidencePercent, isLowConfidence, missingReviewFields, previewToReviewValues, reviewValuesToInput, scanReviewSchema, suggestedMerchantName} from "@/features/receiptScan/scanModel";
import type {ScanReference, ScanReviewField, ScanReviewValues} from "@/features/receiptScan/scanModel";
import {MerchantAutocomplete} from "@/features/transactions/MerchantAutocomplete";
import {messages} from "@/lib/i18n";
import {createId} from "@/lib/id";
import {ROUTES, transactionDetailPath} from "@/routes/paths";
import {useAuthStore} from "@/stores/authStore";

type ScanReviewFormProps = {
    preview: AiPreview;
    reference: ScanReference;
    variant?: "inline" | "sheet";
    onConfirmed: () => void;
    onStartOver: () => void;
};

const KINDS: ScanReviewValues["kind"][] = ["income", "expense"];

export const ScanReviewForm = ({preview, reference, variant = "inline", onConfirmed, onStartOver}: ScanReviewFormProps) => {
    const intl = useIntl();
    const isSheet = variant === "sheet";
    const navigate = useNavigate();
    const token = useAuthStore(state => state.token);
    // 同一次覆核重用同一條 key：submit 失敗再試也不會重複入帳。
    const [idempotencyKey] = React.useState(createId);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const {control, register, handleSubmit, setValue, formState} = useForm<ScanReviewValues>({
        resolver: zodResolver(scanReviewSchema),
        defaultValues: previewToReviewValues(preview, reference),
    });

    const kind = useWatch({control, name: "kind"});
    const missing = missingReviewFields(preview);
    const filteredCategories = reference.categories.filter(category => category.kind === kind);
    const reviewBadge = (field: ScanReviewField) =>
        missing.includes(field) ? (
            <Badge colorPalette="orange" size="sm">
                {intl.formatMessage(messages.scan.needsReview)}
            </Badge>
        ) : null;

    const selectMerchant = (merchant: Merchant | null) => setValue("merchantId", merchant?.id ?? "", {shouldValidate: true});

    const submit = handleSubmit(async values => {
        if (token === null) return;
        setSubmitError(null);
        const input = reviewValuesToInput(values, preview.image_urls);
        const result = await new ReceiptsRepository(token).confirm(input, preview.id, idempotencyKey);
        if (!result.ok) {
            setSubmitError(result.error.message);
            return;
        }

        onConfirmed();
        navigate(transactionDetailPath(result.value.id));
    });

    return (
        <form onSubmit={submit} noValidate>
            <Stack gap="5">
                {reference.accounts.length > 0 ? null : (
                    <Alert.Root status="warning" role="alert" rounded="lg">
                        <Alert.Indicator />
                        <Alert.Title flex="1">{intl.formatMessage(messages.scan.noAccounts)}</Alert.Title>
                        <Button asChild type="button" size="sm" variant="outline">
                            <RouterLink to={ROUTES.settingsAccounts}>{intl.formatMessage(messages.scan.goToAccounts)}</RouterLink>
                        </Button>
                    </Alert.Root>
                )}

                {isLowConfidence(preview) ? (
                    <Alert.Root status="warning" role="alert" rounded="lg">
                        <Alert.Indicator />
                        <Alert.Title>{intl.formatMessage(messages.scan.lowConfidence, {percent: confidencePercent(preview)})}</Alert.Title>
                    </Alert.Root>
                ) : null}
                {preview.status === "partial" || missing.length > 0 ? (
                    <Alert.Root status="info" rounded="lg">
                        <Alert.Indicator />
                        <Alert.Title>{intl.formatMessage(messages.scan.partialResult)}</Alert.Title>
                    </Alert.Root>
                ) : null}

                <Field.Root>
                    <Field.Label>
                        {intl.formatMessage(messages.transactions.form.kind)}
                        {reviewBadge("kind")}
                    </Field.Label>
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
                                onClick={() => {
                                    setValue("kind", value, {shouldValidate: true});
                                    setValue("categoryId", "");
                                }}
                            >
                                {intl.formatMessage(value === "income" ? messages.transactions.income : messages.transactions.expense)}
                            </Button>
                        ))}
                    </HStack>
                </Field.Root>

                <Field.Root required invalid={formState.errors.amount !== undefined}>
                    <Field.Label>
                        {intl.formatMessage(messages.transactions.form.amount)}
                        {reviewBadge("amount")}
                    </Field.Label>
                    <Input inputMode="decimal" placeholder={intl.formatMessage(messages.transactions.form.amountPlaceholder)} {...register("amount")} />
                    {formState.errors.amount === undefined ? null : <Field.ErrorText>{formState.errors.amount.message}</Field.ErrorText>}
                </Field.Root>

                <SimpleGrid columns={{base: 1, md: 2}} gap="4">
                    <Field.Root required invalid={formState.errors.accountId !== undefined}>
                        <Field.Label>{intl.formatMessage(messages.transactions.form.account)}</Field.Label>
                        <NativeSelect.Root>
                            <NativeSelect.Field disabled={reference.accounts.length === 0} {...register("accountId")}>
                                <option value="">{intl.formatMessage(reference.accounts.length === 0 ? messages.scan.noAccounts : messages.transactions.form.selectAccount)}</option>
                                {reference.accounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.name}
                                    </option>
                                ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                        {formState.errors.accountId === undefined ? null : <Field.ErrorText>{formState.errors.accountId.message}</Field.ErrorText>}
                        {reference.accounts.length === 0 ? (
                            <Text fontSize="sm" mt="1">
                                <ChakraLink asChild color="brand.fg">
                                    <RouterLink to={ROUTES.settingsAccounts}>{intl.formatMessage(messages.scan.goToAccounts)}</RouterLink>
                                </ChakraLink>
                            </Text>
                        ) : null}
                    </Field.Root>

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

                <Stack gap="1">
                    {missing.includes("merchant") ? (
                        <Badge colorPalette="orange" size="sm" alignSelf="flex-start">
                            {intl.formatMessage(messages.scan.needsReview)}
                        </Badge>
                    ) : null}
                    <Controller
                        name="merchantId"
                        control={control}
                        render={({field, fieldState}) => (
                            <MerchantAutocomplete
                                merchants={reference.merchants}
                                value={field.value}
                                defaultQuery={suggestedMerchantName(preview)}
                                onChange={selectMerchant}
                                error={fieldState.error?.message}
                            />
                        )}
                    />
                </Stack>

                <Field.Root required invalid={formState.errors.occurredAt !== undefined}>
                    <Field.Label>
                        {intl.formatMessage(messages.transactions.form.occurredAt)}
                        {reviewBadge("occurredAt")}
                    </Field.Label>
                    <Input type="datetime-local" {...register("occurredAt")} />
                    {formState.errors.occurredAt === undefined ? null : <Field.ErrorText>{formState.errors.occurredAt.message}</Field.ErrorText>}
                </Field.Root>

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

                <Stack
                    direction={{base: "column", md: "row"}}
                    justify={{md: "flex-end"}}
                    gap="3"
                    pt={isSheet ? "4" : "2"}
                    pb="2"
                    mx={isSheet ? "-6" : undefined}
                    px={isSheet ? "6" : undefined}
                    position={isSheet ? "sticky" : undefined}
                    bottom={isSheet ? "0" : undefined}
                    zIndex={isSheet ? "1" : undefined}
                    bg={isSheet ? "bg.panel" : undefined}
                    borderTopWidth={isSheet ? "1px" : undefined}
                    borderColor="border"
                >
                    <Button type="button" variant="outline" w={{base: "full", md: "auto"}} onClick={onStartOver}>
                        {intl.formatMessage(messages.scan.startOver)}
                    </Button>
                    <Button type="submit" w={{base: "full", md: "auto"}} loading={formState.isSubmitting} disabled={reference.accounts.length === 0}>
                        {intl.formatMessage(messages.scan.confirm)}
                    </Button>
                </Stack>
            </Stack>
        </form>
    );
};
