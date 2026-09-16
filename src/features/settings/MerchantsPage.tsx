import React from "react";
import {Alert, Box, Button, Card, Dialog, HStack, Heading, Input, Portal, Stack, Text} from "@chakra-ui/react";
import {PlusIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {MerchantsRepository} from "@/data/merchantsRepository";
import type {Merchant} from "@/data/types";
import {MerchantFormDrawer} from "@/features/settings/MerchantFormDrawer";
import {useDomainReference} from "@/hooks/useDomainReference";
import {messages} from "@/lib/i18n";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";

export const MerchantsPage = () => {
    const intl = useIntl();
    const token = useAuthStore(state => state.token);
    const {merchants, categories, isLoading, error} = useDomainReference();
    const [searchQuery, setSearchQuery] = React.useState("");
    const [createOpen, setCreateOpen] = React.useState(false);
    const [deleteTarget, setDeleteTarget] = React.useState<Merchant | null>(null);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);

    const handleSaved = (merchant: Merchant) => {
        const current = useAppStore.getState().merchants;
        useAppStore.getState().setMerchants([merchant, ...current]);
        setCreateOpen(false);
    };

    const handleDelete = async () => {
        if (token === null || deleteTarget === null) return;
        setDeleteError(null);
        const result = await new MerchantsRepository(token).delete(deleteTarget.id);
        if (!result.ok) {
            setDeleteError(result.error.message);
            return;
        }
        const current = useAppStore.getState().merchants;
        useAppStore.getState().setMerchants(current.filter(m => m.id !== deleteTarget.id));
        setDeleteTarget(null);
    };

    if (isLoading) {
        return (
            <Box p={{base: 4, md: 6}}>
                <Heading size="xl" mb="6">
                    {intl.formatMessage(messages.merchants.title)}
                </Heading>
                <Text>{intl.formatMessage(messages.common.loading)}</Text>
            </Box>
        );
    }

    if (error !== null) {
        return (
            <Box p={{base: 4, md: 6}}>
                <Heading size="xl" mb="6">
                    {intl.formatMessage(messages.merchants.title)}
                </Heading>
                <Alert.Root status="error" rounded="lg">
                    <Alert.Indicator />
                    <Alert.Title>{intl.formatMessage(messages.merchants.loadFailed)}</Alert.Title>
                </Alert.Root>
            </Box>
        );
    }

    const filtered = merchants.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <React.Fragment>
            <Box maxW="7xl" mx="auto">
                <HStack justify="space-between" mb="6">
                    <Heading size="xl">{intl.formatMessage(messages.merchants.title)}</Heading>
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <PlusIcon />
                        {intl.formatMessage(messages.merchants.createAction)}
                    </Button>
                </HStack>

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
                                <Button onClick={() => setCreateOpen(true)}>
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
                                <Card.Root key={merchant.id} cursor="pointer" onClick={() => setDeleteTarget(merchant)} _hover={{bg: "brand.active"}}>
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

            {createOpen ? <MerchantFormDrawer categories={categories} onSaved={handleSaved} onClose={() => setCreateOpen(false)} /> : null}

            <Dialog.Root open={deleteTarget !== null} placement="center" role="alertdialog" onOpenChange={event => (!event.open ? setDeleteTarget(null) : undefined)}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>{intl.formatMessage(messages.merchants.deleteTitle)}</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                <Stack gap="3">
                                    <Text>{intl.formatMessage(messages.merchants.deleteDescription)}</Text>
                                    {deleteError === null ? null : (
                                        <Alert.Root status="error" role="alert" rounded="lg">
                                            <Alert.Indicator />
                                            <Alert.Title>{deleteError}</Alert.Title>
                                        </Alert.Root>
                                    )}
                                </Stack>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
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
