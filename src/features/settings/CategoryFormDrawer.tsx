import React from "react";
import {zodResolver} from "@hookform/resolvers/zod";
import {Alert, Button, CloseButton, Dialog, Drawer, Field, HStack, Input, NativeSelect, Portal, Stack} from "@chakra-ui/react";
import {useForm, useWatch} from "react-hook-form";
import {useIntl} from "react-intl";
import {z} from "zod";
import {ColorPicker} from "@/components/ColorPicker";
import {CategoriesRepository} from "@/data/categoriesRepository";
import type {Category, CategoryKind} from "@/data/types";
import {DESKTOP_QUERY, useMediaQuery} from "@/hooks/useMediaQuery";
import {FLAT_UI_COLORS} from "@/lib/colors";
import {formatMessage, messages} from "@/lib/i18n";
import {useAuthStore} from "@/stores/authStore";

const categoryFormSchema = z.object({
    name: z.string().trim().min(1, formatMessage(messages.fields.required)),
    kind: z.enum(["income", "expense"]),
    position: z.string().trim(),
    icon: z.string().trim(),
    color: z.string().trim(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

type CategoryFormDrawerProps = {
    category: Category | null;
    defaultKind: CategoryKind;
    onSaved: (category: Category) => void;
    onDeleted?: (id: string) => void;
    onClose: () => void;
};

function categoryToFormValues(category: Category): CategoryFormValues {
    return {
        name: category.name,
        kind: category.kind,
        position: category.position.toString(),
        icon: category.icon ?? "",
        color: category.color ?? "",
    };
}

function formValuesToInput(values: CategoryFormValues) {
    const position = parseInt(values.position);
    return {
        name: values.name,
        kind: values.kind,
        position: isNaN(position) ? 0 : position,
        icon: values.icon === "" ? null : values.icon,
        color: values.color === "" ? null : values.color,
    };
}

export const CategoryFormDrawer = ({category, defaultKind, onSaved, onDeleted, onClose}: CategoryFormDrawerProps) => {
    const intl = useIntl();
    const isDesktop = useMediaQuery(DESKTOP_QUERY);
    const token = useAuthStore(state => state.token);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const {register, handleSubmit, control, setValue, formState} = useForm<CategoryFormValues>({
        resolver: zodResolver(categoryFormSchema),
        defaultValues:
            category === null
                ? {
                      name: "",
                      kind: defaultKind,
                      position: "0",
                      icon: "",
                      color: FLAT_UI_COLORS[0],
                  }
                : categoryToFormValues(category),
    });

    const selectedColor = useWatch({control, name: "color"});
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
        const repository = new CategoriesRepository(token);
        const input = formValuesToInput(values);
        const result = category === null ? await repository.create(input) : await repository.update(category.id, input);
        if (!result.ok) {
            setSubmitError(result.error.message);
            return;
        }
        onSaved(result.value);
        onClose();
    });

    const handleDelete = async () => {
        if (token === null || category === null) return;
        setSubmitError(null);
        const result = await new CategoriesRepository(token).delete(category.id);
        if (!result.ok) {
            setSubmitError(result.error.message);
            setDeleteOpen(false);
            return;
        }
        onDeleted?.(category.id);
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
                                <Drawer.Title>{intl.formatMessage(category === null ? messages.categories.createTitle : messages.categories.editTitle)}</Drawer.Title>
                                <Drawer.CloseTrigger asChild>
                                    <CloseButton aria-label={intl.formatMessage(messages.common.close)} />
                                </Drawer.CloseTrigger>
                            </Drawer.Header>
                            <Drawer.Body pb={{base: "calc(1rem + env(safe-area-inset-bottom))", md: "8"}}>
                                <form onSubmit={submit} noValidate>
                                    <Stack gap="5">
                                        <Field.Root required invalid={formState.errors.name !== undefined}>
                                            <Field.Label>{intl.formatMessage(messages.categories.name)}</Field.Label>
                                            <Input autoFocus {...register("name")} />
                                            {formState.errors.name === undefined ? null : <Field.ErrorText>{formState.errors.name.message}</Field.ErrorText>}
                                        </Field.Root>

                                        <Field.Root required>
                                            <Field.Label>{intl.formatMessage(messages.categories.kind)}</Field.Label>
                                            <NativeSelect.Root>
                                                <NativeSelect.Field {...register("kind")}>
                                                    <option value="expense">{intl.formatMessage(messages.transactions.expense)}</option>
                                                    <option value="income">{intl.formatMessage(messages.transactions.income)}</option>
                                                </NativeSelect.Field>
                                                <NativeSelect.Indicator />
                                            </NativeSelect.Root>
                                        </Field.Root>

                                        <Field.Root required invalid={formState.errors.position !== undefined}>
                                            <Field.Label>{intl.formatMessage(messages.categories.position)}</Field.Label>
                                            <Input type="number" inputMode="numeric" {...register("position")} />
                                            {formState.errors.position === undefined ? null : <Field.ErrorText>{formState.errors.position.message}</Field.ErrorText>}
                                        </Field.Root>

                                        <Field.Root>
                                            <Field.Label>{intl.formatMessage(messages.categories.color)}</Field.Label>
                                            <ColorPicker value={selectedColor} onChange={color => setValue("color", color, {shouldDirty: true})} />
                                        </Field.Root>

                                        <Field.Root>
                                            <Field.Label>{intl.formatMessage(messages.categories.icon)}</Field.Label>
                                            <Input placeholder="icon" {...register("icon")} />
                                        </Field.Root>

                                        {submitError === null ? null : (
                                            <Alert.Root status="error" role="alert" rounded="lg">
                                                <Alert.Indicator />
                                                <Alert.Title>{submitError}</Alert.Title>
                                            </Alert.Root>
                                        )}

                                        <HStack justify={category === null ? "flex-end" : "space-between"} gap="3" py="2">
                                            {category === null ? null : (
                                                <Button type="button" variant="outline" colorPalette="red" onClick={() => setDeleteOpen(true)}>
                                                    {intl.formatMessage(messages.common.delete)}
                                                </Button>
                                            )}
                                            <HStack gap="3" ml="auto">
                                                <Button type="button" variant="outline" onClick={requestClose}>
                                                    {intl.formatMessage(messages.common.cancel)}
                                                </Button>
                                                <Button type="submit" loading={formState.isSubmitting}>
                                                    {intl.formatMessage(category === null ? messages.common.create : messages.common.save)}
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

            <Dialog.Root open={confirmOpen} role="alertdialog" onOpenChange={event => setConfirmOpen(event.open)}>
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

            <Dialog.Root open={deleteOpen} role="alertdialog" onOpenChange={event => setDeleteOpen(event.open)}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>{intl.formatMessage(messages.categories.deleteTitle)}</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>{intl.formatMessage(messages.categories.deleteDescription)}</Dialog.Body>
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
