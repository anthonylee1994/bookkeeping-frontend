import {Button, SimpleGrid} from "@chakra-ui/react";
import {Icon as IconifyIcon} from "@iconify/react";
import {BanIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {messages} from "@/lib/i18n";

/** 帳戶／分類可選的圖示（Material Design Icons，透過 Iconify 載入）。 */
const ICON_OPTIONS = [
    "mdi:wallet",
    "mdi:bank",
    "mdi:credit-card",
    "mdi:cash",
    "mdi:piggy-bank",
    "mdi:cellphone",
    "mdi:cart",
    "mdi:food",
    "mdi:coffee",
    "mdi:bus",
    "mdi:car",
    "mdi:home",
    "mdi:lightning-bolt",
    "mdi:wifi",
    "mdi:phone",
    "mdi:medical-bag",
    "mdi:school",
    "mdi:movie",
    "mdi:music",
    "mdi:dumbbell",
    "mdi:tshirt-crew",
    "mdi:gift",
    "mdi:tag",
];

type IconPickerProps = {
    value: string;
    onChange: (icon: string) => void;
};

/** 圖示選擇器：圖示格，選中者以品牌色高亮，另有「不使用圖示」選項。 */
export const IconPicker = ({value, onChange}: IconPickerProps) => {
    const intl = useIntl();

    return (
        <SimpleGrid columns={{base: 6, sm: 8}} gap="1" pe="1" w="full">
            <Button
                type="button"
                variant="ghost"
                p="0"
                w="full"
                h="9"
                minW="auto"
                rounded="lg"
                color={value === "" ? "brand.activeFg" : "fg.muted"}
                bg={value === "" ? "brand.active" : undefined}
                aria-label={intl.formatMessage(messages.common.noIcon)}
                aria-pressed={value === ""}
                onClick={() => onChange("")}
            >
                <BanIcon size={18} />
            </Button>
            {ICON_OPTIONS.map(name => (
                <Button
                    key={name}
                    type="button"
                    variant="ghost"
                    p="0"
                    w="full"
                    h="9"
                    minW="auto"
                    rounded="lg"
                    color={value === name ? "brand.activeFg" : "fg.muted"}
                    bg={value === name ? "brand.active" : undefined}
                    aria-label={name}
                    aria-pressed={value === name}
                    title={name}
                    onClick={() => onChange(name)}
                >
                    <IconifyIcon icon={name} width="18" height="18" />
                </Button>
            ))}
        </SimpleGrid>
    );
};
