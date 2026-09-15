import React from "react";
import {Field, IconButton, Input, InputGroup} from "@chakra-ui/react";
import {EyeIcon, EyeOffIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {messages} from "@/lib/i18n";

/** `size` 要 omit：native input 的 `size` 是 number，與 Chakra Input 的 size token 完全相撞。 */
type PasswordFieldProps = Omit<React.ComponentProps<"input">, "type" | "size"> & {
    label: string;
    error?: string;
};

/** 密碼欄位：有顯示／隱藏切換。 */
export const PasswordField = ({label, error, ...props}: PasswordFieldProps) => {
    const intl = useIntl();
    const [visible, setVisible] = React.useState(false);
    const toggleLabel = intl.formatMessage(visible ? messages.auth.hidePassword : messages.auth.showPassword);

    return (
        <Field.Root invalid={error !== undefined}>
            <Field.Label>{label}</Field.Label>
            <InputGroup
                endElement={
                    <IconButton left={1} aria-label={toggleLabel} type="button" size="xs" variant="ghost" me="-1" onClick={() => setVisible(value => !value)}>
                        {visible ? <EyeOffIcon /> : <EyeIcon />}
                    </IconButton>
                }
            >
                <Input type={visible ? "text" : "password"} {...props} />
            </InputGroup>
            {error === undefined ? null : <Field.ErrorText>{error}</Field.ErrorText>}
        </Field.Root>
    );
};
