import React from "react";
import {Alert, CloseButton, Drawer, Portal, Stack} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {useNavigate, useParams} from "react-router";
import {LoadingIndicator} from "@/components/layout/LoadingIndicator";
import {TransactionsRepository} from "@/data/transactionsRepository";
import type {Transaction} from "@/data/types";
import {TransactionForm} from "@/features/transactions/TransactionForm";
import {useDomainReference} from "@/hooks/useDomainReference";
import {DESKTOP_QUERY, useMediaQuery} from "@/hooks/useMediaQuery";
import {messages} from "@/lib/i18n";
import {ROUTES, transactionDetailPath} from "@/routes/paths";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";

export const TransactionFormPage = () => {
    const intl = useIntl();
    const navigate = useNavigate();
    const {id} = useParams<{id: string}>();
    const token = useAuthStore(state => state.token);
    const cached = useAppStore(state => (id === undefined ? null : (state.transactions.find(transaction => transaction.id === id) ?? null)));
    const reference = useDomainReference();
    const isDesktop = useMediaQuery(DESKTOP_QUERY);
    const [transaction, setTransaction] = React.useState<Transaction | null>(cached);
    const [isLoading, setLoading] = React.useState(id !== undefined && cached === null);
    const [loadError, setLoadError] = React.useState<string | null>(null);
    const isEdit = id !== undefined;
    const title = intl.formatMessage(isEdit ? messages.transactions.editTitle : messages.transactions.newTitle);

    React.useEffect(() => {
        if (id === undefined || cached !== null || token === null) return;
        let active = true;
        void new TransactionsRepository(token).get(id).then(result => {
            if (!active) return;
            if (result.ok) setTransaction(result.value);
            else setLoadError(result.error.message);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [cached, id, token]);

    const close = () => navigate(transaction === null ? ROUTES.transactions : transactionDetailPath(transaction.id));

    const body = (() => {
        if (isLoading || reference.isLoading) return <LoadingIndicator minH="32rem" />;
        const error = loadError ?? reference.error?.message ?? null;
        if (error !== null) {
            return (
                <Alert.Root status="error" role="alert" rounded="lg">
                    <Alert.Indicator />
                    <Alert.Title>{error}</Alert.Title>
                </Alert.Root>
            );
        }
        if (isEdit && transaction === null) {
            return (
                <Alert.Root status="error" role="alert" rounded="lg">
                    <Alert.Indicator />
                    <Alert.Title>{intl.formatMessage(messages.transactions.form.loadFailed)}</Alert.Title>
                </Alert.Root>
            );
        }
        return (
            <Stack gap="4">
                {reference.accounts.length === 0 ? (
                    <Alert.Root status="warning" rounded="lg">
                        <Alert.Indicator />
                        <Alert.Title>{intl.formatMessage(messages.transactions.form.noAccounts)}</Alert.Title>
                    </Alert.Root>
                ) : null}
                <TransactionForm transaction={transaction} accounts={reference.accounts} categories={reference.categories} merchants={reference.merchants} />
            </Stack>
        );
    })();

    return (
        <Drawer.Root open placement={isDesktop ? "end" : "bottom"} size={isDesktop ? "md" : "full"} onOpenChange={event => (!event.open ? close() : undefined)}>
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content maxH={isDesktop ? "100dvh" : "92dvh"} roundedTop={isDesktop ? undefined : "2xl"}>
                        <Drawer.Header>
                            <Drawer.Title>{title}</Drawer.Title>
                            <Drawer.CloseTrigger asChild>
                                <CloseButton aria-label={intl.formatMessage(messages.common.close)} />
                            </Drawer.CloseTrigger>
                        </Drawer.Header>
                        <Drawer.Body pb={{base: "calc(1rem + env(safe-area-inset-bottom))", md: "8"}}>{body}</Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
};
