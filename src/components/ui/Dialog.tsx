import React from "react";
import {cn} from "cn";
import {useIntl} from "react-intl";
import {Dialog as DialogPrimitive} from "radix-ui";

import {Button} from "@/components/ui/Button";
import {messages} from "@/lib/i18n";
import {XIcon} from "lucide-react";

export const Dialog = ({...props}: React.ComponentProps<typeof DialogPrimitive.Root>) => {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />;
};

export const DialogTrigger = ({...props}: React.ComponentProps<typeof DialogPrimitive.Trigger>) => {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
};

export const DialogPortal = ({...props}: React.ComponentProps<typeof DialogPrimitive.Portal>) => {
    return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
};

export const DialogClose = ({...props}: React.ComponentProps<typeof DialogPrimitive.Close>) => {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
};

export const DialogOverlay = ({className, ...props}: React.ComponentProps<typeof DialogPrimitive.Overlay>) => {
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn(
                "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs",
                className
            )}
            {...props}
        />
    );
};

export const DialogContent = ({
    className,
    children,
    showCloseButton = true,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
}) => {
    const intl = useIntl();
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                data-slot="dialog-content"
                className={cn(
                    "bg-popover text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl p-4 text-sm ring-1 duration-100 outline-none sm:max-w-sm",
                    className
                )}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <DialogPrimitive.Close data-slot="dialog-close" asChild>
                        <Button variant="ghost" className="absolute top-2 right-2" size="icon-sm">
                            <XIcon />
                            <span className="sr-only">{intl.formatMessage(messages.common.close)}</span>
                        </Button>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </DialogPortal>
    );
};

export const DialogHeader = ({className, ...props}: React.ComponentProps<"div">) => {
    return <div data-slot="dialog-header" className={cn("flex flex-col gap-2", className)} {...props} />;
};

export const DialogFooter = ({
    className,
    showCloseButton = false,
    children,
    ...props
}: React.ComponentProps<"div"> & {
    showCloseButton?: boolean;
}) => {
    const intl = useIntl();
    return (
        <div data-slot="dialog-footer" className={cn("bg-muted/50 -mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t p-4 sm:flex-row sm:justify-end", className)} {...props}>
            {children}
            {showCloseButton && (
                <DialogPrimitive.Close asChild>
                    <Button variant="outline">{intl.formatMessage(messages.common.close)}</Button>
                </DialogPrimitive.Close>
            )}
        </div>
    );
};

export const DialogTitle = ({className, ...props}: React.ComponentProps<typeof DialogPrimitive.Title>) => {
    return <DialogPrimitive.Title data-slot="dialog-title" className={cn("font-heading text-base leading-none font-medium", className)} {...props} />;
};

export const DialogDescription = ({className, ...props}: React.ComponentProps<typeof DialogPrimitive.Description>) => {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn("text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3", className)}
            {...props}
        />
    );
};
