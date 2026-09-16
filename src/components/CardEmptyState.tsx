import React from "react";
import {EmptyState} from "@chakra-ui/react";

type CardEmptyStateProps = {
    icon: React.ReactNode;
    message: string;
};

/** 卡片內無資料時的統一空狀態：大 icon + 置中說明，會撐滿可用高度。 */
export const CardEmptyState = ({icon, message}: CardEmptyStateProps) => {
    return (
        <EmptyState.Root size="sm" flex="1" display="flex" alignItems="center" justifyContent="center" minH={{base: "10rem", md: "12rem"}}>
            <EmptyState.Content>
                <EmptyState.Indicator fontSize="4xl">{icon}</EmptyState.Indicator>
                <EmptyState.Description>{message}</EmptyState.Description>
            </EmptyState.Content>
        </EmptyState.Root>
    );
};
