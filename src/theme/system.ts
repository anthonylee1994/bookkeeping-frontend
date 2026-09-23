import {createSystem, defaultConfig, defineConfig} from "@chakra-ui/react";

const FONT_STACK = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans HK", "PingFang HK", "Microsoft JhengHei", sans-serif';

/**
 * 專案 design system。刻意收緊三樣事項，使 app 看起來更精緻：
 * 1. 字體層次（heading 用負 letter-spacing、明確 size scale）
 * 2. 圓角（control 小、card 大，並非一刀切）
 * 3. 陰影（多層低透明度，不用預設那種硬陰影）
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
                    /** 柔和灰綠，不屬於 emerald ramp（飽和度低很多），專門作為 navigation selected 底色。 */
                    sage: {value: "#d4e8de"},
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
            radii: {
                /**
                 * 所有控件（Button／Input／NativeSelect／ButtonGroup）都行 `l2`，
                 * 所以圓角只需要在此定義一次，不要在 component 逐個 `rounded=` 覆蓋。
                 */
                l2: {value: "{radii.lg}"},
            },
            colors: {
                bg: {
                    DEFAULT: {value: {_light: "{colors.gray.50}", _dark: "{colors.gray.950}"}},
                    subtle: {value: {_light: "{colors.gray.100}", _dark: "{colors.gray.900}"}},
                    panel: {value: {_light: "white", _dark: "{colors.gray.900}"}},
                },
                brand: {
                    solid: {value: {base: "{colors.brand.700}", _dark: "{colors.brand.500}"}},
                    contrast: {value: {base: "white", _dark: "{colors.brand.950}"}},
                    fg: {value: {base: "{colors.brand.700}", _dark: "{colors.brand.300}"}},
                    muted: {value: {base: "{colors.brand.100}", _dark: "{colors.brand.900}"}},
                    subtle: {value: {base: "{colors.brand.50}", _dark: "{colors.brand.950}"}},
                    emphasized: {value: {base: "{colors.brand.800}", _dark: "{colors.brand.400}"}},
                    focusRing: {value: {base: "{colors.brand.500}", _dark: "{colors.brand.400}"}},
                    /** Navigation selected state；sidebar 與 mobile tab bar 共用，不要各自寫死。 */
                    active: {value: {base: "{colors.brand.sage}", _dark: "{colors.brand.900}"}},
                    activeFg: {value: {base: "{colors.brand.800}", _dark: "{colors.brand.200}"}},
                },
                /** 金額正負色。Chakra 預設 palette 沒有 emerald／rose／amber，引用會解析不到、變回前景色。 */
                income: {value: {base: "{colors.green.600}", _dark: "{colors.green.400}"}},
                expense: {value: {base: "{colors.red.600}", _dark: "{colors.red.400}"}},
                transfer: {value: {base: "{colors.blue.600}", _dark: "{colors.blue.400}"}},
                /** AI 生成內容（報表頁「AI 收支概況」）專用淡藍底，同一般白色 card 區分。 */
                ai: {
                    bg: {value: {base: "{colors.blue.50}", _dark: "{colors.blue.900}"}},
                    border: {value: {base: "{colors.blue.200}", _dark: "{colors.blue.800}"}},
                    fg: {value: {base: "{colors.blue.500}", _dark: "{colors.blue.300}"}},
                },
            },
        },
        recipes: {
            heading: {
                base: {
                    letterSpacing: "tight",
                    fontWeight: "semibold",
                },
            },
            /**
             * 低調 button（ghost／outline／subtle）hover 統一用 brand.active 柔和灰綠。
             * Solid button 不改：實色深綠 hover 變淺綠會很突兀，照用預設的加深。
             */
            button: {
                variants: {
                    variant: {
                        ghost: {
                            _hover: {bg: "brand.active", color: "brand.activeFg"},
                        },
                        outline: {
                            /* 實底而非透明，如此在漸變背景上也能看清；border 跟文字色。 */
                            bg: "bg.panel",
                            borderColor: "colorPalette.fg",
                            _hover: {bg: "brand.active", color: "brand.activeFg", borderColor: "brand.activeFg"},
                        },
                        subtle: {
                            _hover: {bg: "brand.active", color: "brand.activeFg"},
                        },
                    },
                },
            },
        },
        /**
         * Table 係 slot recipe，`line` variant 預設將 row 底色設成 `bg`；但本 app 所有 table
         * 都放喺白色 card 內，頁面 `bg` 變灰白之後 row 就跟住變灰。改回 panel（白）令表身保持白色。
         */
        slotRecipes: {
            table: {
                slots: ["root", "header", "body", "row", "columnHeader", "cell", "footer", "caption"],
                variants: {
                    variant: {
                        line: {
                            row: {bg: "bg.panel"},
                        },
                    },
                },
            },
        },
    },
});

export const system = createSystem(defaultConfig, config);
