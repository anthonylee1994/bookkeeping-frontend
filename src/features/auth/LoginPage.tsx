import React from "react";
import {Link as ChakraLink} from "@chakra-ui/react";
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
            footer={
                <React.Fragment>
                    {intl.formatMessage(messages.auth.noAccount)}{" "}
                    <ChakraLink asChild color="brand.fg" fontWeight="medium">
                        <Link to={registerHref}>{intl.formatMessage(messages.auth.registerCta)}</Link>
                    </ChakraLink>
                </React.Fragment>
            }
        >
            <LoginForm returnTo={returnTo} />
        </AuthCard>
    );
};
