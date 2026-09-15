import React from "react";
import {TriangleAlertIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {Button} from "@/components/ui/Button";
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
        <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
            <TriangleAlertIcon aria-hidden className="text-expense size-8" />
            <h1 className="text-foreground text-lg font-medium">{intl.formatMessage(messages.fatal.title)}</h1>
            <p className="text-muted-foreground text-sm">{intl.formatMessage(messages.fatal.description)}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <Button onClick={onRetry}>{intl.formatMessage(messages.fatal.retry)}</Button>
                <Button variant="outline" asChild>
                    <Link to={ROUTES.dashboard}>{intl.formatMessage(messages.fatal.home)}</Link>
                </Button>
                <Button variant="ghost" onClick={resetLocalData}>
                    {intl.formatMessage(messages.fatal.reset)}
                </Button>
            </div>
        </div>
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
