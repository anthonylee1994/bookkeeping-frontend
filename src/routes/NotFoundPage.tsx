import {CompassIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {Button} from "@/components/ui/Button";
import {EmptyState} from "@/components/ui/EmptyState";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";

export const NotFoundPage = () => {
    const intl = useIntl();
    return (
        <div className="flex min-h-dvh items-center justify-center">
            <EmptyState
                icon={<CompassIcon />}
                title={intl.formatMessage(messages.notFound.title)}
                description={intl.formatMessage(messages.notFound.description)}
                action={
                    <Button asChild>
                        <Link to={ROUTES.dashboard}>{intl.formatMessage(messages.notFound.action)}</Link>
                    </Button>
                }
            />
        </div>
    );
};
