import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves from /relay/ unless a custom domain is configured.
  // Change to '/' if you add a custom domain in the Pages settings.
  base: process.env.GITHUB_PAGES === 'true' ? '/relay/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
