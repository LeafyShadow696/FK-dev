import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"

const BASE_PATH = process.env.BASE_PATH ?? "/"
const PORT = Number(process.env.PORT ?? 5173)

export default defineConfig({
  plugins: [react()],
  base: BASE_PATH,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: PORT,
  },
  preview: {
    host: "0.0.0.0",
    port: PORT,
  },
  build: {
    target: "es2020",
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/three") ||
            id.includes("node_modules/@react-three/fiber") ||
            id.includes("node_modules/@react-three/drei")
          ) {
            return "three"
          }

          if (id.includes("node_modules/framer-motion")) {
            return "motion"
          }
        },
      },
    },
  },
})
