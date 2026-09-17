import React from "react";
import {Alert, Box, Button, Card, Center, HStack, Heading, Stack, Text} from "@chakra-ui/react";
import {Icon as IconifyIcon} from "@iconify/react";
import {PlusIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {PageHeader} from "@/components/layout/PageHeader";
import type {Account} from "@/data/types";
import {AccountFormDrawer} from "@/features/settings/AccountFormDrawer";
import {useDomainReference} from "@/hooks/useDomainReference";
import {isLightColor} from "@/lib/colors";
import {messages} from "@/lib/i18n";
import {centsToDollars} from "@/lib/money";
import {useAppStore} from "@/stores/appStore";

export const AccountsPage = () => {
    const intl = useIntl();
    const {accounts, isLoading, error} = useDomainReference();
    const [drawerAccount, setDrawerAccount] = React.useState<Account | null | undefined>(undefined);

    const handleSaved = (account: Account) => {
        const current = useAppStore.getState().accounts;
        const existing = current.find(a => a.id === account.id);
        const next = existing === undefined ? [account, ...current] : current.map(a => (a.id === account.id ? account : a));
        useAppStore.getState().setAccounts(next);
        setDrawerAccount(undefined);
    };

    const handleDeleted = (id: string) => {
        const current = useAppStore.getState().accounts;
        useAppStore.getState().setAccounts(current.filter(a => a.id !== id));
        setDrawerAccount(undefined);
    };

    if (isLoading) {
        return (
            <React.Fragment>
                <PageHeader title={intl.formatMessage(messages.accounts.title)} />
                <Text>{intl.formatMessage(messages.common.loading)}</Text>
            </React.Fragment>
        );
    }

    if (error !== null) {
        return (
            <React.Fragment>
                <PageHeader title={intl.formatMessage(messages.accounts.title)} />
                <Alert.Root status="error" rounded="lg">
                    <Alert.Indicator />
                    <Alert.Title>{intl.formatMessage(messages.accounts.loadFailed)}</Alert.Title>
                </Alert.Root>
            </React.Fragment>
        );
    }

    const kindLabel = (kind: Account["kind"]) => {
        switch (kind) {
            case "cash":
                return intl.formatMessage(messages.accounts.kindCash);
            case "bank":
                return intl.formatMessage(messages.accounts.kindBank);
            case "credit_card":
                return intl.formatMessage(messages.accounts.kindCreditCard);
            case "e_wallet":
                return intl.formatMessage(messages.accounts.kindEWallet);
            case "other":
                return intl.formatMessage(messages.accounts.kindOther);
        }
    };

    return (
        <React.Fragment>
            <PageHeader
                title={intl.formatMessage(messages.accounts.title)}
                actions={
                    <Button size="sm" onClick={() => setDrawerAccount(null)}>
                        <PlusIcon />
                        {intl.formatMessage(messages.accounts.createAction)}
                    </Button>
                }
            />

            <Box>
                {accounts.length === 0 ? (
                    <Card.Root>
                        <Card.Body>
                            <Stack gap="4" align="center" py="8">
                                <Heading size="lg">{intl.formatMessage(messages.accounts.emptyTitle)}</Heading>
                                <Text color="fg.muted" textAlign="center">
                                    {intl.formatMessage(messages.accounts.emptyDescription)}
                                </Text>
                                <Button onClick={() => setDrawerAccount(null)}>
                                    <PlusIcon />
                                    {intl.formatMessage(messages.accounts.createAction)}
                                </Button>
                            </Stack>
                        </Card.Body>
                    </Card.Root>
                ) : (
                    <Stack gap="3">
                        {accounts.map(account => {
                            const icon = account.icon ?? null;
                            const color = account.color ?? null;
                            const tone = color === null ? "fg" : isLightColor(color) ? "gray.800" : "white";
                            return (
                                <Card.Root key={account.id} cursor="pointer" onClick={() => setDrawerAccount(account)} _hover={{bg: "brand.active"}}>
                                    <Card.Body>
                                        <HStack justify="space-between">
                                            <HStack gap="3">
                                                {icon === null && color === null ? null : (
                                                    <Center w="10" h="10" rounded="lg" bg={color ?? "bg.subtle"} color={tone} flexShrink={0}>
                                                        {icon === null ? null : <IconifyIcon icon={icon} width="22" height="22" />}
                                                    </Center>
                                                )}
                                                <Box>
                                                    <Text fontWeight="semibold">{account.name}</Text>
                                                    <Text fontSize="sm" color="fg.muted">
                                                        {kindLabel(account.kind)} · {account.currency}
                                                    </Text>
                                                </Box>
                                            </HStack>
                                            <Text fontWeight="semibold" fontVariantNumeric="tabular-nums">
                                                {centsToDollars(account.balance_cents ?? account.initial_balance_cents)}
                                            </Text>
                                        </HStack>
                                    </Card.Body>
                                </Card.Root>
                            );
                        })}
                    </Stack>
                )}
            </Box>

            {drawerAccount === undefined ? null : <AccountFormDrawer account={drawerAccount} onSaved={handleSaved} onDeleted={handleDeleted} onClose={() => setDrawerAccount(undefined)} />}
        </React.Fragment>
    );
};
