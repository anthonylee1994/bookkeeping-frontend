import {createSystem, defaultConfig, defineConfig} from "@chakra-ui/react";

const FONT_STACK = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans HK", "PingFang HK", "Microsoft JhengHei", sans-serif';

/**
 * 專案 design system。刻意收緊三樣嘢令個 app 睇落精緻啲：
 * 1. 字體層次（heading 用負 letter-spacing、明確 size scale）
 * 2. 圓角（control 細、card 大，唔係一刀切）
 * 3. 陰影（多層低透明度，唔用預設嗰種硬陰影）
 */
const config = defineConfig({
    globalCss: {
        html: {
            minWidth: "320px",
            colorPalette: "brand",
        },
        body: {
            bg: "bg",
            color: "fg",
            fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
            textRendering: "optimizeLegibility",
            overscrollBehaviorY: "none",
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
        },
        "nav a, header h2": {
            userSelect: "none",
        },
    },
    theme: {
        tokens: {
            fonts: {
                heading: {value: FONT_STACK},
                body: {value: FONT_STACK},
            },
            fontSizes: {
                "2xs": {value: "0.6875rem"},
                xs: {value: "0.75rem"},
                sm: {value: "0.8125rem"},
                md: {value: "0.9375rem"},
                lg: {value: "1.0625rem"},
                xl: {value: "1.25rem"},
                "2xl": {value: "1.5rem"},
                "3xl": {value: "1.875rem"},
            },
            letterSpacings: {
                tighter: {value: "-0.03em"},
                tight: {value: "-0.015em"},
                normal: {value: "0"},
            },
            radii: {
                xs: {value: "4px"},
                sm: {value: "6px"},
                md: {value: "8px"},
                lg: {value: "10px"},
                xl: {value: "14px"},
                "2xl": {value: "18px"},
                "3xl": {value: "24px"},
            },
            colors: {
                brand: {
                    50: {value: "#ecfdf5"},
                    100: {value: "#d1fae5"},
                    200: {value: "#a7f3d0"},
                    300: {value: "#6ee7b7"},
                    400: {value: "#34d399"},
                    500: {value: "#10b981"},
                    600: {value: "#059669"},
                    700: {value: "#047857"},
                    800: {value: "#065f46"},
                    900: {value: "#064e3b"},
                    950: {value: "#022c22"},
                },
            },
            shadows: {
                xs: {value: "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.04)"},
                sm: {value: "0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)"},
                md: {value: "0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)"},
                lg: {value: "0 12px 28px -8px rgba(15, 23, 42, 0.14), 0 4px 10px -4px rgba(15, 23, 42, 0.06)"},
                xl: {value: "0 24px 48px -12px rgba(15, 23, 42, 0.18)"},
            },
        },
        semanticTokens: {
            colors: {
                bg: {
                    DEFAULT: {value: {base: "{colors.gray.50}", _dark: "{colors.gray.950}"}},
                    subtle: {value: {base: "{colors.gray.100}", _dark: "{colors.gray.900}"}},
                    panel: {value: {base: "white", _dark: "{colors.gray.900}"}},
                },
                brand: {
                    solid: {value: {base: "{colors.brand.700}", _dark: "{colors.brand.500}"}},
                    contrast: {value: {base: "white", _dark: "{colors.brand.950}"}},
                    fg: {value: {base: "{colors.brand.700}", _dark: "{colors.brand.300}"}},
                    muted: {value: {base: "{colors.brand.100}", _dark: "{colors.brand.900}"}},
                    subtle: {value: {base: "{colors.brand.50}", _dark: "{colors.brand.950}"}},
                    emphasized: {value: {base: "{colors.brand.800}", _dark: "{colors.brand.400}"}},
                    focusRing: {value: {base: "{colors.brand.500}", _dark: "{colors.brand.400}"}},
                },
                income: {value: {base: "{colors.emerald.600}", _dark: "{colors.emerald.400}"}},
                expense: {value: {base: "{colors.rose.600}", _dark: "{colors.rose.400}"}},
                transfer: {value: {base: "{colors.blue.600}", _dark: "{colors.blue.400}"}},
                refund: {value: {base: "{colors.amber.600}", _dark: "{colors.amber.400}"}},
            },
        },
        recipes: {
            heading: {
                base: {
                    letterSpacing: "tight",
                    fontWeight: "semibold",
                },
            },
        },
    },
});

export const system = createSystem(defaultConfig, config);
