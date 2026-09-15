import React from "react";
import {zodResolver} from "@hookform/resolvers/zod";
import {Alert, Button, CloseButton, Drawer, Field, HStack, Input, NativeSelect, Portal, Stack} from "@chakra-ui/react";
import {useForm} from "react-hook-form";
import {useIntl} from "react-intl";
import {z} from "zod";
import {MerchantsRepository} from "@/data/merchantsRepository";
import type {Category, Merchant} from "@/data/types";
import {DESKTOP_QUERY, useMediaQuery} from "@/hooks/useMediaQuery";
import {formatMessage, messages} from "@/lib/i18n";
import {useAuthStore} from "@/stores/authStore";

const merchantFormSchema = z.object({
    name: z.string().trim().min(1, formatMessage(messages.fields.required)),
    defaultCategoryId: z.string().trim(),
});

type MerchantFormValues = z.infer<typeof merchantFormSchema>;

type MerchantFormDrawerProps = {
    categories: Category[];
    onSaved: (merchant: Merchant) => void;
    onClose: () => void;
};

export const MerchantFormDrawer = ({categories, onSaved, onClose}: MerchantFormDrawerProps) => {
    const intl = useIntl();
    const isDesktop = useMediaQuery(DESKTOP_QUERY);
    const token = useAuthStore(state => state.token);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const {register, handleSubmit, formState} = useForm<MerchantFormValues>({
        resolver: zodResolver(merchantFormSchema),
        defaultValues: {
            name: "",
            defaultCategoryId: "",
        },
    });

    const submit = handleSubmit(async values => {
        if (token === null) return;
        setSubmitError(null);
        const repository = new MerchantsRepository(token);
        const input = {
            name: values.name,
            default_category_id: values.defaultCategoryId === "" ? null : values.defaultCategoryId,
        };
        const result = await repository.create(input);
        if (!result.ok) {
            setSubmitError(result.error.message);
            return;
        }
        onSaved(result.value);
        onClose();
    });

    return (
        <Drawer.Root open placement={isDesktop ? "end" : "bottom"} size={isDesktop ? "md" : "full"} onOpenChange={event => (!event.open ? onClose() : undefined)}>
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content maxH={isDesktop ? "100dvh" : "92dvh"} roundedTop={isDesktop ? undefined : "2xl"}>
                        <Drawer.Header>
                            <Drawer.Title>{intl.formatMessage(messages.merchants.createTitle)}</Drawer.Title>
                            <Drawer.CloseTrigger asChild>
                                <CloseButton aria-label={intl.formatMessage(messages.common.close)} />
                            </Drawer.CloseTrigger>
                        </Drawer.Header>
                        <Drawer.Body pb={{base: "calc(1rem + env(safe-area-inset-bottom))", md: "8"}}>
                            <form onSubmit={submit} noValidate>
                                <Stack gap="5">
                                    <Field.Root required invalid={formState.errors.name !== undefined}>
                                        <Field.Label>{intl.formatMessage(messages.merchants.name)}</Field.Label>
                                        <Input autoFocus {...register("name")} />
                                        {formState.errors.name === undefined ? null : <Field.ErrorText>{formState.errors.name.message}</Field.ErrorText>}
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>{intl.formatMessage(messages.merchants.defaultCategory)}</Field.Label>
                                        <NativeSelect.Root>
                                            <NativeSelect.Field {...register("defaultCategoryId")}>
                                                <option value="">{intl.formatMessage(messages.transactions.form.noCategory)}</option>
                                                {categories.map(category => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </NativeSelect.Field>
                                            <NativeSelect.Indicator />
                                        </NativeSelect.Root>
                                    </Field.Root>

                                    {submitError === null ? null : (
                                        <Alert.Root status="error" role="alert" rounded="lg">
                                            <Alert.Indicator />
                                            <Alert.Title>{submitError}</Alert.Title>
                                        </Alert.Root>
                                    )}

                                    <HStack justify="flex-end" gap="3" py="2">
                                        <Button type="button" variant="outline" onClick={onClose}>
                                            {intl.formatMessage(messages.common.cancel)}
                                        </Button>
                                        <Button type="submit" loading={formState.isSubmitting}>
                                            {intl.formatMessage(messages.common.create)}
                                        </Button>
                                    </HStack>
                                </Stack>
                            </form>
                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
};
