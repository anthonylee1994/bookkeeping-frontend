import React from "react";
import {Card} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {PageHeader} from "@/components/layout/PageHeader";
import {ChangePasswordForm} from "@/features/settings/ChangePasswordForm";
import {messages} from "@/lib/i18n";

export const ChangePasswordPage = () => {
    const intl = useIntl();

    return (
        <React.Fragment>
            <PageHeader title={intl.formatMessage(messages.settings.changePassword)} description={intl.formatMessage(messages.settings.changePasswordDescription)} />

            <Card.Root maxW="lg">
                <Card.Body>
                    <ChangePasswordForm />
                </Card.Body>
            </Card.Root>
        </React.Fragment>
    );
};
