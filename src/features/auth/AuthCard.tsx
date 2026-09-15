import React from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/Card";

type AuthCardProps = {
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
};

/** 登入／註冊共用卡片外殼。 */
export const AuthCard = ({title, description, children, footer}: AuthCardProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description === undefined ? null : <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {children}
                {footer === undefined ? null : <div className="text-muted-foreground text-center text-sm">{footer}</div>}
            </CardContent>
        </Card>
    );
};
