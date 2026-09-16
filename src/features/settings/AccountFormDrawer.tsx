import React from "react";
import {zodResolver} from "@hookform/resolvers/zod";
import {Alert, Button, CloseButton, Dialog, Drawer, Field, HStack, Input, NativeSelect, Portal, Stack} from "@chakra-ui/react";
import {useForm, useWatch} from "react-hook-form";
import {useIntl} from "react-intl";
import {z} from "zod";
import {ColorPicker} from "@/components/ColorPicker";
import {IconPicker} from "@/components/IconPicker";
import {AccountsRepository} from "@/data/accountsRepository";
import type {Account, AccountKind} from "@/data/types";
import {DESKTOP_QUERY, useMediaQuery} from "@/hooks/useMediaQuery";
import {FLAT_UI_COLORS} from "@/lib/colors";
import {formatMessage, messages} from "@/lib/i18n";
import {centsToDollars} from "@/lib/money";
import {useAuthStore} from "@/stores/authStore";

const accountFormSchema = z.object({
    name: z.string().trim().min(1, formatMessage(messages.fields.required)),
    kind: z.enum(["cash", "bank", "credit_card", "e_wallet", "other"]),
    initialBalance: z.string().trim(),
    icon: z.string().trim(),
    color: z.string().trim(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

type AccountFormDrawerProps = {
    account: Account | null;
    onSaved: (account: Account) => void;
    onDeleted?: (id: string) => void;
    onClose: () => void;
};

function accountToFormValues(account: Account): AccountFormValues {
    return {
        name: account.name,
        kind: account.kind,
        initialBalance: (account.initial_balance_cents / 100).toFixed(2),
        icon: account.icon ?? "",
        color: account.color ?? "",
    };
}

function formValuesToInput(values: AccountFormValues) {
    const amount = parseFloat(values.initialBalance);
    return {
        name: values.name,
        kind: values.kind,
        currency: "HKD" as const,
        initial_balance_cents: isNaN(amount) ? 0 : Math.round(amount * 100),
        icon: values.icon === "" ? null : values.icon,
        color: values.color === "" ? null : values.color,
    };
}

const ACCOUNT_KINDS: {value: AccountKind; label: string}[] = [
    {value: "cash", label: formatMessage(messages.accounts.kindCash)},
    {value: "bank", label: formatMessage(messages.accounts.kindBank)},
    {value: "credit_card", label: formatMessage(messages.accounts.kindCreditCard)},
    {value: "e_wallet", label: formatMessage(messages.accounts.kindEWallet)},
    {value: "other", label: formatMessage(messages.accounts.kindOther)},
];

export const AccountFormDrawer = ({account, onSaved, onDeleted, onClose}: AccountFormDrawerProps) => {
    const intl = useIntl();
    const isDesktop = useMediaQuery(DESKTOP_QUERY);
    const token = useAuthStore(state => state.token);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const {register, handleSubmit, control, setValue, formState} = useForm<AccountFormValues>({
        resolver: zodResolver(accountFormSchema),
        defaultValues:
            account === null
                ? {
                      name: "",
                      kind: "cash",
                      initialBalance: "0.00",
                      icon: "",
                      color: FLAT_UI_COLORS[0],
                  }
                : accountToFormValues(account),
    });

    const selectedColor = useWatch({control, name: "color"});
    const selectedIcon = useWatch({control, name: "icon"});
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
        const repository = new AccountsRepository(token);
        const input = formValuesToInput(values);
        const result = account === null ? await repository.create(input) : await repository.update(account.id, input);
        if (!result.ok) {
            setSubmitError(result.error.message);
            return;
        }
        onSaved(result.value);
        onClose();
    });

    const handleDelete = async () => {
        if (token === null || account === null) return;
        setSubmitError(null);
        const result = await new AccountsRepository(token).delete(account.id);
        if (!result.ok) {
            setSubmitError(result.error.message);
            setDeleteOpen(false);
            return;
        }
        onDeleted?.(account.id);
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
                                <Drawer.Title>{intl.formatMessage(account === null ? messages.accounts.createTitle : messages.accounts.editTitle)}</Drawer.Title>
                                <Drawer.CloseTrigger asChild>
                                    <CloseButton aria-label={intl.formatMessage(messages.common.close)} />
                                </Drawer.CloseTrigger>
                            </Drawer.Header>
                            <Drawer.Body pb={{base: "calc(1rem + env(safe-area-inset-bottom))", md: "8"}}>
                                <form onSubmit={submit} noValidate>
                                    <Stack gap="5">
                                        <Field.Root required invalid={formState.errors.name !== undefined}>
                                            <Field.Label>{intl.formatMessage(messages.accounts.name)}</Field.Label>
                                            <Input autoFocus {...register("name")} />
                                            {formState.errors.name === undefined ? null : <Field.ErrorText>{formState.errors.name.message}</Field.ErrorText>}
                                        </Field.Root>

                                        <Field.Root required>
                                            <Field.Label>{intl.formatMessage(messages.accounts.kind)}</Field.Label>
                                            <NativeSelect.Root>
                                                <NativeSelect.Field {...register("kind")}>
                                                    {ACCOUNT_KINDS.map(({value, label}) => (
                                                        <option key={value} value={value}>
                                                            {label}
                                                        </option>
                                                    ))}
                                                </NativeSelect.Field>
                                                <NativeSelect.Indicator />
                                            </NativeSelect.Root>
                                        </Field.Root>

                                        <Field.Root required invalid={formState.errors.initialBalance !== undefined}>
                                            <Field.Label>{intl.formatMessage(messages.accounts.initialBalance)}</Field.Label>
                                            <Input inputMode="decimal" placeholder="0.00" {...register("initialBalance")} />
                                            {formState.errors.initialBalance === undefined ? null : <Field.ErrorText>{formState.errors.initialBalance.message}</Field.ErrorText>}
                                        </Field.Root>

                                        {account === null ? null : (
                                            <Field.Root>
                                                <Field.Label>{intl.formatMessage(messages.accounts.currentBalance)}</Field.Label>
                                                <Input value={centsToDollars(account.balance_cents ?? 0)} readOnly disabled />
                                            </Field.Root>
                                        )}

                                        <Field.Root>
                                            <Field.Label>{intl.formatMessage(messages.accounts.currency)}</Field.Label>
                                            <Input value="HKD" readOnly disabled />
                                        </Field.Root>

                                        <Field.Root>
                                            <Field.Label>{intl.formatMessage(messages.accounts.color)}</Field.Label>
                                            <ColorPicker value={selectedColor} onChange={color => setValue("color", color, {shouldDirty: true})} />
                                        </Field.Root>

                                        <Field.Root>
                                            <Field.Label>{intl.formatMessage(messages.accounts.icon)}</Field.Label>
                                            <IconPicker value={selectedIcon} onChange={icon => setValue("icon", icon, {shouldDirty: true})} />
                                        </Field.Root>

                                        {submitError === null ? null : (
                                            <Alert.Root status="error" role="alert" rounded="lg">
                                                <Alert.Indicator />
                                                <Alert.Title>{submitError}</Alert.Title>
                                            </Alert.Root>
                                        )}

                                        <HStack justify={account === null ? "flex-end" : "space-between"} gap="3" py="2">
                                            {account === null ? null : (
                                                <Button type="button" variant="outline" colorPalette="red" onClick={() => setDeleteOpen(true)}>
                                                    {intl.formatMessage(messages.common.delete)}
                                                </Button>
                                            )}
                                            <HStack gap="3" ml="auto">
                                                <Button type="button" variant="outline" onClick={requestClose}>
                                                    {intl.formatMessage(messages.common.cancel)}
                                                </Button>
                                                <Button type="submit" loading={formState.isSubmitting}>
                                                    {intl.formatMessage(account === null ? messages.common.create : messages.common.save)}
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
                                <Dialog.Title>{intl.formatMessage(messages.accounts.deleteTitle)}</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>{intl.formatMessage(messages.accounts.deleteDescription)}</Dialog.Body>
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
