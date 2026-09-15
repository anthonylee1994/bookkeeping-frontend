import react from "@vitejs/plugin-react";
import {fileURLToPath, URL} from "node:url";
import {VitePWA} from "vite-plugin-pwa";
import {defineConfig} from "vitest/config";

const IS_NODE_MODULE = /[\\/]node_modules[\\/]/;
/** 圖表庫（recharts 同佢的 d3 依賴），只由 lazy 的圖表 component 使用。 */
const IS_CHART_LIB = /[\\/](recharts|d3-[^\\/]+|victory-[^\\/]+|decimal\.js-light|internmap|fast-equals)[\\/]/;

// https://vite.dev/config/
export default defineConfig(() => {
    return {
        resolve: {
            alias: {
                "@": fileURLToPath(new URL("./src", import.meta.url)),
            },
        },
        plugins: [
            react(),
            VitePWA({
                registerType: "autoUpdate",
                devOptions: {
                    enabled: false,
                },
                manifest: {
                    name: "簡單記帳",
                    short_name: "記帳",
                    description: "簡單清晰的本地記帳工具",
                    lang: "zh-Hant-HK",
                    start_url: "/",
                    display: "standalone",
                    background_color: "#fafafa",
                    theme_color: "#047857",
                    icons: [
                        {
                            src: "/favicon.svg",
                            sizes: "any",
                            type: "image/svg+xml",
                            purpose: "any",
                        },
                    ],
                },
            }),
        ],
        build: {
            rolldownOptions: {
                output: {
                    /**
                     * 拆開更新頻率唔同的第三方程式庫，令 app 程式碼改動唔會令成個 vendor bundle 失效。
                     * 次序即優先次序：先夾到的 group 贏，所以 `vendor` 要放最後做兜底。
                     */
                    advancedChunks: {
                        groups: [
                            {name: "react", test: /[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/},
                            {name: "chakra", test: /[\\/]node_modules[\\/](@chakra-ui|@emotion|@ark-ui|@zag-js|@floating-ui)[\\/]/},
                            {name: "intl", test: /[\\/]node_modules[\\/](react-intl|@formatjs)[\\/]/},
                            /**
                             * 兜底 group，但要排除圖表庫。
                             * recharts／d3 只有 lazy 的 CategorySpendingChart 用；一旦畀 group 接管，
                             * 個 chunk 就會升級成 entry 的 static dependency，首屏平白多載 300 kB。
                             * 唔 group 佢，就會跟返原本的 async chunk 行為。
                             *
                             * 用 function 而唔用 regex：pnpm 的 id 有兩層 `node_modules/`
                             * （`node_modules/.pnpm/recharts@x/node_modules/recharts/…`），
                             * 負向前瞻會撞正第一層的 `.pnpm` 而失效。
                             */
                            {
                                name: "vendor",
                                test: id => IS_NODE_MODULE.test(id) && !IS_CHART_LIB.test(id),
                            },
                        ],
                    },
                },
            },
        },
        test: {
            environment: "jsdom",
            globals: true,
            setupFiles: ["./src/test/setup.ts"],
            css: false,
            pool: "vmThreads",
        },
    };
});
