import React from "react";
import {Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/Sheet";
import {cn} from "@/lib/utils";

export const BottomSheet = Sheet;
export const BottomSheetTrigger = SheetTrigger;
export const BottomSheetClose = SheetClose;
export const BottomSheetHeader = SheetHeader;
export const BottomSheetFooter = SheetFooter;
export const BottomSheetTitle = SheetTitle;
export const BottomSheetDescription = SheetDescription;

/** Mobile filter／action 用嘅底部 sheet。 */
export const BottomSheetContent = ({className, ...props}: React.ComponentProps<typeof SheetContent>) => {
    return <SheetContent side="bottom" className={cn("max-h-[85vh] overflow-y-auto rounded-t-xl", className)} {...props} />;
};
