import React from "react";
import {Alert, Box, Button, Card, HStack, Heading, Input, Stack, Text} from "@chakra-ui/react";
import {PlusIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {PageHeader} from "@/components/layout/PageHeader";
import type {Merchant} from "@/data/types";
import {MerchantFormDrawer} from "@/features/settings/MerchantFormDrawer";
import {useDomainReference} from "@/hooks/useDomainReference";
import {messages} from "@/lib/i18n";
import {useAppStore} from "@/stores/appStore";

export const MerchantsPage = () => {
    const intl = useIntl();
    const {merchants, categories, isLoading, error} = useDomainReference();
    const [searchQuery, setSearchQuery] = React.useState("");
    const [drawerMerchant, setDrawerMerchant] = React.useState<Merchant | null | undefined>(undefined);

    const handleSaved = (merchant: Merchant) => {
        const current = useAppStore.getState().merchants;
        const existing = current.find(m => m.id === merchant.id);
        const next = existing === undefined ? [merchant, ...current] : current.map(m => (m.id === merchant.id ? merchant : m));
        useAppStore.getState().setMerchants(next);
        setDrawerMerchant(undefined);
    };

    const handleDeleted = (id: string) => {
        const current = useAppStore.getState().merchants;
        useAppStore.getState().setMerchants(current.filter(m => m.id !== id));
        setDrawerMerchant(undefined);
    };

    if (isLoading) {
        return (
            <React.Fragment>
                <PageHeader title={intl.formatMessage(messages.merchants.title)} />
                <Text>{intl.formatMessage(messages.common.loading)}</Text>
            </React.Fragment>
        );
    }

    if (error !== null) {
        return (
            <React.Fragment>
                <PageHeader title={intl.formatMessage(messages.merchants.title)} />
                <Alert.Root status="error" rounded="lg">
                    <Alert.Indicator />
                    <Alert.Title>{intl.formatMessage(messages.merchants.loadFailed)}</Alert.Title>
                </Alert.Root>
            </React.Fragment>
        );
    }

    const filtered = merchants.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <React.Fragment>
            <PageHeader
                title={intl.formatMessage(messages.merchants.title)}
                actions={
                    <Button size="sm" onClick={() => setDrawerMerchant(null)}>
                        <PlusIcon />
                        {intl.formatMessage(messages.merchants.createAction)}
                    </Button>
                }
            />

            <Box>
                <Box mb="4">
                    <Input placeholder={intl.formatMessage(messages.merchants.search)} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </Box>

                {merchants.length === 0 ? (
                    <Card.Root>
                        <Card.Body>
                            <Stack gap="4" align="center" py="8">
                                <Heading size="lg">{intl.formatMessage(messages.merchants.emptyTitle)}</Heading>
                                <Text color="fg.muted" textAlign="center">
                                    {intl.formatMessage(messages.merchants.emptyDescription)}
                                </Text>
                                <Button onClick={() => setDrawerMerchant(null)}>
                                    <PlusIcon />
                                    {intl.formatMessage(messages.merchants.createAction)}
                                </Button>
                            </Stack>
                        </Card.Body>
                    </Card.Root>
                ) : filtered.length === 0 ? (
                    <Card.Root>
                        <Card.Body>
                            <Stack gap="4" align="center" py="8">
                                <Text color="fg.muted">{intl.formatMessage(messages.merchants.noResults)}</Text>
                            </Stack>
                        </Card.Body>
                    </Card.Root>
                ) : (
                    <Stack gap="3">
                        {filtered.map(merchant => {
                            const defaultCategory = merchant.default_category_id === null ? null : categories.find(c => c.id === merchant.default_category_id);
                            return (
                                <Card.Root key={merchant.id} cursor="pointer" onClick={() => setDrawerMerchant(merchant)} _hover={{bg: "brand.active"}}>
                                    <Card.Body>
                                        <HStack justify="space-between">
                                            <Box>
                                                <Text fontWeight="semibold">{merchant.name}</Text>
                                                <Text fontSize="sm" color="fg.muted">
                                                    {defaultCategory === null || defaultCategory === undefined ? null : (
                                                        <React.Fragment>
                                                            {intl.formatMessage(messages.merchants.defaultCategory)}：{defaultCategory.name}
                                                        </React.Fragment>
                                                    )}
                                                </Text>
                                            </Box>
                                        </HStack>
                                    </Card.Body>
                                </Card.Root>
                            );
                        })}
                    </Stack>
                )}
            </Box>

            {drawerMerchant === undefined ? null : (
                <MerchantFormDrawer merchant={drawerMerchant} categories={categories} onSaved={handleSaved} onDeleted={handleDeleted} onClose={() => setDrawerMerchant(undefined)} />
            )}
        </React.Fragment>
    );
};
