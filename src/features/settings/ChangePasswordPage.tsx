import {Box, Card, Heading, Stack, Text} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {ChangePasswordForm} from "@/features/settings/ChangePasswordForm";
import {messages} from "@/lib/i18n";

export const ChangePasswordPage = () => {
    const intl = useIntl();

    return (
        <Box maxW="7xl" mx="auto">
            <Stack gap="1" mb="6" maxW="lg" mx="auto">
                <Heading size="xl">{intl.formatMessage(messages.settings.changePassword)}</Heading>
                <Text fontSize="sm" color="fg.muted">
                    {intl.formatMessage(messages.settings.changePasswordDescription)}
                </Text>
            </Stack>

            <Card.Root maxW="lg" mx="auto">
                <Card.Body>
                    <ChangePasswordForm />
                </Card.Body>
            </Card.Root>
        </Box>
    );
};
