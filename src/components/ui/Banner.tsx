import React from "react";
import {cva} from "class-variance-authority";
import {cn} from "@/lib/utils";
import type {VariantProps} from "class-variance-authority";

export const bannerVariants = cva("flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-sm", {
    variants: {
        variant: {
            info: "border-transfer/30 bg-transfer/10 text-foreground",
            success: "border-income/30 bg-income/10 text-foreground",
            warning: "border-refund/40 bg-refund/10 text-foreground",
            error: "border-expense/40 bg-expense/10 text-foreground",
        },
    },
    defaultVariants: {
        variant: "info",
    },
});

type BannerProps = React.ComponentProps<"div"> &
    VariantProps<typeof bannerVariants> & {
        icon?: React.ReactNode;
        action?: React.ReactNode;
    };

/** 低干擾提示條；錯誤用 `role="alert"`，其餘用 `role="status"`。 */
export const Banner = ({variant = "info", icon, action, className, children, ...props}: BannerProps) => {
    return (
        <div role={variant === "error" ? "alert" : "status"} className={cn(bannerVariants({variant}), className)} {...props}>
            {icon === undefined ? null : <span className="mt-0.5 shrink-0 [&_svg]:size-4">{icon}</span>}
            <div className="min-w-0 flex-1">{children}</div>
            {action === undefined ? null : <div className="shrink-0">{action}</div>}
        </div>
    );
};
