import {Box, Center, Circle, Icon, Stack, Text} from "@chakra-ui/react";
import {WalletIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Outlet} from "react-router";
import {messages} from "@/lib/i18n";

/** 登入／註冊：mobile 滿版 app 啟動畫面，desktop 置中窄欄。 */
export const PublicLayout = () => {
    const intl = useIntl();

    return (
        <Center as="main" minH="100dvh" px="5" py="10" bgGradient="to-b" gradientFrom="brand.subtle" gradientTo="bg">
            <Box w="full" maxW="sm" animation="page-enter 220ms cubic-bezier(0.32, 0.72, 0, 1) both">
                <Stack align="center" gap="3" mb="8">
                    <Circle size="14" bg="brand.solid" color="brand.contrast" shadow="md">
                        <Icon size="xl">
                            <WalletIcon />
                        </Icon>
                    </Circle>
                    <Text fontSize="xl" fontWeight="semibold" letterSpacing="tight">
                        {intl.formatMessage(messages.app.name)}
                    </Text>
                </Stack>
                <Outlet />
            </Box>
        </Center>
    );
};
