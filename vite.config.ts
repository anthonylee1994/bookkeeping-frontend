import react from "@vitejs/plugin-react";
import {fileURLToPath, URL} from "node:url";
import {VitePWA} from "vite-plugin-pwa";
import {defineConfig} from "vitest/config";

const IS_NODE_MODULE = /[\\/]node_modules[\\/]/;
/** 圖表庫（recharts 及其 d3 依賴），只由 lazy 的圖表 component 使用。 */
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
                /**
                 * `prompt`：新版本唔會自動 reload，由頁內 banner 提示用戶自行重新載入
                 * （避免 dirty form 被中斷）。
                 */
                registerType: "prompt",
                includeAssets: ["favicon.svg", "apple-touch-icon.png"],
                /** 由 app 內 `useAppUpdate` 自行註冊，方便控制「有新版本」提示。 */
                injectRegister: null,
                devOptions: {
                    // SW 只在 production build 啟用，避免 dev 時 cache 住 stale asset。
                    enabled: false,
                },
                manifest: {
                    name: "簡單記帳",
                    short_name: "記帳",
                    description: "簡單清晰的本地記帳工具",
                    lang: "zh-Hant-HK",
                    start_url: "/",
                    scope: "/",
                    display: "standalone",
                    background_color: "#fafafa",
                    theme_color: "#047857",
                    icons: [
                        {src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any"},
                        {src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any"},
                        {src: "/maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable"},
                    ],
                },
                workbox: {
                    // 只 precache 靜態 asset；domain data（API）一律唔入 Cache Storage。
                    globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2}"],
                    /**
                     * VitePWA 預設會加一條 cache-first 嘅 `NavigationRoute("index.html")`，
                     * 咁會 shadow 咗下面嘅 NetworkFirst。設 undefined 關掉，改由 NetworkFirst
                     * 自己處理 navigation，再喺 timeout／失敗時用 precacheFallback 回落去 shell。
                     */
                    navigateFallback: undefined,
                    cleanupOutdatedCaches: true,
                    runtimeCaching: [
                        {
                            /**
                             * Navigation：Network First + 3 秒 timeout；網絡慢或離線就回落去
                             * precache 咗嘅 app shell（index.html），所以 offline 都開得返，
                             * 可以讀本機 session／draft。API 冇任何 cache rule，唔會入 Cache Storage。
                             */
                            urlPattern: ({request}) => request.mode === "navigate",
                            handler: "NetworkFirst",
                            options: {
                                cacheName: "pages",
                                networkTimeoutSeconds: 3,
                                expiration: {maxEntries: 30},
                                precacheFallback: {fallbackURL: "/index.html"},
                            },
                        },
                    ],
                },
            }),
        ],
        build: {
            rolldownOptions: {
                output: {
                    /**
                     * 拆開更新頻率不同的第三方程式庫，令 app 程式碼改動不會令整個 vendor bundle 失效。
                     * 次序即優先次序：先夾到的 group 贏，所以 `vendor` 要放最後做兜底。
                     */
                    advancedChunks: {
                        groups: [
                            {name: "react", test: /[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/},
                            {name: "chakra", test: /[\\/]node_modules[\\/](@chakra-ui|@emotion|@ark-ui|@zag-js|@floating-ui)[\\/]/},
                            {name: "intl", test: /[\\/]node_modules[\\/](react-intl|@formatjs)[\\/]/},
                            /**
                             * 兜底 group，但要排除圖表庫。
                             * recharts／d3 只有 lazy 的 CategorySpendingChart 使用；一旦被 group 接管，
                             * 個 chunk 就會升級成 entry 的 static dependency，首屏平白多載 300 kB。
                             * 不 group 它，就會回復原本的 async chunk 行為。
                             *
                             * 用 function 而不用 regex：pnpm 的 id 有兩層 `node_modules/`
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
