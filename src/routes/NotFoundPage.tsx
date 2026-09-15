import {Button, Center, HStack, Heading, Stack, Text} from "@chakra-ui/react";
import {ArrowLeftIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link, useNavigate} from "react-router";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";

export const NotFoundPage = () => {
    const intl = useIntl();
    const navigate = useNavigate();

    const goBack = () => {
        if (window.history.length > 1) {
            void navigate(-1);
            return;
        }
        void navigate(ROUTES.dashboard);
    };

    return (
        <Center as="main" minH="100dvh" px="5" py="10" bgGradient="to-b" gradientFrom="brand.subtle" gradientTo="bg">
            <Stack maxW="md" align="center" gap="8" textAlign="center" animation="page-enter 220ms cubic-bezier(0.32, 0.72, 0, 1) both">
                <Text aria-hidden fontSize={{base: "8.5rem", md: "11rem"}} lineHeight="1" fontWeight="bold" letterSpacing="tighter" color="brand.muted" userSelect="none">
                    404
                </Text>

                <Stack gap="3">
                    <Heading as="h1" size={{base: "3xl", md: "4xl"}} letterSpacing="tighter">
                        {intl.formatMessage(messages.notFound.title)}
                    </Heading>
                    <Text fontSize={{base: "md", md: "lg"}} color="fg.muted">
                        {intl.formatMessage(messages.notFound.description)}
                    </Text>
                </Stack>

                <HStack gap="3" flexWrap="wrap" justify="center" w="full">
                    <Button asChild size="xl" rounded="xl" px="8" minW="8.5rem" shadow="sm">
                        <Link to={ROUTES.dashboard}>{intl.formatMessage(messages.notFound.action)}</Link>
                    </Button>
                    <Button variant="outline" size="xl" rounded="xl" px="8" minW="8.5rem" bg="bg.panel" onClick={goBack}>
                        <ArrowLeftIcon />
                        {intl.formatMessage(messages.layout.back)}
                    </Button>
                </HStack>
            </Stack>
        </Center>
    );
};
