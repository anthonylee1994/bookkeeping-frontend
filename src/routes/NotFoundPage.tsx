import {Button, Center, EmptyState, Icon, Text, VStack} from "@chakra-ui/react";
import {CompassIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";

export const NotFoundPage = () => {
    const intl = useIntl();
    return (
        <Center minH="100dvh" px="5">
            <EmptyState.Root>
                <EmptyState.Content>
                    <EmptyState.Indicator>
                        <Icon size="xl" color="fg.muted">
                            <CompassIcon />
                        </Icon>
                    </EmptyState.Indicator>
                    <VStack gap="1" textAlign="center">
                        <EmptyState.Title>{intl.formatMessage(messages.notFound.title)}</EmptyState.Title>
                        <Text fontSize="sm" color="fg.muted" maxW="sm">
                            {intl.formatMessage(messages.notFound.description)}
                        </Text>
                    </VStack>
                    <Button asChild mt="2">
                        <Link to={ROUTES.dashboard}>{intl.formatMessage(messages.notFound.action)}</Link>
                    </Button>
                </EmptyState.Content>
            </EmptyState.Root>
        </Center>
    );
};
