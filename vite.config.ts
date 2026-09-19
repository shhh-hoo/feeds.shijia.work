import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "feeds.shijia.work",
        short_name: "Feeds",
        description: "A personal intelligence and cultural feed.",
        theme_color: "#f2f3f4",
        background_color: "#f2f3f4",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any"
          }
        ]
      },
      workbox: {
        navigateFallback: "/index.html"
      }
    })
  ]
});
