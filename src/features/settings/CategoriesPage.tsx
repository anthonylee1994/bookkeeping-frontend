import React from "react";
import {Alert, Box, Button, Card, HStack, Heading, Stack, Tabs, Text} from "@chakra-ui/react";
import {PlusIcon} from "lucide-react";
import {useIntl} from "react-intl";
import type {Category, CategoryKind} from "@/data/types";
import {CategoryFormDrawer} from "@/features/settings/CategoryFormDrawer";
import {useDomainReference} from "@/hooks/useDomainReference";
import {messages} from "@/lib/i18n";
import {useAppStore} from "@/stores/appStore";

export const CategoriesPage = () => {
    const intl = useIntl();
    const {categories, isLoading, error} = useDomainReference();
    const [activeKind, setActiveKind] = React.useState<CategoryKind>("expense");
    const [drawerCategory, setDrawerCategory] = React.useState<Category | null | undefined>(undefined);

    const handleSaved = (category: Category) => {
        const current = useAppStore.getState().categories;
        const existing = current.find(c => c.id === category.id);
        const next = existing === undefined ? [category, ...current] : current.map(c => (c.id === category.id ? category : c));
        useAppStore.getState().setCategories(next);
        setDrawerCategory(undefined);
    };

    const handleDeleted = (id: string) => {
        const current = useAppStore.getState().categories;
        useAppStore.getState().setCategories(current.filter(c => c.id !== id));
        setDrawerCategory(undefined);
    };

    if (isLoading) {
        return (
            <Box p={{base: 4, md: 6}}>
                <Heading size="xl" mb="6">
                    {intl.formatMessage(messages.categories.title)}
                </Heading>
                <Text>{intl.formatMessage(messages.common.loading)}</Text>
            </Box>
        );
    }

    if (error !== null) {
        return (
            <Box p={{base: 4, md: 6}}>
                <Heading size="xl" mb="6">
                    {intl.formatMessage(messages.categories.title)}
                </Heading>
                <Alert.Root status="error" rounded="lg">
                    <Alert.Indicator />
                    <Alert.Title>{intl.formatMessage(messages.categories.loadFailed)}</Alert.Title>
                </Alert.Root>
            </Box>
        );
    }

    const filtered = categories.filter(c => c.kind === activeKind).sort((a, b) => a.position - b.position);

    return (
        <React.Fragment>
            <Box p={{base: 4, md: 6}} maxW="7xl" mx="auto">
                <HStack justify="space-between" mb="6">
                    <Heading size="xl">{intl.formatMessage(messages.categories.title)}</Heading>
                    <Button size="sm" onClick={() => setDrawerCategory(null)}>
                        <PlusIcon />
                        {intl.formatMessage(messages.categories.createAction)}
                    </Button>
                </HStack>

                <Tabs.Root value={activeKind} onValueChange={e => setActiveKind(e.value as CategoryKind)}>
                    <Tabs.List>
                        <Tabs.Trigger value="expense">{intl.formatMessage(messages.transactions.expense)}</Tabs.Trigger>
                        <Tabs.Trigger value="income">{intl.formatMessage(messages.transactions.income)}</Tabs.Trigger>
                    </Tabs.List>

                    <Box mt="6">
                        {filtered.length === 0 ? (
                            <Card.Root>
                                <Card.Body>
                                    <Stack gap="4" align="center" py="8">
                                        <Heading size="lg">{intl.formatMessage(activeKind === "income" ? messages.categories.emptyIncome : messages.categories.emptyExpense)}</Heading>
                                        <Text color="fg.muted" textAlign="center">
                                            {intl.formatMessage(messages.categories.emptyDescription)}
                                        </Text>
                                        <Button onClick={() => setDrawerCategory(null)}>
                                            <PlusIcon />
                                            {intl.formatMessage(messages.categories.createAction)}
                                        </Button>
                                    </Stack>
                                </Card.Body>
                            </Card.Root>
                        ) : (
                            <Stack gap="3">
                                {filtered.map(category => (
                                    <Card.Root key={category.id} cursor="pointer" onClick={() => setDrawerCategory(category)} _hover={{bg: "brand.active"}}>
                                        <Card.Body>
                                            <HStack justify="space-between">
                                                <HStack gap="3">
                                                    {category.color === null ? null : <Box w="10" h="10" rounded="lg" bg={category.color} flexShrink={0} />}
                                                    <Box>
                                                        <Text fontWeight="semibold">{category.name}</Text>
                                                        <Text fontSize="sm" color="fg.muted">
                                                            {intl.formatMessage(messages.categories.position)} {category.position}
                                                        </Text>
                                                    </Box>
                                                </HStack>
                                            </HStack>
                                        </Card.Body>
                                    </Card.Root>
                                ))}
                            </Stack>
                        )}
                    </Box>
                </Tabs.Root>
            </Box>

            {drawerCategory === undefined ? null : <CategoryFormDrawer category={drawerCategory} defaultKind={activeKind} onSaved={handleSaved} onDeleted={handleDeleted} onClose={() => setDrawerCategory(undefined)} />}
        </React.Fragment>
    );
};
