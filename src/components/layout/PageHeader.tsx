import React from "react";
import {cn} from "@/lib/utils";

type PageHeaderProps = {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
};

/** 每個 page 頂部嘅標題區。 */
export const PageHeader = ({title, description, actions, className}: PageHeaderProps) => {
    return (
        <header className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
            <div className="min-w-0">
                <h1 className="text-foreground text-xl font-semibold">{title}</h1>
                {description === undefined ? null : <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
            </div>
            {actions === undefined ? null : <div className="flex items-center gap-2">{actions}</div>}
        </header>
    );
};
