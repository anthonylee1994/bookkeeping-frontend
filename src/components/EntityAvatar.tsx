import {Center} from "@chakra-ui/react";
import {Icon as IconifyIcon} from "@iconify/react";
import {isLightColor} from "@/lib/colors";
import type {LucideIcon} from "lucide-react";

export type EntityAvatarSize = "xs" | "sm" | "md";

type EntityAvatarProps = {
    icon: string | null;
    color: string | null;
    /** 未設定自訂圖示時的替代圖示。 */
    fallbackIcon: LucideIcon;
    size?: EntityAvatarSize;
};

const SIZES: Record<EntityAvatarSize, {box: string; icon: number; rounded: string}> = {
    xs: {box: "5", icon: 12, rounded: "md"},
    sm: {box: "8", icon: 16, rounded: "lg"},
    md: {box: "10", icon: 20, rounded: "xl"},
};

/** 色塊上文字／圖示的對比色；非 hex（例如 semantic token `transfer`）一律當深色底。 */
function contentTone(color: string | null): string {
    if (color === null) return "fg.muted";
    if (!color.startsWith("#")) return "white";
    return isLightColor(color) ? "gray.800" : "white";
}

/** 帳戶／分類的頭像：帶顏色的圓角方塊加圖示，未設定時退回預設圖示。 */
export const EntityAvatar = ({icon, color, fallbackIcon: FallbackIcon, size = "sm"}: EntityAvatarProps) => {
    const {box, icon: iconSize, rounded} = SIZES[size];

    return (
        <Center boxSize={box} rounded={rounded} bg={color ?? "bg.subtle"} color={contentTone(color)} flexShrink={0} aria-hidden="true">
            {icon === null ? <FallbackIcon size={iconSize} /> : <IconifyIcon icon={icon} width={iconSize} height={iconSize} />}
        </Center>
    );
};
