import React from "react";
import {TriangleAlertIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {Button, Heading, Icon, Stack, Text, Wrap} from "@chakra-ui/react";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";

type FatalErrorFallbackProps = {
    onRetry: () => void;
};

/** Route-level fatal error UI：重試、返首頁、或者清本機資料再嚟。 */
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
        <Stack role="alert" mx="auto" maxW="md" align="center" gap="3" py="16" textAlign="center">
            <Icon size="xl" color="fg.error" aria-hidden>
                <TriangleAlertIcon />
            </Icon>
            <Heading as="h1" size="lg">
                {intl.formatMessage(messages.fatal.title)}
            </Heading>
            <Text fontSize="sm" color="fg.muted">
                {intl.formatMessage(messages.fatal.description)}
            </Text>
            <Wrap mt="2" gap="2" justify="center" align="center">
                <Button onClick={onRetry}>{intl.formatMessage(messages.fatal.retry)}</Button>
                <Button asChild variant="outline">
                    <Link to={ROUTES.dashboard}>{intl.formatMessage(messages.fatal.home)}</Link>
                </Button>
                <Button variant="ghost" onClick={resetLocalData}>
                    {intl.formatMessage(messages.fatal.reset)}
                </Button>
            </Wrap>
        </Stack>
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
