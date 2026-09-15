import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {fileURLToPath, URL} from "node:url";
import {loadEnv} from "vite";
import type {Plugin} from "vite";
import {VitePWA} from "vite-plugin-pwa";
import {defineConfig} from "vitest/config";

/** 將 `VITE_API_URL` 嘅 origin 加入 CSP `connect-src`，容許 dev／production 打 API。 */
function contentSecurityPolicy(apiUrl: string | undefined): Plugin {
    let apiOrigin = "";
    if (apiUrl !== undefined && apiUrl !== "") {
        try {
            apiOrigin = new URL(apiUrl).origin;
        } catch {
            apiOrigin = "";
        }
    }

    return {
        name: "app-csp",
        transformIndexHtml(html) {
            const connectSrc = ["'self'", "ws:", "wss:", apiOrigin].filter(value => value !== "").join(" ");
            return html.replace("connect-src 'self' ws: wss:;", `connect-src ${connectSrc};`);
        },
    };
}

// https://vite.dev/config/
export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), "");

    return {
        resolve: {
            alias: {
                "@": fileURLToPath(new URL("./src", import.meta.url)),
            },
        },
        plugins: [
            react(),
            tailwindcss(),
            contentSecurityPolicy(env.VITE_API_URL),
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
        test: {
            environment: "jsdom",
            globals: true,
            setupFiles: ["./src/test/setup.ts"],
            css: false,
            pool: "vmThreads",
        },
    };
});
