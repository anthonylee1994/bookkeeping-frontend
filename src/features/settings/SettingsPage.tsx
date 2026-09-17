import React from "react";
import {Box, Card, HStack, Icon, Stack, Text} from "@chakra-ui/react";
import {ChevronRightIcon, FolderIcon, KeyRoundIcon, LogOutIcon, TagIcon, WalletIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {PageHeader} from "@/components/layout/PageHeader";
import {useLogout} from "@/hooks/useLogout";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";

export const SettingsPage = () => {
    const intl = useIntl();
    const logout = useLogout();

    return (
        <React.Fragment>
            <PageHeader title={intl.formatMessage(messages.settings.title)} />

            <Stack gap="6">
                <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="fg.muted" mb="3">
                        {intl.formatMessage(messages.settings.dataManagement)}
                    </Text>
                    <Stack gap="2">
                        <Card.Root asChild>
                            <Link to={ROUTES.settingsAccounts}>
                                <Card.Body cursor="pointer" _hover={{bg: "brand.active"}}>
                                    <HStack justify="space-between">
                                        <HStack gap="3">
                                            <Icon fontSize="xl" color="brand.fg">
                                                <WalletIcon />
                                            </Icon>
                                            <Box>
                                                <Text fontWeight="semibold">{intl.formatMessage(messages.nav.accounts)}</Text>
                                                <Text fontSize="sm" color="fg.muted">
                                                    {intl.formatMessage(messages.settings.accountsDescription)}
                                                </Text>
                                            </Box>
                                        </HStack>
                                        <Icon>
                                            <ChevronRightIcon />
                                        </Icon>
                                    </HStack>
                                </Card.Body>
                            </Link>
                        </Card.Root>

                        <Card.Root asChild>
                            <Link to={ROUTES.settingsCategories}>
                                <Card.Body cursor="pointer" _hover={{bg: "brand.active"}}>
                                    <HStack justify="space-between">
                                        <HStack gap="3">
                                            <Icon fontSize="xl" color="brand.fg">
                                                <TagIcon />
                                            </Icon>
                                            <Box>
                                                <Text fontWeight="semibold">{intl.formatMessage(messages.nav.categories)}</Text>
                                                <Text fontSize="sm" color="fg.muted">
                                                    {intl.formatMessage(messages.settings.categoriesDescription)}
                                                </Text>
                                            </Box>
                                        </HStack>
                                        <Icon>
                                            <ChevronRightIcon />
                                        </Icon>
                                    </HStack>
                                </Card.Body>
                            </Link>
                        </Card.Root>

                        <Card.Root asChild>
                            <Link to={ROUTES.settingsMerchants}>
                                <Card.Body cursor="pointer" _hover={{bg: "brand.active"}}>
                                    <HStack justify="space-between">
                                        <HStack gap="3">
                                            <Icon fontSize="xl" color="brand.fg">
                                                <FolderIcon />
                                            </Icon>
                                            <Box>
                                                <Text fontWeight="semibold">{intl.formatMessage(messages.nav.merchants)}</Text>
                                                <Text fontSize="sm" color="fg.muted">
                                                    {intl.formatMessage(messages.settings.merchantsDescription)}
                                                </Text>
                                            </Box>
                                        </HStack>
                                        <Icon>
                                            <ChevronRightIcon />
                                        </Icon>
                                    </HStack>
                                </Card.Body>
                            </Link>
                        </Card.Root>
                    </Stack>
                </Box>

                <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="fg.muted" mb="3">
                        {intl.formatMessage(messages.settings.system)}
                    </Text>
                    <Stack gap="2">
                        <Card.Root asChild>
                            <Link to={ROUTES.settingsPassword}>
                                <Card.Body cursor="pointer" _hover={{bg: "brand.active"}}>
                                    <HStack justify="space-between">
                                        <HStack gap="3">
                                            <Icon fontSize="xl" color="brand.fg">
                                                <KeyRoundIcon />
                                            </Icon>
                                            <Box>
                                                <Text fontWeight="semibold">{intl.formatMessage(messages.settings.changePassword)}</Text>
                                                <Text fontSize="sm" color="fg.muted">
                                                    {intl.formatMessage(messages.settings.changePasswordDescription)}
                                                </Text>
                                            </Box>
                                        </HStack>
                                        <Icon>
                                            <ChevronRightIcon />
                                        </Icon>
                                    </HStack>
                                </Card.Body>
                            </Link>
                        </Card.Root>

                        <Card.Root>
                            <Card.Body cursor="pointer" onClick={logout} _hover={{bg: "brand.active"}}>
                                <HStack justify="space-between">
                                    <HStack gap="3">
                                        <Icon fontSize="xl" color="red.500">
                                            <LogOutIcon />
                                        </Icon>
                                        <Text fontWeight="semibold">{intl.formatMessage(messages.auth.signOut)}</Text>
                                    </HStack>
                                </HStack>
                            </Card.Body>
                        </Card.Root>
                    </Stack>
                </Box>
            </Stack>
        </React.Fragment>
    );
};
