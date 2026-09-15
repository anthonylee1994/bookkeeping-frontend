import React from "react";
import {Link as ChakraLink} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {Link, useSearchParams} from "react-router";
import {AuthCard} from "@/features/auth/AuthCard";
import {RegisterForm} from "@/features/auth/RegisterForm";
import {messages} from "@/lib/i18n";
import {parseReturnTo} from "@/lib/searchParams";
import {ROUTES} from "@/routes/paths";

export const RegisterPage = () => {
    const intl = useIntl();
    const [searchParams] = useSearchParams();
    const returnTo = parseReturnTo(searchParams.get("returnTo"));
    const loginHref = returnTo === null ? ROUTES.login : `${ROUTES.login}?returnTo=${encodeURIComponent(returnTo)}`;

    return (
        <AuthCard
            title={intl.formatMessage(messages.auth.registerTitle)}
            footer={
                <React.Fragment>
                    {intl.formatMessage(messages.auth.haveAccount)}{" "}
                    <ChakraLink asChild color="brand.fg" fontWeight="medium">
                        <Link to={loginHref}>{intl.formatMessage(messages.auth.loginCta)}</Link>
                    </ChakraLink>
                </React.Fragment>
            }
        >
            <RegisterForm returnTo={returnTo} />
        </AuthCard>
    );
};
