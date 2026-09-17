import {Grid} from "@chakra-ui/react";
import type {ComponentProps} from "react";

/**
 * 統一所有 drawer 底部動作列：按鈕自動平分闊度並填滿整行
 * （一粒 = full width，兩粒 = 各佔一半，如此類推）。
 */
export const DrawerActions = ({children, ...props}: ComponentProps<typeof Grid>) => {
    return (
        <Grid w="full" gap="3" gridAutoFlow="column" gridAutoColumns="1fr" {...props}>
            {children}
        </Grid>
    );
};
