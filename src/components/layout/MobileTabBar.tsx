import {Box, Center, Circle, Grid, Icon, Text, VStack} from "@chakra-ui/react";
import {PlusIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {NavLink} from "react-router";
import {TAB_NAV_ITEMS} from "@/components/layout/navItems";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";

/**
 * Mobile 底部 floating tab bar：4 個 tab，中間凸起的 FAB 用於新增交易。
 * 用 safe-area inset 避開 home indicator，desktop 完全不渲染（改用 sidebar）。
 */
export const MobileTabBar = () => {
    const intl = useIntl();
    const addLabel = intl.formatMessage(messages.layout.addTransaction);
    const leading = TAB_NAV_ITEMS.slice(0, 2);
    const trailing = TAB_NAV_ITEMS.slice(2);

    const renderItem = (item: (typeof TAB_NAV_ITEMS)[number]) => {
        const ItemIcon = item.icon;
        return (
            <NavLink key={item.to} to={item.to} end={item.to === ROUTES.dashboard}>
                {({isActive}) => (
                    <VStack gap="1" minH="13" justify="center" px="1" color={isActive ? "brand.activeFg" : "fg.muted"} transition="color 150ms ease">
                        <Circle size="8" bg={isActive ? "brand.active" : "transparent"} transition="background 150ms ease">
                            <Icon size="md">
                                <ItemIcon />
                            </Icon>
                        </Circle>
                        <Text fontSize="2xs" fontWeight={isActive ? "semibold" : "medium"} truncate maxW="full">
                            {intl.formatMessage(item.label)}
                        </Text>
                    </VStack>
                )}
            </NavLink>
        );
    };

    return (
        <Box
            as="nav"
            aria-label={intl.formatMessage(messages.layout.primaryNav)}
            position="fixed"
            insetX="0"
            bottom="0"
            zIndex="40"
            px="3"
            pt="2"
            pb="max(0.5rem, env(safe-area-inset-bottom))"
            display={{base: "block", md: "none"}}
        >
            <Grid templateColumns="1fr 1fr 4.5rem 1fr 1fr" alignItems="center" maxW="md" mx="auto" p="1" rounded="3xl" bg="bg.panel" borderWidth="1px" borderColor="border" shadow="lg">
                {leading.map(renderItem)}
                <Center>
                    <Center
                        asChild
                        boxSize="14"
                        mt="-7"
                        rounded="full"
                        bg="brand.solid"
                        color="brand.contrast"
                        shadow="md"
                        outlineWidth="4px"
                        outlineStyle="solid"
                        outlineColor="bg"
                        transition="background 150ms ease"
                        _active={{bg: "brand.emphasized"}}
                    >
                        <NavLink to={ROUTES.transactionNew} aria-label={addLabel} title={addLabel}>
                            <Icon size="lg">
                                <PlusIcon />
                            </Icon>
                        </NavLink>
                    </Center>
                </Center>
                {trailing.map(renderItem)}
            </Grid>
        </Box>
    );
};
