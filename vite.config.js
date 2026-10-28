import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [
    svelte({
      preprocess: vitePreprocess()
    })
  ],
  resolve: {
    alias: {
      "@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
      "@data": fileURLToPath(new URL("./src/data", import.meta.url)),
      "@types": fileURLToPath(new URL("./src/types", import.meta.url))
    }
  },
  server: {
    open: true
  }
});
