import React from "react";
import {Alert, Button, Dialog, HStack, Portal, Stack} from "@chakra-ui/react";
import {CopyIcon, PencilIcon, Trash2Icon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link, useNavigate} from "react-router";
import {TransactionsRepository} from "@/data/transactionsRepository";
import type {Transaction} from "@/data/types";
import {messages} from "@/lib/i18n";
import {transactionDetailPath, transactionEditPath} from "@/routes/paths";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";

type TransactionDetailActionsProps = {
    transaction: Transaction;
    onDeleted: () => void;
};

export const TransactionDetailActions = ({transaction, onDeleted}: TransactionDetailActionsProps) => {
    const intl = useIntl();
    const navigate = useNavigate();
    const token = useAuthStore(state => state.token);
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [isDeleting, setDeleting] = React.useState(false);
    const [isDuplicating, setDuplicating] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);
    const [duplicateError, setDuplicateError] = React.useState<string | null>(null);

    const deleteTransaction = async () => {
        if (token === null) return;
        setDeleting(true);
        setDeleteError(null);
        const result = await new TransactionsRepository(token).delete(transaction.id);
        setDeleting(false);
        if (!result.ok) {
            setDeleteError(result.error.message);
            return;
        }

        const store = useAppStore.getState();
        store.setTransactions(
            store.transactions.filter(item => item.id !== transaction.id),
            store.transactionsMeta
        );
        setConfirmOpen(false);
        onDeleted();
    };

    const duplicateTransaction = async () => {
        if (token === null) return;
        setDuplicating(true);
        setDuplicateError(null);
        const result = await new TransactionsRepository(token).duplicate(transaction.id);
        setDuplicating(false);
        if (!result.ok) {
            setDuplicateError(result.error.message);
            return;
        }

        const store = useAppStore.getState();
        store.setTransactions([result.value, ...store.transactions], store.transactionsMeta);
        navigate(transactionDetailPath(result.value.id));
    };

    return (
        <React.Fragment>
            <Stack gap="2" pt="1">
                {duplicateError === null ? null : (
                    <Alert.Root status="error" role="alert" rounded="lg">
                        <Alert.Indicator />
                        <Alert.Title>{duplicateError}</Alert.Title>
                    </Alert.Root>
                )}
                <HStack justify={{base: "flex-start", md: "flex-end"}} gap="3" wrap="wrap" direction={{base: "column", md: "row"}}>
                    <Button asChild variant="outline" w={{base: "full", md: "auto"}}>
                        <Link to={transactionEditPath(transaction.id)}>
                            <PencilIcon />
                            {intl.formatMessage(messages.common.edit)}
                        </Link>
                    </Button>
                    <Button type="button" variant="outline" loading={isDuplicating} w={{base: "full", md: "auto"}} onClick={duplicateTransaction}>
                        <CopyIcon />
                        {intl.formatMessage(messages.transactions.detail.duplicate)}
                    </Button>
                    <Button type="button" colorPalette="red" variant="outline" w={{base: "full", md: "auto"}} onClick={() => setConfirmOpen(true)}>
                        <Trash2Icon />
                        {intl.formatMessage(messages.common.delete)}
                    </Button>
                </HStack>
            </Stack>

            <Dialog.Root open={confirmOpen} role="alertdialog" onOpenChange={event => setConfirmOpen(event.open)}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>{intl.formatMessage(messages.transactions.detail.deleteTitle)}</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                <Stack gap="3">
                                    {intl.formatMessage(messages.transactions.detail.deleteDescription)}
                                    {deleteError === null ? null : (
                                        <Alert.Root status="error" role="alert" rounded="lg">
                                            <Alert.Indicator />
                                            <Alert.Title>{deleteError}</Alert.Title>
                                        </Alert.Root>
                                    )}
                                </Stack>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Button type="button" variant="outline" disabled={isDeleting} onClick={() => setConfirmOpen(false)}>
                                    {intl.formatMessage(messages.common.cancel)}
                                </Button>
                                <Button type="button" colorPalette="red" loading={isDeleting} onClick={deleteTransaction}>
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
