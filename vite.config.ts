import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export const config = defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist/client",
  },
})

export default config
