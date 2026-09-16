import React from "react";
import {EraserIcon, HomeIcon, RotateCcwIcon, TriangleAlertIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {Button, Center, HStack, Heading, Portal, Stack, Text} from "@chakra-ui/react";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";

type FatalErrorFallbackProps = {
    onRetry: () => void;
};

/** Route-level fatal error UI：重試、返回儀表板，或清除本機資料後再試。 */
export const FatalErrorFallback = ({onRetry}: FatalErrorFallbackProps) => {
    const intl = useIntl();

    const resetLocalData = () => {
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch {
            // ignore storage failures; reload still recovers the route.
        }
        window.location.assign(ROUTES.dashboard);
    };

    return (
        <Portal>
            <Center position="fixed" inset="0" zIndex="modal" overflowY="auto" px="5" py="10" bgGradient="to-b" gradientFrom="brand.subtle" gradientTo="bg">
                <Stack role="alert" maxW="md" align="center" gap="8" textAlign="center" animation="page-enter 220ms cubic-bezier(0.32, 0.72, 0, 1) both">
                    <Center boxSize={{base: "24", md: "28"}} rounded="3xl" colorPalette="red" bg="colorPalette.subtle" color="colorPalette.fg" aria-hidden="true">
                        <TriangleAlertIcon size={52} />
                    </Center>

                    <Stack gap="3">
                        <Heading as="h1" size={{base: "3xl", md: "4xl"}} letterSpacing="tighter">
                            {intl.formatMessage(messages.fatal.title)}
                        </Heading>
                        <Text fontSize={{base: "md", md: "lg"}} color="fg.muted">
                            {intl.formatMessage(messages.fatal.description)}
                        </Text>
                    </Stack>

                    <HStack gap="3" flexWrap="wrap" justify="center" w="full">
                        <Button size="xl" px="8" minW="8.5rem" shadow="sm" onClick={onRetry}>
                            <RotateCcwIcon />
                            {intl.formatMessage(messages.fatal.retry)}
                        </Button>
                        <Button asChild variant="outline" size="xl" px="8" minW="8.5rem">
                            <Link to={ROUTES.dashboard}>
                                <HomeIcon />
                                {intl.formatMessage(messages.fatal.home)}
                            </Link>
                        </Button>
                    </HStack>

                    <Button variant="ghost" size="sm" color="fg.muted" onClick={resetLocalData}>
                        <EraserIcon />
                        {intl.formatMessage(messages.fatal.reset)}
                    </Button>
                </Stack>
            </Center>
        </Portal>
    );
};

type RouteErrorBoundaryProps = {
    children: React.ReactNode;
};

type RouteErrorBoundaryState = {
    error: Error | null;
};

class ErrorBoundary extends React.Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
    state: RouteErrorBoundaryState = {error: null};

    static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
        return {error};
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        console.error("Route render error", error, info);
    }

    #reset = (): void => {
        this.setState({error: null});
    };

    render(): React.ReactNode {
        if (this.state.error !== null) {
            return <FatalErrorFallback onRetry={this.#reset} />;
        }
        return this.props.children;
    }
}

/** Route 級 error boundary；fatal 提供復原入口。 */
export const RouteErrorBoundary = ErrorBoundary;
