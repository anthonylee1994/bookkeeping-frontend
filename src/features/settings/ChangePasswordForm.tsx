import React from "react";
import {zodResolver} from "@hookform/resolvers/zod";
import {Alert, Button, Stack} from "@chakra-ui/react";
import {useForm} from "react-hook-form";
import {useIntl} from "react-intl";
import {z} from "zod";
import {AuthRepository} from "@/data/authRepository";
import {PasswordField} from "@/features/auth/PasswordField";
import {formatMessage, messages} from "@/lib/i18n";

const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, {message: formatMessage(messages.fields.currentPasswordRequired)}),
        newPassword: z.string().min(8, {message: formatMessage(messages.fields.passwordTooShort)}),
        confirmPassword: z.string().min(1, {message: formatMessage(messages.fields.passwordRequired)}),
    })
    .refine(values => values.newPassword === values.confirmPassword, {
        path: ["confirmPassword"],
        message: formatMessage(messages.fields.passwordMismatch),
    });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const ChangePasswordForm = () => {
    const intl = useIntl();
    const [formError, setFormError] = React.useState<string | null>(null);
    const [succeeded, setSucceeded] = React.useState(false);
    const {register, handleSubmit, reset, formState} = useForm<ChangePasswordValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {currentPassword: "", newPassword: "", confirmPassword: ""},
    });

    const onSubmit = handleSubmit(async values => {
        setFormError(null);
        setSucceeded(false);
        const result = await new AuthRepository().changePassword({
            password_challenge: values.currentPassword,
            password: values.newPassword,
            password_confirmation: values.confirmPassword,
        });
        if (!result.ok) {
            setFormError(result.error.message);
            reset();
            return;
        }
        reset();
        setSucceeded(true);
    });

    return (
        <Stack as="form" onSubmit={onSubmit} gap="4">
            <PasswordField
                label={intl.formatMessage(messages.auth.currentPassword)}
                autoComplete="current-password"
                autoFocus
                error={formState.errors.currentPassword?.message}
                {...register("currentPassword")}
            />
            <PasswordField label={intl.formatMessage(messages.auth.newPassword)} autoComplete="new-password" error={formState.errors.newPassword?.message} {...register("newPassword")} />
            <PasswordField label={intl.formatMessage(messages.auth.confirmPassword)} autoComplete="new-password" error={formState.errors.confirmPassword?.message} {...register("confirmPassword")} />
            {formError === null ? null : (
                <Alert.Root status="error" role="alert" rounded="lg">
                    <Alert.Indicator />
                    <Alert.Title>{formError}</Alert.Title>
                </Alert.Root>
            )}
            {succeeded ? (
                <Alert.Root status="success" role="status" rounded="lg">
                    <Alert.Indicator />
                    <Alert.Title>{intl.formatMessage(messages.auth.changePasswordSuccess)}</Alert.Title>
                </Alert.Root>
            ) : null}
            <Button type="submit" width="full" loading={formState.isSubmitting}>
                {intl.formatMessage(messages.auth.changePasswordSubmit)}
            </Button>
        </Stack>
    );
};
