import React from "react";
import {Button} from "@/components/ui/Button";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/Tooltip";

type IconButtonProps = Omit<React.ComponentProps<typeof Button>, "size" | "children" | "aria-label"> & {
    /** Accessible name；同時做 tooltip 內容。 */
    label: string;
    children: React.ReactNode;
    showTooltip?: boolean;
    size?: React.ComponentProps<typeof Button>["size"];
};

/** Icon-only button：強制有 accessible name，預設加 tooltip。 */
export const IconButton = ({label, children, showTooltip = true, size = "icon", ...props}: IconButtonProps) => {
    if (!showTooltip) {
        return (
            <Button aria-label={label} size={size} {...props}>
                {children}
            </Button>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button aria-label={label} size={size} {...props}>
                        {children}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
