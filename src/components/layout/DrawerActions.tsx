import React from "react";
import {Grid, Stack} from "@chakra-ui/react";
import type {ComponentProps} from "react";

function isDangerAction(child: React.ReactNode): boolean {
    if (!React.isValidElement(child)) return false;
    return (child.props as {colorPalette?: string}).colorPalette === "red";
}

/**
 * 統一 drawer 底部動作列：一／兩粒掣平分闊度；三粒掣時刪除（`colorPalette="red"`）獨立一行 full width。
 */
export const DrawerActions = ({children, ...props}: ComponentProps<typeof Stack>) => {
    const items = React.Children.toArray(children);
    const danger = items.length === 3 ? items.find(isDangerAction) : undefined;
    const primary = danger === undefined ? items : items.filter(item => item !== danger);

    return (
        <Stack w="full" gap="3" {...props}>
            <Grid w="full" gap="3" gridAutoFlow="column" gridAutoColumns="1fr">
                {primary}
            </Grid>
            {danger === undefined ? null : danger}
        </Stack>
    );
};
