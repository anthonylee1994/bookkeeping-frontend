import React from "react";
import {Input} from "@/components/ui/Input";
import {Label} from "@/components/ui/Label";
import {cn} from "@/lib/utils";

type TextFieldProps = Omit<React.ComponentProps<"input">, "id"> & {
    label: string;
    id?: string;
    hint?: string;
    error?: string;
    containerClassName?: string;
};

/** Input + persistent label；error 透過 `aria-describedby` 連到欄位。 */
export const TextField = ({label, id, hint, error, className, containerClassName, ...props}: TextFieldProps) => {
    const generatedId = React.useId();
    const fieldId = id ?? generatedId;
    const hintId = hint === undefined ? undefined : `${fieldId}-hint`;
    const errorId = error === undefined ? undefined : `${fieldId}-error`;
    const describedBy = [errorId, hintId].filter((value): value is string => value !== undefined).join(" ") || undefined;

    return (
        <div className={cn("flex flex-col gap-1.5", containerClassName)}>
            <Label htmlFor={fieldId}>{label}</Label>
            <Input id={fieldId} aria-invalid={error === undefined ? undefined : true} aria-describedby={describedBy} className={className} {...props} />
            {hint !== undefined && error === undefined ? (
                <p id={hintId} className="text-muted-foreground text-sm">
                    {hint}
                </p>
            ) : null}
            {error !== undefined ? (
                <p id={errorId} role="alert" className="text-destructive text-sm font-medium">
                    {error}
                </p>
            ) : null}
        </div>
    );
};
