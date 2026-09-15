import React from "react";
import {EyeIcon, EyeOffIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {IconButton} from "@/components/ui/IconButton";
import {TextField} from "@/components/ui/TextField";
import {messages} from "@/lib/i18n";

type PasswordFieldProps = Omit<React.ComponentProps<typeof TextField>, "type" | "trailing">;

/** 密碼欄位：有顯示／隱藏切換。 */
export const PasswordField = (props: PasswordFieldProps) => {
    const intl = useIntl();
    const [visible, setVisible] = React.useState(false);
    const toggleLabel = intl.formatMessage(visible ? messages.auth.hidePassword : messages.auth.showPassword);

    return (
        <TextField
            {...props}
            type={visible ? "text" : "password"}
            trailing={
                <IconButton className="relative -right-1" type="button" size="icon-sm" showTooltip={false} label={toggleLabel} onClick={() => setVisible(value => !value)}>
                    {visible ? <EyeOffIcon /> : <EyeIcon />}
                </IconButton>
            }
        />
    );
};
