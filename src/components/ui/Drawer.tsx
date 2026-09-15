import React from "react";
import {Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/Sheet";
import {cn} from "@/lib/utils";

export const Drawer = Sheet;
export const DrawerTrigger = SheetTrigger;
export const DrawerClose = SheetClose;
export const DrawerHeader = SheetHeader;
export const DrawerFooter = SheetFooter;
export const DrawerTitle = SheetTitle;
export const DrawerDescription = SheetDescription;

/** Desktop create／edit 用嘅右側 drawer。 */
export const DrawerContent = ({className, ...props}: React.ComponentProps<typeof SheetContent>) => {
    return <SheetContent side="right" className={cn("w-full sm:max-w-md", className)} {...props} />;
};
