import React from "react";
import {cn} from "cn";

export const Skeleton = ({className, ...props}: React.ComponentProps<"div">) => {
    return <div data-slot="skeleton" className={cn("bg-muted animate-pulse rounded-md", className)} {...props} />;
};
