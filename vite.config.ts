import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {defineConfig} from "vite";
import {VitePWA} from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
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
});
