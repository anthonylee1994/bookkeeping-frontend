import React from "react";
import {cn} from "cn";
import {useIntl} from "react-intl";
import {Dialog as SheetPrimitive} from "radix-ui";

import {Button} from "@/components/ui/Button";
import {messages} from "@/lib/i18n";
import {XIcon} from "lucide-react";

export const Sheet = ({...props}: React.ComponentProps<typeof SheetPrimitive.Root>) => {
    return <SheetPrimitive.Root data-slot="sheet" {...props} />;
};

export const SheetTrigger = ({...props}: React.ComponentProps<typeof SheetPrimitive.Trigger>) => {
    return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
};

export const SheetClose = ({...props}: React.ComponentProps<typeof SheetPrimitive.Close>) => {
    return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
};

export const SheetPortal = ({...props}: React.ComponentProps<typeof SheetPrimitive.Portal>) => {
    return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
};

export const SheetOverlay = ({className, ...props}: React.ComponentProps<typeof SheetPrimitive.Overlay>) => {
    return (
        <SheetPrimitive.Overlay
            data-slot="sheet-overlay"
            className={cn(
                "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs",
                className
            )}
            {...props}
        />
    );
};

export const SheetContent = ({
    className,
    children,
    side = "right",
    showCloseButton = true,
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
    side?: "top" | "right" | "bottom" | "left";
    showCloseButton?: boolean;
}) => {
    const intl = useIntl();
    return (
        <SheetPortal>
            <SheetOverlay />
            <SheetPrimitive.Content
                data-slot="sheet-content"
                data-side={side}
                className={cn(
                    "bg-popover text-popover-foreground data-open:animate-in data-open:fade-in-0 data-[side=bottom]:data-open:slide-in-from-bottom-10 data-[side=left]:data-open:slide-in-from-left-10 data-[side=right]:data-open:slide-in-from-right-10 data-[side=top]:data-open:slide-in-from-top-10 data-closed:animate-out data-closed:fade-out-0 data-[side=bottom]:data-closed:slide-out-to-bottom-10 data-[side=left]:data-closed:slide-out-to-left-10 data-[side=right]:data-closed:slide-out-to-right-10 data-[side=top]:data-closed:slide-out-to-top-10 fixed z-50 flex flex-col gap-4 bg-clip-padding text-sm shadow-lg transition duration-200 ease-in-out data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
                    className
                )}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <SheetPrimitive.Close data-slot="sheet-close" asChild>
                        <Button variant="ghost" className="absolute top-3 right-3" size="icon-sm">
                            <XIcon />
                            <span className="sr-only">{intl.formatMessage(messages.common.close)}</span>
                        </Button>
                    </SheetPrimitive.Close>
                )}
            </SheetPrimitive.Content>
        </SheetPortal>
    );
};

export const SheetHeader = ({className, ...props}: React.ComponentProps<"div">) => {
    return <div data-slot="sheet-header" className={cn("flex flex-col gap-0.5 p-4", className)} {...props} />;
};

export const SheetFooter = ({className, ...props}: React.ComponentProps<"div">) => {
    return <div data-slot="sheet-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />;
};

export const SheetTitle = ({className, ...props}: React.ComponentProps<typeof SheetPrimitive.Title>) => {
    return <SheetPrimitive.Title data-slot="sheet-title" className={cn("font-heading text-foreground text-base font-medium", className)} {...props} />;
};

export const SheetDescription = ({className, ...props}: React.ComponentProps<typeof SheetPrimitive.Description>) => {
    return <SheetPrimitive.Description data-slot="sheet-description" className={cn("text-muted-foreground text-sm", className)} {...props} />;
};
