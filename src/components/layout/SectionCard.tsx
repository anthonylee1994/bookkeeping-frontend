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
            {/* Card.Header 只有 padding-top，body 又 pt=0，所以要自己補 padding-bottom，
                否則標題／描述／action 會癡住下面內容。 */}
            <Card.Header gap="1" px={{base: "4", md: "6"}} pt={{base: "4", md: "6"}} pb={{base: "3", md: "4"}}>
                {/* action button（`size="sm"`，高 2.25rem）比純標題高；補 minH 令有／冇 action 的卡頭高度一致。 */}
                <Flex justify="space-between" align="flex-start" gap="3" minH="9">
                    <Box minW="0">
                        <Card.Title fontSize="md">{title}</Card.Title>
                        {description === undefined ? null : <Card.Description mt="0.5">{description}</Card.Description>}
                    </Box>
                    {action === undefined ? null : <Box flexShrink="0">{action}</Box>}
                </Flex>
            </Card.Header>
            <Card.Body pt="0" px={{base: "4", md: "6"}} pb={{base: "4", md: "6"}} gap="3">
                {children}
            </Card.Body>
        </Card.Root>
    );
};
