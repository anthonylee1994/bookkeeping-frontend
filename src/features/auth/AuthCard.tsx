import React from "react";
import {Card, Text} from "@chakra-ui/react";

type AuthCardProps = {
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
};

/** 登入／註冊共用卡片外殼。 */
export const AuthCard = ({title, description, children, footer}: AuthCardProps) => {
    return (
        <Card.Root rounded="2xl" shadow="md" borderColor="border">
            <Card.Header pb="4">
                <Card.Title fontSize="lg" letterSpacing="tight">
                    {title}
                </Card.Title>
                {description === undefined ? null : <Card.Description>{description}</Card.Description>}
            </Card.Header>
            <Card.Body gap="4" pt="0">
                {children}
                {footer === undefined ? null : (
                    <Text fontSize="sm" color="fg.muted" textAlign="center">
                        {footer}
                    </Text>
                )}
            </Card.Body>
        </Card.Root>
    );
};
