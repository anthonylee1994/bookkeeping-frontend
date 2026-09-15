import React from "react";
import {cn} from "cn";
import {useIntl} from "react-intl";

import {Button} from "@/components/ui/Button";
import {messages} from "@/lib/i18n";
import {ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon} from "lucide-react";

export const Pagination = ({className, ...props}: React.ComponentProps<"nav">) => {
    const intl = useIntl();
    return <nav role="navigation" aria-label={intl.formatMessage(messages.pagination.label)} data-slot="pagination" className={cn("mx-auto flex w-full justify-center", className)} {...props} />;
};

export const PaginationContent = ({className, ...props}: React.ComponentProps<"ul">) => {
    return <ul data-slot="pagination-content" className={cn("flex items-center gap-0.5", className)} {...props} />;
};

export const PaginationItem = ({...props}: React.ComponentProps<"li">) => {
    return <li data-slot="pagination-item" {...props} />;
};

type PaginationLinkProps = {
    isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
    React.ComponentProps<"a">;

export const PaginationLink = ({className, isActive, size = "icon", ...props}: PaginationLinkProps) => {
    return (
        <Button asChild variant={isActive ? "outline" : "ghost"} size={size} className={cn(className)}>
            <a aria-current={isActive ? "page" : undefined} data-slot="pagination-link" data-active={isActive} {...props} />
        </Button>
    );
};

export const PaginationPrevious = ({className, text, ...props}: React.ComponentProps<typeof PaginationLink> & {text?: string}) => {
    const intl = useIntl();
    return (
        <PaginationLink aria-label={intl.formatMessage(messages.pagination.goToPrevious)} size="default" className={cn("pl-1.5!", className)} {...props}>
            <ChevronLeftIcon data-icon="inline-start" />
            <span className="hidden sm:block">{text ?? intl.formatMessage(messages.pagination.previous)}</span>
        </PaginationLink>
    );
};

export const PaginationNext = ({className, text, ...props}: React.ComponentProps<typeof PaginationLink> & {text?: string}) => {
    const intl = useIntl();
    return (
        <PaginationLink aria-label={intl.formatMessage(messages.pagination.goToNext)} size="default" className={cn("pr-1.5!", className)} {...props}>
            <span className="hidden sm:block">{text ?? intl.formatMessage(messages.pagination.next)}</span>
            <ChevronRightIcon data-icon="inline-end" />
        </PaginationLink>
    );
};

export const PaginationEllipsis = ({className, ...props}: React.ComponentProps<"span">) => {
    const intl = useIntl();
    return (
        <span aria-hidden data-slot="pagination-ellipsis" className={cn("flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4", className)} {...props}>
            <MoreHorizontalIcon />
            <span className="sr-only">{intl.formatMessage(messages.pagination.morePages)}</span>
        </span>
    );
};
