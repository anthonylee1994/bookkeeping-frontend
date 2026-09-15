import React from "react";
import {zodResolver} from "@hookform/resolvers/zod";
import {Loader2Icon} from "lucide-react";
import {useForm} from "react-hook-form";
import {useIntl} from "react-intl";
import {useNavigate} from "react-router";
import {z} from "zod";
import {Banner} from "@/components/ui/Banner";
import {Button} from "@/components/ui/Button";
import {TextField} from "@/components/ui/TextField";
import {AuthRepository} from "@/data/authRepository";
import {PasswordField} from "@/features/auth/PasswordField";
import {useToast} from "@/hooks/useToast";
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
    const {pushToast} = useToast();
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
        pushToast({kind: "success", message: intl.formatMessage(messages.auth.registerSuccess)});
        navigate(returnTo ?? ROUTES.dashboard, {replace: true});
    });

    return (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <TextField label={intl.formatMessage(messages.auth.username)} autoComplete="username" autoFocus error={formState.errors.username?.message} {...register("username")} />
            <PasswordField label={intl.formatMessage(messages.auth.password)} autoComplete="new-password" error={formState.errors.password?.message} {...register("password")} />
            <PasswordField label={intl.formatMessage(messages.auth.confirmPassword)} autoComplete="new-password" error={formState.errors.confirmPassword?.message} {...register("confirmPassword")} />
            {formError === null ? null : <Banner variant="error">{formError}</Banner>}
            <Button type="submit" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? <Loader2Icon aria-hidden className="animate-spin" /> : null}
                {intl.formatMessage(messages.auth.registerSubmit)}
            </Button>
        </form>
    );
};
