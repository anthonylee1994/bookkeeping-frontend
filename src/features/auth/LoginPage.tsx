import React from "react";
import {useIntl} from "react-intl";
import {Link, useSearchParams} from "react-router";
import {AuthCard} from "@/features/auth/AuthCard";
import {LoginForm} from "@/features/auth/LoginForm";
import {messages} from "@/lib/i18n";
import {parseReturnTo} from "@/lib/searchParams";
import {ROUTES} from "@/routes/paths";

export const LoginPage = () => {
    const intl = useIntl();
    const [searchParams] = useSearchParams();
    const returnTo = parseReturnTo(searchParams.get("returnTo"));
    const registerHref = returnTo === null ? ROUTES.register : `${ROUTES.register}?returnTo=${encodeURIComponent(returnTo)}`;

    return (
        <AuthCard
            title={intl.formatMessage(messages.auth.loginTitle)}
            description={intl.formatMessage(messages.app.description)}
            footer={
                <React.Fragment>
                    {intl.formatMessage(messages.auth.noAccount)}{" "}
                    <Link to={registerHref} className="text-primary underline-offset-4 hover:underline">
                        {intl.formatMessage(messages.auth.registerCta)}
                    </Link>
                </React.Fragment>
            }
        >
            <LoginForm returnTo={returnTo} />
        </AuthCard>
    );
};
