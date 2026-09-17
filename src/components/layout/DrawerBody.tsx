import {Drawer} from "@chakra-ui/react";
import type {ComponentProps} from "react";

/**
 * 統一所有 drawer／bottom sheet 的底部留白：mobile 預留 home indicator 空間，
 * desktop 用固定 padding。所有 drawer 一律用此 component，不要各自寫死 pb。
 */
export const DrawerBody = ({children, ...props}: ComponentProps<typeof Drawer.Body>) => {
    return (
        <Drawer.Body pb={{base: "calc(1rem + env(safe-area-inset-bottom))", md: "8"}} {...props}>
            {children}
        </Drawer.Body>
    );
};
