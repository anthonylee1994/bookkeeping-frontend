import React from "react";
import {Box, Card, Flex} from "@chakra-ui/react";

type DashboardSectionProps = {
    title: string;
    description?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
};

/** Dashboard 各區共用的卡片外殼：標題 + 可選動作 + 內容。 */
export const DashboardSection = ({title, description, action, children}: DashboardSectionProps) => {
    return (
        <Card.Root as="section" rounded="xl" borderColor="border" shadow="xs">
            <Card.Header gap="1">
                <Flex justify="space-between" align="flex-start" gap="3">
                    <Box minW="0">
                        <Card.Title fontSize="md">{title}</Card.Title>
                        {description === undefined ? null : <Card.Description mt="0.5">{description}</Card.Description>}
                    </Box>
                    {action === undefined ? null : action}
                </Flex>
            </Card.Header>
            <Card.Body pt="0" gap="3">
                {children}
            </Card.Body>
        </Card.Root>
    );
};
