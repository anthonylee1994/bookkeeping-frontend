import {RadioGroup as RadioGroupPrimitive} from "radix-ui";
import {cn} from "@/lib/utils";

export type SegmentedOption<T extends string> = {
    value: T;
    label: string;
    disabled?: boolean;
};

type SegmentedControlProps<T extends string> = {
    /** radiogroup 嘅 accessible name。 */
    label: string;
    value: T;
    options: ReadonlyArray<SegmentedOption<T>>;
    onValueChange: (value: T) => void;
    className?: string;
};

/** RadioGroup 語意嘅 segmented control；支援 keyboard 左右鍵。 */
export const SegmentedControl = <T extends string>({label, value, options, onValueChange, className}: SegmentedControlProps<T>) => {
    return (
        <RadioGroupPrimitive.Root
            aria-label={label}
            value={value}
            onValueChange={next => onValueChange(next as T)}
            className={cn("border-input bg-muted/40 inline-flex w-fit items-center gap-0 rounded-md border p-0.5", className)}
        >
            {options.map(option => {
                return (
                    <RadioGroupPrimitive.Item
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                        className={cn(
                            "text-muted-foreground flex flex-1 items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                            "focus-visible:ring-ring/50 outline-none focus-visible:ring-2",
                            "data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-sm",
                            "disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                    >
                        {option.label}
                    </RadioGroupPrimitive.Item>
                );
            })}
        </RadioGroupPrimitive.Root>
    );
};
