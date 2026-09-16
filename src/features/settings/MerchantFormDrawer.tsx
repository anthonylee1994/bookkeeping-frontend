import React from "react";
import {zodResolver} from "@hookform/resolvers/zod";
import {Alert, Button, CloseButton, Dialog, Drawer, Field, HStack, Input, NativeSelect, Portal, Stack} from "@chakra-ui/react";
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
    merchant: Merchant | null;
    categories: Category[];
    onSaved: (merchant: Merchant) => void;
    onDeleted?: (id: string) => void;
    onClose: () => void;
};

function merchantToFormValues(merchant: Merchant): MerchantFormValues {
    return {
        name: merchant.name,
        defaultCategoryId: merchant.default_category_id ?? "",
    };
}

export const MerchantFormDrawer = ({merchant, categories, onSaved, onDeleted, onClose}: MerchantFormDrawerProps) => {
    const intl = useIntl();
    const isDesktop = useMediaQuery(DESKTOP_QUERY);
    const token = useAuthStore(state => state.token);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const {register, handleSubmit, formState} = useForm<MerchantFormValues>({
        resolver: zodResolver(merchantFormSchema),
        defaultValues: merchant === null ? {name: "", defaultCategoryId: ""} : merchantToFormValues(merchant),
    });

    const {isDirty} = formState;

    const requestClose = () => {
        if (isDirty) {
            setConfirmOpen(true);
            return;
        }
        onClose();
    };

    const discard = () => {
        setConfirmOpen(false);
        onClose();
    };

    const submit = handleSubmit(async values => {
        if (token === null) return;
        setSubmitError(null);
        const repository = new MerchantsRepository(token);
        const input = {
            name: values.name,
            default_category_id: values.defaultCategoryId === "" ? null : values.defaultCategoryId,
        };
        const result = merchant === null ? await repository.create(input) : await repository.update(merchant.id, input);
        if (!result.ok) {
            setSubmitError(result.error.message);
            return;
        }
        onSaved(result.value);
        onClose();
    });

    const handleDelete = async () => {
        if (token === null || merchant === null) return;
        setSubmitError(null);
        const result = await new MerchantsRepository(token).delete(merchant.id);
        if (!result.ok) {
            setSubmitError(result.error.message);
            setDeleteOpen(false);
            return;
        }
        onDeleted?.(merchant.id);
        setDeleteOpen(false);
        onClose();
    };

    return (
        <React.Fragment>
            <Drawer.Root open placement={isDesktop ? "end" : "bottom"} size={isDesktop ? "md" : "full"} onOpenChange={event => (!event.open ? requestClose() : undefined)}>
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content maxH={isDesktop ? "100dvh" : "92dvh"} roundedTop={isDesktop ? undefined : "2xl"}>
                            <Drawer.Header>
                                <Drawer.Title>{intl.formatMessage(merchant === null ? messages.merchants.createTitle : messages.merchants.editTitle)}</Drawer.Title>
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

                                        <HStack justify={merchant === null ? "flex-end" : "space-between"} gap="3" py="2">
                                            {merchant === null ? null : (
                                                <Button type="button" variant="outline" colorPalette="red" onClick={() => setDeleteOpen(true)}>
                                                    {intl.formatMessage(messages.common.delete)}
                                                </Button>
                                            )}
                                            <HStack gap="3" ml="auto">
                                                <Button type="button" variant="outline" onClick={requestClose}>
                                                    {intl.formatMessage(messages.common.cancel)}
                                                </Button>
                                                <Button type="submit" loading={formState.isSubmitting}>
                                                    {intl.formatMessage(merchant === null ? messages.common.create : messages.common.save)}
                                                </Button>
                                            </HStack>
                                        </HStack>
                                    </Stack>
                                </form>
                            </Drawer.Body>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>

            <Dialog.Root open={confirmOpen} placement="center" role="alertdialog" onOpenChange={event => setConfirmOpen(event.open)}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>{intl.formatMessage(messages.transactions.form.leaveTitle)}</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>{intl.formatMessage(messages.transactions.form.leaveDescription)}</Dialog.Body>
                            <Dialog.Footer>
                                <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
                                    {intl.formatMessage(messages.transactions.form.stay)}
                                </Button>
                                <Button type="button" colorPalette="red" onClick={discard}>
                                    {intl.formatMessage(messages.transactions.form.leave)}
                                </Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            <Dialog.Root open={deleteOpen} placement="center" role="alertdialog" onOpenChange={event => setDeleteOpen(event.open)}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>{intl.formatMessage(messages.merchants.deleteTitle)}</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>{intl.formatMessage(messages.merchants.deleteDescription)}</Dialog.Body>
                            <Dialog.Footer>
                                <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
                                    {intl.formatMessage(messages.common.cancel)}
                                </Button>
                                <Button type="button" colorPalette="red" onClick={handleDelete}>
                                    {intl.formatMessage(messages.common.delete)}
                                </Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </React.Fragment>
    );
};
