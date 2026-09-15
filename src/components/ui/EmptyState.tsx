import React from "react";
import {cn} from "@/lib/utils";

type EmptyStateProps = React.ComponentProps<"div"> & {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
};

/** 空狀態：分「完全冇資料」同「filter 無結果」由 caller 決定文案。 */
export const EmptyState = ({icon, title, description, action, className, ...props}: EmptyStateProps) => {
    return (
        <div data-slot="empty-state" className={cn("flex flex-col items-center justify-center gap-2 px-6 py-10 text-center", className)} {...props}>
            {icon === undefined ? null : <div className="text-muted-foreground [&_svg]:size-8">{icon}</div>}
            <p className="text-foreground text-base font-medium">{title}</p>
            {description === undefined ? null : <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
            {action === undefined ? null : <div className="mt-2">{action}</div>}
        </div>
    );
};
