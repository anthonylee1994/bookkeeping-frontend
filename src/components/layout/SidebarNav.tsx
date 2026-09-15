import {Box, Circle, Flex, HStack, Icon, Stack, Text} from "@chakra-ui/react";
import {PlusIcon, WalletIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link, NavLink} from "react-router";
import {NAV_ITEMS} from "@/components/layout/navItems";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";

export const SIDEBAR_WIDTH = "15rem";
export const SIDEBAR_COLLAPSED_WIDTH = "4.5rem";

type SidebarNavProps = {
    collapsed: boolean;
};

/** Tablet／desktop 左側 navigation rail；collapsed 時只餘下 icon。 */
export const SidebarNav = ({collapsed}: SidebarNavProps) => {
    const intl = useIntl();
    const addLabel = intl.formatMessage(messages.layout.addTransaction);

    return (
        <Flex
            as="aside"
            direction="column"
            position="fixed"
            insetY="0"
            left="0"
            zIndex="40"
            display={{base: "none", md: "flex"}}
            width={collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH}
            bg="bg.panel"
            borderRightWidth="1px"
            borderColor="border"
            transition="width 200ms ease"
        >
            <HStack h="16" px="3" gap="2.5">
                <Link to={ROUTES.dashboard} aria-label={intl.formatMessage(messages.app.name)}>
                    <HStack gap="2.5" px="1.5" py="1">
                        <Circle size="9" bg="brand.solid" color="brand.contrast" flexShrink="0">
                            <Icon size="md">
                                <WalletIcon />
                            </Icon>
                        </Circle>
                        <Text fontWeight="semibold" letterSpacing="tight" truncate srOnly={collapsed}>
                            {intl.formatMessage(messages.app.name)}
                        </Text>
                    </HStack>
                </Link>
            </HStack>

            <Box px={collapsed ? "3.5" : "3"} pb="2">
                <Link to={ROUTES.transactionNew} aria-label={addLabel} title={addLabel}>
                    <HStack
                        h="11"
                        justify="center"
                        gap="2"
                        rounded="xl"
                        bg="brand.solid"
                        color="brand.contrast"
                        fontSize="sm"
                        fontWeight="medium"
                        shadow="sm"
                        transition="background 150ms ease"
                        _hover={{bg: "brand.emphasized"}}
                    >
                        <Icon size="md">
                            <PlusIcon />
                        </Icon>
                        <Text srOnly={collapsed}>{addLabel}</Text>
                    </HStack>
                </Link>
            </Box>

            <Stack as="nav" aria-label={intl.formatMessage(messages.layout.primaryNav)} flex="1" gap="1" overflowY="auto" p="3">
                {NAV_ITEMS.map(item => {
                    const ItemIcon = item.icon;
                    const label = intl.formatMessage(item.label);
                    return (
                        <NavLink key={item.to} to={item.to} end={item.to === ROUTES.dashboard} title={collapsed ? label : undefined}>
                            {({isActive}) => (
                                <HStack
                                    h="11"
                                    px={collapsed ? "0" : "2.5"}
                                    justify={collapsed ? "center" : "flex-start"}
                                    gap="3"
                                    rounded="lg"
                                    fontSize="sm"
                                    bg={isActive ? "brand.active" : "transparent"}
                                    color={isActive ? "brand.activeFg" : "fg.muted"}
                                    fontWeight={isActive ? "semibold" : "medium"}
                                    transition="background 150ms ease, color 150ms ease"
                                    /* Hover 用半透明 brand.active，如此 selected（實色 + semibold）仍能分辨。 */
                                    _hover={isActive ? undefined : {bg: "brand.active/60", color: "brand.activeFg"}}
                                >
                                    <Icon size="md" flexShrink="0">
                                        <ItemIcon />
                                    </Icon>
                                    <Text truncate srOnly={collapsed}>
                                        {label}
                                    </Text>
                                </HStack>
                            )}
                        </NavLink>
                    );
                })}
            </Stack>
        </Flex>
    );
};
