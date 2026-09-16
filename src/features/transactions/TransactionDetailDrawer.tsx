import React from "react";
import {Alert, CloseButton, Drawer, Portal, Skeleton, Stack} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {useNavigate, useParams} from "react-router";
import {TransactionsRepository} from "@/data/transactionsRepository";
import type {Transaction} from "@/data/types";
import {TransactionDetailActions} from "@/features/transactions/TransactionDetailActions";
import {TransactionDetailContent} from "@/features/transactions/TransactionDetailContent";
import {buildTransactionAvatarMaps} from "@/features/transactions/transactionsFormat";
import type {TransactionAvatarMaps, TransactionNameMaps} from "@/features/transactions/transactionsFormat";
import {useDomainReference} from "@/hooks/useDomainReference";
import {DESKTOP_QUERY, useMediaQuery} from "@/hooks/useMediaQuery";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";

type FetchedTransaction = {
    id: string;
    transaction: Transaction | null;
    error: string | null;
};

export const TransactionDetailDrawer = () => {
    const intl = useIntl();
    const navigate = useNavigate();
    const {id} = useParams<{id: string}>();
    const token = useAuthStore(state => state.token);
    const cached = useAppStore(state => (id === undefined ? null : (state.transactions.find(transaction => transaction.id === id) ?? null)));
    const reference = useDomainReference();
    const isDesktop = useMediaQuery(DESKTOP_QUERY);
    const [fetched, setFetched] = React.useState<FetchedTransaction>({id: "", transaction: null, error: null});
    const fetchedIsCurrent = id !== undefined && fetched.id === id;
    const transaction = cached ?? (fetchedIsCurrent ? fetched.transaction : null);
    const error = fetchedIsCurrent ? fetched.error : null;
    const isLoading = id !== undefined && transaction === null && error === null;

    React.useEffect(() => {
        if (id === undefined || cached !== null || token === null) return;
        let active = true;
        void new TransactionsRepository(token).get(id).then(result => {
            if (!active) return;
            setFetched(result.ok ? {id, transaction: result.value, error: null} : {id, transaction: null, error: result.error.message});
        });
        return () => {
            active = false;
        };
    }, [cached, id, token]);

    const names: TransactionNameMaps = {
        accounts: React.useMemo(() => new Map(reference.accounts.map(account => [account.id, account.name])), [reference.accounts]),
        categories: React.useMemo(() => new Map(reference.categories.map(category => [category.id, category.name])), [reference.categories]),
        merchants: React.useMemo(() => new Map(reference.merchants.map(merchant => [merchant.id, merchant.name])), [reference.merchants]),
    };

    const avatars: TransactionAvatarMaps = React.useMemo(() => buildTransactionAvatarMaps(reference.accounts, reference.categories), [reference.accounts, reference.categories]);

    const close = () => navigate(ROUTES.transactions);

    return (
        <Drawer.Root open placement={isDesktop ? "end" : "bottom"} size={isDesktop ? "md" : "full"} onOpenChange={event => (!event.open ? close() : undefined)}>
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content maxH={isDesktop ? "100dvh" : "92dvh"} roundedTop={isDesktop ? undefined : "2xl"}>
                        <Drawer.Header>
                            <Drawer.Title>{intl.formatMessage(messages.transactions.detail.panelTitle)}</Drawer.Title>
                            <Drawer.CloseTrigger asChild>
                                <CloseButton aria-label={intl.formatMessage(messages.transactions.detail.close)} />
                            </Drawer.CloseTrigger>
                        </Drawer.Header>
                        <Drawer.Body pb={{base: "calc(1rem + env(safe-area-inset-bottom))", md: "8"}}>
                            {isLoading || reference.isLoading ? <Skeleton h="28rem" rounded="xl" /> : null}
                            {error === null && reference.error === null ? null : (
                                <Alert.Root status="error" role="alert" rounded="lg">
                                    <Alert.Indicator />
                                    <Alert.Title>{error ?? reference.error?.message}</Alert.Title>
                                </Alert.Root>
                            )}
                            {!isLoading && !reference.isLoading && error === null && reference.error === null && transaction !== null ? (
                                <Stack gap="4">
                                    <TransactionDetailContent transaction={transaction} names={names} avatars={avatars} />
                                    <TransactionDetailActions transaction={transaction} onDeleted={close} />
                                </Stack>
                            ) : null}
                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
};
