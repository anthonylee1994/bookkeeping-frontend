import React from "react";
import {Box, Card, Flex} from "@chakra-ui/react";

type SectionCardProps = {
    title: string;
    description?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
};

/** 各 feature 頁面共用的卡片外殼：標題 + 可選動作 + 內容。 */
export const SectionCard = ({title, description, action, children}: SectionCardProps) => {
    return (
        <Card.Root as="section" rounded="xl" borderColor="border" shadow="xs">
            <Card.Header gap="1" px={{base: "4", md: "6"}} pt={{base: "4", md: "6"}}>
                <Flex justify="space-between" align="flex-start" gap="3">
                    <Box minW="0">
                        <Card.Title fontSize="md">{title}</Card.Title>
                        {description === undefined ? null : <Card.Description mt="0.5">{description}</Card.Description>}
                    </Box>
                    {/* Header 本身冇 padding-bottom，而 action 通常高過標題，所以要自己留位，免得癡住內容。 */}
                    {action === undefined ? null : (
                        <Box flexShrink="0" mb="2">
                            {action}
                        </Box>
                    )}
                </Flex>
            </Card.Header>
            <Card.Body pt="0" px={{base: "4", md: "6"}} pb={{base: "4", md: "6"}} gap="3">
                {children}
            </Card.Body>
        </Card.Root>
    );
};
