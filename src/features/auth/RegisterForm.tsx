import React from "react";
import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import {useIntl} from "react-intl";
import {useNavigate} from "react-router";
import {z} from "zod";
import {Alert, Button, Field, Input, Stack} from "@chakra-ui/react";
import {AuthRepository} from "@/data/authRepository";
import {PasswordField} from "@/features/auth/PasswordField";
import {formatMessage, messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";
import {useAuthStore} from "@/stores/authStore";

const registerSchema = z
    .object({
        username: z
            .string()
            .trim()
            .min(1, {message: formatMessage(messages.fields.usernameRequired)}),
        password: z.string().min(8, {message: formatMessage(messages.fields.passwordTooShort)}),
        confirmPassword: z.string().min(1, {message: formatMessage(messages.fields.passwordRequired)}),
    })
    .refine(values => values.password === values.confirmPassword, {
        path: ["confirmPassword"],
        message: formatMessage(messages.fields.passwordMismatch),
    });

type RegisterValues = z.infer<typeof registerSchema>;

type RegisterFormProps = {
    returnTo: string | null;
};

export const RegisterForm = ({returnTo}: RegisterFormProps) => {
    const intl = useIntl();
    const navigate = useNavigate();
    const [formError, setFormError] = React.useState<string | null>(null);
    const {register, handleSubmit, reset, formState} = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {username: "", password: "", confirmPassword: ""},
    });

    const onSubmit = handleSubmit(async values => {
        setFormError(null);
        const result = await new AuthRepository().register({username: values.username, password: values.password});
        if (!result.ok) {
            setFormError(result.error.message);
            reset();
            return;
        }
        useAuthStore.getState().setSession(result.value.token, result.value.user);
        navigate(returnTo ?? ROUTES.dashboard, {replace: true});
    });

    return (
        <Stack as="form" onSubmit={onSubmit} gap="4">
            <Field.Root invalid={formState.errors.username !== undefined}>
                <Field.Label>{intl.formatMessage(messages.auth.username)}</Field.Label>
                <Input autoComplete="username" autoFocus {...register("username")} />
                {formState.errors.username === undefined ? null : <Field.ErrorText>{formState.errors.username.message}</Field.ErrorText>}
            </Field.Root>
            <PasswordField label={intl.formatMessage(messages.auth.password)} autoComplete="new-password" error={formState.errors.password?.message} {...register("password")} />
            <PasswordField label={intl.formatMessage(messages.auth.confirmPassword)} autoComplete="new-password" error={formState.errors.confirmPassword?.message} {...register("confirmPassword")} />
            {formError === null ? null : (
                <Alert.Root status="error" role="alert" rounded="lg">
                    <Alert.Indicator />
                    <Alert.Title>{formError}</Alert.Title>
                </Alert.Root>
            )}
            <Button type="submit" width="full" loading={formState.isSubmitting}>
                {intl.formatMessage(messages.auth.registerSubmit)}
            </Button>
        </Stack>
    );
};
