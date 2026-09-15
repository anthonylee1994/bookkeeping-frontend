import {Button, HStack, Icon} from "@chakra-ui/react";
import {CheckIcon} from "lucide-react";
import {FLAT_UI_COLORS} from "@/lib/colors";

function isLightColor(hex: string): boolean {
    const value = hex.replace("#", "");
    const red = parseInt(value.slice(0, 2), 16);
    const green = parseInt(value.slice(2, 4), 16);
    const blue = parseInt(value.slice(4, 6), 16);
    return (0.299 * red + 0.587 * green + 0.114 * blue) / 255 > 0.6;
}

type ColorPickerProps = {
    value: string;
    onChange: (color: string) => void;
};

/**
 * 共用顏色選擇器。淺色色塊加幼邊避免同背景融為一體；
 * 選中狀態以 tick 表示，深淺色自動選用對比色。
 */
export const ColorPicker = ({value, onChange}: ColorPickerProps) => {
    const swatches = value !== "" && !FLAT_UI_COLORS.includes(value) ? [...FLAT_UI_COLORS, value] : FLAT_UI_COLORS;
    return (
        <HStack gap="2" wrap="wrap">
            {swatches.map(color => {
                const selected = value === color;
                const light = isLightColor(color);
                return (
                    <Button
                        key={color}
                        type="button"
                        variant="plain"
                        w="10"
                        h="10"
                        p="0"
                        minW="auto"
                        rounded="lg"
                        bg={color}
                        borderWidth="1px"
                        borderColor={light ? "border" : "transparent"}
                        aria-label={color}
                        aria-pressed={selected}
                        onClick={() => onChange(color)}
                        _hover={{opacity: 0.85}}
                    >
                        {selected ? (
                            <Icon size="sm" color={light ? "fg" : "white"} aria-hidden>
                                <CheckIcon />
                            </Icon>
                        ) : null}
                    </Button>
                );
            })}
        </HStack>
    );
};
