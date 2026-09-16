import {Center} from "@chakra-ui/react";
import {ArrowDownLeftIcon, ArrowLeftRightIcon, ArrowUpRightIcon} from "lucide-react";
import type {TransactionKind} from "@/data/types";

type TransactionKindIconSize = "sm" | "md";

type TransactionKindIconProps = {
    kind: TransactionKind;
    /** 圖示顏色；行用 amount 一樣的 tone（income／expense／transfer）。 */
    color: string;
    size?: TransactionKindIconSize;
};

const SIZES: Record<TransactionKindIconSize, {box: string; icon: number}> = {
    sm: {box: "8", icon: 16},
    md: {box: "10", icon: 20},
};

/** 收入 ↓／支出 ↑／轉帳 ⇄ 的方形小 icon，列表左邊一眼分清交易種類。 */
export const TransactionKindIcon = ({kind, color, size = "sm"}: TransactionKindIconProps) => {
    const {box, icon} = SIZES[size];
    const Icon = kind === "income" ? ArrowDownLeftIcon : kind === "expense" ? ArrowUpRightIcon : ArrowLeftRightIcon;

    return (
        <Center boxSize={box} rounded="lg" bg="bg.subtle" color={color} flexShrink="0" aria-hidden="true">
            <Icon size={icon} />
        </Center>
    );
};
