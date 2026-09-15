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

const loginSchema = z.object({
    username: z
        .string()
        .trim()
        .min(1, {message: formatMessage(messages.fields.usernameRequired)}),
    password: z.string().min(1, {message: formatMessage(messages.fields.passwordRequired)}),
});

type LoginValues = z.infer<typeof loginSchema>;

type LoginFormProps = {
    returnTo: string | null;
};

export const LoginForm = ({returnTo}: LoginFormProps) => {
    const intl = useIntl();
    const navigate = useNavigate();
    const {pushToast} = useToast();
    const [formError, setFormError] = React.useState<string | null>(null);
    const {register, handleSubmit, reset, formState} = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {username: "", password: ""},
    });

    const onSubmit = handleSubmit(async values => {
        setFormError(null);
        const result = await new AuthRepository().login(values);
        if (!result.ok) {
            setFormError(result.error.message);
            reset();
            return;
        }
        useAuthStore.getState().setSession(result.value.token, result.value.user);
        pushToast({kind: "success", message: intl.formatMessage(messages.auth.loginSuccess)});
        navigate(returnTo ?? ROUTES.dashboard, {replace: true});
    });

    return (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <TextField label={intl.formatMessage(messages.auth.username)} autoComplete="username" autoFocus error={formState.errors.username?.message} {...register("username")} />
            <PasswordField label={intl.formatMessage(messages.auth.password)} autoComplete="current-password" error={formState.errors.password?.message} {...register("password")} />
            {formError === null ? null : <Banner variant="error">{formError}</Banner>}
            <Button type="submit" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? <Loader2Icon aria-hidden className="animate-spin" /> : null}
                {intl.formatMessage(messages.auth.loginSubmit)}
            </Button>
        </form>
    );
};
