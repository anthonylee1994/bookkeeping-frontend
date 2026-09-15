import React from "react";
import {Box, Flex, HStack, Heading, Text} from "@chakra-ui/react";

type PageHeaderProps = {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    /** Mobile 時 actions 撐滿一行（例如 dashboard 的月份導覽）。 */
    actionsFullWidth?: boolean;
};

/**
 * 每個 page 頂部的標題區。Mobile 標題由 app bar 負責，所以此處只留 screen reader 用的 h1；
 * desktop 沒有 app bar 標題，便顯示大標題。
 */
export const PageHeader = ({title, description, actions, actionsFullWidth = false}: PageHeaderProps) => {
    return (
        <Flex as="header" wrap="wrap" align="flex-start" justify="space-between" gap="3" mb="4">
            <Box minW="0">
                <Heading as="h1" size="2xl" letterSpacing="tight" srOnly={{base: true, md: false}}>
                    {title}
                </Heading>
                {description === undefined ? null : (
                    <Text mt="1" fontSize="sm" color="fg.muted">
                        {description}
                    </Text>
                )}
            </Box>
            {actions === undefined ? null : (
                <HStack gap="2" align="center" w={actionsFullWidth ? {base: "full", md: "auto"} : undefined}>
                    {actions}
                </HStack>
            )}
        </Flex>
    );
};
